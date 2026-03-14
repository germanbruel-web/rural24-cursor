-- Migration: 20260314000004_category_taxonomy_seed_v2.sql
-- Sprint 8A — Taxonomía completa v2 (8 categorías + subcategorías nivel 2)
-- Fuente de verdad: proporcionada por usuario 2026-03-14
-- Idempotente: usa WHERE NOT EXISTS / ON CONFLICT — no rompe datos existentes
-- Nivel 3 (sub-subcategorías) se agrega en migration posterior cuando se provea.

DO $$
DECLARE
  cat_maquinaria    uuid;
  cat_repuestos     uuid;
  cat_hacienda      uuid;
  cat_insumos       uuid;
  cat_equipamiento  uuid;
  cat_inmobiliaria  uuid;
  cat_servicios     uuid;
  cat_empleos       uuid;
BEGIN

  -- ============================================================
  -- 1. UPSERT CATEGORÍAS (8 categorías canónicas)
  -- ============================================================

  INSERT INTO public.categories (name, display_name, slug, icon, sort_order, is_active)
  VALUES
    ('Maquinaria Agrícola',  'Maquinaria Agrícola',  'maquinaria-agricola',  'tractor',         1, true),
    ('Repuestos',            'Repuestos',             'repuestos',            'settings',        2, true),
    ('Inmobiliaria Rural',   'Inmobiliaria Rural',    'inmobiliaria-rural',   'map-pin',         3, true),
    ('Equipamiento',         'Equipamiento',          'equipamiento',         'warehouse',       4, true),
    ('Insumos',              'Insumos',               'insumos',              'seedling',        5, true),
    ('Hacienda',             'Hacienda',              'hacienda',             'cow',             6, true),
    ('AgroEmpleos',          'AgroEmpleos',           'empleos',              'briefcase',       7, true),
    ('Servicios',            'Servicios',             'servicios',            'handshake',       8, true)
  ON CONFLICT (slug) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    sort_order   = EXCLUDED.sort_order,
    is_active    = EXCLUDED.is_active;

  -- Obtener IDs por slug
  SELECT id INTO cat_maquinaria    FROM public.categories WHERE slug = 'maquinaria-agricola';
  SELECT id INTO cat_repuestos     FROM public.categories WHERE slug = 'repuestos';
  SELECT id INTO cat_hacienda      FROM public.categories WHERE slug = 'hacienda';
  SELECT id INTO cat_insumos       FROM public.categories WHERE slug = 'insumos';
  SELECT id INTO cat_equipamiento  FROM public.categories WHERE slug = 'equipamiento';
  SELECT id INTO cat_inmobiliaria  FROM public.categories WHERE slug = 'inmobiliaria-rural';
  SELECT id INTO cat_servicios     FROM public.categories WHERE slug = 'servicios';
  SELECT id INTO cat_empleos       FROM public.categories WHERE slug = 'empleos';

  -- ============================================================
  -- 2. SUBCATEGORÍAS — MAQUINARIA AGRÍCOLA
  -- has_brands=true, has_models=true, has_year=true, has_condition=true
  -- ============================================================

  INSERT INTO public.subcategories
    (name, display_name, slug, category_id, sort_order, is_active, has_brands, has_models, has_year, has_condition)
  SELECT v.nm, v.nm, v.sl, cat_maquinaria, v.so, true, true, true, true, true
  FROM (VALUES
    ('Acondicionador de suelos',        'acondicionador-de-suelos',         1),
    ('Acoplados',                       'acoplados',                        2),
    ('Arados',                          'arados',                           3),
    ('Arrancadoras',                    'arrancadoras',                     4),
    ('Aspiradoras de granos',           'aspiradoras-de-granos',            5),
    ('Autoelevadores',                  'autoelevadores',                   6),
    ('Cabezales',                       'cabezales',                        7),
    ('Camiones',                        'camiones',                         8),
    ('Camionetas',                      'camionetas',                       9),
    ('Carpidores',                      'carpidores',                      10),
    ('Carros compactadores',            'carros-compactadores',            11),
    ('Chipeadoras',                     'chipeadoras',                     12),
    ('Cinceles',                        'cinceles',                        13),
    ('Clasificadoras de semillas',      'clasificadoras-de-semillas',      14),
    ('Cortahileradoras',                'cortahileradoras',                15),
    ('Cosechadoras',                    'cosechadoras',                    16),
    ('Cultivadores',                    'cultivadores',                    17),
    ('Curadores de semillas',           'curadores-de-semillas',           18),
    ('Desbrotadoras',                   'desbrotadoras',                   19),
    ('Desmalezadoras',                  'desmalezadoras',                  20),
    ('Destacuruzador',                  'destacuruzador',                  21),
    ('Embaladora de rollos',            'embaladora-de-rollos',            22),
    ('Embarcaciones',                   'embarcaciones',                   23),
    ('Embolsadoras / Embutidoras',      'embolsadoras-embutidoras',        24),
    ('Enfardadoras',                    'enfardadoras',                    25),
    ('Enrolladoras',                    'enrolladoras',                    26),
    ('Ensiladoras',                     'ensiladoras',                     27),
    ('Escardillos',                     'escardillos',                     28),
    ('Estercoleras',                    'estercoleras',                    29),
    ('Extractoras de forrajes',         'extractoras-de-forrajes',         30),
    ('Extractores de grano',            'extractores-de-grano',            31),
    ('Fertilizadoras',                  'fertilizadoras',                  32),
    ('Grúas',                           'gruas',                           33),
    ('Hileradora',                      'hileradora',                      34),
    ('Inoculadores',                    'inoculadores',                    35),
    ('Levanta fardos y rollos',         'levanta-fardos-y-rollos',         36),
    ('Limpiadoras de granos y semillas','limpiadoras-de-granos-semillas',  37),
    ('Maquinaria forestal',             'maquinaria-forestal',             38),
    ('Maquinaria frutihortícola',       'maquinaria-frutihorticola',       39),
    ('Maquinaria vial',                 'maquinaria-vial',                 40),
    ('Mezcladoras de granos',           'mezcladoras-de-granos',           41),
    ('Minitractores',                   'minitractores',                   42),
    ('Mixers',                          'mixers',                          43),
    ('Moledoras / Quebradoras',         'moledoras-quebradoras',           44),
    ('Niveladoras',                     'niveladoras',                     45),
    ('Palas',                           'palas',                           46),
    ('Paratil',                         'paratil',                         47),
    ('Picadora de rollos',              'picadora-de-rollos',              48),
    ('Picadoras de forraje',            'picadoras-de-forraje',            49),
    ('Podadoras',                       'podadoras',                       50),
    ('Pulverizadoras',                  'pulverizadoras',                  51),
    ('Rastras',                         'rastras',                         52),
    ('Rastrillos',                      'rastrillos',                      53),
    ('Rastrón desterronador',           'rastron-desterronador',           54),
    ('Rolos',                           'rolos',                           55),
    ('Rotocultivador',                  'rotocultivador',                  56),
    ('Rotoenfardadoras',                'rotoenfardadoras',                57),
    ('Segadoras',                       'segadoras',                       58),
    ('Sembradoras',                     'sembradoras',                     59),
    ('Semirremolques',                  'semirremolques',                  60),
    ('Subsoladoras',                    'subsoladoras',                    61),
    ('Tanques atmosféricos',            'tanques-atmosfericos',            62),
    ('Tolvas',                          'tolvas',                          63),
    ('Tractores',                       'tractores',                       64),
    ('Trailers',                        'trailers',                        65),
    ('Transplantadoras',                'transplantadoras',                66),
    ('Trieurs',                         'trieurs',                         67),
    ('Trituradoras de rastrojos',       'trituradoras-de-rastrojos',       68),
    ('Vendimiadoras',                   'vendimiadoras',                   69)
  ) AS v(nm, sl, so)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.subcategories s
    WHERE s.slug = v.sl AND s.category_id = cat_maquinaria
  );

  -- ============================================================
  -- 3. SUBCATEGORÍAS — REPUESTOS
  -- ============================================================

  INSERT INTO public.subcategories
    (name, display_name, slug, category_id, sort_order, is_active, has_brands, has_models, has_year, has_condition)
  SELECT v.nm, v.nm, v.sl, cat_repuestos, v.so, true, false, false, false, false
  FROM (VALUES
    ('Repuestos Oleohidráulicos',                 'repuestos-oleohidraulicos',                    1),
    ('Repuestos para Acoplados y Semirremolques', 'repuestos-acoplados-semirremolques',            2),
    ('Repuestos para Autoelevadores',             'repuestos-autoelevadores',                      3),
    ('Repuestos para Cabezales',                  'repuestos-cabezales',                           4),
    ('Repuestos para Camiones',                   'repuestos-camiones',                            5),
    ('Repuestos para Cintas Transportadoras',     'repuestos-cintas-transportadoras',              6),
    ('Repuestos para Clasificadoras de Semillas', 'repuestos-clasificadoras-semillas',             7),
    ('Repuestos para Cosechadoras',               'repuestos-cosechadoras',                        8),
    ('Repuestos para Desmalezadoras',             'repuestos-desmalezadoras',                      9),
    ('Repuestos para Embolsadoras de Forrajes',   'repuestos-embolsadoras-forrajes',              10),
    ('Repuestos para Fertilizadoras',             'repuestos-fertilizadoras',                     11),
    ('Repuestos para Grúas',                      'repuestos-gruas',                              12),
    ('Repuestos para Grupos Electrógenos',        'repuestos-grupos-electrogenos',                13),
    ('Repuestos para Implementos Agrícolas',      'repuestos-implementos-agricolas',              14),
    ('Repuestos para Maquinaria Vial',            'repuestos-maquinaria-vial',                    15),
    ('Repuestos para Mixers',                     'repuestos-mixers',                             16),
    ('Repuestos para Molinos',                    'repuestos-molinos',                            17),
    ('Repuestos para Norias',                     'repuestos-norias',                             18),
    ('Repuestos para Palas',                      'repuestos-palas',                              19),
    ('Repuestos para Picadoras de Forrajes',      'repuestos-picadoras-forrajes',                 20),
    ('Repuestos para Pick Up',                    'repuestos-pick-up',                            21),
    ('Repuestos para Prensas Peleteras',          'repuestos-prensas-peleteras',                  22),
    ('Repuestos para Pulverizadoras',             'repuestos-pulverizadoras',                     23),
    ('Repuestos para Rastras',                    'repuestos-rastras',                            24),
    ('Repuestos para Retroexcavadoras',           'repuestos-retroexcavadoras',                   25),
    ('Repuestos para Rotoenfardadoras',           'repuestos-rotoenfardadoras',                   26),
    ('Repuestos para Segadoras',                  'repuestos-segadoras',                          27),
    ('Repuestos para Sembradoras',                'repuestos-sembradoras',                        28),
    ('Repuestos para Sistemas de Riego',          'repuestos-sistemas-riego',                     29),
    ('Repuestos para Tambo',                      'repuestos-tambo',                              30),
    ('Repuestos para Tolvas',                     'repuestos-tolvas',                             31),
    ('Repuestos para Tractores',                  'repuestos-tractores',                          32)
  ) AS v(nm, sl, so)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.subcategories s
    WHERE s.slug = v.sl AND s.category_id = cat_repuestos
  );

  -- ============================================================
  -- 4. SUBCATEGORÍAS — INMOBILIARIA RURAL
  -- ============================================================

  INSERT INTO public.subcategories
    (name, display_name, slug, category_id, sort_order, is_active, has_brands, has_models, has_year, has_condition)
  SELECT v.nm, v.nm, v.sl, cat_inmobiliaria, v.so, true, false, false, false, false
  FROM (VALUES
    ('Campos',                  'campos',                    1),
    ('Casas de Campo',          'casas-de-campo',            2),
    ('Chacras',                 'chacras',                   3),
    ('Desarrollos Turísticos',  'desarrollos-turisticos',    4),
    ('Estancias',               'estancias',                 5),
    ('Granjas',                 'granjas',                   6),
    ('Inmuebles Urbanos',       'inmuebles-urbanos',         7),
    ('Lotes',                   'lotes',                     8),
    ('Viñedos y Bodegas',       'vinedos-y-bodegas',         9),
    ('Otros',                   'inmobiliaria-otros',       10)
  ) AS v(nm, sl, so)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.subcategories s
    WHERE s.slug = v.sl AND s.category_id = cat_inmobiliaria
  );

  -- ============================================================
  -- 5. SUBCATEGORÍAS — HACIENDA
  -- ============================================================

  INSERT INTO public.subcategories
    (name, display_name, slug, category_id, sort_order, is_active, has_brands, has_models, has_year, has_condition)
  SELECT v.nm, v.nm, v.sl, cat_hacienda, v.so, true, false, false, false, false
  FROM (VALUES
    ('Acuicultura',             'acuicultura',              1),
    ('Apicultura',              'apicultura',               2),
    ('Avicultura',              'avicultura',               3),
    ('Bovinos',                 'bovinos',                  4),
    ('Búfalos',                 'bufalos',                  5),
    ('Caballos',                'caballos',                 6),
    ('Camélidos',               'camelidos',                7),
    ('Caprinos',                'caprinos',                 8),
    ('Carpinchos o capivaras',  'carpinchos-capivaras',     9),
    ('Cerdos',                  'cerdos',                  10),
    ('Chinchillas',             'chinchillas',             11),
    ('Conejos',                 'conejos',                 12),
    ('Cunicultura',             'cunicultura',             13),
    ('Equinos',                 'equinos',                 14),
    ('Jabalíes',                'jabalies',                15),
    ('Lombricultor',            'lombricultor',            16),
    ('Ñandúes',                 'nandues',                 17),
    ('Ovinos',                  'ovinos',                  18),
    ('Porcinos',                'porcinos',                19),
    ('Yacarés',                 'yacares',                 20),
    ('Otros',                   'hacienda-otros',          21)
  ) AS v(nm, sl, so)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.subcategories s
    WHERE s.slug = v.sl AND s.category_id = cat_hacienda
  );

  -- ============================================================
  -- 6. SUBCATEGORÍAS — AGROEMPLEOS
  -- ============================================================

  INSERT INTO public.subcategories
    (name, display_name, slug, category_id, sort_order, is_active, has_brands, has_models, has_year, has_condition)
  SELECT v.nm, v.nm, v.sl, cat_empleos, v.so, true, false, false, false, false
  FROM (VALUES
    ('Abogados',                                          'empleos-abogados',                            1),
    ('Acuicultor',                                        'empleos-acuicultor',                          2),
    ('Administrador rural',                               'empleos-administrador-rural',                 3),
    ('Agrimensor',                                        'empleos-agrimensor',                          4),
    ('Albañil',                                           'empleos-albanil',                             5),
    ('Amansamiento de caballos',                          'empleos-amansamiento-caballos',               6),
    ('Apicultor',                                         'empleos-apicultor',                           7),
    ('Asesoramiento',                                     'empleos-asesoramiento',                       8),
    ('Avicultor',                                         'empleos-avicultor',                           9),
    ('Cabañero',                                          'empleos-cabanero',                           10),
    ('Cadete',                                            'empleos-cadete',                             11),
    ('Capataz',                                           'empleos-capataz',                            12),
    ('Casero',                                            'empleos-casero',                             13),
    ('Contadores',                                        'empleos-contadores',                         14),
    ('Cosedores de bolsa',                                'empleos-cosedores-bolsa',                    15),
    ('Cunicultor',                                        'empleos-cunicultor',                         16),
    ('Domador',                                           'empleos-domador',                            17),
    ('Empleado administrativo',                           'empleos-empleado-administrativo',            18),
    ('Encargados de campo',                               'empleos-encargados-campo',                   19),
    ('Fruticultor',                                       'empleos-fruticultor',                        20),
    ('Horticultor',                                       'empleos-horticultor',                        21),
    ('Ingeniero forestal',                                'empleos-ingeniero-forestal',                 22),
    ('Ingenieros agrimensores',                           'empleos-ing-agrimensores',                   23),
    ('Ingenieros agrónomos',                              'empleos-ing-agronomos',                      24),
    ('Ingenieros en alimentos',                           'empleos-ing-alimentos',                      25),
    ('Ingenieros en sistemas',                            'empleos-ing-sistemas',                       26),
    ('Ingenieros zootecnistas',                           'empleos-ing-zootecnistas',                   27),
    ('Inseminador artificial',                            'empleos-inseminador-artificial',             28),
    ('Jardinero',                                         'empleos-jardinero',                          29),
    ('Lic. en administración agropecuaria',               'empleos-lic-adm-agropecuaria',               30),
    ('Lic. en administración de RRHH',                    'empleos-lic-adm-rrhh',                       31),
    ('Lic. en bromatología',                              'empleos-lic-bromatologia',                   32),
    ('Lic. en ciencia y tecnología de alimentos',         'empleos-lic-cta',                            33),
    ('Lic. en ciencias ambientales',                      'empleos-lic-ciencias-ambientales',           34),
    ('Lic. en comercialización',                          'empleos-lic-comercializacion',               35),
    ('Lic. en comercio internacional',                    'empleos-lic-comercio-internacional',         36),
    ('Lic. en gestión de agroalimentos',                  'empleos-lic-gestion-agroalimentos',          37),
    ('Lic. en marketing',                                 'empleos-lic-marketing',                      38),
    ('Lic. en producción vegetal',                        'empleos-lic-produccion-vegetal',             39),
    ('Mecánico',                                          'empleos-mecanico',                           40),
    ('Paisajista',                                        'empleos-paisajista',                         41),
    ('Peón',                                              'empleos-peon',                               42),
    ('Perito clasificador',                               'empleos-perito-clasificador',                43),
    ('Promotora',                                         'empleos-promotora',                          44),
    ('Puestero',                                          'empleos-puestero',                           45),
    ('Quinteros',                                         'empleos-quinteros',                          46),
    ('Rematador',                                         'empleos-rematador',                          47),
    ('Talabarteros',                                      'empleos-talabarteros',                       48),
    ('Tambero',                                           'empleos-tambero',                            49),
    ('Tec. en administración agropecuaria',               'empleos-tec-adm-agropecuaria',               50),
    ('Técnico',                                           'empleos-tecnico',                            51),
    ('Técnico universitario en producción agropecuaria',  'empleos-tec-univ-prod-agropecuaria',         52),
    ('Técnicos en comercio exterior y aduana',            'empleos-tec-comercio-exterior',              53),
    ('Técnicos en enología y viticultura',                'empleos-tec-enologia-viticultura',           54),
    ('Tractorista – maquinista',                          'empleos-tractorista-maquinista',             55),
    ('Vendedor',                                          'empleos-vendedor',                           56),
    ('Veterinarios',                                      'empleos-veterinarios',                       57),
    ('Viticultor',                                        'empleos-viticultor',                         58)
  ) AS v(nm, sl, so)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.subcategories s
    WHERE s.slug = v.sl AND s.category_id = cat_empleos
  );

  -- ============================================================
  -- 7. SUBCATEGORÍAS — SERVICIOS
  -- ============================================================

  INSERT INTO public.subcategories
    (name, display_name, slug, category_id, sort_order, is_active, has_brands, has_models, has_year, has_condition)
  SELECT v.nm, v.nm, v.sl, cat_servicios, v.so, true, false, false, false, false
  FROM (VALUES
    ('Abogados',                             'servicios-abogados',                       1),
    ('Acopiadores de cereales',              'servicios-acopiadores-cereales',           2),
    ('Acopiadores de miel y cera',           'servicios-acopiadores-miel',               3),
    ('Administrador rural',                  'servicios-administrador-rural',            4),
    ('Agrográfica',                          'servicios-agrografica',                    5),
    ('AgTech',                               'servicios-agtech',                         6),
    ('Amansamiento de caballos',             'servicios-amansamiento-caballos',          7),
    ('Asesoramiento',                        'servicios-asesoramiento',                  8),
    ('Capacitación agropecuaria',            'servicios-capacitacion',                   9),
    ('Cartelería',                           'servicios-carteleria',                    10),
    ('Comunicaciones',                       'servicios-comunicaciones',                11),
    ('Consignatarios de cereales',           'servicios-consignatarios-cereales',       12),
    ('Consignatarios de hacienda',           'servicios-consignatarios-hacienda',       13),
    ('Contadores',                           'servicios-contadores',                    14),
    ('Contratistas rurales',                 'servicios-contratistas-rurales',          15),
    ('Corredores de cereales',               'servicios-corredores-cereales',           16),
    ('Desmontes',                            'servicios-desmontes',                     17),
    ('Despachantes de aduana',               'servicios-despachantes-aduana',           18),
    ('Difusión agropecuaria',                'servicios-difusion-agropecuaria',         19),
    ('Drones',                               'servicios-drones',                        20),
    ('Electrificación rural',                'servicios-electrificacion-rural',         21),
    ('Estabilización de suelos',             'servicios-estabilizacion-suelos',         22),
    ('Fumigación',                           'servicios-fumigacion',                    23),
    ('Geología',                             'servicios-geologia',                      24),
    ('Gestión de flotas',                    'servicios-gestion-flotas',                25),
    ('Hotelería en feedlot',                 'servicios-hoteleria-feedlot',             26),
    ('Inseminación artificial',              'servicios-inseminacion',                  27),
    ('Internet satelital / inalámbrica',     'servicios-internet-satelital',            28),
    ('Laboratorio de análisis agropecuaria', 'servicios-laboratorio-analisis',          29),
    ('Laboratorios',                         'servicios-laboratorios',                  30),
    ('Mediciones satelitales',               'servicios-mediciones-satelitales',        31),
    ('Merchandising',                        'servicios-merchandising',                 32),
    ('Minería',                              'servicios-mineria',                       33),
    ('Movimiento de tierra y excavaciones',  'servicios-movimiento-tierra',             34),
    ('Otros',                                'servicios-otros',                         35),
    ('Perforaciones',                        'servicios-perforaciones',                 36),
    ('Reparaciones metalúrgicas',            'servicios-reparaciones-metalurgicas',     37),
    ('Seguros agrarios',                     'servicios-seguros-agrarios',              38),
    ('Sericicultura',                        'servicios-sericicultura',                 39),
    ('Servicios forrajeros',                 'servicios-forrajeros',                    40),
    ('Servicios ganaderos',                  'servicios-ganaderos',                     41),
    ('Software',                             'servicios-software',                      42),
    ('Talleres mecánicos',                   'servicios-talleres-mecanicos',            43),
    ('Telefonía celular / radiotelefonía',   'servicios-telefonia',                     44),
    ('Topografía agrícola',                  'servicios-topografia',                    45),
    ('Transporte',                           'servicios-transporte',                    46),
    ('Turismo rural',                        'servicios-turismo-rural',                 47),
    ('Verificación vehicular',               'servicios-verificacion-vehicular',        48)
  ) AS v(nm, sl, so)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.subcategories s
    WHERE s.slug = v.sl AND s.category_id = cat_servicios
  );

  -- ============================================================
  -- 8. SUBCATEGORÍAS — EQUIPAMIENTO
  -- ============================================================

  INSERT INTO public.subcategories
    (name, display_name, slug, category_id, sort_order, is_active, has_brands, has_models, has_year, has_condition)
  SELECT v.nm, v.nm, v.sl, cat_equipamiento, v.so, true, false, false, false, false
  FROM (VALUES
    ('Acondicionadores de granos',              'equip-acondicionadores-granos',         1),
    ('Acondicionadores para silos',             'equip-acondicionadores-silos',          2),
    ('Aguadas',                                 'equip-aguadas',                         3),
    ('Aire acondicionado rural',                'equip-aire-acondicionado',              4),
    ('Aireación para cereales',                 'equip-aireacion-cereales',              5),
    ('Aparejos y balanceadores neumáticos',     'equip-aparejos-balanceadores',          6),
    ('Aparejos y puentes grúa',                 'equip-aparejos-puentes-grua',           7),
    ('Básculas – balanzas',                     'equip-basculas-balanzas',               8),
    ('Bebederos',                               'equip-bebederos',                       9),
    ('Bombas o electrobombas',                  'equip-bombas-electrobombas',           10),
    ('Bretes',                                  'equip-bretes',                         11),
    ('Cabinas',                                 'equip-cabinas',                        12),
    ('Calderas',                                'equip-calderas',                       13),
    ('Cámaras frigoríficas',                    'equip-camaras-frigorificas',           14),
    ('Cargadores',                              'equip-cargadores',                     15),
    ('Carrocerías',                             'equip-carrocerias',                    16),
    ('Casillas rurales',                        'equip-casillas-rurales',               17),
    ('Celdas de acopio',                        'equip-celdas-acopio',                  18),
    ('Cintas transportadoras',                  'equip-cintas-transportadoras',         19),
    ('Comederos',                               'equip-comederos',                      20),
    ('Compresores',                             'equip-compresores',                    21),
    ('Construcciones rurales',                  'equip-construcciones-rurales',         22),
    ('Contenedores marítimos',                  'equip-contenedores-maritimos',         23),
    ('Cúpulas',                                 'equip-cupulas',                        24),
    ('Depuradores',                             'equip-depuradores',                    25),
    ('Desactivadoras y tostadoras',             'equip-desactivadoras-tostadoras',      26),
    ('Desbarbador de granos',                   'equip-desbarbador-granos',             27),
    ('Desmotadoras de algodón',                 'equip-desmotadoras-algodon',           28),
    ('Dosificadores',                           'equip-dosificadores',                  29),
    ('Electrónica',                             'equip-electronica',                    30),
    ('Elevadores',                              'equip-elevadores',                     31),
    ('Elevadores de granos',                    'equip-elevadores-granos',              32),
    ('Energía',                                 'equip-energia',                        33),
    ('Enganches',                               'equip-enganches',                      34),
    ('Equipos de laboratorio',                  'equip-laboratorio',                    35),
    ('Equipos industria alimenticia',           'equip-industria-alimenticia',          36),
    ('Equipos para alimentos balanceados',      'equip-alimentos-balanceados',          37),
    ('Equipos para lubricación',                'equip-lubricacion',                    38),
    ('Estaciones meteorológicas',               'equip-estaciones-meteorologicas',      39),
    ('Extrusores',                              'equip-extrusores',                     40),
    ('Grupos electrógenos / generadores',       'equip-grupos-electrogenos',            41),
    ('Herramientas',                            'equip-herramientas',                   42),
    ('Hogar y jardín',                          'equip-hogar-jardin',                   43),
    ('Humedímetros',                            'equip-humedimetros',                   44),
    ('Lustrador de granos',                     'equip-lustrador-granos',               45),
    ('Mangas',                                  'equip-mangas',                         46),
    ('Máquinas cortadoras',                     'equip-maquinas-cortadoras',            47),
    ('Máquinas metalúrgicas',                   'equip-maquinas-metalurgicas',          48),
    ('Molinos de trigo',                        'equip-molinos-trigo',                  49),
    ('Molinos de viento',                       'equip-molinos-viento',                 50),
    ('Motores',                                 'equip-motores',                        51),
    ('Norias',                                  'equip-norias',                         52),
    ('Parideras',                               'equip-parideras',                      53),
    ('Plataformas volcadoras',                  'equip-plataformas-volcadoras',         54),
    ('Pluma hidráulica',                        'equip-pluma-hidraulica',               55),
    ('Pluviómetros',                            'equip-pluviometros',                   56),
    ('Prensas peleteras',                       'equip-prensas-peleteras',              57),
    ('Reductores',                              'equip-reductores',                     58),
    ('Removedor de fosas',                      'equip-removedor-fosas',                59),
    ('Riego',                                   'equip-riego',                          60),
    ('Secadoras',                               'equip-secadoras',                      61),
    ('Secadoras de granos y semillas',          'equip-secadoras-granos',               62),
    ('Seguridad industrial',                    'equip-seguridad-industrial',           63),
    ('Silos',                                   'equip-silos',                          64),
    ('Sinfines',                                'equip-sinfines',                       65),
    ('Tambo',                                   'equip-tambo',                          66),
    ('Tanques',                                 'equip-tanques',                        67),
    ('Toldos y cerramientos de lona',           'equip-toldos-cerramientos',            68),
    ('Tractousinas',                            'equip-tractousinas',                   69),
    ('Tranqueras',                              'equip-tranqueras',                     70),
    ('Transportadores',                         'equip-transportadores',                71),
    ('Tratamiento para agua',                   'equip-tratamiento-agua',               72)
  ) AS v(nm, sl, so)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.subcategories s
    WHERE s.slug = v.sl AND s.category_id = cat_equipamiento
  );

  -- ============================================================
  -- 9. SUBCATEGORÍAS — INSUMOS
  -- ============================================================

  INSERT INTO public.subcategories
    (name, display_name, slug, category_id, sort_order, is_active, has_brands, has_models, has_year, has_condition)
  SELECT v.nm, v.nm, v.sl, cat_insumos, v.so, true, false, false, false, false
  FROM (VALUES
    ('Abrasivos',                   'insumos-abrasivos',                 1),
    ('Alambres',                    'insumos-alambres',                  2),
    ('Antiabrasivos',               'insumos-antiabrasivos',             3),
    ('Artículos de goma',           'insumos-articulos-goma',            4),
    ('Artículos rurales',           'insumos-articulos-rurales',         5),
    ('Avicidas',                    'insumos-avicidas',                  6),
    ('Biológicos',                  'insumos-biologicos',                7),
    ('Bolsas para silaje',          'insumos-bolsas-silaje',             8),
    ('Caravanas',                   'insumos-caravanas',                 9),
    ('Combustibles y lubricantes',  'insumos-combustibles-lubricantes', 10),
    ('Corralón',                    'insumos-corralon',                 11),
    ('Cubiertas y rodados',         'insumos-cubiertas-rodados',        12),
    ('Envases y contenedores',      'insumos-envases-contenedores',     13),
    ('Fertilizantes',               'insumos-fertilizantes',            14),
    ('Fitosanitarios',              'insumos-fitosanitarios',           15),
    ('Forrajes',                    'insumos-forrajes',                 16),
    ('Granja',                      'insumos-granja',                   17),
    ('Lonas y telas',               'insumos-lonas-telas',              18),
    ('Maderas',                     'insumos-maderas',                  19),
    ('Mallas y redes',              'insumos-mallas-redes',             20),
    ('Nematicidas',                 'insumos-nematicidas',              21),
    ('Nutrición animal',            'insumos-nutricion-animal',         22),
    ('Productos de frigoríficos',   'insumos-prod-frigorificos',        23),
    ('Productos de lechería',       'insumos-prod-lecheria',            24),
    ('Productos orgánicos',         'insumos-prod-organicos',           25),
    ('Productos veterinarios',      'insumos-prod-veterinarios',        26),
    ('Ropa de trabajo',             'insumos-ropa-trabajo',             27),
    ('Semillas',                    'insumos-semillas',                 28),
    ('Talabartería',                'insumos-talabarteria',             29),
    ('Tensores',                    'insumos-tensores',                 30)
  ) AS v(nm, sl, so)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.subcategories s
    WHERE s.slug = v.sl AND s.category_id = cat_insumos
  );

END $$;
