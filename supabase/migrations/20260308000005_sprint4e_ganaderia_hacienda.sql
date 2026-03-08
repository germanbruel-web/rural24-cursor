-- ============================================================
-- Sprint 4E: Formulario Ganadería — Hacienda (completo)
-- ============================================================
-- Reemplaza ganaderia_bovinos (vinculado a category) por
-- ganaderia_hacienda (vinculado a subcategoría "hacienda").
--
-- Novedades:
--   - tipo_animal (select) → razas filtradas por tipo seleccionado
--   - 5 option_lists de razas por tipo (depends_on: tipo_animal)
--   - data_source_config en campo "raza" con list_map
--   - Secciones: Info General / Características / Comercial / Ubicación
-- ============================================================

-- ─── Cleanup: eliminar template anterior ─────────────────────

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='form_fields_v2') THEN
    DELETE FROM public.form_fields_v2
    WHERE form_template_id IN (
      SELECT id FROM public.form_templates_v2 WHERE name = 'ganaderia_bovinos'
    );
    DELETE FROM public.form_templates_v2 WHERE name = 'ganaderia_bovinos';
  END IF;
END $$;

-- ─── Nuevas option_lists ──────────────────────────────────────

INSERT INTO public.option_lists (name, display_name, scope, description)
VALUES
  ('tipo-animal-hacienda', 'Tipo de Animal (Hacienda)',  'category', 'Clasificación del animal: toros, vacas, novillos, etc.'),
  ('razas-toros',          'Razas — Toros',              'category', 'Razas bovinas para la categoría Toros'),
  ('razas-vacas',          'Razas — Vacas',              'category', 'Razas bovinas para la categoría Vacas (incluye lecheras)'),
  ('razas-novillos',       'Razas — Novillos',           'category', 'Razas bovinas para la categoría Novillos'),
  ('razas-vaquillonas',    'Razas — Vaquillonas',        'category', 'Razas bovinas para la categoría Vaquillonas'),
  ('razas-terneros',       'Razas — Terneros',           'category', 'Razas bovinas para la categoría Terneros')
ON CONFLICT (name) DO NOTHING;

-- Asociar a categoría ganadería
UPDATE public.option_lists ol
SET category_id = (SELECT id FROM public.categories WHERE name = 'ganaderia' LIMIT 1)
WHERE ol.name IN ('tipo-animal-hacienda','razas-toros','razas-vacas','razas-novillos','razas-vaquillonas','razas-terneros')
  AND (SELECT id FROM public.categories WHERE name = 'ganaderia' LIMIT 1) IS NOT NULL;

-- ─── Ítems: Tipo de Animal ────────────────────────────────────

INSERT INTO public.option_list_items (list_id, value, label, sort_order)
SELECT ol.id, v.value, v.label, v.sort_order
FROM public.option_lists ol,
  (VALUES
    ('toros',       'Toros',       0),
    ('vacas',       'Vacas',       1),
    ('novillos',    'Novillos',    2),
    ('vaquillonas', 'Vaquillonas', 3),
    ('terneros',    'Terneros',    4),
    ('capones',     'Capones',     5),
    ('mixto',       'Mixto',       6)
  ) AS v(value, label, sort_order)
WHERE ol.name = 'tipo-animal-hacienda'
ON CONFLICT (list_id, value) DO NOTHING;

-- ─── Ítems: Razas — Toros (22 razas) ─────────────────────────
-- Incluye: todas las generales + fleckvieh (exclusiva toros)
-- No incluye: holando-argentino, jersey, pardo-suizo (solo vacas)

INSERT INTO public.option_list_items (list_id, value, label, sort_order)
SELECT ol.id, v.value, v.label, v.sort_order
FROM public.option_lists ol,
  (VALUES
    ('angus',              'Angus',                 0),
    ('aberdeen-angus-neg', 'Aberdeen Angus negro',  1),
    ('aberdeen-angus-col', 'Aberdeen Angus colorado',2),
    ('hereford',           'Hereford',              3),
    ('polled-hereford',    'Polled Hereford',       4),
    ('braford',            'Braford',               5),
    ('brangus-negro',      'Brangus negro',         6),
    ('brangus-colorado',   'Brangus colorado',      7),
    ('brahman',            'Brahman',               8),
    ('nelore',             'Nelore',                9),
    ('limousin',           'Limousin',             10),
    ('limangus',           'Limangus',             11),
    ('shorthorn',          'Shorthorn',            12),
    ('charolais',          'Charolais',            13),
    ('simmental',          'Simmental',            14),
    ('santa-gertrudis',    'Santa Gertrudis',      15),
    ('senepol',            'Senepol',              16),
    ('beefmaster',         'Beefmaster',           17),
    ('wagyu',              'Wagyu',                18),
    ('criollo-argentino',  'Criollo Argentino',    19),
    ('fleckvieh',          'Fleckvieh',            20),
    ('otra',               'Otra',                 99)
  ) AS v(value, label, sort_order)
WHERE ol.name = 'razas-toros'
ON CONFLICT (list_id, value) DO NOTHING;

-- ─── Ítems: Razas — Vacas (24 razas) ─────────────────────────
-- Incluye: todas las generales + wagyu + lecheras (holando, jersey, pardo-suizo)
-- No incluye: fleckvieh (exclusiva toros)

INSERT INTO public.option_list_items (list_id, value, label, sort_order)
SELECT ol.id, v.value, v.label, v.sort_order
FROM public.option_lists ol,
  (VALUES
    ('angus',              'Angus',                  0),
    ('aberdeen-angus-neg', 'Aberdeen Angus negro',   1),
    ('aberdeen-angus-col', 'Aberdeen Angus colorado', 2),
    ('hereford',           'Hereford',               3),
    ('polled-hereford',    'Polled Hereford',        4),
    ('braford',            'Braford',                5),
    ('brangus-negro',      'Brangus negro',          6),
    ('brangus-colorado',   'Brangus colorado',       7),
    ('brahman',            'Brahman',                8),
    ('nelore',             'Nelore',                 9),
    ('limousin',           'Limousin',              10),
    ('limangus',           'Limangus',              11),
    ('shorthorn',          'Shorthorn',             12),
    ('charolais',          'Charolais',             13),
    ('simmental',          'Simmental',             14),
    ('santa-gertrudis',    'Santa Gertrudis',       15),
    ('senepol',            'Senepol',               16),
    ('beefmaster',         'Beefmaster',            17),
    ('wagyu',              'Wagyu',                 18),
    ('criollo-argentino',  'Criollo Argentino',     19),
    ('holando-argentino',  'Holando Argentino',     20),
    ('jersey',             'Jersey',                21),
    ('pardo-suizo',        'Pardo Suizo',           22),
    ('otra',               'Otra',                  99)
  ) AS v(value, label, sort_order)
WHERE ol.name = 'razas-vacas'
ON CONFLICT (list_id, value) DO NOTHING;

-- ─── Ítems: Razas — Novillos (21 razas) ──────────────────────
-- Incluye: todas las generales + wagyu
-- No incluye: fleckvieh, holando, jersey, pardo-suizo

INSERT INTO public.option_list_items (list_id, value, label, sort_order)
SELECT ol.id, v.value, v.label, v.sort_order
FROM public.option_lists ol,
  (VALUES
    ('angus',              'Angus',                  0),
    ('aberdeen-angus-neg', 'Aberdeen Angus negro',   1),
    ('aberdeen-angus-col', 'Aberdeen Angus colorado', 2),
    ('hereford',           'Hereford',               3),
    ('polled-hereford',    'Polled Hereford',        4),
    ('braford',            'Braford',                5),
    ('brangus-negro',      'Brangus negro',          6),
    ('brangus-colorado',   'Brangus colorado',       7),
    ('brahman',            'Brahman',                8),
    ('nelore',             'Nelore',                 9),
    ('limousin',           'Limousin',              10),
    ('limangus',           'Limangus',              11),
    ('shorthorn',          'Shorthorn',             12),
    ('charolais',          'Charolais',             13),
    ('simmental',          'Simmental',             14),
    ('santa-gertrudis',    'Santa Gertrudis',       15),
    ('senepol',            'Senepol',               16),
    ('beefmaster',         'Beefmaster',            17),
    ('wagyu',              'Wagyu',                 18),
    ('criollo-argentino',  'Criollo Argentino',     19),
    ('otra',               'Otra',                  99)
  ) AS v(value, label, sort_order)
WHERE ol.name = 'razas-novillos'
ON CONFLICT (list_id, value) DO NOTHING;

-- ─── Ítems: Razas — Vaquillonas (20 razas) ───────────────────
-- = Novillos sin wagyu

INSERT INTO public.option_list_items (list_id, value, label, sort_order)
SELECT ol.id, v.value, v.label, v.sort_order
FROM public.option_lists ol,
  (VALUES
    ('angus',              'Angus',                  0),
    ('aberdeen-angus-neg', 'Aberdeen Angus negro',   1),
    ('aberdeen-angus-col', 'Aberdeen Angus colorado', 2),
    ('hereford',           'Hereford',               3),
    ('polled-hereford',    'Polled Hereford',        4),
    ('braford',            'Braford',                5),
    ('brangus-negro',      'Brangus negro',          6),
    ('brangus-colorado',   'Brangus colorado',       7),
    ('brahman',            'Brahman',                8),
    ('nelore',             'Nelore',                 9),
    ('limousin',           'Limousin',              10),
    ('limangus',           'Limangus',              11),
    ('shorthorn',          'Shorthorn',             12),
    ('charolais',          'Charolais',             13),
    ('simmental',          'Simmental',             14),
    ('santa-gertrudis',    'Santa Gertrudis',       15),
    ('senepol',            'Senepol',               16),
    ('beefmaster',         'Beefmaster',            17),
    ('criollo-argentino',  'Criollo Argentino',     18),
    ('otra',               'Otra',                  99)
  ) AS v(value, label, sort_order)
WHERE ol.name = 'razas-vaquillonas'
ON CONFLICT (list_id, value) DO NOTHING;

-- ─── Ítems: Razas — Terneros (igual que vaquillonas) ─────────

INSERT INTO public.option_list_items (list_id, value, label, sort_order)
SELECT ol.id, v.value, v.label, v.sort_order
FROM public.option_lists ol,
  (VALUES
    ('angus',              'Angus',                  0),
    ('aberdeen-angus-neg', 'Aberdeen Angus negro',   1),
    ('aberdeen-angus-col', 'Aberdeen Angus colorado', 2),
    ('hereford',           'Hereford',               3),
    ('polled-hereford',    'Polled Hereford',        4),
    ('braford',            'Braford',                5),
    ('brangus-negro',      'Brangus negro',          6),
    ('brangus-colorado',   'Brangus colorado',       7),
    ('brahman',            'Brahman',                8),
    ('nelore',             'Nelore',                 9),
    ('limousin',           'Limousin',              10),
    ('limangus',           'Limangus',              11),
    ('shorthorn',          'Shorthorn',             12),
    ('charolais',          'Charolais',             13),
    ('simmental',          'Simmental',             14),
    ('santa-gertrudis',    'Santa Gertrudis',       15),
    ('senepol',            'Senepol',               16),
    ('beefmaster',         'Beefmaster',            17),
    ('criollo-argentino',  'Criollo Argentino',     18),
    ('otra',               'Otra',                  99)
  ) AS v(value, label, sort_order)
WHERE ol.name = 'razas-terneros'
ON CONFLICT (list_id, value) DO NOTHING;

-- ─── Form Template: Ganadería — Hacienda ─────────────────────

DO $$
DECLARE
  v_cat_id        uuid;
  v_subcat_id     uuid;
  v_tmpl_id       uuid;
  v_list_tipo     uuid;
  v_list_destino  uuid;
  v_list_origen   uuid;
  v_list_prov     uuid;
BEGIN
  SELECT id INTO v_cat_id FROM public.categories WHERE name = 'ganaderia' LIMIT 1;
  IF v_cat_id IS NULL THEN
    RAISE NOTICE 'Categoría "ganaderia" no encontrada — omitiendo seed.';
    RETURN;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'form_templates_v2'
  ) THEN
    RAISE NOTICE 'form_templates_v2 no existe — omitiendo seed.';
    RETURN;
  END IF;

  IF EXISTS (SELECT 1 FROM public.form_templates_v2 WHERE name = 'ganaderia_hacienda') THEN
    RAISE NOTICE 'ganaderia_hacienda ya existe — omitiendo.';
    RETURN;
  END IF;

  -- Subcategoría HACIENDA
  SELECT sc.id INTO v_subcat_id
  FROM public.subcategories sc
  WHERE sc.category_id = v_cat_id
    AND lower(sc.name) = 'hacienda'
  LIMIT 1;

  SELECT id INTO v_list_tipo    FROM public.option_lists WHERE name = 'tipo-animal-hacienda';
  SELECT id INTO v_list_destino FROM public.option_lists WHERE name = 'destino-productivo';
  SELECT id INTO v_list_origen  FROM public.option_lists WHERE name = 'origen-animal';
  SELECT id INTO v_list_prov    FROM public.option_lists WHERE name = 'provincias-ar';

  INSERT INTO public.form_templates_v2 (
    name, display_name, category_id, subcategory_id,
    sections, is_active, priority
  ) VALUES (
    'ganaderia_hacienda',
    'Formulario Ganadería — Hacienda',
    v_cat_id,
    v_subcat_id,
    jsonb_build_array(
      jsonb_build_object('id','sec-hac-info-general',   'name','informacion_general',  'label','Información General',  'display_order',0,'collapsible',false),
      jsonb_build_object('id','sec-hac-caracteristicas','name','caracteristicas',       'label','Características',       'display_order',1,'collapsible',false),
      jsonb_build_object('id','sec-hac-comercial',      'name','informacion_comercial', 'label','Información Comercial', 'display_order',2,'collapsible',false),
      jsonb_build_object('id','sec-hac-ubicacion',      'name','ubicacion',             'label','Ubicación',             'display_order',3,'collapsible',false)
    ),
    true, 10
  )
  RETURNING id INTO v_tmpl_id;

  RAISE NOTICE 'Template ganaderia_hacienda creado: %', v_tmpl_id;

  -- ── Información General ───────────────────────────────────

  -- Tipo de animal (select → tipo-animal-hacienda, required)
  INSERT INTO public.form_fields_v2 (form_template_id, field_name, field_label, section_id, field_type, field_width, is_required, display_order, option_list_id, placeholder)
  VALUES (v_tmpl_id, 'tipo_animal', 'Tipo de animal', 'sec-hac-info-general', 'select', 'half', true, 0, v_list_tipo, 'Seleccionar tipo...');

  -- Raza (select condicional — depende de tipo_animal, via data_source_config)
  INSERT INTO public.form_fields_v2 (
    form_template_id, field_name, field_label, section_id,
    field_type, field_width, is_required, display_order,
    placeholder, data_source_config
  ) VALUES (
    v_tmpl_id, 'raza', 'Raza', 'sec-hac-info-general',
    'select', 'half', false, 1,
    'Seleccioná primero el tipo...',
    '{
      "depends_on": "tipo_animal",
      "list_map": {
        "toros":       "razas-toros",
        "vacas":       "razas-vacas",
        "novillos":    "razas-novillos",
        "vaquillonas": "razas-vaquillonas",
        "terneros":    "razas-terneros"
      }
    }'::jsonb
  );

  -- Destino productivo
  INSERT INTO public.form_fields_v2 (form_template_id, field_name, field_label, section_id, field_type, field_width, is_required, display_order, option_list_id, placeholder)
  VALUES (v_tmpl_id, 'destino_productivo', 'Destino Productivo', 'sec-hac-info-general', 'select', 'half', false, 2, v_list_destino, 'Seleccionar destino...');

  -- Cantidad de cabezas
  INSERT INTO public.form_fields_v2 (form_template_id, field_name, field_label, section_id, field_type, field_width, is_required, display_order, placeholder, help_text)
  VALUES (v_tmpl_id, 'cantidad_cabezas', 'Cantidad de Cabezas', 'sec-hac-info-general', 'number', 'half', true, 3, 'ej: 50', 'Total de animales del lote');

  -- ── Características ───────────────────────────────────────

  INSERT INTO public.form_fields_v2 (form_template_id, field_name, field_label, section_id, field_type, field_width, is_required, display_order, placeholder, help_text)
  VALUES (v_tmpl_id, 'edad_promedio', 'Edad promedio (meses)', 'sec-hac-caracteristicas', 'number', 'half', false, 10, 'ej: 18', 'Edad promedio del lote en meses');

  INSERT INTO public.form_fields_v2 (form_template_id, field_name, field_label, section_id, field_type, field_width, is_required, display_order, placeholder, help_text)
  VALUES (v_tmpl_id, 'peso_aproximado', 'Peso aprox. por cabeza (kg)', 'sec-hac-caracteristicas', 'number', 'half', false, 11, 'ej: 350', 'Peso promedio individual en kg');

  INSERT INTO public.form_fields_v2 (form_template_id, field_name, field_label, section_id, field_type, field_width, is_required, display_order, help_text)
  VALUES (v_tmpl_id, 'estado_sanitario', 'Estado Sanitario al día', 'sec-hac-caracteristicas', 'checkbox', 'half', false, 12, 'Vacunas y sanidad al día');

  INSERT INTO public.form_fields_v2 (form_template_id, field_name, field_label, section_id, field_type, field_width, is_required, display_order, option_list_id, placeholder)
  VALUES (v_tmpl_id, 'origen_animal', 'Origen del Animal', 'sec-hac-caracteristicas', 'select', 'half', false, 13, v_list_origen, 'Seleccionar origen...');

  -- ── Información Comercial (checkboxes) ────────────────────

  INSERT INTO public.form_fields_v2 (form_template_id, field_name, field_label, section_id, field_type, field_width, is_required, display_order)
  VALUES
    (v_tmpl_id, 'cuotas_pesos',    'Cuotas en pesos',                'sec-hac-comercial', 'checkbox', 'third', false, 20),
    (v_tmpl_id, 'cuotas_dolares',  'Cuotas en dólares',             'sec-hac-comercial', 'checkbox', 'third', false, 21),
    (v_tmpl_id, 'permuta',         'Permuta / Canje',                'sec-hac-comercial', 'checkbox', 'third', false, 22),
    (v_tmpl_id, 'garantia_aval',   'Con garantía / aval',            'sec-hac-comercial', 'checkbox', 'third', false, 23),
    (v_tmpl_id, 'credito_bancario','Crédito bancario / cooperativa', 'sec-hac-comercial', 'checkbox', 'third', false, 24);

  -- ── Ubicación ────────────────────────────────────────────

  INSERT INTO public.form_fields_v2 (form_template_id, field_name, field_label, section_id, field_type, field_width, is_required, display_order, option_list_id, placeholder)
  VALUES (v_tmpl_id, 'provincia', 'Provincia', 'sec-hac-ubicacion', 'select', 'half', false, 30, v_list_prov, 'Seleccionar provincia...');

  INSERT INTO public.form_fields_v2 (form_template_id, field_name, field_label, section_id, field_type, field_width, is_required, display_order, placeholder)
  VALUES (v_tmpl_id, 'localidad', 'Localidad', 'sec-hac-ubicacion', 'text', 'half', false, 31, 'ej: Corrientes');

  RAISE NOTICE 'Formulario Ganadería Hacienda creado — 15 campos en 4 secciones.';
END $$;
