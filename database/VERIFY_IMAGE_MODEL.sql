-- Verificar modelo de datos actual para imágenes

-- 1. ¿Existe columna 'images' en tabla ads?
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'ads'
  AND column_name IN ('images', 'photos');

-- 2. ¿Existe tabla ad_images separada?
SELECT EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_name = 'ad_images'
) as ad_images_table_exists;

-- 3. Si existe ad_images, ver estructura
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'ad_images'
ORDER BY ordinal_position;

-- 4. Ver relación con ads
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name IN ('ad_images', 'ads');

-- 5. Ver un ejemplo de ad con imágenes
SELECT 
    id,
    title,
    images,
    pg_typeof(images) as images_type
FROM ads
WHERE images IS NOT NULL
LIMIT 1;
