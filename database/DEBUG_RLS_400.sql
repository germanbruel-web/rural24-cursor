-- =====================================================
-- VERIFICAR POLÍTICAS ACTUALES
-- =====================================================

-- 1. Ver políticas de ads
SELECT policyname, cmd, qual as using_expr
FROM pg_policies 
WHERE tablename = 'ads'
ORDER BY policyname;

-- 2. Ver políticas de subcategories
SELECT policyname, cmd, qual as using_expr
FROM pg_policies 
WHERE tablename = 'subcategories'
ORDER BY policyname;

-- 3. Ver un aviso de ejemplo directamente (bypass RLS temporalmente)
SET session_replication_role = replica;
SELECT id, title, approval_status, status, images FROM ads LIMIT 1;
SET session_replication_role = DEFAULT;

-- 4. SOLUCIÓN TEMPORAL: Deshabilitar RLS completamente para testing
-- ALTER TABLE public.ads DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.subcategories DISABLE ROW LEVEL SECURITY;
