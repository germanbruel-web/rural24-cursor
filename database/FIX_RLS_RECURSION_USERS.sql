-- =====================================================
-- FIX: Recursión Infinita en Políticas RLS de USERS
-- =====================================================
-- PROBLEMA: Las políticas verifican role consultando users,
--           lo que causa recursión infinita.
-- SOLUCIÓN: Usar auth.jwt() para leer rol desde JWT token
--           (sin consultar la tabla users).
-- =====================================================

-- PASO 1: Eliminar todas las políticas existentes de users
DROP POLICY IF EXISTS "users_all_superadmin" ON users;
DROP POLICY IF EXISTS "users_insert_own" ON users;
DROP POLICY IF EXISTS "users_select_policy" ON users;
DROP POLICY IF EXISTS "users_superadmin_all" ON users;
DROP POLICY IF EXISTS "users_update_own" ON users;
DROP POLICY IF EXISTS "users_update_policy" ON users;
DROP POLICY IF EXISTS "users_view_all_superadmin" ON users;
DROP POLICY IF EXISTS "users_view_own" ON users;
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "users_select_own" ON users;
DROP POLICY IF EXISTS "users_select_superadmin" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON users;

-- PASO 2: Crear políticas SIN recursión (usando auth.jwt() directamente)

-- Policy 1: Users pueden ver su propio perfil
CREATE POLICY "users_view_own" 
ON users FOR SELECT
USING (auth.uid() = id);

-- Policy 2: SuperAdmins pueden ver todos los perfiles (leyendo JWT directamente)
CREATE POLICY "users_view_all_superadmin" 
ON users FOR SELECT
USING (
  COALESCE(
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'superadmin',
    false
  )
);

-- Policy 3: Users pueden actualizar su propio perfil
CREATE POLICY "users_update_own" 
ON users FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Policy 4: Permitir inserción durante registro
CREATE POLICY "users_insert_own" 
ON users FOR INSERT
WITH CHECK (auth.uid() = id);

-- Policy 5: SuperAdmin puede hacer TODO (leyendo JWT directamente)
CREATE POLICY "users_all_superadmin" 
ON users FOR ALL
USING (
  COALESCE(
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'superadmin',
    false
  )
);

-- =====================================================
-- VERIFICACIÓN
-- =====================================================

-- Ver todas las políticas de users
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'users'
ORDER BY policyname;

-- Test queries (deben funcionar sin recursión)
-- SELECT * FROM users WHERE id = auth.uid(); -- Ver mi perfil
-- SELECT COUNT(*) FROM users; -- Solo si eres superadmin
