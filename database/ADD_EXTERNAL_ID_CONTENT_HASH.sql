-- ============================================
-- AGREGAR COLUMNAS PARA DETECCIÓN DE DUPLICADOS
-- ============================================
-- Ejecutar esto en Supabase SQL Editor

-- Agregar columna external_id (ID del sitio scrapeado)
ALTER TABLE public.scraped_ads 
ADD COLUMN IF NOT EXISTS external_id VARCHAR(200);

-- Agregar columna content_hash (hash del contenido)
ALTER TABLE public.scraped_ads 
ADD COLUMN IF NOT EXISTS content_hash VARCHAR(64);

-- Crear índices para mejorar búsquedas de duplicados
CREATE INDEX IF NOT EXISTS idx_scraped_ads_external_id 
ON public.scraped_ads(external_id);

CREATE INDEX IF NOT EXISTS idx_scraped_ads_content_hash 
ON public.scraped_ads(content_hash);

-- Crear índice único para evitar duplicados por external_id y source
CREATE UNIQUE INDEX IF NOT EXISTS idx_scraped_ads_unique_external_source 
ON public.scraped_ads(external_id, scraping_source) 
WHERE external_id IS NOT NULL;

COMMENT ON COLUMN public.scraped_ads.external_id IS 'ID único del aviso en el sitio original (ej: ML123456, ZP789012)';
COMMENT ON COLUMN public.scraped_ads.content_hash IS 'Hash MD5 del contenido para detección de duplicados';
