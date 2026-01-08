-- ============================================
-- Agregar columna 'featured_until' a tabla ads
-- ============================================
-- Permite establecer fecha límite para avisos destacados
-- que se destacan temporalmente con fecha de fin

-- Agregar columna featured_until (timestamp con timezone)
ALTER TABLE public.ads 
ADD COLUMN IF NOT EXISTS featured_until TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Índice para consultas de avisos destacados activos
CREATE INDEX IF NOT EXISTS idx_ads_featured_until ON public.ads(featured_until) 
WHERE featured_until IS NOT NULL;

-- Comentario de documentación
COMMENT ON COLUMN public.ads.featured_until IS 'Fecha límite hasta la cual el aviso está destacado (NULL = no destacado o indefinido)';

-- Verificar que la columna fue agregada
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'ads' AND column_name = 'featured_until';
