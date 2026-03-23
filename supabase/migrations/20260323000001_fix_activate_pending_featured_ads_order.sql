-- Fix: activate_pending_featured_ads — invertir orden (expire first, then activate)
-- Causa: el orden previo violaba idx_featured_ads_unique_active_placement
-- cuando Period 1 activo-vencido + Period 2 pending-ready coexistían para
-- el mismo (ad_id, placement). El Step 1 intentaba activar Period 2 antes
-- de que Period 1 fuera expirado → duplicate key → 500 en el cron.
-- Solución: expirar primero, luego activar + advisory lock para concurrencia.

CREATE OR REPLACE FUNCTION public.activate_pending_featured_ads()
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
  v_activated INT := 0;
  v_expired   INT := 0;
BEGIN
  -- Advisory lock: evita ejecuciones concurrentes (retries de GitHub Actions)
  -- El lock se libera automáticamente al finalizar la transacción.
  PERFORM pg_advisory_xact_lock(1234567890);

  -- PASO 1 (crítico — va ANTES): expirar activos vencidos
  -- Si Period 1 expiró y hay un Period 2 pending para el mismo slot,
  -- hay que liberar el unique constraint ANTES de activar el siguiente.
  UPDATE featured_ads
  SET    status     = 'expired',
         updated_at = NOW()
  WHERE  status     = 'active'
    AND  expires_at < NOW();

  GET DIAGNOSTICS v_expired = ROW_COUNT;

  -- PASO 2: activar pendientes cuya fecha de inicio ya llegó
  UPDATE featured_ads
  SET    status       = 'active',
         actual_start = NOW(),
         updated_at   = NOW()
  WHERE  status           = 'pending'
    AND  scheduled_start <= CURRENT_DATE;

  GET DIAGNOSTICS v_activated = ROW_COUNT;

  IF v_activated > 0 OR v_expired > 0 THEN
    RAISE NOTICE 'Featured ads: % activados, % expirados', v_activated, v_expired;
  END IF;

  RETURN v_activated;
END;
$$;
