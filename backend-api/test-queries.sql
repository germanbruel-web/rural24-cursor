-- Verificar datos en Supabase para validar endpoints

-- 1. Verificar categorías (endpoint /api/config/categories)
SELECT 
  id, 
  name, 
  slug,
  (SELECT COUNT(*) FROM subcategories WHERE category_id = categories.id) as subcategory_count
FROM categories
ORDER BY name
LIMIT 5;

-- 2. Verificar subcategorías con marcas (endpoint /api/config/brands)
SELECT 
  sc.id as subcategory_id,
  sc.name as subcategory_name,
  c.name as category_name,
  (SELECT COUNT(DISTINCT brand_id) 
   FROM subcategory_brands sb 
   WHERE sb.subcategory_id = sc.id) as brand_count
FROM subcategories sc
JOIN categories c ON sc.category_id = c.id
WHERE EXISTS (
  SELECT 1 FROM subcategory_brands 
  WHERE subcategory_id = sc.id
)
LIMIT 5;

-- 3. Verificar marcas disponibles (endpoint /api/config/brands)
SELECT 
  b.id,
  b.name,
  COUNT(DISTINCT sb.subcategory_id) as subcategory_count
FROM brands b
JOIN subcategory_brands sb ON b.id = sb.brand_id
GROUP BY b.id, b.name
ORDER BY b.name
LIMIT 5;

-- 4. Verificar modelos disponibles (endpoint /api/config/models)
SELECT 
  m.id,
  m.name,
  b.name as brand_name
FROM models m
LEFT JOIN brands b ON m.brand_id = b.id
ORDER BY m.name
LIMIT 5;

-- 5. Verificar form_config (endpoint /api/config/form/:subcategoryId)
SELECT 
  sc.id,
  sc.name,
  c.name as category_name,
  (SELECT COUNT(*) 
   FROM dynamic_attributes 
   WHERE subcategory_id = sc.id) as attribute_count
FROM subcategories sc
JOIN categories c ON sc.category_id = c.id
WHERE EXISTS (
  SELECT 1 FROM dynamic_attributes 
  WHERE subcategory_id = sc.id
)
LIMIT 5;

-- 6. Verificar anuncios (endpoint /api/ads)
SELECT 
  a.id,
  a.title,
  a.price,
  a.status,
  c.name as category_name,
  sc.name as subcategory_name,
  a.created_at
FROM ads a
LEFT JOIN subcategories sc ON a.subcategory_id = sc.id
LEFT JOIN categories c ON sc.category_id = c.id
ORDER BY a.created_at DESC
LIMIT 5;

-- 7. Verificar usuarios superadmin (endpoint /api/admin/verify)
SELECT 
  id,
  email,
  role,
  full_name,
  created_at
FROM users
WHERE role IN ('superadmin', 'super-admin')
LIMIT 3;
