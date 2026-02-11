-- ============================================
-- VERIFICACIÓN PRE-MIGRACIÓN: Sistema de Créditos
-- Ejecutar ANTES de aplicar 044_credits_system_ADAPTED.sql
-- ============================================

-- ============================================
-- 1. VERIFICAR TABLAS EXISTENTES
-- ============================================
SELECT 
  'TABLAS EXISTENTES' as check_type,
  table_name,
  CASE 
    WHEN table_name IN ('global_config', 'user_credits', 'credit_transactions', 'featured_ads')
    THEN '✅ EXISTE'
    ELSE '❌ NO EXISTE'
  END as status
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('global_config', 'user_credits', 'credit_transactions', 'featured_ads')
ORDER BY table_name;

-- Contar registros si existen
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'global_config') THEN
    RAISE NOTICE 'global_config: % registros', (SELECT COUNT(*) FROM global_config);
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_credits') THEN
    RAISE NOTICE 'user_credits: % registros', (SELECT COUNT(*) FROM user_credits);
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'credit_transactions') THEN
    RAISE NOTICE 'credit_transactions: % registros', (SELECT COUNT(*) FROM credit_transactions);
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'featured_ads') THEN
    RAISE NOTICE 'featured_ads: % registros', (SELECT COUNT(*) FROM featured_ads);
  END IF;
END $$;

-- ============================================
-- 2. VERIFICAR COLUMNAS EN subscription_plans
-- ============================================
SELECT 
  'COLUMNAS subscription_plans' as check_type,
  column_name,
  data_type,
  '✅ EXISTE' as status
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'subscription_plans'
  AND column_name IN ('slug', 'monthly_free_credits', 'monthly_credits_expire_days')
ORDER BY column_name;

-- ============================================
-- 3. VERIFICAR FUNCIONES RPC
-- ============================================
SELECT 
  'FUNCIONES RPC' as check_type,
  routine_name,
  '✅ EXISTE' as status
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'activate_featured_with_credits',
    'purchase_credits',
    'grant_signup_promo',
    'grant_monthly_credits',
    'expire_featured_ads',
    'get_featured_by_category',
    'get_user_featured_ads',
    'get_credit_transactions'
  )
ORDER BY routine_name;

-- ============================================
-- 4. VERIFICAR POLICIES (RLS)
-- ============================================
SELECT 
  'POLICIES' as check_type,
  tablename,
  policyname,
  '✅ EXISTE' as status
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('user_credits', 'credit_transactions', 'featured_ads')
ORDER BY tablename, policyname;

-- ============================================
-- 5. VERIFICAR ÍNDICES
-- ============================================
SELECT 
  'ÍNDICES' as check_type,
  tablename,
  indexname,
  '✅ EXISTE' as status
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('global_config', 'user_credits', 'credit_transactions', 'featured_ads')
ORDER BY tablename, indexname;

-- ============================================
-- 6. VERIFICAR CONFIGURACIÓN EN global_config
-- ============================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'global_config') THEN
    RAISE NOTICE '=== CONFIGURACIÓN GLOBAL ===';
    PERFORM pg_sleep(0.1);
  END IF;
END $$;

SELECT 
  'CONFIG global_config' as check_type,
  key,
  value,
  value_type,
  category
FROM global_config
WHERE category IN ('credits', 'featured', 'promo')
ORDER BY category, key;

-- ============================================
-- 7. RESUMEN EJECUTIVO
-- ============================================
SELECT 
  'RESUMEN' as type,
  (SELECT COUNT(*) FROM information_schema.tables 
   WHERE table_name IN ('global_config', 'user_credits', 'credit_transactions', 'featured_ads')) as tablas_creadas,
  (SELECT COUNT(*) FROM information_schema.columns 
   WHERE table_name = 'subscription_plans' 
   AND column_name IN ('slug', 'monthly_free_credits', 'monthly_credits_expire_days')) as columnas_agregadas,
  (SELECT COUNT(*) FROM information_schema.routines 
   WHERE routine_name IN ('activate_featured_with_credits', 'purchase_credits', 'grant_signup_promo')) as funciones_creadas,
  (SELECT COUNT(*) FROM pg_policies 
   WHERE tablename IN ('user_credits', 'credit_transactions', 'featured_ads')) as policies_creadas;

-- ============================================
-- 8. RECOMENDACIÓN
-- ============================================
DO $$
DECLARE
  v_tablas INT;
  v_funciones INT;
  v_policies INT;
BEGIN
  SELECT COUNT(*) INTO v_tablas
  FROM information_schema.tables 
  WHERE table_name IN ('global_config', 'user_credits', 'credit_transactions', 'featured_ads');
  
  SELECT COUNT(*) INTO v_funciones
  FROM information_schema.routines 
  WHERE routine_name LIKE '%credit%' OR routine_name LIKE '%featured%';
  
  SELECT COUNT(*) INTO v_policies
  FROM pg_policies 
  WHERE tablename IN ('user_credits', 'credit_transactions', 'featured_ads');
  
  RAISE NOTICE '================================================';
  RAISE NOTICE 'DIAGNÓSTICO COMPLETADO';
  RAISE NOTICE '================================================';
  RAISE NOTICE 'Tablas existentes: % de 4', v_tablas;
  RAISE NOTICE 'Funciones existentes: % (esperadas ~10)', v_funciones;
  RAISE NOTICE 'Policies existentes: % (esperadas 5)', v_policies;
  RAISE NOTICE '';
  
  IF v_tablas = 4 AND v_funciones >= 8 AND v_policies >= 3 THEN
    RAISE NOTICE '✅ SISTEMA YA INSTALADO (parcial o completo)';
    RAISE NOTICE '📋 Recomendación: Ejecutar 044_credits_system_SAFE.sql (versión con IF NOT EXISTS)';
  ELSIF v_tablas > 0 OR v_funciones > 0 OR v_policies > 0 THEN
    RAISE NOTICE '⚠️ INSTALACIÓN PARCIAL DETECTADA';
    RAISE NOTICE '📋 Recomendación: Ejecutar 044_credits_system_SAFE.sql';
  ELSE
    RAISE NOTICE '🆕 SISTEMA NO INSTALADO';
    RAISE NOTICE '📋 Recomendación: Ejecutar 044_credits_system_ADAPTED.sql normal';
  END IF;
  RAISE NOTICE '================================================';
END $$;
