-- ============================================================
-- FASE 1: MIGRACIÓN featured_ads_queue → featured_ads
-- Fecha: 2026-02-16
-- Descripción: Migra 9 registros que solo existen en queue,
--              marca duplicados como migrados, sincroniza ads.
-- ============================================================
-- INSTRUCCIONES:
-- 1. Ejecutar PASO 1 (verificación pre-migración) - solo lectura
-- 2. Confirmar que los conteos coinciden
-- 3. Ejecutar PASO 2 (migración) - dentro de transacción
-- 4. Ejecutar PASO 3 (verificación post-migración)
-- ============================================================

-- ============================================================
-- PASO 1: VERIFICACIÓN PRE-MIGRACIÓN (solo lectura)
-- ============================================================
-- Ejecuta esto PRIMERO para confirmar que todo está como esperamos

-- 1A: Contar registros queue-only (esperado: 9)
SELECT 'queue_only' as check_name,
       COUNT(*) as count
FROM featured_ads_queue q
WHERE q.status = 'active'
  AND NOT EXISTS (
    SELECT 1 FROM featured_ads f
    WHERE f.ad_id = q.ad_id AND f.status = 'active'
  );

-- 1B: Contar duplicados queue+featured (esperado: 5)
SELECT 'duplicates' as check_name,
       COUNT(*) as count
FROM featured_ads_queue q
WHERE q.status = 'active'
  AND EXISTS (
    SELECT 1 FROM featured_ads f
    WHERE f.ad_id = q.ad_id AND f.status = 'active'
  );

-- 1C: Phantom ads - featured=true sin registro en ninguna tabla (esperado: 0 o 1)
SELECT 'phantom_ads' as check_name,
       COUNT(*) as count
FROM ads a
WHERE a.featured = true
  AND NOT EXISTS (SELECT 1 FROM featured_ads f WHERE f.ad_id = a.id AND f.status = 'active')
  AND NOT EXISTS (SELECT 1 FROM featured_ads_queue q WHERE q.ad_id = a.id AND q.status = 'active');


-- ============================================================
-- PASO 2: MIGRACIÓN (ejecutar como bloque completo)
-- ============================================================
-- ⚠️  EJECUTAR SOLO DESPUÉS DE CONFIRMAR PASO 1

BEGIN;

-- 2A: Insertar los 9 registros de queue en featured_ads
INSERT INTO featured_ads (
  ad_id,
  user_id,
  placement,
  category_id,
  scheduled_start,
  actual_start,
  expires_at,
  duration_days,
  status,
  priority,
  credit_consumed,
  created_at,
  updated_at,
  is_manual,
  requires_payment,
  admin_notes
)
SELECT
  q.ad_id,
  q.user_id,
  'homepage'::varchar(20) AS placement,
  q.category_id,
  COALESCE(q.scheduled_start, q.requested_at::date) AS scheduled_start,
  COALESCE(q.scheduled_start, q.requested_at)::timestamptz AS actual_start,
  CASE
    WHEN q.scheduled_end IS NOT NULL THEN q.scheduled_end::timestamptz
    ELSE (COALESCE(q.scheduled_start, q.requested_at::date) + INTERVAL '30 days')::timestamptz
  END AS expires_at,
  CASE
    WHEN q.scheduled_end IS NOT NULL
      THEN (q.scheduled_end - COALESCE(q.scheduled_start, q.requested_at::date))
    ELSE 30
  END AS duration_days,
  'active'::varchar(20) AS status,
  0 AS priority,
  false AS credit_consumed,
  q.created_at,
  NOW() AS updated_at,
  true AS is_manual,
  false AS requires_payment,
  'Migrado desde featured_ads_queue el 2026-02-16 (Phase 1 unificación)' AS admin_notes
FROM featured_ads_queue q
WHERE q.status = 'active'
  AND NOT EXISTS (
    SELECT 1 FROM featured_ads f
    WHERE f.ad_id = q.ad_id AND f.status = 'active'
  );

-- 2B: Marcar TODOS los registros activos del queue como 'completed'
-- (tanto los 9 migrados como los 5 duplicados)
-- Nota: CHECK constraint solo permite: queued/scheduled/active/completed/cancelled/expired
UPDATE featured_ads_queue
SET status = 'completed',
    admin_notes = COALESCE(admin_notes || ' | ', '') || 'Migrado a featured_ads el 2026-02-16',
    updated_at = NOW()
WHERE status = 'active';

-- 2C: Sincronizar ads.featured y ads.featured_until
-- para todos los anuncios que tienen un featured_ads activo
UPDATE ads
SET featured = true,
    featured_until = f.expires_at
FROM featured_ads f
WHERE ads.id = f.ad_id
  AND f.status = 'active'
  AND (ads.featured IS DISTINCT FROM true
       OR ads.featured_until IS DISTINCT FROM f.expires_at);

-- 2D: Limpiar phantom ads (featured=true sin registro activo)
UPDATE ads
SET featured = false,
    featured_until = NULL
WHERE featured = true
  AND NOT EXISTS (
    SELECT 1 FROM featured_ads f
    WHERE f.ad_id = ads.id AND f.status = 'active'
  );

-- 2E: Expirar registros vencidos en featured_ads
-- (scheduled_end ya pasó pero siguen como 'active')
UPDATE featured_ads
SET status = 'expired',
    updated_at = NOW()
WHERE status = 'active'
  AND expires_at IS NOT NULL
  AND expires_at < NOW();

-- 2F: Para los expirados en 2E, también actualizar ads
UPDATE ads
SET featured = false,
    featured_until = NULL
WHERE featured = true
  AND NOT EXISTS (
    SELECT 1 FROM featured_ads f
    WHERE f.ad_id = ads.id AND f.status = 'active'
  );

-- 2G: Registrar en auditoría
-- Nota: CHECK constraint solo permite: created/activated/cancelled/expired/refunded/edited
INSERT INTO featured_ads_audit (
  action,
  reason,
  metadata,
  created_at
)
VALUES (
  'edited',
  'Phase 1 migration: 9 registros de queue → featured_ads, 14 queue marcados como completed, phantom ads limpiados',
  jsonb_build_object(
    'migration_date', '2026-02-16',
    'queue_records_migrated', 9,
    'queue_records_marked', 14,
    'source', 'ROADMAP Phase 1'
  ),
  NOW()
);

COMMIT;


-- ============================================================
-- PASO 3: VERIFICACIÓN POST-MIGRACIÓN (solo lectura)
-- ============================================================
-- Ejecuta esto DESPUÉS de la migración para confirmar

-- 3A: No deben quedar registros activos en queue (esperado: 0)
SELECT 'queue_active_remaining' as check_name,
       COUNT(*) as count
FROM featured_ads_queue
WHERE status = 'active';

-- 3B: Total de featured_ads activos (esperado: ~30-34)
SELECT 'featured_ads_active' as check_name,
       COUNT(*) as count
FROM featured_ads
WHERE status = 'active';

-- 3C: Consistencia ads.featured vs featured_ads
-- Debe dar 0 (no hay desincronizados)
SELECT 'desync_featured_true_no_record' as check_name,
       COUNT(*) as count
FROM ads a
WHERE a.featured = true
  AND NOT EXISTS (
    SELECT 1 FROM featured_ads f
    WHERE f.ad_id = a.id AND f.status = 'active'
  );

-- 3D: Registros migrados (completed) en queue (esperado: 14)
SELECT 'queue_completed' as check_name,
       COUNT(*) as count
FROM featured_ads_queue
WHERE status = 'completed';

-- 3E: Los 9 recién migrados con sus datos
SELECT
  fa.ad_id,
  fa.placement,
  fa.scheduled_start,
  fa.expires_at,
  fa.duration_days,
  fa.status,
  fa.admin_notes
FROM featured_ads fa
WHERE fa.admin_notes LIKE '%Migrado desde featured_ads_queue%'
ORDER BY fa.scheduled_start;
