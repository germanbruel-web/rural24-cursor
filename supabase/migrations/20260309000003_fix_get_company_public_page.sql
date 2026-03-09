-- ============================================================
-- Fix: get_company_public_page — SET search_path + text param
-- ============================================================
-- SECURITY DEFINER sin SET search_path puede fallar en Supabase
-- (el search_path del llamante podría no incluir public).
-- También cambia varchar → text para compatibilidad PostgREST.
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_company_public_page(p_slug text)
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
  owner_full_name   text,
  category_name     text,
  ads_count         bigint,
  created_at        timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Incrementar vistas
  UPDATE public.business_profiles
    SET profile_views = profile_views + 1
    WHERE public.business_profiles.slug = p_slug
      AND public.business_profiles.is_active = true;

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

-- Re-grant post recreación (DROP+CREATE revoca grants anteriores)
GRANT EXECUTE ON FUNCTION public.get_company_public_page(text)
  TO anon, authenticated;

COMMENT ON FUNCTION public.get_company_public_page IS
  'Página pública de empresa: incrementa vistas, devuelve datos completos. owner_full_name solo si owner_public=true.';
