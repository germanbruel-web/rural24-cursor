-- =====================================================
-- Tabla para imágenes de avisos
-- =====================================================

CREATE TABLE IF NOT EXISTS ad_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ad_id UUID NOT NULL REFERENCES ads(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT valid_url CHECK (url ~* '^https?://.*')
);

-- Índices para búsquedas eficientes
CREATE INDEX IF NOT EXISTS idx_ad_images_ad_id ON ad_images(ad_id);
CREATE INDEX IF NOT EXISTS idx_ad_images_sort_order ON ad_images(ad_id, sort_order);

-- Comentarios
COMMENT ON TABLE ad_images IS 'Imágenes asociadas a los avisos, ordenadas por sort_order';
COMMENT ON COLUMN ad_images.sort_order IS 'Orden de visualización (0 = primera imagen)';

-- RLS Policies
ALTER TABLE ad_images ENABLE ROW LEVEL SECURITY;

-- Cualquiera puede ver imágenes de avisos publicados
CREATE POLICY "Cualquiera puede ver imágenes de avisos"
  ON ad_images FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM ads 
      WHERE ads.id = ad_images.ad_id 
        AND ads.status = 'published'
    )
  );

-- Usuario autenticado puede subir imágenes a sus propios avisos
CREATE POLICY "Usuario puede agregar imágenes a sus avisos"
  ON ad_images FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM ads WHERE ads.id = ad_images.ad_id
    )
  );

-- Usuario puede eliminar imágenes de sus propios avisos
CREATE POLICY "Usuario puede eliminar imágenes de sus avisos"
  ON ad_images FOR DELETE
  USING (
    auth.uid() IN (
      SELECT user_id FROM ads WHERE ads.id = ad_images.ad_id
    )
  );

COMMIT;
