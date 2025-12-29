-- Ver la estructura de imágenes de los avisos destacados
SELECT 
  id,
  title,
  images,
  image_urls,
  CASE 
    WHEN images IS NOT NULL THEN pg_typeof(images)::text
    WHEN image_urls IS NOT NULL THEN pg_typeof(image_urls)::text
    ELSE 'No tiene imágenes'
  END as tipo_imagenes
FROM ads
WHERE featured = true
LIMIT 3;
