-- 1. Ver cuántos avisos activos hay en Ganadería
SELECT COUNT(*) as total_avisos_ganaderia
FROM ads a
JOIN categories c ON a.category_id = c.id
WHERE c.name = 'ganaderia'
  AND a.status = 'active';

-- 2. Ver los avisos de Ganadería disponibles
SELECT 
  a.id,
  a.title,
  a.price,
  a.created_at,
  a.featured
FROM ads a
JOIN categories c ON a.category_id = c.id
WHERE c.name = 'ganaderia'
  AND a.status = 'active'
ORDER BY a.created_at DESC
LIMIT 10;

-- 3. Marcar los primeros 8 avisos de Ganadería como destacados
-- (Ejecuta SOLO si quieres marcar automáticamente)
WITH ganaderia_category AS (
  SELECT id FROM categories WHERE name = 'ganaderia' LIMIT 1
),
avisos_a_destacar AS (
  SELECT 
    a.id,
    ROW_NUMBER() OVER (ORDER BY a.created_at DESC) as rn
  FROM ads a
  WHERE a.category_id = (SELECT id FROM ganaderia_category)
    AND a.status = 'active'
    AND a.featured = false
)
UPDATE ads
SET 
  featured = true,
  featured_at = NOW(),
  featured_order = (
    SELECT rn FROM avisos_a_destacar WHERE avisos_a_destacar.id = ads.id
  )
WHERE id IN (
  SELECT id FROM avisos_a_destacar WHERE rn <= 8
);

-- 4. Verificar resultado
SELECT 
  c.name as categoria,
  COUNT(a.id) as avisos_destacados
FROM categories c
LEFT JOIN ads a ON a.category_id = c.id AND a.featured = true
WHERE c.name IN ('maquinaria', 'ganaderia')
GROUP BY c.id, c.name
ORDER BY c.name;
