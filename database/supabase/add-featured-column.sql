-- ============================================
-- Agregar columna 'featured' a tabla ads
-- ============================================
-- Permite marcar avisos premium y scrapeados 
-- para aparecer en el carrusel destacado

ALTER TABLE public.ads 
ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT false;

-- Índice para consultas rápidas de avisos destacados
CREATE INDEX IF NOT EXISTS idx_ads_featured ON public.ads(featured) 
WHERE featured = true;

-- Comentario de documentación
COMMENT ON COLUMN public.ads.featured IS 'Marca si el aviso aparece en carrusel destacado';

-- Verificar que la columna fue agregada
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'ads' AND column_name = 'featured';
