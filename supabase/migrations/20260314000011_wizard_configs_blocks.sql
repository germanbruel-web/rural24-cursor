-- Sprint 8D — Persistir wizard_configs default con bloques
-- Inserta (o actualiza) la fila 'default' con el JSON completo de steps+blocks.
-- ON CONFLICT actualiza steps para no pisar configs por categoría existentes.

INSERT INTO public.wizard_configs (name, display_name, category_id, steps, is_active)
VALUES (
  'default',
  'Configuración por defecto',
  NULL,
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
      "description": "Detalles técnicos",
      "icon": "Settings",
      "visible": true,
      "order": 2,
      "locked": false,
      "blocks": [
        { "type": "dynamic_fields",   "order": 1 },
        { "type": "empresa_selector", "order": 2 },
        { "type": "price",            "order": 3, "config": { "show_currency": true, "show_unit": true } }
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
      "blocks": [
        { "type": "location", "order": 1 }
      ]
    },
    {
      "key": "fotos",
      "label": "Fotos",
      "description": "Imágenes del aviso",
      "icon": "Camera",
      "visible": true,
      "order": 4,
      "locked": false,
      "blocks": [
        { "type": "images", "order": 1, "config": { "max_images": 8 } }
      ]
    },
    {
      "key": "informacion",
      "label": "Información",
      "description": "Título y descripción",
      "icon": "FileText",
      "visible": true,
      "order": 5,
      "locked": false,
      "blocks": [
        { "type": "title_description", "order": 1 }
      ]
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
  ]'::jsonb,
  true
)
ON CONFLICT (name) DO UPDATE
  SET steps      = EXCLUDED.steps,
      updated_at = now()
WHERE wizard_configs.name = 'default';
