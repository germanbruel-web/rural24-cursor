-- =====================================================
-- DIAGNOSTICAR ERRORES 500
-- =====================================================

-- 1. Ver todas las políticas en users (pueden estar duplicadas)
SELECT 
  policyname, 
  cmd,
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies 
WHERE tablename = 'users'
ORDER BY policyname;

-- 2. Ver políticas en categories
SELECT 
  policyname, 
  cmd
FROM pg_policies 
WHERE tablename = 'categories'
ORDER BY policyname;

-- 3. Ver políticas en banners
SELECT 
  policyname, 
  cmd
FROM pg_policies 
WHERE tablename = 'banners'
ORDER BY policyname;

-- 4. SOLUCIÓN TEMPORAL: Deshabilitar RLS para diagnóstico
-- Solo ejecutar si quieres saltarte RLS temporalmente
-- ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.categories DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.banners DISABLE ROW LEVEL SECURITY;
