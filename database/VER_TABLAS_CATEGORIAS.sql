-- Ver qué tablas de categorías existen
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE '%categor%'
ORDER BY table_name;

-- Ver estructura de la tabla categories (si existe)
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'categories'
ORDER BY ordinal_position;
