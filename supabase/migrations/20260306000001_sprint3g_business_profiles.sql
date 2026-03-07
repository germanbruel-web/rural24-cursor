-- ============================================================
-- Sprint 3G-B: business_profiles + ads.ad_type + category_types.page_type
-- ============================================================

-- 1. Agregar page_type a category_types
--    'particular' = Página Detalle estándar
--    'empresa'    = Página Empresa (business profile)
ALTER TABLE public.category_types
  ADD COLUMN IF NOT EXISTS page_type varchar(20) DEFAULT 'particular'
  CHECK (page_type IN ('particular', 'empresa'));

-- 2. Agregar ad_type a ads
--    'particular' = aviso de usuario individual
--    'company'    = aviso publicado desde cuenta empresa
ALTER TABLE public.ads
  ADD COLUMN IF NOT EXISTS ad_type varchar(20) DEFAULT 'particular'
  CHECK (ad_type IN ('particular', 'company'));

-- 3. Tabla business_profiles
--    Una por usuario Premium (relación 1:1 con auth.users)
CREATE TABLE IF NOT EXISTS public.business_profiles (
  id               uuid    DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id          uuid    NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  slug             varchar(120) NOT NULL UNIQUE,
  company_name     text    NOT NULL,
  logo_url         text,
  cover_url        text,
  tagline          text,
  description      text,
  whatsapp         varchar(20),
  website          text,
  social_networks  jsonb   DEFAULT '{}'::jsonb,
  category_id      uuid    REFERENCES public.categories(id) ON DELETE SET NULL,
  province         text,
  city             text,
  is_verified      boolean DEFAULT false,
  is_active        boolean DEFAULT true,
  profile_views    integer DEFAULT 0,
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);

-- 4. Vincular avisos empresa al perfil
ALTER TABLE public.ads
  ADD COLUMN IF NOT EXISTS business_profile_id uuid
  REFERENCES public.business_profiles(id) ON DELETE SET NULL;

-- 5. Índices
CREATE INDEX IF NOT EXISTS idx_business_profiles_category  ON public.business_profiles(category_id);
CREATE INDEX IF NOT EXISTS idx_business_profiles_province  ON public.business_profiles(province);
CREATE INDEX IF NOT EXISTS idx_business_profiles_is_active ON public.business_profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_ads_business_profile        ON public.ads(business_profile_id);
CREATE INDEX IF NOT EXISTS idx_category_types_page_type    ON public.category_types(page_type);

-- 6. RLS en business_profiles
ALTER TABLE public.business_profiles ENABLE ROW LEVEL SECURITY;

-- Propietario puede ver y editar su propio perfil
CREATE POLICY "bp_owner_all"
  ON public.business_profiles FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Visitantes pueden leer perfiles activos
CREATE POLICY "bp_public_select"
  ON public.business_profiles FOR SELECT
  USING (is_active = true);

-- Superadmin puede ver y modificar todos
CREATE POLICY "bp_superadmin_all"
  ON public.business_profiles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'superadmin'
    )
  );

-- 7. Trigger updated_at en business_profiles
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_business_profiles_updated_at ON public.business_profiles;
CREATE TRIGGER set_business_profiles_updated_at
  BEFORE UPDATE ON public.business_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
