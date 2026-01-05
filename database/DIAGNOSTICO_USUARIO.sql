-- =====================================================
-- DIAGNÓSTICO: Verificar estado del usuario en la BD
-- Ejecutar en Supabase SQL Editor
-- =====================================================

-- 1. Ver todos los usuarios en auth.users (tabla de autenticación)
SELECT 
  id,
  email,
  created_at,
  email_confirmed_at,
  last_sign_in_at
FROM auth.users
WHERE email = 'super@clasify.com';

-- 2. Verificar si existe la tabla public.users
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'users'
) as tabla_users_existe;

-- 3. Ver datos en la tabla public.users (si existe)
SELECT 
  id,
  email,
  role,
  full_name,
  phone,
  business_name,
  created_at,
  updated_at
FROM public.users
WHERE email = 'super@clasify.com';

-- 4. Ver TODOS los usuarios en public.users para comparar
SELECT 
  id,
  email,
  role,
  full_name,
  created_at
FROM public.users
ORDER BY created_at DESC
LIMIT 10;

-- 5. Ver si hay discrepancia entre auth.users y public.users
SELECT 
  a.id as auth_id,
  a.email as auth_email,
  u.id as users_id,
  u.email as users_email,
  u.role
FROM auth.users a
LEFT JOIN public.users u ON a.id = u.id
WHERE a.email = 'super@clasify.com';

-- =====================================================
-- RESULTADO ESPERADO:
-- =====================================================
-- Si todo está bien, deberías ver:
-- - Usuario en auth.users con email confirmado
-- - Usuario en public.users con role = 'superadmin'
-- - Los IDs deben coincidir entre ambas tablas
