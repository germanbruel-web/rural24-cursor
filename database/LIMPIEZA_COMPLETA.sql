-- ============================================================================
-- LIMPIEZA Y PROFESIONALIZACIÓN DEL SISTEMA
-- ============================================================================
-- Este script elimina el sistema legacy y renombra las tablas V2 sin sufijo
-- Ejecutar TODO en orden en Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- PASO 1: ELIMINAR AVISOS LEGACY
-- ============================================================================

-- Ver qué avisos se van a eliminar
SELECT 
  id,
  title,
  category_id,
  subcategory_id,
  created_at
FROM ads
WHERE category_id IS NOT NULL 
  AND category_id NOT IN (SELECT id FROM categories_v2);

-- Eliminar avisos que apuntan a categorías legacy
DELETE FROM ads
WHERE category_id IS NOT NULL 
  AND category_id NOT IN (SELECT id FROM categories_v2);

-- Verificar que no quedan avisos huérfanos
SELECT COUNT(*) as avisos_restantes FROM ads;

-- ============================================================================
-- PASO 2: DROPEAR TABLAS LEGACY
-- ============================================================================

-- Dropear tablas antiguas (esto eliminará TODAS las categorías legacy)
DROP TABLE IF EXISTS subcategories CASCADE;
DROP TABLE IF EXISTS categories CASCADE;

-- Verificar que se eliminaron
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('categories', 'subcategories');

-- ============================================================================
-- PASO 3: RENOMBRAR TABLAS V2 → SIN SUFIJO
-- ============================================================================

-- Renombrar tablas
ALTER TABLE categories_v2 RENAME TO categories;
ALTER TABLE subcategories_v2 RENAME TO subcategories;
ALTER TABLE category_types_v2 RENAME TO category_types;

-- Renombrar constraints (foreign keys)
-- Subcategories
ALTER TABLE subcategories 
  RENAME CONSTRAINT subcategories_v2_category_id_fkey TO subcategories_category_id_fkey;

ALTER TABLE subcategories 
  RENAME CONSTRAINT subcategories_v2_category_id_name_key TO subcategories_category_id_name_key;

-- Category Types
ALTER TABLE category_types 
  RENAME CONSTRAINT category_types_v2_category_id_fkey TO category_types_category_id_fkey;

ALTER TABLE category_types 
  RENAME CONSTRAINT category_types_v2_subcategory_id_fkey TO category_types_subcategory_id_fkey;

ALTER TABLE category_types 
  RENAME CONSTRAINT category_types_v2_category_id_subcategory_id_name_key TO category_types_category_id_subcategory_id_name_key;

-- Dynamic Attributes ya tiene los nombres correctos (no renombrar)

-- Los índices ya tienen nombres correctos (skip)

-- ============================================================================
-- PASO 4: VERIFICACIÓN FINAL
-- ============================================================================

-- Ver estructura final
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE '%categor%'
ORDER BY table_name;

-- Ver datos actuales
SELECT 
  'categories' as tabla,
  COUNT(*) as registros
FROM categories
UNION ALL
SELECT 
  'subcategories',
  COUNT(*)
FROM subcategories
UNION ALL
SELECT 
  'category_types',
  COUNT(*)
FROM category_types
UNION ALL
SELECT 
  'dynamic_attributes',
  COUNT(*)
FROM dynamic_attributes;

-- Verificar que las foreign keys funcionan
SELECT 
  c.display_name as categoria,
  COUNT(s.id) as subcategorias
FROM categories c
LEFT JOIN subcategories s ON s.category_id = c.id
GROUP BY c.id, c.display_name;

-- ============================================================================
-- ✅ RESULTADO ESPERADO
-- ============================================================================
-- Tablas finales:
-- ✓ categories (sin _v2)
-- ✓ subcategories (sin _v2)
-- ✓ category_types (sin _v2)
-- ✓ dynamic_attributes (ya estaba bien)
--
-- Datos:
-- ✓ 1 categoría: Maquinaria Agrícola
-- ✓ 5 subcategorías
-- ✓ 1+ tipos
-- ✓ 0 avisos legacy
-- ============================================================================

SELECT '✅ LIMPIEZA COMPLETA - Sistema profesionalizado' as status;
