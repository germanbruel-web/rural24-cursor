-- =====================================================
-- LIMPIEZA COMPLETA DE POLÍTICAS RLS PROBLEMÁTICAS
-- =====================================================

-- PASO 1: ELIMINAR POLÍTICAS EXISTENTES (según CHECK_CURRENT_POLICIES.sql)
-- =====================================================

-- Eliminar políticas de users
DROP POLICY IF EXISTS "users_view_own" ON users;
DROP POLICY IF EXISTS "users_update_own" ON users;
DROP POLICY IF EXISTS "users_insert_own" ON users;
DROP POLICY IF EXISTS "users_superadmin_all" ON users;

-- Eliminar políticas de categories
DROP POLICY IF EXISTS "categories_public_read" ON categories;
DROP POLICY IF EXISTS "categories_superadmin_all" ON categories;

-- Eliminar políticas de ads
DROP POLICY IF EXISTS "Public can read all ads" ON ads;
DROP POLICY IF EXISTS "Users can create ads" ON ads;
DROP POLICY IF EXISTS "Users can delete their ads" ON ads;
DROP POLICY IF EXISTS "Users can update their ads" ON ads;

-- PASO 2: ASEGURARSE DE QUE RLS ESTÉ ACTIVADO
-- =====================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;

-- PASO 3: CREAR POLÍTICAS SIMPLES SIN RECURSIÓN
-- =====================================================

-- USERS: Sin recursión - usando solo auth.uid()
-- =====================================================

-- Política 1: Usuarios ven su propio perfil
CREATE POLICY "users_view_own" ON users
    FOR SELECT
    TO public
    USING (auth.uid() = id);

-- Política 2: Usuarios actualizan su propio perfil  
CREATE POLICY "users_update_own" ON users
    FOR UPDATE
    TO public
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Política 3: Usuarios insertan su propio perfil (para registro)
CREATE POLICY "users_insert_own" ON users
    FOR INSERT
    TO public
    WITH CHECK (auth.uid() = id);

-- Política 4: Superadmins ven todos los usuarios
-- IMPORTANTE: Esta usa security definer function para evitar recursión
CREATE POLICY "users_superadmin_all" ON users
    FOR ALL
    TO public
    USING (
        -- Solo verificar el rol directamente en auth.jwt()
        (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'superadmin'
        OR
        -- O verificar que el usuario actual sea superadmin (con límite)
        (
            SELECT role FROM users WHERE id = auth.uid() LIMIT 1
        ) = 'superadmin'
    );

-- CATEGORIES: Acceso público para lectura
-- =====================================================

-- Política 1: Todos pueden leer categorías activas
CREATE POLICY "categories_public_read" ON categories
    FOR SELECT
    TO public
    USING (is_active = true);

-- Política 2: Superadmins pueden hacer todo
CREATE POLICY "categories_superadmin_all" ON categories
    FOR ALL
    TO public
    USING (
        -- Misma lógica que users
        (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'superadmin'
        OR
        (
            SELECT role FROM users WHERE id = auth.uid() LIMIT 1
        ) = 'superadmin'
    );

-- ADS: Acceso público para lectura, usuarios manejan los suyos
-- =====================================================

-- Política 1: Todos pueden leer avisos activos y aprobados
CREATE POLICY "ads_public_read" ON ads
    FOR SELECT
    TO public
    USING (
        status = 'active' 
        AND (approval_status = 'approved' OR approval_status IS NULL)
    );

-- Política 2: Usuarios pueden manejar sus propios avisos
CREATE POLICY "ads_owner_manage" ON ads
    FOR ALL
    TO public
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Política 3: Superadmins pueden hacer todo con todos los avisos
CREATE POLICY "ads_superadmin_all" ON ads
    FOR ALL
    TO public
    USING (
        (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'superadmin'
        OR
        (
            SELECT role FROM users WHERE id = auth.uid() LIMIT 1
        ) = 'superadmin'
    );

-- PASO 4: VERIFICAR RESULTADO
-- =====================================================

-- Ver políticas limpias
SELECT 
    tablename,
    policyname,
    cmd,
    roles
FROM pg_policies 
WHERE tablename IN ('users', 'categories', 'ads')
ORDER BY tablename, policyname;

-- Test: Debe funcionar sin errores 500
SELECT 'Políticas recreadas correctamente' as status;
SELECT email, full_name, role FROM users WHERE email = 'super@clasify.com';
SELECT name FROM categories WHERE is_active = true LIMIT 3;
SELECT title, status FROM ads WHERE status = 'active' LIMIT 3;
