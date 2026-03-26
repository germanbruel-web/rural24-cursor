-- ============================================================
-- Sprint WIZ-B: Option lists para tipos de precio
-- Servicios y Empleos con selector de modalidad de precio
-- 2026-03-26
-- ============================================================

-- ── Option list: Servicios ────────────────────────────────────
INSERT INTO option_lists (name, display_name, description, is_active)
VALUES (
  'price-types-servicios',
  'Tipos de precio — Servicios',
  'Modalidades de precio para avisos de Servicios',
  true
)
ON CONFLICT (name) DO UPDATE
  SET display_name = EXCLUDED.display_name,
      updated_at   = now();

INSERT INTO option_list_items (list_id, value, label, sort_order, is_active)
SELECT
  ol.id,
  item.value,
  item.label,
  item.sort_order,
  true
FROM option_lists ol,
  (VALUES
    ('precio-fijo',   'Precio fijo',   1),
    ('por-hora',      'Por hora',      2),
    ('por-proyecto',  'Por proyecto',  3),
    ('a-convenir',    'A convenir',    4)
  ) AS item(value, label, sort_order)
WHERE ol.name = 'price-types-servicios'
ON CONFLICT (list_id, value) DO UPDATE
  SET label      = EXCLUDED.label,
      sort_order = EXCLUDED.sort_order;

-- ── Option list: Empleos ──────────────────────────────────────
INSERT INTO option_lists (name, display_name, description, is_active)
VALUES (
  'price-types-empleos',
  'Tipos de precio — Empleos',
  'Modalidades de salario para avisos de Empleos',
  true
)
ON CONFLICT (name) DO UPDATE
  SET display_name = EXCLUDED.display_name,
      updated_at   = now();

INSERT INTO option_list_items (list_id, value, label, sort_order, is_active)
SELECT
  ol.id,
  item.value,
  item.label,
  item.sort_order,
  true
FROM option_lists ol,
  (VALUES
    ('salario-mensual', 'Salario mensual', 1),
    ('por-hora',        'Por hora',        2),
    ('a-convenir',      'A convenir',      3),
    ('no-remunerado',   'No remunerado',   4)
  ) AS item(value, label, sort_order)
WHERE ol.name = 'price-types-empleos'
ON CONFLICT (list_id, value) DO UPDATE
  SET label      = EXCLUDED.label,
      sort_order = EXCLUDED.sort_order;
