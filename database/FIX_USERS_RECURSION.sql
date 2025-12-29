-- =====================================================
-- ARREGLAR RECURSIÓN INFINITA EN USERS
-- =====================================================

-- 1. Eliminar la política problemática
DROP POLICY IF EXISTS "SuperAdmins manage all users" ON public.users;

-- 2. Crear una función que no cause recursión
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.users 
    WHERE id = auth.uid() 
    AND role = 'super-admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Usar la función en la política (SECURITY DEFINER evita recursión)
CREATE POLICY "SuperAdmins manage all users" ON public.users
  FOR ALL
  USING (is_super_admin());

-- Verificar
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'users';
