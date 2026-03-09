-- ============================================================
-- Sprint 6A: Sistema de Páginas de Empresa (multi-empresa por usuario)
-- ============================================================
-- Fecha: 2026-03-09
-- Objetivo:
--   1. subscription_plans: max_company_profiles (int) — reemplaza booleano
--   2. business_profiles: romper constraint 1:1, nuevos campos
--   3. business_profile_members: tabla N:M preparada para multi-admin (V2)
--   4. users: profile_completion_pct
--   5. Trigger: límite de empresas por plan
--   6. RLS actualizado
-- ============================================================

-- ══════════════════════════════════════════════════════════════
-- 1. SUBSCRIPTION_PLANS — columna max_company_profiles
-- ══════════════════════════════════════════════════════════════

-- Agregar columna si no existe (reemplaza can_have_company_profile)
ALTER TABLE public.subscription_plans
  ADD COLUMN IF NOT EXISTS max_company_profiles integer DEFAULT 0;

COMMENT ON COLUMN public.subscription_plans.max_company_profiles IS
  '0=FREE (sin empresa), 1=PREMIUM, 2=Plan Empresas 2, 4=Plan Empresas 4';

-- Migrar datos desde el booleano existente
UPDATE public.subscription_plans
  SET max_company_profiles = 1
  WHERE can_have_company_profile = true
    AND max_company_profiles = 0;

-- Superadmin / sin restricción: valor alto
UPDATE public.subscription_plans
  SET max_company_profiles = 99
  WHERE name IN ('superadmin', 'admin', 'revendedor')
    AND max_company_profiles = 0;


-- ══════════════════════════════════════════════════════════════
-- 2. BUSINESS_PROFILES — romper 1:1 + nuevos campos
-- ══════════════════════════════════════════════════════════════

-- 2a. Eliminar la constraint UNIQUE(user_id) — rompe el 1:1
--     user_id pasa a ser "owner_id" conceptualmente.
--     Mantenemos el nombre "user_id" para backward compat con código existente.
ALTER TABLE public.business_profiles
  DROP CONSTRAINT IF EXISTS business_profiles_user_id_key;

-- 2b. Nuevos campos de contenido
ALTER TABLE public.business_profiles
  ADD COLUMN IF NOT EXISTS brands_worked    jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS gallery_images   jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS phone            varchar(30),
  ADD COLUMN IF NOT EXISTS email            varchar(150),
  ADD COLUMN IF NOT EXISTS address          text;

COMMENT ON COLUMN public.business_profiles.brands_worked IS
  'Array de marcas: [{ "name": "John Deere", "logo_url": null }, ...]';
COMMENT ON COLUMN public.business_profiles.gallery_images IS
  'Galería de fotos: [{ "url": "cloudinary_url", "caption": "" }, ...]';

-- 2c. Campos de privacidad y visibilidad
ALTER TABLE public.business_profiles
  ADD COLUMN IF NOT EXISTS owner_public       boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS show_on_ad_detail  boolean DEFAULT true;

COMMENT ON COLUMN public.business_profiles.owner_public IS
  'false=owner oculto en página pública (como Facebook). true=muestra nombre del owner (como LinkedIn)';
COMMENT ON COLUMN public.business_profiles.show_on_ad_detail IS
  'true=muestra "Ver Perfil de Empresa" en los avisos del owner. false=el owner oculta el vínculo.';

-- 2d. Campos de facturación del owner (individuo físico que paga)
ALTER TABLE public.business_profiles
  ADD COLUMN IF NOT EXISTS owner_dni      varchar(15),
  ADD COLUMN IF NOT EXISTS owner_cuil     varchar(15),
  ADD COLUMN IF NOT EXISTS business_cuit  varchar(15),
  ADD COLUMN IF NOT EXISTS invoice_type   varchar(5) DEFAULT 'C';
  -- invoice_type: solo 'C' por ahora. Rural24 no emite Factura A aún.

COMMENT ON COLUMN public.business_profiles.owner_dni  IS 'DNI del titular (individuo físico que paga)';
COMMENT ON COLUMN public.business_profiles.owner_cuil IS 'CUIL del titular';
COMMENT ON COLUMN public.business_profiles.business_cuit IS 'CUIT de la empresa (opcional)';
COMMENT ON COLUMN public.business_profiles.invoice_type IS 'Tipo de factura: C (única disponible hasta nuevo aviso)';

-- 2e. Verificación de empresa por admin
ALTER TABLE public.business_profiles
  ADD COLUMN IF NOT EXISTS verified_at  timestamptz,
  ADD COLUMN IF NOT EXISTS verified_by  uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- 2f. Índices nuevos
CREATE INDEX IF NOT EXISTS idx_business_profiles_user_id
  ON public.business_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_business_profiles_slug
  ON public.business_profiles(slug)
  WHERE is_active = true;


-- ══════════════════════════════════════════════════════════════
-- 3. BUSINESS_PROFILE_MEMBERS — tabla N:M
-- ══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.business_profile_members (
  id                  uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  business_profile_id uuid        NOT NULL
    REFERENCES public.business_profiles(id) ON DELETE CASCADE,
  user_id             uuid        NOT NULL
    REFERENCES auth.users(id) ON DELETE CASCADE,
  role                varchar(20) DEFAULT 'owner'
    CHECK (role IN ('owner', 'admin', 'editor')),
  joined_at           timestamptz DEFAULT now(),
  UNIQUE(business_profile_id, user_id)
);

COMMENT ON TABLE public.business_profile_members IS
  'Membresías N:M usuario-empresa. owner=creador, admin/editor=V2 multi-admin. Sirve para "mis empresas" de un usuario.';
COMMENT ON COLUMN public.business_profile_members.role IS
  'owner: control total (crea/elimina). admin: edita + publica (V2). editor: solo publica (V2).';

-- Backfill: todos los business_profiles existentes → owner
INSERT INTO public.business_profile_members (business_profile_id, user_id, role)
SELECT id, user_id, 'owner'
FROM public.business_profiles
ON CONFLICT DO NOTHING;

-- Índices
CREATE INDEX IF NOT EXISTS idx_bp_members_user_id
  ON public.business_profile_members(user_id);
CREATE INDEX IF NOT EXISTS idx_bp_members_profile_id
  ON public.business_profile_members(business_profile_id);

-- RLS business_profile_members
ALTER TABLE public.business_profile_members ENABLE ROW LEVEL SECURITY;

-- El usuario ve sus propias membresías
CREATE POLICY "bpm_user_select"
  ON public.business_profile_members FOR SELECT
  USING (user_id = auth.uid());

-- Solo el owner de la empresa puede insertar/eliminar miembros
CREATE POLICY "bpm_owner_manage"
  ON public.business_profile_members FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.business_profiles
      WHERE id = business_profile_id AND user_id = auth.uid()
    )
  );

-- Superadmin: todo
CREATE POLICY "bpm_superadmin_all"
  ON public.business_profile_members FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'superadmin'
    )
  );


-- ══════════════════════════════════════════════════════════════
-- 4. USERS — profile_completion_pct
-- ══════════════════════════════════════════════════════════════

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS profile_completion_pct integer DEFAULT 0;

COMMENT ON COLUMN public.users.profile_completion_pct IS
  'Porcentaje de perfil completado (0-100). email=30%, teléfono=30%, nombre=20%, provincia=10%, foto=10%. Recalculado en trigger.';

-- Función para calcular el porcentaje
CREATE OR REPLACE FUNCTION public.calc_profile_completion(u public.users)
RETURNS integer LANGUAGE plpgsql AS $$
DECLARE
  pct integer := 0;
BEGIN
  -- email verificado: 30%
  IF u.email_verified = true THEN pct := pct + 30; END IF;

  -- teléfono: mobile verificado O phone no vacío: 30%
  IF u.mobile IS NOT NULL AND u.mobile != '' THEN pct := pct + 30; END IF;

  -- nombre completo: 20%
  IF u.full_name IS NOT NULL AND length(trim(u.full_name)) > 2 THEN pct := pct + 20; END IF;

  -- provincia: 10%
  IF u.province IS NOT NULL AND u.province != '' THEN pct := pct + 10; END IF;

  -- foto de perfil: 10%
  IF u.avatar_url IS NOT NULL AND u.avatar_url != '' THEN pct := pct + 10; END IF;

  RETURN pct;
END;
$$;

-- Trigger que recalcula profile_completion_pct al actualizar users
CREATE OR REPLACE FUNCTION public.update_profile_completion()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.profile_completion_pct := public.calc_profile_completion(NEW);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_update_profile_completion ON public.users;
CREATE TRIGGER trg_update_profile_completion
  BEFORE INSERT OR UPDATE OF email_verified, mobile, full_name, province, avatar_url
  ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.update_profile_completion();

-- Backfill porcentaje en todos los usuarios existentes
UPDATE public.users u
  SET profile_completion_pct = public.calc_profile_completion(u);


-- ══════════════════════════════════════════════════════════════
-- 5. TRIGGER — límite de empresas por plan
-- ══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.check_max_companies_per_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_max_allowed   integer;
  v_current_count integer;
  v_user_role     text;
BEGIN
  -- Solo aplica al rol 'owner'
  IF NEW.role != 'owner' THEN RETURN NEW; END IF;

  -- Obtener rol del usuario
  SELECT role INTO v_user_role FROM public.users WHERE id = NEW.user_id;

  -- Superadmin: sin límite
  IF v_user_role = 'superadmin' THEN RETURN NEW; END IF;

  -- Obtener límite del plan
  SELECT COALESCE(sp.max_company_profiles, 0)
    INTO v_max_allowed
    FROM public.users u
    LEFT JOIN public.subscription_plans sp ON u.subscription_plan_id = sp.id
    WHERE u.id = NEW.user_id;

  -- Sin plan asignado = FREE = 0
  IF v_max_allowed IS NULL THEN v_max_allowed := 0; END IF;

  -- Contar empresas actuales donde es owner
  SELECT COUNT(*) INTO v_current_count
    FROM public.business_profile_members
    WHERE user_id = NEW.user_id AND role = 'owner';

  IF v_current_count >= v_max_allowed THEN
    RAISE EXCEPTION 'COMPANY_LIMIT_REACHED: Tu plan permite hasta % empresa(s). Contratá un plan superior para agregar más.', v_max_allowed
      USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_max_companies ON public.business_profile_members;
CREATE TRIGGER enforce_max_companies
  BEFORE INSERT ON public.business_profile_members
  FOR EACH ROW EXECUTE FUNCTION public.check_max_companies_per_user();


-- ══════════════════════════════════════════════════════════════
-- 6. RLS — business_profiles actualizado
-- ══════════════════════════════════════════════════════════════
-- La política existente "bp_owner_all" usa auth.uid() = user_id
-- Sigue válida para el owner. En V2 (multi-admin) se extiende a members.

-- Eliminar si existen para recrear limpias
DROP POLICY IF EXISTS "bp_owner_all"       ON public.business_profiles;
DROP POLICY IF EXISTS "bp_public_select"   ON public.business_profiles;
DROP POLICY IF EXISTS "bp_superadmin_all"  ON public.business_profiles;

-- Lectura pública: perfiles activos
CREATE POLICY "bp_public_select"
  ON public.business_profiles FOR SELECT
  USING (is_active = true);

-- Owner: control total (usa user_id para backward compat con código existente)
CREATE POLICY "bp_owner_all"
  ON public.business_profiles FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Superadmin: todo (incluyendo ver inactivos)
CREATE POLICY "bp_superadmin_all"
  ON public.business_profiles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'superadmin'
    )
  );


-- ══════════════════════════════════════════════════════════════
-- 7. RPC — get_my_companies (para el dashboard y el selector)
-- ══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.get_my_companies(p_user_id uuid DEFAULT NULL)
RETURNS TABLE (
  id                  uuid,
  slug                varchar,
  company_name        text,
  logo_url            text,
  cover_url           text,
  tagline             text,
  description         text,
  is_verified         boolean,
  is_active           boolean,
  profile_views       integer,
  show_on_ad_detail   boolean,
  owner_public        boolean,
  role                varchar,
  ads_count           bigint,
  province            text,
  city                text
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_user_id uuid;
BEGIN
  v_user_id := COALESCE(p_user_id, auth.uid());

  RETURN QUERY
    SELECT
      bp.id,
      bp.slug,
      bp.company_name,
      bp.logo_url,
      bp.cover_url,
      bp.tagline,
      bp.description,
      bp.is_verified,
      bp.is_active,
      bp.profile_views,
      bp.show_on_ad_detail,
      bp.owner_public,
      bpm.role,
      (
        SELECT COUNT(*) FROM public.ads
        WHERE business_profile_id = bp.id
          AND status = 'active'
      ) AS ads_count,
      bp.province,
      bp.city
    FROM public.business_profiles bp
    JOIN public.business_profile_members bpm
      ON bpm.business_profile_id = bp.id
      AND bpm.user_id = v_user_id
    ORDER BY bp.created_at DESC;
END;
$$;

COMMENT ON FUNCTION public.get_my_companies IS
  'Devuelve todas las empresas del usuario autenticado (o del user_id dado) con conteo de avisos activos.';


-- ══════════════════════════════════════════════════════════════
-- 8. RPC — get_company_public_page (para la página pública)
-- ══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.get_company_public_page(p_slug varchar)
RETURNS TABLE (
  id                uuid,
  slug              varchar,
  company_name      text,
  logo_url          text,
  cover_url         text,
  tagline           text,
  description       text,
  whatsapp          varchar,
  website           text,
  phone             varchar,
  email             varchar,
  address           text,
  social_networks   jsonb,
  brands_worked     jsonb,
  gallery_images    jsonb,
  province          text,
  city              text,
  is_verified       boolean,
  profile_views     integer,
  owner_public      boolean,
  owner_full_name   text,    -- solo poblado si owner_public = true
  category_name     text,
  ads_count         bigint,
  created_at        timestamptz
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Incrementar vistas
  UPDATE public.business_profiles
    SET profile_views = profile_views + 1
    WHERE slug = p_slug AND is_active = true;

  RETURN QUERY
    SELECT
      bp.id,
      bp.slug,
      bp.company_name,
      bp.logo_url,
      bp.cover_url,
      bp.tagline,
      bp.description,
      bp.whatsapp,
      bp.website,
      bp.phone,
      bp.email,
      bp.address,
      bp.social_networks,
      bp.brands_worked,
      bp.gallery_images,
      bp.province,
      bp.city,
      bp.is_verified,
      bp.profile_views,
      bp.owner_public,
      -- Solo expone el nombre del owner si owner_public = true
      CASE WHEN bp.owner_public THEN u.full_name ELSE NULL END AS owner_full_name,
      c.display_name AS category_name,
      (
        SELECT COUNT(*) FROM public.ads
        WHERE business_profile_id = bp.id
          AND status = 'active'
          AND approval_status = 'approved'
      ) AS ads_count,
      bp.created_at
    FROM public.business_profiles bp
    LEFT JOIN public.users u ON u.id = bp.user_id
    LEFT JOIN public.categories c ON c.id = bp.category_id
    WHERE bp.slug = p_slug
      AND bp.is_active = true;
END;
$$;

COMMENT ON FUNCTION public.get_company_public_page IS
  'Página pública de empresa: incrementa vistas, devuelve datos completos. owner_full_name solo si owner_public=true.';
