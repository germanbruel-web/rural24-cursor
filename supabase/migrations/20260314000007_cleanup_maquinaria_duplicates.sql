-- ============================================================
-- Migration: 20260314000007_cleanup_maquinaria_duplicates.sql
-- Limpieza: fusión categoría legacy 'maquinarias' → 'maquinaria-agricola'
-- ============================================================
--
-- CONTEXTO DEL PROBLEMA:
--
-- Sprint 3G (20260306000002) creó:
--   categories: name='maquinarias', slug='maquinarias'  ← LEGACY
--     └─ subcategories: 'maquinarias', 'servicios', 'empresas'
--          └─ category_types: tractores, cosechadoras, ... (nivel 3 viejo)
--   form_templates_v2: maquinaria_maquinarias → vinculado al cat LEGACY
--
-- Sprint 8A (20260314000004) creó:
--   categories: name='Maquinaria Agrícola', slug='maquinaria-agricola'  ← NUEVA
--     └─ subcategories: 69 items L2 (Cosechadoras, Tractores, Acoplados, ...)
--          └─ subcategories L3: tipos de cosechadoras, tractores, acoplados
--
-- PROBLEMA: Dos categorías de maquinaria activas, templates apuntan a la vieja.
--
-- SOLUCIÓN (idempotente):
--   1. Migrar form_templates_v2 de cat LEGACY → cat NUEVA (como globales)
--   2. Migrar ads.category_id LEGACY → NUEVA
--   3. Desactivar subcategorías de la cat LEGACY
--   4. Desactivar la categoría LEGACY
-- ============================================================

DO $$
DECLARE
  cat_legacy_id  uuid;
  cat_nueva_id   uuid;
  ads_migrados   int := 0;
  tmpl_migrados  int := 0;
  subs_desact    int := 0;
BEGIN

  -- ── Buscar ambas categorías ──────────────────────────────────
  SELECT id INTO cat_legacy_id FROM public.categories WHERE slug = 'maquinarias';
  SELECT id INTO cat_nueva_id  FROM public.categories WHERE slug = 'maquinaria-agricola';

  -- Nada que hacer si la legacy ya no existe
  IF cat_legacy_id IS NULL THEN
    RAISE NOTICE 'Categoría legacy (slug=maquinarias) no existe — nada que limpiar.';
    RETURN;
  END IF;

  IF cat_nueva_id IS NULL THEN
    RAISE EXCEPTION 'Categoría nueva (slug=maquinaria-agricola) no encontrada — ejecutar migration 000004 primero.';
  END IF;

  RAISE NOTICE '── Diagnóstico previo ──────────────────────────────────────';
  RAISE NOTICE 'Categoría LEGACY id: %', cat_legacy_id;
  RAISE NOTICE 'Categoría NUEVA  id: %', cat_nueva_id;

  -- Contar subcategorías legacy
  SELECT COUNT(*) INTO subs_desact
  FROM public.subcategories WHERE category_id = cat_legacy_id;
  RAISE NOTICE 'Subcategorías legacy (serán desactivadas): %', subs_desact;

  -- Contar templates a migrar
  SELECT COUNT(*) INTO tmpl_migrados
  FROM public.form_templates_v2 WHERE category_id = cat_legacy_id;
  RAISE NOTICE 'form_templates_v2 a migrar a categoría nueva: %', tmpl_migrados;

  -- Contar avisos afectados
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='ads' AND column_name='category_id') THEN
    SELECT COUNT(*) INTO ads_migrados
    FROM public.ads WHERE category_id = cat_legacy_id;
    RAISE NOTICE 'Avisos (ads) con categoría legacy: %', ads_migrados;
  END IF;

  -- ── 1. Migrar form_templates_v2 ──────────────────────────────
  -- Los templates pasan a ser globales de la nueva categoría
  -- (subcategory_id = NULL: aplican a toda la categoría Maquinaria Agrícola)
  UPDATE public.form_templates_v2
  SET
    category_id    = cat_nueva_id,
    subcategory_id = NULL
  WHERE category_id = cat_legacy_id;

  GET DIAGNOSTICS tmpl_migrados = ROW_COUNT;
  RAISE NOTICE '✔ form_templates_v2 migrados: %', tmpl_migrados;

  -- ── 2. Migrar ads.category_id ────────────────────────────────
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='ads' AND column_name='category_id') THEN
    UPDATE public.ads
    SET category_id = cat_nueva_id
    WHERE category_id = cat_legacy_id;

    GET DIAGNOSTICS ads_migrados = ROW_COUNT;
    RAISE NOTICE '✔ Avisos migrados a categoría nueva: %', ads_migrados;
  ELSE
    RAISE NOTICE '⚠ Tabla ads no tiene column category_id — saltando migración de avisos.';
  END IF;

  -- ── 3. Desactivar subcategorías legacy ──────────────────────
  -- No se borran por si tienen referencias en ads.subcategory_id
  UPDATE public.subcategories
  SET is_active = false
  WHERE category_id = cat_legacy_id;

  GET DIAGNOSTICS subs_desact = ROW_COUNT;
  RAISE NOTICE '✔ Subcategorías legacy desactivadas: %', subs_desact;

  -- ── 4. Desactivar category_types legacy ─────────────────────
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema='public' AND table_name='category_types') THEN
    UPDATE public.category_types
    SET is_active = false
    WHERE category_id = cat_legacy_id;
    RAISE NOTICE '✔ category_types legacy desactivados';
  END IF;

  -- ── 5. Desactivar la categoría legacy ───────────────────────
  UPDATE public.categories
  SET is_active = false
  WHERE id = cat_legacy_id;

  RAISE NOTICE '✔ Categoría legacy (maquinarias) desactivada.';
  RAISE NOTICE '────────────────────────────────────────────────────────────';
  RAISE NOTICE 'Limpieza completada. Categoría activa: maquinaria-agricola (id: %)', cat_nueva_id;

END $$;

-- ============================================================
-- VERIFICACIÓN POST-MIGRACIÓN (ejecutar en SQL editor para confirmar)
-- ============================================================
-- Descomentar para verificar:
--
-- SELECT slug, name, display_name, is_active
-- FROM public.categories
-- WHERE slug IN ('maquinarias','maquinaria-agricola')
-- ORDER BY slug;
--
-- SELECT COUNT(*) as total, is_active
-- FROM public.subcategories
-- WHERE category_id = (SELECT id FROM public.categories WHERE slug='maquinaria-agricola')
-- GROUP BY is_active;
--
-- SELECT name, display_name, category_id, subcategory_id
-- FROM public.form_templates_v2
-- WHERE name LIKE 'maquinaria%'
-- ORDER BY name;
-- ============================================================
