-- =====================================================
-- SCHEMA: Banners Management
-- Descripción: Sistema de gestión de banners publicitarios
-- Fecha: 2024
-- =====================================================

-- Eliminar objetos existentes si hay conflictos
DROP TABLE IF EXISTS banners CASCADE;

-- Crear tabla de banners
CREATE TABLE banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Tipo de banner
  type TEXT NOT NULL CHECK (type IN (
    'homepage_search',      -- Banner Buscador Dinámico (Homepage - Posición 1)
    'homepage_carousel',    -- Banner Categoría Carrusel (Homepage - Posición 2)
    'results_intercalated', -- Banner Resultados Intercalado cada 5 (Resultados - Posición 3)
    'results_lateral'       -- Banner Lateral Rotativo A-B-C-D (Resultados - Posición 4)
  )),
  
  -- Información básica
  title TEXT NOT NULL,
  image_url TEXT NOT NULL,
  link_url TEXT,
  
  -- Categoría (opcional - para filtrar por categoría)
  category TEXT,
  
  -- Posición (solo para banners laterales)
  "position" TEXT CHECK ("position" IN ('A', 'B', 'C', 'D') OR "position" IS NULL),
  
  -- Dispositivo objetivo
  device_target TEXT NOT NULL DEFAULT 'both' CHECK (device_target IN ('desktop', 'mobile', 'both')),
  
  -- Estado y orden
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  
  -- Estadísticas (opcional para futuras implementaciones)
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para mejorar rendimiento
CREATE INDEX idx_banners_type ON banners(type);
CREATE INDEX idx_banners_category ON banners(category);
CREATE INDEX idx_banners_active ON banners(is_active);
CREATE INDEX idx_banners_display_order ON banners(display_order);
CREATE INDEX idx_banners_type_active_order ON banners(type, is_active, display_order);
CREATE INDEX idx_banners_position ON banners("position");
CREATE INDEX idx_banners_device_target ON banners(device_target);
CREATE INDEX idx_banners_type_device_active ON banners(type, device_target, is_active);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_banners_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_banners_updated_at
BEFORE UPDATE ON banners
FOR EACH ROW
EXECUTE FUNCTION update_banners_updated_at();

-- =====================================================
-- RLS (Row Level Security) Policies
-- =====================================================

-- Habilitar RLS
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;

-- Policy: Lectura pública (cualquiera puede ver banners activos)
CREATE POLICY "Banners activos son públicos"
ON banners
FOR SELECT
USING (is_active = true);

-- Policy: Solo superadmins pueden insertar
CREATE POLICY "Solo superadmins pueden crear banners"
ON banners
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'superadmin'
  )
);

-- Policy: Solo superadmins pueden actualizar
CREATE POLICY "Solo superadmins pueden actualizar banners"
ON banners
FOR UPDATE
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

-- Policy: Solo superadmins pueden eliminar
CREATE POLICY "Solo superadmins pueden eliminar banners"
ON banners
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'superadmin'
  )
);

-- Policy: Superadmins pueden ver todos los banners (activos e inactivos)
CREATE POLICY "Superadmins pueden ver todos los banners"
ON banners
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'superadmin'
  )
);

-- =====================================================
-- Datos de ejemplo (comentados - descomentar si se necesitan)
-- =====================================================

/*
-- Banner Buscador Dinámico - Maquinarias
INSERT INTO banners (type, title, image_url, category, is_active, display_order)
VALUES (
  'homepage_search',
  'Banner Maquinarias - Buscador',
  'https://example.com/banner-maquinarias.webp',
  'Maquinarias',
  true,
  1
);

-- Banner Categoría Carrusel - Ganadería
INSERT INTO banners (type, title, image_url, category, is_active, display_order)
VALUES (
  'homepage_carousel',
  'Banner Ganadería - Carrusel',
  'https://example.com/banner-ganaderia.webp',
  'Ganadería',
  true,
  1
);

-- Banner Resultados Intercalado - Insumos
INSERT INTO banners (type, title, image_url, category, is_active, display_order)
VALUES (
  'results_intercalated',
  'Banner Insumos - Resultados',
  'https://example.com/banner-insumos.webp',
  'Insumos',
  true,
  1
);

-- Banner Lateral Posición A - Inmuebles
INSERT INTO banners (type, title, image_url, link_url, category, position, is_active, display_order)
VALUES (
  'results_lateral',
  'Banner Inmuebles - Lateral A',
  'https://example.com/banner-inmuebles.webp',
  'https://example.com/inmuebles',
  'Inmuebles',
  'A',
  true,
  1
);
*/

-- =====================================================
-- Funciones útiles
-- =====================================================

-- Función para obtener banner random intercalado por categoría
CREATE OR REPLACE FUNCTION get_random_intercalated_banner(p_category TEXT DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  title TEXT,
  image_url TEXT,
  link_url TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT b.id, b.title, b.image_url, b.link_url
  FROM banners b
  WHERE b.type = 'results_intercalated'
    AND b.is_active = true
    AND (p_category IS NULL OR b.category = p_category OR b.category IS NULL)
  ORDER BY RANDOM()
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Función para obtener banners laterales ordenados por posición
CREATE OR REPLACE FUNCTION get_lateral_banners(p_category TEXT DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  title TEXT,
  image_url TEXT,
  link_url TEXT,
  "position" TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT b.id, b.title, b.image_url, b.link_url, b."position"
  FROM banners b
  WHERE b.type = 'results_lateral'
    AND b.is_active = true
    AND (p_category IS NULL OR b.category = p_category OR b.category IS NULL)
  ORDER BY b."position", b.display_order
  LIMIT 4;
END;
$$ LANGUAGE plpgsql;

-- Función para obtener banners de homepage por tipo
CREATE OR REPLACE FUNCTION get_homepage_banners(p_type TEXT, p_category TEXT DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  title TEXT,
  image_url TEXT,
  link_url TEXT,
  category TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT b.id, b.title, b.image_url, b.link_url, b.category
  FROM banners b
  WHERE b.type = p_type
    AND b.is_active = true
    AND (p_category IS NULL OR b.category = p_category OR b.category IS NULL)
  ORDER BY b.display_order, b.created_at DESC
  LIMIT 6;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Comentarios de documentación
-- =====================================================

COMMENT ON TABLE banners IS 'Tabla de banners publicitarios del sitio';
COMMENT ON COLUMN banners.type IS 'Tipo de banner: homepage_search, homepage_carousel, results_intercalated, results_lateral';
COMMENT ON COLUMN banners.title IS 'Título descriptivo del banner (solo para admin)';
COMMENT ON COLUMN banners.image_url IS 'URL de la imagen del banner';
COMMENT ON COLUMN banners.link_url IS 'URL de destino al hacer clic (opcional)';
COMMENT ON COLUMN banners.category IS 'Categoría asociada (opcional - para filtrar por categoría)';
COMMENT ON COLUMN banners."position" IS 'Posición lateral (A, B, C, D) - solo para results_lateral';
COMMENT ON COLUMN banners.is_active IS 'Si el banner está activo o no';
COMMENT ON COLUMN banners.display_order IS 'Orden de visualización (menor = primero)';
COMMENT ON COLUMN banners.impressions IS 'Contador de impresiones (futuro)';
COMMENT ON COLUMN banners.clicks IS 'Contador de clicks (futuro)';
