-- Migration: 20260314000002_subcategory_hierarchy.sql
-- Sprint 8A — Backend Publicación Eficiente
-- Agrega parent_id a subcategories para soportar jerarquía de 3 niveles
-- Categoría > Subcategoría > Sub-subcategoría (leaf node)
-- 2026-03-14

-- ============================================================
-- 1. JERARQUÍA 3 NIVELES EN SUBCATEGORIES
-- ============================================================

ALTER TABLE public.subcategories
  ADD COLUMN parent_id uuid REFERENCES public.subcategories(id) ON DELETE CASCADE;

CREATE INDEX idx_subcategories_parent_id ON public.subcategories(parent_id);

COMMENT ON COLUMN public.subcategories.parent_id IS
  'NULL = nivel 2 (tiene hijos, muestra flecha). NOT NULL = nivel 3 = LEAF NODE (habilita SIGUIENTE)';

-- ============================================================
-- 2. RPC: search_subcategory_paths
-- Búsqueda full-text con breadcrumb completo para el Step 1 del wizard
-- Devuelve solo LEAF NODES que coincidan con la query
-- ============================================================

CREATE OR REPLACE FUNCTION public.search_subcategory_paths(search_query text)
RETURNS TABLE (
  leaf_id       uuid,
  category_id   uuid,
  parent_sub_id uuid,
  cat_name      text,
  cat_icon      text,
  sub_name      text,
  leaf_name     text,
  path          text,
  leaf_slug     text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  -- Nivel 3: Category > Sub > Leaf (parent_id IS NOT NULL)
  SELECT
    s3.id                                                                   AS leaf_id,
    cat.id                                                                  AS category_id,
    s3.parent_id                                                            AS parent_sub_id,
    cat.display_name                                                        AS cat_name,
    cat.icon                                                                AS cat_icon,
    s2.display_name                                                         AS sub_name,
    s3.display_name                                                         AS leaf_name,
    cat.display_name || ' > ' || s2.display_name || ' > ' || s3.display_name AS path,
    s3.slug                                                                 AS leaf_slug
  FROM public.subcategories s3
  JOIN public.subcategories  s2  ON s3.parent_id    = s2.id
  JOIN public.categories     cat ON s2.category_id  = cat.id
  WHERE s3.is_active  = true
    AND s2.is_active  = true
    AND cat.is_active = true
    AND (
      s3.display_name ILIKE '%' || search_query || '%'
      OR s2.display_name ILIKE '%' || search_query || '%'
      OR cat.display_name ILIKE '%' || search_query || '%'
    )

  UNION ALL

  -- Nivel 2 sin hijos: Category > Sub (leaf de 2 niveles)
  SELECT
    s2.id                                        AS leaf_id,
    cat.id                                       AS category_id,
    NULL::uuid                                   AS parent_sub_id,
    cat.display_name                             AS cat_name,
    cat.icon                                     AS cat_icon,
    NULL                                         AS sub_name,
    s2.display_name                              AS leaf_name,
    cat.display_name || ' > ' || s2.display_name AS path,
    s2.slug                                      AS leaf_slug
  FROM public.subcategories s2
  JOIN public.categories cat ON s2.category_id = cat.id
  WHERE s2.is_active  = true
    AND cat.is_active = true
    AND s2.parent_id  IS NULL
    AND NOT EXISTS (
      SELECT 1 FROM public.subcategories s3c
      WHERE s3c.parent_id = s2.id AND s3c.is_active = true
    )
    AND (
      s2.display_name ILIKE '%' || search_query || '%'
      OR cat.display_name ILIKE '%' || search_query || '%'
    )

  ORDER BY path
  LIMIT 20;
$$;

GRANT EXECUTE ON FUNCTION public.search_subcategory_paths(text) TO anon, authenticated;
