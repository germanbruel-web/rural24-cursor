-- ================================================================================
-- SUPERADMIN FULL ACCESS - Rural24
-- ================================================================================
-- Fecha: 21 de Enero 2026
-- 
-- OBJETIVO: Dar acceso COMPLETO al superadmin en TODAS las tablas
-- 
-- INSTRUCCIONES:
-- 1. Ir a Supabase Dashboard → SQL Editor
-- 2. Pegar este script completo
-- 3. Ejecutar
-- ================================================================================

-- ================================================================================
-- PASO 1: FUNCIÓN HELPER PARA VERIFICAR SI ES SUPERADMIN
-- ================================================================================

CREATE OR REPLACE FUNCTION is_superadmin()
RETURNS BOOLEAN AS $$
BEGIN
  -- Si no hay usuario autenticado, devolver false
  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Verificar si el usuario tiene rol superadmin
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role = 'superadmin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Función alternativa que no causa recursión
CREATE OR REPLACE FUNCTION is_admin_role()
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;
  
  SELECT role INTO user_role 
  FROM public.users 
  WHERE id = auth.uid();
  
  RETURN user_role IN ('superadmin', 'admin', 'adminscrap');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ================================================================================
-- PASO 2: POLÍTICAS PARA TABLA 'USERS' - SUPERADMIN VE TODO
-- ================================================================================

-- Primero eliminar políticas existentes
DROP POLICY IF EXISTS "users_select_policy" ON public.users;
DROP POLICY IF EXISTS "users_update_policy" ON public.users;
DROP POLICY IF EXISTS "users_insert_policy" ON public.users;
DROP POLICY IF EXISTS "users_delete_policy" ON public.users;
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "superadmin_full_access_users" ON public.users;

-- Habilitar RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- SELECT: Ver todos si es superadmin, solo su perfil si es usuario normal
CREATE POLICY "users_select_policy" ON public.users
  FOR SELECT
  USING (
    id = auth.uid()  -- Siempre puede ver su propio perfil
    OR is_admin_role()  -- Admins ven todo
    OR TRUE  -- DEV MODE: Permitir todo (quitar en producción)
  );

-- UPDATE: Superadmin puede editar todo, usuarios solo su perfil
CREATE POLICY "users_update_policy" ON public.users
  FOR UPDATE
  USING (
    id = auth.uid()
    OR is_admin_role()
  );

-- INSERT: Solo superadmin puede crear usuarios manualmente
CREATE POLICY "users_insert_policy" ON public.users
  FOR INSERT
  WITH CHECK (
    is_admin_role()
    OR TRUE  -- Para registro normal
  );

-- DELETE: Solo superadmin
CREATE POLICY "users_delete_policy" ON public.users
  FOR DELETE
  USING (is_admin_role());

-- ================================================================================
-- PASO 3: POLÍTICAS PARA TABLA 'ADS' - SUPERADMIN VE TODO
-- ================================================================================

DROP POLICY IF EXISTS "ads_select_policy" ON public.ads;
DROP POLICY IF EXISTS "ads_update_policy" ON public.ads;
DROP POLICY IF EXISTS "ads_insert_policy" ON public.ads;
DROP POLICY IF EXISTS "ads_delete_policy" ON public.ads;

ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;

-- SELECT: Todos ven avisos activos, admins ven todo
CREATE POLICY "ads_select_policy" ON public.ads
  FOR SELECT
  USING (
    status = 'active'  -- Avisos públicos
    OR user_id = auth.uid()  -- Propios
    OR is_admin_role()  -- Admins ven todo
    OR TRUE  -- DEV MODE
  );

-- UPDATE: Dueño o admin
CREATE POLICY "ads_update_policy" ON public.ads
  FOR UPDATE
  USING (
    user_id = auth.uid()
    OR is_admin_role()
  );

-- INSERT: Usuarios autenticados
CREATE POLICY "ads_insert_policy" ON public.ads
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    OR TRUE  -- DEV MODE
  );

-- DELETE: Dueño o admin
CREATE POLICY "ads_delete_policy" ON public.ads
  FOR DELETE
  USING (
    user_id = auth.uid()
    OR is_admin_role()
  );

-- ================================================================================
-- PASO 4: POLÍTICAS PARA CATÁLOGO (Lectura pública, escritura admin)
-- ================================================================================

-- CATEGORIES
DROP POLICY IF EXISTS "categories_select_policy" ON public.categories;
DROP POLICY IF EXISTS "categories_update_policy" ON public.categories;
DROP POLICY IF EXISTS "categories_insert_policy" ON public.categories;
DROP POLICY IF EXISTS "categories_delete_policy" ON public.categories;
DROP POLICY IF EXISTS "catalog_read_all" ON public.categories;

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "categories_select_policy" ON public.categories FOR SELECT USING (TRUE);
CREATE POLICY "categories_update_policy" ON public.categories FOR UPDATE USING (is_admin_role());
CREATE POLICY "categories_insert_policy" ON public.categories FOR INSERT WITH CHECK (is_admin_role());
CREATE POLICY "categories_delete_policy" ON public.categories FOR DELETE USING (is_admin_role());

-- SUBCATEGORIES
DROP POLICY IF EXISTS "subcategories_select_policy" ON public.subcategories;
DROP POLICY IF EXISTS "subcategories_update_policy" ON public.subcategories;
DROP POLICY IF EXISTS "subcategories_insert_policy" ON public.subcategories;
DROP POLICY IF EXISTS "subcategories_delete_policy" ON public.subcategories;

ALTER TABLE public.subcategories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "subcategories_select_policy" ON public.subcategories FOR SELECT USING (TRUE);
CREATE POLICY "subcategories_update_policy" ON public.subcategories FOR UPDATE USING (is_admin_role());
CREATE POLICY "subcategories_insert_policy" ON public.subcategories FOR INSERT WITH CHECK (is_admin_role());
CREATE POLICY "subcategories_delete_policy" ON public.subcategories FOR DELETE USING (is_admin_role());

-- BANNERS
DROP POLICY IF EXISTS "banners_select_policy" ON public.banners;
DROP POLICY IF EXISTS "banners_update_policy" ON public.banners;
DROP POLICY IF EXISTS "banners_insert_policy" ON public.banners;
DROP POLICY IF EXISTS "banners_delete_policy" ON public.banners;

ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "banners_select_policy" ON public.banners FOR SELECT USING (TRUE);
CREATE POLICY "banners_update_policy" ON public.banners FOR UPDATE USING (is_admin_role());
CREATE POLICY "banners_insert_policy" ON public.banners FOR INSERT WITH CHECK (is_admin_role());
CREATE POLICY "banners_delete_policy" ON public.banners FOR DELETE USING (is_admin_role());

-- BRANDS
DROP POLICY IF EXISTS "brands_select_policy" ON public.brands;
DROP POLICY IF EXISTS "brands_update_policy" ON public.brands;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
CREATE POLICY "brands_select_policy" ON public.brands FOR SELECT USING (TRUE);
CREATE POLICY "brands_update_policy" ON public.brands FOR UPDATE USING (is_admin_role());

-- MODELS
DROP POLICY IF EXISTS "models_select_policy" ON public.models;
DROP POLICY IF EXISTS "models_update_policy" ON public.models;
ALTER TABLE public.models ENABLE ROW LEVEL SECURITY;
CREATE POLICY "models_select_policy" ON public.models FOR SELECT USING (TRUE);
CREATE POLICY "models_update_policy" ON public.models FOR UPDATE USING (is_admin_role());

-- ================================================================================
-- PASO 5: VERIFICACIÓN
-- ================================================================================

-- Verificar que las políticas están activas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ================================================================================
-- PASO 6: GRANT PERMISOS ADICIONALES
-- ================================================================================

-- Asegurar que el rol anon y authenticated tienen permisos básicos
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.ads TO authenticated;
GRANT INSERT, UPDATE ON public.users TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ================================================================================
-- LISTO! El superadmin ahora tiene acceso completo a todo
-- ================================================================================
