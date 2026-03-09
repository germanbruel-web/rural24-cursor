-- ============================================================
-- Sprint 7A: get_company_public_page — agregar campos Social Proof
-- ============================================================
-- Extiende el RPC para devolver los campos nuevos de business_profiles
-- agregados en la migración 20260309000004_sprint7a_bp_social_proof.sql
-- ============================================================

DROP FUNCTION IF EXISTS public.get_company_public_page(text);

CREATE OR REPLACE FUNCTION public.get_company_public_page(p_slug text)
RETURNS TABLE (
  id                    uuid,
  slug                  varchar,
  company_name          text,
  logo_url              text,
  cover_url             text,
  tagline               text,
  description           text,
  whatsapp              varchar,
  website               text,
  phone                 varchar,
  email                 varchar,
  address               text,
  social_networks       jsonb,
  brands_worked         jsonb,
  gallery_images        jsonb,
  province              text,
  city                  text,
  is_verified           boolean,
  profile_views         integer,
  owner_public          boolean,
  owner_full_name       text,
  category_name         text,
  ads_count             bigint,
  created_at            timestamptz,
  -- Social Proof (Sprint 7A)
  anos_experiencia      integer,
  area_cobertura        varchar,
  superficie_maxima     integer,
  cultivos_json         jsonb,
  equipamiento_propio   boolean,
  aplica_precision      boolean,
  usa_drones            boolean,
  factura               boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Incrementar vistas (alias bp_upd para evitar ambigüedad con columna del RETURNS TABLE)
  UPDATE public.business_profiles AS bp_upd
    SET profile_views = bp_upd.profile_views + 1
    WHERE bp_upd.slug = p_slug
      AND bp_upd.is_active = true;

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
      CASE WHEN bp.owner_public THEN u.full_name::text ELSE NULL END AS owner_full_name,
      c.display_name::text AS category_name,
      (
        SELECT COUNT(*) FROM public.ads
        WHERE business_profile_id = bp.id
          AND status = 'active'
          AND approval_status = 'approved'
      ) AS ads_count,
      bp.created_at,
      -- Social Proof
      bp.anos_experiencia,
      bp.area_cobertura,
      bp.superficie_maxima,
      bp.cultivos_json,
      bp.equipamiento_propio,
      bp.aplica_precision,
      bp.usa_drones,
      bp.factura
    FROM public.business_profiles bp
    LEFT JOIN public.users u ON u.id = bp.user_id
    LEFT JOIN public.categories c ON c.id = bp.category_id
    WHERE bp.slug = p_slug
      AND bp.is_active = true;
END;
$$;

-- Re-grant post recreación
GRANT EXECUTE ON FUNCTION public.get_company_public_page(text)
  TO anon, authenticated;

COMMENT ON FUNCTION public.get_company_public_page IS
  'Página pública de empresa: incrementa vistas, devuelve datos completos + Social Proof (Sprint 7A).';
