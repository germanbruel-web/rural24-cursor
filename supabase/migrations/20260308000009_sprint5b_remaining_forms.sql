-- ============================================================
-- Sprint 5B: Formularios restantes — Ganadería Insumos/Servicios
--             + Agricultura Insumos/Servicios
-- ============================================================
-- Crea 4 templates de formularios dinámicos para las subcategorías
-- que aún no tienen form_template_v2:
--
--   ganaderia_insumos    → subcategoría "insumos" de Ganadería
--   ganaderia_servicios  → subcategoría "servicios" de Ganadería
--   agricultura_insumos  → subcategoría "insumos" de Agricultura
--   agricultura_servicios→ subcategoría "servicios" de Agricultura
--
-- Nuevas option_lists creadas:
--   tipo-insumo-ganadero   (category: ganaderia)
--   tipo-servicio-ganadero (category: ganaderia)
--   cultivos-objetivo      (global)
--   tipo-insumo-agricola   (category: agricultura)
--   tipo-servicio-agricola (category: agricultura)
--   unidades-cantidad      (global)
--   area-cobertura         (global)
-- ============================================================

-- ─── Nuevas option_lists ──────────────────────────────────────

INSERT INTO public.option_lists (name, display_name, scope, description)
VALUES
  ('tipo-insumo-ganadero',   'Tipo de Insumo Ganadero',     'category', 'Clasificación de insumos para ganadería: alambres, bebederos, etc.'),
  ('tipo-servicio-ganadero', 'Tipo de Servicio Ganadero',   'category', 'Servicios para el sector ganadero: veterinarias, consignatarias, etc.'),
  ('cultivos-objetivo',       'Cultivos Objetivo',           'global',   'Cultivos agrícolas: soja, maíz, trigo, etc.'),
  ('tipo-insumo-agricola',   'Tipo de Insumo Agrícola',     'category', 'Insumos para agricultura: semillas, fertilizantes, agroquímicos, etc.'),
  ('tipo-servicio-agricola', 'Tipo de Servicio Agrícola',   'category', 'Servicios para el sector agrícola: siembra, cosecha, pulverización, etc.'),
  ('unidades-cantidad',       'Unidades de Cantidad',        'global',   'Unidades de medida: kg, litros, bolsas, toneladas, etc.'),
  ('area-cobertura',          'Área de Cobertura',           'global',   'Alcance geográfico de un servicio: local, regional, nacional')
ON CONFLICT (name) DO NOTHING;

-- Asociar listas ganaderas a categoría Ganadería
UPDATE public.option_lists ol
SET category_id = (SELECT id FROM public.categories WHERE name = 'ganaderia' LIMIT 1)
WHERE ol.name IN ('tipo-insumo-ganadero', 'tipo-servicio-ganadero')
  AND (SELECT id FROM public.categories WHERE name = 'ganaderia' LIMIT 1) IS NOT NULL;

-- Asociar listas agrícolas a categoría Agricultura
UPDATE public.option_lists ol
SET category_id = (SELECT id FROM public.categories WHERE name = 'agricultura' LIMIT 1)
WHERE ol.name IN ('tipo-insumo-agricola', 'tipo-servicio-agricola')
  AND (SELECT id FROM public.categories WHERE name = 'agricultura' LIMIT 1) IS NOT NULL;

-- ─── Ítems: Tipo de Insumo Ganadero ──────────────────────────

INSERT INTO public.option_list_items (list_id, value, label, sort_order)
SELECT ol.id, v.value, v.label, v.sort_order
FROM public.option_lists ol,
  (VALUES
    ('alambres',          'Alambres y Postes',          0),
    ('bebederos',         'Bebederos',                  1),
    ('corrales',          'Corrales y Mangas',           2),
    ('cargadores',        'Cargadores / Embarcaderos',  3),
    ('comederos',         'Comederos / Silos',          4),
    ('nutricion-animal',  'Nutrición Animal / Suplementos', 5),
    ('vacunas',           'Vacunas y Productos Veterinarios', 6),
    ('reproductivos',     'Insumos Reproductivos',      7),
    ('aguadas',           'Aguadas / Tanques',          8),
    ('otro',              'Otro',                       99)
  ) AS v(value, label, sort_order)
WHERE ol.name = 'tipo-insumo-ganadero'
ON CONFLICT (list_id, value) DO NOTHING;

-- ─── Ítems: Tipo de Servicio Ganadero ────────────────────────

INSERT INTO public.option_list_items (list_id, value, label, sort_order)
SELECT ol.id, v.value, v.label, v.sort_order
FROM public.option_lists ol,
  (VALUES
    ('veterinaria',              'Veterinaria',                     0),
    ('consignataria',            'Consignataria de Hacienda',       1),
    ('transporte-hacienda',      'Transporte de Hacienda',          2),
    ('inseminacion-artificial',  'Inseminación Artificial',         3),
    ('servicios-reproductivos',  'Servicios Reproductivos',         4),
    ('diagnostico-productivo',   'Diagnóstico Productivo',          5),
    ('nutricion-asesoria',       'Asesoría en Nutrición Animal',    6),
    ('sanidad-preventiva',       'Sanidad y Prevención',            7),
    ('otro',                     'Otro',                            99)
  ) AS v(value, label, sort_order)
WHERE ol.name = 'tipo-servicio-ganadero'
ON CONFLICT (list_id, value) DO NOTHING;

-- ─── Ítems: Cultivos Objetivo ─────────────────────────────────

INSERT INTO public.option_list_items (list_id, value, label, sort_order)
SELECT ol.id, v.value, v.label, v.sort_order
FROM public.option_lists ol,
  (VALUES
    ('soja',        'Soja',          0),
    ('maiz',        'Maíz',          1),
    ('trigo',       'Trigo',         2),
    ('girasol',     'Girasol',       3),
    ('sorgo',       'Sorgo',         4),
    ('cebada',      'Cebada',        5),
    ('arroz',       'Arroz',         6),
    ('algodon',     'Algodón',       7),
    ('tabaco',      'Tabaco',        8),
    ('yerba-mate',  'Yerba Mate',    9),
    ('te',          'Té',            10),
    ('frutas',      'Frutas',        11),
    ('hortalizas',  'Hortalizas',    12),
    ('forrajeras',  'Forrajeras / Pasturas', 13),
    ('otro',        'Otro',          99)
  ) AS v(value, label, sort_order)
WHERE ol.name = 'cultivos-objetivo'
ON CONFLICT (list_id, value) DO NOTHING;

-- ─── Ítems: Tipo de Insumo Agrícola ──────────────────────────

INSERT INTO public.option_list_items (list_id, value, label, sort_order)
SELECT ol.id, v.value, v.label, v.sort_order
FROM public.option_lists ol,
  (VALUES
    ('semillas',       'Semillas',             0),
    ('fertilizantes',  'Fertilizantes',        1),
    ('agroquimicos',   'Agroquímicos',         2),
    ('biologicos',     'Biológicos',           3),
    ('inoculantes',    'Inoculantes',          4),
    ('curasemillas',   'Curasemillas',         5),
    ('coadyuvantes',   'Coadyuvantes',         6),
    ('herbicidas',     'Herbicidas',           7),
    ('fungicidas',     'Fungicidas',           8),
    ('insecticidas',   'Insecticidas',         9),
    ('otro',           'Otro',                 99)
  ) AS v(value, label, sort_order)
WHERE ol.name = 'tipo-insumo-agricola'
ON CONFLICT (list_id, value) DO NOTHING;

-- ─── Ítems: Tipo de Servicio Agrícola ────────────────────────

INSERT INTO public.option_list_items (list_id, value, label, sort_order)
SELECT ol.id, v.value, v.label, v.sort_order
FROM public.option_lists ol,
  (VALUES
    ('siembra',                  'Siembra',                        0),
    ('cosecha',                  'Cosecha',                        1),
    ('pulverizacion',            'Pulverización',                  2),
    ('fumigacion',               'Fumigación',                     3),
    ('fertilizacion',            'Fertilización',                  4),
    ('agricultura-precision',    'Agricultura de Precisión',       5),
    ('asesoramiento-agronomico', 'Asesoramiento Agronómico',       6),
    ('analisis-suelo',           'Análisis de Suelo',             7),
    ('relevamiento-satelital',   'Relevamiento Satelital / Drones',8),
    ('laboreo',                  'Laboreo y Labranza',             9),
    ('otro',                     'Otro',                          99)
  ) AS v(value, label, sort_order)
WHERE ol.name = 'tipo-servicio-agricola'
ON CONFLICT (list_id, value) DO NOTHING;

-- ─── Ítems: Unidades de Cantidad ─────────────────────────────

INSERT INTO public.option_list_items (list_id, value, label, sort_order)
SELECT ol.id, v.value, v.label, v.sort_order
FROM public.option_lists ol,
  (VALUES
    ('unidad',    'Unidad / Pieza', 0),
    ('lote',      'Lote',           1),
    ('kg',        'Kilogramos (kg)',  2),
    ('tn',        'Toneladas (tn)',   3),
    ('litros',    'Litros (l)',       4),
    ('bolsas',    'Bolsas',          5),
    ('packs',     'Packs / Cajas',   6),
    ('otro',      'Otro',            99)
  ) AS v(value, label, sort_order)
WHERE ol.name = 'unidades-cantidad'
ON CONFLICT (list_id, value) DO NOTHING;

-- ─── Ítems: Área de Cobertura ─────────────────────────────────

INSERT INTO public.option_list_items (list_id, value, label, sort_order)
SELECT ol.id, v.value, v.label, v.sort_order
FROM public.option_lists ol,
  (VALUES
    ('local',     'Local (radio < 50 km)',   0),
    ('regional',  'Regional (provincia)',     1),
    ('nacional',  'Nacional',                2)
  ) AS v(value, label, sort_order)
WHERE ol.name = 'area-cobertura'
ON CONFLICT (list_id, value) DO NOTHING;


-- ============================================================
-- FORMULARIOS
-- ============================================================


-- ─── 1. ganaderia_insumos ─────────────────────────────────────

DO $$
DECLARE
  v_cat_id    uuid;
  v_subcat_id uuid;
  v_tmpl_id   uuid;
  v_list_tipo uuid;
  v_list_unid uuid;
  v_list_est  uuid;
  v_list_prov uuid;
BEGIN
  SELECT id INTO v_cat_id FROM public.categories WHERE name = 'ganaderia' LIMIT 1;
  IF v_cat_id IS NULL THEN
    RAISE NOTICE 'Categoría "ganaderia" no encontrada — omitiendo ganaderia_insumos.';
    RETURN;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='form_templates_v2') THEN
    RAISE NOTICE 'form_templates_v2 no existe — omitiendo ganaderia_insumos.';
    RETURN;
  END IF;

  IF EXISTS (SELECT 1 FROM public.form_templates_v2 WHERE name = 'ganaderia_insumos') THEN
    RAISE NOTICE 'ganaderia_insumos ya existe — omitiendo.';
    RETURN;
  END IF;

  SELECT sc.id INTO v_subcat_id
  FROM public.subcategories sc
  WHERE sc.category_id = v_cat_id AND lower(sc.name) = 'insumos'
  LIMIT 1;

  SELECT id INTO v_list_tipo FROM public.option_lists WHERE name = 'tipo-insumo-ganadero';
  SELECT id INTO v_list_unid FROM public.option_lists WHERE name = 'unidades-cantidad';
  SELECT id INTO v_list_est  FROM public.option_lists WHERE name = 'estado-general';
  SELECT id INTO v_list_prov FROM public.option_lists WHERE name = 'provincias-ar';

  INSERT INTO public.form_templates_v2 (
    name, display_name, category_id, subcategory_id, sections, is_active, priority
  ) VALUES (
    'ganaderia_insumos',
    'Formulario Ganadería — Insumos',
    v_cat_id, v_subcat_id,
    jsonb_build_array(
      jsonb_build_object('id','sec-ginsu-info',      'name','informacion_general',  'label','Información General',  'display_order',0,'collapsible',false),
      jsonb_build_object('id','sec-ginsu-caract',    'name','caracteristicas',       'label','Características',       'display_order',1,'collapsible',false),
      jsonb_build_object('id','sec-ginsu-comercial', 'name','informacion_comercial', 'label','Información Comercial', 'display_order',2,'collapsible',false),
      jsonb_build_object('id','sec-ginsu-ubicacion', 'name','ubicacion',             'label','Ubicación',             'display_order',3,'collapsible',false)
    ),
    true, 10
  )
  RETURNING id INTO v_tmpl_id;

  -- Información General
  INSERT INTO public.form_fields_v2 (form_template_id, field_name, field_label, section_id, field_type, field_width, is_required, display_order, option_list_id, placeholder)
  VALUES (v_tmpl_id, 'tipo_insumo', 'Tipo de insumo', 'sec-ginsu-info', 'select', 'half', true, 0, v_list_tipo, 'Seleccionar tipo...');

  INSERT INTO public.form_fields_v2 (form_template_id, field_name, field_label, section_id, field_type, field_width, is_required, display_order, placeholder)
  VALUES (v_tmpl_id, 'marca', 'Marca / Fabricante', 'sec-ginsu-info', 'text', 'half', false, 1, 'ej: DeLaval, Gallagher...');

  INSERT INTO public.form_fields_v2 (form_template_id, field_name, field_label, section_id, field_type, field_width, is_required, display_order, options, placeholder)
  VALUES (v_tmpl_id, 'condicion', 'Condición', 'sec-ginsu-info', 'select', 'half', false, 2,
    '[{"value":"nuevo","label":"Nuevo"},{"value":"usado","label":"Usado"}]'::jsonb,
    'Seleccionar...');

  -- Características
  INSERT INTO public.form_fields_v2 (form_template_id, field_name, field_label, section_id, field_type, field_width, is_required, display_order, placeholder, help_text)
  VALUES (v_tmpl_id, 'cantidad', 'Cantidad disponible', 'sec-ginsu-caract', 'number', 'half', false, 10, 'ej: 10', 'Cantidad total disponible para la venta');

  INSERT INTO public.form_fields_v2 (form_template_id, field_name, field_label, section_id, field_type, field_width, is_required, display_order, option_list_id, placeholder)
  VALUES (v_tmpl_id, 'unidad', 'Unidad', 'sec-ginsu-caract', 'select', 'half', false, 11, v_list_unid, 'Seleccionar unidad...');

  INSERT INTO public.form_fields_v2 (form_template_id, field_name, field_label, section_id, field_type, field_width, is_required, display_order, option_list_id, placeholder)
  VALUES (v_tmpl_id, 'estado_general', 'Estado general', 'sec-ginsu-caract', 'select', 'half', false, 12, v_list_est, 'Seleccionar estado...');

  -- Información Comercial
  INSERT INTO public.form_fields_v2 (form_template_id, field_name, field_label, section_id, field_type, field_width, is_required, display_order)
  VALUES
    (v_tmpl_id, 'permuta',        'Permuta / Canje',   'sec-ginsu-comercial', 'checkbox', 'third', false, 20),
    (v_tmpl_id, 'cuotas_pesos',   'Cuotas en pesos',   'sec-ginsu-comercial', 'checkbox', 'third', false, 21),
    (v_tmpl_id, 'incluye_flete',  'Incluye flete',     'sec-ginsu-comercial', 'checkbox', 'third', false, 22);

  -- Ubicación
  INSERT INTO public.form_fields_v2 (form_template_id, field_name, field_label, section_id, field_type, field_width, is_required, display_order, option_list_id, placeholder)
  VALUES (v_tmpl_id, 'provincia', 'Provincia', 'sec-ginsu-ubicacion', 'select', 'half', false, 30, v_list_prov, 'Seleccionar provincia...');

  INSERT INTO public.form_fields_v2 (form_template_id, field_name, field_label, section_id, field_type, field_width, is_required, display_order, placeholder)
  VALUES (v_tmpl_id, 'localidad', 'Localidad', 'sec-ginsu-ubicacion', 'text', 'half', false, 31, 'ej: Corrientes');

  RAISE NOTICE 'Formulario Ganadería Insumos creado — 11 campos en 4 secciones.';
END $$;


-- ─── 2. ganaderia_servicios ───────────────────────────────────

DO $$
DECLARE
  v_cat_id    uuid;
  v_subcat_id uuid;
  v_tmpl_id   uuid;
  v_list_tipo uuid;
  v_list_area uuid;
  v_list_prov uuid;
BEGIN
  SELECT id INTO v_cat_id FROM public.categories WHERE name = 'ganaderia' LIMIT 1;
  IF v_cat_id IS NULL THEN
    RAISE NOTICE 'Categoría "ganaderia" no encontrada — omitiendo ganaderia_servicios.';
    RETURN;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='form_templates_v2') THEN
    RAISE NOTICE 'form_templates_v2 no existe — omitiendo ganaderia_servicios.';
    RETURN;
  END IF;

  IF EXISTS (SELECT 1 FROM public.form_templates_v2 WHERE name = 'ganaderia_servicios') THEN
    RAISE NOTICE 'ganaderia_servicios ya existe — omitiendo.';
    RETURN;
  END IF;

  SELECT sc.id INTO v_subcat_id
  FROM public.subcategories sc
  WHERE sc.category_id = v_cat_id AND lower(sc.name) = 'servicios'
  LIMIT 1;

  SELECT id INTO v_list_tipo FROM public.option_lists WHERE name = 'tipo-servicio-ganadero';
  SELECT id INTO v_list_area FROM public.option_lists WHERE name = 'area-cobertura';
  SELECT id INTO v_list_prov FROM public.option_lists WHERE name = 'provincias-ar';

  INSERT INTO public.form_templates_v2 (
    name, display_name, category_id, subcategory_id, sections, is_active, priority
  ) VALUES (
    'ganaderia_servicios',
    'Formulario Ganadería — Servicios',
    v_cat_id, v_subcat_id,
    jsonb_build_array(
      jsonb_build_object('id','sec-gser-servicio',  'name','info_servicio',       'label','Información del Servicio', 'display_order',0,'collapsible',false),
      jsonb_build_object('id','sec-gser-cobertura', 'name','cobertura',           'label','Cobertura',                'display_order',1,'collapsible',false),
      jsonb_build_object('id','sec-gser-condic',    'name','condiciones',         'label','Condiciones',              'display_order',2,'collapsible',false),
      jsonb_build_object('id','sec-gser-ubicacion', 'name','ubicacion',           'label','Ubicación',                'display_order',3,'collapsible',false)
    ),
    true, 10
  )
  RETURNING id INTO v_tmpl_id;

  -- Información del Servicio
  INSERT INTO public.form_fields_v2 (form_template_id, field_name, field_label, section_id, field_type, field_width, is_required, display_order, option_list_id, placeholder)
  VALUES (v_tmpl_id, 'tipo_servicio', 'Tipo de servicio', 'sec-gser-servicio', 'select', 'half', true, 0, v_list_tipo, 'Seleccionar tipo...');

  INSERT INTO public.form_fields_v2 (form_template_id, field_name, field_label, section_id, field_type, field_width, is_required, display_order, placeholder, help_text)
  VALUES (v_tmpl_id, 'anos_experiencia', 'Años de experiencia', 'sec-gser-servicio', 'number', 'half', false, 1, 'ej: 10', 'Años de trayectoria en el rubro');

  -- Cobertura
  INSERT INTO public.form_fields_v2 (form_template_id, field_name, field_label, section_id, field_type, field_width, is_required, display_order, option_list_id, placeholder)
  VALUES (v_tmpl_id, 'area_cobertura', 'Área de cobertura', 'sec-gser-cobertura', 'select', 'half', false, 10, v_list_area, 'Seleccionar cobertura...');

  INSERT INTO public.form_fields_v2 (form_template_id, field_name, field_label, section_id, field_type, field_width, is_required, display_order, placeholder, help_text)
  VALUES (v_tmpl_id, 'zonas_atendidas', 'Zonas atendidas', 'sec-gser-cobertura', 'text', 'half', false, 11, 'ej: NEA, NOA, Litoral', 'Regiones o provincias donde presta el servicio');

  -- Condiciones
  INSERT INTO public.form_fields_v2 (form_template_id, field_name, field_label, section_id, field_type, field_width, is_required, display_order)
  VALUES
    (v_tmpl_id, 'tiene_movilidad',       'Movilidad propia',          'sec-gser-condic', 'checkbox', 'third', false, 20),
    (v_tmpl_id, 'factura',               'Factura / Recibo oficial',   'sec-gser-condic', 'checkbox', 'third', false, 21),
    (v_tmpl_id, 'profesionales_propios', 'Profesionales propios',      'sec-gser-condic', 'checkbox', 'third', false, 22);

  -- Ubicación
  INSERT INTO public.form_fields_v2 (form_template_id, field_name, field_label, section_id, field_type, field_width, is_required, display_order, option_list_id, placeholder)
  VALUES (v_tmpl_id, 'provincia', 'Provincia', 'sec-gser-ubicacion', 'select', 'half', false, 30, v_list_prov, 'Seleccionar provincia...');

  INSERT INTO public.form_fields_v2 (form_template_id, field_name, field_label, section_id, field_type, field_width, is_required, display_order, placeholder)
  VALUES (v_tmpl_id, 'localidad', 'Localidad', 'sec-gser-ubicacion', 'text', 'half', false, 31, 'ej: Corrientes');

  RAISE NOTICE 'Formulario Ganadería Servicios creado — 9 campos en 4 secciones.';
END $$;


-- ─── 3. agricultura_insumos ───────────────────────────────────

DO $$
DECLARE
  v_cat_id    uuid;
  v_subcat_id uuid;
  v_tmpl_id   uuid;
  v_list_tipo uuid;
  v_list_cult uuid;
  v_list_unid uuid;
  v_list_est  uuid;
  v_list_prov uuid;
BEGIN
  SELECT id INTO v_cat_id FROM public.categories WHERE name = 'agricultura' LIMIT 1;
  IF v_cat_id IS NULL THEN
    RAISE NOTICE 'Categoría "agricultura" no encontrada — omitiendo agricultura_insumos.';
    RETURN;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='form_templates_v2') THEN
    RAISE NOTICE 'form_templates_v2 no existe — omitiendo agricultura_insumos.';
    RETURN;
  END IF;

  IF EXISTS (SELECT 1 FROM public.form_templates_v2 WHERE name = 'agricultura_insumos') THEN
    RAISE NOTICE 'agricultura_insumos ya existe — omitiendo.';
    RETURN;
  END IF;

  SELECT sc.id INTO v_subcat_id
  FROM public.subcategories sc
  WHERE sc.category_id = v_cat_id AND lower(sc.name) = 'insumos'
  LIMIT 1;

  SELECT id INTO v_list_tipo FROM public.option_lists WHERE name = 'tipo-insumo-agricola';
  SELECT id INTO v_list_cult FROM public.option_lists WHERE name = 'cultivos-objetivo';
  SELECT id INTO v_list_unid FROM public.option_lists WHERE name = 'unidades-cantidad';
  SELECT id INTO v_list_est  FROM public.option_lists WHERE name = 'estado-general';
  SELECT id INTO v_list_prov FROM public.option_lists WHERE name = 'provincias-ar';

  INSERT INTO public.form_templates_v2 (
    name, display_name, category_id, subcategory_id, sections, is_active, priority
  ) VALUES (
    'agricultura_insumos',
    'Formulario Agricultura — Insumos',
    v_cat_id, v_subcat_id,
    jsonb_build_array(
      jsonb_build_object('id','sec-ainsu-info',      'name','informacion_general',  'label','Información General',  'display_order',0,'collapsible',false),
      jsonb_build_object('id','sec-ainsu-caract',    'name','caracteristicas',       'label','Características',       'display_order',1,'collapsible',false),
      jsonb_build_object('id','sec-ainsu-comercial', 'name','informacion_comercial', 'label','Información Comercial', 'display_order',2,'collapsible',false),
      jsonb_build_object('id','sec-ainsu-ubicacion', 'name','ubicacion',             'label','Ubicación',             'display_order',3,'collapsible',false)
    ),
    true, 10
  )
  RETURNING id INTO v_tmpl_id;

  -- Información General
  INSERT INTO public.form_fields_v2 (form_template_id, field_name, field_label, section_id, field_type, field_width, is_required, display_order, option_list_id, placeholder)
  VALUES (v_tmpl_id, 'tipo_insumo', 'Tipo de insumo', 'sec-ainsu-info', 'select', 'half', true, 0, v_list_tipo, 'Seleccionar tipo...');

  INSERT INTO public.form_fields_v2 (form_template_id, field_name, field_label, section_id, field_type, field_width, is_required, display_order, option_list_id, placeholder)
  VALUES (v_tmpl_id, 'cultivo_objetivo', 'Cultivo objetivo', 'sec-ainsu-info', 'select', 'half', false, 1, v_list_cult, 'Seleccionar cultivo...');

  INSERT INTO public.form_fields_v2 (form_template_id, field_name, field_label, section_id, field_type, field_width, is_required, display_order, placeholder)
  VALUES (v_tmpl_id, 'marca', 'Marca / Fabricante', 'sec-ainsu-info', 'text', 'half', false, 2, 'ej: Bayer, Basf, Pioneer...');

  INSERT INTO public.form_fields_v2 (form_template_id, field_name, field_label, section_id, field_type, field_width, is_required, display_order, options, placeholder)
  VALUES (v_tmpl_id, 'condicion', 'Condición', 'sec-ainsu-info', 'select', 'half', false, 3,
    '[{"value":"nuevo","label":"Nuevo"},{"value":"usado","label":"Usado"}]'::jsonb,
    'Seleccionar...');

  -- Características
  INSERT INTO public.form_fields_v2 (form_template_id, field_name, field_label, section_id, field_type, field_width, is_required, display_order, placeholder, help_text)
  VALUES (v_tmpl_id, 'cantidad', 'Cantidad disponible', 'sec-ainsu-caract', 'number', 'half', false, 10, 'ej: 1000', 'Cantidad total disponible para la venta');

  INSERT INTO public.form_fields_v2 (form_template_id, field_name, field_label, section_id, field_type, field_width, is_required, display_order, option_list_id, placeholder)
  VALUES (v_tmpl_id, 'unidad', 'Unidad', 'sec-ainsu-caract', 'select', 'half', false, 11, v_list_unid, 'Seleccionar unidad...');

  INSERT INTO public.form_fields_v2 (form_template_id, field_name, field_label, section_id, field_type, field_width, is_required, display_order, option_list_id, placeholder)
  VALUES (v_tmpl_id, 'estado_general', 'Estado general', 'sec-ainsu-caract', 'select', 'half', false, 12, v_list_est, 'Seleccionar estado...');

  -- Información Comercial
  INSERT INTO public.form_fields_v2 (form_template_id, field_name, field_label, section_id, field_type, field_width, is_required, display_order)
  VALUES
    (v_tmpl_id, 'permuta',       'Permuta / Canje',     'sec-ainsu-comercial', 'checkbox', 'third', false, 20),
    (v_tmpl_id, 'cuotas_pesos',  'Cuotas en pesos',     'sec-ainsu-comercial', 'checkbox', 'third', false, 21),
    (v_tmpl_id, 'incluye_flete', 'Incluye flete',       'sec-ainsu-comercial', 'checkbox', 'third', false, 22);

  -- Ubicación
  INSERT INTO public.form_fields_v2 (form_template_id, field_name, field_label, section_id, field_type, field_width, is_required, display_order, option_list_id, placeholder)
  VALUES (v_tmpl_id, 'provincia', 'Provincia', 'sec-ainsu-ubicacion', 'select', 'half', false, 30, v_list_prov, 'Seleccionar provincia...');

  INSERT INTO public.form_fields_v2 (form_template_id, field_name, field_label, section_id, field_type, field_width, is_required, display_order, placeholder)
  VALUES (v_tmpl_id, 'localidad', 'Localidad', 'sec-ainsu-ubicacion', 'text', 'half', false, 31, 'ej: Rosario');

  RAISE NOTICE 'Formulario Agricultura Insumos creado — 12 campos en 4 secciones.';
END $$;


-- ─── 4. agricultura_servicios ─────────────────────────────────

DO $$
DECLARE
  v_cat_id    uuid;
  v_subcat_id uuid;
  v_tmpl_id   uuid;
  v_list_tipo uuid;
  v_list_area uuid;
  v_list_prov uuid;
BEGIN
  SELECT id INTO v_cat_id FROM public.categories WHERE name = 'agricultura' LIMIT 1;
  IF v_cat_id IS NULL THEN
    RAISE NOTICE 'Categoría "agricultura" no encontrada — omitiendo agricultura_servicios.';
    RETURN;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='form_templates_v2') THEN
    RAISE NOTICE 'form_templates_v2 no existe — omitiendo agricultura_servicios.';
    RETURN;
  END IF;

  IF EXISTS (SELECT 1 FROM public.form_templates_v2 WHERE name = 'agricultura_servicios') THEN
    RAISE NOTICE 'agricultura_servicios ya existe — omitiendo.';
    RETURN;
  END IF;

  SELECT sc.id INTO v_subcat_id
  FROM public.subcategories sc
  WHERE sc.category_id = v_cat_id AND lower(sc.name) = 'servicios'
  LIMIT 1;

  SELECT id INTO v_list_tipo FROM public.option_lists WHERE name = 'tipo-servicio-agricola';
  SELECT id INTO v_list_area FROM public.option_lists WHERE name = 'area-cobertura';
  SELECT id INTO v_list_prov FROM public.option_lists WHERE name = 'provincias-ar';

  INSERT INTO public.form_templates_v2 (
    name, display_name, category_id, subcategory_id, sections, is_active, priority
  ) VALUES (
    'agricultura_servicios',
    'Formulario Agricultura — Servicios',
    v_cat_id, v_subcat_id,
    jsonb_build_array(
      jsonb_build_object('id','sec-aser-servicio',  'name','info_servicio',       'label','Información del Servicio', 'display_order',0,'collapsible',false),
      jsonb_build_object('id','sec-aser-equipam',   'name','equipamiento',        'label','Equipamiento',             'display_order',1,'collapsible',false),
      jsonb_build_object('id','sec-aser-condic',    'name','condiciones',         'label','Condiciones',              'display_order',2,'collapsible',false),
      jsonb_build_object('id','sec-aser-ubicacion', 'name','ubicacion',           'label','Ubicación',                'display_order',3,'collapsible',false)
    ),
    true, 10
  )
  RETURNING id INTO v_tmpl_id;

  -- Información del Servicio
  INSERT INTO public.form_fields_v2 (form_template_id, field_name, field_label, section_id, field_type, field_width, is_required, display_order, option_list_id, placeholder)
  VALUES (v_tmpl_id, 'tipo_servicio', 'Tipo de servicio', 'sec-aser-servicio', 'select', 'half', true, 0, v_list_tipo, 'Seleccionar tipo...');

  INSERT INTO public.form_fields_v2 (form_template_id, field_name, field_label, section_id, field_type, field_width, is_required, display_order, placeholder, help_text)
  VALUES (v_tmpl_id, 'superficie_trabajo', 'Superficie de trabajo (ha)', 'sec-aser-servicio', 'number', 'half', false, 1, 'ej: 500', 'Hectáreas máximas por trabajo');

  INSERT INTO public.form_fields_v2 (form_template_id, field_name, field_label, section_id, field_type, field_width, is_required, display_order, placeholder, help_text)
  VALUES (v_tmpl_id, 'cultivos_que_trabaja', 'Cultivos que trabaja', 'sec-aser-servicio', 'text', 'full', false, 2, 'ej: soja, maíz, trigo', 'Cultivos con los que trabaja habitualmente');

  -- Equipamiento
  INSERT INTO public.form_fields_v2 (form_template_id, field_name, field_label, section_id, field_type, field_width, is_required, display_order)
  VALUES
    (v_tmpl_id, 'equipamiento_propio', 'Equipamiento propio',        'sec-aser-equipam', 'checkbox', 'third', false, 10),
    (v_tmpl_id, 'aplica_precision',    'Agricultura de precisión',    'sec-aser-equipam', 'checkbox', 'third', false, 11),
    (v_tmpl_id, 'usa_drones',          'Uso de drones / satelital',   'sec-aser-equipam', 'checkbox', 'third', false, 12);

  -- Condiciones
  INSERT INTO public.form_fields_v2 (form_template_id, field_name, field_label, section_id, field_type, field_width, is_required, display_order, option_list_id, placeholder)
  VALUES (v_tmpl_id, 'area_cobertura', 'Área de cobertura', 'sec-aser-condic', 'select', 'half', false, 20, v_list_area, 'Seleccionar cobertura...');

  INSERT INTO public.form_fields_v2 (form_template_id, field_name, field_label, section_id, field_type, field_width, is_required, display_order, placeholder)
  VALUES (v_tmpl_id, 'anos_experiencia', 'Años de experiencia', 'sec-aser-condic', 'number', 'half', false, 21, 'ej: 15');

  INSERT INTO public.form_fields_v2 (form_template_id, field_name, field_label, section_id, field_type, field_width, is_required, display_order)
  VALUES (v_tmpl_id, 'factura', 'Factura / Recibo oficial', 'sec-aser-condic', 'checkbox', 'third', false, 22);

  -- Ubicación
  INSERT INTO public.form_fields_v2 (form_template_id, field_name, field_label, section_id, field_type, field_width, is_required, display_order, option_list_id, placeholder)
  VALUES (v_tmpl_id, 'provincia', 'Provincia', 'sec-aser-ubicacion', 'select', 'half', false, 30, v_list_prov, 'Seleccionar provincia...');

  INSERT INTO public.form_fields_v2 (form_template_id, field_name, field_label, section_id, field_type, field_width, is_required, display_order, placeholder)
  VALUES (v_tmpl_id, 'localidad', 'Localidad', 'sec-aser-ubicacion', 'text', 'half', false, 31, 'ej: Rosario');

  RAISE NOTICE 'Formulario Agricultura Servicios creado — 11 campos en 4 secciones.';
END $$;
