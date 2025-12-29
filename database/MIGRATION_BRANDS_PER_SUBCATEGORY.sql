-- ========================================
-- MIGRACIÓN: Brands por Subcategoría
-- ========================================
-- OBJETIVO: Permitir que la misma marca exista en diferentes subcategorías
-- Ejemplo: "John Deere" en Tractores Y "John Deere" en Cosechadoras

-- PASO 1: Agregar columna subcategory_id a brands (nullable temporalmente)
ALTER TABLE brands 
ADD COLUMN IF NOT EXISTS subcategory_id UUID;

-- PASO 2: Migrar datos de subcategory_brands a brands.subcategory_id
-- (Toma la primera relación de cada marca)
UPDATE brands b
SET subcategory_id = (
  SELECT sb.subcategory_id 
  FROM subcategory_brands sb 
  WHERE sb.brand_id = b.id 
  LIMIT 1
)
WHERE b.subcategory_id IS NULL;

-- PASO 3: Verificar migración y detectar marcas huérfanas
SELECT 
  b.display_name,
  b.subcategory_id,
  s.display_name as subcategory_name,
  CASE WHEN b.subcategory_id IS NULL THEN '⚠️ HUERFANA' ELSE '✅ OK' END as estado
FROM brands b
LEFT JOIN subcategories s ON b.subcategory_id = s.id
ORDER BY b.subcategory_id NULLS FIRST, b.display_name;

-- PASO 3.5: Eliminar marcas huérfanas (sin subcategoría asignada)
-- Estas marcas no tienen relación en subcategory_brands
DELETE FROM brands WHERE subcategory_id IS NULL;

-- Verificar que no queden marcas sin subcategoría
SELECT COUNT(*) as marcas_sin_subcategoria FROM brands WHERE subcategory_id IS NULL;

-- PASO 4: Hacer subcategory_id NOT NULL
ALTER TABLE brands 
ALTER COLUMN subcategory_id SET NOT NULL;

-- PASO 5: Agregar foreign key
ALTER TABLE brands
ADD CONSTRAINT brands_subcategory_id_fkey 
FOREIGN KEY (subcategory_id) 
REFERENCES subcategories(id) 
ON DELETE CASCADE;

-- PASO 6: Eliminar constraint de unicidad global
ALTER TABLE brands 
DROP CONSTRAINT IF EXISTS brands_display_name_unique;

ALTER TABLE brands 
DROP CONSTRAINT IF EXISTS brands_name_unique;

-- PASO 7: Crear constraint de unicidad compuesto (por subcategoría)
ALTER TABLE brands
ADD CONSTRAINT brands_subcategory_display_name_unique 
UNIQUE (subcategory_id, display_name);

ALTER TABLE brands
ADD CONSTRAINT brands_subcategory_name_unique 
UNIQUE (subcategory_id, name);

-- PASO 8: Eliminar tabla intermedia subcategory_brands (ya no necesaria)
DROP TABLE IF EXISTS subcategory_brands CASCADE;

-- PASO 9: Verificación final
SELECT 
  'Total brands' as metric, 
  COUNT(*) as count 
FROM brands
UNION ALL
SELECT 
  'Brands with subcategory', 
  COUNT(*) 
FROM brands 
WHERE subcategory_id IS NOT NULL
UNION ALL
SELECT 
  'Unique brand names (global)', 
  COUNT(DISTINCT display_name) 
FROM brands;

-- ========================================
-- RESULTADO ESPERADO:
-- ========================================
-- ✅ Ahora puedes crear "John Deere" en Tractores
-- ✅ Y también crear "John Deere" en Cosechadoras
-- ✅ Serán dos registros diferentes con IDs únicos
-- ✅ Cada uno con su propia lista de modelos

-- Ejemplo de consulta después de migración:
SELECT 
  b.display_name as marca,
  s.display_name as subcategoria,
  COUNT(m.id) as total_modelos
FROM brands b
JOIN subcategories s ON b.subcategory_id = s.id
LEFT JOIN models m ON m.brand_id = b.id
GROUP BY b.id, b.display_name, s.display_name
ORDER BY b.display_name, s.display_name;
