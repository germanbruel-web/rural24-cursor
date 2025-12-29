-- =====================================================
-- LIMPIEZA DEL SISTEMA VIEJO DE FORMULARIOS DINÁMICOS
-- =====================================================
-- Este script elimina tablas y columnas del sistema antiguo
-- "Centro de Gestión" con operation_types y category_types
--
-- EJECUTAR SOLO UNA VEZ - Después de hacer backup
-- =====================================================

-- 1. Eliminar vistas que dependen de las columnas viejas
DROP VIEW IF EXISTS ads_full_view CASCADE;
DROP VIEW IF EXISTS ads_full CASCADE;

-- 2. Eliminar columnas viejas de la tabla ads
ALTER TABLE ads DROP COLUMN IF EXISTS operation_type_id CASCADE;
ALTER TABLE ads DROP COLUMN IF EXISTS dynamic_fields CASCADE;

-- 2. Eliminar tabla category_types (si existe)
DROP TABLE IF EXISTS category_types CASCADE;

-- 3. Eliminar tabla operation_types (si existe)  
DROP TABLE IF EXISTS operation_types CASCADE;

-- 4. Eliminar columnas viejas de categories (si operation_type_id existe)
-- Nota: En el nuevo sistema CATALOG_MASTER_MIGRATION.sql, 
-- categories NO tiene operation_type_id, pero por seguridad verificamos
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'categories' 
    AND column_name = 'operation_type_id'
  ) THEN
    ALTER TABLE categories DROP COLUMN operation_type_id;
    RAISE NOTICE 'Columna operation_type_id eliminada de categories';
  END IF;
END $$;

-- Verificación final
SELECT 
  table_name,
  column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('ads', 'categories')
  AND column_name IN ('operation_type_id', 'dynamic_fields')
ORDER BY table_name, column_name;

-- Si la query anterior no devuelve filas, la limpieza fue exitosa ✓
