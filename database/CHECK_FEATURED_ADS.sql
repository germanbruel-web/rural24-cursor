-- 0. Ver estructura de la tabla categories
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'categories';

-- 1. Verificar si hay avisos marcados como featured
SELECT 
  id,
  title,
  featured,
  featured_at,
  featured_order,
  category_id,
  status
FROM ads
WHERE featured = true
ORDER BY category_id, featured_order;

-- 2. Ver el total de avisos activos por categoría
SELECT 
  c.name as categoria,
  COUNT(a.id) as total_avisos_activos
FROM categories c
LEFT JOIN ads a ON a.category_id = c.id AND a.status = 'active'
GROUP BY c.id, c.name
ORDER BY c.name;

-- 3. Marcar los primeros 8 avisos activos de cada categoría como destacados
-- (Ejecuta esto SOLO si no hay avisos destacados)
WITH avisos_para_destacar AS (
  SELECT 
    a.id,
    a.category_id,
    ROW_NUMBER() OVER (PARTITION BY a.category_id ORDER BY a.created_at DESC) as rn
  FROM ads a
  WHERE a.status = 'active'
    AND a.featured = false
)
UPDATE ads
SET 
  featured = true,
  featured_at = NOW(),
  featured_order = (
    SELECT rn 
    FROM avisos_para_destacar 
    WHERE avisos_para_destacar.id = ads.id
  )
WHERE id IN (
  SELECT id 
  FROM avisos_para_destacar 
  WHERE rn <= 8
);

-- 4. Verificar el resultado después de ejecutar el UPDATE
SELECT 
  c.name as categoria,
  COUNT(a.id) as avisos_destacados
FROM categories c
LEFT JOIN ads a ON a.category_id = c.id AND a.featured = true
GROUP BY c.id, c.name
ORDER BY c.name;
