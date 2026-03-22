-- Migración: global_config — settings homepage
-- Agrega claves que el frontend busca con getSetting()

INSERT INTO public.global_config (key, value, value_type, description, category)
VALUES
  ('homepage_featured_ads_limit', '12', 'number', 'Límite de avisos destacados en homepage', 'homepage')
ON CONFLICT (key) DO NOTHING;
