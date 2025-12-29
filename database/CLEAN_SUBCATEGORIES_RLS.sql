-- LIMPIEZA TOTAL Y CONFIGURACIÓN CORRECTA DE SUBCATEGORIES RLS

-- 1. Eliminar TODAS las políticas existentes
DROP POLICY IF EXISTS "SuperAdmins manage subcategories" ON subcategories;
DROP POLICY IF EXISTS "Public read subcategories" ON subcategories;
DROP POLICY IF EXISTS "Todos pueden ver subcategorías" ON subcategories;
DROP POLICY IF EXISTS "Superadmin puede insertar subcategorías" ON subcategories;
DROP POLICY IF EXISTS "Superadmin puede actualizar subcategorías" ON subcategories;
DROP POLICY IF EXISTS "Superadmin puede eliminar subcategorías" ON subcategories;

-- 2. Crear políticas limpias y simples

-- SELECT: Público puede leer
CREATE POLICY "subcategories_public_select"
ON subcategories
FOR SELECT
TO public
USING (true);

-- INSERT: Solo superadmin
CREATE POLICY "subcategories_superadmin_insert"
ON subcategories
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'superadmin'
  )
);

-- UPDATE: Solo superadmin
CREATE POLICY "subcategories_superadmin_update"
ON subcategories
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'superadmin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'superadmin'
  )
);

-- DELETE: Solo superadmin
CREATE POLICY "subcategories_superadmin_delete"
ON subcategories
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'superadmin'
  )
);

-- 3. Verificar resultado
SELECT 
  policyname,
  cmd,
  roles
FROM pg_policies
WHERE tablename = 'subcategories'
ORDER BY cmd, policyname;

-- 4. Verificar tu rol de usuario actual
SELECT id, email, role FROM users WHERE id = auth.uid();
