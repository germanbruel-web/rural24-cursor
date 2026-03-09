-- ============================================================
-- Fix: campo "raza" en ganaderia_hacienda — razas condicionales
-- ============================================================
-- Sprint 4C creó el campo raza con option_list_id = razas-bovinas (lista fija).
-- Sprint 4E intentó crear el template con data_source_config pero fue bloqueado
-- por la guardia "ya existe". Este fix aplica el data_source_config correcto
-- y desvincula la lista fija.
-- ============================================================

UPDATE public.form_fields_v2
SET
  option_list_id    = NULL,
  placeholder       = 'Seleccioná primero el tipo...',
  data_source_config = '{
    "depends_on": "tipo_animal",
    "list_map": {
      "toros":       "razas-toros",
      "vacas":       "razas-vacas",
      "novillos":    "razas-novillos",
      "vaquillonas": "razas-vaquillonas",
      "terneros":    "razas-terneros"
    }
  }'::jsonb
WHERE
  field_name = 'raza'
  AND form_template_id = (
    SELECT id FROM public.form_templates_v2
    WHERE name = 'ganaderia_hacienda'
    LIMIT 1
  );
