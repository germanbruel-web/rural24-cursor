-- ============================================
-- CONSULTAS PARA VER ESTRUCTURA ACTUAL
-- ============================================

-- 1. Ver todos los usuarios registrados con sus roles
SELECT 
  id,
  email,
  full_name,
  role,
  email_verified,
  created_at
FROM users
ORDER BY created_at DESC
LIMIT 10;

-- 2. Ver específicamente super@clasify.com
SELECT 
  id,
  email,
  full_name,
  role,
  email_verified,
  phone,
  mobile,
  province,
  location,
  created_at,
  updated_at
FROM users
WHERE email = 'super@clasify.com';

-- 3. Ver la estructura de la tabla users
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- 4. Ver todos los roles distintos que existen
SELECT DISTINCT role, COUNT(*) as cantidad
FROM users
GROUP BY role
ORDER BY cantidad DESC;

-- 5. Ver usuarios con rol superadmin (si existen)
SELECT id, email, full_name, role, created_at
FROM users
WHERE role = 'superadmin' OR role = 'super-admin'
ORDER BY created_at;
