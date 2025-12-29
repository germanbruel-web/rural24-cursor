-- ================================================================
-- SOLUCIÓN: Agregar CASCADE a Foreign Keys
-- ================================================================
-- Esto permitirá que al eliminar una MARCA, automáticamente
-- se eliminen todos sus MODELOS y relaciones en SUBCATEGORY_BRANDS

-- ================================================================
-- PASO 1: MODELS - Agregar CASCADE
-- ================================================================

-- Eliminar constraint actual de models
ALTER TABLE models 
DROP CONSTRAINT IF EXISTS models_brand_id_fkey;

ALTER TABLE models
DROP CONSTRAINT IF EXISTS fk_models_brand;

-- Crear constraint nueva CON CASCADE
ALTER TABLE models
ADD CONSTRAINT models_brand_id_fkey 
FOREIGN KEY (brand_id) 
REFERENCES brands(id) 
ON DELETE CASCADE;

-- ================================================================
-- PASO 2: SUBCATEGORY_BRANDS - Agregar CASCADE
-- ================================================================

-- Eliminar constraint actual de subcategory_brands
ALTER TABLE subcategory_brands
DROP CONSTRAINT IF EXISTS subcategory_brands_brand_id_fkey;

ALTER TABLE subcategory_brands
DROP CONSTRAINT IF EXISTS fk_subcategory_brands_brand;

-- Crear constraint nueva CON CASCADE
ALTER TABLE subcategory_brands
ADD CONSTRAINT subcategory_brands_brand_id_fkey
FOREIGN KEY (brand_id)
REFERENCES brands(id)
ON DELETE CASCADE;

-- ================================================================
-- PASO 3: Verificar que los constraints tienen CASCADE
-- ================================================================

SELECT 
    tc.table_name as tabla,
    kcu.column_name as columna,
    rc.delete_rule as regla_delete,
    CASE 
        WHEN rc.delete_rule = 'CASCADE' THEN '✅ Tiene CASCADE'
        WHEN rc.delete_rule = 'NO ACTION' THEN '❌ NO tiene CASCADE'
        WHEN rc.delete_rule = 'RESTRICT' THEN '❌ RESTRICT (bloquea DELETE)'
        WHEN rc.delete_rule = 'SET NULL' THEN '⚠️ SET NULL'
        ELSE '❓ ' || rc.delete_rule
    END as estado
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.referential_constraints rc
    ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND kcu.table_name IN ('models', 'subcategory_brands')
AND kcu.column_name = 'brand_id';

-- Resultado esperado:
-- models              | brand_id | CASCADE | ✅ Tiene CASCADE
-- subcategory_brands  | brand_id | CASCADE | ✅ Tiene CASCADE

-- ================================================================
-- PASO 4: PROBAR - Crear marca de prueba y eliminarla
-- ================================================================

-- Crear marca de prueba
INSERT INTO brands (name, display_name, is_active)
VALUES ('TEST_MARCA', 'Marca de Prueba', true)
RETURNING id, name;

-- Copiar el ID que devuelve la query anterior y usarlo aquí:
-- (Reemplazá 'ID_DE_LA_MARCA_TEST' con el ID real)

/*
-- Crear un modelo para esa marca
INSERT INTO models (brand_id, name, display_name, is_active)
VALUES ('ID_DE_LA_MARCA_TEST', 'Modelo Test', 'Modelo Test', true);

-- Ahora intentá eliminar la marca - debería eliminar todo automáticamente
DELETE FROM brands WHERE id = 'ID_DE_LA_MARCA_TEST';

-- Verificar que el modelo también se eliminó
SELECT * FROM models WHERE brand_id = 'ID_DE_LA_MARCA_TEST';
-- Debe devolver 0 filas
*/

-- ================================================================
-- ✅ LISTO - Ahora podés eliminar marcas desde el admin
-- Los modelos se eliminarán automáticamente
-- ================================================================
