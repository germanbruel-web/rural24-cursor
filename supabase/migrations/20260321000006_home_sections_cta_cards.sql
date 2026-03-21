-- Add cta_cards type to home_sections
ALTER TABLE public.home_sections
  DROP CONSTRAINT IF EXISTS home_sections_type_check;

ALTER TABLE public.home_sections
  ADD CONSTRAINT home_sections_type_check
  CHECK (type IN ('featured_grid', 'category_carousel', 'ad_list', 'banner', 'stats', 'cta_cards'));
