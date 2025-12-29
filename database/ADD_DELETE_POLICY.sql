-- ================================================
-- AGREGAR POLÍTICA DE DELETE PARA SUPERADMINS
-- ================================================

-- Eliminar si existe
DROP POLICY IF EXISTS "SuperAdmins can delete ads" ON public.ads;

-- Crear política para DELETE permanente (solo superadmins)
CREATE POLICY "SuperAdmins can delete ads"
ON public.ads FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() 
    AND users.role = 'superadmin'
  )
);

-- Verificar que se creó correctamente
SELECT 
  policyname,
  cmd as operation
FROM pg_policies
WHERE tablename = 'ads' AND cmd = 'DELETE';
