-- Quitar empresa_selector del step 'caracteristicas' en wizard_configs default
UPDATE public.wizard_configs
SET steps = (
  SELECT jsonb_agg(
    CASE
      WHEN step->>'key' = 'caracteristicas' THEN
        jsonb_set(
          step,
          '{blocks}',
          '[
            {"type": "dynamic_fields", "order": 1},
            {"type": "price", "order": 2, "config": {"show_currency": true, "show_unit": true}}
          ]'::jsonb
        )
      ELSE step
    END
  )
  FROM jsonb_array_elements(steps) AS step
),
updated_at = now()
WHERE name = 'default';
