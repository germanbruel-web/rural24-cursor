-- Verificación de migración 048: Sistema Unificado de Destacados

-- 1. Verificar columna is_manual
SELECT 
  column_name, 
  data_type, 
  column_default,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'featured_ads' 
  AND column_name = 'is_manual';

-- 2. Verificar funciones creadas
SELECT 
  routine_name,
  routine_type,
  data_type as return_type
FROM information_schema.routines 
WHERE routine_name IN (
  'get_featured_for_homepage',
  'get_featured_for_results', 
  'get_featured_for_detail',
  'activate_pending_featured_ads'
)
ORDER BY routine_name;

-- 3. Verificar índice
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'featured_ads'
  AND indexname = 'idx_featured_ads_is_manual';

-- 4. Estado actual de featured_ads
SELECT 
  placement,
  CASE 
    WHEN is_manual THEN 'SuperAdmin'
    ELSE 'Usuario Pago'
  END as origen,
  status,
  COUNT(*) as cantidad
FROM featured_ads
GROUP BY placement, is_manual, status
ORDER BY placement, is_manual, status;

-- 5. Prueba de función (si hay datos)
-- Descomentar para probar con una categoría real
-- SELECT * FROM get_featured_for_homepage('TU_CATEGORIA_UUID'::UUID, 10);
