-- ============================================================================
-- MIGRACIÓN 045: Unificar configuraciones de Destacados
-- ============================================================================
-- Fecha: 2026-02-04
-- Descripción: Limpia configuraciones duplicadas del sistema antiguo
--              y unifica en el nuevo sistema de créditos
-- ============================================================================

-- ============================================================================
-- 1. ELIMINAR CONFIGURACIONES DUPLICADAS DEL SISTEMA ANTIGUO
-- ============================================================================

-- Estas configuraciones ya no se usan (reemplazadas por sistema de créditos)
DELETE FROM global_settings 
WHERE key IN (
  'featured_min_days',        -- Reemplazado por featured_duration_days (fijo 15)
  'featured_max_days',        -- Reemplazado por featured_duration_days (fijo 15)
  'featured_price_per_day'    -- Reemplazado por featured_credit_price
);

-- featured_max_per_category se mantiene para superadmin
-- featured_slots_homepage se usa para sistema de usuarios
-- Son complementarios, no duplicados

-- ============================================================================
-- 2. ACTUALIZAR homepage_featured_ads_limit para que coincida
-- ============================================================================
-- Este valor controla cuántos avisos carga FeaturedAdsSection
-- Lo sincronizamos con featured_slots_homepage

UPDATE global_settings 
SET value = '10'::jsonb,
    description = 'Cantidad máxima de avisos destacados por categoría en HomePage (sincronizado con featured_slots_homepage)'
WHERE key = 'homepage_featured_ads_limit';

-- ============================================================================
-- 3. CONFIGURACIÓN FINAL UNIFICADA
-- ============================================================================
-- Valores finales del sistema:
--
-- SISTEMA SUPERADMIN (featured_ads_queue):
--   - featured_max_per_category: 10 (máx por categoría)
--   - homepage_featured_ads_limit: 10 (cuántos mostrar)
--
-- SISTEMA USUARIOS (featured_ads + user_featured_credits):
--   - featured_slots_homepage: 10 (slots por categoría)
--   - featured_slots_results: 4 (slots en resultados)
--   - featured_slots_detail: 6 (slots en detalle)
--   - featured_duration_days: 15 (duración fija)
--   - featured_credit_price: 2500 (precio 1 crédito)
--   - featured_credit_pack_5_price: 10000 (pack 5)
--   - featured_credit_pack_10_price: 18000 (pack 10)

-- ============================================================================
-- 4. VERIFICACIÓN
-- ============================================================================
SELECT 
  key,
  value,
  category,
  description
FROM global_settings 
WHERE category = 'featured'
   OR key LIKE 'featured_%'
   OR key LIKE 'homepage_featured%'
ORDER BY key;
