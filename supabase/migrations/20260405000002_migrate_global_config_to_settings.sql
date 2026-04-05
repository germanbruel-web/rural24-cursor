-- ============================================================
-- S6: Migrar datos de global_config → global_settings
-- ============================================================
-- Copia todos los registros de global_config a global_settings
-- con conversión de tipos (text → jsonb) y mapeo de value_type.
-- ON CONFLICT (key) DO NOTHING — idempotente, no sobreescribe
-- keys ya existentes en global_settings (ej: las insertadas en S2).
-- ============================================================

INSERT INTO global_settings (key, value, category, value_type, is_public, display_name, description)
SELECT
  key,
  CASE
    WHEN value_type = 'json'    THEN value::jsonb
    WHEN value_type = 'integer' THEN to_jsonb(value::bigint)
    WHEN value_type = 'decimal' THEN to_jsonb(value::numeric)
    WHEN value_type = 'boolean' THEN to_jsonb(value = 'true')
    ELSE                             to_jsonb(value)
  END AS value,
  COALESCE(category, 'general') AS category,
  CASE
    WHEN value_type IN ('integer', 'decimal') THEN 'number'
    ELSE value_type
  END AS value_type,
  false AS is_public,
  key   AS display_name,
  COALESCE(description, '') AS description
FROM global_config
ON CONFLICT (key) DO NOTHING;
