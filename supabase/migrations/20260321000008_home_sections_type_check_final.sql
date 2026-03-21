-- Migration: 20260321000008_home_sections_type_check_final
-- Consolida el CHECK constraint final con todos los tipos activos.
-- Reemplaza 000006 y 000007 que no se pudieron aplicar en DEV
-- por filas previas con type='category_section'.

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
