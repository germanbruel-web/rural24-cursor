-- 1. Ver las políticas actuales de subcategories
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
WHERE tablename = 'subcategories';

-- 2. Habilitar RLS si no está habilitado
ALTER TABLE subcategories ENABLE ROW LEVEL SECURITY;

-- 3. Eliminar políticas conflictivas (si existen)
DROP POLICY IF EXISTS "Superadmin puede insertar subcategorías" ON subcategories;
DROP POLICY IF EXISTS "Superadmin puede actualizar subcategorías" ON subcategories;
DROP POLICY IF EXISTS "Superadmin puede eliminar subcategorías" ON subcategories;
DROP POLICY IF EXISTS "Todos pueden ver subcategorías activas" ON subcategories;

-- 4. CREAR POLÍTICAS CORRECTAS

-- 4a. Permitir SELECT a todos (para ver subcategorías en frontend)
CREATE POLICY "Todos pueden ver subcategorías"
ON subcategories
FOR SELECT
TO public
USING (true);

-- 4b. Solo superadmin puede INSERT
CREATE POLICY "Superadmin puede insertar subcategorías"
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

-- 4c. Solo superadmin puede UPDATE
CREATE POLICY "Superadmin puede actualizar subcategorías"
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

-- 4d. Solo superadmin puede DELETE
CREATE POLICY "Superadmin puede eliminar subcategorías"
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

-- 5. Verificar que las políticas se crearon correctamente
SELECT 
  policyname,
  cmd,
  roles
FROM pg_policies
WHERE tablename = 'subcategories'
ORDER BY cmd, policyname;
