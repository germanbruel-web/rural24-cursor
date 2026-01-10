-- =====================================================
-- MIGRACIÓN: Agregar tipos de banners para página de resultados
-- Fecha: 2026-01-10
-- Objetivo: Expandir sistema de banners con RL y RI
-- =====================================================

-- PASO 1: Eliminar constraint antiguo de tipo
ALTER TABLE banners DROP CONSTRAINT IF EXISTS banners_type_check;

-- PASO 2: Agregar nuevos tipos al constraint
ALTER TABLE banners 
ADD CONSTRAINT banners_type_check 
CHECK (type IN (
  'homepage_vip',        -- BV: Hero principal (sin categoría)
  'homepage_category',   -- BC: Carruseles por categoría (con categoría)
  'results_lateral',     -- RL: Sidebar en búsqueda (con categoría)
  'results_intercalated' -- RI: Entre cards de resultados (con categoría)
));

-- PASO 3: Actualizar banners existentes sin categoría (asignar categoría por defecto)
UPDATE banners 
SET category = 'Inmuebles Rurales'
WHERE category IS NULL OR category = '' OR TRIM(category) = '';

-- PASO 4: Actualizar CHECK constraint de categoría para incluir nuevos tipos
ALTER TABLE banners DROP CONSTRAINT IF EXISTS banners_category_check;

ALTER TABLE banners 
ADD CONSTRAINT banners_category_check 
CHECK (
  -- TODOS los tipos requieren categoría
  category IS NOT NULL
);

-- PASO 5: Agregar campo is_featured para destacados (estrella)
ALTER TABLE banners 
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT false;

-- PASO 6: Crear índice para queries por tipo + categoría
CREATE INDEX IF NOT EXISTS idx_banners_type_category 
ON banners(type, category) 
WHERE is_active = true;

-- PASO 7: Crear índice para queries por tipo + device
CREATE INDEX IF NOT EXISTS idx_banners_type_device 
ON banners(type, device_target) 
WHERE is_active = true;

-- PASO 8: Crear índice para destacados
CREATE INDEX IF NOT EXISTS idx_banners_featured 
ON banners(is_featured) 
WHERE is_active = true AND is_featured = true;

-- ✅ Migración completada
-- Tipos disponibles: BV/BC/RL/RI (todos con categoría obligatoria)
-- Campo is_featured para destacar banners con estrella
