-- ============================================================
-- Sprint Plans & Features — P1
-- Agrega columnas de features a subscription_plans + seed data
-- ============================================================

-- 1. UNIQUE constraint en slug (necesario para ON CONFLICT)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.subscription_plans'::regclass
      AND conname = 'subscription_plans_slug_key'
  ) THEN
    ALTER TABLE public.subscription_plans
      ADD CONSTRAINT subscription_plans_slug_key UNIQUE (slug);
  END IF;
END $$;

-- 2. Nuevas columnas de features (incluyendo max_company_profiles que puede faltar en PROD)
ALTER TABLE public.subscription_plans
  ADD COLUMN IF NOT EXISTS max_company_profiles integer       NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS can_show_whatsapp    boolean      NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_virtual_office   boolean      NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS extra_ad_price_ars   numeric(10,2) NOT NULL DEFAULT 2500;

-- 3. Seed plan FREE
INSERT INTO public.subscription_plans (
  name, display_name, slug, description,
  max_ads, max_company_profiles, can_have_company_profile,
  has_inbox, has_analytics, has_priority_support,
  has_public_profile, has_catalog,
  can_show_whatsapp, has_virtual_office,
  extra_ad_price_ars, price_monthly, price_yearly,
  badge_color, icon_name, badge_text,
  sort_order, is_active, is_featured,
  features
) VALUES (
  'free', 'Plan Gratuito', 'free',
  'Para productores que quieren publicar sus primeros avisos sin costo.',
  3, 0, false,
  true, false, false,
  false, false,
  false, false,
  2500, 0, 0,
  'gray', 'gift', 'Gratuito',
  1, true, false,
  '["Hasta 3 avisos activos", "Chat con compradores", "Búsqueda en todo el sitio"]'::jsonb
)
ON CONFLICT (slug) DO UPDATE SET
  display_name          = EXCLUDED.display_name,
  description           = EXCLUDED.description,
  max_ads               = EXCLUDED.max_ads,
  max_company_profiles  = EXCLUDED.max_company_profiles,
  can_have_company_profile = EXCLUDED.can_have_company_profile,
  can_show_whatsapp     = EXCLUDED.can_show_whatsapp,
  has_virtual_office    = EXCLUDED.has_virtual_office,
  extra_ad_price_ars    = EXCLUDED.extra_ad_price_ars,
  features              = EXCLUDED.features,
  updated_at            = now();

-- 4. Seed plan PREMIUM
INSERT INTO public.subscription_plans (
  name, display_name, slug, description,
  max_ads, max_company_profiles, can_have_company_profile,
  has_inbox, has_analytics, has_priority_support,
  has_public_profile, has_catalog,
  can_show_whatsapp, has_virtual_office,
  extra_ad_price_ars, price_monthly, price_yearly,
  badge_color, icon_name, badge_text,
  sort_order, is_active, is_featured,
  features
) VALUES (
  'premium', 'Plan Premium', 'premium',
  'Para empresas y profesionales del agro. Servicios, Oficina Virtual y más.',
  10, 3, true,
  true, true, true,
  true, true,
  true, true,
  1500, 9900, 99000,
  'green', 'zap', 'Más popular',
  2, true, true,
  '["Hasta 10 avisos activos", "Perfil de empresa verificado", "Botón WhatsApp en contacto", "Oficina Virtual", "Analytics de vistas", "Soporte prioritario"]'::jsonb
)
ON CONFLICT (slug) DO UPDATE SET
  display_name          = EXCLUDED.display_name,
  description           = EXCLUDED.description,
  max_ads               = EXCLUDED.max_ads,
  max_company_profiles  = EXCLUDED.max_company_profiles,
  can_have_company_profile = EXCLUDED.can_have_company_profile,
  has_analytics         = EXCLUDED.has_analytics,
  has_priority_support  = EXCLUDED.has_priority_support,
  has_public_profile    = EXCLUDED.has_public_profile,
  can_show_whatsapp     = EXCLUDED.can_show_whatsapp,
  has_virtual_office    = EXCLUDED.has_virtual_office,
  extra_ad_price_ars    = EXCLUDED.extra_ad_price_ars,
  price_monthly         = EXCLUDED.price_monthly,
  price_yearly          = EXCLUDED.price_yearly,
  badge_color           = EXCLUDED.badge_color,
  badge_text            = EXCLUDED.badge_text,
  is_featured           = EXCLUDED.is_featured,
  features              = EXCLUDED.features,
  updated_at            = now();
