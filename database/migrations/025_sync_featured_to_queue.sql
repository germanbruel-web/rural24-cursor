-- ============================================================================
-- MIGRACIÓN 025: Sincronizar Avisos Destacados Existentes
-- Migra los avisos con featured=true a la nueva tabla featured_ads_queue
-- ============================================================================

-- 1. Insertar en featured_ads_queue los avisos que ya están destacados
INSERT INTO featured_ads_queue (
  ad_id,
  category_id,
  user_id,
  requested_at,
  scheduled_start,
  scheduled_end,
  status,
  admin_notes
)
SELECT 
  a.id as ad_id,
  a.category_id,
  a.user_id,
  COALESCE(a.featured_at, a.created_at, NOW()) as requested_at,
  CURRENT_DATE as scheduled_start,
  COALESCE(a.featured_until, CURRENT_DATE + INTERVAL '30 days') as scheduled_end,
  'active' as status,
  'Migrado automáticamente desde ads.featured=true' as admin_notes
FROM ads a
WHERE a.featured = true
  AND a.status = 'active'
  AND NOT EXISTS (
    -- Evitar duplicados si ya existe en la cola
    SELECT 1 FROM featured_ads_queue faq 
    WHERE faq.ad_id = a.id AND faq.status IN ('active', 'scheduled', 'queued')
  );

-- 2. Verificar cuántos se migraron
SELECT 
  'Avisos migrados a featured_ads_queue' as descripcion,
  COUNT(*) as cantidad
FROM featured_ads_queue
WHERE admin_notes = 'Migrado automáticamente desde ads.featured=true';

-- 3. Mostrar el resumen por categoría
SELECT 
  c.display_name as categoria,
  COUNT(*) FILTER (WHERE faq.status = 'active') as activos,
  COUNT(*) FILTER (WHERE faq.status = 'scheduled') as programados,
  COUNT(*) FILTER (WHERE faq.status = 'queued') as en_cola
FROM categories c
LEFT JOIN featured_ads_queue faq ON faq.category_id = c.id
WHERE c.is_active = true
GROUP BY c.id, c.display_name
ORDER BY c.sort_order;
