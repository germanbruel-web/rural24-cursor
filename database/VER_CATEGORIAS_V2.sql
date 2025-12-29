-- Verificar datos en las tablas V2
-- Ejecuta esto en el SQL Editor de Supabase

-- Ver todas las categorías
SELECT 
  id,
  name,
  display_name,
  is_active,
  sort_order,
  created_at
FROM categories_v2
ORDER BY sort_order;

-- Ver todas las subcategorías
SELECT 
  s.id,
  s.name,
  s.display_name,
  c.display_name as categoria,
  s.is_active,
  s.sort_order
FROM subcategories_v2 s
LEFT JOIN categories_v2 c ON s.category_id = c.id
ORDER BY c.sort_order, s.sort_order;

-- Ver todos los tipos
SELECT 
  t.id,
  t.name,
  t.display_name,
  c.display_name as categoria,
  s.display_name as subcategoria,
  t.is_active
FROM category_types_v2 t
LEFT JOIN categories_v2 c ON t.category_id = c.id
LEFT JOIN subcategories_v2 s ON t.subcategory_id = s.id
ORDER BY c.sort_order, s.sort_order;
