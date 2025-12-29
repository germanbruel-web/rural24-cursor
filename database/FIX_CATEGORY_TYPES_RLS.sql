-- =====================================================
-- FIX: RLS Policy para category_types
-- Problema: Policy busca 'super-admin' pero el rol es 'superadmin'
-- Fecha: 21 de diciembre, 2025
-- =====================================================

-- Eliminar policy incorrecta
DROP POLICY IF EXISTS "SuperAdmins manage category_types" ON public.category_types;

-- Crear policy correcta que acepte ambos formatos
CREATE POLICY "SuperAdmins manage category_types" ON public.category_types
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role IN ('superadmin', 'super-admin')
    )
  );

-- Verificar
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd
FROM pg_policies 
WHERE tablename = 'category_types';
