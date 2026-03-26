-- ============================================================
-- Sprint WIZ-B Fase D: Agregar bloque avatar_upload
-- al step color_fondo de Servicios y Empleos
-- 2026-03-26
-- ============================================================

-- Servicios
UPDATE wizard_configs
SET steps = (
  SELECT jsonb_agg(
    CASE
      WHEN step->>'key' = 'color_fondo' THEN
        jsonb_set(
          step,
          '{blocks}',
          '[
            { "type": "avatar_upload", "order": 1 },
            { "type": "color_picker",  "order": 2 }
          ]'::jsonb
        )
      ELSE step
    END
  )
  FROM jsonb_array_elements(steps) AS step
),
updated_at = now()
WHERE name = 'servicios';

-- Empleos
UPDATE wizard_configs
SET steps = (
  SELECT jsonb_agg(
    CASE
      WHEN step->>'key' = 'color_fondo' THEN
        jsonb_set(
          step,
          '{blocks}',
          '[
            { "type": "avatar_upload", "order": 1 },
            { "type": "color_picker",  "order": 2 }
          ]'::jsonb
        )
      ELSE step
    END
  )
  FROM jsonb_array_elements(steps) AS step
),
updated_at = now()
WHERE name = 'empleos';
