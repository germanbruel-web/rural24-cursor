-- ============================================
-- FIX: Actualizar constraint de roles en tabla users
-- Problema: role_check no permite 'basic'
-- ============================================

-- PASO 1: Ver el constraint actual
SELECT
  con.conname AS constraint_name,
  pg_get_constraintdef(con.oid) AS constraint_definition
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
WHERE rel.relname = 'users'
  AND nsp.nspname = 'public'
  AND con.contype = 'c'
  AND con.conname LIKE '%role%';

-- PASO 2: Eliminar el constraint viejo si existe
ALTER TABLE public.users 
DROP CONSTRAINT IF EXISTS users_role_check;

-- PASO 3: Crear el nuevo constraint con todos los roles permitidos
ALTER TABLE public.users
ADD CONSTRAINT users_role_check
CHECK (role IN ('free', 'basic', 'premium', 'superadmin', 'verified', 'admin'));

-- PASO 4: Verificar que se creó correctamente
SELECT
  con.conname AS constraint_name,
  pg_get_constraintdef(con.oid) AS constraint_definition
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
WHERE rel.relname = 'users'
  AND nsp.nspname = 'public'
  AND con.contype = 'c'
  AND con.conname = 'users_role_check';

-- PASO 5: Verificar todos los roles actuales en la tabla
SELECT role, COUNT(*) as count
FROM users
GROUP BY role
ORDER BY count DESC;
