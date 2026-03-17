-- Migration: 20260316000003_category_placeholder_images
-- Agrega un setting de imagen placeholder por cada categoría principal.
-- Aparecen automáticamente en BackendSettings > Content tab.
-- setting_value inicia NULL → el wizard usa default_ad_image como fallback.

INSERT INTO public.site_settings (id, setting_key, setting_value, setting_type, section, description, created_at, updated_at)
VALUES
  (gen_random_uuid(), 'default_ad_image_maquinaria-agricola', NULL, 'image', 'content', 'Imagen placeholder — Maquinaria Agrícola',   now(), now()),
  (gen_random_uuid(), 'default_ad_image_hacienda',            NULL, 'image', 'content', 'Imagen placeholder — Hacienda',              now(), now()),
  (gen_random_uuid(), 'default_ad_image_insumos',             NULL, 'image', 'content', 'Imagen placeholder — Insumos',               now(), now()),
  (gen_random_uuid(), 'default_ad_image_repuestos',           NULL, 'image', 'content', 'Imagen placeholder — Repuestos',             now(), now()),
  (gen_random_uuid(), 'default_ad_image_equipamiento',        NULL, 'image', 'content', 'Imagen placeholder — Equipamiento',          now(), now()),
  (gen_random_uuid(), 'default_ad_image_inmobiliaria-rural',  NULL, 'image', 'content', 'Imagen placeholder — Inmobiliaria Rural',    now(), now()),
  (gen_random_uuid(), 'default_ad_image_servicios',           NULL, 'image', 'content', 'Imagen placeholder — Servicios',             now(), now()),
  (gen_random_uuid(), 'default_ad_image_empleos',             NULL, 'image', 'content', 'Imagen placeholder — Empleos',               now(), now())
ON CONFLICT (setting_key) DO NOTHING;
