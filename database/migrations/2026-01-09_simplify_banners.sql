-- =====================================================
-- MIGRACIÓN: Simplificar Sistema de Banners
-- Fecha: 2026-01-09
-- Estado actual: 14 banners (12 homepage_search, 2 homepage_carousel)
-- =====================================================

-- PASO 1: Agregar columna client_name con default temporal
ALTER TABLE banners ADD COLUMN IF NOT EXISTS client_name TEXT DEFAULT 'Cliente General';

-- PASO 2: Extraer nombres de clientes desde los títulos existentes
UPDATE banners SET client_name = 'Faxa' WHERE title ILIKE '%faxa%';
UPDATE banners SET client_name = 'Distribuidora Z' WHERE title ILIKE '%distribuidora%';
UPDATE banners SET client_name = 'Tobin' WHERE title ILIKE '%tobin%';
UPDATE banners SET client_name = 'Auri' WHERE title ILIKE '%auri%';
UPDATE banners SET client_name = 'MFE' WHERE title ILIKE '%mfe%';
UPDATE banners SET client_name = 'Servicios' WHERE title ILIKE '%servicios%';
UPDATE banners SET client_name = 'MATRA' WHERE title ILIKE '%matra%';
UPDATE banners SET client_name = 'Ganadería' WHERE title ILIKE '%ganaderia%' AND client_name = 'Cliente General';

-- PASO 3: Eliminar constraint de tipo antiguo (si existe)
ALTER TABLE banners DROP CONSTRAINT IF EXISTS banners_type_check;

-- PASO 4: Limpiar category para banners que serán homepage_vip (no deben tener category)
UPDATE banners 
SET category = NULL 
WHERE type = 'homepage_search';

-- PASO 5: Migrar tipos antiguos a nuevos
-- homepage_search → homepage_vip (BV: Banner VIP principal) [12 registros]
UPDATE banners 
SET type = 'homepage_vip' 
WHERE type = 'homepage_search';

-- homepage_carousel → homepage_category (BC: Banner por categoría) [2 registros]
UPDATE banners 
SET type = 'homepage_category' 
WHERE type IN ('homepage_carousel', 'category_header');

-- PASO 6: Eliminar banners de tipos deprecados (actualmente 0 registros)
DELETE FROM banners 
WHERE type IN ('results_intercalated', 'results_lateral');

-- PASO 7: Eliminar columna position (ya no se usa)
ALTER TABLE banners DROP COLUMN IF EXISTS position;

-- PASO 8: Normalizar device_target (convertir 'both' a 'desktop' si existen)
UPDATE banners 
SET device_target = 'desktop' 
WHERE device_target = 'both';

-- PASO 9: Hacer client_name NOT NULL
ALTER TABLE banners 
ALTER COLUMN client_name SET NOT NULL;

-- PASO 10: Crear nuevo constraint de tipo (solo permite los 2 tipos nuevos)
ALTER TABLE banners ADD CONSTRAINT banners_type_check 
CHECK (type IN ('homepage_vip', 'homepage_category'));

-- PASO 11: Crear índices para performance
CREATE INDEX IF NOT EXISTS idx_banners_type_active 
ON banners(type, is_active);

CREATE INDEX IF NOT EXISTS idx_banners_client_name 
ON banners(client_name);

CREATE INDEX IF NOT EXISTS idx_banners_category 
ON banners(category) 
WHERE category IS NOT NULL;

-- PASO 12: Comentarios en columnas para documentación
COMMENT ON COLUMN banners.type IS 'Tipo de banner: homepage_vip (BV: 1200x200 desktop, 480x100 mobile) | homepage_category (BC: 648x100 desktop, 480x100 mobile)';
COMMENT ON COLUMN banners.client_name IS 'Nombre del cliente/anunciante para agrupación en dashboard';
COMMENT ON COLUMN banners.device_target IS 'Dispositivo objetivo: desktop | mobile';
COMMENT ON COLUMN banners.category IS 'Categoría asociada (solo para type=homepage_category)';

-- PASO 13: Validar que category solo se use con homepage_category
ALTER TABLE banners DROP CONSTRAINT IF EXISTS check_category_only_for_bc;
ALTER TABLE banners ADD CONSTRAINT check_category_only_for_bc 
CHECK (
  (type = 'homepage_category' AND category IS NOT NULL) OR
  (type = 'homepage_vip')
);

-- ============================================
-- ROLLBACK (si es necesario)
-- ============================================
-- ALTER TABLE banners DROP COLUMN client_name;
-- DELETE FROM banners WHERE type IN ('homepage_vip', 'homepage_category');
