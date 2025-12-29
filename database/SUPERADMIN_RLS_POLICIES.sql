-- Políticas de seguridad para Gestión de Usuarios (SuperAdmin)
-- Ejecutar en Supabase SQL Editor

-- ================================================
-- POLÍTICAS PARA TABLA USERS
-- ================================================

-- Habilitar RLS si no está habilitado
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 1. Los usuarios pueden ver su propio perfil
DROP POLICY IF EXISTS "Users can view own profile" ON users;
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT
  USING (auth.uid() = id);

-- 2. Los usuarios pueden actualizar su propio perfil
DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE
  USING (auth.uid() = id);

-- 3. Permitir inserción durante registro
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON users;
CREATE POLICY "Enable insert for authenticated users" ON users
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 4. Los SuperAdmins pueden ver TODOS los usuarios
DROP POLICY IF EXISTS "Superadmins can view all users" ON users;
CREATE POLICY "Superadmins can view all users" ON users
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'superadmin'
    )
  );

-- 5. Los SuperAdmins pueden actualizar CUALQUIER usuario (cambiar roles, verificar emails, etc.)
DROP POLICY IF EXISTS "Superadmins can update all users" ON users;
CREATE POLICY "Superadmins can update all users" ON users
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'superadmin'
    )
  );

-- 6. Los SuperAdmins pueden eliminar usuarios (PELIGROSO - usar con cuidado)
DROP POLICY IF EXISTS "Superadmins can delete users" ON users;
CREATE POLICY "Superadmins can delete users" ON users
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'superadmin'
    )
  );

-- ================================================
-- FUNCIÓN HELPER: Verificar si usuario es SuperAdmin
-- ================================================

CREATE OR REPLACE FUNCTION is_superadmin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role = 'superadmin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================
-- VERIFICAR POLÍTICAS CREADAS
-- ================================================

SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'users'
ORDER BY policyname;

-- ================================================
-- TESTING: Verificar que funciona
-- ================================================

-- 1. Verificar cantidad de usuarios
SELECT COUNT(*) as total_users FROM users;

-- 2. Verificar roles
SELECT role, COUNT(*) as count
FROM users
GROUP BY role
ORDER BY role;

-- 3. Ver todos los SuperAdmins
SELECT id, email, full_name, role, created_at
FROM users
WHERE role = 'superadmin';

-- NOTA IMPORTANTE:
-- Las políticas RLS aplican a consultas desde el frontend.
-- Para que el panel de SuperAdmin funcione, el usuario actual
-- debe tener rol 'superadmin' en la tabla users.
