-- =====================================================
-- SEED DATA: CATEGORÍAS Y SUBCATEGORÍAS COMPLETAS
-- Fecha: 16 de diciembre, 2025
-- Versión: LIMPIA (borra y recrea todo)
-- =====================================================

-- LIMPIAR DATOS EXISTENTES
TRUNCATE TABLE subcategory_brands CASCADE;
TRUNCATE TABLE subcategories CASCADE;
TRUNCATE TABLE categories CASCADE;

-- =====================================================
-- INSERTAR CATEGORÍAS CON operation_type_id
-- =====================================================

DO $$
DECLARE
  v_operation_type_id UUID;
BEGIN
  -- Obtener el operation_type_id de "Vendo" (o el primero disponible)
  SELECT id INTO v_operation_type_id 
  FROM operation_types 
  WHERE name = 'vendo' OR name = 'Vendo' 
  LIMIT 1;
  
  -- Si no existe "Vendo", tomar el primero disponible
  IF v_operation_type_id IS NULL THEN
    SELECT id INTO v_operation_type_id 
    FROM operation_types 
    ORDER BY sort_order 
    LIMIT 1;
  END IF;

  -- 1. MAQUINARIAS
  INSERT INTO categories (name, display_name, slug, icon, description, sort_order, is_active, ml_keywords, operation_type_id) 
  VALUES ('maquinarias', 'Maquinarias', 'maquinarias', 'Tractor', 
          'Tractores, cosechadoras, implementos y maquinaria agrícola en general', 1, true,
          ARRAY['tractor', 'cosechadora', 'sembradora', 'pulverizadora', 'implemento', 'maquina', 'agricola'],
          v_operation_type_id);

  -- 2. GANADERÍA
  INSERT INTO categories (name, display_name, slug, icon, description, sort_order, is_active, ml_keywords, operation_type_id)
  VALUES ('ganaderia', 'Ganadería', 'ganaderia', 'Beef', 
          'Bovinos, ovinos, equinos, porcinos y otros animales', 2, true,
          ARRAY['ganado', 'vaca', 'toro', 'novillo', 'oveja', 'caballo', 'cerdo', 'animal'],
          v_operation_type_id);

  -- 3. INSUMOS AGROPECUARIOS
  INSERT INTO categories (name, display_name, slug, icon, description, sort_order, is_active, ml_keywords, operation_type_id)
  VALUES ('insumos', 'Insumos Agropecuarios', 'insumos', 'Package', 
          'Semillas, agroquímicos, fertilizantes y otros insumos', 3, true,
          ARRAY['semilla', 'fertilizante', 'herbicida', 'insecticida', 'agroquimico', 'insumo'],
          v_operation_type_id);

  -- 4. INMUEBLES RURALES
  INSERT INTO categories (name, display_name, slug, icon, description, sort_order, is_active, ml_keywords, operation_type_id)
  VALUES ('inmuebles', 'Inmuebles Rurales', 'inmuebles', 'Home', 
          'Campos, estancias, galpones y propiedades rurales', 4, true,
          ARRAY['campo', 'estancia', 'chacra', 'hectarea', 'galpon', 'propiedad', 'rural'],
          v_operation_type_id);

  -- 5. GUÍA DEL CAMPO
  INSERT INTO categories (name, display_name, slug, icon, description, sort_order, is_active, ml_keywords, operation_type_id)
  VALUES ('guia-campo', 'Guía del Campo', 'guia-campo', 'BookOpen', 
          'Servicios, profesionales, empresas y guías del sector agropecuario', 5, true,
          ARRAY['servicio', 'empresa', 'profesional', 'guia', 'asesor', 'contratista'],
          v_operation_type_id);
END $$;

-- =====================================================
-- INSERTAR SUBCATEGORÍAS
-- =====================================================

-- 1. MAQUINARIAS (15 subcategorías)
INSERT INTO subcategories (category_id, name, display_name, slug, icon, sort_order, is_active, has_brands, has_models, has_year, has_condition, ml_keywords)
SELECT id, 'tractores', 'Tractores', 'tractores', 'Tractor', 1, true, true, true, true, true,
       ARRAY['tractor', 'jhon deer', 'case', 'massey', 'new holland']
FROM categories WHERE name = 'maquinarias';

INSERT INTO subcategories (category_id, name, display_name, slug, icon, sort_order, is_active, has_brands, has_models, has_year, has_condition, ml_keywords)
SELECT id, 'cosechadoras', 'Cosechadoras', 'cosechadoras', 'Wheat', 2, true, true, true, true, true,
       ARRAY['cosechadora', 'cosecha', 'axial', 'maicero', 'draper']
FROM categories WHERE name = 'maquinarias';

INSERT INTO subcategories (category_id, name, display_name, slug, icon, sort_order, is_active, has_brands, has_models, has_year, has_condition, ml_keywords)
SELECT id, 'sembradoras', 'Sembradoras', 'sembradoras', 'Sprout', 3, true, true, true, true, true,
       ARRAY['sembradora', 'siembra', 'grano fino', 'grano grueso', 'air drill']
FROM categories WHERE name = 'maquinarias';

INSERT INTO subcategories (category_id, name, display_name, slug, icon, sort_order, is_active, has_brands, has_models, has_year, has_condition, ml_keywords)
SELECT id, 'pulverizadoras', 'Pulverizadoras', 'pulverizadoras', 'Sprout', 4, true, true, true, true, true,
       ARRAY['pulverizadora', 'fumigadora', 'autopropulsada', 'arrastre', 'pulverizar']
FROM categories WHERE name = 'maquinarias';

INSERT INTO subcategories (category_id, name, display_name, slug, icon, sort_order, is_active, has_brands, has_models, has_year, has_condition, ml_keywords)
SELECT id, 'tolvas-acoplados', 'Tolvas y Acoplados', 'tolvas-acoplados', 'Truck', 5, true, true, true, true, true,
       ARRAY['tolva', 'acoplado', 'chasis', 'semirremolque', 'trailer']
FROM categories WHERE name = 'maquinarias';

INSERT INTO subcategories (category_id, name, display_name, slug, icon, sort_order, is_active, has_brands, has_models, has_year, has_condition, ml_keywords)
SELECT id, 'implementos', 'Implementos Agrícolas', 'implementos', 'Wrench', 6, true, true, false, true, true,
       ARRAY['arado', 'rastra', 'cincel', 'rolo', 'cultivador', 'niveladora']
FROM categories WHERE name = 'maquinarias';

INSERT INTO subcategories (category_id, name, display_name, slug, icon, sort_order, is_active, has_brands, has_models, has_year, has_condition, ml_keywords)
SELECT id, 'equipos-riego', 'Equipos de Riego', 'equipos-riego', 'Droplets', 7, true, true, true, true, true,
       ARRAY['riego', 'pivot', 'cañón', 'goteo', 'aspersión', 'bomba']
FROM categories WHERE name = 'maquinarias';

INSERT INTO subcategories (category_id, name, display_name, slug, icon, sort_order, is_active, has_brands, has_models, has_year, has_condition, ml_keywords)
SELECT id, 'cabezales-maiceros', 'Cabezales Maiceros', 'cabezales-maiceros', 'Wheat', 8, true, true, true, true, true,
       ARRAY['maicero', 'cabezal', 'maiz', 'surquero']
FROM categories WHERE name = 'maquinarias';

INSERT INTO subcategories (category_id, name, display_name, slug, icon, sort_order, is_active, has_brands, has_models, has_year, has_condition, ml_keywords)
SELECT id, 'plataformas', 'Plataformas', 'plataformas', 'Grid3x3', 9, true, true, true, true, true,
       ARRAY['plataforma', 'draper', 'flex', 'grano fino', 'soja']
FROM categories WHERE name = 'maquinarias';

INSERT INTO subcategories (category_id, name, display_name, slug, icon, sort_order, is_active, has_brands, has_models, has_year, has_condition, ml_keywords)
SELECT id, 'mixer-alimentacion', 'Mixer y Equipos de Alimentación', 'mixer-alimentacion', 'Beef', 10, true, true, true, true, true,
       ARRAY['mixer', 'mezclador', 'mixer vertical', 'mixer horizontal', 'alimentación']
FROM categories WHERE name = 'maquinarias';

INSERT INTO subcategories (category_id, name, display_name, slug, icon, sort_order, is_active, has_brands, has_models, has_year, has_condition, ml_keywords)
SELECT id, 'rotoenfardadoras', 'Rotoenfardadoras', 'rotoenfardadoras', 'Package', 11, true, true, true, true, true,
       ARRAY['rotoenfardadora', 'enfardadora', 'rollo', 'fardo', 'heno']
FROM categories WHERE name = 'maquinarias';

INSERT INTO subcategories (category_id, name, display_name, slug, icon, sort_order, is_active, has_brands, has_models, has_year, has_condition, ml_keywords)
SELECT id, 'picadoras', 'Picadoras', 'picadoras', 'Scissors', 12, true, true, true, true, true,
       ARRAY['picadora', 'forraje', 'silaje', 'autopropulsada']
FROM categories WHERE name = 'maquinarias';

INSERT INTO subcategories (category_id, name, display_name, slug, icon, sort_order, is_active, has_brands, has_models, has_year, has_condition, ml_keywords)
SELECT id, 'camiones-utilitarios', 'Camiones y Utilitarios', 'camiones-utilitarios', 'Truck', 13, true, true, true, true, true,
       ARRAY['camion', 'camioneta', 'utilitario', 'pickup', '4x4']
FROM categories WHERE name = 'maquinarias';

INSERT INTO subcategories (category_id, name, display_name, slug, icon, sort_order, is_active, has_brands, has_models, has_year, has_condition, ml_keywords)
SELECT id, 'repuestos-accesorios', 'Repuestos y Accesorios', 'repuestos-accesorios', 'Settings', 14, true, true, false, true, false,
       ARRAY['repuesto', 'accesorio', 'pieza', 'recambio', 'filtro', 'correa']
FROM categories WHERE name = 'maquinarias';

INSERT INTO subcategories (category_id, name, display_name, slug, icon, sort_order, is_active, has_brands, has_models, has_year, has_condition, ml_keywords)
SELECT id, 'otros-maquinarias', 'Otros', 'otros-maquinarias', 'MoreHorizontal', 15, true, false, false, true, true,
       ARRAY['maquinaria', 'equipo', 'otro']
FROM categories WHERE name = 'maquinarias';

-- 2. GANADERÍA (7 subcategorías)
INSERT INTO subcategories (category_id, name, display_name, slug, icon, sort_order, is_active, has_brands, has_models, has_year, has_condition, ml_keywords)
SELECT id, 'bovinos', 'Bovinos', 'bovinos', 'Beef', 1, true, false, false, false, false,
       ARRAY['vaca', 'toro', 'novillo', 'ternero', 'vaquillona', 'bovino']
FROM categories WHERE name = 'ganaderia';

INSERT INTO subcategories (category_id, name, display_name, slug, icon, sort_order, is_active, has_brands, has_models, has_year, has_condition, ml_keywords)
SELECT id, 'ovinos', 'Ovinos', 'ovinos', 'Rabbit', 2, true, false, false, false, false,
       ARRAY['oveja', 'carnero', 'cordero', 'ovino', 'lana']
FROM categories WHERE name = 'ganaderia';

INSERT INTO subcategories (category_id, name, display_name, slug, icon, sort_order, is_active, has_brands, has_models, has_year, has_condition, ml_keywords)
SELECT id, 'equinos', 'Equinos', 'equinos', 'Horse', 3, true, false, false, false, false,
       ARRAY['caballo', 'yegua', 'potrillo', 'equino', 'polo']
FROM categories WHERE name = 'ganaderia';

INSERT INTO subcategories (category_id, name, display_name, slug, icon, sort_order, is_active, has_brands, has_models, has_year, has_condition, ml_keywords)
SELECT id, 'porcinos', 'Porcinos', 'porcinos', 'Beef', 4, true, false, false, false, false,
       ARRAY['cerdo', 'chancho', 'lechon', 'porcino', 'capón']
FROM categories WHERE name = 'ganaderia';

INSERT INTO subcategories (category_id, name, display_name, slug, icon, sort_order, is_active, has_brands, has_models, has_year, has_condition, ml_keywords)
SELECT id, 'caprinos', 'Caprinos', 'caprinos', 'Rabbit', 5, true, false, false, false, false,
       ARRAY['cabra', 'chivo', 'caprino']
FROM categories WHERE name = 'ganaderia';

INSERT INTO subcategories (category_id, name, display_name, slug, icon, sort_order, is_active, has_brands, has_models, has_year, has_condition, ml_keywords)
SELECT id, 'aves', 'Aves', 'aves', 'Bird', 6, true, false, false, false, false,
       ARRAY['pollo', 'gallina', 'pato', 'ganso', 'ave', 'huevo']
FROM categories WHERE name = 'ganaderia';

INSERT INTO subcategories (category_id, name, display_name, slug, icon, sort_order, is_active, has_brands, has_models, has_year, has_condition, ml_keywords)
SELECT id, 'otros-animales', 'Otros Animales', 'otros-animales', 'Rabbit', 7, true, false, false, false, false,
       ARRAY['animal', 'otro']
FROM categories WHERE name = 'ganaderia';

-- 3. INSUMOS AGROPECUARIOS (6 subcategorías)
INSERT INTO subcategories (category_id, name, display_name, slug, icon, sort_order, is_active, has_brands, has_models, has_year, has_condition, ml_keywords)
SELECT id, 'semillas', 'Semillas', 'semillas', 'Sprout', 1, true, true, false, false, false,
       ARRAY['semilla', 'soja', 'maiz', 'trigo', 'girasol', 'alfalfa']
FROM categories WHERE name = 'insumos';

INSERT INTO subcategories (category_id, name, display_name, slug, icon, sort_order, is_active, has_brands, has_models, has_year, has_condition, ml_keywords)
SELECT id, 'agroquimicos', 'Agroquímicos', 'agroquimicos', 'Droplets', 2, true, true, false, false, false,
       ARRAY['herbicida', 'insecticida', 'fungicida', 'glifosato', 'agroquimico']
FROM categories WHERE name = 'insumos';

INSERT INTO subcategories (category_id, name, display_name, slug, icon, sort_order, is_active, has_brands, has_models, has_year, has_condition, ml_keywords)
SELECT id, 'fertilizantes', 'Fertilizantes', 'fertilizantes', 'Leaf', 3, true, true, false, false, false,
       ARRAY['fertilizante', 'urea', 'fosfato', 'nitrogeno', 'abono']
FROM categories WHERE name = 'insumos';

INSERT INTO subcategories (category_id, name, display_name, slug, icon, sort_order, is_active, has_brands, has_models, has_year, has_condition, ml_keywords)
SELECT id, 'alimentos-balanceados', 'Alimentos Balanceados', 'alimentos-balanceados', 'Beef', 4, true, true, false, false, false,
       ARRAY['alimento', 'balanceado', 'ración', 'pellet', 'suplemento']
FROM categories WHERE name = 'insumos';

INSERT INTO subcategories (category_id, name, display_name, slug, icon, sort_order, is_active, has_brands, has_models, has_year, has_condition, ml_keywords)
SELECT id, 'veterinaria', 'Productos Veterinarios', 'veterinaria', 'Heart', 5, true, true, false, false, false,
       ARRAY['vacuna', 'antiparasitario', 'antibiotico', 'veterinario', 'sanidad']
FROM categories WHERE name = 'insumos';

INSERT INTO subcategories (category_id, name, display_name, slug, icon, sort_order, is_active, has_brands, has_models, has_year, has_condition, ml_keywords)
SELECT id, 'otros-insumos', 'Otros Insumos', 'otros-insumos', 'Package', 6, true, false, false, false, false,
       ARRAY['insumo', 'otro']
FROM categories WHERE name = 'insumos';

-- 4. INMUEBLES RURALES (7 subcategorías)
INSERT INTO subcategories (category_id, name, display_name, slug, icon, sort_order, is_active, has_brands, has_models, has_year, has_condition, ml_keywords)
SELECT id, 'campos-agricolas', 'Campos Agrícolas', 'campos-agricolas', 'Wheat', 1, true, false, false, false, false,
       ARRAY['campo', 'agricola', 'hectarea', 'ha', 'tierra']
FROM categories WHERE name = 'inmuebles';

INSERT INTO subcategories (category_id, name, display_name, slug, icon, sort_order, is_active, has_brands, has_models, has_year, has_condition, ml_keywords)
SELECT id, 'campos-ganaderos', 'Campos Ganaderos', 'campos-ganaderos', 'Beef', 2, true, false, false, false, false,
       ARRAY['campo', 'ganadero', 'estancia', 'cria', 'invernada']
FROM categories WHERE name = 'inmuebles';

INSERT INTO subcategories (category_id, name, display_name, slug, icon, sort_order, is_active, has_brands, has_models, has_year, has_condition, ml_keywords)
SELECT id, 'campos-mixtos', 'Campos Mixtos', 'campos-mixtos', 'Grid3x3', 3, true, false, false, false, false,
       ARRAY['campo', 'mixto', 'agricola ganadero']
FROM categories WHERE name = 'inmuebles';

INSERT INTO subcategories (category_id, name, display_name, slug, icon, sort_order, is_active, has_brands, has_models, has_year, has_condition, ml_keywords)
SELECT id, 'chacras', 'Chacras', 'chacras', 'Home', 4, true, false, false, false, false,
       ARRAY['chacra', 'quinta', 'huerta']
FROM categories WHERE name = 'inmuebles';

INSERT INTO subcategories (category_id, name, display_name, slug, icon, sort_order, is_active, has_brands, has_models, has_year, has_condition, ml_keywords)
SELECT id, 'galpones', 'Galpones', 'galpones', 'Warehouse', 5, true, false, false, false, false,
       ARRAY['galpon', 'nave', 'tinglado', 'deposito']
FROM categories WHERE name = 'inmuebles';

INSERT INTO subcategories (category_id, name, display_name, slug, icon, sort_order, is_active, has_brands, has_models, has_year, has_condition, ml_keywords)
SELECT id, 'silos-planta-acopio', 'Silos y Plantas de Acopio', 'silos-planta-acopio', 'Factory', 6, true, false, false, false, false,
       ARRAY['silo', 'planta', 'acopio', 'almacenamiento']
FROM categories WHERE name = 'inmuebles';

INSERT INTO subcategories (category_id, name, display_name, slug, icon, sort_order, is_active, has_brands, has_models, has_year, has_condition, ml_keywords)
SELECT id, 'otros-inmuebles', 'Otros Inmuebles', 'otros-inmuebles', 'Home', 7, true, false, false, false, false,
       ARRAY['inmueble', 'propiedad', 'otro']
FROM categories WHERE name = 'inmuebles';

-- 5. GUÍA DEL CAMPO (10 subcategorías)
INSERT INTO subcategories (category_id, name, display_name, slug, icon, sort_order, is_active, has_brands, has_models, has_year, has_condition, ml_keywords)
SELECT id, 'servicios-agricolas', 'Servicios Agrícolas', 'servicios-agricolas', 'Tractor', 1, true, false, false, false, false,
       ARRAY['servicio', 'siembra', 'cosecha', 'pulverizacion', 'contratista']
FROM categories WHERE name = 'guia-campo';

INSERT INTO subcategories (category_id, name, display_name, slug, icon, sort_order, is_active, has_brands, has_models, has_year, has_condition, ml_keywords)
SELECT id, 'transporte-logistica', 'Transporte y Logística', 'transporte-logistica', 'Truck', 2, true, false, false, false, false,
       ARRAY['transporte', 'flete', 'logistica', 'camion']
FROM categories WHERE name = 'guia-campo';

INSERT INTO subcategories (category_id, name, display_name, slug, icon, sort_order, is_active, has_brands, has_models, has_year, has_condition, ml_keywords)
SELECT id, 'talleres-mecanica', 'Talleres y Mecánica', 'talleres-mecanica', 'Wrench', 3, true, false, false, false, false,
       ARRAY['taller', 'mecanica', 'reparacion', 'mantenimiento']
FROM categories WHERE name = 'guia-campo';

INSERT INTO subcategories (category_id, name, display_name, slug, icon, sort_order, is_active, has_brands, has_models, has_year, has_condition, ml_keywords)
SELECT id, 'veterinarias-sanidad', 'Veterinarias y Sanidad', 'veterinarias-sanidad', 'Heart', 4, true, false, false, false, false,
       ARRAY['veterinaria', 'veterinario', 'sanidad', 'salud animal']
FROM categories WHERE name = 'guia-campo';

INSERT INTO subcategories (category_id, name, display_name, slug, icon, sort_order, is_active, has_brands, has_models, has_year, has_condition, ml_keywords)
SELECT id, 'asesores-consultores', 'Asesores y Consultores', 'asesores-consultores', 'Users', 5, true, false, false, false, false,
       ARRAY['asesor', 'consultor', 'agrónomo', 'profesional', 'asesoramiento']
FROM categories WHERE name = 'guia-campo';

INSERT INTO subcategories (category_id, name, display_name, slug, icon, sort_order, is_active, has_brands, has_models, has_year, has_condition, ml_keywords)
SELECT id, 'inmobiliarias-rurales', 'Inmobiliarias Rurales', 'inmobiliarias-rurales', 'Home', 6, true, false, false, false, false,
       ARRAY['inmobiliaria', 'rural', 'campo', 'venta', 'alquiler']
FROM categories WHERE name = 'guia-campo';

INSERT INTO subcategories (category_id, name, display_name, slug, icon, sort_order, is_active, has_brands, has_models, has_year, has_condition, ml_keywords)
SELECT id, 'comercios-agropecuarios', 'Comercios Agropecuarios', 'comercios-agropecuarios', 'Store', 7, true, false, false, false, false,
       ARRAY['comercio', 'agropecuaria', 'forrajeria', 'semilleria', 'veterinaria']
FROM categories WHERE name = 'guia-campo';

INSERT INTO subcategories (category_id, name, display_name, slug, icon, sort_order, is_active, has_brands, has_models, has_year, has_condition, ml_keywords)
SELECT id, 'remates-subastas', 'Remates y Subastas', 'remates-subastas', 'Gavel', 8, true, false, false, false, false,
       ARRAY['remate', 'subasta', 'martillero', 'consignataria']
FROM categories WHERE name = 'guia-campo';

INSERT INTO subcategories (category_id, name, display_name, slug, icon, sort_order, is_active, has_brands, has_models, has_year, has_condition, ml_keywords)
SELECT id, 'acopiadores-cooperativas', 'Acopiadores y Cooperativas', 'acopiadores-cooperativas', 'Users', 9, true, false, false, false, false,
       ARRAY['acopio', 'acopiador', 'cooperativa', 'granos']
FROM categories WHERE name = 'guia-campo';

INSERT INTO subcategories (category_id, name, display_name, slug, icon, sort_order, is_active, has_brands, has_models, has_year, has_condition, ml_keywords)
SELECT id, 'otros-servicios', 'Otros Servicios', 'otros-servicios', 'MoreHorizontal', 10, true, false, false, false, false,
       ARRAY['servicio', 'otro']
FROM categories WHERE name = 'guia-campo';

-- =====================================================
-- ✅ VERIFICACIÓN FINAL
-- =====================================================

DO $$
DECLARE
  total_cats INTEGER;
  total_subcats INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_cats FROM categories;
  SELECT COUNT(*) INTO total_subcats FROM subcategories;
  
  RAISE NOTICE '✅ Seed completado exitosamente';
  RAISE NOTICE '📊 Total categorías: %', total_cats;
  RAISE NOTICE '📋 Total subcategorías: %', total_subcats;
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Categorías creadas:';
  RAISE NOTICE '   1. Maquinarias (15 subcategorías)';
  RAISE NOTICE '   2. Ganadería (7 subcategorías)';
  RAISE NOTICE '   3. Insumos Agropecuarios (6 subcategorías)';
  RAISE NOTICE '   4. Inmuebles Rurales (7 subcategorías)';
  RAISE NOTICE '   5. Guía del Campo (10 subcategorías)';
END $$;
