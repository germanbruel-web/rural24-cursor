-- ============================================================
-- Sprint 3G: Seed de taxonomía completa
-- GANADERIA | AGRICULTURA | MAQUINARIAS
-- → Subcategorías → category_types con page_type
--
-- IMPORTANTE: Requiere que las 3 categorías padre existan.
-- Si no existen, las crea. Los slugs/names se generan desde display_name.
-- ============================================================

DO $$
DECLARE
  cat_ganaderia   uuid;
  cat_agricultura uuid;
  cat_maquinarias uuid;

  sub_id uuid;

  -- Subcategorías Ganadería
  gan_hacienda   uuid;
  gan_servicios  uuid;
  gan_insumos    uuid;
  gan_empresas   uuid;

  -- Subcategorías Agricultura
  agr_servicios  uuid;
  agr_insumos    uuid;
  agr_empresas   uuid;

  -- Subcategorías Maquinarias
  maq_servicios  uuid;
  maq_maquinarias uuid;
  maq_empresas   uuid;

BEGIN

  -- ─── CATEGORÍAS PADRE ─────────────────────────────────────────
  -- Ganadería
  INSERT INTO public.categories (name, display_name, slug, sort_order, is_active)
    VALUES ('ganaderia', 'Ganadería', 'ganaderia', 1, true)
    ON CONFLICT (name) DO UPDATE SET display_name = EXCLUDED.display_name
    RETURNING id INTO cat_ganaderia;
  IF cat_ganaderia IS NULL THEN
    SELECT id INTO cat_ganaderia FROM public.categories WHERE name = 'ganaderia';
  END IF;

  -- Agricultura
  INSERT INTO public.categories (name, display_name, slug, sort_order, is_active)
    VALUES ('agricultura', 'Agricultura', 'agricultura', 2, true)
    ON CONFLICT (name) DO UPDATE SET display_name = EXCLUDED.display_name
    RETURNING id INTO cat_agricultura;
  IF cat_agricultura IS NULL THEN
    SELECT id INTO cat_agricultura FROM public.categories WHERE name = 'agricultura';
  END IF;

  -- Maquinarias
  INSERT INTO public.categories (name, display_name, slug, sort_order, is_active)
    VALUES ('maquinarias', 'Maquinarias', 'maquinarias', 3, true)
    ON CONFLICT (name) DO UPDATE SET display_name = EXCLUDED.display_name
    RETURNING id INTO cat_maquinarias;
  IF cat_maquinarias IS NULL THEN
    SELECT id INTO cat_maquinarias FROM public.categories WHERE name = 'maquinarias';
  END IF;

  -- ─── GANADERÍA — SUBCATEGORÍAS ────────────────────────────────

  INSERT INTO public.subcategories (category_id, name, display_name, slug, sort_order, is_active)
    VALUES (cat_ganaderia, 'hacienda', 'Hacienda', 'hacienda', 1, true)
    ON CONFLICT DO NOTHING RETURNING id INTO gan_hacienda;
  IF gan_hacienda IS NULL THEN
    SELECT id INTO gan_hacienda FROM public.subcategories WHERE category_id = cat_ganaderia AND name = 'hacienda';
  END IF;

  INSERT INTO public.subcategories (category_id, name, display_name, slug, sort_order, is_active)
    VALUES (cat_ganaderia, 'servicios', 'Servicios', 'servicios', 2, true)
    ON CONFLICT DO NOTHING RETURNING id INTO gan_servicios;
  IF gan_servicios IS NULL THEN
    SELECT id INTO gan_servicios FROM public.subcategories WHERE category_id = cat_ganaderia AND name = 'servicios';
  END IF;

  INSERT INTO public.subcategories (category_id, name, display_name, slug, sort_order, is_active)
    VALUES (cat_ganaderia, 'insumos', 'Insumos', 'insumos', 3, true)
    ON CONFLICT DO NOTHING RETURNING id INTO gan_insumos;
  IF gan_insumos IS NULL THEN
    SELECT id INTO gan_insumos FROM public.subcategories WHERE category_id = cat_ganaderia AND name = 'insumos';
  END IF;

  INSERT INTO public.subcategories (category_id, name, display_name, slug, sort_order, is_active)
    VALUES (cat_ganaderia, 'empresas', 'Empresas', 'empresas', 4, true)
    ON CONFLICT DO NOTHING RETURNING id INTO gan_empresas;
  IF gan_empresas IS NULL THEN
    SELECT id INTO gan_empresas FROM public.subcategories WHERE category_id = cat_ganaderia AND name = 'empresas';
  END IF;

  -- ─── GANADERÍA — CATEGORY_TYPES ──────────────────────────────

  -- Hacienda (Pagina Detalle)
  INSERT INTO public.category_types (category_id, subcategory_id, name, display_name, slug, sort_order, is_active, page_type) VALUES
    (cat_ganaderia, gan_hacienda, 'toros',       'Toros',       'toros',       1, true, 'particular'),
    (cat_ganaderia, gan_hacienda, 'vacas',        'Vacas',        'vacas',       2, true, 'particular'),
    (cat_ganaderia, gan_hacienda, 'novillos',     'Novillos',     'novillos',    3, true, 'particular'),
    (cat_ganaderia, gan_hacienda, 'vaquillonas',  'Vaquillonas',  'vaquillonas', 4, true, 'particular'),
    (cat_ganaderia, gan_hacienda, 'terneros',     'Terneros',     'terneros',    5, true, 'particular')
  ON CONFLICT DO NOTHING;

  -- Servicios Ganadería (Pagina Empresa)
  INSERT INTO public.category_types (category_id, subcategory_id, name, display_name, slug, sort_order, is_active, page_type) VALUES
    (cat_ganaderia, gan_servicios, 'veterinarias',             'Veterinarias',             'veterinarias',             1, true, 'empresa'),
    (cat_ganaderia, gan_servicios, 'consignatarias-hacienda',  'Consignatarias de hacienda','consignatarias-hacienda',  2, true, 'empresa'),
    (cat_ganaderia, gan_servicios, 'transporte-hacienda',      'Transporte de hacienda',    'transporte-hacienda',      3, true, 'empresa'),
    (cat_ganaderia, gan_servicios, 'inseminacion-artificial',  'Inseminación artificial',   'inseminacion-artificial',  4, true, 'empresa'),
    (cat_ganaderia, gan_servicios, 'servicios-reproductivos',  'Servicios reproductivos',   'servicios-reproductivos',  5, true, 'empresa')
  ON CONFLICT DO NOTHING;

  -- Insumos Ganadería (Pagina Detalle)
  INSERT INTO public.category_types (category_id, subcategory_id, name, display_name, slug, sort_order, is_active, page_type) VALUES
    (cat_ganaderia, gan_insumos, 'alambres',        'Alambres',        'alambres',        1, true, 'particular'),
    (cat_ganaderia, gan_insumos, 'bebederos',        'Bebederos',        'bebederos',       2, true, 'particular'),
    (cat_ganaderia, gan_insumos, 'corrales',         'Corrales',         'corrales',        3, true, 'particular'),
    (cat_ganaderia, gan_insumos, 'cargadores',       'Cargadores',       'cargadores',      4, true, 'particular'),
    (cat_ganaderia, gan_insumos, 'comederos',        'Comederos',        'comederos',       5, true, 'particular'),
    (cat_ganaderia, gan_insumos, 'nutricion-animal', 'Nutrición animal', 'nutricion-animal',6, true, 'particular')
  ON CONFLICT DO NOTHING;

  -- Empresas Ganadería (Pagina Empresa)
  INSERT INTO public.category_types (category_id, subcategory_id, name, display_name, slug, sort_order, is_active, page_type) VALUES
    (cat_ganaderia, gan_empresas, 'consignatarias-hacienda-emp',       'Consignatarias de hacienda',          'consignatarias-hacienda-gan',         1, true, 'empresa'),
    (cat_ganaderia, gan_empresas, 'veterinarias-emp',                   'Veterinarias',                        'veterinarias-gan',                    2, true, 'empresa'),
    (cat_ganaderia, gan_empresas, 'laboratorios-veterinarios',          'Laboratorios veterinarios',           'laboratorios-veterinarios',           3, true, 'empresa'),
    (cat_ganaderia, gan_empresas, 'cabanas-ganaderas',                  'Cabañas ganaderas',                   'cabanas-ganaderas',                   4, true, 'empresa'),
    (cat_ganaderia, gan_empresas, 'proveedores-genetica',               'Proveedores de genética',             'proveedores-genetica',                5, true, 'empresa'),
    (cat_ganaderia, gan_empresas, 'fabricantes-instalaciones-ganaderas','Fabricantes de instalaciones ganaderas','fabricantes-instalaciones-ganaderas',6, true, 'empresa'),
    (cat_ganaderia, gan_empresas, 'aseguradoras-rurales-gan',           'Aseguradoras rurales',                'aseguradoras-rurales-gan',            7, true, 'empresa')
  ON CONFLICT DO NOTHING;

  -- ─── AGRICULTURA — SUBCATEGORÍAS ─────────────────────────────

  INSERT INTO public.subcategories (category_id, name, display_name, slug, sort_order, is_active)
    VALUES (cat_agricultura, 'servicios', 'Servicios', 'servicios', 1, true)
    ON CONFLICT DO NOTHING RETURNING id INTO agr_servicios;
  IF agr_servicios IS NULL THEN
    SELECT id INTO agr_servicios FROM public.subcategories WHERE category_id = cat_agricultura AND name = 'servicios';
  END IF;

  INSERT INTO public.subcategories (category_id, name, display_name, slug, sort_order, is_active)
    VALUES (cat_agricultura, 'insumos', 'Insumos', 'insumos', 2, true)
    ON CONFLICT DO NOTHING RETURNING id INTO agr_insumos;
  IF agr_insumos IS NULL THEN
    SELECT id INTO agr_insumos FROM public.subcategories WHERE category_id = cat_agricultura AND name = 'insumos';
  END IF;

  INSERT INTO public.subcategories (category_id, name, display_name, slug, sort_order, is_active)
    VALUES (cat_agricultura, 'empresas', 'Empresas', 'empresas', 3, true)
    ON CONFLICT DO NOTHING RETURNING id INTO agr_empresas;
  IF agr_empresas IS NULL THEN
    SELECT id INTO agr_empresas FROM public.subcategories WHERE category_id = cat_agricultura AND name = 'empresas';
  END IF;

  -- ─── AGRICULTURA — CATEGORY_TYPES ────────────────────────────

  -- Servicios Agricultura (Pagina Empresa)
  INSERT INTO public.category_types (category_id, subcategory_id, name, display_name, slug, sort_order, is_active, page_type) VALUES
    (cat_agricultura, agr_servicios, 'siembra',                'Siembra',                'siembra',                1, true, 'empresa'),
    (cat_agricultura, agr_servicios, 'pulverizacion',           'Pulverización',           'pulverizacion',          2, true, 'empresa'),
    (cat_agricultura, agr_servicios, 'cosecha',                 'Cosecha',                 'cosecha',                3, true, 'empresa'),
    (cat_agricultura, agr_servicios, 'agricultura-precision',   'Agricultura de precisión', 'agricultura-precision',  4, true, 'empresa'),
    (cat_agricultura, agr_servicios, 'asesoramiento-agronomico','Asesoramiento agronómico', 'asesoramiento-agronomico',5, true, 'empresa'),
    (cat_agricultura, agr_servicios, 'fumigacion',              'Fumigación',              'fumigacion',             6, true, 'empresa')
  ON CONFLICT DO NOTHING;

  -- Insumos Agricultura (Pagina Detalle)
  INSERT INTO public.category_types (category_id, subcategory_id, name, display_name, slug, sort_order, is_active, page_type) VALUES
    (cat_agricultura, agr_insumos, 'semillas',      'Semillas',      'semillas',      1, true, 'particular'),
    (cat_agricultura, agr_insumos, 'fertilizantes', 'Fertilizantes', 'fertilizantes', 2, true, 'particular'),
    (cat_agricultura, agr_insumos, 'agroquimicos',  'Agroquímicos',  'agroquimicos',  3, true, 'particular'),
    (cat_agricultura, agr_insumos, 'biologicos',    'Biológicos',    'biologicos',    4, true, 'particular'),
    (cat_agricultura, agr_insumos, 'inoculantes',   'Inoculantes',   'inoculantes',   5, true, 'particular'),
    (cat_agricultura, agr_insumos, 'curasemillas',  'Curasemillas',  'curasemillas',  6, true, 'particular'),
    (cat_agricultura, agr_insumos, 'coadyuvantes',  'Coadyuvantes',  'coadyuvantes',  7, true, 'particular')
  ON CONFLICT DO NOTHING;

  -- Empresas Agricultura (Pagina Empresa)
  INSERT INTO public.category_types (category_id, subcategory_id, name, display_name, slug, sort_order, is_active, page_type) VALUES
    (cat_agricultura, agr_empresas, 'acopios',                  'Acopios',                  'acopios',                  1, true, 'empresa'),
    (cat_agricultura, agr_empresas, 'corredores-granos',        'Corredores de granos',      'corredores-granos',        2, true, 'empresa'),
    (cat_agricultura, agr_empresas, 'cooperativas',             'Cooperativas',              'cooperativas',             3, true, 'empresa'),
    (cat_agricultura, agr_empresas, 'semilleros',               'Semilleros',                'semilleros',               4, true, 'empresa'),
    (cat_agricultura, agr_empresas, 'distribuidores-insumos',   'Distribuidores de insumos', 'distribuidores-insumos',   5, true, 'empresa'),
    (cat_agricultura, agr_empresas, 'ingenieros-agronomos',     'Ingenieros agrónomos',      'ingenieros-agronomos',     6, true, 'empresa'),
    (cat_agricultura, agr_empresas, 'laboratorios-agronomicos', 'Laboratorios agronómicos',  'laboratorios-agronomicos', 7, true, 'empresa'),
    (cat_agricultura, agr_empresas, 'aseguradoras-rurales-agr', 'Aseguradoras rurales',      'aseguradoras-rurales-agr', 8, true, 'empresa')
  ON CONFLICT DO NOTHING;

  -- ─── MAQUINARIAS — SUBCATEGORÍAS ─────────────────────────────

  INSERT INTO public.subcategories (category_id, name, display_name, slug, sort_order, is_active)
    VALUES (cat_maquinarias, 'servicios', 'Servicios', 'servicios', 1, true)
    ON CONFLICT DO NOTHING RETURNING id INTO maq_servicios;
  IF maq_servicios IS NULL THEN
    SELECT id INTO maq_servicios FROM public.subcategories WHERE category_id = cat_maquinarias AND name = 'servicios';
  END IF;

  INSERT INTO public.subcategories (category_id, name, display_name, slug, sort_order, is_active, has_brands, has_models)
    VALUES (cat_maquinarias, 'maquinarias', 'Maquinarias', 'maquinarias', 2, true, true, true)
    ON CONFLICT DO NOTHING RETURNING id INTO maq_maquinarias;
  IF maq_maquinarias IS NULL THEN
    SELECT id INTO maq_maquinarias FROM public.subcategories WHERE category_id = cat_maquinarias AND name = 'maquinarias';
  END IF;

  INSERT INTO public.subcategories (category_id, name, display_name, slug, sort_order, is_active)
    VALUES (cat_maquinarias, 'empresas', 'Empresas', 'empresas', 3, true)
    ON CONFLICT DO NOTHING RETURNING id INTO maq_empresas;
  IF maq_empresas IS NULL THEN
    SELECT id INTO maq_empresas FROM public.subcategories WHERE category_id = cat_maquinarias AND name = 'empresas';
  END IF;

  -- ─── MAQUINARIAS — CATEGORY_TYPES ────────────────────────────

  -- Servicios Maquinarias (Pagina Empresa)
  INSERT INTO public.category_types (category_id, subcategory_id, name, display_name, slug, sort_order, is_active, page_type) VALUES
    (cat_maquinarias, maq_servicios, 'reparacion-maquinaria',  'Reparación de maquinaria', 'reparacion-maquinaria',  1, true, 'empresa'),
    (cat_maquinarias, maq_servicios, 'mantenimiento',          'Mantenimiento',             'mantenimiento',          2, true, 'empresa'),
    (cat_maquinarias, maq_servicios, 'alquiler-maquinarias',   'Alquiler de maquinarias',   'alquiler-maquinarias',   3, true, 'empresa'),
    (cat_maquinarias, maq_servicios, 'contratista-maquinaria', 'Contratista de maquinaria', 'contratista-maquinaria', 4, true, 'empresa')
  ON CONFLICT DO NOTHING;

  -- Maquinarias (Pagina Detalle)
  INSERT INTO public.category_types (category_id, subcategory_id, name, display_name, slug, sort_order, is_active, page_type) VALUES
    (cat_maquinarias, maq_maquinarias, 'tractores',           'Tractores',           'tractores',           1,  true, 'particular'),
    (cat_maquinarias, maq_maquinarias, 'cosechadoras',        'Cosechadoras',        'cosechadoras',        2,  true, 'particular'),
    (cat_maquinarias, maq_maquinarias, 'camiones',            'Camiones',            'camiones',            3,  true, 'particular'),
    (cat_maquinarias, maq_maquinarias, 'camionetas',          'Camionetas',          'camionetas',          4,  true, 'particular'),
    (cat_maquinarias, maq_maquinarias, 'sembradoras',         'Sembradoras',         'sembradoras',         5,  true, 'particular'),
    (cat_maquinarias, maq_maquinarias, 'pulverizadoras',      'Pulverizadoras',      'pulverizadoras',      6,  true, 'particular'),
    (cat_maquinarias, maq_maquinarias, 'acoplados',           'Acoplados',           'acoplados',           7,  true, 'particular'),
    (cat_maquinarias, maq_maquinarias, 'tolvas',              'Tolvas',              'tolvas',              8,  true, 'particular'),
    (cat_maquinarias, maq_maquinarias, 'fertilizadoras',      'Fertilizadoras',      'fertilizadoras',      9,  true, 'particular'),
    (cat_maquinarias, maq_maquinarias, 'rastras',             'Rastras',             'rastras',             10, true, 'particular'),
    (cat_maquinarias, maq_maquinarias, 'discos',              'Discos',              'discos',              11, true, 'particular'),
    (cat_maquinarias, maq_maquinarias, 'cultivadores',        'Cultivadores',        'cultivadores',        12, true, 'particular'),
    (cat_maquinarias, maq_maquinarias, 'rodillos',            'Rodillos',            'rodillos',            13, true, 'particular'),
    (cat_maquinarias, maq_maquinarias, 'palas',               'Palas',               'palas',               14, true, 'particular'),
    (cat_maquinarias, maq_maquinarias, 'mixers',              'Mixers',              'mixers',              15, true, 'particular'),
    (cat_maquinarias, maq_maquinarias, 'embolsadoras',        'Embolsadoras',        'embolsadoras',        16, true, 'particular'),
    (cat_maquinarias, maq_maquinarias, 'moledoras',           'Moledoras',           'moledoras',           17, true, 'particular'),
    (cat_maquinarias, maq_maquinarias, 'extractoras-silo',    'Extractoras de silo', 'extractoras-silo',    18, true, 'particular'),
    (cat_maquinarias, maq_maquinarias, 'levanta-fardos',      'Levanta fardos',      'levanta-fardos',      19, true, 'particular'),
    (cat_maquinarias, maq_maquinarias, 'picadora-rollos',     'Picadora de rollos',  'picadora-rollos',     20, true, 'particular'),
    (cat_maquinarias, maq_maquinarias, 'estercolera',         'Estercolera',         'estercolera',         21, true, 'particular'),
    (cat_maquinarias, maq_maquinarias, 'balanzas-ganaderas',  'Balanzas ganaderas',  'balanzas-ganaderas',  22, true, 'particular')
  ON CONFLICT DO NOTHING;

  -- Empresas Maquinarias (Pagina Empresa)
  INSERT INTO public.category_types (category_id, subcategory_id, name, display_name, slug, sort_order, is_active, page_type) VALUES
    (cat_maquinarias, maq_empresas, 'concesionarios',       'Concesionarios',       'concesionarios',       1, true, 'empresa'),
    (cat_maquinarias, maq_empresas, 'fabricantes',          'Fabricantes',          'fabricantes',          2, true, 'empresa'),
    (cat_maquinarias, maq_empresas, 'importadores',         'Importadores',         'importadores',         3, true, 'empresa'),
    (cat_maquinarias, maq_empresas, 'talleres-especializados','Talleres especializados','talleres-especializados',4,true,'empresa'),
    (cat_maquinarias, maq_empresas, 'repuestos-agricolas',  'Repuestos agrícolas',  'repuestos-agricolas',  5, true, 'empresa'),
    (cat_maquinarias, maq_empresas, 'financiacion-leasing', 'Financiación / leasing','financiacion-leasing', 6, true, 'empresa'),
    (cat_maquinarias, maq_empresas, 'aseguradoras-maq',     'Aseguradoras',         'aseguradoras-maq',     7, true, 'empresa')
  ON CONFLICT DO NOTHING;

END $$;
