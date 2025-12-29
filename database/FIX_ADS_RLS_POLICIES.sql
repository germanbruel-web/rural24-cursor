-- =====================================================
-- FIX RLS POLICIES FOR ADS TABLE
-- =====================================================
-- Este archivo corrige las políticas RLS para permitir
-- acceso correcto a la tabla ads

-- 1. Eliminar políticas existentes (TODAS)
DROP POLICY IF EXISTS "Users can view their own ads" ON public.ads;
DROP POLICY IF EXISTS "Public can view approved ads" ON public.ads;
DROP POLICY IF EXISTS "SuperAdmins can view all ads" ON public.ads;
DROP POLICY IF EXISTS "SuperAdmins can moderate ads" ON public.ads;
DROP POLICY IF EXISTS "Users can update their own ads" ON public.ads;
DROP POLICY IF EXISTS "SuperAdmins can delete ads" ON public.ads;
DROP POLICY IF EXISTS ads_select_active ON public.ads;
DROP POLICY IF EXISTS ads_select_own ON public.ads;
DROP POLICY IF EXISTS ads_insert_premium ON public.ads;
DROP POLICY IF EXISTS ads_update_own ON public.ads;
DROP POLICY IF EXISTS ads_delete_own ON public.ads;
DROP POLICY IF EXISTS ads_superadmin_all ON public.ads;
-- Nuevas políticas
DROP POLICY IF EXISTS "Users can view own ads" ON public.ads;
DROP POLICY IF EXISTS "Authenticated users can view approved ads" ON public.ads;
DROP POLICY IF EXISTS "SuperAdmins view all ads" ON public.ads;
DROP POLICY IF EXISTS "Authenticated users can insert ads" ON public.ads;
DROP POLICY IF EXISTS "Users can update own ads" ON public.ads;
DROP POLICY IF EXISTS "SuperAdmins can update all ads" ON public.ads;
DROP POLICY IF EXISTS "Users can delete own ads" ON public.ads;
DROP POLICY IF EXISTS "SuperAdmins can delete all ads" ON public.ads;

-- 2. Crear políticas nuevas más permisivas

-- SELECT: Usuarios pueden ver sus propios avisos
CREATE POLICY "Users can view own ads" ON public.ads
  FOR SELECT
  USING (auth.uid() = user_id);

-- SELECT: Usuarios autenticados pueden ver avisos aprobados y activos
CREATE POLICY "Authenticated users can view approved ads" ON public.ads
  FOR SELECT
  USING (
    (auth.role() = 'authenticated' AND approval_status = 'approved' AND status = 'active')
    OR auth.uid() = user_id
  );

-- SELECT: Usuarios anónimos pueden ver avisos aprobados (para página de detalle pública)
CREATE POLICY "Public can view approved ads" ON public.ads
  FOR SELECT
  USING (approval_status = 'approved' AND status = 'active');

-- SELECT: SuperAdmins pueden ver todos los avisos
CREATE POLICY "SuperAdmins view all ads" ON public.ads
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role = 'super-admin'
    )
  );

-- INSERT: Usuarios autenticados pueden crear avisos
CREATE POLICY "Authenticated users can insert ads" ON public.ads
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: Usuarios pueden actualizar sus propios avisos
CREATE POLICY "Users can update own ads" ON public.ads
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: SuperAdmins pueden actualizar cualquier aviso
CREATE POLICY "SuperAdmins can update all ads" ON public.ads
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role = 'super-admin'
    )
  );

-- DELETE: Usuarios pueden eliminar sus propios avisos
CREATE POLICY "Users can delete own ads" ON public.ads
  FOR DELETE
  USING (auth.uid() = user_id);

-- DELETE: SuperAdmins pueden eliminar cualquier aviso
CREATE POLICY "SuperAdmins can delete all ads" ON public.ads
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role = 'super-admin'
    )
  );

-- 3. Verificar políticas
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
WHERE tablename = 'ads'
ORDER BY policyname;
