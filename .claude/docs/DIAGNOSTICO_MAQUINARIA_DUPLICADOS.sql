-- ============================================================
-- DIAGNÓSTICO: Duplicados Maquinaria
-- Ejecutar en Supabase SQL Editor ANTES de la migración 000007
-- ============================================================

-- 1. ¿Existen las dos categorías?
SELECT
  id,
  slug,
  name,
  display_name,
  sort_order,
  is_active
FROM public.categories
WHERE slug IN ('maquinarias', 'maquinaria-agricola')
ORDER BY slug;

-- ─────────────────────────────────────────────────────────────

-- 2. Subcategorías de CADA categoría de maquinaria
SELECT
  c.slug          AS categoria_slug,
  s.slug          AS sub_slug,
  s.display_name  AS sub_nombre,
  s.parent_id IS NOT NULL AS es_nivel3,
  s.is_active
FROM public.subcategories s
JOIN public.categories c ON c.id = s.category_id
WHERE c.slug IN ('maquinarias', 'maquinaria-agricola')
ORDER BY c.slug, s.parent_id NULLS FIRST, s.sort_order;

-- ─────────────────────────────────────────────────────────────

-- 3. Resumen: total subcategorías por categoría
SELECT
  c.slug,
  COUNT(*) FILTER (WHERE s.parent_id IS NULL AND s.is_active)  AS subs_l2_activas,
  COUNT(*) FILTER (WHERE s.parent_id IS NOT NULL AND s.is_active) AS subs_l3_activas,
  COUNT(*) FILTER (WHERE NOT s.is_active)                       AS subs_inactivas
FROM public.subcategories s
JOIN public.categories c ON c.id = s.category_id
WHERE c.slug IN ('maquinarias', 'maquinaria-agricola')
GROUP BY c.slug;

-- ─────────────────────────────────────────────────────────────

-- 4. form_templates_v2: ¿a qué categoría apuntan los templates de maquinaria?
SELECT
  t.name,
  t.display_name,
  c.slug  AS categoria_slug,
  s.slug  AS subcategoria_slug,
  t.is_active
FROM public.form_templates_v2 t
LEFT JOIN public.categories    c ON c.id = t.category_id
LEFT JOIN public.subcategories s ON s.id = t.subcategory_id
WHERE t.name LIKE 'maquinaria%'
ORDER BY t.name;

-- ─────────────────────────────────────────────────────────────

-- 5. ¿Cuántos avisos apuntan a cada categoría?
SELECT
  c.slug,
  COUNT(a.id) AS total_avisos
FROM public.ads a
JOIN public.categories c ON c.id = a.category_id
WHERE c.slug IN ('maquinarias', 'maquinaria-agricola')
GROUP BY c.slug;

-- ─────────────────────────────────────────────────────────────

-- 6. category_types legacy (los tipos viejos de Sprint 3G)
SELECT
  c.slug  AS categoria_slug,
  s.name  AS sub_nombre,
  ct.name AS tipo_nombre,
  ct.is_active
FROM public.category_types ct
JOIN public.categories    c ON c.id = ct.category_id
JOIN public.subcategories s ON s.id = ct.subcategory_id
WHERE c.slug = 'maquinarias'
ORDER BY s.name, ct.sort_order;
