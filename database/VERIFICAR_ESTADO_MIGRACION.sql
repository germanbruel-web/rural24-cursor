-- =====================================================
-- VERIFICAR ESTADO ACTUAL DE LAS TABLAS
-- Ejecutar este query para ver qué se migró antes del error
-- =====================================================

-- Ver si las tablas independientes existen
SELECT 
  table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name LIKE '%maquinarias_%'
   OR table_name LIKE '%ganaderia_%'
   OR table_name LIKE '%insumos_%'
   OR table_name LIKE '%inmuebles_%'
   OR table_name LIKE '%servicios_%'
ORDER BY table_name;

-- Ver cuántos registros hay en cada tabla (si existen)
SELECT 
  'Maquinarias - Subcategorías' AS tabla,
  COUNT(*) AS registros
FROM maquinarias_subcategorias

UNION ALL

SELECT 
  'Maquinarias - Marcas' AS tabla,
  COUNT(*) AS registros
FROM maquinarias_marcas

UNION ALL

SELECT 
  'Maquinarias - Modelos' AS tabla,
  COUNT(*) AS registros
FROM maquinarias_modelos

UNION ALL

SELECT 
  'Ganadería - Subcategorías' AS tabla,
  COUNT(*) AS registros
FROM ganaderia_subcategorias

UNION ALL

SELECT 
  'Ganadería - Razas' AS tabla,
  COUNT(*) AS registros
FROM ganaderia_razas

UNION ALL

SELECT 
  'Inmuebles - Subcategorías' AS tabla,
  COUNT(*) AS registros
FROM inmuebles_subcategorias

UNION ALL

SELECT 
  'Insumos - Subcategorías' AS tabla,
  COUNT(*) AS registros
FROM insumos_subcategorias

UNION ALL

SELECT 
  'Insumos - Marcas' AS tabla,
  COUNT(*) AS registros
FROM insumos_marcas

UNION ALL

SELECT 
  'Servicios - Subcategorías' AS tabla,
  COUNT(*) AS registros
FROM servicios_subcategorias;
