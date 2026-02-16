-- ============================================================================
-- Migración: Unificación del sistema de Featured Ads & Créditos
-- Fecha: 2026-02-16
-- ============================================================================
-- OBJETIVO:
--   1. Migrar datos de user_featured_credits → user_credits (tabla canónica)
--   2. Crear índice compuesto para consultas de slots
--   3. Agregar constraint UNIQUE parcial para evitar duplicados
--   4. Actualizar RPC create_featured_ad para usar user_credits
--   5. Agregar settings de créditos a global_settings si no existen
-- 
-- INSTRUCCIONES:
--   - Ejecutar en Supabase SQL Editor
--   - Verificar que no haya featured_ads con status 'active' o 'pending' antes de ejecutar
--   - Hacer backup de user_featured_credits antes de ejecutar
-- ============================================================================

-- ============================================================================
-- PASO 1: Migrar saldos de user_featured_credits → user_credits
-- ============================================================================
-- Para cada usuario con saldo en user_featured_credits:
--   credits_available = credits_total - credits_used
-- Se suman al balance existente en user_credits (si existe)

DO $$
DECLARE
  migrated INT := 0;
BEGIN
  -- Insertar o actualizar user_credits con saldos de user_featured_credits
  INSERT INTO user_credits (user_id, balance, monthly_allowance, last_monthly_reset)
  SELECT 
    ufc.user_id,
    (ufc.credits_total - ufc.credits_used) AS balance,
    0 AS monthly_allowance,
    NOW() AS last_monthly_reset
  FROM user_featured_credits ufc
  WHERE NOT EXISTS (
    SELECT 1 FROM user_credits uc WHERE uc.user_id = ufc.user_id
  )
  AND (ufc.credits_total - ufc.credits_used) > 0;

  GET DIAGNOSTICS migrated = ROW_COUNT;
  RAISE NOTICE 'Usuarios nuevos migrados a user_credits: %', migrated;

  -- Para los que ya tienen fila en user_credits, sumar el saldo
  UPDATE user_credits uc
  SET balance = uc.balance + (ufc.credits_total - ufc.credits_used),
      updated_at = NOW()
  FROM user_featured_credits ufc
  WHERE uc.user_id = ufc.user_id
  AND (ufc.credits_total - ufc.credits_used) > 0;

  GET DIAGNOSTICS migrated = ROW_COUNT;
  RAISE NOTICE 'Usuarios existentes actualizados en user_credits: %', migrated;
END $$;

-- ============================================================================
-- PASO 2: Índice compuesto para consultas de slots por categoría/placement
-- ============================================================================
-- Usado en: check_featured_availability, manual/route.ts slot check, homepage queries

CREATE INDEX IF NOT EXISTS idx_featured_ads_cat_placement_status
ON featured_ads(category_id, placement, status);

-- Índice para consultas de featured por ad_id (verificar duplicados)
CREATE INDEX IF NOT EXISTS idx_featured_ads_ad_status
ON featured_ads(ad_id, status);

-- ============================================================================
-- PASO 3: Constraint UNIQUE parcial — evita duplicados activos/pendientes
-- ============================================================================
-- Un aviso no puede estar destacado 2 veces en el mismo placement

-- Primero verificar si hay duplicados existentes
DO $$
DECLARE
  dupes INT;
BEGIN
  SELECT COUNT(*) INTO dupes
  FROM (
    SELECT ad_id, placement, COUNT(*) as cnt
    FROM featured_ads
    WHERE status IN ('active', 'pending')
    GROUP BY ad_id, placement
    HAVING COUNT(*) > 1
  ) sub;
  
  IF dupes > 0 THEN
    RAISE WARNING 'Hay % duplicados activos/pendientes. Revise manualmente antes de crear el constraint.', dupes;
  ELSE
    -- Crear constraint solo si no hay duplicados
    ALTER TABLE featured_ads
    ADD CONSTRAINT IF NOT EXISTS unique_active_ad_placement
    UNIQUE (ad_id, placement) 
    -- Nota: PostgreSQL no soporta WHERE en UNIQUE constraint directamente
    -- Usamos un unique index parcial en su lugar
    ;
    -- El constraint anterior no tiene WHERE, así que lo droppeamos y usamos índice parcial
    ALTER TABLE featured_ads DROP CONSTRAINT IF EXISTS unique_active_ad_placement;
    
    CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_ad_placement
    ON featured_ads(ad_id, placement)
    WHERE status IN ('active', 'pending');
    
    RAISE NOTICE 'Índice único parcial creado exitosamente';
  END IF;
END $$;

-- ============================================================================
-- PASO 4: Actualizar RPC create_featured_ad para usar user_credits
-- ============================================================================
-- La función original leía de user_featured_credits, ahora lee de user_credits

CREATE OR REPLACE FUNCTION create_featured_ad(
  p_ad_id UUID,
  p_user_id UUID,
  p_placement VARCHAR(20),
  p_category_id UUID,
  p_scheduled_start DATE DEFAULT CURRENT_DATE,
  p_duration_days INT DEFAULT NULL
)
RETURNS SETOF featured_ads
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_duration INT;
  v_credit_cost INT;
  v_user_balance INT;
  v_expires_at TIMESTAMPTZ;
  v_result featured_ads;
BEGIN
  -- Obtener duración desde settings o usar default
  IF p_duration_days IS NOT NULL THEN
    v_duration := p_duration_days;
  ELSE
    SELECT COALESCE(value::int, 15) INTO v_duration
    FROM global_settings
    WHERE key = 'featured_duration_days'
    LIMIT 1;
    IF v_duration IS NULL THEN v_duration := 15; END IF;
  END IF;

  -- Costo en créditos (por ahora 1 para todos los placements)
  v_credit_cost := 1;
  IF p_placement = 'homepage' THEN v_credit_cost := 4; END IF;

  -- Verificar saldo en user_credits (tabla canónica)
  SELECT COALESCE(balance, 0) INTO v_user_balance
  FROM user_credits
  WHERE user_id = p_user_id;

  IF v_user_balance IS NULL OR v_user_balance < v_credit_cost THEN
    RAISE EXCEPTION 'Créditos insuficientes (tiene: %, necesita: %)', COALESCE(v_user_balance, 0), v_credit_cost;
  END IF;

  -- Calcular fecha de expiración
  v_expires_at := (p_scheduled_start + (v_duration || ' days')::INTERVAL)::TIMESTAMPTZ;

  -- Insertar featured ad
  INSERT INTO featured_ads (
    ad_id, user_id, placement, category_id,
    scheduled_start, expires_at, duration_days,
    status, credit_consumed, credits_spent, requires_payment, is_manual
  ) VALUES (
    p_ad_id, p_user_id, p_placement, p_category_id,
    p_scheduled_start, v_expires_at, v_duration,
    CASE WHEN p_scheduled_start <= CURRENT_DATE THEN 'active' ELSE 'pending' END,
    TRUE, v_credit_cost, FALSE, FALSE
  )
  RETURNING * INTO v_result;

  -- Descontar créditos de user_credits
  UPDATE user_credits
  SET balance = balance - v_credit_cost,
      updated_at = NOW()
  WHERE user_id = p_user_id;

  -- Registrar transacción
  INSERT INTO credit_transactions (
    user_id, type, amount, balance_after, description, featured_ad_id
  ) VALUES (
    p_user_id, 'spend', -v_credit_cost,
    v_user_balance - v_credit_cost,
    'Featured ad: ' || p_placement,
    v_result.id
  );

  -- Registrar en auditoría
  INSERT INTO featured_ads_audit (
    featured_ad_id, action, performed_by, details
  ) VALUES (
    v_result.id, 'created', p_user_id,
    jsonb_build_object(
      'placement', p_placement,
      'duration_days', v_duration,
      'credits_spent', v_credit_cost,
      'source', 'user_request'
    )
  );

  RETURN NEXT v_result;
END;
$$;

-- ============================================================================
-- PASO 5: Actualizar RPC admin_cancel_featured_ad para consistencia
-- ============================================================================
-- Ya refundaba a user_credits — ahora es consistente con el sistema unificado

-- (No necesita cambios, ya usaba user_credits para refund)

-- ============================================================================
-- PASO 6: Agregar settings faltantes a global_settings
-- ============================================================================

INSERT INTO global_settings (key, value, category, description)
VALUES 
  ('featured_credit_cost_homepage', '4', 'featured', 'Costo en créditos para homepage'),
  ('featured_credit_cost_results', '1', 'featured', 'Costo en créditos para resultados'),
  ('featured_credit_cost_detail', '1', 'featured', 'Costo en créditos para detalle')
ON CONFLICT (key) DO NOTHING;

-- Verificar que existan los settings base (sin sobreescribir si ya existen)
INSERT INTO global_settings (key, value, category, description)
VALUES 
  ('featured_slots_homepage', '10', 'featured', 'Slots máximos en homepage por categoría'),
  ('featured_slots_results', '4', 'featured', 'Slots máximos en resultados por categoría'),
  ('featured_slots_detail', '6', 'featured', 'Slots máximos en detalle por categoría'),
  ('featured_duration_days', '15', 'featured', 'Duración por defecto de un destacado en días')
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================

DO $$
DECLARE
  uc_count INT;
  ufc_count INT;
BEGIN
  SELECT COUNT(*) INTO uc_count FROM user_credits WHERE balance > 0;
  SELECT COUNT(*) INTO ufc_count FROM user_featured_credits WHERE (credits_total - credits_used) > 0;
  
  RAISE NOTICE '=== VERIFICACIÓN POST-MIGRACIÓN ===';
  RAISE NOTICE 'Usuarios con saldo en user_credits: %', uc_count;
  RAISE NOTICE 'Usuarios con saldo en user_featured_credits (legacy): %', ufc_count;
  RAISE NOTICE 'Los saldos legacy ya fueron migrados a user_credits';
  RAISE NOTICE '====================================';
END $$;

-- ============================================================================
-- NOTA: NO eliminar user_featured_credits todavía
-- Dejar al menos 1 sprint como backup antes de DROP
-- Cuando se confirme que todo funciona:
--   DROP TABLE IF EXISTS user_featured_credits;
-- ============================================================================
