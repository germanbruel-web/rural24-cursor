-- Sección "Empleos Ofrecidos y Pedidos" en homepage
-- type: category_section — usa CategorySectionRenderer, cards abren EmpleoModal

INSERT INTO home_sections (type, title, query_filter, display_config, is_active, sort_order)
VALUES (
  'category_section',
  'Empleos Ofrecidos y Pedidos',
  jsonb_build_object(
    'category_slug',  'empleos',
    'featured_only',  false,
    'limit',          8
  ),
  jsonb_build_object(
    'subtitle',         'Encontrá o publicá tu próximo trabajo en el campo',
    'show_more',        true,
    'show_more_auto',   true,
    'show_more_label',  'Ver todos los empleos',
    'columns',          4
  ),
  true,
  -- Insertar después de la última sección activa
  (SELECT COALESCE(MAX(sort_order), 0) + 10 FROM home_sections WHERE is_active = true)
);
