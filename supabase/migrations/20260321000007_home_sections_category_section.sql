-- Migration: 20260321000007_home_sections_category_section
-- Agrega tipo 'category_section' para secciones de categoría con índice taxonómico.
-- Depende de: 20260321000006 (constraint cta_cards)

ALTER TABLE public.home_sections DROP CONSTRAINT IF EXISTS home_sections_type_check;

ALTER TABLE public.home_sections
  ADD CONSTRAINT home_sections_type_check
  CHECK (type IN (
    'featured_grid',
    'category_carousel',
    'ad_list',
    'banner',
    'stats',
    'cta_cards',
    'category_section'
  ));
