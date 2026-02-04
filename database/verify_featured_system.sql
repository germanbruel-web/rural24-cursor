-- ============================================================================
-- VERIFICACIÓN Y REPARACIÓN: Sistema de Destacados
-- ============================================================================
-- Ejecutar en Supabase SQL Editor

-- 1. Verificar si las tablas existen
SELECT 'user_featured_credits' as tabla, EXISTS(
  SELECT 1 FROM information_schema.tables 
  WHERE table_name = 'user_featured_credits'
) as existe
UNION ALL
SELECT 'featured_ads', EXISTS(
  SELECT 1 FROM information_schema.tables 
  WHERE table_name = 'featured_ads'
)
UNION ALL
SELECT 'user_promo_claims', EXISTS(
  SELECT 1 FROM information_schema.tables 
  WHERE table_name = 'user_promo_claims'
);

-- 2. Verificar si las funciones existen
SELECT proname as funcion, 'existe' as estado
FROM pg_proc 
WHERE proname IN (
  'check_promo_status', 
  'claim_promo_credits',
  'check_featured_availability',
  'create_featured_ad',
  'activate_pending_featured_ads'
)
ORDER BY proname;

-- 3. Verificar configuraciones
SELECT key, value 
FROM global_settings 
WHERE key LIKE 'featured%'
ORDER BY key;
