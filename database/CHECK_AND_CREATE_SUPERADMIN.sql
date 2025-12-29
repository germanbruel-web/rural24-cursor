-- =====================================================
-- VERIFICAR Y CREAR SUPERADMIN
-- =====================================================

-- 1. Ver qué usuarios existen
SELECT 
  id,
  email,
  full_name,
  role,
  created_at
FROM public.users
ORDER BY created_at DESC;

-- 2. Ver qué usuarios de auth existen (Supabase Auth)
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at
FROM auth.users
ORDER BY created_at DESC;

-- 3. OPCIÓN A: Actualizar usuario existente a super-admin
-- Reemplaza 'TU_EMAIL@example.com' con tu email registrado
UPDATE public.users
SET role = 'super-admin'
WHERE email = 'TU_EMAIL@example.com';

-- 4. OPCIÓN B: Crear nuevo superadmin manualmente
-- Primero necesitas registrarte en la app, luego ejecuta:
-- UPDATE public.users SET role = 'super-admin' WHERE email = 'tu@email.com';

-- 5. Verificar el cambio
SELECT 
  id,
  email,
  full_name,
  role,
  created_at
FROM public.users
WHERE role = 'super-admin';
