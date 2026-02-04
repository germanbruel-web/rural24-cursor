-- Verificar que las funciones de promoción existen
SELECT 
  proname as funcion,
  pronargs as num_args
FROM pg_proc 
WHERE proname IN ('check_promo_status', 'claim_promo_credits')
ORDER BY proname;

-- Verificar configuración de promoción
SELECT key, value, is_public 
FROM global_settings 
WHERE key LIKE 'featured_promo%'
ORDER BY key;

-- Verificar que la tabla existe
SELECT COUNT(*) as claims_count FROM user_promo_claims;
