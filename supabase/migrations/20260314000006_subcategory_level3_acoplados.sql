-- Migration: 20260314000006_subcategory_level3_acoplados.sql
-- Sprint 8A — Sub-subcategorías nivel 3: Acoplados (17 tipos)
-- 2026-03-14

DO $$
DECLARE
  cat_maquinaria uuid;
  sub_acoplados  uuid;
BEGIN
  SELECT id INTO cat_maquinaria FROM public.categories    WHERE slug = 'maquinaria-agricola';
  SELECT id INTO sub_acoplados  FROM public.subcategories WHERE slug = 'acoplados' AND category_id = cat_maquinaria;

  IF sub_acoplados IS NULL THEN
    RAISE EXCEPTION 'subcategory acoplados not found — run migration 000004 first';
  END IF;

  INSERT INTO public.subcategories
    (name, display_name, slug, category_id, parent_id, sort_order, is_active, has_brands, has_models, has_year, has_condition)
  SELECT v.sl, v.dn, v.sl, cat_maquinaria, sub_acoplados, v.so, true, true, true, true, true
  FROM (VALUES
    ('acoplado-balancin',       'Balancín',         1),
    ('acoplado-carretones',     'Carretones',        2),
    ('acoplado-cisterna',       'Cisterna',          3),
    ('acoplado-fijos',          'Fijos',             4),
    ('acoplado-forestales',     'Forestales',        5),
    ('acoplado-forrajeros',     'Forrajeros',        6),
    ('acoplado-jaula',          'Jaula',             7),
    ('acoplado-multiproposito', 'Multipropósito',    8),
    ('acoplado-otros',          'Otros',             9),
    ('acoplado-paleteros',      'Paleteros',        10),
    ('acoplado-playos',         'Playos',           11),
    ('acoplado-taller',         'Taller',           12),
    ('acoplado-tanque',         'Tanque',           13),
    ('acoplado-trailer',        'Trailer',          14),
    ('acoplado-volcadores',     'Volcadores',       15),
    ('acoplado-volquetes',      'Volquetes',        16)
  ) AS v(sl, dn, so)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.subcategories s
    WHERE s.slug = v.sl AND s.category_id = cat_maquinaria
  );

END $$;
