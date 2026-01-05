-- =====================================================
-- SCRIPT DE EMERGENCIA: DESACTIVAR TODO EL RLS
-- =====================================================
-- Usar SOLO si necesitas que funcione YA y arreglar después

-- Desactivar RLS en tablas que existen (ignorar errores si no existen)
DO $$ 
BEGIN
    -- Users
    ALTER TABLE IF EXISTS public.users DISABLE ROW LEVEL SECURITY;
    
    -- Categories
    ALTER TABLE IF EXISTS public.categories DISABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS public.subcategories DISABLE ROW LEVEL SECURITY;
    
    -- Ads
    ALTER TABLE IF EXISTS public.ads DISABLE ROW LEVEL SECURITY;
    
    -- Banners y Hero Images
    ALTER TABLE IF EXISTS public.banners DISABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS public.hero_images DISABLE ROW LEVEL SECURITY;
    
    -- Catalog
    ALTER TABLE IF EXISTS public.brands DISABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS public.models DISABLE ROW LEVEL SECURITY;
    
    -- Site settings
    ALTER TABLE IF EXISTS public.site_settings DISABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS public.footer_sections DISABLE ROW LEVEL SECURITY;
    
    RAISE NOTICE 'RLS desactivado exitosamente';
END $$;

-- Verificar que funciona
SELECT 'RLS DESACTIVADO - Todo debería funcionar ahora' as status;

-- Test rápido
SELECT email, full_name, role FROM users WHERE email = 'super@clasify.com';
SELECT name, is_active FROM categories WHERE is_active = true LIMIT 3;
