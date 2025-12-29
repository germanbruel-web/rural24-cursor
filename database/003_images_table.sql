-- ================================================
-- TABLA: images (Imágenes separadas)
-- ================================================

-- Primero eliminamos la columna image_url de scraped_ads si existe
-- (haremos esta migración en un paso separado para no romper nada)

CREATE TABLE IF NOT EXISTS public.images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID, -- referencia a scraped_ads.id o ads.id
  listing_type VARCHAR(50) NOT NULL, -- 'scraped_ad' o 'premium_ad'
  original_url TEXT NOT NULL,
  optimized_url TEXT, -- URL de la imagen optimizada en Supabase Storage
  thumbnail_url TEXT, -- URL del thumbnail
  width INTEGER,
  height INTEGER,
  file_size INTEGER, -- tamaño en bytes
  optimized_size INTEGER, -- tamaño optimizado en bytes
  format VARCHAR(10), -- 'jpg', 'png', 'webp', etc.
  hash VARCHAR(64), -- hash para detección de duplicados
  perceptual_hash VARCHAR(64), -- perceptual hash para comparación visual
  is_optimized BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0, -- orden de visualización
  alt_text TEXT,
  metadata JSONB DEFAULT '{}'::jsonb, -- metadata adicional (exif, etc.)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_images_listing_id ON public.images(listing_id);
CREATE INDEX IF NOT EXISTS idx_images_listing_type ON public.images(listing_type);
CREATE INDEX IF NOT EXISTS idx_images_hash ON public.images(hash);
CREATE INDEX IF NOT EXISTS idx_images_perceptual_hash ON public.images(perceptual_hash);
CREATE INDEX IF NOT EXISTS idx_images_is_optimized ON public.images(is_optimized);

-- RLS Policies
ALTER TABLE public.images ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes si ya existen
DROP POLICY IF EXISTS "Anyone can view images" ON public.images;
DROP POLICY IF EXISTS "Authenticated users can upload images" ON public.images;
DROP POLICY IF EXISTS "Users can manage their own images" ON public.images;

-- Policy: Todos pueden VER imágenes
CREATE POLICY "Anyone can view images"
ON public.images FOR SELECT
USING (true);

-- Policy: Usuarios autenticados pueden subir imágenes
CREATE POLICY "Authenticated users can upload images"
ON public.images FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Policy: Usuarios pueden gestionar sus propias imágenes
-- (verificar ownership a través de ads o scraped_ads)
CREATE POLICY "Users can manage their own images"
ON public.images FOR ALL
USING (
  auth.uid() IS NOT NULL AND (
    -- Para premium ads
    (listing_type = 'premium_ad' AND listing_id IN (
      SELECT id FROM public.ads WHERE user_id = auth.uid()
    ))
    OR
    -- Para superadmin (puede gestionar todo)
    auth.uid() IN (
      SELECT id FROM public.users WHERE role = 'superadmin'
    )
  )
)
WITH CHECK (
  auth.uid() IS NOT NULL AND (
    (listing_type = 'premium_ad' AND listing_id IN (
      SELECT id FROM public.ads WHERE user_id = auth.uid()
    ))
    OR
    auth.uid() IN (
      SELECT id FROM public.users WHERE role = 'superadmin'
    )
  )
);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_images_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para updated_at
DROP TRIGGER IF EXISTS set_images_updated_at ON public.images;
CREATE TRIGGER set_images_updated_at
  BEFORE UPDATE ON public.images
  FOR EACH ROW
  EXECUTE FUNCTION update_images_updated_at();

-- Vista para estadísticas de imágenes
CREATE OR REPLACE VIEW public.images_stats AS
SELECT 
  listing_type,
  COUNT(*) as total_images,
  SUM(CASE WHEN is_optimized = true THEN 1 ELSE 0 END) as optimized_images,
  AVG(file_size) as avg_file_size,
  AVG(optimized_size) as avg_optimized_size,
  SUM(file_size) as total_storage_bytes,
  SUM(optimized_size) as total_optimized_storage_bytes
FROM public.images
GROUP BY listing_type;

-- Comentarios para documentación
COMMENT ON TABLE public.images IS 'Tabla separada para gestionar todas las imágenes de listings';
COMMENT ON COLUMN public.images.listing_type IS 'Tipo de listing (scraped_ad o premium_ad)';
COMMENT ON COLUMN public.images.hash IS 'Hash MD5/SHA256 para detección de duplicados exactos';
COMMENT ON COLUMN public.images.perceptual_hash IS 'Perceptual hash para comparación visual de imágenes similares';
COMMENT ON COLUMN public.images.metadata IS 'Metadata JSON adicional (EXIF, dimensiones originales, etc.)';
