-- Fix: get_form_for_context devuelve text en vez de character varying
-- PROD tenía la versión vieja con varchar en columnas form_name/form_display_name

DROP FUNCTION IF EXISTS public.get_form_for_context(uuid, uuid, uuid);

CREATE FUNCTION public.get_form_for_context(
  p_category_id      uuid DEFAULT NULL::uuid,
  p_subcategory_id   uuid DEFAULT NULL::uuid,
  p_category_type_id uuid DEFAULT NULL::uuid
)
RETURNS TABLE(
  form_id           uuid,
  form_name         text,
  form_display_name text,
  sections          jsonb,
  fields            jsonb
)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_template_id uuid;
BEGIN
  SELECT t.id INTO v_template_id
  FROM public.form_templates_v2 t
  WHERE t.is_active = true
    AND (
      (p_subcategory_id IS NOT NULL AND t.subcategory_id = p_subcategory_id)
      OR
      (p_subcategory_id IS NULL AND t.subcategory_id IS NULL
       AND p_category_id IS NOT NULL AND t.category_id = p_category_id)
    )
  ORDER BY
    CASE WHEN p_subcategory_id IS NOT NULL AND t.subcategory_id = p_subcategory_id THEN 0 ELSE 1 END,
    t.priority DESC
  LIMIT 1;

  IF v_template_id IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    t.id,
    t.name::text,
    t.display_name::text,
    t.sections,
    COALESCE(
      (SELECT jsonb_agg(
          jsonb_build_object(
            'id', f.id,
            'form_template_id', f.form_template_id,
            'field_name', f.field_name,
            'field_label', f.field_label,
            'section_id', f.section_id,
            'field_type', f.field_type,
            'field_width', f.field_width,
            'data_source', f.data_source,
            'data_source_config', f.data_source_config,
            'is_required', f.is_required,
            'validation_rules', f.validation_rules,
            'placeholder', f.placeholder,
            'help_text', f.help_text,
            'icon', f.icon,
            'display_order', f.display_order,
            'metadata', f.metadata,
            'options', f.options,
            'option_list_id', f.option_list_id,
            'created_at', f.created_at
          ) ORDER BY f.display_order)
       FROM public.form_fields_v2 f
       WHERE f.form_template_id = v_template_id),
      '[]'::jsonb
    )
  FROM public.form_templates_v2 t
  WHERE t.id = v_template_id;
END;
$$;
