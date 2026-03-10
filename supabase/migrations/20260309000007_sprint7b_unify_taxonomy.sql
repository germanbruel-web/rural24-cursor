-- ============================================================
-- Sprint 7B — Unificación Taxonomía: Empresas → Servicios
-- ============================================================
-- Decisión de producto:
-- "Servicios" y "Empresas" son el mismo concepto (proveedor con perfil de empresa).
-- Se unifica: avisos en subcategoría "Empresas" pasan a "Servicios" de la misma categoría.
-- La subcategoría "Empresas" se desactiva del wizard (is_active = false).
-- ============================================================

-- 1. Migrar avisos: para cada subcategoría con slug='empresas',
--    reasignar sus avisos a la subcategoría slug='servicios' del mismo category_id.
UPDATE ads
SET subcategory_id = (
  SELECT s2.id
  FROM subcategories s2
  WHERE s2.slug = 'servicios'
    AND s2.category_id = (
      SELECT s1.category_id
      FROM subcategories s1
      WHERE s1.id = ads.subcategory_id
    )
  LIMIT 1
)
WHERE subcategory_id IN (
  SELECT id FROM subcategories WHERE slug = 'empresas'
)
  AND EXISTS (
    -- Solo migrar si hay un 'servicios' correspondiente en la misma categoría
    SELECT 1
    FROM subcategories s2
    WHERE s2.slug = 'servicios'
      AND s2.category_id = (
        SELECT s1.category_id
        FROM subcategories s1
        WHERE s1.id = ads.subcategory_id
      )
  );

-- 2. Desactivar subcategorías "Empresas" (ocultar del wizard)
UPDATE subcategories
SET is_active = false
WHERE slug = 'empresas';

-- Verificación (ejecutar manualmente para confirmar):
-- SELECT slug, category_id, is_active FROM subcategories WHERE slug IN ('empresas', 'servicios') ORDER BY category_id, slug;
-- SELECT COUNT(*) FROM ads WHERE subcategory_id IN (SELECT id FROM subcategories WHERE slug = 'empresas'); -- debe ser 0
