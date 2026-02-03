-- Migration: Add banners_intercalation_interval setting
-- Date: 2026-02-02
-- Purpose: Allow configurable interval for banner intercalation in search results
-- Execute in: Supabase Dashboard → SQL Editor

-- Insert the new setting
INSERT INTO global_settings (key, value, value_type, category, description, display_name, is_public)
VALUES (
  'banners_intercalation_interval',
  to_jsonb(5),
  'number',
  'banners',
  'Cada cuántos productos se intercala un banner en resultados de búsqueda',
  'Intervalo de Banners Intercalados',
  true
)
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  description = EXCLUDED.description,
  display_name = EXCLUDED.display_name;

-- Verify
SELECT * FROM global_settings WHERE key = 'banners_intercalation_interval';
