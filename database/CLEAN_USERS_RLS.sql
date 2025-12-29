-- =====================================================
-- LIMPIAR Y RECREAR POLÍTICAS DE USERS
-- =====================================================

-- 1. ELIMINAR TODAS las políticas existentes de users
DROP POLICY IF EXISTS "Allow insert for new users" ON public.users;
DROP POLICY IF EXISTS "Anon puede ver datos públicos de usuarios" ON public.users;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.users;
DROP POLICY IF EXISTS "Public read basic user info" ON public.users;
DROP POLICY IF EXISTS "Public users are viewable by everyone" ON public.users;
DROP POLICY IF EXISTS "Super admin puede ver todos los usuarios" ON public.users;
DROP POLICY IF EXISTS "SuperAdmins can update all profiles" ON public.users;
DROP POLICY IF EXISTS "SuperAdmins can view all profiles" ON public.users;
DROP POLICY IF EXISTS "SuperAdmins manage users" ON public.users;
DROP POLICY IF EXISTS "Superadmin can view all users" ON public.users;
DROP POLICY IF EXISTS "Superadmins can view all users" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users update own profile" ON public.users;
DROP POLICY IF EXISTS "Usuarios pueden actualizar su propio perfil" ON public.users;
DROP POLICY IF EXISTS "Usuarios pueden ver su propio perfil" ON public.users;
DROP POLICY IF EXISTS "users_insert_own" ON public.users;
DROP POLICY IF EXISTS "users_select_public" ON public.users;
DROP POLICY IF EXISTS "users_update_own" ON public.users;

-- 2. CREAR políticas limpias (usando 'super-admin' consistentemente)

-- SELECT: Todos pueden ver info pública
CREATE POLICY "Public can view users" ON public.users
  FOR SELECT
  USING (true);

-- INSERT: Usuarios autenticados pueden insertarse
CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- UPDATE: Usuarios pueden actualizar su propio perfil
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ALL: SuperAdmins pueden hacer todo (usando 'super-admin')
CREATE POLICY "SuperAdmins manage all users" ON public.users
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() 
      AND u.role = 'super-admin'
    )
  );

-- Verificar
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'users';
