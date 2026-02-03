-- ============================================================================
-- MIGRACIÓN: Sincronización de nombres de categoría en tabla ads
-- Fecha: 2026-02-02
-- Problema: ads tiene category_id (UUID) pero NO tiene columna category (nombre)
-- Solución: Crear columnas + poblar datos + trigger para futuros inserts/updates
-- ============================================================================

-- ============================================================================
-- PASO 0: Agregar columnas category y subcategory si no existen
-- ============================================================================

-- Agregar columna category (nombre de categoría como texto)
ALTER TABLE ads ADD COLUMN IF NOT EXISTS category VARCHAR(255);

-- Agregar columna subcategory (nombre de subcategoría como texto)  
ALTER TABLE ads ADD COLUMN IF NOT EXISTS subcategory VARCHAR(255);

-- ============================================================================
-- PASO 1: Poblar avisos existentes con nombre de categoría
-- ============================================================================

-- Actualizar category con el display_name de categories
UPDATE ads 
SET category = c.display_name
FROM categories c
WHERE ads.category_id = c.id
  AND (ads.category IS NULL OR ads.category = '');

-- Verificar cuántos se actualizaron
DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO updated_count 
  FROM ads 
  WHERE category IS NOT NULL AND category != '';
  RAISE NOTICE 'Avisos con category actualizada: %', updated_count;
END $$;

-- ============================================================================
-- PASO 2: Poblar avisos existentes con nombre de subcategoría
-- ============================================================================

UPDATE ads 
SET subcategory = s.display_name
FROM subcategories s
WHERE ads.subcategory_id = s.id
  AND (ads.subcategory IS NULL OR ads.subcategory = '');

-- Verificar
DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO updated_count 
  FROM ads 
  WHERE subcategory IS NOT NULL AND subcategory != '';
  RAISE NOTICE 'Avisos con subcategory actualizada: %', updated_count;
END $$;

-- ============================================================================
-- PASO 3: Crear función trigger para sincronización automática
-- ============================================================================

CREATE OR REPLACE FUNCTION sync_ad_category_names()
RETURNS TRIGGER AS $$
BEGIN
  -- Sincronizar nombre de categoría si category_id está presente
  IF NEW.category_id IS NOT NULL THEN
    SELECT display_name INTO NEW.category
    FROM categories 
    WHERE id = NEW.category_id;
  END IF;
  
  -- Sincronizar nombre de subcategoría si subcategory_id está presente
  IF NEW.subcategory_id IS NOT NULL THEN
    SELECT display_name INTO NEW.subcategory
    FROM subcategories 
    WHERE id = NEW.subcategory_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PASO 4: Crear trigger en tabla ads
-- ============================================================================

-- Eliminar trigger si existe (para poder recrearlo)
DROP TRIGGER IF EXISTS trigger_sync_ad_category_names ON ads;

-- Crear trigger para INSERT y UPDATE
CREATE TRIGGER trigger_sync_ad_category_names
  BEFORE INSERT OR UPDATE OF category_id, subcategory_id
  ON ads
  FOR EACH ROW
  EXECUTE FUNCTION sync_ad_category_names();

-- ============================================================================
-- PASO 5: Verificación final
-- ============================================================================

-- Mostrar avisos con sus categorías actualizadas
SELECT 
  id,
  title,
  category,
  category_id,
  subcategory,
  subcategory_id
FROM ads
WHERE status = 'active'
ORDER BY created_at DESC
LIMIT 10;

-- ============================================================================
-- ROLLBACK (si algo sale mal)
-- ============================================================================
-- DROP TRIGGER IF EXISTS trigger_sync_ad_category_names ON ads;
-- DROP FUNCTION IF EXISTS sync_ad_category_names();
-- UPDATE ads SET category = NULL, subcategory = NULL;
