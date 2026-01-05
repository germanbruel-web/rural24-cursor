-- =====================================================
-- FIX FINAL: Eliminar recursión de políticas
-- =====================================================

-- PASO 1: Eliminar políticas con recursión
DROP POLICY IF EXISTS "users_superadmin_all" ON users;
DROP POLICY IF EXISTS "categories_superadmin_all" ON categories;
DROP POLICY IF EXISTS "ads_superadmin_all" ON ads;

-- PASO 2: Recrear políticas SIN recursión (solo usando auth.jwt())
-- =====================================================

-- USERS: Superadmin usando SOLO auth.jwt()
CREATE POLICY "users_superadmin_all" ON users
    FOR ALL
    TO public
    USING (
        (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'superadmin'
    );

-- CATEGORIES: Superadmin usando SOLO auth.jwt()
CREATE POLICY "categories_superadmin_all" ON categories
    FOR ALL
    TO public
    USING (
        (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'superadmin'
    );

-- ADS: Superadmin usando SOLO auth.jwt()
CREATE POLICY "ads_superadmin_all" ON ads
    FOR ALL
    TO public
    USING (
        (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'superadmin'
    );

-- PASO 3: Verificar
SELECT 'Políticas sin recursión recreadas' as status;

SELECT 
    tablename,
    policyname,
    cmd
FROM pg_policies 
WHERE tablename IN ('users', 'categories', 'ads')
ORDER BY tablename, policyname;
