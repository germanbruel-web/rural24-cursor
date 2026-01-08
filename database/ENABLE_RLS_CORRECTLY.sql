-- =====================================================
-- HABILITAR Y CONFIGURAR RLS CORRECTAMENTE
-- Ejecutar en Supabase SQL Editor
-- Fecha: 8 de Enero 2026
-- =====================================================

-- PARTE 1: LIMPIAR POLÍTICAS EXISTENTES
-- =====================================================

-- USERS
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "users_select_own" ON users;
DROP POLICY IF EXISTS "users_select_superadmin" ON users;
DROP POLICY IF EXISTS "users_update_own" ON users;
DROP POLICY IF EXISTS "users_view_own" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON users;
DROP POLICY IF EXISTS "users_insert_own" ON users;

-- ADS
DROP POLICY IF EXISTS "ads_select_own" ON ads;
DROP POLICY IF EXISTS "ads_select_active" ON ads;
DROP POLICY IF EXISTS "ads_select_superadmin" ON ads;
DROP POLICY IF EXISTS "ads_insert_authenticated" ON ads;
DROP POLICY IF EXISTS "ads_update_own" ON ads;
DROP POLICY IF EXISTS "ads_delete_own" ON ads;

-- CATEGORIES
DROP POLICY IF EXISTS "categories_select_authenticated" ON categories;
DROP POLICY IF EXISTS "categories_all_superadmin" ON categories;
DROP POLICY IF EXISTS "Anyone can read categories" ON categories;

-- BANNERS
DROP POLICY IF EXISTS "banners_select_all" ON banners;
DROP POLICY IF EXISTS "banners_manage_superadmin" ON banners;

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

-- Policy 2: Users pueden ver SUS PROPIOS avisos (cualquier estado)
CREATE POLICY "ads_view_own" 
ON ads FOR SELECT
USING (auth.uid() = user_id);

-- Policy 3: SuperAdmin puede ver TODOS los avisos
CREATE POLICY "ads_view_all_superadmin" 
ON ads FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() 
    AND users.role = 'superadmin'
  )
);

-- Policy 4: Users autenticados pueden CREAR avisos
CREATE POLICY "ads_insert_authenticated" 
ON ads FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy 5: Users pueden ACTUALIZAR sus propios avisos
CREATE POLICY "ads_update_own" 
ON ads FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy 6: Users pueden ELIMINAR sus propios avisos
CREATE POLICY "ads_delete_own" 
ON ads FOR DELETE
USING (auth.uid() = user_id);

-- Policy 7: SuperAdmin puede hacer TODO con avisos
CREATE POLICY "ads_all_superadmin" 
ON ads FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() 
    AND users.role = 'superadmin'
  )
);

-- =====================================================
-- PARTE 5: CATEGORIES - POLÍTICAS DE SEGURIDAD
-- =====================================================

-- Policy 1: Todos pueden VER categorías activas (lectura pública)
CREATE POLICY "categories_view_active" 
ON categories FOR SELECT
USING (is_active = true);

-- Policy 2: SuperAdmin puede hacer TODO con categorías
CREATE POLICY "categories_all_superadmin" 
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

-- Policy 1: Todos pueden VER subcategorías activas
CREATE POLICY "subcategories_view_active" 
ON subcategories FOR SELECT
USING (is_active = true);

-- Policy 2: SuperAdmin puede hacer TODO
CREATE POLICY "subcategories_all_superadmin" 
ON subcategories FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() 
    AND users.role = 'superadmin'
  )
);

-- =====================================================
-- PARTE 7: BRANDS y MODELS - POLÍTICAS DE SEGURIDAD
-- =====================================================

-- Brands: Lectura pública
CREATE POLICY "brands_view_all" 
ON brands FOR SELECT
USING (true);

CREATE POLICY "brands_all_superadmin" 
ON brands FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() 
    AND users.role = 'superadmin'
  )
);

-- Models: Lectura pública
CREATE POLICY "models_view_all" 
ON models FOR SELECT
USING (true);

CREATE POLICY "models_all_superadmin" 
ON models FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() 
    AND users.role = 'superadmin'
  )
);

-- =====================================================
-- PARTE 8: BANNERS - POLÍTICAS DE SEGURIDAD
-- =====================================================

-- Policy 1: Todos pueden VER banners activos
CREATE POLICY "banners_view_active" 
ON banners FOR SELECT
USING (is_active = true);

-- Policy 2: SuperAdmin puede hacer TODO con banners
CREATE POLICY "banners_all_superadmin" 
ON banners FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() 
    AND users.role = 'superadmin'
  )
);

-- =====================================================
-- PARTE 9: VERIFICACIÓN
-- =====================================================

-- Ver estado de RLS en todas las tablas
SELECT 
  tablename, 
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('users', 'ads', 'categories', 'subcategories', 
                  'brands', 'models', 'banners')
ORDER BY tablename;

-- Ver todas las políticas creadas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd as operation
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- =====================================================
-- TESTING (Ejecutar estos queries para verificar)
-- =====================================================

-- Test 1: Ver avisos como usuario anónimo (solo debe ver activos+aprobados)
-- SELECT * FROM ads LIMIT 5;

-- Test 2: Ver usuarios como anónimo (debe fallar o no retornar nada)
-- SELECT * FROM users LIMIT 5;

-- Test 3: Ver categorías (debe funcionar)
-- SELECT * FROM categories WHERE is_active = true LIMIT 5;

-- =====================================================
-- RESULTADO ESPERADO:
-- =====================================================
-- ✅ RLS habilitado en 7 tablas
-- ✅ ~20 políticas creadas
-- ✅ SuperAdmin puede todo
-- ✅ Users normales solo ven lo suyo
-- ✅ Anónimos solo ven contenido público

-- =====================================================
-- PRÓXIMO PASO:
-- =====================================================
-- Ejecutar: node scripts/verify-rls.js
-- Para confirmar que RLS está correctamente configurado
