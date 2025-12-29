-- =====================================================
-- FIX: Dynamic Attributes RLS Policies
-- Problema: Role mismatch ('super-admin' vs 'superadmin')
-- Fecha: 2025-12-21
-- =====================================================

-- Eliminar políticas existentes que causan el 406
DROP POLICY IF EXISTS "Public read dynamic_attributes" ON public.dynamic_attributes;
DROP POLICY IF EXISTS "SuperAdmins manage dynamic_attributes" ON public.dynamic_attributes;
DROP POLICY IF EXISTS "Public can view dynamic_attributes" ON public.dynamic_attributes;

-- Habilitar RLS
ALTER TABLE public.dynamic_attributes ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLÍTICAS CORREGIDAS
-- =====================================================

-- SELECT: Todos pueden ver atributos activos (necesario para formularios públicos)
CREATE POLICY "public_read_dynamic_attributes" 
ON public.dynamic_attributes
FOR SELECT
TO public
USING (is_active = true);

-- INSERT: Solo SuperAdmins (rol normalizado)
CREATE POLICY "superadmin_insert_dynamic_attributes" 
ON public.dynamic_attributes
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() 
    AND users.role = 'superadmin'  -- ✅ Sin guión
  )
);

-- UPDATE: Solo SuperAdmins (rol normalizado)
CREATE POLICY "superadmin_update_dynamic_attributes" 
ON public.dynamic_attributes
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() 
    AND users.role = 'superadmin'  -- ✅ Sin guión
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() 
    AND users.role = 'superadmin'  -- ✅ Sin guión
  )
);

-- DELETE: Solo SuperAdmins (rol normalizado)
CREATE POLICY "superadmin_delete_dynamic_attributes" 
ON public.dynamic_attributes
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() 
    AND users.role = 'superadmin'  -- ✅ Sin guión
  )
);

-- =====================================================
-- VERIFICACIÓN
-- =====================================================

-- Ver todas las políticas de dynamic_attributes
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
WHERE tablename = 'dynamic_attributes';

-- =====================================================
-- TESTING (Ejecutar como SuperAdmin)
-- =====================================================

-- Test 1: Verificar que puedes leer
SELECT id, field_label, field_type 
FROM dynamic_attributes 
LIMIT 5;

-- Test 2: Verificar que puedes actualizar
-- UPDATE dynamic_attributes 
-- SET field_label = field_label 
-- WHERE id = 'tu-id-aqui'
-- RETURNING *;

-- =====================================================
-- ROLLBACK (Si algo sale mal)
-- =====================================================
-- DROP POLICY IF EXISTS "public_read_dynamic_attributes" ON public.dynamic_attributes;
-- DROP POLICY IF EXISTS "superadmin_insert_dynamic_attributes" ON public.dynamic_attributes;
-- DROP POLICY IF EXISTS "superadmin_update_dynamic_attributes" ON public.dynamic_attributes;
-- DROP POLICY IF EXISTS "superadmin_delete_dynamic_attributes" ON public.dynamic_attributes;
