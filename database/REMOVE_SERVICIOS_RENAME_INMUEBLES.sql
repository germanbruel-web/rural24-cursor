-- =====================================================
-- ELIMINAR CATEGORÍA "SERVICIOS" Y RENOMBRAR "INMUEBLES"
-- =====================================================
-- Fecha: 2025
-- Descripción: 
--   1. Elimina completamente la categoría "Servicios" y todas sus subcategorías
--   2. Renombra "Inmuebles" a "Inmuebles Rurales"
-- 
-- PRECAUCIÓN: Esta operación eliminará todos los datos relacionados con Servicios
-- =====================================================

BEGIN;

-- =====================================================
-- PASO 1: ELIMINAR CATEGORÍA "SERVICIOS"
-- =====================================================

-- Eliminar todas las subcategorías de "Servicios"
-- (Esto también eliminará en cascada: subcategory_brands, brands, models, products relacionados)
DELETE FROM subcategories 
WHERE category_id IN (
  SELECT id FROM categories WHERE display_name = 'Servicios' OR name ILIKE '%servicio%'
);

-- Eliminar la categoría "Servicios"
DELETE FROM categories 
WHERE display_name = 'Servicios' OR name ILIKE '%servicio%';

-- Verificar eliminación
SELECT 'Categorías restantes:' AS mensaje;
SELECT id, name, display_name, created_at 
FROM categories 
ORDER BY sort_order, name;

-- =====================================================
-- PASO 2: RENOMBRAR "INMUEBLES" A "INMUEBLES RURALES"
-- =====================================================

-- Actualizar el display_name de "Inmuebles" a "Inmuebles Rurales"
UPDATE categories 
SET 
  display_name = 'Inmuebles Rurales',
  name = 'inmuebles_rurales',
  updated_at = NOW()
WHERE display_name = 'Inmuebles' OR name = 'inmuebles';

-- Verificar el cambio
SELECT 'Categoría renombrada:' AS mensaje;
SELECT id, name, display_name, updated_at 
FROM categories 
WHERE name = 'inmuebles_rurales' OR display_name = 'Inmuebles Rurales';

-- =====================================================
-- VERIFICACIONES FINALES
-- =====================================================

-- Contar categorías activas
SELECT 'Total de categorías activas:' AS mensaje, COUNT(*) as total
FROM categories;

-- Listar todas las categorías con sus subcategorías
SELECT 
  c.display_name as categoria,
  COUNT(s.id) as cantidad_subcategorias
FROM categories c
LEFT JOIN subcategories s ON s.category_id = c.id
GROUP BY c.id, c.display_name, c.sort_order
ORDER BY c.sort_order, c.display_name;

-- Verificar que no queden productos huérfanos
SELECT 'Productos sin categoría válida:' AS mensaje, COUNT(*) as total
FROM products p
WHERE p.category NOT IN (SELECT display_name FROM categories)
  AND p.category IS NOT NULL;

COMMIT;

-- =====================================================
-- NOTAS IMPORTANTES:
-- =====================================================
-- 1. Esta operación es IRREVERSIBLE
-- 2. Todos los productos con categoría "Servicios" quedarán sin categoría válida
-- 3. Se recomienda hacer backup antes de ejecutar
-- 4. Las políticas RLS seguirán funcionando correctamente
-- 5. Los avisos publicados con categoría "Servicios" necesitarán ser reasignados o eliminados manualmente
-- =====================================================
