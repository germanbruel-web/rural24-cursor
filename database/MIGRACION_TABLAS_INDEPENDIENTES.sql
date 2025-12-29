-- =====================================================
-- MIGRACIÓN DE DATOS A TABLAS INDEPENDIENTES
-- Copia datos desde el esquema actual a las nuevas tablas
-- =====================================================

-- =====================================================
-- 0. DROPEAR TABLAS EXISTENTES Y RECREAR
-- =====================================================

-- Dropear todas las tablas independientes (elimina duplicados y estructura)
DROP TABLE IF EXISTS maquinarias_modelos CASCADE;
DROP TABLE IF EXISTS maquinarias_marcas CASCADE;
DROP TABLE IF EXISTS maquinarias_subcategorias CASCADE;

DROP TABLE IF EXISTS ganaderia_razas CASCADE;
DROP TABLE IF EXISTS ganaderia_subcategorias CASCADE;

DROP TABLE IF EXISTS inmuebles_tipos CASCADE;
DROP TABLE IF EXISTS inmuebles_subcategorias CASCADE;

DROP TABLE IF EXISTS insumos_productos CASCADE;
DROP TABLE IF EXISTS insumos_marcas CASCADE;
DROP TABLE IF EXISTS insumos_subcategorias CASCADE;

DROP TABLE IF EXISTS servicios_tipos CASCADE;
DROP TABLE IF EXISTS servicios_subcategorias CASCADE;

-- Recrear estructura de maquinarias
CREATE TABLE maquinarias_subcategorias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE maquinarias_marcas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE maquinarias_modelos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subcategoria_id UUID NOT NULL REFERENCES maquinarias_subcategorias(id) ON DELETE CASCADE,
  marca_id UUID NOT NULL REFERENCES maquinarias_marcas(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(marca_id, name)
);

-- Recrear estructura de ganadería
CREATE TABLE ganaderia_subcategorias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE ganaderia_razas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subcategoria_id UUID NOT NULL REFERENCES ganaderia_subcategorias(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(subcategoria_id, name)
);

-- Recrear estructura de inmuebles
CREATE TABLE inmuebles_subcategorias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE inmuebles_tipos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subcategoria_id UUID NOT NULL REFERENCES inmuebles_subcategorias(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(subcategoria_id, name)
);

-- Recrear estructura de insumos
CREATE TABLE insumos_subcategorias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE insumos_marcas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE insumos_productos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subcategoria_id UUID NOT NULL REFERENCES insumos_subcategorias(id) ON DELETE CASCADE,
  marca_id UUID NOT NULL REFERENCES insumos_marcas(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(marca_id, name)
);

-- Recrear estructura de servicios
CREATE TABLE servicios_subcategorias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE servicios_tipos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subcategoria_id UUID NOT NULL REFERENCES servicios_subcategorias(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(subcategoria_id, name)
);

-- =====================================================
-- 1. MIGRAR MAQUINARIAS
-- =====================================================

-- Migrar subcategorías de maquinarias
INSERT INTO maquinarias_subcategorias (id, name, display_name, sort_order, is_active, created_at)
SELECT 
  s.id,
  s.name,
  s.display_name,
  s.sort_order,
  s.is_active,
  s.created_at
FROM subcategories s
INNER JOIN categories c ON c.id = s.category_id
WHERE c.name = 'maquinarias'
ON CONFLICT (id) DO NOTHING;

-- Migrar marcas de maquinarias (brands tiene subcategory_id directo)
-- Usar DISTINCT ON para evitar duplicados por nombre
INSERT INTO maquinarias_marcas (id, name, display_name, is_active, created_at)
SELECT DISTINCT ON (b.name)
  b.id,
  b.name,
  b.display_name,
  b.is_active,
  b.created_at
FROM brands b
INNER JOIN subcategories s ON s.id = b.subcategory_id
INNER JOIN categories c ON c.id = s.category_id
WHERE c.name = 'maquinarias'
ORDER BY b.name, b.created_at DESC
ON CONFLICT (name) DO NOTHING;

-- Migrar modelos de maquinarias
-- Solo migrar modelos cuya marca fue migrada a maquinarias_marcas
INSERT INTO maquinarias_modelos (id, subcategoria_id, marca_id, name, display_name, is_active, created_at)
SELECT 
  m.id,
  b.subcategory_id, -- Obtenemos subcategory_id desde brands
  m.brand_id,
  m.name,
  m.display_name,
  m.is_active,
  m.created_at
FROM models m
INNER JOIN brands b ON b.id = m.brand_id
INNER JOIN maquinarias_marcas mm ON mm.id = m.brand_id -- Solo si la marca existe en nueva tabla
INNER JOIN subcategories s ON s.id = b.subcategory_id
INNER JOIN categories c ON c.id = s.category_id
WHERE c.name = 'maquinarias'
ON CONFLICT (id) DO NOTHING;


-- =====================================================
-- 2. MIGRAR GANADERÍA
-- =====================================================

-- Migrar subcategorías de ganadería
INSERT INTO ganaderia_subcategorias (id, name, display_name, sort_order, is_active, created_at)
SELECT 
  s.id,
  s.name,
  s.display_name,
  s.sort_order,
  s.is_active,
  s.created_at
FROM subcategories s
INNER JOIN categories c ON c.id = s.category_id
WHERE c.name = 'ganaderia'
ON CONFLICT (id) DO NOTHING;

-- Migrar razas de ganadería (las "marcas" son razas en ganadería)
INSERT INTO ganaderia_razas (id, subcategoria_id, name, display_name, sort_order, is_active, created_at)
SELECT 
  b.id,
  b.subcategory_id,
  b.name,
  b.display_name,
  0 as sort_order,
  b.is_active,
  b.created_at
FROM brands b
INNER JOIN subcategories s ON s.id = b.subcategory_id
INNER JOIN categories c ON c.id = s.category_id
WHERE c.name = 'ganaderia'
ON CONFLICT (id) DO NOTHING;


-- =====================================================
-- 3. MIGRAR INMUEBLES
-- =====================================================

-- Migrar subcategorías de inmuebles
INSERT INTO inmuebles_subcategorias (id, name, display_name, sort_order, is_active, created_at)
SELECT 
  s.id,
  s.name,
  s.display_name,
  s.sort_order,
  s.is_active,
  s.created_at
FROM subcategories s
INNER JOIN categories c ON c.id = s.category_id
WHERE c.name = 'inmuebles'
ON CONFLICT (id) DO NOTHING;

-- Si inmuebles tiene tipos específicos, migrarlos también
-- (Ajustar según tu estructura actual)


-- =====================================================
-- 4. MIGRAR INSUMOS
-- =====================================================

-- Migrar subcategorías de insumos
INSERT INTO insumos_subcategorias (id, name, display_name, sort_order, is_active, created_at)
SELECT 
  s.id,
  s.name,
  s.display_name,
  s.sort_order,
  s.is_active,
  s.created_at
FROM subcategories s
INNER JOIN categories c ON c.id = s.category_id
WHERE c.name = 'insumos'
ON CONFLICT (id) DO NOTHING;

-- Migrar marcas de insumos (brands tiene subcategory_id directo)
-- Usar DISTINCT ON para evitar duplicados por nombre
INSERT INTO insumos_marcas (id, name, display_name, is_active, created_at)
SELECT DISTINCT ON (b.name)
  b.id,
  b.name,
  b.display_name,
  b.is_active,
  b.created_at
FROM brands b
INNER JOIN subcategories s ON s.id = b.subcategory_id
INNER JOIN categories c ON c.id = s.category_id
WHERE c.name = 'insumos'
ORDER BY b.name, b.created_at DESC
ON CONFLICT (name) DO NOTHING;


-- =====================================================
-- 5. MIGRAR SERVICIOS (Guía del Campo)
-- =====================================================

-- Migrar subcategorías de servicios
INSERT INTO servicios_subcategorias (id, name, display_name, sort_order, is_active, created_at)
SELECT 
  s.id,
  s.name,
  s.display_name,
  s.sort_order,
  s.is_active,
  s.created_at
FROM subcategories s
INNER JOIN categories c ON c.id = s.category_id
WHERE c.name IN ('guia_del_campo', 'servicios')
ON CONFLICT (id) DO NOTHING;


-- =====================================================
-- VERIFICACIÓN POST-MIGRACIÓN
-- =====================================================

-- Ver cuántos registros se migraron
SELECT 
  'Maquinarias - Subcategorías' AS tabla,
  COUNT(*) AS registros
FROM maquinarias_subcategorias

UNION ALL

SELECT 
  'Maquinarias - Marcas' AS tabla,
  COUNT(*) AS registros
FROM maquinarias_marcas

UNION ALL

SELECT 
  'Maquinarias - Modelos' AS tabla,
  COUNT(*) AS registros
FROM maquinarias_modelos

UNION ALL

SELECT 
  'Ganadería - Subcategorías' AS tabla,
  COUNT(*) AS registros
FROM ganaderia_subcategorias

UNION ALL

SELECT 
  'Ganadería - Razas' AS tabla,
  COUNT(*) AS registros
FROM ganaderia_razas

UNION ALL

SELECT 
  'Inmuebles - Subcategorías' AS tabla,
  COUNT(*) AS registros
FROM inmuebles_subcategorias

UNION ALL

SELECT 
  'Insumos - Subcategorías' AS tabla,
  COUNT(*) AS registros
FROM insumos_subcategorias

UNION ALL

SELECT 
  'Insumos - Marcas' AS tabla,
  COUNT(*) AS registros
FROM insumos_marcas

UNION ALL

SELECT 
  'Servicios - Subcategorías' AS tabla,
  COUNT(*) AS registros
FROM servicios_subcategorias;


-- =====================================================
-- OPCIONAL: ELIMINAR TABLAS ANTIGUAS
-- =====================================================

-- ⚠️ PRECAUCIÓN: Esto eliminará las tablas anteriores
-- Solo ejecutar cuando estés 100% seguro

-- DROP TABLE IF EXISTS subcategory_brands CASCADE;
-- DROP TABLE IF EXISTS models CASCADE;
-- DROP TABLE IF EXISTS brands CASCADE;
-- DROP TABLE IF EXISTS subcategories CASCADE;
-- DROP TABLE IF EXISTS categories CASCADE;
