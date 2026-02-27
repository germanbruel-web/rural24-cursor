-- ============================================================
-- FIX: create_featured_ad usa activated_at que no existe
-- La tabla featured_ads tiene actual_start (no activated_at)
-- Fecha: 2026-02-27
-- ============================================================

CREATE OR REPLACE FUNCTION public.create_featured_ad(
  p_ad_id uuid,
  p_user_id uuid,
  p_placement text DEFAULT 'homepage'::text,
  p_scheduled_start date DEFAULT CURRENT_DATE
)
RETURNS TABLE(success boolean, featured_id uuid, message text)
LANGUAGE plpgsql SECURITY DEFINER
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
  -- 0. CHECK SUPERADMIN
  SELECT role INTO v_user_role FROM users WHERE id = p_user_id;
  v_is_superadmin := (v_user_role = 'superadmin');

  -- 1. Verificar que el aviso existe
  SELECT category_id, user_id INTO v_category_id, v_ad_user_id
  FROM ads WHERE id = p_ad_id;

  IF v_category_id IS NULL THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, 'Aviso no encontrado'::TEXT;
    RETURN;
  END IF;

  -- SuperAdmin puede destacar CUALQUIER aviso
  IF NOT v_is_superadmin AND v_ad_user_id != p_user_id THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, 'No sos el dueño de este aviso'::TEXT;
    RETURN;
  END IF;

  -- 2. Verificar créditos (SKIP para SuperAdmin)
  IF NOT v_is_superadmin THEN
    SELECT (credits_total - credits_used) INTO v_credits_available
    FROM user_featured_credits WHERE user_id = p_user_id;

    IF COALESCE(v_credits_available, 0) <= 0 THEN
      RETURN QUERY SELECT FALSE, NULL::UUID, 'No tenés créditos disponibles'::TEXT;
      RETURN;
    END IF;
  END IF;

  -- 3. Verificar que no esté ya destacado en este placement
  IF EXISTS (
    SELECT 1 FROM featured_ads
    WHERE ad_id = p_ad_id AND placement = p_placement AND status IN ('pending', 'active')
  ) THEN
    RETURN QUERY SELECT FALSE, NULL::UUID,
      'Este aviso ya está destacado en esta ubicación.'::TEXT;
    RETURN;
  END IF;

  -- 4. Duración desde settings
  SELECT (value #>> '{}')::INT INTO v_duration
  FROM global_settings WHERE key = 'featured_duration_days';
  v_duration := COALESCE(v_duration, 15);

  -- 5. Verificar slots (SKIP para SuperAdmin - sin límites)
  IF NOT v_is_superadmin THEN
    SELECT fa.is_available INTO v_is_available
    FROM check_featured_availability(p_placement, v_category_id, p_scheduled_start, v_duration) fa;

    IF NOT v_is_available THEN
      RETURN QUERY SELECT FALSE, NULL::UUID,
        'No hay slots disponibles en esa fecha.'::TEXT;
      RETURN;
    END IF;
  END IF;

  -- 6. Crear featured ad
  --    SuperAdmin: is_manual=true, status='active', actual_start=NOW()
  --    Usuario:    is_manual=false, status='pending', actual_start=NULL
  INSERT INTO featured_ads (
    ad_id, user_id, placement, category_id,
    scheduled_start, duration_days, status, priority,
    is_manual, credit_consumed,
    actual_start, expires_at
  ) VALUES (
    p_ad_id,
    p_user_id,
    p_placement,
    v_category_id,
    p_scheduled_start,
    CASE WHEN v_is_superadmin THEN 9999 ELSE v_duration END,
    CASE WHEN v_is_superadmin THEN 'active' ELSE 'pending' END,
    (SELECT COALESCE(MAX(priority), 0) + 1
     FROM featured_ads
     WHERE placement = p_placement AND category_id = v_category_id),
    v_is_superadmin,        -- is_manual = true para SuperAdmin
    NOT v_is_superadmin,    -- credit_consumed = false para SuperAdmin
    CASE WHEN v_is_superadmin THEN NOW() ELSE NULL END,
    NULL                    -- expires_at: NULL = sin límite de expiración
  )
  RETURNING id INTO v_new_id;

  -- 7. Consumir crédito (SKIP para SuperAdmin)
  IF NOT v_is_superadmin THEN
    UPDATE user_featured_credits
    SET credits_used = credits_used + 1, updated_at = NOW()
    WHERE user_id = p_user_id;
  END IF;

  -- 8. SuperAdmin: auto-aprobar y activar el aviso base
  IF v_is_superadmin THEN
    UPDATE ads
    SET approval_status = 'approved',
        status = 'active',
        featured = true,
        featured_at = NOW()
    WHERE id = p_ad_id
      AND (approval_status != 'approved' OR status != 'active' OR featured != true);

    RETURN QUERY SELECT TRUE, v_new_id,
      'SuperAviso activado en todas las ubicaciones sin límites'::TEXT;
  ELSE
    RETURN QUERY SELECT TRUE, v_new_id,
      'Aviso programado para destacar'::TEXT;
  END IF;
END;
$$;
