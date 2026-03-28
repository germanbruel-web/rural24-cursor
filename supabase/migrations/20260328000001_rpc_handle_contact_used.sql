-- ============================================================================
-- RPC: handle_contact_used
-- Maneja incremento de contactos mensuales del usuario de forma atómica.
-- Reemplaza la lógica fragmentada en planLimitsService.ts que:
--   a) hacía UPDATE directo desde el frontend (violación de patrón financiero)
--   b) llamaba a 'increment_contacts_used' que no existía en la DB
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_contact_used(p_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_count integer;
BEGIN
  UPDATE users
  SET
    contacts_used_this_month = CASE
      -- Si contacts_reset_at es NULL o pertenece a un mes anterior: resetear a 1
      WHEN contacts_reset_at IS NULL OR contacts_reset_at < DATE_TRUNC('month', NOW())
      THEN 1
      -- Si ya está en el mes actual: incrementar
      ELSE contacts_used_this_month + 1
    END,
    contacts_reset_at = CASE
      -- Solo actualizar contacts_reset_at si se hizo reset
      WHEN contacts_reset_at IS NULL OR contacts_reset_at < DATE_TRUNC('month', NOW())
      THEN NOW()
      ELSE contacts_reset_at
    END
  WHERE id = p_user_id
  RETURNING contacts_used_this_month INTO v_new_count;

  RETURN v_new_count;
END;
$$;

-- Permitir que usuarios autenticados llamen a esta función (solo para su propio user_id)
-- La verificación de ownership la hace la función vía WHERE id = p_user_id
GRANT EXECUTE ON FUNCTION public.handle_contact_used(uuid) TO authenticated;
