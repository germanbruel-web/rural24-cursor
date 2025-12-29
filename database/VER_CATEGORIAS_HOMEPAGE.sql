-- Ver todas las categorías activas con su orden y nombre
SELECT 
  id,
  name,
  display_name,
  icon,
  is_active,
  sort_order,
  created_at
FROM categories
WHERE is_active = true
ORDER BY sort_order, name;

-- Contar avisos activos por categoría
SELECT 
  c.name,
  c.display_name,
  c.sort_order,
  COUNT(a.id) as total_avisos_activos,
  COUNT(CASE WHEN a.featured = true THEN 1 END) as avisos_destacados
FROM categories c
LEFT JOIN ads a ON a.category_id = c.id AND a.status = 'active'
WHERE c.is_active = true
GROUP BY c.id, c.name, c.display_name, c.sort_order
ORDER BY c.sort_order, c.name;
