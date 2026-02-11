-- ============================================
-- SCRIPT DE VERIFICACIÓN - Sistema de Créditos
-- ============================================
-- Ejecutar después del deploy para validar

\echo '🔍 VERIFICANDO TABLAS...'
SELECT 
  tablename,
  'Existe ✅' as status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('global_config', 'user_credits', 'credit_transactions', 'featured_ads', 'subscription_plans')
ORDER BY tablename;

\echo ''
\echo '🔍 VERIFICANDO CONFIGURACIÓN GLOBAL...'
SELECT 
  category,
  key,
  value_type,
  LEFT(value, 50) as value_preview
FROM public.global_config
ORDER BY category, key;

\echo ''
\echo '🔍 VERIFICANDO FUNCIONES RPC...'
SELECT 
  routine_name as function_name,
  'Disponible ✅' as status
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

\echo ''
\echo '🔍 VERIFICANDO PLANES CON CRÉDITOS...'
SELECT 
  name,
  monthly_free_credits,
  monthly_credits_expire_days,
  is_active
FROM public.subscription_plans
ORDER BY sort_order;

\echo ''
\echo '🔍 ESTADÍSTICAS DEL SISTEMA...'
SELECT 
  'Usuarios con créditos' as metric,
  COUNT(*)::text as value
FROM public.user_credits
UNION ALL
SELECT 
  'Total transacciones',
  COUNT(*)::text
FROM public.credit_transactions
UNION ALL
SELECT 
  'Featured ads activos',
  COUNT(*)::text
FROM public.featured_ads
WHERE status = 'active';

\echo ''
\echo '✅ VERIFICACIÓN COMPLETADA'
