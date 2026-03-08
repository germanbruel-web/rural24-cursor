-- ============================================================
-- Sprint 4C: Formulario Ganadería — seed real + option lists
-- ============================================================
-- Crea el formulario de Ganadería en form_templates_v2 con sus
-- campos definidos por el equipo de producto.
--
-- Secciones:
--   Información General: Raza, Destino Productivo, Cantidad Cabezas
--   Características: Edad, Peso, Sanitario, Origen, Condiciones pago
--
-- Depende de:
--   - Sprint 4A: option_lists + option_list_items (razas-bovinas)
--   - form_templates_v2 y form_fields_v2 (ya en DB)
--   - categories.name = 'ganaderia' (debe existir)
-- ============================================================

-- ─── Actualizar razas-bovinas con datos reales de producto ───

-- Limpiar el seed genérico anterior y reemplazar con lista real
DELETE FROM public.option_list_items
WHERE list_id = (SELECT id FROM public.option_lists WHERE name = 'razas-bovinas');

INSERT INTO public.option_list_items (list_id, value, label, sort_order, metadata)
SELECT ol.id, v.value, v.label, v.sort_order, v.meta
FROM public.option_lists ol,
  (VALUES
    -- Razas principales (comunes a todas las categorías)
    ('angus',              'Angus',                0,  '{"tipo":["toros","vacas","novillos","vaquillonas","terneros"]}'::jsonb),
    ('aberdeen-angus-neg', 'Aberdeen Angus negro',  1,  '{"tipo":["toros","vacas","novillos","vaquillonas","terneros"]}'::jsonb),
    ('aberdeen-angus-col', 'Aberdeen Angus colorado',2, '{"tipo":["toros","vacas","novillos","vaquillonas","terneros"]}'::jsonb),
    ('hereford',           'Hereford',              3,  '{"tipo":["toros","vacas","novillos","vaquillonas","terneros"]}'::jsonb),
    ('polled-hereford',    'Polled Hereford',       4,  '{"tipo":["toros","vacas","novillos","vaquillonas","terneros"]}'::jsonb),
    ('braford',            'Braford',               5,  '{"tipo":["toros","vacas","novillos","vaquillonas","terneros"]}'::jsonb),
    ('brangus-negro',      'Brangus negro',         6,  '{"tipo":["toros","vacas","novillos","vaquillonas","terneros"]}'::jsonb),
    ('brangus-colorado',   'Brangus colorado',      7,  '{"tipo":["toros","vacas","novillos","vaquillonas","terneros"]}'::jsonb),
    ('brahman',            'Brahman',               8,  '{"tipo":["toros","vacas","novillos","vaquillonas","terneros"]}'::jsonb),
    ('nelore',             'Nelore',                9,  '{"tipo":["toros","vacas","novillos","vaquillonas","terneros"]}'::jsonb),
    ('limousin',           'Limousin',              10, '{"tipo":["toros","vacas","novillos","vaquillonas","terneros"]}'::jsonb),
    ('limangus',           'Limangus',              11, '{"tipo":["toros","vacas","novillos","vaquillonas","terneros"]}'::jsonb),
    ('shorthorn',          'Shorthorn',             12, '{"tipo":["toros","vacas","novillos","vaquillonas","terneros"]}'::jsonb),
    ('charolais',          'Charolais',             13, '{"tipo":["toros","vacas","novillos","vaquillonas","terneros"]}'::jsonb),
    ('simmental',          'Simmental',             14, '{"tipo":["toros","vacas","novillos","vaquillonas","terneros"]}'::jsonb),
    ('santa-gertrudis',    'Santa Gertrudis',       15, '{"tipo":["toros","vacas","novillos","vaquillonas","terneros"]}'::jsonb),
    ('senepol',            'Senepol',               16, '{"tipo":["toros","vacas","novillos","vaquillonas","terneros"]}'::jsonb),
    ('beefmaster',         'Beefmaster',            17, '{"tipo":["toros","vacas","novillos","vaquillonas","terneros"]}'::jsonb),
    ('wagyu',              'Wagyu',                 18, '{"tipo":["toros","vacas","novillos"]}'::jsonb),
    ('criollo-argentino',  'Criollo Argentino',     19, '{"tipo":["toros","vacas","novillos","vaquillonas","terneros"]}'::jsonb),
    -- Exclusivas de Toros
    ('fleckvieh',          'Fleckvieh',             20, '{"tipo":["toros"]}'::jsonb),
    -- Exclusivas de Vacas (lecheras/doble propósito)
    ('holando-argentino',  'Holando Argentino',     21, '{"tipo":["vacas"]}'::jsonb),
    ('jersey',             'Jersey',                22, '{"tipo":["vacas"]}'::jsonb),
    ('pardo-suizo',        'Pardo Suizo',           23, '{"tipo":["vacas"]}'::jsonb),
    -- Otra
    ('otra',               'Otra',                  99, '{"tipo":["toros","vacas","novillos","vaquillonas","terneros"]}'::jsonb)
  ) AS v(value, label, sort_order, meta)
WHERE ol.name = 'razas-bovinas'
ON CONFLICT (list_id, value) DO NOTHING;

-- ─── Nuevas option_lists para este formulario ─────────────────

INSERT INTO public.option_lists (name, display_name, scope, description)
VALUES
  ('destino-productivo', 'Destino Productivo (Hacienda)', 'category',
   'Uso productivo del animal: cría, engorde, tambo, etc.'),
  ('origen-animal',      'Origen del Animal',             'global',
   'Procedencia del animal: criadero, remate, establecimiento propio, etc.')
ON CONFLICT (name) DO NOTHING;

-- Asociar a categoría ganadería (si existe)
UPDATE public.option_lists ol
SET category_id = (SELECT id FROM public.categories WHERE name = 'ganaderia' LIMIT 1)
WHERE ol.name = 'destino-productivo'
  AND (SELECT id FROM public.categories WHERE name = 'ganaderia' LIMIT 1) IS NOT NULL;

-- ─── Ítems: Destino Productivo ────────────────────────────────

INSERT INTO public.option_list_items (list_id, value, label, sort_order)
SELECT ol.id, v.value, v.label, v.sort_order
FROM public.option_lists ol,
  (VALUES
    ('cria',             'Cría',                        0),
    ('engorde',          'Engorde',                     1),
    ('tambo',            'Tambo / Lechero',             2),
    ('doble-proposito',  'Doble Propósito',             3),
    ('reproduccion',     'Reproducción / Genética',     4),
    ('invernada',        'Invernada',                   5),
    ('otro',             'Otro',                        99)
  ) AS v(value, label, sort_order)
WHERE ol.name = 'destino-productivo'
ON CONFLICT (list_id, value) DO NOTHING;

-- ─── Ítems: Origen del Animal ─────────────────────────────────

INSERT INTO public.option_list_items (list_id, value, label, sort_order)
SELECT ol.id, v.value, v.label, v.sort_order
FROM public.option_lists ol,
  (VALUES
    ('criadero',         'Criadero',                    0),
    ('establecimiento',  'Establecimiento propio',      1),
    ('remate',           'Remate / Feria',              2),
    ('importado',        'Importado',                   3),
    ('otro',             'Otro',                        99)
  ) AS v(value, label, sort_order)
WHERE ol.name = 'origen-animal'
ON CONFLICT (list_id, value) DO NOTHING;

-- ─── Form Template: Ganadería ─────────────────────────────────

DO $$
DECLARE
  v_cat_id       uuid;
  v_tmpl_id      uuid;
  v_sec_info_id  text := 'sec-ganaderia-info-general';
  v_sec_caract_id text := 'sec-ganaderia-caracteristicas';
  v_list_raza    uuid;
  v_list_destino uuid;
  v_list_origen  uuid;
  v_field_id     uuid;
BEGIN
  -- Verificar que existe la categoría
  SELECT id INTO v_cat_id FROM public.categories WHERE name = 'ganaderia' LIMIT 1;
  IF v_cat_id IS NULL THEN
    RAISE NOTICE 'Categoría "ganaderia" no encontrada — omitiendo seed de formulario.';
    RETURN;
  END IF;

  -- Verificar que la tabla existe (guard)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'form_templates_v2'
  ) THEN
    RAISE NOTICE 'form_templates_v2 no existe — omitiendo seed.';
    RETURN;
  END IF;

  -- Evitar duplicado
  IF EXISTS (
    SELECT 1 FROM public.form_templates_v2 WHERE name = 'ganaderia_bovinos'
  ) THEN
    RAISE NOTICE 'Formulario ganaderia_bovinos ya existe — omitiendo seed.';
    RETURN;
  END IF;

  -- IDs de listas de opciones
  SELECT id INTO v_list_raza    FROM public.option_lists WHERE name = 'razas-bovinas';
  SELECT id INTO v_list_destino FROM public.option_lists WHERE name = 'destino-productivo';
  SELECT id INTO v_list_origen  FROM public.option_lists WHERE name = 'origen-animal';

  -- Crear template
  INSERT INTO public.form_templates_v2 (
    name, display_name, category_id,
    sections, is_active, priority
  ) VALUES (
    'ganaderia_bovinos',
    'Formulario Ganadería — Bovinos',
    v_cat_id,
    jsonb_build_array(
      jsonb_build_object(
        'id',            v_sec_info_id,
        'name',          'informacion_general',
        'label',         'Información General',
        'display_order', 0,
        'collapsible',   false
      ),
      jsonb_build_object(
        'id',            v_sec_caract_id,
        'name',          'caracteristicas',
        'label',         'Características',
        'display_order', 1,
        'collapsible',   false
      )
    ),
    true,
    10
  )
  RETURNING id INTO v_tmpl_id;

  RAISE NOTICE 'Template creado: %', v_tmpl_id;

  -- ─── Sección: Información General ─────────────────────────

  -- Raza (select → razas-bovinas)
  INSERT INTO public.form_fields_v2 (
    form_template_id, field_name, field_label, section_id,
    field_type, field_width, is_required, display_order,
    option_list_id, placeholder
  ) VALUES (
    v_tmpl_id, 'raza', 'Raza', v_sec_info_id,
    'select', 'half', false, 0,
    v_list_raza, 'Seleccionar raza...'
  );

  -- Destino Productivo (select → destino-productivo)
  INSERT INTO public.form_fields_v2 (
    form_template_id, field_name, field_label, section_id,
    field_type, field_width, is_required, display_order,
    option_list_id, placeholder
  ) VALUES (
    v_tmpl_id, 'destino_productivo', 'Destino Productivo', v_sec_info_id,
    'select', 'half', false, 1,
    v_list_destino, 'Seleccionar destino...'
  );

  -- Cantidad de Cabezas
  INSERT INTO public.form_fields_v2 (
    form_template_id, field_name, field_label, section_id,
    field_type, field_width, is_required, display_order,
    placeholder, help_text
  ) VALUES (
    v_tmpl_id, 'cantidad_cabezas', 'Cantidad de Cabezas', v_sec_info_id,
    'number', 'half', true, 2,
    'ej: 50', 'Total de animales del lote'
  );

  -- ─── Sección: Características ──────────────────────────────

  -- Edad promedio
  INSERT INTO public.form_fields_v2 (
    form_template_id, field_name, field_label, section_id,
    field_type, field_width, is_required, display_order,
    placeholder, help_text
  ) VALUES (
    v_tmpl_id, 'edad_promedio', 'Edad promedio (meses)', v_sec_caract_id,
    'number', 'half', false, 10,
    'ej: 18', 'Edad promedio del lote en meses'
  );

  -- Peso aproximado
  INSERT INTO public.form_fields_v2 (
    form_template_id, field_name, field_label, section_id,
    field_type, field_width, is_required, display_order,
    placeholder, help_text
  ) VALUES (
    v_tmpl_id, 'peso_aproximado', 'Peso aprox. por cabeza (kg)', v_sec_caract_id,
    'number', 'half', false, 11,
    'ej: 350', 'Peso promedio individual en kg'
  );

  -- Estado Sanitario al día
  INSERT INTO public.form_fields_v2 (
    form_template_id, field_name, field_label, section_id,
    field_type, field_width, is_required, display_order,
    help_text
  ) VALUES (
    v_tmpl_id, 'estado_sanitario', 'Estado Sanitario al día', v_sec_caract_id,
    'checkbox', 'half', false, 12,
    'Vacunas y sanidad al día'
  );

  -- Origen del animal
  INSERT INTO public.form_fields_v2 (
    form_template_id, field_name, field_label, section_id,
    field_type, field_width, is_required, display_order,
    option_list_id, placeholder
  ) VALUES (
    v_tmpl_id, 'origen_animal', 'Origen del Animal', v_sec_caract_id,
    'select', 'half', false, 13,
    v_list_origen, 'Seleccionar origen...'
  );

  -- Cuotas en pesos
  INSERT INTO public.form_fields_v2 (
    form_template_id, field_name, field_label, section_id,
    field_type, field_width, is_required, display_order
  ) VALUES (
    v_tmpl_id, 'cuotas_pesos', 'Cuotas en pesos', v_sec_caract_id,
    'checkbox', 'third', false, 20
  );

  -- Cuotas en dólares
  INSERT INTO public.form_fields_v2 (
    form_template_id, field_name, field_label, section_id,
    field_type, field_width, is_required, display_order
  ) VALUES (
    v_tmpl_id, 'cuotas_dolares', 'Cuotas en dólares', v_sec_caract_id,
    'checkbox', 'third', false, 21
  );

  -- Permuta / Canje
  INSERT INTO public.form_fields_v2 (
    form_template_id, field_name, field_label, section_id,
    field_type, field_width, is_required, display_order
  ) VALUES (
    v_tmpl_id, 'permuta', 'Permuta / Canje', v_sec_caract_id,
    'checkbox', 'third', false, 22
  );

  -- Con garantía / aval
  INSERT INTO public.form_fields_v2 (
    form_template_id, field_name, field_label, section_id,
    field_type, field_width, is_required, display_order
  ) VALUES (
    v_tmpl_id, 'garantia_aval', 'Con garantía / aval', v_sec_caract_id,
    'checkbox', 'third', false, 23
  );

  -- Crédito bancario / cooperativa
  INSERT INTO public.form_fields_v2 (
    form_template_id, field_name, field_label, section_id,
    field_type, field_width, is_required, display_order
  ) VALUES (
    v_tmpl_id, 'credito_bancario', 'Crédito bancario / cooperativa', v_sec_caract_id,
    'checkbox', 'third', false, 24
  );

  RAISE NOTICE 'Formulario Ganadería creado con éxito — % campos', 11;
END $$;
