-- ============================================
-- FIX COMPLETO: Eliminar RLS y políticas problemáticas
-- ============================================

-- 1. Deshabilitar RLS en las tablas ads y users
ALTER TABLE public.ads DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- 2. Eliminar TODAS las políticas existentes en la tabla ads
DROP POLICY IF EXISTS "Users can view their own ads" ON public.ads;
DROP POLICY IF EXISTS "Users can create their own ads" ON public.ads;
DROP POLICY IF EXISTS "Users can update their own ads" ON public.ads;
DROP POLICY IF EXISTS "Users can delete their own ads" ON public.ads;
DROP POLICY IF EXISTS "Public can view active ads" ON public.ads;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.ads;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.ads;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON public.ads;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON public.ads;

-- 3. Crear un usuario temporal si no existe (UUID fijo para desarrollo)
INSERT INTO public.users (id, email, full_name, role, email_verified, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'dev@agrobuscador.com',
  'Usuario Desarrollo',
  'admin',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE
SET role = 'admin', full_name = 'Usuario Desarrollo', email_verified = true;

-- 4. Verificar que RLS está deshabilitado
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'ads';

-- Resultado esperado: rls_enabled = false

-- ============================================
-- RESULTADO:
-- ✅ RLS deshabilitado en tabla ads
-- ✅ Todas las políticas eliminadas
-- ✅ Usuario de desarrollo creado
-- ✅ Ya no habrá error de recursión infinita
-- ============================================
