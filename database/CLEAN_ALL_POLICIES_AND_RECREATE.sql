-- =====================================================
-- LIMPIEZA TOTAL Y RECREACIÓN DE POLÍTICAS RLS
-- Elimina TODAS las políticas existentes (75 encontradas)
-- Crea solo las políticas correctas y necesarias
-- Ejecutar en Supabase SQL Editor
-- =====================================================

-- =====================================================
-- PARTE 1: ELIMINAR TODAS LAS POLÍTICAS EXISTENTES
-- =====================================================

-- ADS - Eliminar TODAS las 19 políticas
DROP POLICY IF EXISTS "ads_all_superadmin" ON ads;
DROP POLICY IF EXISTS "ads_delete_own" ON ads;
DROP POLICY IF EXISTS "ads_delete_policy" ON ads;
DROP POLICY IF EXISTS "ads_insert_authenticated" ON ads;
DROP POLICY IF EXISTS "ads_insert_policy" ON ads;
DROP POLICY IF EXISTS "ads_owner_manage" ON ads;
DROP POLICY IF EXISTS "ads_public_read" ON ads;
DROP POLICY IF EXISTS "ads_select_policy" ON ads;
DROP POLICY IF EXISTS "ads_update_own" ON ads;
DROP POLICY IF EXISTS "ads_update_policy" ON ads;
DROP POLICY IF EXISTS "ads_view_active_approved" ON ads;
DROP POLICY IF EXISTS "ads_view_all_superadmin" ON ads;
DROP POLICY IF EXISTS "ads_view_own" ON ads;
DROP POLICY IF EXISTS "authenticated_insert_ads" ON ads;
DROP POLICY IF EXISTS "public_select_active_ads" ON ads;
DROP POLICY IF EXISTS "superadmin_all_ads" ON ads;
DROP POLICY IF EXISTS "user_delete_own_ads" ON ads;
DROP POLICY IF EXISTS "user_select_own_ads" ON ads;
DROP POLICY IF EXISTS "user_update_own_ads" ON ads;

-- BANNERS - Eliminar TODAS las 10 políticas
DROP POLICY IF EXISTS "Banners activos son públicos" ON banners;
DROP POLICY IF EXISTS "Solo superadmins pueden actualizar banners" ON banners;
DROP POLICY IF EXISTS "Solo superadmins pueden crear banners" ON banners;
DROP POLICY IF EXISTS "Solo superadmins pueden eliminar banners" ON banners;
DROP POLICY IF EXISTS "Superadmins pueden ver todos los banners" ON banners;
DROP POLICY IF EXISTS "banners_admin_only" ON banners;
DROP POLICY IF EXISTS "banners_all_superadmin" ON banners;
DROP POLICY IF EXISTS "banners_manage_superadmin" ON banners;
DROP POLICY IF EXISTS "banners_read_all" ON banners;
DROP POLICY IF EXISTS "banners_view_active" ON banners;

-- BRANDS - Eliminar TODAS las 8 políticas
DROP POLICY IF EXISTS "Public read brands" ON brands;
DROP POLICY IF EXISTS "SuperAdmins manage brands" ON brands;
DROP POLICY IF EXISTS "brands_all_superadmin" ON brands;
DROP POLICY IF EXISTS "brands_manage_superadmin" ON brands;
DROP POLICY IF EXISTS "brands_read_all" ON brands;
DROP POLICY IF EXISTS "brands_view_all" ON brands;
DROP POLICY IF EXISTS "catalog_admin_only" ON brands;
DROP POLICY IF EXISTS "catalog_read_all" ON brands;

-- CATEGORIES - Eliminar TODAS las 9 políticas
DROP POLICY IF EXISTS "Public read categories" ON categories;
DROP POLICY IF EXISTS "SuperAdmins manage categories" ON categories;
DROP POLICY IF EXISTS "catalog_admin_only" ON categories;
DROP POLICY IF EXISTS "catalog_read_all" ON categories;
DROP POLICY IF EXISTS "categories_manage_superadmin" ON categories;
DROP POLICY IF EXISTS "categories_public_read" ON categories;
DROP POLICY IF EXISTS "categories_read_all" ON categories;
DROP POLICY IF EXISTS "categories_superadmin_all" ON categories;
DROP POLICY IF EXISTS "categories_view_active" ON categories;

-- MODELS - Eliminar TODAS las 8 políticas
DROP POLICY IF EXISTS "Public read models" ON models;
DROP POLICY IF EXISTS "SuperAdmins manage models" ON models;
DROP POLICY IF EXISTS "catalog_admin_only" ON models;
DROP POLICY IF EXISTS "catalog_read_all" ON models;
DROP POLICY IF EXISTS "models_all_superadmin" ON models;
DROP POLICY IF EXISTS "models_manage_superadmin" ON models;
DROP POLICY IF EXISTS "models_read_all" ON models;
DROP POLICY IF EXISTS "models_view_all" ON models;

-- SUBCATEGORIES - Eliminar TODAS las 13 políticas
DROP POLICY IF EXISTS "Public read subcategories" ON subcategories;
DROP POLICY IF EXISTS "SuperAdmins manage subcategories" ON subcategories;
DROP POLICY IF EXISTS "catalog_admin_only" ON subcategories;
DROP POLICY IF EXISTS "catalog_read_all" ON subcategories;
DROP POLICY IF EXISTS "subcategories_all_superadmin" ON subcategories;
DROP POLICY IF EXISTS "subcategories_manage_superadmin" ON subcategories;
DROP POLICY IF EXISTS "subcategories_public_select" ON subcategories;
DROP POLICY IF EXISTS "subcategories_read_all" ON subcategories;
DROP POLICY IF EXISTS "subcategories_superadmin_delete" ON subcategories;
DROP POLICY IF EXISTS "subcategories_superadmin_insert" ON subcategories;
DROP POLICY IF EXISTS "subcategories_superadmin_update" ON subcategories;
DROP POLICY IF EXISTS "subcategories_view_active" ON subcategories;
DROP POLICY IF EXISTS "subcategories_read_all" ON subcategories;

-- USERS - Eliminar TODAS las 8 políticas
DROP POLICY IF EXISTS "users_all_superadmin" ON users;
DROP POLICY IF EXISTS "users_insert_own" ON users;
DROP POLICY IF EXISTS "users_select_policy" ON users;
DROP POLICY IF EXISTS "users_superadmin_all" ON users;
DROP POLICY IF EXISTS "users_update_own" ON users;
DROP POLICY IF EXISTS "users_update_policy" ON users;
DROP POLICY IF EXISTS "users_view_all_superadmin" ON users;
DROP POLICY IF EXISTS "users_view_own" ON users;

-- =====================================================
-- PARTE 2: VERIFICAR LIMPIEZA
-- =====================================================

-- Debería devolver 0 filas si la limpieza fue exitosa
SELECT 
  tablename,
  COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('ads', 'users', 'categories', 'subcategories', 'brands', 'models', 'banners')
GROUP BY tablename
ORDER BY tablename;

-- =====================================================
-- PARTE 3: ASEGURAR QUE RLS ESTÁ HABILITADO
-- =====================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PARTE 4: USERS - POLÍTICAS LIMPIAS Y CORRECTAS
-- =====================================================

-- Policy 1: Users pueden ver su propio perfil
CREATE POLICY "users_view_own" 
ON users FOR SELECT
USING (auth.uid() = id);

-- Policy 2: SuperAdmins pueden ver todos los perfiles
CREATE POLICY "users_view_all_superadmin" 
ON users FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users u2
    WHERE u2.id = auth.uid() 
    AND u2.role = 'superadmin'
  )
);

-- Policy 3: Users pueden actualizar su propio perfil
CREATE POLICY "users_update_own" 
ON users FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Policy 4: Permitir inserción durante registro
CREATE POLICY "users_insert_own" 
ON users FOR INSERT
WITH CHECK (auth.uid() = id);

-- Policy 5: SuperAdmin puede hacer TODO
CREATE POLICY "users_all_superadmin" 
ON users FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users u2
    WHERE u2.id = auth.uid() 
    AND u2.role = 'superadmin'
  )
);

-- =====================================================
-- PARTE 5: ADS - POLÍTICAS LIMPIAS Y CORRECTAS
-- =====================================================

-- Policy 1: Todos pueden ver avisos ACTIVOS y APROBADOS
CREATE POLICY "ads_view_active_approved" 
ON ads FOR SELECT
USING (
  status = 'active' 
  AND approval_status = 'approved'
);

-- Policy 2: Users pueden ver sus propios avisos (cualquier estado)
CREATE POLICY "ads_view_own" 
ON ads FOR SELECT
USING (auth.uid() = user_id);

-- Policy 3: SuperAdmins pueden ver TODOS los avisos
CREATE POLICY "ads_view_all_superadmin" 
ON ads FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() 
    AND users.role = 'superadmin'
  )
);

-- Policy 4: Users autenticados pueden crear avisos
CREATE POLICY "ads_insert_authenticated" 
ON ads FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND auth.uid() IS NOT NULL
);

-- Policy 5: Users pueden actualizar sus propios avisos
CREATE POLICY "ads_update_own" 
ON ads FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy 6: Users pueden eliminar sus propios avisos
CREATE POLICY "ads_delete_own" 
ON ads FOR DELETE
USING (auth.uid() = user_id);

-- =====================================================
-- PARTE 6: CATEGORIES - POLÍTICAS LIMPIAS
-- =====================================================

-- Policy 1: Todos pueden leer categorías
CREATE POLICY "categories_read_all" 
ON categories FOR SELECT
USING (true);

-- Policy 2: Solo SuperAdmins pueden gestionar categorías
CREATE POLICY "categories_manage_superadmin" 
ON categories FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() 
    AND users.role = 'superadmin'
  )
);

-- =====================================================
-- PARTE 7: SUBCATEGORIES - POLÍTICAS LIMPIAS
-- =====================================================

-- Policy 1: Todos pueden leer subcategorías
CREATE POLICY "subcategories_read_all" 
ON subcategories FOR SELECT
USING (true);

-- Policy 2: Solo SuperAdmins pueden gestionar subcategorías
CREATE POLICY "subcategories_manage_superadmin" 
ON subcategories FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() 
    AND users.role = 'superadmin'
  )
);

-- =====================================================
-- PARTE 8: BRANDS - POLÍTICAS LIMPIAS
-- =====================================================

-- Policy 1: Todos pueden leer marcas
CREATE POLICY "brands_read_all" 
ON brands FOR SELECT
USING (true);

-- Policy 2: Solo SuperAdmins pueden gestionar marcas
CREATE POLICY "brands_manage_superadmin" 
ON brands FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() 
    AND users.role = 'superadmin'
  )
);

-- =====================================================
-- PARTE 9: MODELS - POLÍTICAS LIMPIAS
-- =====================================================

-- Policy 1: Todos pueden leer modelos
CREATE POLICY "models_read_all" 
ON models FOR SELECT
USING (true);

-- Policy 2: Solo SuperAdmins pueden gestionar modelos
CREATE POLICY "models_manage_superadmin" 
ON models FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() 
    AND users.role = 'superadmin'
  )
);

-- =====================================================
-- PARTE 10: BANNERS - POLÍTICAS LIMPIAS
-- =====================================================

-- Policy 1: Todos pueden ver banners activos
CREATE POLICY "banners_view_active" 
ON banners FOR SELECT
USING (is_active = true);

-- Policy 2: Solo SuperAdmins pueden gestionar banners
CREATE POLICY "banners_manage_superadmin" 
ON banners FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() 
    AND users.role = 'superadmin'
  )
);

-- =====================================================
-- PARTE 11: VERIFICACIÓN FINAL
-- =====================================================

-- Verificar que RLS está habilitado
SELECT 
  '✅ RLS HABILITADO' as status,
  schemaname,
  tablename, 
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('ads', 'users', 'categories', 'subcategories', 'brands', 'models', 'banners')
ORDER BY tablename;

-- Listar políticas creadas (debería haber exactamente 21)
SELECT 
  '✅ POLÍTICAS CREADAS' as status,
  tablename,
  COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('ads', 'users', 'categories', 'subcategories', 'brands', 'models', 'banners')
GROUP BY tablename
ORDER BY tablename;

-- Detalle de políticas
SELECT 
  tablename,
  policyname,
  cmd as command
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('ads', 'users', 'categories', 'subcategories', 'brands', 'models', 'banners')
ORDER BY tablename, policyname;

-- =====================================================
-- ✅ RESULTADO ESPERADO
-- =====================================================
-- users: 5 políticas
-- ads: 6 políticas  
-- categories: 2 políticas
-- subcategories: 2 políticas
-- brands: 2 políticas
-- models: 2 políticas
-- banners: 2 políticas
-- TOTAL: 21 políticas limpias y correctas
-- =====================================================
