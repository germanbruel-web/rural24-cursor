-- =====================================================
-- ACTUALIZAR IMAGEN PLACEHOLDER EN AVISOS
-- =====================================================
-- Ejecutar en Supabase SQL Editor
-- Este script actualiza todas las referencias de preview-image.webp
-- a rural24-placeholder.png en los avisos existentes

-- =====================================================
-- 1. TABLA AD_IMAGES (tabla separada de imágenes)
-- =====================================================

-- Ver cuántas imágenes tienen preview-image.webp
SELECT 
    ai.id,
    ai.ad_id,
    a.title,
    ai.url,
    ai.sort_order
FROM ad_images ai
JOIN ads a ON a.id = ai.ad_id
WHERE ai.url LIKE '%preview-image.webp%';

-- Actualizar imágenes con preview-image.webp
UPDATE ad_images
SET 
    url = '/images/rural24-placeholder.png'
WHERE url LIKE '%preview-image.webp%';

-- =====================================================
-- 2. TABLA ADS - Campo images (legacy si existe)
-- =====================================================

-- Verificar si existe el campo images en ads
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'ads' 
    AND column_name = 'images';

-- Si existe el campo images (legacy), actualizar
-- Nota: Esto solo aplica si la migración antigua no se completó
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ads' AND column_name = 'images'
    ) THEN
        EXECUTE '
            UPDATE ads
            SET 
                images = jsonb_set(
                    images,
                    ''{0}'',
                    ''"/images/rural24-placeholder.png"''::jsonb
                ),
                updated_at = NOW()
            WHERE images IS NOT NULL
                AND images::text LIKE ''%preview-image.webp%''
        ';
    END IF;
END $$;

-- =====================================================
-- 3. TABLA PRODUCTS (legacy) - Campo imageUrl (string)
-- =====================================================

-- Ver cuántos productos tienen preview-image.webp
SELECT 
    id, 
    title, 
    image_url
FROM products
WHERE image_url LIKE '%preview-image.webp%';

-- Actualizar productos con preview-image.webp
UPDATE products
SET 
    image_url = '/images/rural24-placeholder.png',
    updated_at = NOW()
WHERE image_url LIKE '%preview-image.webp%';

-- =====================================================
-- 4. VERIFICACIÓN POST-ACTUALIZACIÓN
-- =====================================================

-- Verificar que no quedan imágenes con preview-image.webp
SELECT 
    'ad_images' as tabla,
    COUNT(*) as total_con_preview
FROM ad_images
WHERE url LIKE '%preview-image.webp%'

UNION ALL

SELECT 
    'products' as tabla,
    COUNT(*) as total_con_preview
FROM products
WHERE image_url LIKE '%preview-image.webp%';

-- =====================================================
-- 6. ESTADÍSTICAS FINALES
-- =====================================================

-- Mostrar imágenes actualizadas
SELECT 
    ai.id,
    ai.ad_id,
    a.title,
    ai.url,
    ai.sort_order
FROM ad_images ai
JOIN ads a ON a.id = ai.ad_id
WHERE ai.url LIKE '%rural24-placeholder%'
ORDER BY ai.ad_id DESC
LIMIT 10;

-- Contar total de avisos por tipo de imagen
SELECT 
    CASE 
        WHEN ai.url LIKE '%rural24-placeholder%' THEN 'Con placeholder Rural24'
        WHEN ai.url IS NULL THEN 'Sin imágenes'
        ELSE 'Con imágenes reales'
    END as tipo_imagen,
    COUNT(DISTINCT a.id) as total_avisos
FROM ads a
LEFT JOIN ad_images ai ON ai.ad_id = a.id AND ai.sort_order = 0
GROUP BY tipo_imagen
ORDER BY total_avisos DESC;

-- =====================================================
-- NOTAS IMPORTANTES:
-- =====================================================
-- 
-- 1. Este script es SEGURO: solo actualiza referencias a preview-image.webp
-- 2. NO afecta avisos con imágenes reales de usuarios
-- 3. Las imágenes están en tabla separada: ad_images (no en ads.image_urls)
-- 4. Si tienes muchos registros, ejecuta por lotes:
--
--    UPDATE ad_images
--    SET url = '/images/rural24-placeholder.png'
--    WHERE id IN (
--        SELECT id FROM ad_images 
--        WHERE url LIKE '%preview-image.webp%'
--        LIMIT 1000
--    );
--
-- 5. BACKUP: Considera hacer backup antes si tienes muchos datos:
--
--    CREATE TABLE ad_images_backup_20251226 AS 
--    SELECT * FROM ad_images WHERE url LIKE '%preview-image.webp%';
--
-- 6. ESTRUCTURA DE BD:
--    - Tabla ads: contiene datos del aviso (title, description, etc)
--    - Tabla ad_images: contiene URLs de imágenes relacionadas
--    - Relación: ad_images.ad_id -> ads.id (1:N)
--
-- =====================================================
