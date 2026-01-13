-- ================================================================
-- FIX_MISSING_SLUGS.sql
-- Genera slugs para categorías y subcategorías que tengan slug = NULL
-- ================================================================

-- Función auxiliar para generar slugs (si no existe)
CREATE OR REPLACE FUNCTION generate_slug(input_text TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN lower(
    regexp_replace(
      regexp_replace(
        regexp_replace(
          regexp_replace(
            regexp_replace(input_text, '[áàäâã]', 'a', 'gi'),
            '[éèëê]', 'e', 'gi'),
          '[íìïî]', 'i', 'gi'),
        '[óòöôõ]', 'o', 'gi'),
      '[úùüû]', 'u', 'gi')
  );
END;
$$ LANGUAGE plpgsql;

-- Actualizar slugs faltantes en categories
UPDATE categories 
SET slug = lower(regexp_replace(regexp_replace(name, '\s+', '-', 'g'), '[^a-z0-9-]', '', 'gi'))
WHERE slug IS NULL OR slug = '';

-- Actualizar slugs faltantes en subcategories
UPDATE subcategories 
SET slug = lower(regexp_replace(regexp_replace(name, '\s+', '-', 'g'), '[^a-z0-9-]', '', 'gi'))
WHERE slug IS NULL OR slug = '';

-- Verificar resultado
SELECT id, name, slug FROM categories ORDER BY name;
SELECT id, name, slug, category_id FROM subcategories ORDER BY category_id, name;
