-- =====================================================
-- HABILITAR Y CONFIGURAR RLS - VERSIÓN SEGURA
-- Maneja políticas existentes sin errores
-- Ejecutar en Supabase SQL Editor
-- =====================================================

-- =====================================================
-- PARTE 1: LIMPIAR POLÍTICAS EXISTENTES (IF EXISTS)
-- =====================================================

-- USERS - Eliminar políticas si existen
DROP POLICY IF EXISTS "users_view_all_superadmin" ON users;
DROP POLICY IF EXISTS "users_view_own" ON users;
DROP POLICY IF EXISTS "users_update_own" ON users;
DROP POLICY IF EXISTS "users_insert_own" ON users;
DROP POLICY IF EXISTS "users_all_superadmin" ON users;
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "users_select_own" ON users;
DROP POLICY IF EXISTS "users_select_superadmin" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON users;

-- ADS - Eliminar políticas si existen
DROP POLICY IF EXISTS "ads_view_active_approved" ON ads;
DROP POLICY IF EXISTS "ads_view_own" ON ads;
DROP POLICY IF EXISTS "ads_view_all_superadmin" ON ads;
DROP POLICY IF EXISTS "ads_insert_authenticated" ON ads;
DROP POLICY IF EXISTS "ads_update_own" ON ads;
DROP POLICY IF EXISTS "ads_delete_own" ON ads;
DROP POLICY IF EXISTS "ads_select_own" ON ads;
DROP POLICY IF EXISTS "ads_select_active" ON ads;
DROP POLICY IF EXISTS "ads_select_superadmin" ON ads;

-- CATEGORIES - Eliminar políticas si existen
DROP POLICY IF EXISTS "categories_read_all" ON categories;
DROP POLICY IF EXISTS "categories_manage_superadmin" ON categories;
DROP POLICY IF EXISTS "categories_select_authenticated" ON categories;
DROP POLICY IF EXISTS "categories_all_superadmin" ON categories;
DROP POLICY IF EXISTS "Anyone can read categories" ON categories;

-- SUBCATEGORIES - Eliminar políticas si existen
DROP POLICY IF EXISTS "subcategories_read_all" ON subcategories;
DROP POLICY IF EXISTS "subcategories_manage_superadmin" ON subcategories;

-- BRANDS - Eliminar políticas si existen
DROP POLICY IF EXISTS "brands_read_all" ON brands;
DROP POLICY IF EXISTS "brands_manage_superadmin" ON brands;

-- MODELS - Eliminar políticas si existen
DROP POLICY IF EXISTS "models_read_all" ON models;
DROP POLICY IF EXISTS "models_manage_superadmin" ON models;

-- BANNERS - Eliminar políticas si existen
DROP POLICY IF EXISTS "banners_view_active" ON banners;
DROP POLICY IF EXISTS "banners_manage_superadmin" ON banners;
DROP POLICY IF EXISTS "banners_select_all" ON banners;

-- =====================================================
-- PARTE 2: HABILITAR RLS EN TODAS LAS TABLAS
-- =====================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PARTE 3: USERS - POLÍTICAS DE SEGURIDAD
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
-- PARTE 4: ADS - POLÍTICAS DE SEGURIDAD
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
-- PARTE 5: CATEGORIES - POLÍTICAS DE SEGURIDAD
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
-- PARTE 6: SUBCATEGORIES - POLÍTICAS DE SEGURIDAD
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
-- PARTE 7: BRANDS - POLÍTICAS DE SEGURIDAD
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
-- PARTE 8: MODELS - POLÍTICAS DE SEGURIDAD
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
-- PARTE 9: BANNERS - POLÍTICAS DE SEGURIDAD
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
-- PARTE 10: VERIFICACIÓN
-- =====================================================

-- Verificar que RLS está habilitado
SELECT 
  schemaname,
  tablename, 
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('ads', 'users', 'categories', 'subcategories', 'brands', 'models', 'banners')
ORDER BY tablename;

-- Listar políticas creadas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('ads', 'users', 'categories', 'subcategories', 'brands', 'models', 'banners')
ORDER BY tablename, policyname;

-- =====================================================
-- ✅ COMPLETADO
-- =====================================================
-- RLS habilitado y políticas configuradas correctamente
-- Próximo paso: Ejecutar node scripts/verify-rls.js
-- =====================================================
