-- =====================================================
-- MIGRACIÓN: Sistema de Banners Limpio V2
-- Fecha: 2026-01-10
-- Objetivo: Arquitectura escalable con 2 ubicaciones claras
-- =====================================================

-- PASO 1: Crear ENUM para ubicaciones
CREATE TYPE banner_placement AS ENUM ('hero_vip', 'category_carousel');

-- PASO 2: Crear tabla limpia
CREATE TABLE banners_clean (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Ubicación (2 valores semánticos)
  placement banner_placement NOT NULL,
  
  -- Categoría (NULL = todas las categorías)
  category VARCHAR(100),
  
  -- Contenido publicitario
  client_name VARCHAR(255) NOT NULL,
  link_url TEXT,
  
  -- Imágenes HERO (2 obligatorias si placement = hero_vip)
  desktop_image_url TEXT, -- 1200x200px
  mobile_image_url TEXT,  -- 480x100px
  
  -- Imagen CAROUSEL (1 obligatoria si placement = category_carousel)
  carousel_image_url TEXT, -- 650x120px
  
  -- Temporalidad (opcional)
  starts_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  
  -- Estado
  is_active BOOLEAN DEFAULT true,
  
  -- Auditoría
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- CONSTRAINT: Hero requiere desktop+mobile, Carousel requiere carousel_image
  CONSTRAINT valid_images CHECK (
    (placement = 'hero_vip' AND desktop_image_url IS NOT NULL AND mobile_image_url IS NOT NULL) OR
    (placement = 'category_carousel' AND carousel_image_url IS NOT NULL)
  )
);

-- PASO 3: Índices para performance
CREATE INDEX idx_banners_clean_active 
ON banners_clean(placement, category, is_active)
WHERE is_active = true;

CREATE INDEX idx_banners_clean_expiration
ON banners_clean(expires_at)
WHERE is_active = true AND expires_at IS NOT NULL;

-- PASO 4: RLS Policies (Solo SuperAdmin)
ALTER TABLE banners_clean ENABLE ROW LEVEL SECURITY;

-- SuperAdmin: acceso total
CREATE POLICY "superadmin_all_banners" ON banners_clean
  FOR ALL 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'superadmin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'superadmin'
    )
  );

-- Lectura pública para banners activos y vigentes
CREATE POLICY "public_read_active_banners" ON banners_clean
  FOR SELECT
  TO public
  USING (
    is_active = true 
    AND (starts_at IS NULL OR starts_at <= NOW())
    AND (expires_at IS NULL OR expires_at > NOW())
  );

-- PASO 5: Función de actualización de timestamp
CREATE OR REPLACE FUNCTION update_banners_clean_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_banners_clean_updated_at
  BEFORE UPDATE ON banners_clean
  FOR EACH ROW
  EXECUTE FUNCTION update_banners_clean_updated_at();

-- PASO 6: Comentarios para documentación
COMMENT ON TABLE banners_clean IS 'Sistema de banners simplificado v2 - 2 ubicaciones: Hero VIP y Carousel Categoría';
COMMENT ON COLUMN banners_clean.placement IS 'hero_vip: Homepage hero (1200x200 + 480x100) | category_carousel: Sección categoría (650x120)';
COMMENT ON COLUMN banners_clean.category IS 'Categoría específica (NULL = todas las categorías)';
COMMENT ON COLUMN banners_clean.desktop_image_url IS 'Hero Desktop: 1200x200px (obligatorio si placement=hero_vip)';
COMMENT ON COLUMN banners_clean.mobile_image_url IS 'Hero Mobile: 480x100px (obligatorio si placement=hero_vip)';
COMMENT ON COLUMN banners_clean.carousel_image_url IS 'Carousel: 650x120px responsive (obligatorio si placement=category_carousel)';

-- ✅ Migración completada
-- Tabla banners_clean lista para usar
-- Tabla banners antigua queda intacta (para rollback si es necesario)
