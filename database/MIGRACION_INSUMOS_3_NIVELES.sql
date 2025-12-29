-- ============================================
-- 🌾 MIGRACIÓN: INSUMOS AGROPECUARIOS (3 NIVELES)
-- Estructura: Subcategoría → Marca → Producto
-- ============================================

-- 1. Crear tabla insumos_subcategorias
CREATE TABLE IF NOT EXISTS insumos_subcategorias (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Crear tabla insumos_marcas
CREATE TABLE IF NOT EXISTS insumos_marcas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Crear tabla insumos_productos (relación N:N con subcategorías)
CREATE TABLE IF NOT EXISTS insumos_productos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subcategoria_id UUID NOT NULL REFERENCES insumos_subcategorias(id) ON DELETE CASCADE,
  marca_id UUID NOT NULL REFERENCES insumos_marcas(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(subcategoria_id, marca_id, name)
);

-- 4. Índices
CREATE INDEX IF NOT EXISTS idx_insumos_subcategorias_active ON insumos_subcategorias(is_active);
CREATE INDEX IF NOT EXISTS idx_insumos_marcas_active ON insumos_marcas(is_active);
CREATE INDEX IF NOT EXISTS idx_insumos_productos_subcategoria ON insumos_productos(subcategoria_id);
CREATE INDEX IF NOT EXISTS idx_insumos_productos_marca ON insumos_productos(marca_id);
CREATE INDEX IF NOT EXISTS idx_insumos_productos_active ON insumos_productos(is_active);

-- 5. Insertar subcategorías iniciales
INSERT INTO insumos_subcategorias (name, display_name, sort_order) VALUES
('semillas', 'Semillas y Plantines', 1),
('fertilizantes', 'Fertilizantes', 2),
('agroquimicos', 'Agroquímicos y Fitosanitarios', 3),
('alimentos_balanceados', 'Alimentos Balanceados', 4),
('veterinaria', 'Productos Veterinarios', 5),
('suplementos', 'Suplementos Nutricionales', 6),
('materiales', 'Materiales y Herramientas', 7),
('riego', 'Sistemas de Riego', 8),
('otros', 'Otros Insumos', 99)
ON CONFLICT (name) DO NOTHING;

-- 6. Verificar
SELECT 
  s.display_name as subcategoria,
  COUNT(DISTINCT m.id) as marcas,
  COUNT(p.id) as productos
FROM insumos_subcategorias s
LEFT JOIN insumos_productos p ON p.subcategoria_id = s.id
LEFT JOIN insumos_marcas m ON p.marca_id = m.id
GROUP BY s.display_name, s.sort_order
ORDER BY s.sort_order;
