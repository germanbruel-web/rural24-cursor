-- ============================================================
-- Sprint WIZ-B: Wizard configs definitivos para Servicios y Empleos
-- - Sin step fotos (reemplazado por color_fondo)
-- - Precio con selector de tipo (price_type_list)
-- - Step color_fondo con ColorPickerBlock
-- 2026-03-26
-- ============================================================

-- Servicios (fb2143c6-18ca-41a2-ace2-61f0bb3220fe)
INSERT INTO wizard_configs (name, display_name, category_id, is_active, steps)
VALUES (
  'servicios',
  'Wizard Servicios',
  'fb2143c6-18ca-41a2-ace2-61f0bb3220fe',
  true,
  '[
    {
      "key": "categoria",
      "label": "Categoría",
      "description": "¿Qué publicás?",
      "icon": "Tag",
      "visible": true,
      "order": 1,
      "locked": true,
      "blocks": []
    },
    {
      "key": "caracteristicas",
      "label": "Características",
      "description": "Detalles del servicio",
      "icon": "Settings",
      "visible": true,
      "order": 2,
      "locked": false,
      "blocks": [
        { "type": "dynamic_fields", "order": 1 },
        { "type": "price", "order": 2, "config": {
          "show_currency": true,
          "show_unit": true,
          "price_optional": true,
          "price_type_list": "price-types-servicios",
          "price_no_amount_values": ["a-convenir"]
        }}
      ]
    },
    {
      "key": "ubicacion",
      "label": "Ubicación",
      "description": "Dónde está",
      "icon": "MapPin",
      "visible": true,
      "order": 3,
      "locked": false,
      "blocks": [{ "type": "location", "order": 1 }]
    },
    {
      "key": "color_fondo",
      "label": "Apariencia",
      "description": "Color de tu tarjeta",
      "icon": "Palette",
      "visible": true,
      "order": 4,
      "locked": false,
      "blocks": [{ "type": "color_picker", "order": 1 }]
    },
    {
      "key": "informacion",
      "label": "Información",
      "description": "Título y descripción",
      "icon": "FileText",
      "visible": true,
      "order": 5,
      "locked": false,
      "blocks": [{ "type": "title_description", "order": 1 }]
    },
    {
      "key": "revision",
      "label": "Revisar y Publicar",
      "description": "Confirmar publicación",
      "icon": "CheckCircle2",
      "visible": true,
      "order": 6,
      "locked": true,
      "blocks": []
    }
  ]'::jsonb
)
ON CONFLICT (name) DO UPDATE
  SET steps        = EXCLUDED.steps,
      display_name = EXCLUDED.display_name,
      category_id  = EXCLUDED.category_id,
      updated_at   = now();

-- Empleos (debba088-7f5b-479f-b137-a524bb9bb701)
INSERT INTO wizard_configs (name, display_name, category_id, is_active, steps)
VALUES (
  'empleos',
  'Wizard Empleos',
  'debba088-7f5b-479f-b137-a524bb9bb701',
  true,
  '[
    {
      "key": "categoria",
      "label": "Categoría",
      "description": "¿Qué publicás?",
      "icon": "Tag",
      "visible": true,
      "order": 1,
      "locked": true,
      "blocks": []
    },
    {
      "key": "caracteristicas",
      "label": "Características",
      "description": "Detalles del empleo",
      "icon": "Settings",
      "visible": true,
      "order": 2,
      "locked": false,
      "blocks": [
        { "type": "dynamic_fields", "order": 1 },
        { "type": "price", "order": 2, "config": {
          "show_currency": true,
          "show_unit": true,
          "price_optional": true,
          "price_type_list": "price-types-empleos",
          "price_no_amount_values": ["a-convenir", "no-remunerado"]
        }}
      ]
    },
    {
      "key": "ubicacion",
      "label": "Ubicación",
      "description": "Dónde está",
      "icon": "MapPin",
      "visible": true,
      "order": 3,
      "locked": false,
      "blocks": [{ "type": "location", "order": 1 }]
    },
    {
      "key": "color_fondo",
      "label": "Apariencia",
      "description": "Color de tu tarjeta",
      "icon": "Palette",
      "visible": true,
      "order": 4,
      "locked": false,
      "blocks": [{ "type": "color_picker", "order": 1 }]
    },
    {
      "key": "informacion",
      "label": "Información",
      "description": "Título y descripción",
      "icon": "FileText",
      "visible": true,
      "order": 5,
      "locked": false,
      "blocks": [{ "type": "title_description", "order": 1 }]
    },
    {
      "key": "revision",
      "label": "Revisar y Publicar",
      "description": "Confirmar publicación",
      "icon": "CheckCircle2",
      "visible": true,
      "order": 6,
      "locked": true,
      "blocks": []
    }
  ]'::jsonb
)
ON CONFLICT (name) DO UPDATE
  SET steps        = EXCLUDED.steps,
      display_name = EXCLUDED.display_name,
      category_id  = EXCLUDED.category_id,
      updated_at   = now();
