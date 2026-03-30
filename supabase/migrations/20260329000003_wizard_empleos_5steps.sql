-- ============================================================
-- Wizard Empleos — 5 pasos (sin fotos, sin precio, sin color_fondo)
-- Steps: categoria → caracteristicas → ubicacion → informacion → revision
-- 2026-03-29
-- ============================================================

UPDATE wizard_configs
SET
  steps = '[
    {
      "key": "categoria",
      "label": "Categoría",
      "description": "¿Qué tipo de empleo publicás?",
      "icon": "Tag",
      "visible": true,
      "order": 1,
      "locked": true,
      "blocks": []
    },
    {
      "key": "caracteristicas",
      "label": "Características",
      "description": "Tipo de búsqueda y detalles",
      "icon": "Briefcase",
      "visible": true,
      "order": 2,
      "locked": false,
      "blocks": [
        { "type": "dynamic_fields", "order": 1 }
      ]
    },
    {
      "key": "ubicacion",
      "label": "Ubicación",
      "description": "Dónde se desarrolla el empleo",
      "icon": "MapPin",
      "visible": true,
      "order": 3,
      "locked": false,
      "blocks": [{ "type": "location", "order": 1 }]
    },
    {
      "key": "informacion",
      "label": "Título y Descripción",
      "description": "Describí el puesto o búsqueda",
      "icon": "FileText",
      "visible": true,
      "order": 4,
      "locked": false,
      "blocks": [{ "type": "title_description", "order": 1 }]
    },
    {
      "key": "revision",
      "label": "Revisar y Publicar",
      "description": "Confirmá y publicá tu aviso",
      "icon": "CheckCircle2",
      "visible": true,
      "order": 5,
      "locked": true,
      "blocks": []
    }
  ]'::jsonb,
  updated_at = now()
WHERE name = 'empleos';
