-- ============================================================================
-- FIX: Hacer campo 'Estado' (condition) OPCIONAL
-- ============================================================================
-- Fecha: 2025-12-15
-- Motivo: El usuario indica "Estado: que no sea un campo obligatorio, se ve mal chequearlo"
-- ============================================================================

DO $$
DECLARE
  v_form_id UUID;
BEGIN
  -- Obtener el ID del formulario de tractor agrícola
  SELECT id INTO v_form_id 
  FROM form_templates_v2 
  WHERE name = 'form_tractor_agricola' 
  LIMIT 1;

  IF v_form_id IS NULL THEN
    RAISE EXCEPTION 'Formulario no encontrado';
  END IF;

  -- Cambiar el campo 'condition' (Estado) de REQUIRED a OPCIONAL
  UPDATE form_fields_v2
  SET is_required = false
  WHERE form_template_id = v_form_id
  AND field_name = 'condition';

  RAISE NOTICE '✅ Campo "Estado" (condition) ahora es OPCIONAL';
  
  -- Verificar el cambio
  RAISE NOTICE 'Estado del campo: %', 
    (SELECT is_required FROM form_fields_v2 
     WHERE form_template_id = v_form_id AND field_name = 'condition');
END;
$$;
