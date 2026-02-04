-- ============================================================================
-- CRON JOB: Activar Avisos Destacados Pendientes
-- ============================================================================
-- Este script configura un job programado para ejecutar diariamente
-- la función que activa destacados pendientes y expira los vencidos.
-- 
-- OPCIÓN 1: pg_cron (si está habilitado en Supabase)
-- OPCIÓN 2: Supabase Edge Function + Scheduler
-- OPCIÓN 3: Cron externo (Vercel, Railway, etc.) llamando al endpoint
-- ============================================================================

-- ============================================================================
-- OPCIÓN 1: Usando pg_cron (Supabase Pro/Enterprise)
-- ============================================================================
-- Habilitar extensión (requiere plan Pro o superior)
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Programar ejecución cada hora
-- SELECT cron.schedule(
--   'activate-featured-ads',           -- nombre del job
--   '0 * * * *',                        -- cada hora en punto
--   $$SELECT activate_pending_featured_ads();$$
-- );

-- Para ver jobs programados:
-- SELECT * FROM cron.job;

-- Para eliminar un job:
-- SELECT cron.unschedule('activate-featured-ads');

-- ============================================================================
-- OPCIÓN 2: Verificar manualmente (ejecutar cuando sea necesario)
-- ============================================================================
-- Ejecutar manualmente para activar destacados pendientes:
SELECT activate_pending_featured_ads() as destacados_activados;

-- Ver estado actual de destacados:
SELECT 
  status,
  COUNT(*) as cantidad,
  placement
FROM featured_ads
GROUP BY status, placement
ORDER BY status, placement;

-- Ver destacados pendientes que deberían activarse hoy:
SELECT 
  fa.id,
  a.title as aviso,
  fa.placement,
  fa.scheduled_start,
  fa.status,
  u.email as usuario
FROM featured_ads fa
JOIN ads a ON a.id = fa.ad_id
JOIN users u ON u.id = fa.user_id
WHERE fa.status = 'pending'
  AND fa.scheduled_start <= CURRENT_DATE
ORDER BY fa.scheduled_start;

-- Ver destacados activos que deberían expirar:
SELECT 
  fa.id,
  a.title as aviso,
  fa.placement,
  fa.expires_at,
  fa.status
FROM featured_ads fa
JOIN ads a ON a.id = fa.ad_id
WHERE fa.status = 'active'
  AND fa.expires_at < NOW()
ORDER BY fa.expires_at;

-- ============================================================================
-- OPCIÓN 3: Instrucciones para CRON externo
-- ============================================================================
-- Si usas Vercel, Railway, o cualquier servicio con scheduler:
-- 
-- 1. Configura un cron job que llame a:
--    GET https://tu-backend.vercel.app/api/featured-ads/cron
--    
-- 2. Agrega el header de autenticación:
--    X-Cron-Secret: rural24-cron-secret-2026
--    
-- 3. Frecuencia recomendada: cada hora (0 * * * *)
--
-- Ejemplo con curl:
-- curl -X GET "https://api.rural24.com/api/featured-ads/cron" \
--      -H "X-Cron-Secret: rural24-cron-secret-2026"

-- ============================================================================
-- VERIFICACIÓN DE CONFIGURACIÓN
-- ============================================================================

-- Verificar que la función existe:
SELECT 
  proname as funcion,
  prorettype::regtype as tipo_retorno
FROM pg_proc 
WHERE proname = 'activate_pending_featured_ads';

-- Verificar settings de destacados:
SELECT key, value, description 
FROM global_settings 
WHERE category = 'featured';
