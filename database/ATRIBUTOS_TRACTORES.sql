-- ============================================================================
-- ATRIBUTOS DINÁMICOS PARA TRACTORES
-- ============================================================================
-- Este script carga los atributos para la subcategoría "Tractores"
-- Permite testear el formulario dinámico antes de crear la UI de gestión
-- ============================================================================

-- Obtener IDs necesarios
DO $$
DECLARE
  maquinaria_id UUID;
  tractores_id UUID;
BEGIN
  -- Obtener ID de Maquinaria Agrícola
  SELECT id INTO maquinaria_id 
  FROM categories 
  WHERE name = 'maquinaria';
  
  -- Obtener ID de Tractores
  SELECT id INTO tractores_id 
  FROM subcategories 
  WHERE name = 'tractores' AND category_id = maquinaria_id;
  
  -- Verificar que existen
  IF maquinaria_id IS NULL THEN
    RAISE EXCEPTION 'No se encontró la categoría Maquinaria';
  END IF;
  
  IF tractores_id IS NULL THEN
    RAISE EXCEPTION 'No se encontró la subcategoría Tractores';
  END IF;
  
  RAISE NOTICE 'Categoria ID: %, Tractores ID: %', maquinaria_id, tractores_id;
  
  -- ============================================================================
  -- GRUPO 1: INFORMACIÓN GENERAL
  -- ============================================================================
  
  -- Marca (select con opciones comunes)
  INSERT INTO dynamic_attributes (
    category_id, subcategory_id, type_id,
    field_name, field_label, field_type, field_group,
    field_options, is_required, sort_order
  ) VALUES (
    maquinaria_id, tractores_id, NULL,
    'marca', 'Marca', 'select', 'Información General',
    '["John Deere", "New Holland", "Case IH", "Massey Ferguson", "Valtra", "Kubota", "Deutz-Fahr", "Fendt", "Landini", "Otra"]'::jsonb,
    true, 1
  );
  
  -- Modelo
  INSERT INTO dynamic_attributes (
    category_id, subcategory_id, type_id,
    field_name, field_label, field_type, field_group,
    placeholder, is_required, sort_order
  ) VALUES (
    maquinaria_id, tractores_id, NULL,
    'modelo', 'Modelo', 'text', 'Información General',
    'Ej: 6150R, 7630, MF 5710', true, 2
  );
  
  -- Año
  INSERT INTO dynamic_attributes (
    category_id, subcategory_id, type_id,
    field_name, field_label, field_type, field_group,
    min_value, max_value, placeholder, is_required, sort_order
  ) VALUES (
    maquinaria_id, tractores_id, NULL,
    'anio', 'Año', 'number', 'Información General',
    1950, 2025, '2020', true, 3
  );
  
  -- Condición
  INSERT INTO dynamic_attributes (
    category_id, subcategory_id, type_id,
    field_name, field_label, field_type, field_group,
    field_options, is_required, sort_order
  ) VALUES (
    maquinaria_id, tractores_id, NULL,
    'condicion', 'Condición', 'select', 'Información General',
    '["Nuevo", "Usado", "Recondicionado"]'::jsonb,
    true, 4
  );
  
  -- ============================================================================
  -- GRUPO 2: ESPECIFICACIONES TÉCNICAS
  -- ============================================================================
  
  -- Potencia (HP)
  INSERT INTO dynamic_attributes (
    category_id, subcategory_id, type_id,
    field_name, field_label, field_type, field_group,
    min_value, max_value, suffix, placeholder, is_required, 
    help_text, sort_order
  ) VALUES (
    maquinaria_id, tractores_id, NULL,
    'potencia_hp', 'Potencia', 'number', 'Especificaciones Técnicas',
    30, 600, 'HP', '180', true,
    'Potencia del motor en caballos de fuerza (HP)', 10
  );
  
  -- Horas de uso
  INSERT INTO dynamic_attributes (
    category_id, subcategory_id, type_id,
    field_name, field_label, field_type, field_group,
    min_value, suffix, placeholder, is_required,
    help_text, sort_order
  ) VALUES (
    maquinaria_id, tractores_id, NULL,
    'horas_uso', 'Horas de uso', 'number', 'Especificaciones Técnicas',
    0, 'hs', '1200', false,
    'Horas de trabajo registradas (dejar vacío si es nuevo)', 11
  );
  
  -- Tracción
  INSERT INTO dynamic_attributes (
    category_id, subcategory_id, type_id,
    field_name, field_label, field_type, field_group,
    field_options, is_required, sort_order
  ) VALUES (
    maquinaria_id, tractores_id, NULL,
    'traccion', 'Tracción', 'select', 'Especificaciones Técnicas',
    '["2x2", "2x4", "4x4"]'::jsonb,
    true, 12
  );
  
  -- Tipo de combustible
  INSERT INTO dynamic_attributes (
    category_id, subcategory_id, type_id,
    field_name, field_label, field_type, field_group,
    field_options, is_required, sort_order
  ) VALUES (
    maquinaria_id, tractores_id, NULL,
    'combustible', 'Combustible', 'select', 'Especificaciones Técnicas',
    '["Diésel", "Nafta", "Híbrido", "Eléctrico"]'::jsonb,
    true, 13
  );
  
  -- Peso
  INSERT INTO dynamic_attributes (
    category_id, subcategory_id, type_id,
    field_name, field_label, field_type, field_group,
    min_value, suffix, placeholder, is_required, sort_order
  ) VALUES (
    maquinaria_id, tractores_id, NULL,
    'peso', 'Peso', 'number', 'Especificaciones Técnicas',
    500, 'kg', '5500', false, 14
  );
  
  -- ============================================================================
  -- GRUPO 3: CARACTERÍSTICAS Y EQUIPAMIENTO
  -- ============================================================================
  
  -- ¿Tiene cabina?
  INSERT INTO dynamic_attributes (
    category_id, subcategory_id, type_id,
    field_name, field_label, field_type, field_group,
    is_required, sort_order
  ) VALUES (
    maquinaria_id, tractores_id, NULL,
    'tiene_cabina', 'Cabina', 'boolean', 'Características y Equipamiento',
    false, 20
  );
  
  -- Aire acondicionado
  INSERT INTO dynamic_attributes (
    category_id, subcategory_id, type_id,
    field_name, field_label, field_type, field_group,
    is_required, sort_order
  ) VALUES (
    maquinaria_id, tractores_id, NULL,
    'aire_acondicionado', 'Aire acondicionado', 'boolean', 'Características y Equipamiento',
    false, 21
  );
  
  -- Dirección hidráulica
  INSERT INTO dynamic_attributes (
    category_id, subcategory_id, type_id,
    field_name, field_label, field_type, field_group,
    is_required, sort_order
  ) VALUES (
    maquinaria_id, tractores_id, NULL,
    'direccion_hidraulica', 'Dirección hidráulica', 'boolean', 'Características y Equipamiento',
    false, 22
  );
  
  -- Características adicionales (multiselect)
  INSERT INTO dynamic_attributes (
    category_id, subcategory_id, type_id,
    field_name, field_label, field_type, field_group,
    field_options, is_required, 
    help_text, sort_order
  ) VALUES (
    maquinaria_id, tractores_id, NULL,
    'caracteristicas', 'Características adicionales', 'multiselect', 'Características y Equipamiento',
    '["Toma de fuerza", "Enganche tres puntos", "Control remoto", "GPS", "Piloto automático", "Asiento neumático", "Radio/USB", "Luces LED"]'::jsonb,
    false,
    'Selecciona todas las que apliquen', 23
  );
  
  -- ============================================================================
  -- GRUPO 4: OBSERVACIONES
  -- ============================================================================
  
  -- Observaciones adicionales
  INSERT INTO dynamic_attributes (
    category_id, subcategory_id, type_id,
    field_name, field_label, field_type, field_group,
    placeholder, is_required, sort_order
  ) VALUES (
    maquinaria_id, tractores_id, NULL,
    'observaciones', 'Observaciones adicionales', 'textarea', 'Observaciones',
    'Detalles adicionales, mantenimiento reciente, accesorios incluidos, etc.', false, 30
  );
  
END $$;

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================

-- Ver atributos creados
SELECT 
  da.field_group,
  da.field_label,
  da.field_name,
  da.field_type,
  da.is_required,
  da.sort_order,
  CASE 
    WHEN da.field_options IS NOT NULL THEN jsonb_array_length(da.field_options)
    ELSE 0
  END as opciones_count
FROM dynamic_attributes da
JOIN subcategories s ON da.subcategory_id = s.id
WHERE s.name = 'tractores'
ORDER BY da.field_group, da.sort_order;

-- Contar atributos por grupo
SELECT 
  da.field_group,
  COUNT(*) as total_campos,
  SUM(CASE WHEN da.is_required THEN 1 ELSE 0 END) as campos_requeridos
FROM dynamic_attributes da
JOIN subcategories s ON da.subcategory_id = s.id
WHERE s.name = 'tractores'
GROUP BY da.field_group
ORDER BY MIN(da.sort_order);

-- ============================================================================
-- RESULTADO ESPERADO
-- ============================================================================
-- 14 atributos creados:
-- ✓ Información General (4 campos)
-- ✓ Especificaciones Técnicas (5 campos)
-- ✓ Características y Equipamiento (4 campos)
-- ✓ Observaciones (1 campo)
-- ============================================================================

SELECT '✅ Atributos de Tractores cargados exitosamente' as status;
