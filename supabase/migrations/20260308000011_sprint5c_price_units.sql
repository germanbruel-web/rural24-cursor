-- ============================================================
-- Sprint 5C: Sistema de Precio con Unidades
-- ============================================================
-- 1. ads.price_unit          — unidad seleccionada al publicar
-- 2. form_templates_v2.price_config — config de precio por template
-- 3. option_lists de unidades (servicios / hacienda / insumos)
-- 4. Asignación de price_config a los 8 templates activos
-- ============================================================

-- ─── 1. Columnas nuevas ───────────────────────────────────────

ALTER TABLE public.ads
  ADD COLUMN IF NOT EXISTS price_unit varchar(30);

COMMENT ON COLUMN public.ads.price_unit IS
  'Unidad del precio: hora, ha, km, cabeza, kg-vivo, litro, etc. NULL = precio total.';

ALTER TABLE public.form_templates_v2
  ADD COLUMN IF NOT EXISTS price_config jsonb;

COMMENT ON COLUMN public.form_templates_v2.price_config IS
  'Config de precio: { "required": true, "units_list": "nombre-option-list" }. Sin units_list = precio total sin selector.';

-- ─── 2. Option lists de unidades de precio ────────────────────

INSERT INTO public.option_lists (name, display_name, scope, description)
VALUES
  ('unidades-precio-servicios', 'Unidades de precio — Servicios', 'global',
   'Unidades para servicios: hora, ha, km, mes, viaje, unidad'),
  ('unidades-precio-hacienda',  'Unidades de precio — Hacienda',  'global',
   'Unidades para hacienda: cabeza, kg vivo, kg gancho, lote'),
  ('unidades-precio-insumos',   'Unidades de precio — Insumos',   'global',
   'Unidades para insumos: kg, litro, bolsa, dosis, unidad')
ON CONFLICT (name) DO NOTHING;

-- ─── 3. Ítems: Servicios ──────────────────────────────────────

INSERT INTO public.option_list_items (list_id, value, label, sort_order)
SELECT ol.id, v.value, v.label, v.sort_order
FROM public.option_lists ol,
  (VALUES
    ('hora',   'por hora',   0),
    ('ha',     'por ha',     1),
    ('km',     'por km',     2),
    ('mes',    'por mes',    3),
    ('viaje',  'por viaje',  4),
    ('unidad', 'por unidad', 5)
  ) AS v(value, label, sort_order)
WHERE ol.name = 'unidades-precio-servicios'
ON CONFLICT (list_id, value) DO NOTHING;

-- ─── 4. Ítems: Hacienda ───────────────────────────────────────

INSERT INTO public.option_list_items (list_id, value, label, sort_order)
SELECT ol.id, v.value, v.label, v.sort_order
FROM public.option_lists ol,
  (VALUES
    ('cabeza',   'por cabeza',   0),
    ('kg-vivo',  'por kg vivo',  1),
    ('kg-gancho','por kg gancho',2),
    ('lote',     'por lote',     3)
  ) AS v(value, label, sort_order)
WHERE ol.name = 'unidades-precio-hacienda'
ON CONFLICT (list_id, value) DO NOTHING;

-- ─── 5. Ítems: Insumos ────────────────────────────────────────

INSERT INTO public.option_list_items (list_id, value, label, sort_order)
SELECT ol.id, v.value, v.label, v.sort_order
FROM public.option_lists ol,
  (VALUES
    ('kg',     'por kg',     0),
    ('litro',  'por litro',  1),
    ('bolsa',  'por bolsa',  2),
    ('dosis',  'por dosis',  3),
    ('unidad', 'por unidad', 4)
  ) AS v(value, label, sort_order)
WHERE ol.name = 'unidades-precio-insumos'
ON CONFLICT (list_id, value) DO NOTHING;

-- ─── 6. price_config por template ────────────────────────────

-- Servicios (maquinaria / ganadería / agricultura)
UPDATE public.form_templates_v2
SET price_config = '{"required": true, "units_list": "unidades-precio-servicios"}'::jsonb
WHERE name IN ('ganaderia_servicios', 'maquinaria_servicios', 'agricultura_servicios');

-- Hacienda
UPDATE public.form_templates_v2
SET price_config = '{"required": true, "units_list": "unidades-precio-hacienda"}'::jsonb
WHERE name = 'ganaderia_hacienda';

-- Insumos
UPDATE public.form_templates_v2
SET price_config = '{"required": true, "units_list": "unidades-precio-insumos"}'::jsonb
WHERE name IN ('ganaderia_insumos', 'agricultura_insumos');

-- Venta de maquinaria / empresas — precio total sin unidad
UPDATE public.form_templates_v2
SET price_config = '{"required": true}'::jsonb
WHERE name IN ('maquinaria_maquinarias', 'maquinaria_empresas');
