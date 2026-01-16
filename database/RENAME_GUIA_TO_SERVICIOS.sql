-- =====================================================
-- RENOMBRAR CATEGORÍA: "Guía del Campo" → "Servicios Rurales"
-- Fecha: 15 Enero 2026
-- =====================================================

-- 1. Actualizar tabla categories
UPDATE categories 
SET 
  name = 'Servicios Rurales',
  display_name = 'Servicios Rurales',
  slug = 'servicios-rurales',
  updated_at = NOW()
WHERE name ILIKE '%Guía del Campo%' 
   OR name ILIKE '%Guia del Campo%'
   OR name ILIKE '%Guia Comercial%'
   OR slug = 'guia-del-campo';

-- 2. Actualizar banners_clean (campo category)
UPDATE banners_clean
SET category = 'SERVICIOS RURALES'
WHERE category = 'GUIA DEL CAMPO';

-- 3. Verificar cambios
SELECT id, name, display_name, slug FROM categories WHERE slug = 'servicios-rurales';
SELECT id, client_name, category FROM banners_clean WHERE category = 'SERVICIOS RURALES';
