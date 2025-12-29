-- =====================================================
-- VER Y ACTUALIZAR CONSTRAINT DE ROLES
-- =====================================================

-- 1. Ver el constraint actual
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conname = 'users_role_check';

-- 2. ELIMINAR el constraint viejo
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;

-- 3. CREAR constraint nuevo con todos los roles
ALTER TABLE public.users 
ADD CONSTRAINT users_role_check 
CHECK (role IN ('free', 'premium', 'admin', 'super-admin', 'superadmin', 'adminscrap'));

-- 4. Ahora sí, actualizar a super-admin
UPDATE public.users
SET role = 'super-admin'
WHERE email = 'super@clasify.com';

-- 5. Verificar
SELECT 
  id,
  email,
  full_name,
  role
FROM public.users
WHERE email = 'super@clasify.com';
