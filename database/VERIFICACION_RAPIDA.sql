-- =====================================================
-- SCRIPT DE VERIFICACIÓN RÁPIDA
-- =====================================================
-- Ejecuta este script para verificar que todo está configurado correctamente

-- 1. Verificar estructura de ads
SELECT 
  'ads_structure' as check_name,
  COUNT(*) as total_columns,
  CASE 
    WHEN COUNT(*) >= 7 THEN '✅ OK'
    ELSE '❌ FALTAN COLUMNAS'
  END as status
FROM information_schema.columns 
WHERE table_name = 'ads' 
  AND column_name IN ('operation_type_id', 'category_id', 'subcategory_id', 'brand_id', 'model_id', 'dynamic_fields', 'phone');

-- 2. Verificar tabla ad_images
SELECT 
  'ad_images_table' as check_name,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ad_images')
    THEN '✅ OK'
    ELSE '❌ NO EXISTE'
  END as status;

-- 3. Verificar bucket ads-images
SELECT 
  'storage_bucket' as check_name,
  CASE 
    WHEN EXISTS (SELECT 1 FROM storage.buckets WHERE name = 'ads-images')
    THEN '✅ OK - Bucket creado'
    ELSE '❌ NO EXISTE - Crear bucket'
  END as status;

-- 4. Verificar que bucket es público
SELECT 
  'bucket_is_public' as check_name,
  CASE 
    WHEN EXISTS (SELECT 1 FROM storage.buckets WHERE name = 'ads-images' AND public = true)
    THEN '✅ OK - Bucket público'
    ELSE '❌ ERROR - Bucket debe ser público'
  END as status;

-- 5. Verificar operation_types
SELECT 
  'operation_types' as check_name,
  COUNT(*) as total,
  CASE 
    WHEN COUNT(*) >= 4 THEN '✅ OK'
    ELSE '❌ EJECUTAR SEED'
  END as status
FROM operation_types;

-- 6. Verificar categories
SELECT 
  'categories' as check_name,
  COUNT(*) as total,
  CASE 
    WHEN COUNT(*) >= 5 THEN '✅ OK'
    ELSE '❌ EJECUTAR SEED'
  END as status
FROM categories;

-- 7. Verificar subcategories
SELECT 
  'subcategories' as check_name,
  COUNT(*) as total,
  CASE 
    WHEN COUNT(*) >= 40 THEN '✅ OK'
    ELSE '❌ EJECUTAR SEED'
  END as status
FROM subcategories;

-- 8. Verificar brands
SELECT 
  'brands' as check_name,
  COUNT(*) as total,
  CASE 
    WHEN COUNT(*) >= 30 THEN '✅ OK'
    ELSE '⚠️ POCAS MARCAS - Ejecutar SEED_MARCAS_COMPLETAS.sql'
  END as status
FROM brands;

-- 9. Verificar policies de ads
SELECT 
  'ads_policies' as check_name,
  COUNT(*) as total_policies,
  CASE 
    WHEN COUNT(*) >= 4 THEN '✅ OK'
    ELSE '❌ FALTAN POLICIES'
  END as status
FROM pg_policies 
WHERE tablename = 'ads';

-- 10. Verificar policies de ad_images
SELECT 
  'ad_images_policies' as check_name,
  COUNT(*) as total_policies,
  CASE 
    WHEN COUNT(*) >= 3 THEN '✅ OK'
    ELSE '❌ FALTAN POLICIES'
  END as status
FROM pg_policies 
WHERE tablename = 'ad_images';

-- 11. Verificar índice GIN en dynamic_fields
SELECT 
  'dynamic_fields_index' as check_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE tablename = 'ads' 
      AND indexname = 'idx_ads_dynamic_fields'
    )
    THEN '✅ OK - Índice GIN creado'
    ELSE '❌ NO EXISTE - Ejecutar migración 007'
  END as status;

-- 12. Verificar vista ads_full_view
SELECT 
  'ads_full_view' as check_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.views 
      WHERE table_name = 'ads_full_view'
    )
    THEN '✅ OK - Vista creada'
    ELSE '❌ NO EXISTE'
  END as status;

-- =====================================================
-- RESUMEN FINAL
-- =====================================================
SELECT 
  '========== RESUMEN ==========' as resumen,
  '' as detalle
UNION ALL
SELECT 
  'Total checks:' as resumen,
  '12' as detalle
UNION ALL
SELECT 
  'Si todos muestran ✅ OK:' as resumen,
  'El sistema está listo' as detalle
UNION ALL
SELECT 
  'Si hay ❌:' as resumen,
  'Seguir instrucciones en EJECUTAR_SETUP_COMPLETO.md' as detalle;
