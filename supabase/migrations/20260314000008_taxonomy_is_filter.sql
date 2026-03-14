-- ============================================================
-- Migration: 20260314000008_taxonomy_is_filter.sql
-- Sprint 8C — Agrega is_filter a categories y subcategories
-- is_filter = true → el nodo aparece como filtro en la página de resultados
-- ============================================================

-- Categorías: filtro activado por defecto en todas (ya se usan como filtro)
ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS is_filter boolean NOT NULL DEFAULT true;

-- Subcategorías: filtro desactivado por defecto (admin activa manualmente)
ALTER TABLE public.subcategories
  ADD COLUMN IF NOT EXISTS is_filter boolean NOT NULL DEFAULT false;

-- Activar is_filter en subcategorías L2 activas actuales (las que el usuario ya ve en el wizard)
-- Solo las que no tienen parent_id (L2 directas), ya que son las más usadas como filtro
UPDATE public.subcategories
SET is_filter = true
WHERE parent_id IS NULL AND is_active = true;

-- Verificación post-migración
-- SELECT name, is_filter FROM public.categories ORDER BY sort_order;
-- SELECT COUNT(*) FILTER (WHERE is_filter) AS con_filtro,
--        COUNT(*) FILTER (WHERE NOT is_filter) AS sin_filtro
-- FROM public.subcategories;
