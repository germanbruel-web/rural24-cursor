-- =====================================================
-- FIX: Permitir a superadmin actualizar CUALQUIER aviso
-- Fecha: 21 Enero 2026
-- =====================================================

-- Primero verificamos si existe una función para detectar superadmin
-- Si no existe, la creamos

CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role IN ('superadmin', 'admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ahora agregamos la política para superadmin en ads UPDATE
DROP POLICY IF EXISTS "ads_update_superadmin" ON ads;

CREATE POLICY "ads_update_superadmin" 
ON ads FOR UPDATE
USING (
  public.is_superadmin()
)
WITH CHECK (
  public.is_superadmin()
);

-- También para DELETE si el superadmin necesita borrar
DROP POLICY IF EXISTS "ads_delete_superadmin" ON ads;

CREATE POLICY "ads_delete_superadmin" 
ON ads FOR DELETE
USING (
  public.is_superadmin()
);

-- Verificar que las políticas se crearon
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'ads'
ORDER BY policyname;
