-- ================================================================
-- Agregar radio y checkbox_group al CHECK constraint de form_fields_v2.field_type
-- Fecha: 2026-03-17
-- ================================================================

ALTER TABLE public.form_fields_v2
  DROP CONSTRAINT IF EXISTS form_fields_v2_field_type_check;

ALTER TABLE public.form_fields_v2
  ADD CONSTRAINT form_fields_v2_field_type_check
  CHECK (field_type = ANY (ARRAY[
    'text'::text,
    'number'::text,
    'select'::text,
    'autocomplete'::text,
    'textarea'::text,
    'checkbox'::text,
    'checkbox_group'::text,
    'radio'::text,
    'features'::text,
    'tags'::text,
    'range'::text
  ]));
