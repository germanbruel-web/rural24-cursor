-- Migration: 20260314000005_subcategory_level3_maquinaria.sql
-- Sprint 8A — Sub-subcategorías (nivel 3) para Cosechadoras y Tractores
-- Arquitectura: "Agrícolas > sub-tipo" aplanado a nivel 3 con nombre prefijado
-- para evitar nivel 4 y simplificar el wizard (1 pantalla menos de navegación)
-- 2026-03-14

DO $$
DECLARE
  cat_maquinaria    uuid;
  sub_cosechadoras  uuid;
  sub_tractores     uuid;
BEGIN
  SELECT id INTO cat_maquinaria   FROM public.categories    WHERE slug = 'maquinaria-agricola';
  SELECT id INTO sub_cosechadoras FROM public.subcategories WHERE slug = 'cosechadoras' AND category_id = cat_maquinaria;
  SELECT id INTO sub_tractores    FROM public.subcategories WHERE slug = 'tractores'    AND category_id = cat_maquinaria;

  IF sub_cosechadoras IS NULL THEN
    RAISE EXCEPTION 'subcategory cosechadoras not found — run migration 000004 first';
  END IF;
  IF sub_tractores IS NULL THEN
    RAISE EXCEPTION 'subcategory tractores not found — run migration 000004 first';
  END IF;

  -- ============================================================
  -- COSECHADORAS — nivel 3 (parent = sub_cosechadoras)
  -- Grupo "Agrícolas" aplanado: Agrícola de tracción doble / simple / otras
  -- ============================================================
  -- name = slug (garantiza unicidad en category_id+name)
  -- display_name = texto legible para el usuario
  INSERT INTO public.subcategories
    (name, display_name, slug, category_id, parent_id, sort_order, is_active, has_brands, has_models, has_year, has_condition)
  SELECT v.sl, v.dn, v.sl, cat_maquinaria, sub_cosechadoras, v.so, true, true, true, true, true
  FROM (VALUES
    ('cosechadora-agricola-traccion-doble',  'Agrícola de tracción doble',   1),
    ('cosechadora-agricola-traccion-simple', 'Agrícola de tracción simple',  2),
    ('cosechadora-agricola-otras',           'Agrícola otras',               3),
    ('cosechadora-aceitunas',                'De aceitunas',                 4),
    ('cosechadora-algodon',                  'De algodón',                   5),
    ('cosechadora-canas',                    'De cañas',                     6),
    ('cosechadora-forraje',                  'De forraje',                   7),
    ('cosechadora-mani',                     'De Maní',                      8),
    ('cosechadora-papas',                    'De papas',                     9),
    ('cosechadora-otras',                    'Otras',                       10)
  ) AS v(sl, dn, so)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.subcategories s
    WHERE s.slug = v.sl AND s.category_id = cat_maquinaria
  );

  -- ============================================================
  -- TRACTORES — nivel 3 (parent = sub_tractores)
  -- ============================================================
  INSERT INTO public.subcategories
    (name, display_name, slug, category_id, parent_id, sort_order, is_active, has_brands, has_models, has_year, has_condition)
  SELECT v.sl, v.dn, v.sl, cat_maquinaria, sub_tractores, v.so, true, true, true, true, true
  FROM (VALUES
    ('tractor-agricola-articulado',          'Agrícola articulado',          1),
    ('tractor-agricola-traccion-doble',      'Agrícola de tracción doble',   2),
    ('tractor-agricola-traccion-simple',     'Agrícola de tracción simple',  3),
    ('tractor-agricola-otros',               'Agrícola otros',               4),
    ('tractor-antiguo',                      'Antiguo',                      5),
    ('tractor-oruga',                        'Oruga',                        6),
    ('tractor-vinatero-frutero',             'Viñatero y frutero',           7),
    ('tractor-otros',                        'Otros',                        8)
  ) AS v(sl, dn, so)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.subcategories s
    WHERE s.slug = v.sl AND s.category_id = cat_maquinaria
  );

END $$;
