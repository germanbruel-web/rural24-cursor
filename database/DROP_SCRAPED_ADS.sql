-- ===================================
-- ELIMINAR TABLA SCRAPED_ADS
-- ===================================
-- Ejecutar en Supabase SQL Editor
-- Este archivo elimina completamente la tabla scraped_ads
-- y todas sus dependencias (políticas RLS, índices, etc.)

-- 1. Eliminar políticas RLS si existen
DROP POLICY IF EXISTS "Public can read approved scraped ads" ON public.scraped_ads;
DROP POLICY IF EXISTS "Superadmins can manage scraped ads" ON public.scraped_ads;
DROP POLICY IF EXISTS "Users can view approved scraped ads" ON public.scraped_ads;

-- 2. Eliminar índices
DROP INDEX IF EXISTS idx_scraped_ads_approval_status;
DROP INDEX IF EXISTS idx_scraped_ads_external_id;
DROP INDEX IF EXISTS idx_scraped_ads_content_hash;
DROP INDEX IF EXISTS idx_scraped_ads_source;
DROP INDEX IF EXISTS idx_scraped_ads_category;
DROP INDEX IF EXISTS idx_scraped_ads_created_at;

-- 3. Eliminar tabla
DROP TABLE IF EXISTS public.scraped_ads CASCADE;

-- 4. Verificar que se eliminó correctamente
SELECT 
    tablename, 
    tableowner 
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename = 'scraped_ads';

-- Si no aparece ninguna fila, la tabla fue eliminada correctamente ✅
