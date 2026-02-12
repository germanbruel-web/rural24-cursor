-- ============================================================
-- FASE 2: SuperAdmin Sin Créditos para Featured Ads
-- Fecha: 12 Febrero 2026
-- Objetivo: SuperAdmin puede destacar avisos sin consumir créditos
-- ============================================================

-- DROP & CREATE: Función mejorada con lógica SuperAdmin
DROP FUNCTION IF EXISTS public.create_featured_ad(uuid, uuid, varchar, date);

CREATE OR REPLACE FUNCTION public.create_featured_ad(
  p_ad_id UUID, 
  p_user_id UUID, 
  p_placement VARCHAR, 
  p_scheduled_start DATE
)
RETURNS TABLE(success BOOLEAN, featured_id UUID, error_message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_category_id UUID;
  v_ad_user_id UUID;
  v_credits_available INT;
  v_is_available BOOLEAN;
  v_duration INT;
  v_new_id UUID;
  v_user_role VARCHAR(50);
  v_is_superadmin BOOLEAN := FALSE;
BEGIN
  -- =========================================================
  -- 0. CHECK SUPERADMIN (NUEVO)
  -- =========================================================
  SELECT role INTO v_user_role
  FROM users WHERE id = p_user_id;
  
  v_is_superadmin := (v_user_role = 'superadmin');
  
  -- =========================================================
  -- 1. Verificar que el aviso existe
  -- =========================================================
  SELECT category_id, user_id INTO v_category_id, v_ad_user_id
  FROM ads WHERE id = p_ad_id;
  
  IF v_category_id IS NULL THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, 'Aviso no encontrado';
    RETURN;
  END IF;
  
  -- SuperAdmin puede destacar cualquier aviso
  -- Usuario normal solo sus propios avisos
  IF NOT v_is_superadmin AND v_ad_user_id != p_user_id THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, 'No sos el dueño de este aviso';
    RETURN;
  END IF;
  
  -- =========================================================
  -- 2. Verificar créditos disponibles (SKIP para SuperAdmin)
  -- =========================================================
  IF NOT v_is_superadmin THEN
    SELECT (credits_total - credits_used) INTO v_credits_available
    FROM user_featured_credits WHERE user_id = p_user_id;
    
    IF COALESCE(v_credits_available, 0) <= 0 THEN
      RETURN QUERY SELECT FALSE, NULL::UUID, 'No tenés créditos disponibles';
      RETURN;
    END IF;
  END IF;
  
  -- =========================================================
  -- 3. Verificar que el aviso no esté ya destacado
  -- =========================================================
  IF EXISTS (
    SELECT 1 FROM featured_ads 
    WHERE ad_id = p_ad_id 
      AND placement = p_placement 
      AND status IN ('pending', 'active')
  ) THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, 
      'Este aviso ya está destacado en esta ubicación. Esperá a que expire para volver a destacarlo.';
    RETURN;
  END IF;
  
  -- =========================================================
  -- 4. Obtener duración de settings
  -- =========================================================
  SELECT (value #>> '{}')::INT INTO v_duration
  FROM global_settings WHERE key = 'featured_duration_days';
  v_duration := COALESCE(v_duration, 15);
  
  -- =========================================================
  -- 5. Verificar disponibilidad de slots en la categoría
  -- =========================================================
  SELECT fa.is_available INTO v_is_available
  FROM check_featured_availability(p_placement, v_category_id, p_scheduled_start, v_duration) fa;
  
  IF NOT v_is_available THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, 
      'No hay slots disponibles en esa fecha. Probá con otra fecha.';
    RETURN;
  END IF;
  
  -- =========================================================
  -- 6. Crear el registro de destacado
  -- =========================================================
  INSERT INTO featured_ads (
    ad_id, user_id, placement, category_id,
    scheduled_start, duration_days, status, priority
  ) VALUES (
    p_ad_id, 
    p_user_id, 
    p_placement, 
    v_category_id,
    p_scheduled_start, 
    v_duration, 
    'pending', 
    (SELECT COALESCE(MAX(priority), 0) + 1 
     FROM featured_ads 
     WHERE placement = p_placement AND category_id = v_category_id)
  )
  RETURNING id INTO v_new_id;
  
  -- =========================================================
  -- 7. Consumir crédito (SKIP para SuperAdmin)
  -- =========================================================
  IF NOT v_is_superadmin THEN
    UPDATE user_featured_credits
    SET credits_used = credits_used + 1,
        updated_at = NOW()
    WHERE user_id = p_user_id;
    
    -- Marcar que el crédito fue consumido
    UPDATE featured_ads
    SET credit_consumed = TRUE
    WHERE id = v_new_id;
  ELSE
    -- SuperAdmin: NO consume créditos
    UPDATE featured_ads
    SET credit_consumed = FALSE
    WHERE id = v_new_id;
  END IF;
  
  -- =========================================================
  -- 8. Retornar éxito con mensaje personalizado
  -- =========================================================
  IF v_is_superadmin THEN
    RETURN QUERY SELECT TRUE, v_new_id, 
      'SuperAdmin: Aviso programado sin consumir créditos'::TEXT;
  ELSE
    RETURN QUERY SELECT TRUE, v_new_id, 
      'Aviso programado para destacar'::TEXT;
  END IF;
END;
$$;

-- ============================================================
-- COMENTARIO DE LA FUNCIÓN
-- ============================================================
COMMENT ON FUNCTION public.create_featured_ad(uuid, uuid, varchar, date) IS 
'Crea un featured ad con verificación de rol. SuperAdmin no consume créditos.
Args:
  - p_ad_id: ID del aviso a destacar
  - p_user_id: ID del usuario (puede ser superadmin o usuario normal)
  - p_placement: "homepage" o "results"
  - p_scheduled_start: Fecha de inicio programada
Returns:
  - success: TRUE si se creó correctamente
  - featured_id: UUID del featured_ad creado
  - error_message: Mensaje descriptivo del resultado';

-- ============================================================
-- FIN DEL SCRIPT
-- ============================================================

-- ============================================================
-- BONUS: Actualizar admin_cancel_featured_ad
-- Para que NO reembolse créditos si fue creado por SuperAdmin
-- ============================================================

DROP FUNCTION IF EXISTS public.admin_cancel_featured_ad(uuid, uuid, text, boolean);

CREATE OR REPLACE FUNCTION public.admin_cancel_featured_ad(
  p_featured_ad_id UUID, 
  p_admin_id UUID, 
  p_reason TEXT DEFAULT NULL, 
  p_refund BOOLEAN DEFAULT FALSE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_featured_ad RECORD;
  v_refund_amount INT := 0;
  v_user_balance INT;
  v_transaction_id UUID;
  v_can_refund BOOLEAN := FALSE;
BEGIN
  -- Obtener featured ad
  SELECT * INTO v_featured_ad
  FROM featured_ads
  WHERE id = p_featured_ad_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', FALSE, 'error', 'Featured ad no encontrado');
  END IF;

  IF v_featured_ad.status = 'cancelled' THEN
    RETURN jsonb_build_object('success', FALSE, 'error', 'Featured ad ya está cancelado');
  END IF;

  IF v_featured_ad.refunded = TRUE THEN
    RETURN jsonb_build_object('success', FALSE, 'error', 'Ya se realizó un reembolso anteriormente');
  END IF;

  -- =========================================================
  -- NUEVA LÓGICA: Verificar si puede reembolsar
  -- Solo si credit_consumed = TRUE (no fue SuperAdmin quien lo creó)
  -- =========================================================
  v_can_refund := (v_featured_ad.credit_consumed = TRUE AND p_refund = TRUE);

  -- Cancelar featured ad
  UPDATE featured_ads
  SET 
    status = 'cancelled',
    cancelled_by = p_admin_id,
    cancelled_reason = p_reason,
    cancelled_at = NOW(),
    refunded = v_can_refund,
    updated_at = NOW()
  WHERE id = p_featured_ad_id;

  -- Reembolso: Solo si consumió créditos originalmente
  IF v_can_refund THEN
    v_refund_amount := CASE v_featured_ad.duration_days
      WHEN 7 THEN 1
      WHEN 14 THEN 2
      WHEN 21 THEN 3
      WHEN 28 THEN 4
      ELSE 1
    END;
    
    -- Actualizar balance
    UPDATE user_credits
    SET balance = balance + v_refund_amount, updated_at = NOW()
    WHERE user_id = v_featured_ad.user_id;

    -- Registrar transacción de reembolso
    INSERT INTO credit_transactions (
      user_id, type, amount, balance_after, description, featured_ad_id, notes
    )
    SELECT 
      v_featured_ad.user_id,
      'refund',
      v_refund_amount,
      uc.balance,
      'Reembolso por cancelación de featured ad',
      p_featured_ad_id,
      p_reason
    FROM user_credits uc
    WHERE uc.user_id = v_featured_ad.user_id
    RETURNING id INTO v_transaction_id;

    SELECT balance INTO v_user_balance FROM user_credits WHERE user_id = v_featured_ad.user_id;
  END IF;

  -- Auditoría
  INSERT INTO featured_ads_audit (featured_ad_id, action, performed_by, reason, metadata)
  VALUES (
    p_featured_ad_id,
    CASE WHEN v_can_refund THEN 'refunded' ELSE 'cancelled' END,
    p_admin_id,
    p_reason,
    jsonb_build_object(
      'refund_amount', v_refund_amount,
      'new_balance', v_user_balance,
      'previous_status', v_featured_ad.status,
      'transaction_id', v_transaction_id,
      'was_superadmin_created', NOT v_featured_ad.credit_consumed
    )
  );

  -- =========================================================
  -- Retornar con mensaje claro
  -- =========================================================
  IF NOT v_featured_ad.credit_consumed AND p_refund = TRUE THEN
    RETURN jsonb_build_object(
      'success', TRUE,
      'refunded', FALSE,
      'refund_amount', 0,
      'user_balance', NULL,
      'message', 'Featured ad cancelado (creado por SuperAdmin sin consumir créditos)'
    );
  ELSE
    RETURN jsonb_build_object(
      'success', TRUE,
      'refunded', v_can_refund,
      'refund_amount', v_refund_amount,
      'user_balance', v_user_balance
    );
  END IF;
END;
$$;

COMMENT ON FUNCTION public.admin_cancel_featured_ad(uuid, uuid, text, boolean) IS 
'Cancela un featured ad con opción de reembolso.
NO reembolsa créditos si fue creado por SuperAdmin (credit_consumed = FALSE).
Args:
  - p_featured_ad_id: ID del featured ad a cancelar
  - p_admin_id: ID del admin que ejecuta la acción
  - p_reason: Motivo de cancelación
  - p_refund: Si TRUE, intenta reembolsar créditos (solo si consumió originalmente)
Returns:
  - JSONB con resultado de la operación';

-- ============================================================
-- FIN DEL SCRIPT COMPLETO
-- ============================================================
