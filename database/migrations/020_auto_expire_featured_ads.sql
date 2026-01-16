-- ============================================================================
-- TRIGGER: Auto-remove expired featured ads
-- Limpia automáticamente avisos destacados cuando expira su fecha
-- ============================================================================

-- 1. Función que quita el destacado cuando expira
CREATE OR REPLACE FUNCTION auto_expire_featured_ads()
RETURNS TRIGGER AS $$
BEGIN
  -- Si el aviso tiene featured_until y ya pasó, quitar destacado
  IF NEW.featured = true AND NEW.featured_until IS NOT NULL AND NEW.featured_until < NOW() THEN
    NEW.featured := false;
    NEW.featured_until := NULL;
    NEW.featured_order := NULL;
    RAISE NOTICE 'Auto-expired featured ad: %', NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Trigger que se ejecuta en cada UPDATE
DROP TRIGGER IF EXISTS trigger_auto_expire_featured ON ads;
CREATE TRIGGER trigger_auto_expire_featured
  BEFORE UPDATE ON ads
  FOR EACH ROW
  EXECUTE FUNCTION auto_expire_featured_ads();

-- 3. Función para limpiar destacados expirados (batch job)
-- Puede ejecutarse manualmente o desde un cron externo
CREATE OR REPLACE FUNCTION cleanup_expired_featured_ads()
RETURNS INTEGER AS $$
DECLARE
  affected_count INTEGER;
BEGIN
  UPDATE ads
  SET 
    featured = false,
    featured_until = NULL,
    featured_order = NULL
  WHERE 
    featured = true 
    AND featured_until IS NOT NULL 
    AND featured_until < NOW();
  
  GET DIAGNOSTICS affected_count = ROW_COUNT;
  
  RAISE NOTICE 'Cleaned up % expired featured ads', affected_count;
  
  RETURN affected_count;
END;
$$ LANGUAGE plpgsql;

-- 4. Ejecutar limpieza inicial (quitar destacados ya expirados)
SELECT cleanup_expired_featured_ads();

-- 5. Opcional: Crear un cron job con pg_cron (si está habilitado)
-- Ejecuta diariamente a las 00:00 UTC
-- NOTA: pg_cron debe estar habilitado en Supabase Dashboard > Database > Extensions

-- SELECT cron.schedule(
--   'cleanup-expired-featured-ads',  -- nombre del job
--   '0 0 * * *',                      -- cada día a medianoche
--   'SELECT cleanup_expired_featured_ads()'
-- );

-- Para ver jobs programados: SELECT * FROM cron.job;
-- Para cancelar: SELECT cron.unschedule('cleanup-expired-featured-ads');

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================
-- Ver avisos que serían afectados:
SELECT id, title, featured, featured_until 
FROM ads 
WHERE featured = true 
  AND featured_until IS NOT NULL 
  AND featured_until < NOW();

-- Ver avisos destacados activos:
SELECT id, title, featured_until,
  CASE 
    WHEN featured_until IS NULL THEN 'Sin fecha'
    WHEN featured_until < NOW() + INTERVAL '3 days' THEN 'Vence pronto'
    ELSE 'OK'
  END as status
FROM ads 
WHERE featured = true
ORDER BY featured_until ASC NULLS LAST;
