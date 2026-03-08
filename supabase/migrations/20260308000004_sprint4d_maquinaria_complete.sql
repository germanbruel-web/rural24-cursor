-- ============================================================
-- Sprint 4D (completo): Formularios Maquinaria Agrícola
-- ============================================================
-- Tres templates vinculados a subcategorías específicas:
--   maquinaria_maquinarias → subcategoría MAQUINARIAS (equipos)
--   maquinaria_servicios   → subcategoría SERVICIOS
--   maquinaria_empresas    → subcategoría EMPRESAS (concesionarios, fabricantes, etc.)
--
-- ⚠ Este script primero limpia la migración anterior
--   (20260308000003) si fue aplicada.
-- ============================================================

-- ─── Cleanup migración anterior (idempotente) ─────────────────

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='form_fields_v2') THEN
    DELETE FROM public.form_fields_v2
    WHERE form_template_id IN (
      SELECT id FROM public.form_templates_v2 WHERE name = 'maquinaria_agricola'
    );
    DELETE FROM public.form_templates_v2 WHERE name = 'maquinaria_agricola';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='option_list_items') THEN
    DELETE FROM public.option_list_items
    WHERE list_id IN (
      SELECT id FROM public.option_lists
      WHERE name IN ('tipo-maquinaria', 'marcas-maquinaria', 'tipo-traccion')
    );
    DELETE FROM public.option_lists
    WHERE name IN ('tipo-maquinaria', 'marcas-maquinaria', 'tipo-traccion');
  END IF;
END $$;

-- ─── Nuevas option_lists ──────────────────────────────────────

INSERT INTO public.option_lists (name, display_name, scope, description)
VALUES
  ('tipo-maquinaria',       'Tipo de Maquinaria',              'category',
   'Clasificación de equipos y maquinaria agrícola'),
  ('marcas-maquinaria',     'Marcas de Maquinaria',            'global',
   'Marcas fabricantes de maquinaria agrícola'),
  ('tipo-traccion',         'Tipo de Tracción',                'global',
   'Sistema de tracción del equipo (2WD, 4WD, oruga, etc.)'),
  ('servicios-maquinaria',  'Tipos de Servicio (Maquinaria)',  'category',
   'Tipos de servicio para maquinaria agrícola'),
  ('tipos-empresa-maquinaria', 'Tipos de Empresa (Maquinaria)', 'category',
   'Clasificación de empresas del sector maquinaria agrícola')
ON CONFLICT (name) DO NOTHING;

-- Asociar listas de categoría a maquinarias
UPDATE public.option_lists ol
SET category_id = (SELECT id FROM public.categories WHERE name = 'maquinarias' LIMIT 1)
WHERE ol.name IN ('tipo-maquinaria', 'servicios-maquinaria', 'tipos-empresa-maquinaria')
  AND (SELECT id FROM public.categories WHERE name = 'maquinarias' LIMIT 1) IS NOT NULL;

-- ─── Ítems: Tipo de Maquinaria (22 tipos exactos) ────────────

INSERT INTO public.option_list_items (list_id, value, label, sort_order)
SELECT ol.id, v.value, v.label, v.sort_order
FROM public.option_lists ol,
  (VALUES
    ('tractores',            'Tractores',               0),
    ('cosechadoras',         'Cosechadoras',            1),
    ('camiones',             'Camiones',                2),
    ('camionetas',           'Camionetas',              3),
    ('sembradoras',          'Sembradoras',             4),
    ('pulverizadoras',       'Pulverizadoras',          5),
    ('acoplados',            'Acoplados',               6),
    ('tolvas',               'Tolvas',                  7),
    ('fertilizadoras',       'Fertilizadoras',          8),
    ('rastras',              'Rastras',                 9),
    ('discos',               'Discos',                 10),
    ('cultivadores',         'Cultivadores',           11),
    ('rodillos',             'Rodillos',               12),
    ('palas',                'Palas',                  13),
    ('mixers',               'Mixers',                 14),
    ('embolsadoras',         'Embolsadoras',           15),
    ('moledoras',            'Moledoras',              16),
    ('extractoras-silo',     'Extractoras de silo',    17),
    ('levanta-fardos',       'Levanta fardos',         18),
    ('picadora-rollos',      'Picadora de rollos',     19),
    ('estercolera',          'Estercolera',            20),
    ('balanzas-ganaderas',   'Balanzas ganaderas',     21),
    ('otro',                 'Otro',                   99)
  ) AS v(value, label, sort_order)
WHERE ol.name = 'tipo-maquinaria'
ON CONFLICT (list_id, value) DO NOTHING;

-- ─── Ítems: Marcas de Maquinaria ─────────────────────────────

INSERT INTO public.option_list_items (list_id, value, label, sort_order)
SELECT ol.id, v.value, v.label, v.sort_order
FROM public.option_lists ol,
  (VALUES
    ('john-deere',       'John Deere',        0),
    ('case-ih',          'Case IH',           1),
    ('new-holland',      'New Holland',       2),
    ('deutz-fahr',       'Deutz-Fahr',        3),
    ('massey-ferguson',  'Massey Ferguson',   4),
    ('claas',            'CLAAS',             5),
    ('challenger',       'Challenger',        6),
    ('pauny',            'Pauny',             7),
    ('zanello',          'Zanello',           8),
    ('metalfor',         'Metalfor',          9),
    ('apache',           'Apache',           10),
    ('crucianelli',      'Crucianelli',      11),
    ('agrometal',        'Agrometal',        12),
    ('mainero',          'Mainero',          13),
    ('bertini',          'Bertini',          14),
    ('yomel',            'Yomel',            15),
    ('otra',             'Otra',             99)
  ) AS v(value, label, sort_order)
WHERE ol.name = 'marcas-maquinaria'
ON CONFLICT (list_id, value) DO NOTHING;

-- ─── Ítems: Tipo de Tracción ──────────────────────────────────

INSERT INTO public.option_list_items (list_id, value, label, sort_order)
SELECT ol.id, v.value, v.label, v.sort_order
FROM public.option_lists ol,
  (VALUES
    ('2wd',         '2WD / Tracción simple',  0),
    ('4wd',         '4WD / Doble tracción',   1),
    ('articulado',  'Articulado',             2),
    ('oruga',       'Oruga / Cadena',         3),
    ('otro',        'Otro',                  99)
  ) AS v(value, label, sort_order)
WHERE ol.name = 'tipo-traccion'
ON CONFLICT (list_id, value) DO NOTHING;

-- ─── Ítems: Servicios de Maquinaria ──────────────────────────

INSERT INTO public.option_list_items (list_id, value, label, sort_order)
SELECT ol.id, v.value, v.label, v.sort_order
FROM public.option_lists ol,
  (VALUES
    ('reparacion',    'Reparación de maquinaria',   0),
    ('mantenimiento', 'Mantenimiento',              1),
    ('alquiler',      'Alquiler de maquinaria',     2),
    ('contratista',   'Contratista de maquinaria',  3),
    ('otro',          'Otro',                       99)
  ) AS v(value, label, sort_order)
WHERE ol.name = 'servicios-maquinaria'
ON CONFLICT (list_id, value) DO NOTHING;

-- ─── Ítems: Tipos de Empresa (Maquinaria) ─────────────────────

INSERT INTO public.option_list_items (list_id, value, label, sort_order)
SELECT ol.id, v.value, v.label, v.sort_order
FROM public.option_lists ol,
  (VALUES
    ('concesionario',    'Concesionario',             0),
    ('fabricante',       'Fabricante',                1),
    ('importador',       'Importador',                2),
    ('taller',           'Taller especializado',      3),
    ('repuestos',        'Repuestos agrícolas',       4),
    ('financiacion',     'Financiación / Leasing',    5),
    ('aseguradora',      'Aseguradora',               6),
    ('otro',             'Otro',                     99)
  ) AS v(value, label, sort_order)
WHERE ol.name = 'tipos-empresa-maquinaria'
ON CONFLICT (list_id, value) DO NOTHING;

-- ─── Template 1: MAQUINARIAS (equipos) ───────────────────────

DO $$
DECLARE
  v_cat_id        uuid;
  v_subcat_id     uuid;
  v_tmpl_id       uuid;
  v_list_tipo     uuid;
  v_list_marca    uuid;
  v_list_traccion uuid;
  v_list_estado   uuid;
  v_list_prov     uuid;
BEGIN
  SELECT id INTO v_cat_id FROM public.categories WHERE name = 'maquinarias' LIMIT 1;
  IF v_cat_id IS NULL THEN
    RAISE NOTICE 'Categoría "maquinarias" no encontrada — omitiendo template MAQUINARIAS.';
    RETURN;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'form_templates_v2'
  ) THEN
    RAISE NOTICE 'form_templates_v2 no existe — omitiendo seed.';
    RETURN;
  END IF;

  IF EXISTS (SELECT 1 FROM public.form_templates_v2 WHERE name = 'maquinaria_maquinarias') THEN
    RAISE NOTICE 'maquinaria_maquinarias ya existe — omitiendo.';
    RETURN;
  END IF;

  -- Subcategoría MAQUINARIAS dentro de la categoría maquinarias
  SELECT sc.id INTO v_subcat_id
  FROM public.subcategories sc
  WHERE sc.category_id = v_cat_id
    AND lower(sc.name) = 'maquinarias'
  LIMIT 1;

  -- IDs de option_lists
  SELECT id INTO v_list_tipo    FROM public.option_lists WHERE name = 'tipo-maquinaria';
  SELECT id INTO v_list_marca   FROM public.option_lists WHERE name = 'marcas-maquinaria';
  SELECT id INTO v_list_traccion FROM public.option_lists WHERE name = 'tipo-traccion';
  SELECT id INTO v_list_estado  FROM public.option_lists WHERE name = 'estado-general';
  SELECT id INTO v_list_prov    FROM public.option_lists WHERE name = 'provincias-ar';

  INSERT INTO public.form_templates_v2 (
    name, display_name, category_id, subcategory_id,
    sections, is_active, priority
  ) VALUES (
    'maquinaria_maquinarias',
    'Formulario Maquinaria — Equipos',
    v_cat_id,
    v_subcat_id,
    jsonb_build_array(
      jsonb_build_object('id','sec-maq-info-general',    'name','informacion_general',  'label','Información General',   'display_order',0,'collapsible',false),
      jsonb_build_object('id','sec-maq-caracteristicas', 'name','caracteristicas',       'label','Características',        'display_order',1,'collapsible',false),
      jsonb_build_object('id','sec-maq-comercial',       'name','informacion_comercial', 'label','Información Comercial',  'display_order',2,'collapsible',false),
      jsonb_build_object('id','sec-maq-ubicacion',       'name','ubicacion',             'label','Ubicación',              'display_order',3,'collapsible',false)
    ),
    true, 10
  )
  RETURNING id INTO v_tmpl_id;

  RAISE NOTICE 'Template maquinaria_maquinarias creado: %', v_tmpl_id;

  -- ── Información General ───────────────────────────────────

  INSERT INTO public.form_fields_v2 (form_template_id, field_name, field_label, section_id, field_type, field_width, is_required, display_order, option_list_id, placeholder)
  VALUES (v_tmpl_id, 'tipo_maquinaria', 'Tipo de maquinaria', 'sec-maq-info-general', 'select', 'half', true, 0, v_list_tipo, 'Seleccionar tipo...');

  INSERT INTO public.form_fields_v2 (form_template_id, field_name, field_label, section_id, field_type, field_width, is_required, display_order, option_list_id, placeholder)
  VALUES (v_tmpl_id, 'marca', 'Marca', 'sec-maq-info-general', 'select', 'half', false, 1, v_list_marca, 'Seleccionar marca...');

  INSERT INTO public.form_fields_v2 (form_template_id, field_name, field_label, section_id, field_type, field_width, is_required, display_order, placeholder)
  VALUES (v_tmpl_id, 'modelo', 'Modelo', 'sec-maq-info-general', 'text', 'half', false, 2, 'ej: 7130, TC57, CR 8.90');

  INSERT INTO public.form_fields_v2 (form_template_id, field_name, field_label, section_id, field_type, field_width, is_required, display_order, placeholder, validation_rules)
  VALUES (v_tmpl_id, 'anio_fabricacion', 'Año de fabricación', 'sec-maq-info-general', 'number', 'half', false, 3, 'ej: 2018', '{"min":1950,"max":2030}'::jsonb);

  INSERT INTO public.form_fields_v2 (form_template_id, field_name, field_label, section_id, field_type, field_width, is_required, display_order, options, placeholder)
  VALUES (v_tmpl_id, 'condicion', 'Condición', 'sec-maq-info-general', 'select', 'half', false, 4,
    '[{"value":"nuevo","label":"Nuevo"},{"value":"usado","label":"Usado"}]'::jsonb, 'Seleccionar...');

  -- ── Características ───────────────────────────────────────

  INSERT INTO public.form_fields_v2 (form_template_id, field_name, field_label, section_id, field_type, field_width, is_required, display_order, placeholder, help_text)
  VALUES (v_tmpl_id, 'horas_uso', 'Horas de uso', 'sec-maq-caracteristicas', 'number', 'half', false, 10, 'ej: 3500', 'Horas totales en horómetro');

  INSERT INTO public.form_fields_v2 (form_template_id, field_name, field_label, section_id, field_type, field_width, is_required, display_order, placeholder, help_text)
  VALUES (v_tmpl_id, 'potencia_hp', 'Potencia (HP)', 'sec-maq-caracteristicas', 'number', 'half', false, 11, 'ej: 150', 'Caballos de fuerza');

  INSERT INTO public.form_fields_v2 (form_template_id, field_name, field_label, section_id, field_type, field_width, is_required, display_order, option_list_id, placeholder)
  VALUES (v_tmpl_id, 'tipo_traccion', 'Tipo de tracción', 'sec-maq-caracteristicas', 'select', 'half', false, 12, v_list_traccion, 'Seleccionar tracción...');

  INSERT INTO public.form_fields_v2 (form_template_id, field_name, field_label, section_id, field_type, field_width, is_required, display_order, option_list_id, placeholder)
  VALUES (v_tmpl_id, 'estado_general', 'Estado general', 'sec-maq-caracteristicas', 'select', 'half', false, 13, v_list_estado, 'Seleccionar estado...');

  INSERT INTO public.form_fields_v2 (form_template_id, field_name, field_label, section_id, field_type, field_width, is_required, display_order, options, placeholder)
  VALUES (v_tmpl_id, 'origen_maquinaria', 'Origen', 'sec-maq-caracteristicas', 'select', 'half', false, 14,
    '[{"value":"nacional","label":"Nacional"},{"value":"importada","label":"Importada"}]'::jsonb, 'Seleccionar...');

  -- ── Información Comercial (checkboxes) ────────────────────

  INSERT INTO public.form_fields_v2 (form_template_id, field_name, field_label, section_id, field_type, field_width, is_required, display_order)
  VALUES
    (v_tmpl_id, 'cuotas_pesos',    'Cuotas en pesos',                 'sec-maq-comercial', 'checkbox', 'third', false, 20),
    (v_tmpl_id, 'cuotas_dolares',  'Cuotas en dólares',              'sec-maq-comercial', 'checkbox', 'third', false, 21),
    (v_tmpl_id, 'permuta',         'Permuta / Canje',                 'sec-maq-comercial', 'checkbox', 'third', false, 22),
    (v_tmpl_id, 'garantia',        'Con garantía',                    'sec-maq-comercial', 'checkbox', 'third', false, 23),
    (v_tmpl_id, 'credito_bancario','Crédito bancario / cooperativa',  'sec-maq-comercial', 'checkbox', 'third', false, 24);

  -- ── Ubicación ────────────────────────────────────────────

  INSERT INTO public.form_fields_v2 (form_template_id, field_name, field_label, section_id, field_type, field_width, is_required, display_order, option_list_id, placeholder)
  VALUES (v_tmpl_id, 'provincia', 'Provincia', 'sec-maq-ubicacion', 'select', 'half', false, 30, v_list_prov, 'Seleccionar provincia...');

  INSERT INTO public.form_fields_v2 (form_template_id, field_name, field_label, section_id, field_type, field_width, is_required, display_order, placeholder)
  VALUES (v_tmpl_id, 'localidad', 'Localidad', 'sec-maq-ubicacion', 'text', 'half', false, 31, 'ej: Rosario');

  RAISE NOTICE 'Template MAQUINARIAS creado — 17 campos en 4 secciones.';
END $$;

-- ─── Template 2: SERVICIOS ────────────────────────────────────

DO $$
DECLARE
  v_cat_id      uuid;
  v_subcat_id   uuid;
  v_tmpl_id     uuid;
  v_list_serv   uuid;
  v_list_prov   uuid;
BEGIN
  SELECT id INTO v_cat_id FROM public.categories WHERE name = 'maquinarias' LIMIT 1;
  IF v_cat_id IS NULL THEN
    RAISE NOTICE 'Categoría "maquinarias" no encontrada — omitiendo template SERVICIOS.';
    RETURN;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'form_templates_v2'
  ) THEN
    RAISE NOTICE 'form_templates_v2 no existe — omitiendo seed.';
    RETURN;
  END IF;

  IF EXISTS (SELECT 1 FROM public.form_templates_v2 WHERE name = 'maquinaria_servicios') THEN
    RAISE NOTICE 'maquinaria_servicios ya existe — omitiendo.';
    RETURN;
  END IF;

  -- Subcategoría SERVICIOS dentro de la categoría maquinarias
  SELECT sc.id INTO v_subcat_id
  FROM public.subcategories sc
  WHERE sc.category_id = v_cat_id
    AND lower(sc.name) = 'servicios'
  LIMIT 1;

  SELECT id INTO v_list_serv FROM public.option_lists WHERE name = 'servicios-maquinaria';
  SELECT id INTO v_list_prov FROM public.option_lists WHERE name = 'provincias-ar';

  INSERT INTO public.form_templates_v2 (
    name, display_name, category_id, subcategory_id,
    sections, is_active, priority
  ) VALUES (
    'maquinaria_servicios',
    'Formulario Maquinaria — Servicios',
    v_cat_id,
    v_subcat_id,
    jsonb_build_array(
      jsonb_build_object('id','sec-svc-info',     'name','informacion',  'label','Información del Servicio', 'display_order',0,'collapsible',false),
      jsonb_build_object('id','sec-svc-ubicacion','name','ubicacion',    'label','Zona de Cobertura',        'display_order',1,'collapsible',false)
    ),
    true, 10
  )
  RETURNING id INTO v_tmpl_id;

  RAISE NOTICE 'Template maquinaria_servicios creado: %', v_tmpl_id;

  -- ── Información del Servicio ──────────────────────────────

  INSERT INTO public.form_fields_v2 (form_template_id, field_name, field_label, section_id, field_type, field_width, is_required, display_order, option_list_id, placeholder)
  VALUES (v_tmpl_id, 'tipo_servicio', 'Tipo de servicio', 'sec-svc-info', 'select', 'full', true, 0, v_list_serv, 'Seleccionar tipo de servicio...');

  -- ── Zona de Cobertura ─────────────────────────────────────

  INSERT INTO public.form_fields_v2 (form_template_id, field_name, field_label, section_id, field_type, field_width, is_required, display_order, option_list_id, placeholder)
  VALUES (v_tmpl_id, 'provincia', 'Provincia', 'sec-svc-ubicacion', 'select', 'half', false, 10, v_list_prov, 'Seleccionar provincia...');

  INSERT INTO public.form_fields_v2 (form_template_id, field_name, field_label, section_id, field_type, field_width, is_required, display_order, placeholder)
  VALUES (v_tmpl_id, 'localidad', 'Localidad', 'sec-svc-ubicacion', 'text', 'half', false, 11, 'ej: Rosario');

  RAISE NOTICE 'Template SERVICIOS creado — 3 campos en 2 secciones.';
END $$;

-- ─── Template 3: EMPRESAS ─────────────────────────────────────

DO $$
DECLARE
  v_cat_id      uuid;
  v_subcat_id   uuid;
  v_tmpl_id     uuid;
  v_list_tipo   uuid;
  v_list_prov   uuid;
BEGIN
  SELECT id INTO v_cat_id FROM public.categories WHERE name = 'maquinarias' LIMIT 1;
  IF v_cat_id IS NULL THEN
    RAISE NOTICE 'Categoría "maquinarias" no encontrada — omitiendo template EMPRESAS.';
    RETURN;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'form_templates_v2'
  ) THEN
    RAISE NOTICE 'form_templates_v2 no existe — omitiendo seed.';
    RETURN;
  END IF;

  IF EXISTS (SELECT 1 FROM public.form_templates_v2 WHERE name = 'maquinaria_empresas') THEN
    RAISE NOTICE 'maquinaria_empresas ya existe — omitiendo.';
    RETURN;
  END IF;

  -- Subcategoría EMPRESAS dentro de la categoría maquinarias
  SELECT sc.id INTO v_subcat_id
  FROM public.subcategories sc
  WHERE sc.category_id = v_cat_id
    AND lower(sc.name) = 'empresas'
  LIMIT 1;

  SELECT id INTO v_list_tipo FROM public.option_lists WHERE name = 'tipos-empresa-maquinaria';
  SELECT id INTO v_list_prov FROM public.option_lists WHERE name = 'provincias-ar';

  INSERT INTO public.form_templates_v2 (
    name, display_name, category_id, subcategory_id,
    sections, is_active, priority
  ) VALUES (
    'maquinaria_empresas',
    'Formulario Maquinaria — Empresas',
    v_cat_id,
    v_subcat_id,
    jsonb_build_array(
      jsonb_build_object('id','sec-emp-info',     'name','informacion', 'label','Información de la Empresa', 'display_order',0,'collapsible',false),
      jsonb_build_object('id','sec-emp-ubicacion','name','ubicacion',   'label','Ubicación',                 'display_order',1,'collapsible',false)
    ),
    true, 10
  )
  RETURNING id INTO v_tmpl_id;

  RAISE NOTICE 'Template maquinaria_empresas creado: %', v_tmpl_id;

  -- ── Información de la Empresa ─────────────────────────────

  INSERT INTO public.form_fields_v2 (form_template_id, field_name, field_label, section_id, field_type, field_width, is_required, display_order, option_list_id, placeholder)
  VALUES (v_tmpl_id, 'tipo_empresa', 'Tipo de empresa', 'sec-emp-info', 'select', 'half', true, 0, v_list_tipo, 'Seleccionar tipo...');

  INSERT INTO public.form_fields_v2 (form_template_id, field_name, field_label, section_id, field_type, field_width, is_required, display_order, placeholder)
  VALUES (v_tmpl_id, 'razon_social', 'Razón social', 'sec-emp-info', 'text', 'half', false, 1, 'Nombre legal de la empresa');

  INSERT INTO public.form_fields_v2 (form_template_id, field_name, field_label, section_id, field_type, field_width, is_required, display_order, placeholder, help_text)
  VALUES (v_tmpl_id, 'anios_actividad', 'Años en actividad', 'sec-emp-info', 'number', 'half', false, 2, 'ej: 15', 'Años de trayectoria en el sector');

  -- ── Ubicación ────────────────────────────────────────────

  INSERT INTO public.form_fields_v2 (form_template_id, field_name, field_label, section_id, field_type, field_width, is_required, display_order, option_list_id, placeholder)
  VALUES (v_tmpl_id, 'provincia', 'Provincia', 'sec-emp-ubicacion', 'select', 'half', false, 10, v_list_prov, 'Seleccionar provincia...');

  INSERT INTO public.form_fields_v2 (form_template_id, field_name, field_label, section_id, field_type, field_width, is_required, display_order, placeholder)
  VALUES (v_tmpl_id, 'localidad', 'Localidad', 'sec-emp-ubicacion', 'text', 'half', false, 11, 'ej: Córdoba');

  RAISE NOTICE 'Template EMPRESAS creado — 5 campos en 2 secciones.';
END $$;
