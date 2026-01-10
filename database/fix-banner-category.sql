-- Corregir banners con categoría 'maquinarias' a 'maquinaria'
-- Ejecutar en Supabase SQL Editor

UPDATE banners_clean 
SET category = 'maquinaria'
WHERE category = 'maquinarias';

-- Verificar
SELECT id, placement, category, client_name 
FROM banners_clean 
ORDER BY created_at DESC 
LIMIT 10;
