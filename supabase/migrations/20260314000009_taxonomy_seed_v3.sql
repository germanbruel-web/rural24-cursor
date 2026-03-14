-- ============================================================
-- Migration: 20260314000009_taxonomy_seed_v3.sql
-- Sprint 8C — Seed completo L2 subcategorías (datos reales)
-- 8 categorías, 369 subcategorías
-- IDEMPOTENTE: ON CONFLICT (category_id, name) DO UPDATE
-- Requiere: 000008 (is_filter) aplicada primero
-- ============================================================

DO $$
DECLARE
  c_maq  uuid; -- maquinaria-agricola
  c_rep  uuid; -- repuestos
  c_inm  uuid; -- inmobiliaria-rural
  c_equ  uuid; -- equipamiento
  c_ins  uuid; -- insumos
  c_hac  uuid; -- hacienda
  c_emp  uuid; -- empleos
  c_ser  uuid; -- servicios
BEGIN

  -- ── Maquinaria: arreglar slug NULL + nombre legacy ────────
  -- En la DB actual el slug es NULL y name='maquinarias-agricolas'
  UPDATE public.categories
  SET slug = 'maquinaria-agricola',
      name = 'maquinaria-agricola',
      display_name = 'Maquinaria Agrícola',
      is_active = true
  WHERE (slug IS NULL OR slug = 'maquinaria-agricola' OR name = 'maquinarias-agricolas');

  SELECT id INTO c_maq FROM public.categories WHERE slug = 'maquinaria-agricola';
  IF c_maq IS NULL THEN RAISE EXCEPTION 'No se pudo encontrar/arreglar maquinaria-agricola'; END IF;

  -- ── Categorías existentes (slugs confirmados) ─────────────
  SELECT id INTO c_equ FROM public.categories WHERE slug = 'equipamiento';
  SELECT id INTO c_ins FROM public.categories WHERE slug = 'insumos';
  SELECT id INTO c_hac FROM public.categories WHERE slug = 'hacienda';
  SELECT id INTO c_emp FROM public.categories WHERE slug = 'empleos';
  SELECT id INTO c_ser FROM public.categories WHERE slug = 'servicios';

  IF c_equ IS NULL THEN RAISE EXCEPTION 'equipamiento not found'; END IF;
  IF c_ins IS NULL THEN RAISE EXCEPTION 'insumos not found'; END IF;
  IF c_hac IS NULL THEN RAISE EXCEPTION 'hacienda not found'; END IF;
  IF c_emp IS NULL THEN RAISE EXCEPTION 'empleos not found'; END IF;
  IF c_ser IS NULL THEN RAISE EXCEPTION 'servicios not found'; END IF;

  -- ── Crear repuestos (ON CONFLICT por slug — puede existir con name distinto en PROD) ──
  INSERT INTO public.categories (name, display_name, slug, is_active, is_filter, sort_order)
  VALUES ('repuestos','Repuestos','repuestos',true,true,2)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, is_active = true, is_filter = true;
  SELECT id INTO c_rep FROM public.categories WHERE slug = 'repuestos';

  -- ── Crear inmobiliaria-rural (ON CONFLICT por slug) ─────────────────────────────────
  INSERT INTO public.categories (name, display_name, slug, is_active, is_filter, sort_order)
  VALUES ('inmobiliaria-rural','Inmobiliaria Rural','inmobiliaria-rural',true,true,3)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, is_active = true, is_filter = true;
  SELECT id INTO c_inm FROM public.categories WHERE slug = 'inmobiliaria-rural';

  -- Normalizar: name = slug en filas existentes
  -- (la DB tiene name con mayúsculas; igualamos a slug para que ON CONFLICT (category_id, name)
  --  capture correctamente cuando ambos constraints apuntan al mismo row)
  UPDATE public.subcategories
  SET name = slug
  WHERE parent_id IS NULL
    AND slug IS NOT NULL
    AND category_id IN (c_maq, c_rep, c_inm, c_equ, c_ins, c_hac, c_emp, c_ser);

  -- Desactivar L2 previas (reemplazadas por este seed)
  UPDATE public.subcategories SET is_active = false
  WHERE parent_id IS NULL
    AND category_id IN (c_maq, c_rep, c_inm, c_equ, c_ins, c_hac, c_emp, c_ser);

  -- ── MAQUINARIA AGRÍCOLA ────────────────────────────────────
  INSERT INTO public.subcategories (name, display_name, slug, category_id, parent_id, sort_order, is_active, is_filter)
  SELECT v.sl, v.dn, v.sl, c_maq, NULL, v.so, true, true FROM (VALUES
    ('acondicionador-de-suelos','Acondicionador de suelos',1),
    ('acoplados','Acoplados',2),
    ('arados','Arados',3),
    ('arrancadoras','Arrancadoras',4),
    ('aspiradoras-de-granos','Aspiradoras de granos',5),
    ('autoelevadores','Autoelevadores',6),
    ('cabezales','Cabezales',7),
    ('camiones','Camiones',8),
    ('camionetas','Camionetas',9),
    ('carpidores','Carpidores',10),
    ('carros-compactadores','Carros compactadores',11),
    ('casillas-rurales','Casillas rurales',12),
    ('chimangos','Chimangos',13),
    ('chipeadoras','Chipeadoras',14),
    ('cinceles','Cinceles',15),
    ('clasificadoras-de-semillas','Clasificadoras de semillas',16),
    ('cortahileradoras','Cortahileradoras',17),
    ('cosechadoras','Cosechadoras',18),
    ('cultivadores','Cultivadores',19),
    ('curadores-de-semillas','Curadores de semillas',20),
    ('desbrotadoras','Desbrotadoras',21),
    ('desmalezadoras','Desmalezadoras',22),
    ('destacuruzador','Destacuruzador',23),
    ('drones','Drones',24),
    ('embaladora-de-rollos','Embaladora de rollos',25),
    ('embarcaciones','Embarcaciones',26),
    ('embolsadoras-embutidoras','Embolsadoras / Embutidoras',27),
    ('enfardadoras','Enfardadoras',28),
    ('enrolladoras','Enrolladoras',29),
    ('ensiladoras','Ensiladoras',30),
    ('escardillos','Escardillos',31),
    ('estercoleras','Estercoleras',32),
    ('extractoras-de-forrajes','Extractoras de forrajes',33),
    ('extractores-de-grano','Extractores de grano',34),
    ('fertilizadoras','Fertilizadoras',35),
    ('gruas','Grúas',36),
    ('hileradora','Hileradora',37),
    ('inoculadores','Inoculadores',38),
    ('levanta-fardos-y-rollos','Levanta fardos y rollos',39),
    ('limpiadoras-de-granos-y-semillas','Limpiadoras de granos y semillas',40),
    ('maquinaria-forestal','Maquinaria forestal',41),
    ('maquinaria-frutihortícola','Maquinaria frutihortícola',42),
    ('maquinaria-vial','Maquinaria vial',43),
    ('mezcladoras-de-granos','Mezcladoras de granos',44),
    ('minitractores','Minitractores',45),
    ('mixers','Mixers',46),
    ('moledoras-quebradoras','Moledoras / Quebradoras',47),
    ('niveladoras','Niveladoras',48),
    ('otros','Otros',49),
    ('palas','Palas',50),
    ('paratil','Paratil',51),
    ('picadora-de-rollos','Picadora de rollos',52),
    ('picadoras-de-forraje','Picadoras de forraje',53),
    ('podadoras','Podadoras',54),
    ('pulverizadoras','Pulverizadoras',55),
    ('rastras','Rastras',56),
    ('rastrillos','Rastrillos',57),
    ('rastron-desterronador','Rastrón desterronador',58),
    ('rolos','Rolos',59),
    ('rotocultivador','Rotocultivador',60),
    ('rotoenfardadoras','Rotoenfardadoras',61),
    ('segadoras','Segadoras',62),
    ('sembradoras','Sembradoras',63),
    ('semirremolques','Semirremolques',64),
    ('subsoladoras','Subsoladoras',65),
    ('tanques-atmosfericos','Tanques atmosféricos',66),
    ('tolvas','Tolvas',67),
    ('tractores','Tractores',68),
    ('trailers','Trailers',69),
    ('transplantadoras','Transplantadoras',70),
    ('trieurs','Trieurs',71),
    ('trituradoras-de-rastrojos','Trituradoras de rastrojos',72),
    ('vendimiadoras','Vendimiadoras',73)
  ) AS v(sl, dn, so)
  ON CONFLICT (category_id, name) DO UPDATE
    SET display_name = EXCLUDED.display_name, slug = EXCLUDED.slug, is_active = true, is_filter = true, sort_order = EXCLUDED.sort_order;

  -- ── REPUESTOS ─────────────────────────────────────────────
  INSERT INTO public.subcategories (name, display_name, slug, category_id, parent_id, sort_order, is_active, is_filter)
  SELECT v.sl, v.dn, v.sl, c_rep, NULL, v.so, true, true FROM (VALUES
    ('repuestos-oleohidraulicos','Repuestos Oleohidráulicos',1),
    ('repuestos-acoplados-semirremolques','Repuestos para Acoplados y Semirremolques',2),
    ('repuestos-autoelevadores','Repuestos para Autoelevadores',3),
    ('repuestos-cabezales','Repuestos para Cabezales',4),
    ('repuestos-camiones','Repuestos para Camiones',5),
    ('repuestos-cintas-transportadoras','Repuestos para Cintas Transportadoras',6),
    ('repuestos-clasificadoras-semillas','Repuestos para Clasificadoras de Semillas',7),
    ('repuestos-cosechadoras','Repuestos para Cosechadoras',8),
    ('repuestos-desmalezadoras','Repuestos para Desmalezadoras',9),
    ('repuestos-embolsadoras-forrajes','Repuestos para Embolsadoras de Forrajes',10),
    ('repuestos-fertilizadoras','Repuestos para Fertilizadoras',11),
    ('repuestos-gruas','Repuestos para Grúas',12),
    ('repuestos-grupos-electrogenos','Repuestos para Grupos Electrógenos',13),
    ('repuestos-implementos-agricolas','Repuestos para Implementos Agrícolas',14),
    ('repuestos-maquinaria-vial','Repuestos para Maquinaria Vial',15),
    ('repuestos-mixers','Repuestos para Mixers',16),
    ('repuestos-molinos','Repuestos para Molinos',17),
    ('repuestos-norias','Repuestos para Norias',18),
    ('repuestos-palas','Repuestos para Palas',19),
    ('repuestos-picadoras-forrajes','Repuestos para Picadoras de Forrajes',20),
    ('repuestos-pick-up','Repuestos para Pick Up',21),
    ('repuestos-prensas-peleteras','Repuestos para Prensas Peleteras',22),
    ('repuestos-pulverizadoras','Repuestos para Pulverizadoras',23),
    ('repuestos-rastras','Repuestos para Rastras',24),
    ('repuestos-retroexcavadoras','Repuestos para Retroexcavadoras',25),
    ('repuestos-rotoenfardadoras','Repuestos para Rotoenfardadoras',26),
    ('repuestos-segadoras','Repuestos para Segadoras',27),
    ('repuestos-sembradoras','Repuestos para Sembradoras',28),
    ('repuestos-riego','Repuestos para Sistemas de Riego',29),
    ('repuestos-tambo','Repuestos para Tambo',30),
    ('repuestos-tolvas','Repuestos para Tolvas',31),
    ('repuestos-tractores','Repuestos para Tractores',32)
  ) AS v(sl, dn, so)
  ON CONFLICT (category_id, name) DO UPDATE
    SET display_name = EXCLUDED.display_name, slug = EXCLUDED.slug, is_active = true, is_filter = true, sort_order = EXCLUDED.sort_order;

  -- ── INMOBILIARIA RURAL ────────────────────────────────────
  INSERT INTO public.subcategories (name, display_name, slug, category_id, parent_id, sort_order, is_active, is_filter)
  SELECT v.sl, v.dn, v.sl, c_inm, NULL, v.so, true, true FROM (VALUES
    ('campos','Campos',1),
    ('casas-de-campo','Casas de Campo',2),
    ('chacras','Chacras',3),
    ('desarrollos-turisticos','Desarrollos Turísticos',4),
    ('estancias','Estancias',5),
    ('granjas','Granjas',6),
    ('inmuebles-urbanos','Inmuebles Urbanos',7),
    ('lotes','Lotes',8),
    ('otros','Otros',9),
    ('vinedos-y-bodegas','Viñedos y Bodegas',10)
  ) AS v(sl, dn, so)
  ON CONFLICT (category_id, name) DO UPDATE
    SET display_name = EXCLUDED.display_name, slug = EXCLUDED.slug, is_active = true, is_filter = true, sort_order = EXCLUDED.sort_order;

  -- ── EQUIPAMIENTO ──────────────────────────────────────────
  INSERT INTO public.subcategories (name, display_name, slug, category_id, parent_id, sort_order, is_active, is_filter)
  SELECT v.sl, v.dn, v.sl, c_equ, NULL, v.so, true, true FROM (VALUES
    ('acondicionadores-de-granos','Acondicionadores de granos',1),
    ('acondicionadores-para-silos','Acondicionadores para silos',2),
    ('agricultura-de-precision','Agricultura de precisión',3),
    ('aguadas','Aguadas',4),
    ('aire-acondicionado-rural','Aire acondicionado rural',5),
    ('aireacion-para-cereales','Aireación para cereales',6),
    ('aparejos-y-balanceadores-neumaticos','Aparejos y balanceadores neumáticos',7),
    ('aparejos-y-puentes-grua','Aparejos y puentes grúa',8),
    ('apicultura','Apicultura',9),
    ('avicultura','Avicultura',10),
    ('barrenos','Barrenos',11),
    ('basculas-balanzas','Básculas – balanzas',12),
    ('bebederos','Bebederos',13),
    ('bombas-o-electrobombas','Bombas o electrobombas',14),
    ('bovinos','Bovinos',15),
    ('bretes','Bretes',16),
    ('cabinas','Cabinas',17),
    ('calderas','Calderas',18),
    ('camaras-frigorificas','Cámaras frigoríficas',19),
    ('caprinos','Caprinos',20),
    ('cargadores','Cargadores',21),
    ('carrocerias','Carrocerías',22),
    ('celdas-de-acopio','Celdas de acopio',23),
    ('cintas-transportadoras','Cintas transportadoras',24),
    ('comederos','Comederos',25),
    ('compresores','Compresores',26),
    ('construcciones-rurales','Construcciones rurales',27),
    ('contenedores-maritimos','Contenedores marítimos',28),
    ('cunicultura','Cunicultura',29),
    ('cupulas','Cúpulas',30),
    ('depuradores','Depuradores',31),
    ('desactivadoras-y-tostadoras','Desactivadoras y tostadoras',32),
    ('desbarbador-de-granos','Desbarbador de granos',33),
    ('descompactadoras','Descompactadoras',34),
    ('desmotadoras-de-algodon','Desmotadoras de algodón',35),
    ('dosificadores','Dosificadores',36),
    ('electronica','Electrónica',37),
    ('elevadores','Elevadores',38),
    ('elevadores-de-granos','Elevadores de granos',39),
    ('energia','Energía',40),
    ('enganches','Enganches',41),
    ('equinos','Equinos',42),
    ('equipos-de-laboratorio','Equipos de laboratorio',43),
    ('equipos-industria-alimenticia','Equipos industria alimenticia',44),
    ('equipos-para-alimentos-balanceados','Equipos para alimentos balanceados',45),
    ('equipos-para-lubricacion','Equipos para lubricación',46),
    ('escarificadores','Escarificadores',47),
    ('estaciones-meteorologicas','Estaciones meteorológicas',48),
    ('extrusores','Extrusores',49),
    ('ganaderia','Ganadería',50),
    ('gruas','Grúas',51),
    ('grupos-electrogenos','Grupos electrógenos o generadores de energía',52),
    ('herramientas','Herramientas',53),
    ('hogar-y-jardin','Hogar y jardín',54),
    ('humedimetros','Humedímetros',55),
    ('inseminacion-artificial','Inseminación artificial',56),
    ('lustrador-de-granos','Lustrador de granos',57),
    ('mangas','Mangas',58),
    ('maquinas-cortadoras','Máquinas cortadoras',59),
    ('maquinas-metalurgicas','Máquinas metalúrgicas',60),
    ('molinos-de-trigo','Molinos de trigo',61),
    ('molinos-de-viento','Molinos de viento',62),
    ('motores','Motores',63),
    ('norias','Norias',64),
    ('otros','Otros',65),
    ('ovinos','Ovinos',66),
    ('parideras','Parideras',67),
    ('plataformas-volcadoras','Plataformas volcadoras',68),
    ('pluma-hidraulica','Pluma hidráulica',69),
    ('pluviometros','Pluviómetros',70),
    ('porcinos','Porcinos',71),
    ('prensas-peleteras','Prensas peleteras',72),
    ('reductores','Reductores',73),
    ('removedor-de-fosas','Removedor de fosas',74),
    ('riego','Riego',75),
    ('ropa-de-trabajo','Ropa de trabajo',76),
    ('secadoras','Secadoras',77),
    ('secadoras-de-granos-y-semillas','Secadoras de granos y semillas',78),
    ('seguridad-industrial','Seguridad industrial',79),
    ('silos','Silos',80),
    ('sinfines','Sinfines',81),
    ('tambo','Tambo',82),
    ('tanques','Tanques',83),
    ('toldos-y-cerramientos-de-lona','Toldos y cerramientos de lona',84),
    ('tractousinas','Tractousinas',85),
    ('tranqueras','Tranqueras',86),
    ('transportadores','Transportadores',87),
    ('tratamiento-para-agua','Tratamiento para agua',88),
    ('verificacion-vehicular','Verificación vehicular',89)
  ) AS v(sl, dn, so)
  ON CONFLICT (category_id, name) DO UPDATE
    SET display_name = EXCLUDED.display_name, slug = EXCLUDED.slug, is_active = true, is_filter = true, sort_order = EXCLUDED.sort_order;

  -- ── INSUMOS ───────────────────────────────────────────────
  INSERT INTO public.subcategories (name, display_name, slug, category_id, parent_id, sort_order, is_active, is_filter)
  SELECT v.sl, v.dn, v.sl, c_ins, NULL, v.so, true, true FROM (VALUES
    ('abrasivos','Abrasivos',1),
    ('alambres','Alambres',2),
    ('antiabrasivos','Antiabrasivos',3),
    ('apicultura','Apicultura',4),
    ('articulos-de-goma','Artículos de goma',5),
    ('articulos-rurales','Artículos rurales',6),
    ('avicidas','Avicidas',7),
    ('avicultura','Avicultura',8),
    ('biologicos','Biológicos',9),
    ('bolsas-para-silaje','Bolsas para silaje',10),
    ('bovinos','Bovinos',11),
    ('camelidos','Camélidos',12),
    ('caprinos','Caprinos',13),
    ('caravanas','Caravanas',14),
    ('combustibles-y-lubricantes','Combustibles y lubricantes',15),
    ('corralon','Corralón',16),
    ('cubiertas-y-rodados','Cubiertas y rodados',17),
    ('cunicultura','Cunicultura',18),
    ('electrificacion-rural','Electrificación rural',19),
    ('envases-y-contenedores','Envases y contenedores',20),
    ('equinos','Equinos',21),
    ('estabilizador-de-caminos','Estabilizador de caminos',22),
    ('fertilizantes','Fertilizantes',23),
    ('fitosanitarios','Fitosanitarios',24),
    ('forrajes','Forrajes',25),
    ('granja','Granja',26),
    ('lonas-y-telas','Lonas y telas',27),
    ('maderas','Maderas',28),
    ('mallas-y-redes','Mallas y redes',29),
    ('nematicidas','Nematicidas',30),
    ('nutricion-animal','Nutrición animal',31),
    ('otros','Otros',32),
    ('ovinos','Ovinos',33),
    ('porcinos','Porcinos',34),
    ('productos-de-frigorificos','Productos de frigoríficos',35),
    ('productos-de-lecheria','Productos de lechería',36),
    ('productos-organicos','Productos orgánicos',37),
    ('productos-veterinarios','Productos veterinarios',38),
    ('semillas','Semillas',39),
    ('talabarteria','Talabartería',40),
    ('tambo','Tambo',41),
    ('tensores','Tensores',42)
  ) AS v(sl, dn, so)
  ON CONFLICT (category_id, name) DO UPDATE
    SET display_name = EXCLUDED.display_name, slug = EXCLUDED.slug, is_active = true, is_filter = true, sort_order = EXCLUDED.sort_order;

  -- ── HACIENDA ──────────────────────────────────────────────
  INSERT INTO public.subcategories (name, display_name, slug, category_id, parent_id, sort_order, is_active, is_filter)
  SELECT v.sl, v.dn, v.sl, c_hac, NULL, v.so, true, true FROM (VALUES
    ('acuicultura','Acuicultura',1),
    ('apicultura','Apicultura',2),
    ('avicultura','Avicultura',3),
    ('bovinos','Bovinos',4),
    ('bufalos','Búfalos',5),
    ('camelidos','Camélidos',6),
    ('caprinos','Caprinos',7),
    ('carpinchos-o-capivaras','Carpinchos o capivaras',8),
    ('cerdos','Cerdos',9),
    ('chinchillas','Chinchillas',10),
    ('conejos','Conejos',11),
    ('jabalies','Jabalíes',12),
    ('nandues','Ñandúes',13),
    ('otros','Otros',14),
    ('ovinos','Ovinos',15),
    ('yacarees','Yacarés',16)
  ) AS v(sl, dn, so)
  ON CONFLICT (category_id, name) DO UPDATE
    SET display_name = EXCLUDED.display_name, slug = EXCLUDED.slug, is_active = true, is_filter = true, sort_order = EXCLUDED.sort_order;

  -- ── EMPLEOS ───────────────────────────────────────────────
  INSERT INTO public.subcategories (name, display_name, slug, category_id, parent_id, sort_order, is_active, is_filter)
  SELECT v.sl, v.dn, v.sl, c_emp, NULL, v.so, true, true FROM (VALUES
    ('abogados','Abogados',1),
    ('acuicultor','Acuicultor',2),
    ('administrador-rural','Administrador rural',3),
    ('agrimensor','Agrimensor',4),
    ('albanil','Albañil',5),
    ('amansamiento-de-caballos','Amansamiento de caballos',6),
    ('apicultor','Apicultor',7),
    ('avicultor','Avicultor',8),
    ('cabanero','Cabañero',9),
    ('cadete','Cadete',10),
    ('capataz','Capataz',11),
    ('casero','Casero',12),
    ('contadores','Contadores',13),
    ('cosedores-de-bolsa','Cosedores de bolsa',14),
    ('cunicultor','Cunicultor',15),
    ('domador','Domador',16),
    ('embolsadores','Embolsadores',17),
    ('empleado-administrativo','Empleado administrativo',18),
    ('encargados-de-campo','Encargados de campo',19),
    ('fruticultor','Fruticultor',20),
    ('horticultor','Horticultor',21),
    ('ingeniero-forestal','Ingeniero forestal',22),
    ('ingenieros-agrimensores','Ingenieros agrimensores',23),
    ('ingenieros-agronomos','Ingenieros agrónomos',24),
    ('ingenieros-en-alimentos','Ingenieros en alimentos',25),
    ('ingenieros-en-sistemas','Ingenieros en sistemas',26),
    ('ingenieros-zootecnistas','Ingenieros zootecnistas',27),
    ('inseminador-artificial','Inseminador artificial',28),
    ('jardinero','Jardinero',29),
    ('lic-administracion-agropecuaria','Lic. en administración agropecuaria',30),
    ('lic-administracion-rrhh','Lic. en administración de recursos humanos',31),
    ('lic-bromatologia','Lic. en bromatología',32),
    ('lic-ciencia-y-tecnologia-alimentos','Lic. en ciencia y tecnología de alimentos',33),
    ('lic-ciencias-ambientales','Lic. en ciencias ambientales',34),
    ('lic-comercializacion','Lic. en comercialización',35),
    ('lic-comercio-internacional','Lic. en comercio internacional – despachante aduanero',36),
    ('lic-gestion-agroalimentos','Lic. en gestión de agroalimentos',37),
    ('lic-marketing','Lic. en marketing',38),
    ('lic-produccion-vegetal','Lic. en producción vegetal',39),
    ('lombricultor','Lombricultor',40),
    ('mecanico','Mecánico',41),
    ('otro','Otro',42),
    ('paisajista','Paisajista',43),
    ('peon','Peón',44),
    ('perito-clasificador','Perito clasificador',45),
    ('promotora','Promotora',46),
    ('puestero','Puestero',47),
    ('quinteros','Quinteros',48),
    ('rematador','Rematador',49),
    ('talabarteros','Talabarteros',50),
    ('tambero','Tambero',51),
    ('tec-administracion-agropecuaria','Tec. en administración agropecuaria',52),
    ('tecnico','Técnico',53),
    ('tecnico-univ-produccion-agropecuaria','Técnico universitario en producción agropecuaria',54),
    ('tecnicos-comercio-exterior','Técnicos en comercio exterior y aduana',55),
    ('tecnicos-enologia-viticultura','Técnicos en enología y viticultura',56),
    ('tractorista-maquinista','Tractorista – maquinista',57),
    ('vendedor','Vendedor',58),
    ('veterinarios','Veterinarios',59),
    ('viticultor','Viticultor',60)
  ) AS v(sl, dn, so)
  ON CONFLICT (category_id, name) DO UPDATE
    SET display_name = EXCLUDED.display_name, slug = EXCLUDED.slug, is_active = true, is_filter = true, sort_order = EXCLUDED.sort_order;

  -- ── SERVICIOS ─────────────────────────────────────────────
  INSERT INTO public.subcategories (name, display_name, slug, category_id, parent_id, sort_order, is_active, is_filter)
  SELECT v.sl, v.dn, v.sl, c_ser, NULL, v.so, true, true FROM (VALUES
    ('acopiadores-de-cereales','Acopiadores de cereales',1),
    ('acopiadores-de-miel-y-cera','Acopiadores de miel y cera',2),
    ('agrografica','Agrográfica',3),
    ('agtech','AgTech',4),
    ('aislaciones-termicas','Aislaciones térmicas',5),
    ('almacenaje','Almacenaje',6),
    ('amansamiento-de-caballos','Amansamiento de caballos',7),
    ('asesoramiento','Asesoramiento',8),
    ('capacitacion-agropecuaria','Capacitación agropecuaria',9),
    ('carteleria','Cartelería',10),
    ('clasificadores-de-granos','Clasificadores de granos',11),
    ('comunicaciones','Comunicaciones',12),
    ('consignatarios-de-cereales','Consignatarios de cereales',13),
    ('consignatarios-de-hacienda','Consignatarios de hacienda',14),
    ('construccion','Construcción',15),
    ('contadores','Contadores',16),
    ('contratistas-rurales','Contratistas rurales',17),
    ('corredores-de-cereales','Corredores de cereales',18),
    ('desmontes','Desmontes',19),
    ('despachantes-de-aduana','Despachantes de aduana',20),
    ('difusion-agropecuaria','Difusión agropecuaria',21),
    ('estabilizacion-de-suelos','Estabilización de suelos',22),
    ('forestacion','Forestación',23),
    ('fumigacion','Fumigación',24),
    ('geologia','Geología',25),
    ('gestion-de-flotas','Gestión de flotas',26),
    ('hoteleria-en-feedlot','Hotelería en feedlot',27),
    ('internet-satelital-inalambrica','Internet satelital – inalámbrica',28),
    ('laboratorio-de-analisis-agropecuario','Laboratorio de análisis agropecuario',29),
    ('laboratorios','Laboratorios',30),
    ('libros','Libros',31),
    ('mediciones-satelitales','Mediciones satelitales',32),
    ('merchandising','Merchandising',33),
    ('mineria','Minería',34),
    ('movimiento-de-tierra-y-excavaciones','Movimiento de tierra y excavaciones',35),
    ('otros','Otros',36),
    ('perforaciones','Perforaciones',37),
    ('plomeria','Plomería',38),
    ('reparaciones-metalurgicas','Reparaciones metalúrgicas',39),
    ('seguros-agrarios','Seguros agrarios',40),
    ('sericicultura','Sericicultura',41),
    ('servicios-forrajeros','Servicios forrajeros',42),
    ('servicios-ganaderos','Servicios ganaderos',43),
    ('software','Software',44),
    ('talleres-mecanicos','Talleres mecánicos',45),
    ('telefonia-celular-radiotelefonia','Telefonía celular – radiotelefonía',46),
    ('topografia-agricola','Topografía agrícola',47),
    ('transporte','Transporte',48),
    ('turismo-rural','Turismo rural',49)
  ) AS v(sl, dn, so)
  ON CONFLICT (category_id, name) DO UPDATE
    SET display_name = EXCLUDED.display_name, slug = EXCLUDED.slug, is_active = true, is_filter = true, sort_order = EXCLUDED.sort_order;

  RAISE NOTICE '✅ Seed taxonomía v3 completado: 369 subcategorías L2 (8 categorías)';

END $$;
