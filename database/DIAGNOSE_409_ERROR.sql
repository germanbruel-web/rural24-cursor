-- ====================================================================
-- DIAGNOSE 409 CONFLICT ERROR
-- ====================================================================
-- Ejecutar este script en Supabase SQL Editor para diagnosticar el error
-- ====================================================================

-- PASO 1: Ver TODOS los constraints en la tabla brands
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(c.oid) AS constraint_definition,
  contype AS constraint_type
FROM pg_constraint c
WHERE conrelid = 'brands'::regclass
ORDER BY conname;

-- PASO 2: Ver TODOS los constraints en la tabla models
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(c.oid) AS constraint_definition,
  contype AS constraint_type
FROM pg_constraint c
WHERE conrelid = 'models'::regclass
ORDER BY conname;

-- PASO 3: Ver indices en brands (pueden causar constraints implícitos)
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'brands'
ORDER BY indexname;

-- PASO 4: Ver indices en models
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'models'
ORDER BY indexname;

-- PASO 5: Intentar crear marca duplicada para ver error exacto
-- (comentar/descomentar según necesites probar)
/*
INSERT INTO brands (subcategory_id, name, display_name, is_active)
SELECT 
  (SELECT id FROM subcategories WHERE name = 'cosechadoras' LIMIT 1),
  'john_deere',
  'John Deere',
  true;
*/

-- PASO 6: Ver marcas existentes con John Deere
SELECT 
  b.id,
  b.name,
  b.display_name,
  b.subcategory_id,
  s.name as subcategory_name,
  s.display_name as subcategory_display_name
FROM brands b
LEFT JOIN subcategories s ON b.subcategory_id = s.id
WHERE b.name ILIKE '%john%deere%' OR b.display_name ILIKE '%john%deere%'
ORDER BY s.name;

-- PASO 7: Ver si hay RLS policies bloqueando
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename IN ('brands', 'models')
ORDER BY tablename, policyname;

-- PASO 8: Ver si hay triggers que puedan interferir
SELECT 
  tgname AS trigger_name,
  tgrelid::regclass AS table_name,
  tgtype,
  tgenabled
FROM pg_trigger
WHERE tgrelid IN ('brands'::regclass, 'models'::regclass)
  AND tgname NOT LIKE 'RI_ConstraintTrigger%'
ORDER BY table_name, trigger_name;
