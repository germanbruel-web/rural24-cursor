-- =====================================================
-- ESQUEMA DE TABLAS INDEPENDIENTES POR CATEGORÍA
-- Sin relaciones complejas - Cada categoría tiene sus propias tablas
-- =====================================================

-- =====================================================
-- 1. MAQUINARIAS
-- =====================================================

-- Subcategorías de Maquinarias
CREATE TABLE IF NOT EXISTS maquinarias_subcategorias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  display_name VARCHAR(200) NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Marcas de Maquinarias
CREATE TABLE IF NOT EXISTS maquinarias_marcas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  display_name VARCHAR(200) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Modelos de Maquinarias
CREATE TABLE IF NOT EXISTS maquinarias_modelos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subcategoria_id UUID REFERENCES maquinarias_subcategorias(id) ON DELETE CASCADE,
  marca_id UUID REFERENCES maquinarias_marcas(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  display_name VARCHAR(300) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para Maquinarias
CREATE INDEX idx_maquinarias_modelos_subcategoria ON maquinarias_modelos(subcategoria_id);
CREATE INDEX idx_maquinarias_modelos_marca ON maquinarias_modelos(marca_id);


-- =====================================================
-- 2. GANADERÍA
-- =====================================================

-- Subcategorías de Ganadería (Vacas, Caballos, etc.)
CREATE TABLE IF NOT EXISTS ganaderia_subcategorias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  display_name VARCHAR(200) NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Razas de Ganadería
CREATE TABLE IF NOT EXISTS ganaderia_razas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subcategoria_id UUID REFERENCES ganaderia_subcategorias(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  display_name VARCHAR(200) NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para Ganadería
CREATE INDEX idx_ganaderia_razas_subcategoria ON ganaderia_razas(subcategoria_id);


-- =====================================================
-- 3. INMUEBLES RURALES
-- =====================================================

-- Subcategorías de Inmuebles (Campo, Quinta, Fracción)
CREATE TABLE IF NOT EXISTS inmuebles_subcategorias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  display_name VARCHAR(200) NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tipos de Inmuebles (opcional, si necesitas más detalle)
CREATE TABLE IF NOT EXISTS inmuebles_tipos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subcategoria_id UUID REFERENCES inmuebles_subcategorias(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  display_name VARCHAR(200) NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para Inmuebles
CREATE INDEX idx_inmuebles_tipos_subcategoria ON inmuebles_tipos(subcategoria_id);


-- =====================================================
-- 4. INSUMOS AGROPECUARIOS
-- =====================================================

-- Subcategorías de Insumos (Semillas, Fertilizantes, etc.)
CREATE TABLE IF NOT EXISTS insumos_subcategorias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  display_name VARCHAR(200) NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Marcas de Insumos
CREATE TABLE IF NOT EXISTS insumos_marcas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  display_name VARCHAR(200) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Productos de Insumos
CREATE TABLE IF NOT EXISTS insumos_productos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subcategoria_id UUID REFERENCES insumos_subcategorias(id) ON DELETE CASCADE,
  marca_id UUID REFERENCES insumos_marcas(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  display_name VARCHAR(300) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para Insumos
CREATE INDEX idx_insumos_productos_subcategoria ON insumos_productos(subcategoria_id);
CREATE INDEX idx_insumos_productos_marca ON insumos_productos(marca_id);


-- =====================================================
-- 5. GUÍA DEL CAMPO (Servicios)
-- =====================================================

-- Subcategorías de Servicios
CREATE TABLE IF NOT EXISTS servicios_subcategorias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  display_name VARCHAR(200) NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tipos de Servicios
CREATE TABLE IF NOT EXISTS servicios_tipos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subcategoria_id UUID REFERENCES servicios_subcategorias(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  display_name VARCHAR(200) NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para Servicios
CREATE INDEX idx_servicios_tipos_subcategoria ON servicios_tipos(subcategoria_id);


-- =====================================================
-- TRIGGERS PARA AUTO-ACTUALIZAR updated_at
-- =====================================================

-- Función reutilizable
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar a todas las tablas
CREATE TRIGGER update_maquinarias_subcategorias_updated_at BEFORE UPDATE ON maquinarias_subcategorias FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_maquinarias_marcas_updated_at BEFORE UPDATE ON maquinarias_marcas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_maquinarias_modelos_updated_at BEFORE UPDATE ON maquinarias_modelos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ganaderia_subcategorias_updated_at BEFORE UPDATE ON ganaderia_subcategorias FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ganaderia_razas_updated_at BEFORE UPDATE ON ganaderia_razas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inmuebles_subcategorias_updated_at BEFORE UPDATE ON inmuebles_subcategorias FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_inmuebles_tipos_updated_at BEFORE UPDATE ON inmuebles_tipos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_insumos_subcategorias_updated_at BEFORE UPDATE ON insumos_subcategorias FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_insumos_marcas_updated_at BEFORE UPDATE ON insumos_marcas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_insumos_productos_updated_at BEFORE UPDATE ON insumos_productos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_servicios_subcategorias_updated_at BEFORE UPDATE ON servicios_subcategorias FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_servicios_tipos_updated_at BEFORE UPDATE ON servicios_tipos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- =====================================================
-- RLS (ROW LEVEL SECURITY) - Opcional
-- =====================================================

-- Si quieres habilitar RLS:
-- ALTER TABLE maquinarias_subcategorias ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE maquinarias_marcas ENABLE ROW LEVEL SECURITY;
-- etc...

-- Y crear políticas:
-- CREATE POLICY "Permitir lectura pública" ON maquinarias_subcategorias FOR SELECT USING (true);
-- CREATE POLICY "Permitir escritura admin" ON maquinarias_subcategorias FOR ALL USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'superadmin'));


-- =====================================================
-- RESUMEN DE ESTRUCTURA
-- =====================================================

/*

MAQUINARIAS:
  - maquinarias_subcategorias (Tractores, Cosechadoras, etc.)
  - maquinarias_marcas (John Deere, Case IH, etc.)
  - maquinarias_modelos (5075E, 6110M, etc.)

GANADERÍA:
  - ganaderia_subcategorias (Vacas, Caballos, etc.)
  - ganaderia_razas (Angus, Hereford, etc.)

INMUEBLES:
  - inmuebles_subcategorias (Campo, Quinta, etc.)
  - inmuebles_tipos (Agrícola, Ganadero, etc.)

INSUMOS:
  - insumos_subcategorias (Semillas, Fertilizantes, etc.)
  - insumos_marcas (Bayer, Syngenta, etc.)
  - insumos_productos (Roundup, Gramoxone, etc.)

SERVICIOS:
  - servicios_subcategorias (Transporte, Fumigación, etc.)
  - servicios_tipos (Local, Regional, etc.)

*/
