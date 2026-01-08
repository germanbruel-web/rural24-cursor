-- =====================================================
-- FIX RÁPIDO: Eliminar recursión infinita en RLS
-- EJECUTAR EN SUPABASE SQL EDITOR
-- =====================================================

-- OPCIÓN 1: Desactivar RLS temporalmente (desarrollo)
-- =====================================================
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.ads DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.subcategories DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.models DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners DISABLE ROW LEVEL SECURITY;

-- Verificación
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('users', 'ads', 'categories', 'subcategories', 'brands', 'models', 'banners')
ORDER BY tablename;

-- Resultado esperado: todas las tablas con rls_enabled = false
