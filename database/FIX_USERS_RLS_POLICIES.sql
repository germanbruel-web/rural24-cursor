-- =====================================================
-- FIX RLS: USERS TABLE (para JOINs)
-- =====================================================

-- Habilitar RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Public read users" ON public.users;
DROP POLICY IF EXISTS "Users view own profile" ON public.users;
DROP POLICY IF EXISTS "SuperAdmins manage users" ON public.users;

-- SELECT: Todos pueden ver información básica de users (para JOINs de avisos)
CREATE POLICY "Public read basic user info" ON public.users
  FOR SELECT
  USING (true); -- Permite que los JOINs funcionen

-- UPDATE: Solo el usuario puede actualizar su perfil
CREATE POLICY "Users update own profile" ON public.users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ALL: SuperAdmins pueden hacer todo
CREATE POLICY "SuperAdmins manage users" ON public.users
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
