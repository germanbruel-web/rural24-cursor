-- ================================================================================
-- FIX URGENTE: Desactiv RLS mientras está en DEV
-- ================================================================================
-- Ejecutar esto en Supabase SQL Editor AHORA

-- Deshabilitar RLS en todas las tablas
ALTER TABLE public.ads DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.subcategories DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.models DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_images DISABLE ROW LEVEL SECURITY;

-- Verificación
SELECT 
  schemaname, 
  tablename, 
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('ads', 'users', 'categories', 'subcategories', 'brands', 'models', 'banners', 'ad_images')
ORDER BY tablename;
