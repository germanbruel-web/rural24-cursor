-- ====================================================================
-- VERIFICACIÓN PROFUNDA DE CONSTRAINTS E ÍNDICES OCULTOS
-- ====================================================================
-- Este script busca constraints e índices que pueden no aparecer en pg_constraint
-- ====================================================================

-- PASO 1: Ver TODOS los índices UNIQUE en brands (estos actúan como constraints)
SELECT 
    i.relname as index_name,
    a.attname as column_name,
    ix.indisunique as is_unique,
    ix.indisprimary as is_primary
FROM pg_class t
JOIN pg_index ix ON t.oid = ix.indrelid
JOIN pg_class i ON i.oid = ix.indexrelid
JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey)
WHERE t.relname = 'brands'
  AND t.relkind = 'r'
ORDER BY i.relname, a.attnum;

-- PASO 2: Ver definición completa de cada índice en brands
SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'brands'
ORDER BY indexname;

-- PASO 3: Buscar cualquier constraint con 'name' o 'display_name' en brands
SELECT 
  conname,
  contype,
  pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'brands'::regclass
  AND (
    conname ILIKE '%name%' 
    OR conname ILIKE '%display%'
    OR pg_get_constraintdef(oid) ILIKE '%name%'
  )
ORDER BY conname;

-- PASO 4: Intentar crear John Deere en Cosechadoras y capturar el error
DO $$
DECLARE
  v_subcategory_id UUID;
  v_error_message TEXT;
BEGIN
  -- Obtener ID de cosechadoras
  SELECT id INTO v_subcategory_id 
  FROM subcategories 
  WHERE name = 'cosechadoras' 
  LIMIT 1;
  
  IF v_subcategory_id IS NULL THEN
    RAISE NOTICE 'ERROR: No se encontró la subcategoría cosechadoras';
    RETURN;
  END IF;
  
  RAISE NOTICE 'Subcategoría cosechadoras ID: %', v_subcategory_id;
  
  -- Intentar insertar
  BEGIN
    INSERT INTO brands (subcategory_id, name, display_name, is_active)
    VALUES (v_subcategory_id, 'john_deere', 'John Deere', true);
    
    RAISE NOTICE 'SUCCESS: Marca John Deere creada en cosechadoras';
    
    -- Limpiar (rollback manual)
    DELETE FROM brands 
    WHERE subcategory_id = v_subcategory_id 
      AND name = 'john_deere';
      
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_error_message = MESSAGE_TEXT;
    RAISE NOTICE 'ERROR AL INSERTAR: %', v_error_message;
    RAISE NOTICE 'SQLSTATE: %', SQLSTATE;
  END;
END $$;

-- PASO 5: Ver estructura completa de la tabla brands
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'brands'
ORDER BY ordinal_position;

-- PASO 6: Ver si hay constraints de CHECK que puedan interferir
SELECT 
    con.conname as constraint_name,
    pg_get_constraintdef(con.oid) as definition
FROM pg_constraint con
WHERE con.conrelid = 'brands'::regclass
  AND con.contype = 'c'  -- CHECK constraints
ORDER BY con.conname;
