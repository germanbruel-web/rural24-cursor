-- ============================================
-- FIX RÁPIDO: Deshabilitar RLS para desarrollo
-- ============================================
-- Ejecutar este script si tienes el error:
-- "infinite recursion detected in policy for relation users"

-- Este script simplemente deshabilita RLS en la tabla ads
-- permitiendo crear avisos sin autenticación durante desarrollo

ALTER TABLE public.ads DISABLE ROW LEVEL SECURITY;

-- Verificar que RLS está deshabilitado
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'ads';

-- Resultado esperado: rls_enabled = false

-- ============================================
-- Para volver a habilitar RLS (PRODUCCIÓN):
-- ============================================
-- ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;
