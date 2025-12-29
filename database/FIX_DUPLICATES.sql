-- =====================================================
-- ELIMINAR DUPLICADOS EN GESTIÓN DE CATEGORÍAS
-- =====================================================

BEGIN;

-- 1. ELIMINAR DUPLICADOS EN subcategory_brands
-- Mantener solo el primer registro para cada combinación subcategory_id + brand_id
DELETE FROM subcategory_brands
WHERE id IN (
  SELECT sb.id
  FROM subcategory_brands sb
  WHERE EXISTS (
    SELECT 1
    FROM subcategory_brands sb2
    WHERE sb2.subcategory_id = sb.subcategory_id
      AND sb2.brand_id = sb.brand_id
      AND sb2.id < sb.id
  )
);

-- 2. ELIMINAR DUPLICADOS EN categories (por display_name)
-- Mantener solo el primer registro para cada display_name
DELETE FROM categories
WHERE id IN (
  SELECT c.id
  FROM categories c
  WHERE EXISTS (
    SELECT 1
    FROM categories c2
    WHERE c2.display_name = c.display_name
      AND c2.created_at < c.created_at
  )
);

-- 3. ELIMINAR DUPLICADOS EN subcategories (por display_name y category_id)
-- Mantener solo el primer registro para cada combinación
DELETE FROM subcategories
WHERE id IN (
  SELECT s.id
  FROM subcategories s
  WHERE EXISTS (
    SELECT 1
    FROM subcategories s2
    WHERE s2.category_id = s.category_id
      AND s2.display_name = s.display_name
      AND s2.created_at < s.created_at
  )
);

-- 4. ELIMINAR DUPLICADOS EN brands (por display_name)
-- Mantener solo el primer registro para cada display_name
DELETE FROM brands
WHERE id IN (
  SELECT b.id
  FROM brands b
  WHERE EXISTS (
    SELECT 1
    FROM brands b2
    WHERE b2.display_name = b.display_name
      AND b2.created_at < b.created_at
  )
);

-- 5. ELIMINAR DUPLICADOS EN models (por display_name y brand_id)
-- Mantener solo el primer registro para cada combinación
DELETE FROM models
WHERE id IN (
  SELECT m.id
  FROM models m
  WHERE EXISTS (
    SELECT 1
    FROM models m2
    WHERE m2.brand_id = m.brand_id
      AND m2.display_name = m.display_name
      AND m2.created_at < m.created_at
  )
);

-- Verificación final
SELECT 'Duplicados eliminados exitosamente' as status;

-- Mostrar conteo final de registros
SELECT 
  'categories' as tabla,
  COUNT(*) as total_registros
FROM categories
UNION ALL
SELECT 
  'subcategories',
  COUNT(*)
FROM subcategories
UNION ALL
SELECT 
  'brands',
  COUNT(*)
FROM brands
UNION ALL
SELECT 
  'models',
  COUNT(*)
FROM models
UNION ALL
SELECT 
  'subcategory_brands (relaciones)',
  COUNT(*)
FROM subcategory_brands;

COMMIT;

-- Si hay algún error, deshacer todo:
-- ROLLBACK;
