-- Auto-generado: L3 subcategorías faltantes en PROD
-- DEV → PROD sync 2026-03-15
-- Total a insertar: 247

DO $$
DECLARE
  cat_id uuid;
  par_id uuid;
BEGIN

  -- hacienda > acuicultura
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'hacienda';
  SELECT id INTO par_id FROM public.subcategories WHERE slug = 'acuicultura' AND category_id = cat_id;
  IF par_id IS NOT NULL THEN
    INSERT INTO public.subcategories (name, display_name, slug, category_id, parent_id, is_active, sort_order)
    VALUES
      ('acuicultura-algas-marinas', 'Algas marinas', 'acuicultura-algas-marinas', cat_id, par_id, true, 0),
      ('acuicultura-catfish-sudamericano', 'Catfish sudamericano', 'acuicultura-catfish-sudamericano', cat_id, par_id, true, 1),
      ('acuicultura-crayfish-de-agua-dulce', 'Crayfish de agua dulce', 'acuicultura-crayfish-de-agua-dulce', cat_id, par_id, true, 2),
      ('acuicultura-esturion', 'Esturión', 'acuicultura-esturion', cat_id, par_id, true, 3),
      ('acuicultura-langostas', 'Langostas', 'acuicultura-langostas', cat_id, par_id, true, 4),
      ('acuicultura-moluscos', 'Moluscos', 'acuicultura-moluscos', cat_id, par_id, true, 5),
      ('acuicultura-otros', 'Otros', 'acuicultura-otros', cat_id, par_id, true, 6),
      ('acuicultura-pacu', 'Pacú', 'acuicultura-pacu', cat_id, par_id, true, 7),
      ('acuicultura-pejerrey', 'Pejerrey', 'acuicultura-pejerrey', cat_id, par_id, true, 8),
      ('acuicultura-rana', 'Rana', 'acuicultura-rana', cat_id, par_id, true, 9),
      ('acuicultura-salmones', 'Salmones', 'acuicultura-salmones', cat_id, par_id, true, 10),
      ('acuicultura-tilapia', 'Tilapia', 'acuicultura-tilapia', cat_id, par_id, true, 11),
      ('acuicultura-truchas', 'Truchas', 'acuicultura-truchas', cat_id, par_id, true, 12),
      ('acuicultura-truchas-arco-iris', 'Truchas arco iris', 'acuicultura-truchas-arco-iris', cat_id, par_id, true, 13)
    ON CONFLICT (category_id, name) DO NOTHING;
  END IF;

  -- hacienda > avicultura
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'hacienda';
  SELECT id INTO par_id FROM public.subcategories WHERE slug = 'avicultura' AND category_id = cat_id;
  IF par_id IS NOT NULL THEN
    INSERT INTO public.subcategories (name, display_name, slug, category_id, parent_id, is_active, sort_order)
    VALUES
      ('avicultura-codornices', 'Codornices', 'avicultura-codornices', cat_id, par_id, true, 0),
      ('avicultura-faisanes', 'Faisanes', 'avicultura-faisanes', cat_id, par_id, true, 1),
      ('avicultura-gallinas', 'Gallinas', 'avicultura-gallinas', cat_id, par_id, true, 2),
      ('avicultura-otros', 'Otros', 'avicultura-otros', cat_id, par_id, true, 3),
      ('avicultura-patos', 'Patos', 'avicultura-patos', cat_id, par_id, true, 4),
      ('avicultura-pavos', 'Pavos', 'avicultura-pavos', cat_id, par_id, true, 5),
      ('avicultura-perdices', 'Perdices', 'avicultura-perdices', cat_id, par_id, true, 6),
      ('avicultura-pollos', 'Pollos', 'avicultura-pollos', cat_id, par_id, true, 7)
    ON CONFLICT (category_id, name) DO NOTHING;
  END IF;

  -- hacienda > bovinos
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'hacienda';
  SELECT id INTO par_id FROM public.subcategories WHERE slug = 'bovinos' AND category_id = cat_id;
  IF par_id IS NOT NULL THEN
    INSERT INTO public.subcategories (name, display_name, slug, category_id, parent_id, is_active, sort_order)
    VALUES
      ('bovinos-novillitos', 'Novillitos', 'bovinos-novillitos', cat_id, par_id, true, 0),
      ('bovinos-novillos', 'Novillos', 'bovinos-novillos', cat_id, par_id, true, 1),
      ('bovinos-terneras', 'Terneras', 'bovinos-terneras', cat_id, par_id, true, 2),
      ('bovinos-terneros', 'Terneros', 'bovinos-terneros', cat_id, par_id, true, 3),
      ('bovinos-toros', 'Toros', 'bovinos-toros', cat_id, par_id, true, 4),
      ('bovinos-vacas', 'Vacas', 'bovinos-vacas', cat_id, par_id, true, 5),
      ('bovinos-vaquillonas', 'Vaquillonas', 'bovinos-vaquillonas', cat_id, par_id, true, 6)
    ON CONFLICT (category_id, name) DO NOTHING;
  END IF;

  -- hacienda > camelidos
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'hacienda';
  SELECT id INTO par_id FROM public.subcategories WHERE slug = 'camelidos' AND category_id = cat_id;
  IF par_id IS NOT NULL THEN
    INSERT INTO public.subcategories (name, display_name, slug, category_id, parent_id, is_active, sort_order)
    VALUES
      ('camelidos-alpacas', 'Alpacas', 'camelidos-alpacas', cat_id, par_id, true, 0),
      ('camelidos-guanacos', 'Guanacos', 'camelidos-guanacos', cat_id, par_id, true, 1),
      ('camelidos-llamas', 'Llamas', 'camelidos-llamas', cat_id, par_id, true, 2),
      ('camelidos-otros', 'Otros', 'camelidos-otros', cat_id, par_id, true, 3),
      ('camelidos-vicunas', 'Vicuñas', 'camelidos-vicunas', cat_id, par_id, true, 4)
    ON CONFLICT (category_id, name) DO NOTHING;
  END IF;

  -- hacienda > caprinos
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'hacienda';
  SELECT id INTO par_id FROM public.subcategories WHERE slug = 'caprinos' AND category_id = cat_id;
  IF par_id IS NOT NULL THEN
    INSERT INTO public.subcategories (name, display_name, slug, category_id, parent_id, is_active, sort_order)
    VALUES
      ('caprinos-cabras', 'Cabras', 'caprinos-cabras', cat_id, par_id, true, 0),
      ('caprinos-chivos', 'Chivos', 'caprinos-chivos', cat_id, par_id, true, 1),
      ('caprinos-otros', 'Otros', 'caprinos-otros', cat_id, par_id, true, 2)
    ON CONFLICT (category_id, name) DO NOTHING;
  END IF;

  -- maquinaria-agricola > acoplados
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'maquinaria-agricola';
  SELECT id INTO par_id FROM public.subcategories WHERE slug = 'acoplados' AND category_id = cat_id;
  IF par_id IS NOT NULL THEN
    INSERT INTO public.subcategories (name, display_name, slug, category_id, parent_id, is_active, sort_order)
    VALUES
      ('acoplados-balancin', 'Balancín', 'acoplados-balancin', cat_id, par_id, true, 0),
      ('acoplados-carretones', 'Carretones', 'acoplados-carretones', cat_id, par_id, true, 1),
      ('acoplados-cisterna', 'Cisterna', 'acoplados-cisterna', cat_id, par_id, true, 2),
      ('acoplados-fijos', 'Fijos', 'acoplados-fijos', cat_id, par_id, true, 3),
      ('acoplados-forestales', 'Forestales', 'acoplados-forestales', cat_id, par_id, true, 4),
      ('acoplados-forrajeros', 'Forrajeros', 'acoplados-forrajeros', cat_id, par_id, true, 5),
      ('acoplados-jaula', 'Jaula', 'acoplados-jaula', cat_id, par_id, true, 6),
      ('acoplados-multiproposito', 'Multipropósito', 'acoplados-multiproposito', cat_id, par_id, true, 7),
      ('acoplados-otros', 'Otros', 'acoplados-otros', cat_id, par_id, true, 8),
      ('acoplados-paleteros', 'Paleteros', 'acoplados-paleteros', cat_id, par_id, true, 9),
      ('acoplados-playos', 'Playos', 'acoplados-playos', cat_id, par_id, true, 10),
      ('acoplados-taller', 'Taller', 'acoplados-taller', cat_id, par_id, true, 11),
      ('acoplados-tanque', 'Tanque', 'acoplados-tanque', cat_id, par_id, true, 12),
      ('acoplados-trailer', 'Trailer', 'acoplados-trailer', cat_id, par_id, true, 13),
      ('acoplados-volcadores', 'Volcadores', 'acoplados-volcadores', cat_id, par_id, true, 14),
      ('acoplados-volquetes', 'Volquetes', 'acoplados-volquetes', cat_id, par_id, true, 15)
    ON CONFLICT (category_id, name) DO NOTHING;
  END IF;

  -- maquinaria-agricola > arados
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'maquinaria-agricola';
  SELECT id INTO par_id FROM public.subcategories WHERE slug = 'arados' AND category_id = cat_id;
  IF par_id IS NOT NULL THEN
    INSERT INTO public.subcategories (name, display_name, slug, category_id, parent_id, is_active, sort_order)
    VALUES
      ('arados-de-cinceles', 'De cinceles', 'arados-de-cinceles', cat_id, par_id, true, 0),
      ('arados-de-discos', 'De discos', 'arados-de-discos', cat_id, par_id, true, 1),
      ('arados-de-rejas', 'De rejas', 'arados-de-rejas', cat_id, par_id, true, 2),
      ('arados-otros', 'Otros', 'arados-otros', cat_id, par_id, true, 3),
      ('arados-rotativos', 'Rotativos', 'arados-rotativos', cat_id, par_id, true, 4),
      ('arados-subsoladores', 'Subsoladores', 'arados-subsoladores', cat_id, par_id, true, 5),
      ('arados-terraceadores', 'Terraceadores', 'arados-terraceadores', cat_id, par_id, true, 6)
    ON CONFLICT (category_id, name) DO NOTHING;
  END IF;

  -- maquinaria-agricola > arrancadoras
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'maquinaria-agricola';
  SELECT id INTO par_id FROM public.subcategories WHERE slug = 'arrancadoras' AND category_id = cat_id;
  IF par_id IS NOT NULL THEN
    INSERT INTO public.subcategories (name, display_name, slug, category_id, parent_id, is_active, sort_order)
    VALUES
      ('arrancadoras-de-ajos', 'De Ajos', 'arrancadoras-de-ajos', cat_id, par_id, true, 0),
      ('arrancadoras-de-cebollas', 'De Cebollas', 'arrancadoras-de-cebollas', cat_id, par_id, true, 1),
      ('arrancadoras-de-mani', 'De Maní', 'arrancadoras-de-mani', cat_id, par_id, true, 2),
      ('arrancadoras-de-papa', 'De Papa', 'arrancadoras-de-papa', cat_id, par_id, true, 3),
      ('arrancadoras-otras', 'Otras', 'arrancadoras-otras', cat_id, par_id, true, 4)
    ON CONFLICT (category_id, name) DO NOTHING;
  END IF;

  -- maquinaria-agricola > cabezales
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'maquinaria-agricola';
  SELECT id INTO par_id FROM public.subcategories WHERE slug = 'cabezales' AND category_id = cat_id;
  IF par_id IS NOT NULL THEN
    INSERT INTO public.subcategories (name, display_name, slug, category_id, parent_id, is_active, sort_order)
    VALUES
      ('cabezales-draper', 'Draper', 'cabezales-draper', cat_id, par_id, true, 0),
      ('cabezales-girasoleros', 'Girasoleros', 'cabezales-girasoleros', cat_id, par_id, true, 1),
      ('cabezales-maiceros', 'Maiceros', 'cabezales-maiceros', cat_id, par_id, true, 2),
      ('cabezales-otros', 'Otros', 'cabezales-otros', cat_id, par_id, true, 3),
      ('cabezales-para-forrajes', 'Para forrajes', 'cabezales-para-forrajes', cat_id, par_id, true, 4),
      ('cabezales-plataforma-sinfin', 'Plataforma sinfin', 'cabezales-plataforma-sinfin', cat_id, par_id, true, 5)
    ON CONFLICT (category_id, name) DO NOTHING;
  END IF;

  -- maquinaria-agricola > camionetas
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'maquinaria-agricola';
  SELECT id INTO par_id FROM public.subcategories WHERE slug = 'camionetas' AND category_id = cat_id;
  IF par_id IS NOT NULL THEN
    INSERT INTO public.subcategories (name, display_name, slug, category_id, parent_id, is_active, sort_order)
    VALUES
      ('camionetas-autos', 'Autos', 'camionetas-autos', cat_id, par_id, true, 0),
      ('camionetas-cabina-doble', 'Cabina Doble', 'camionetas-cabina-doble', cat_id, par_id, true, 1),
      ('camionetas-cabina-simple', 'Cabina Simple', 'camionetas-cabina-simple', cat_id, par_id, true, 2),
      ('camionetas-otros', 'Otros', 'camionetas-otros', cat_id, par_id, true, 3),
      ('camionetas-vehiculos-utilitarios', 'Vehículos Utilitarios', 'camionetas-vehiculos-utilitarios', cat_id, par_id, true, 4)
    ON CONFLICT (category_id, name) DO NOTHING;
  END IF;

  -- maquinaria-agricola > cinceles
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'maquinaria-agricola';
  SELECT id INTO par_id FROM public.subcategories WHERE slug = 'cinceles' AND category_id = cat_id;
  IF par_id IS NOT NULL THEN
    INSERT INTO public.subcategories (name, display_name, slug, category_id, parent_id, is_active, sort_order)
    VALUES
      ('cinceles-de-arrastre', 'De arrastre', 'cinceles-de-arrastre', cat_id, par_id, true, 0),
      ('cinceles-de-montado', 'De montado', 'cinceles-de-montado', cat_id, par_id, true, 1),
      ('cinceles-de-semi-montado', 'De semi montado', 'cinceles-de-semi-montado', cat_id, par_id, true, 2),
      ('cinceles-otros', 'Otros', 'cinceles-otros', cat_id, par_id, true, 3)
    ON CONFLICT (category_id, name) DO NOTHING;
  END IF;

  -- maquinaria-agricola > cosechadoras
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'maquinaria-agricola';
  SELECT id INTO par_id FROM public.subcategories WHERE slug = 'cosechadoras' AND category_id = cat_id;
  IF par_id IS NOT NULL THEN
    INSERT INTO public.subcategories (name, display_name, slug, category_id, parent_id, is_active, sort_order)
    VALUES
      ('cosechadoras-agricolas', 'Agrícolas', 'cosechadoras-agricolas', cat_id, par_id, true, 0),
      ('cosechadoras-de-aceitunas', 'De aceitunas', 'cosechadoras-de-aceitunas', cat_id, par_id, true, 1),
      ('cosechadoras-de-algodon', 'De algodón', 'cosechadoras-de-algodon', cat_id, par_id, true, 2),
      ('cosechadoras-de-canas', 'De cañas', 'cosechadoras-de-canas', cat_id, par_id, true, 3),
      ('cosechadoras-de-forraje', 'De forraje', 'cosechadoras-de-forraje', cat_id, par_id, true, 4),
      ('cosechadoras-de-mani', 'De Maní', 'cosechadoras-de-mani', cat_id, par_id, true, 5),
      ('cosechadoras-de-papas', 'De papas', 'cosechadoras-de-papas', cat_id, par_id, true, 6),
      ('cosechadoras-otras', 'Otras', 'cosechadoras-otras', cat_id, par_id, true, 7)
    ON CONFLICT (category_id, name) DO NOTHING;
  END IF;

  -- maquinaria-agricola > cosechadoras-agricolas
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'maquinaria-agricola';
  SELECT id INTO par_id FROM public.subcategories WHERE slug = 'cosechadoras-agricolas' AND category_id = cat_id;
  IF par_id IS NOT NULL THEN
    INSERT INTO public.subcategories (name, display_name, slug, category_id, parent_id, is_active, sort_order)
    VALUES
      ('cosechadoras-agricolas-de-traccion-doble', 'De tracción doble', 'cosechadoras-agricolas-de-traccion-doble', cat_id, par_id, true, 0),
      ('cosechadoras-agricolas-de-traccion-simple', 'De tracción simple', 'cosechadoras-agricolas-de-traccion-simple', cat_id, par_id, true, 1),
      ('cosechadoras-agricolas-otras', 'Otras', 'cosechadoras-agricolas-otras', cat_id, par_id, true, 2)
    ON CONFLICT (category_id, name) DO NOTHING;
  END IF;

  -- maquinaria-agricola > desmalezadoras
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'maquinaria-agricola';
  SELECT id INTO par_id FROM public.subcategories WHERE slug = 'desmalezadoras' AND category_id = cat_id;
  IF par_id IS NOT NULL THEN
    INSERT INTO public.subcategories (name, display_name, slug, category_id, parent_id, is_active, sort_order)
    VALUES
      ('desmalezadoras-de-arrastre', 'De arrastre', 'desmalezadoras-de-arrastre', cat_id, par_id, true, 0),
      ('desmalezadoras-de-montado', 'De montado', 'desmalezadoras-de-montado', cat_id, par_id, true, 1),
      ('desmalezadoras-de-semi-montado', 'De semi montado', 'desmalezadoras-de-semi-montado', cat_id, par_id, true, 2),
      ('desmalezadoras-otras', 'Otras', 'desmalezadoras-otras', cat_id, par_id, true, 3)
    ON CONFLICT (category_id, name) DO NOTHING;
  END IF;

  -- maquinaria-agricola > embolsadoras-embutidoras
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'maquinaria-agricola';
  SELECT id INTO par_id FROM public.subcategories WHERE slug = 'embolsadoras-embutidoras' AND category_id = cat_id;
  IF par_id IS NOT NULL THEN
    INSERT INTO public.subcategories (name, display_name, slug, category_id, parent_id, is_active, sort_order)
    VALUES
      ('embolsadoras-embutidoras-de-grano', 'De grano', 'embolsadoras-embutidoras-de-grano', cat_id, par_id, true, 0),
      ('embolsadoras-embutidoras-de-silaje', 'De silaje', 'embolsadoras-embutidoras-de-silaje', cat_id, par_id, true, 1),
      ('embolsadoras-embutidoras-otras', 'Otras', 'embolsadoras-embutidoras-otras', cat_id, par_id, true, 2)
    ON CONFLICT (category_id, name) DO NOTHING;
  END IF;

  -- maquinaria-agricola > escardillos
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'maquinaria-agricola';
  SELECT id INTO par_id FROM public.subcategories WHERE slug = 'escardillos' AND category_id = cat_id;
  IF par_id IS NOT NULL THEN
    INSERT INTO public.subcategories (name, display_name, slug, category_id, parent_id, is_active, sort_order)
    VALUES
      ('escardillos-de-arrastre', 'De arrastre', 'escardillos-de-arrastre', cat_id, par_id, true, 0),
      ('escardillos-de-montado', 'De montado', 'escardillos-de-montado', cat_id, par_id, true, 1),
      ('escardillos-de-semi-montado', 'De semi montado', 'escardillos-de-semi-montado', cat_id, par_id, true, 2),
      ('escardillos-otros', 'Otros', 'escardillos-otros', cat_id, par_id, true, 3)
    ON CONFLICT (category_id, name) DO NOTHING;
  END IF;

  -- maquinaria-agricola > estercoleras
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'maquinaria-agricola';
  SELECT id INTO par_id FROM public.subcategories WHERE slug = 'estercoleras' AND category_id = cat_id;
  IF par_id IS NOT NULL THEN
    INSERT INTO public.subcategories (name, display_name, slug, category_id, parent_id, is_active, sort_order)
    VALUES
      ('estercoleras-de-liquidos', 'De líquidos', 'estercoleras-de-liquidos', cat_id, par_id, true, 0),
      ('estercoleras-de-solidos', 'De sólidos', 'estercoleras-de-solidos', cat_id, par_id, true, 1),
      ('estercoleras-otras', 'Otras', 'estercoleras-otras', cat_id, par_id, true, 2),
      ('estercoleras-removedoras-de-fosas', 'Removedoras de fosas', 'estercoleras-removedoras-de-fosas', cat_id, par_id, true, 3)
    ON CONFLICT (category_id, name) DO NOTHING;
  END IF;

  -- maquinaria-agricola > extractores-de-grano
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'maquinaria-agricola';
  SELECT id INTO par_id FROM public.subcategories WHERE slug = 'extractores-de-grano' AND category_id = cat_id;
  IF par_id IS NOT NULL THEN
    INSERT INTO public.subcategories (name, display_name, slug, category_id, parent_id, is_active, sort_order)
    VALUES
      ('extractores-de-grano-hidraulicos', 'Hidráulicos', 'extractores-de-grano-hidraulicos', cat_id, par_id, true, 0),
      ('extractores-de-grano-mecanicos', 'Mecánicos', 'extractores-de-grano-mecanicos', cat_id, par_id, true, 1),
      ('extractores-de-grano-neumaticos', 'Neumáticos', 'extractores-de-grano-neumaticos', cat_id, par_id, true, 2),
      ('extractores-de-grano-otros', 'Otros', 'extractores-de-grano-otros', cat_id, par_id, true, 3)
    ON CONFLICT (category_id, name) DO NOTHING;
  END IF;

  -- maquinaria-agricola > fertilizadoras
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'maquinaria-agricola';
  SELECT id INTO par_id FROM public.subcategories WHERE slug = 'fertilizadoras' AND category_id = cat_id;
  IF par_id IS NOT NULL THEN
    INSERT INTO public.subcategories (name, display_name, slug, category_id, parent_id, is_active, sort_order)
    VALUES
      ('fertilizadoras-autopropulsadas', 'Autopropulsadas', 'fertilizadoras-autopropulsadas', cat_id, par_id, true, 0),
      ('fertilizadoras-de-arrastre', 'De arrastre', 'fertilizadoras-de-arrastre', cat_id, par_id, true, 1),
      ('fertilizadoras-de-montado', 'De montado', 'fertilizadoras-de-montado', cat_id, par_id, true, 2),
      ('fertilizadoras-otras', 'Otras', 'fertilizadoras-otras', cat_id, par_id, true, 3)
    ON CONFLICT (category_id, name) DO NOTHING;
  END IF;

  -- maquinaria-agricola > gruas
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'maquinaria-agricola';
  SELECT id INTO par_id FROM public.subcategories WHERE slug = 'gruas' AND category_id = cat_id;
  IF par_id IS NOT NULL THEN
    INSERT INTO public.subcategories (name, display_name, slug, category_id, parent_id, is_active, sort_order)
    VALUES
      ('gruas-guinches', 'Guinches', 'gruas-guinches', cat_id, par_id, true, 0),
      ('gruas-hidrogruas', 'Hidrogrúas', 'gruas-hidrogruas', cat_id, par_id, true, 1)
    ON CONFLICT (category_id, name) DO NOTHING;
  END IF;

  -- maquinaria-agricola > maquinaria-forestal
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'maquinaria-agricola';
  SELECT id INTO par_id FROM public.subcategories WHERE slug = 'maquinaria-forestal' AND category_id = cat_id;
  IF par_id IS NOT NULL THEN
    INSERT INTO public.subcategories (name, display_name, slug, category_id, parent_id, is_active, sort_order)
    VALUES
      ('maquinaria-forestal-arrastradores', 'Arrastradores', 'maquinaria-forestal-arrastradores', cat_id, par_id, true, 0),
      ('maquinaria-forestal-cargador-estacionario', 'Cargador Estacionario', 'maquinaria-forestal-cargador-estacionario', cat_id, par_id, true, 1),
      ('maquinaria-forestal-cosechadoras-con-cadenas', 'Cosechadoras con Cadenas', 'maquinaria-forestal-cosechadoras-con-cadenas', cat_id, par_id, true, 2),
      ('maquinaria-forestal-cosechadoras-con-ruedas', 'Cosechadoras con Ruedas', 'maquinaria-forestal-cosechadoras-con-ruedas', cat_id, par_id, true, 3),
      ('maquinaria-forestal-forwarder', 'Forwarder', 'maquinaria-forestal-forwarder', cat_id, par_id, true, 4),
      ('maquinaria-forestal-maquina-forestal-giratoria', 'Maquina Forestal Giratoria', 'maquinaria-forestal-maquina-forestal-giratoria', cat_id, par_id, true, 5),
      ('maquinaria-forestal-talador-apilador-con-ruedas', 'Talador Apilador con Ruedas', 'maquinaria-forestal-talador-apilador-con-ruedas', cat_id, par_id, true, 6),
      ('maquinaria-forestal-taladores-apiladores-con-cadena', 'Taladores Apiladores con Cadena', 'maquinaria-forestal-taladores-apiladores-con-cadena', cat_id, par_id, true, 7),
      ('maquinaria-forestal-transportador-de-troncos', 'Transportador de Troncos', 'maquinaria-forestal-transportador-de-troncos', cat_id, par_id, true, 8)
    ON CONFLICT (category_id, name) DO NOTHING;
  END IF;

  -- maquinaria-agricola > maquinaria-frutihortícola
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'maquinaria-agricola';
  SELECT id INTO par_id FROM public.subcategories WHERE slug = 'maquinaria-frutihortícola' AND category_id = cat_id;
  IF par_id IS NOT NULL THEN
    INSERT INTO public.subcategories (name, display_name, slug, category_id, parent_id, is_active, sort_order)
    VALUES
      ('maquinaria-frutihortícola-atomizadores', 'Atomizadores', 'maquinaria-frutihortícola-atomizadores', cat_id, par_id, true, 0),
      ('maquinaria-frutihortícola-espolvoreadores', 'Espolvoreadores', 'maquinaria-frutihortícola-espolvoreadores', cat_id, par_id, true, 1),
      ('maquinaria-frutihortícola-nebulizadores', 'Nebulizadores', 'maquinaria-frutihortícola-nebulizadores', cat_id, par_id, true, 2),
      ('maquinaria-frutihortícola-pulverizadores', 'Pulverizadores', 'maquinaria-frutihortícola-pulverizadores', cat_id, par_id, true, 3)
    ON CONFLICT (category_id, name) DO NOTHING;
  END IF;

  -- maquinaria-agricola > maquinaria-vial
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'maquinaria-agricola';
  SELECT id INTO par_id FROM public.subcategories WHERE slug = 'maquinaria-vial' AND category_id = cat_id;
  IF par_id IS NOT NULL THEN
    INSERT INTO public.subcategories (name, display_name, slug, category_id, parent_id, is_active, sort_order)
    VALUES
      ('maquinaria-vial-bacheadoras', 'Bacheadoras', 'maquinaria-vial-bacheadoras', cat_id, par_id, true, 0),
      ('maquinaria-vial-balde-procesador-triturador', 'Balde Procesador-Triturador', 'maquinaria-vial-balde-procesador-triturador', cat_id, par_id, true, 1),
      ('maquinaria-vial-barredoras', 'Barredoras', 'maquinaria-vial-barredoras', cat_id, par_id, true, 2),
      ('maquinaria-vial-bateas-regadoras-de-asfalto', 'Bateas Regadoras de Asfalto', 'maquinaria-vial-bateas-regadoras-de-asfalto', cat_id, par_id, true, 3),
      ('maquinaria-vial-cargadoras', 'Cargadoras', 'maquinaria-vial-cargadoras', cat_id, par_id, true, 4),
      ('maquinaria-vial-compactadores', 'Compactadores', 'maquinaria-vial-compactadores', cat_id, par_id, true, 5),
      ('maquinaria-vial-cordonera', 'Cordonera', 'maquinaria-vial-cordonera', cat_id, par_id, true, 6),
      ('maquinaria-vial-cuneteadoras', 'Cuneteadoras', 'maquinaria-vial-cuneteadoras', cat_id, par_id, true, 7),
      ('maquinaria-vial-demarcadoras', 'Demarcadoras', 'maquinaria-vial-demarcadoras', cat_id, par_id, true, 8),
      ('maquinaria-vial-dragalinas', 'Dragalinas', 'maquinaria-vial-dragalinas', cat_id, par_id, true, 9),
      ('maquinaria-vial-dumpers', 'Dumpers', 'maquinaria-vial-dumpers', cat_id, par_id, true, 10),
      ('maquinaria-vial-esparcidor-de-asfalto', 'Esparcidor De Asfalto', 'maquinaria-vial-esparcidor-de-asfalto', cat_id, par_id, true, 11),
      ('maquinaria-vial-excavadoras', 'Excavadoras', 'maquinaria-vial-excavadoras', cat_id, par_id, true, 12),
      ('maquinaria-vial-fresadoras-para-excavadoras', 'Fresadoras para Excavadoras', 'maquinaria-vial-fresadoras-para-excavadoras', cat_id, par_id, true, 13),
      ('maquinaria-vial-fusores-de-asfalto', 'Fusores de Asfalto', 'maquinaria-vial-fusores-de-asfalto', cat_id, par_id, true, 14),
      ('maquinaria-vial-manipuladores-telescopicos', 'Manipuladores telescopicos', 'maquinaria-vial-manipuladores-telescopicos', cat_id, par_id, true, 15),
      ('maquinaria-vial-martillo', 'Martillo', 'maquinaria-vial-martillo', cat_id, par_id, true, 16),
      ('maquinaria-vial-minicargadoras', 'Minicargadoras', 'maquinaria-vial-minicargadoras', cat_id, par_id, true, 17),
      ('maquinaria-vial-miniexcavadoras', 'Miniexcavadoras', 'maquinaria-vial-miniexcavadoras', cat_id, par_id, true, 18),
      ('maquinaria-vial-motocompresores', 'Motocompresores', 'maquinaria-vial-motocompresores', cat_id, par_id, true, 19),
      ('maquinaria-vial-motoniveladoras', 'Motoniveladoras', 'maquinaria-vial-motoniveladoras', cat_id, par_id, true, 20),
      ('maquinaria-vial-otros', 'Otros', 'maquinaria-vial-otros', cat_id, par_id, true, 21),
      ('maquinaria-vial-palas-cargadoras', 'Palas Cargadoras', 'maquinaria-vial-palas-cargadoras', cat_id, par_id, true, 22),
      ('maquinaria-vial-palas-con-retro', 'Palas con Retro', 'maquinaria-vial-palas-con-retro', cat_id, par_id, true, 23),
      ('maquinaria-vial-perfiladores-de-suelos', 'Perfiladores de Suelos', 'maquinaria-vial-perfiladores-de-suelos', cat_id, par_id, true, 24),
      ('maquinaria-vial-perforadoras', 'Perforadoras', 'maquinaria-vial-perforadoras', cat_id, par_id, true, 25),
      ('maquinaria-vial-piloteras', 'Piloteras', 'maquinaria-vial-piloteras', cat_id, par_id, true, 26),
      ('maquinaria-vial-plantas', 'Plantas', 'maquinaria-vial-plantas', cat_id, par_id, true, 27),
      ('maquinaria-vial-plataformas-elevadoras', 'Plataformas elevadoras', 'maquinaria-vial-plataformas-elevadoras', cat_id, par_id, true, 28),
      ('maquinaria-vial-pulvimixer', 'Pulvimixer', 'maquinaria-vial-pulvimixer', cat_id, par_id, true, 29),
      ('maquinaria-vial-reclamadoras', 'Reclamadoras', 'maquinaria-vial-reclamadoras', cat_id, par_id, true, 30),
      ('maquinaria-vial-retroexcavadoras', 'Retroexcavadoras', 'maquinaria-vial-retroexcavadoras', cat_id, par_id, true, 31),
      ('maquinaria-vial-rodillos', 'Rodillos', 'maquinaria-vial-rodillos', cat_id, par_id, true, 32),
      ('maquinaria-vial-terminadoras', 'Terminadoras', 'maquinaria-vial-terminadoras', cat_id, par_id, true, 33),
      ('maquinaria-vial-tiendetubos', 'Tiendetubos', 'maquinaria-vial-tiendetubos', cat_id, par_id, true, 34),
      ('maquinaria-vial-topadoras', 'Topadoras', 'maquinaria-vial-topadoras', cat_id, par_id, true, 35),
      ('maquinaria-vial-trompo-hormigonero', 'Trompo Hormigonero', 'maquinaria-vial-trompo-hormigonero', cat_id, par_id, true, 36),
      ('maquinaria-vial-tuneleras', 'Tuneleras', 'maquinaria-vial-tuneleras', cat_id, par_id, true, 37),
      ('maquinaria-vial-zanjadoras', 'Zanjadoras', 'maquinaria-vial-zanjadoras', cat_id, par_id, true, 38)
    ON CONFLICT (category_id, name) DO NOTHING;
  END IF;

  -- maquinaria-agricola > moledoras-quebradoras
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'maquinaria-agricola';
  SELECT id INTO par_id FROM public.subcategories WHERE slug = 'moledoras-quebradoras' AND category_id = cat_id;
  IF par_id IS NOT NULL THEN
    INSERT INTO public.subcategories (name, display_name, slug, category_id, parent_id, is_active, sort_order)
    VALUES
      ('moledoras-quebradoras-de-granos', 'De granos', 'moledoras-quebradoras-de-granos', cat_id, par_id, true, 0),
      ('moledoras-quebradoras-de-rollos-y-fardos', 'De rollos y fardos', 'moledoras-quebradoras-de-rollos-y-fardos', cat_id, par_id, true, 1),
      ('moledoras-quebradoras-otras', 'Otras', 'moledoras-quebradoras-otras', cat_id, par_id, true, 2)
    ON CONFLICT (category_id, name) DO NOTHING;
  END IF;

  -- maquinaria-agricola > palas
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'maquinaria-agricola';
  SELECT id INTO par_id FROM public.subcategories WHERE slug = 'palas' AND category_id = cat_id;
  IF par_id IS NOT NULL THEN
    INSERT INTO public.subcategories (name, display_name, slug, category_id, parent_id, is_active, sort_order)
    VALUES
      ('palas-cargadora', 'Cargadora', 'palas-cargadora', cat_id, par_id, true, 0),
      ('palas-de-arrastre', 'De arrastre', 'palas-de-arrastre', cat_id, par_id, true, 1),
      ('palas-frontales', 'Frontales', 'palas-frontales', cat_id, par_id, true, 2),
      ('palas-invertidas', 'Invertidas', 'palas-invertidas', cat_id, par_id, true, 3),
      ('palas-otras', 'Otras', 'palas-otras', cat_id, par_id, true, 4)
    ON CONFLICT (category_id, name) DO NOTHING;
  END IF;

  -- maquinaria-agricola > picadora-de-rollos
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'maquinaria-agricola';
  SELECT id INTO par_id FROM public.subcategories WHERE slug = 'picadora-de-rollos' AND category_id = cat_id;
  IF par_id IS NOT NULL THEN
    INSERT INTO public.subcategories (name, display_name, slug, category_id, parent_id, is_active, sort_order)
    VALUES
      ('picadora-de-rollos-autopropulsada', 'Autopropulsada', 'picadora-de-rollos-autopropulsada', cat_id, par_id, true, 0),
      ('picadora-de-rollos-de-arrastre', 'De arrastre', 'picadora-de-rollos-de-arrastre', cat_id, par_id, true, 1),
      ('picadora-de-rollos-otras', 'Otras', 'picadora-de-rollos-otras', cat_id, par_id, true, 2)
    ON CONFLICT (category_id, name) DO NOTHING;
  END IF;

  -- maquinaria-agricola > podadoras
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'maquinaria-agricola';
  SELECT id INTO par_id FROM public.subcategories WHERE slug = 'podadoras' AND category_id = cat_id;
  IF par_id IS NOT NULL THEN
    INSERT INTO public.subcategories (name, display_name, slug, category_id, parent_id, is_active, sort_order)
    VALUES
      ('podadoras-citricos', 'Cítricos', 'podadoras-citricos', cat_id, par_id, true, 0),
      ('podadoras-frutales', 'Frutales', 'podadoras-frutales', cat_id, par_id, true, 1),
      ('podadoras-olivos', 'Olivos', 'podadoras-olivos', cat_id, par_id, true, 2),
      ('podadoras-otra', 'Otra', 'podadoras-otra', cat_id, par_id, true, 3)
    ON CONFLICT (category_id, name) DO NOTHING;
  END IF;

  -- maquinaria-agricola > pulverizadoras
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'maquinaria-agricola';
  SELECT id INTO par_id FROM public.subcategories WHERE slug = 'pulverizadoras' AND category_id = cat_id;
  IF par_id IS NOT NULL THEN
    INSERT INTO public.subcategories (name, display_name, slug, category_id, parent_id, is_active, sort_order)
    VALUES
      ('pulverizadoras-autopropulsadas', 'Autopropulsadas', 'pulverizadoras-autopropulsadas', cat_id, par_id, true, 0),
      ('pulverizadoras-de-arrastre', 'De arrastre', 'pulverizadoras-de-arrastre', cat_id, par_id, true, 1),
      ('pulverizadoras-montadas', 'Montadas', 'pulverizadoras-montadas', cat_id, par_id, true, 2),
      ('pulverizadoras-otras', 'Otras', 'pulverizadoras-otras', cat_id, par_id, true, 3)
    ON CONFLICT (category_id, name) DO NOTHING;
  END IF;

  -- maquinaria-agricola > rastras
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'maquinaria-agricola';
  SELECT id INTO par_id FROM public.subcategories WHERE slug = 'rastras' AND category_id = cat_id;
  IF par_id IS NOT NULL THEN
    INSERT INTO public.subcategories (name, display_name, slug, category_id, parent_id, is_active, sort_order)
    VALUES
      ('rastras-de-doble-accion', 'De doble acción', 'rastras-de-doble-accion', cat_id, par_id, true, 0),
      ('rastras-desencontradas', 'Desencontradas', 'rastras-desencontradas', cat_id, par_id, true, 1),
      ('rastras-excentrica', 'Excentrica', 'rastras-excentrica', cat_id, par_id, true, 2),
      ('rastras-otras', 'Otras', 'rastras-otras', cat_id, par_id, true, 3),
      ('rastras-rotativas', 'Rotativas', 'rastras-rotativas', cat_id, par_id, true, 4)
    ON CONFLICT (category_id, name) DO NOTHING;
  END IF;

  -- maquinaria-agricola > rolos
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'maquinaria-agricola';
  SELECT id INTO par_id FROM public.subcategories WHERE slug = 'rolos' AND category_id = cat_id;
  IF par_id IS NOT NULL THEN
    INSERT INTO public.subcategories (name, display_name, slug, category_id, parent_id, is_active, sort_order)
    VALUES
      ('rolos-otros', 'Otros', 'rolos-otros', cat_id, par_id, true, 3),
      ('rolos-para-desmonte', 'Para Desmonte', 'rolos-para-desmonte', cat_id, par_id, true, 0),
      ('rolos-para-labranza', 'Para Labranza', 'rolos-para-labranza', cat_id, par_id, true, 1),
      ('rolos-pisa-rastrojos', 'Pisa Rastrojos', 'rolos-pisa-rastrojos', cat_id, par_id, true, 2)
    ON CONFLICT (category_id, name) DO NOTHING;
  END IF;

  -- maquinaria-agricola > segadoras
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'maquinaria-agricola';
  SELECT id INTO par_id FROM public.subcategories WHERE slug = 'segadoras' AND category_id = cat_id;
  IF par_id IS NOT NULL THEN
    INSERT INTO public.subcategories (name, display_name, slug, category_id, parent_id, is_active, sort_order)
    VALUES
      ('segadoras-autopropulsadas', 'Autopropulsadas', 'segadoras-autopropulsadas', cat_id, par_id, true, 0),
      ('segadoras-de-arrastre', 'De arrastre', 'segadoras-de-arrastre', cat_id, par_id, true, 1),
      ('segadoras-otras', 'Otras', 'segadoras-otras', cat_id, par_id, true, 2)
    ON CONFLICT (category_id, name) DO NOTHING;
  END IF;

  -- maquinaria-agricola > sembradoras
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'maquinaria-agricola';
  SELECT id INTO par_id FROM public.subcategories WHERE slug = 'sembradoras' AND category_id = cat_id;
  IF par_id IS NOT NULL THEN
    INSERT INTO public.subcategories (name, display_name, slug, category_id, parent_id, is_active, sort_order)
    VALUES
      ('sembradoras-combinadas', 'Combinadas', 'sembradoras-combinadas', cat_id, par_id, true, 0),
      ('sembradoras-de-algodon', 'De algodón', 'sembradoras-de-algodon', cat_id, par_id, true, 1),
      ('sembradoras-de-cobertura', 'De Cobertura', 'sembradoras-de-cobertura', cat_id, par_id, true, 2),
      ('sembradoras-de-grano-fino', 'De grano fino', 'sembradoras-de-grano-fino', cat_id, par_id, true, 3),
      ('sembradoras-de-grano-grueso', 'De grano grueso', 'sembradoras-de-grano-grueso', cat_id, par_id, true, 4),
      ('sembradoras-de-pasturas', 'De pasturas', 'sembradoras-de-pasturas', cat_id, par_id, true, 5),
      ('sembradoras-otras', 'Otras', 'sembradoras-otras', cat_id, par_id, true, 6)
    ON CONFLICT (category_id, name) DO NOTHING;
  END IF;

  -- maquinaria-agricola > semirremolques
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'maquinaria-agricola';
  SELECT id INTO par_id FROM public.subcategories WHERE slug = 'semirremolques' AND category_id = cat_id;
  IF par_id IS NOT NULL THEN
    INSERT INTO public.subcategories (name, display_name, slug, category_id, parent_id, is_active, sort_order)
    VALUES
      ('semirremolques-autodescargables', 'Autodescargables', 'semirremolques-autodescargables', cat_id, par_id, true, 0),
      ('semirremolques-balancin', 'Balancín', 'semirremolques-balancin', cat_id, par_id, true, 1),
      ('semirremolques-baranda-volcable', 'Baranda Volcable', 'semirremolques-baranda-volcable', cat_id, par_id, true, 2),
      ('semirremolques-carretones', 'Carretones', 'semirremolques-carretones', cat_id, par_id, true, 3),
      ('semirremolques-cerealeros', 'Cerealeros', 'semirremolques-cerealeros', cat_id, par_id, true, 4),
      ('semirremolques-cisterna', 'Cisterna', 'semirremolques-cisterna', cat_id, par_id, true, 5),
      ('semirremolques-fijos', 'Fijos', 'semirremolques-fijos', cat_id, par_id, true, 6),
      ('semirremolques-forestales', 'Forestales', 'semirremolques-forestales', cat_id, par_id, true, 7),
      ('semirremolques-forrajeros', 'Forrajeros', 'semirremolques-forrajeros', cat_id, par_id, true, 8),
      ('semirremolques-jaula', 'Jaula', 'semirremolques-jaula', cat_id, par_id, true, 9),
      ('semirremolques-loneros', 'Loneros', 'semirremolques-loneros', cat_id, par_id, true, 10),
      ('semirremolques-multiproposito', 'Multipropósito', 'semirremolques-multiproposito', cat_id, par_id, true, 11),
      ('semirremolques-otros', 'Otros', 'semirremolques-otros', cat_id, par_id, true, 23),
      ('semirremolques-paleteros', 'Paleteros', 'semirremolques-paleteros', cat_id, par_id, true, 12),
      ('semirremolques-playos', 'Playos', 'semirremolques-playos', cat_id, par_id, true, 14),
      ('semirremolques-semilleros', 'Semilleros', 'semirremolques-semilleros', cat_id, par_id, true, 15),
      ('semirremolques-taller', 'Taller', 'semirremolques-taller', cat_id, par_id, true, 16),
      ('semirremolques-tanque', 'Tanque', 'semirremolques-tanque', cat_id, par_id, true, 17),
      ('semirremolques-termicos', 'Térmicos', 'semirremolques-termicos', cat_id, par_id, true, 18),
      ('semirremolques-tolva', 'Tolva', 'semirremolques-tolva', cat_id, par_id, true, 19),
      ('semirremolques-trailer', 'Trailer', 'semirremolques-trailer', cat_id, par_id, true, 20),
      ('semirremolques-volcadores', 'Volcadores', 'semirremolques-volcadores', cat_id, par_id, true, 21),
      ('semirremolques-volquetes', 'Volquetes', 'semirremolques-volquetes', cat_id, par_id, true, 22)
    ON CONFLICT (category_id, name) DO NOTHING;
  END IF;

  -- maquinaria-agricola > subsoladoras
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'maquinaria-agricola';
  SELECT id INTO par_id FROM public.subcategories WHERE slug = 'subsoladoras' AND category_id = cat_id;
  IF par_id IS NOT NULL THEN
    INSERT INTO public.subcategories (name, display_name, slug, category_id, parent_id, is_active, sort_order)
    VALUES
      ('subsoladoras-con-fertilizacion', 'con Fertilización', 'subsoladoras-con-fertilizacion', cat_id, par_id, true, 0),
      ('subsoladoras-otra', 'Otra', 'subsoladoras-otra', cat_id, par_id, true, 3),
      ('subsoladoras-para-cana-de-azucar', 'para Caña de Azúcar', 'subsoladoras-para-cana-de-azucar', cat_id, par_id, true, 1),
      ('subsoladoras-sin-fertilizacion', 'Sin fertilización', 'subsoladoras-sin-fertilizacion', cat_id, par_id, true, 2)
    ON CONFLICT (category_id, name) DO NOTHING;
  END IF;

  -- maquinaria-agricola > tanques-atmosfericos
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'maquinaria-agricola';
  SELECT id INTO par_id FROM public.subcategories WHERE slug = 'tanques-atmosfericos' AND category_id = cat_id;
  IF par_id IS NOT NULL THEN
    INSERT INTO public.subcategories (name, display_name, slug, category_id, parent_id, is_active, sort_order)
    VALUES
      ('tanques-atmosfericos-de-arrastre', 'De arrastre', 'tanques-atmosfericos-de-arrastre', cat_id, par_id, true, 0),
      ('tanques-atmosfericos-otros', 'Otros', 'tanques-atmosfericos-otros', cat_id, par_id, true, 2),
      ('tanques-atmosfericos-sobre-camion', 'Sobre camión', 'tanques-atmosfericos-sobre-camion', cat_id, par_id, true, 1)
    ON CONFLICT (category_id, name) DO NOTHING;
  END IF;

  -- maquinaria-agricola > tolvas
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'maquinaria-agricola';
  SELECT id INTO par_id FROM public.subcategories WHERE slug = 'tolvas' AND category_id = cat_id;
  IF par_id IS NOT NULL THEN
    INSERT INTO public.subcategories (name, display_name, slug, category_id, parent_id, is_active, sort_order)
    VALUES
      ('tolvas-autodescargables', 'Autodescargables', 'tolvas-autodescargables', cat_id, par_id, true, 0),
      ('tolvas-semilleras', 'Semilleras', 'tolvas-semilleras', cat_id, par_id, true, 1)
    ON CONFLICT (category_id, name) DO NOTHING;
  END IF;

  -- maquinaria-agricola > tractores
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'maquinaria-agricola';
  SELECT id INTO par_id FROM public.subcategories WHERE slug = 'tractores' AND category_id = cat_id;
  IF par_id IS NOT NULL THEN
    INSERT INTO public.subcategories (name, display_name, slug, category_id, parent_id, is_active, sort_order)
    VALUES
      ('tractores-agricolas', 'Agricolas', 'tractores-agricolas', cat_id, par_id, true, 0),
      ('tractores-antiguos', 'Antiguos', 'tractores-antiguos', cat_id, par_id, true, 1),
      ('tractores-orugas', 'Orugas', 'tractores-orugas', cat_id, par_id, true, 2),
      ('tractores-otros', 'Otros', 'tractores-otros', cat_id, par_id, true, 4),
      ('tractores-vinateros-y-fruteros', 'Viñateros y fruteros', 'tractores-vinateros-y-fruteros', cat_id, par_id, true, 3)
    ON CONFLICT (category_id, name) DO NOTHING;
  END IF;

  -- maquinaria-agricola > tractores-agricolas
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'maquinaria-agricola';
  SELECT id INTO par_id FROM public.subcategories WHERE slug = 'tractores-agricolas' AND category_id = cat_id;
  IF par_id IS NOT NULL THEN
    INSERT INTO public.subcategories (name, display_name, slug, category_id, parent_id, is_active, sort_order)
    VALUES
      ('tractores-agricolas-articulados', 'Articulados', 'tractores-agricolas-articulados', cat_id, par_id, true, 0),
      ('tractores-agricolas-de-traccion-doble', 'De tracción doble', 'tractores-agricolas-de-traccion-doble', cat_id, par_id, true, 1),
      ('tractores-agricolas-de-traccion-simple', 'De tracción simple', 'tractores-agricolas-de-traccion-simple', cat_id, par_id, true, 2),
      ('tractores-agricolas-otros', 'Otros', 'tractores-agricolas-otros', cat_id, par_id, true, 3)
    ON CONFLICT (category_id, name) DO NOTHING;
  END IF;

END $$;
