-- ============================================================================
-- CREACIÓN DE TABLAS V2 PARA SISTEMA DE CATEGORÍAS DINÁMICAS
-- ============================================================================

-- Tabla: categories_v2
CREATE TABLE IF NOT EXISTS categories_v2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE, -- slug (ej: "maquinaria")
  display_name TEXT NOT NULL, -- nombre visible (ej: "Maquinaria Agrícola")
  description TEXT,
  icon TEXT, -- emoji o nombre de icono
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla: subcategories_v2
CREATE TABLE IF NOT EXISTS subcategories_v2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES categories_v2(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- slug (ej: "tractores")
  display_name TEXT NOT NULL, -- nombre visible (ej: "Tractores")
  description TEXT,
  icon TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(category_id, name)
);

-- Tabla: category_types_v2
CREATE TABLE IF NOT EXISTS category_types_v2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES categories_v2(id) ON DELETE CASCADE,
  subcategory_id UUID REFERENCES subcategories_v2(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- slug (ej: "tractor-agricola")
  display_name TEXT NOT NULL, -- nombre visible (ej: "Tractor Agrícola")
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(category_id, subcategory_id, name)
);

-- Tabla: dynamic_attributes
CREATE TABLE IF NOT EXISTS dynamic_attributes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES categories_v2(id) ON DELETE CASCADE,
  subcategory_id UUID REFERENCES subcategories_v2(id) ON DELETE CASCADE,
  type_id UUID REFERENCES category_types_v2(id) ON DELETE CASCADE,
  
  -- Metadatos del campo
  field_name TEXT NOT NULL, -- Nombre técnico (ej: "horsepower")
  field_label TEXT NOT NULL, -- Etiqueta visible (ej: "Potencia (HP)")
  field_type TEXT NOT NULL CHECK (field_type IN ('text', 'number', 'select', 'multiselect', 'boolean', 'date', 'textarea', 'range')),
  field_group TEXT, -- Agrupación (ej: "Especificaciones Técnicas")
  
  -- Opciones para select/multiselect
  field_options JSONB, -- Array de opciones: ["Opción 1", "Opción 2"]
  
  -- Validaciones
  is_required BOOLEAN DEFAULT false,
  min_value NUMERIC,
  max_value NUMERIC,
  validation_regex TEXT,
  
  -- UI
  placeholder TEXT,
  help_text TEXT,
  prefix TEXT, -- Prefijo (ej: "$")
  suffix TEXT, -- Sufijo (ej: "HP", "km")
  sort_order INTEGER DEFAULT 0,
  
  -- Estado
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Un atributo puede estar en categoría, subcategoría o tipo
  CHECK (
    (category_id IS NOT NULL AND subcategory_id IS NULL AND type_id IS NULL) OR
    (category_id IS NOT NULL AND subcategory_id IS NOT NULL AND type_id IS NULL) OR
    (category_id IS NOT NULL AND subcategory_id IS NOT NULL AND type_id IS NOT NULL)
  )
);

-- Índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_subcategories_category ON subcategories_v2(category_id);
CREATE INDEX IF NOT EXISTS idx_types_category ON category_types_v2(category_id);
CREATE INDEX IF NOT EXISTS idx_types_subcategory ON category_types_v2(subcategory_id);
CREATE INDEX IF NOT EXISTS idx_attributes_category ON dynamic_attributes(category_id);
CREATE INDEX IF NOT EXISTS idx_attributes_subcategory ON dynamic_attributes(subcategory_id);
CREATE INDEX IF NOT EXISTS idx_attributes_type ON dynamic_attributes(type_id);

-- ============================================================================
-- DATOS INICIALES: Maquinaria Agrícola
-- ============================================================================

-- Insertar categoría Maquinaria
INSERT INTO categories_v2 (name, display_name, description, icon, sort_order)
VALUES (
  'maquinaria',
  'Maquinaria Agrícola',
  'Equipamiento y maquinaria para el campo',
  '🚜',
  1
)
ON CONFLICT (name) DO NOTHING;

-- Obtener el ID de Maquinaria para las subcategorías
DO $$
DECLARE
  maquinaria_id UUID;
BEGIN
  SELECT id INTO maquinaria_id FROM categories_v2 WHERE name = 'maquinaria';
  
  -- Insertar subcategorías
  INSERT INTO subcategories_v2 (category_id, name, display_name, description, sort_order)
  VALUES 
    (maquinaria_id, 'tractores', 'Tractores', 'Tractores agrícolas de todo tipo', 1),
    (maquinaria_id, 'cosechadoras', 'Cosechadoras', 'Cosechadoras y equipos de cosecha', 2),
    (maquinaria_id, 'pulverizadoras', 'Pulverizadoras', 'Equipos de pulverización', 3),
    (maquinaria_id, 'sembradoras', 'Sembradoras', 'Equipos de siembra', 4),
    (maquinaria_id, 'implementos', 'Implementos', 'Implementos agrícolas varios', 5)
  ON CONFLICT (category_id, name) DO NOTHING;
END $$;

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================

-- Ver categorías creadas
SELECT 
  id,
  name,
  display_name,
  icon,
  is_active,
  sort_order
FROM categories_v2
ORDER BY sort_order;

-- Ver subcategorías creadas
SELECT 
  s.id,
  s.name,
  s.display_name,
  c.display_name as categoria,
  s.is_active,
  s.sort_order
FROM subcategories_v2 s
LEFT JOIN categories_v2 c ON s.category_id = c.id
ORDER BY c.sort_order, s.sort_order;

-- Mensaje de éxito
SELECT '✅ Tablas V2 creadas exitosamente' as status;
