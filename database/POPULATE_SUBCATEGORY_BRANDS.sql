-- =====================================================
-- POBLAR SUBCATEGORY_BRANDS
-- Asigna marcas específicas a cada subcategoría
-- =====================================================

-- MAQUINARIAS > TRACTORES
INSERT INTO subcategory_brands (subcategory_id, brand_id, sort_order)
SELECT 
  s.id as subcategory_id,
  b.id as brand_id,
  ROW_NUMBER() OVER (PARTITION BY s.id ORDER BY b.display_name) as sort_order
FROM subcategories s
CROSS JOIN brands b
WHERE s.name = 'Tractores' 
  AND b.name IN ('John Deere', 'Case IH', 'New Holland', 'Massey Ferguson', 'Valtra', 'Deutz-Fahr', 'Fendt', 'Kubota', 'Landini', 'Same')
ON CONFLICT (subcategory_id, brand_id) DO NOTHING;

-- MAQUINARIAS > COSECHADORAS
INSERT INTO subcategory_brands (subcategory_id, brand_id, sort_order)
SELECT 
  s.id as subcategory_id,
  b.id as brand_id,
  ROW_NUMBER() OVER (PARTITION BY s.id ORDER BY b.display_name) as sort_order
FROM subcategories s
CROSS JOIN brands b
WHERE s.name = 'Cosechadoras' 
  AND b.name IN ('John Deere', 'Case IH', 'New Holland', 'Massey Ferguson', 'Claas', 'Deutz-Fahr')
ON CONFLICT (subcategory_id, brand_id) DO NOTHING;

-- MAQUINARIAS > PULVERIZADORAS
INSERT INTO subcategory_brands (subcategory_id, brand_id, sort_order)
SELECT 
  s.id as subcategory_id,
  b.id as brand_id,
  ROW_NUMBER() OVER (PARTITION BY s.id ORDER BY b.display_name) as sort_order
FROM subcategories s
CROSS JOIN brands b
WHERE s.name = 'Pulverizadoras' 
  AND b.name IN ('Metalfor', 'Pla', 'Apache', 'Hardi', 'John Deere', 'Case IH')
ON CONFLICT (subcategory_id, brand_id) DO NOTHING;

-- MAQUINARIAS > SEMBRADORAS
INSERT INTO subcategory_brands (subcategory_id, brand_id, sort_order)
SELECT 
  s.id as subcategory_id,
  b.id as brand_id,
  ROW_NUMBER() OVER (PARTITION BY s.id ORDER BY b.display_name) as sort_order
FROM subcategories s
CROSS JOIN brands b
WHERE s.name = 'Sembradoras' 
  AND b.name IN ('Apache', 'Agrometal', 'Pla', 'John Deere', 'Case IH', 'Bertini')
ON CONFLICT (subcategory_id, brand_id) DO NOTHING;

-- GANADERÍA > VACAS (ejemplo con razas como "marcas")
INSERT INTO subcategory_brands (subcategory_id, brand_id, sort_order)
SELECT 
  s.id as subcategory_id,
  b.id as brand_id,
  ROW_NUMBER() OVER (PARTITION BY s.id ORDER BY b.display_name) as sort_order
FROM subcategories s
CROSS JOIN brands b
WHERE s.name IN ('Vacas', 'Vaquillonas', 'Terneros') 
  AND b.name IN ('Angus', 'Hereford', 'Brangus', 'Braford', 'Limousin', 'Charolais', 'Holando', 'Jersey')
ON CONFLICT (subcategory_id, brand_id) DO NOTHING;

-- GANADERÍA > TOROS
INSERT INTO subcategory_brands (subcategory_id, brand_id, sort_order)
SELECT 
  s.id as subcategory_id,
  b.id as brand_id,
  ROW_NUMBER() OVER (PARTITION BY s.id ORDER BY b.display_name) as sort_order
FROM subcategories s
CROSS JOIN brands b
WHERE s.name = 'Toros' 
  AND b.name IN ('Angus', 'Hereford', 'Brangus', 'Braford', 'Limousin', 'Charolais', 'Shorthorn')
ON CONFLICT (subcategory_id, brand_id) DO NOTHING;

-- =====================================================
-- VERIFICACIÓN
-- =====================================================

-- Ver resumen de asignaciones
SELECT 
  c.display_name as categoria,
  s.display_name as subcategoria,
  COUNT(sb.brand_id) as num_marcas
FROM categories c
JOIN subcategories s ON s.category_id = c.id
LEFT JOIN subcategory_brands sb ON sb.subcategory_id = s.id
GROUP BY c.id, c.display_name, s.id, s.display_name
ORDER BY c.display_name, s.display_name;

-- Total de relaciones creadas
SELECT 
  'subcategory_brands' as tabla,
  COUNT(*) as registros,
  COUNT(DISTINCT subcategory_id) as subcategorias_con_marcas,
  COUNT(DISTINCT brand_id) as marcas_asignadas
FROM subcategory_brands;
