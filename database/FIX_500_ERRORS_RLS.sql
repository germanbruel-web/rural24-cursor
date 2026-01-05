-- =====================================================
-- DIAGNÓSTICO Y ARREGLO DE ERRORES 500 EN SUPABASE
-- =====================================================
-- Los errores 500 usualmente son causados por:
-- 1. Políticas RLS con recursión infinita
-- 2. Políticas RLS que referencian tablas con políticas rotas
-- 3. Funciones PL/pgSQL mal definidas

-- PASO 1: DESACTIVAR TEMPORALMENTE RLS PARA DIAGNOSTICAR
-- =====================================================

-- Ver estado actual de RLS
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- PASO 2: DESACTIVAR RLS TEMPORALMENTE EN TABLAS PROBLEMÁTICAS
-- =====================================================

-- Desactivar RLS en users (causa error 500 al cargar perfil)
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Desactivar RLS en categories (causa error 500 al cargar categorías)
ALTER TABLE public.categories DISABLE ROW LEVEL SECURITY;

-- Desactivar RLS en ads (por si acaso)
ALTER TABLE public.ads DISABLE ROW LEVEL SECURITY;

-- PASO 3: VERIFICAR SI AHORA FUNCIONA
-- =====================================================

-- Test: Cargar perfil de super@clasify.com
SELECT 
    id, 
    email, 
    full_name, 
    role 
FROM users 
WHERE email = 'super@clasify.com';

-- Test: Cargar categorías activas
SELECT 
    id, 
    name, 
    display_name, 
    is_active 
FROM categories 
WHERE is_active = true
ORDER BY sort_order ASC
LIMIT 5;

-- PASO 4: SI FUNCIONA, RECREAR POLÍTICAS CORRECTAMENTE
-- =====================================================

-- USERS: Políticas simples y seguras
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Política 1: Los usuarios pueden ver su propio perfil
DROP POLICY IF EXISTS "users_select_own" ON users;
CREATE POLICY "users_select_own" ON users
    FOR SELECT
    USING (auth.uid() = id);

-- Política 2: Los superadmins pueden ver todos los perfiles
DROP POLICY IF EXISTS "users_select_superadmin" ON users;
CREATE POLICY "users_select_superadmin" ON users
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users u2
            WHERE u2.id = auth.uid() 
            AND u2.role = 'superadmin'
        )
    );

-- Política 3: Los usuarios pueden actualizar su propio perfil
DROP POLICY IF EXISTS "users_update_own" ON users;
CREATE POLICY "users_update_own" ON users
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- CATEGORIES: Solo lectura para usuarios autenticados
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "categories_select_authenticated" ON categories;
CREATE POLICY "categories_select_authenticated" ON categories
    FOR SELECT
    TO authenticated
    USING (is_active = true);

DROP POLICY IF EXISTS "categories_all_superadmin" ON categories;
CREATE POLICY "categories_all_superadmin" ON categories
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid() 
            AND users.role = 'superadmin'
        )
    );

-- PASO 5: VERIFICAR POLÍTICAS FINALES
-- =====================================================

-- Ver políticas activas en users
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
WHERE tablename IN ('users', 'categories')
ORDER BY tablename, policyname;
