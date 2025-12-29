-- ============================================
-- SCRIPT: Convertir usuario a SuperAdmin
-- ============================================

-- 1. Ver usuarios actuales y sus roles
SELECT 
  id,
  email,
  full_name,
  role,
  created_at
FROM profiles
ORDER BY created_at DESC;

-- 2. Actualizar el usuario más reciente a superadmin
-- (Reemplaza con tu email si quieres ser más específico)
UPDATE profiles
SET role = 'superadmin'
WHERE id = (
  SELECT id 
  FROM profiles 
  ORDER BY created_at DESC 
  LIMIT 1
);

-- 3. Verificar el cambio
SELECT 
  id,
  email,
  full_name,
  role,
  '✅ Ahora es superadmin' as status
FROM profiles
WHERE role = 'superadmin';

-- ============================================
-- ALTERNATIVA: Actualizar por email específico
-- ============================================
-- UPDATE profiles
-- SET role = 'superadmin'
-- WHERE email = 'tu-email@ejemplo.com';
