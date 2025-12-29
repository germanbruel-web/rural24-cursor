-- =====================================================
-- MIGRACIÓN: SISTEMA DE CATÁLOGO MAESTRO CON FICHAS TÉCNICAS
-- Fecha: 16 de diciembre, 2025
-- Descripción: Sistema completo para gestionar categorías,
--              marcas, modelos y fichas técnicas precargadas
-- =====================================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- CREATE EXTENSION IF NOT EXISTS "vector"; -- Para pgvector (búsquedas semánticas futuras) - DESHABILITADO: requiere instalación manual en Supabase

-- =====================================================
-- 1. CATEGORÍAS PRINCIPALES
-- =====================================================

CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) UNIQUE NOT NULL,
  display_name VARCHAR(200) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agregar columnas si no existen
ALTER TABLE categories ADD COLUMN IF NOT EXISTS slug VARCHAR(100);
ALTER TABLE categories ADD COLUMN IF NOT EXISTS icon TEXT;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS ml_keywords TEXT[];
ALTER TABLE categories ADD COLUMN IF NOT EXISTS ml_model_version VARCHAR(50);

-- Crear unique constraint si no existe (ignorar si ya existe)
DO $$ BEGIN
  ALTER TABLE categories ADD CONSTRAINT categories_slug_unique UNIQUE (slug);
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

-- =====================================================
-- 2. SUBCATEGORÍAS
-- =====================================================

CREATE TABLE IF NOT EXISTS subcategories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  display_name VARCHAR(200) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agregar columnas si no existen
ALTER TABLE subcategories ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES categories(id) ON DELETE CASCADE;
ALTER TABLE subcategories ADD COLUMN IF NOT EXISTS slug VARCHAR(100);
ALTER TABLE subcategories ADD COLUMN IF NOT EXISTS icon TEXT;
ALTER TABLE subcategories ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE subcategories ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
ALTER TABLE subcategories ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE subcategories ADD COLUMN IF NOT EXISTS has_brands BOOLEAN DEFAULT false;
ALTER TABLE subcategories ADD COLUMN IF NOT EXISTS has_models BOOLEAN DEFAULT false;
ALTER TABLE subcategories ADD COLUMN IF NOT EXISTS has_year BOOLEAN DEFAULT false;
ALTER TABLE subcategories ADD COLUMN IF NOT EXISTS has_condition BOOLEAN DEFAULT false;
ALTER TABLE subcategories ADD COLUMN IF NOT EXISTS ml_keywords TEXT[];

-- Crear unique constraint si no existe
DO $$ BEGIN
  ALTER TABLE subcategories ADD CONSTRAINT subcategories_category_slug_unique UNIQUE (category_id, slug);
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

-- =====================================================
-- 3. TIPOS ESPECÍFICOS (Opcional, tercer nivel)
-- =====================================================

CREATE TABLE IF NOT EXISTS category_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  display_name VARCHAR(200) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agregar columnas si no existen
ALTER TABLE category_types ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES categories(id) ON DELETE CASCADE;
ALTER TABLE category_types ADD COLUMN IF NOT EXISTS subcategory_id UUID REFERENCES subcategories(id) ON DELETE CASCADE;
ALTER TABLE category_types ADD COLUMN IF NOT EXISTS slug VARCHAR(100);
ALTER TABLE category_types ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE category_types ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
ALTER TABLE category_types ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE category_types ADD COLUMN IF NOT EXISTS ml_keywords TEXT[];

-- Crear unique constraint si no existe
DO $$ BEGIN
  ALTER TABLE category_types ADD CONSTRAINT category_types_subcategory_slug_unique UNIQUE (subcategory_id, slug);
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

-- =====================================================
-- 4. MARCAS
-- =====================================================

CREATE TABLE IF NOT EXISTS brands (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(200) NOT NULL,
  display_name VARCHAR(200) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agregar columnas si no existen
ALTER TABLE brands ADD COLUMN IF NOT EXISTS slug VARCHAR(200);
ALTER TABLE brands ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES categories(id);
ALTER TABLE brands ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS country VARCHAR(100);
ALTER TABLE brands ADD COLUMN IF NOT EXISTS ml_aliases TEXT[];
ALTER TABLE brands ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Crear unique constraint si no existe
DO $$ BEGIN
  ALTER TABLE brands ADD CONSTRAINT brands_slug_unique UNIQUE (slug);
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

-- =====================================================
-- 5. RELACIÓN MARCAS ↔ SUBCATEGORÍAS (M2M)
-- =====================================================

CREATE TABLE IF NOT EXISTS subcategory_brands (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subcategory_id UUID NOT NULL REFERENCES subcategories(id) ON DELETE CASCADE,
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(subcategory_id, brand_id)
);

-- =====================================================
-- 6. MODELOS (★ TABLA PRINCIPAL DEL CATÁLOGO ★)
-- =====================================================

CREATE TABLE IF NOT EXISTS models (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(200) NOT NULL,
  display_name VARCHAR(200) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agregar columnas si no existen
ALTER TABLE models ADD COLUMN IF NOT EXISTS brand_id UUID REFERENCES brands(id) ON DELETE CASCADE;
ALTER TABLE models ADD COLUMN IF NOT EXISTS slug VARCHAR(200);
ALTER TABLE models ADD COLUMN IF NOT EXISTS year_from INTEGER;
ALTER TABLE models ADD COLUMN IF NOT EXISTS year_to INTEGER;
ALTER TABLE models ADD COLUMN IF NOT EXISTS is_current_production BOOLEAN DEFAULT true;
ALTER TABLE models ADD COLUMN IF NOT EXISTS specifications JSONB DEFAULT '{}'::jsonb;
ALTER TABLE models ADD COLUMN IF NOT EXISTS features TEXT[];
ALTER TABLE models ADD COLUMN IF NOT EXISTS typical_uses TEXT[];
ALTER TABLE models ADD COLUMN IF NOT EXISTS short_description TEXT;
ALTER TABLE models ADD COLUMN IF NOT EXISTS full_description TEXT;
ALTER TABLE models ADD COLUMN IF NOT EXISTS main_image_url TEXT;
ALTER TABLE models ADD COLUMN IF NOT EXISTS gallery_images TEXT[];
ALTER TABLE models ADD COLUMN IF NOT EXISTS technical_drawing_url TEXT;
ALTER TABLE models ADD COLUMN IF NOT EXISTS brochure_url TEXT;
ALTER TABLE models ADD COLUMN IF NOT EXISTS manual_url TEXT;
ALTER TABLE models ADD COLUMN IF NOT EXISTS spec_sheet_url TEXT;
ALTER TABLE models ADD COLUMN IF NOT EXISTS price_range JSONB DEFAULT '{}'::jsonb;
ALTER TABLE models ADD COLUMN IF NOT EXISTS related_models UUID[];
ALTER TABLE models ADD COLUMN IF NOT EXISTS ai_generated BOOLEAN DEFAULT false;
ALTER TABLE models ADD COLUMN IF NOT EXISTS ai_confidence DECIMAL(3, 2);
ALTER TABLE models ADD COLUMN IF NOT EXISTS ai_source TEXT;
ALTER TABLE models ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT false;
ALTER TABLE models ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES users(id);
ALTER TABLE models ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE models ADD COLUMN IF NOT EXISTS ml_aliases TEXT[];
ALTER TABLE models ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
ALTER TABLE models ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Crear unique constraint si no existe
DO $$ BEGIN
  ALTER TABLE models ADD CONSTRAINT models_brand_slug_unique UNIQUE (brand_id, slug);
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

-- =====================================================
-- 7. ACTUALIZAR TABLA ADS (Avisos)
-- =====================================================

-- NOTA: La tabla ads ya tiene category_id, subcategory_id, brand_id, model_id, year, condition, dynamic_fields
-- Solo agregamos las columnas que faltan:

-- Columna de tercer nivel (tipos específicos)
ALTER TABLE ads ADD COLUMN IF NOT EXISTS category_type_id UUID REFERENCES category_types(id);

-- Vector para búsqueda semántica (futuro) - DESHABILITADO: requiere pgvector
-- ALTER TABLE ads ADD COLUMN IF NOT EXISTS keywords_vector VECTOR(1536);

-- ML score de calidad del aviso (nuevas columnas)
ALTER TABLE ads ADD COLUMN IF NOT EXISTS ml_score DECIMAL(3, 2);
ALTER TABLE ads ADD COLUMN IF NOT EXISTS ml_category_confidence DECIMAL(3, 2);
ALTER TABLE ads ADD COLUMN IF NOT EXISTS ml_enriched BOOLEAN DEFAULT false;
ALTER TABLE ads ADD COLUMN IF NOT EXISTS ml_enrichment_data JSONB DEFAULT '{}'::jsonb;

-- NOTA: La tabla ads mantiene las columnas legacy en TEXT:
-- 'category', 'subcategory', 'brand', 'model' (migrarse gradualmente a usar los IDs)

-- =====================================================
-- 8. LOGS DE PREDICCIONES ML
-- =====================================================

CREATE TABLE IF NOT EXISTS ml_predictions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Tipo de predicción
  prediction_type VARCHAR(50) NOT NULL, -- categorization, pricing, validation, enrichment, etc.
  
  -- Input
  input_data JSONB NOT NULL,
  
  -- Output
  prediction JSONB NOT NULL,
  confidence DECIMAL(3, 2),
  
  -- Modelo usado
  model_name VARCHAR(100), -- gemini-2.0-flash, gpt-4o, etc.
  model_version VARCHAR(50),
  
  -- Asociación (opcional)
  ad_id UUID REFERENCES ads(id),
  user_id UUID REFERENCES users(id),
  model_id_ref UUID REFERENCES models(id), -- _ref para no confundir con model_name
  
  -- Feedback del usuario
  was_accepted BOOLEAN,
  user_feedback TEXT,
  
  -- Performance
  processing_time_ms INTEGER,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 9. DATOS DE ENTRENAMIENTO ML
-- =====================================================

CREATE TABLE IF NOT EXISTS ml_training_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Tipo de dato
  data_type VARCHAR(50) NOT NULL, -- brand_aliases, category_keywords, typo_corrections, etc.
  
  -- Input/Output
  input_value TEXT NOT NULL,
  expected_output JSONB NOT NULL,
  
  -- Metadata
  source VARCHAR(50), -- user_correction, admin_input, auto_generated
  confidence DECIMAL(3, 2),
  
  -- Validación
  is_validated BOOLEAN DEFAULT false,
  validated_by UUID REFERENCES users(id),
  validated_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 10. ÍNDICES OPTIMIZADOS
-- =====================================================

-- Categorías
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_active ON categories(is_active) WHERE is_active = true;

-- Subcategorías
CREATE INDEX IF NOT EXISTS idx_subcategories_category ON subcategories(category_id);
CREATE INDEX IF NOT EXISTS idx_subcategories_slug ON subcategories(category_id, slug);

-- Tipos
CREATE INDEX IF NOT EXISTS idx_category_types_subcategory ON category_types(subcategory_id);

-- Marcas
CREATE INDEX IF NOT EXISTS idx_brands_slug ON brands(slug);
CREATE INDEX IF NOT EXISTS idx_brands_category ON brands(category_id);
CREATE INDEX IF NOT EXISTS idx_brands_active ON brands(is_active) WHERE is_active = true;

-- Modelos
CREATE INDEX IF NOT EXISTS idx_models_brand ON models(brand_id);
CREATE INDEX IF NOT EXISTS idx_models_slug ON models(brand_id, slug);
CREATE INDEX IF NOT EXISTS idx_models_active ON models(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_models_production_years ON models(year_from, year_to);

-- Relación M2M
CREATE INDEX IF NOT EXISTS idx_subcategory_brands_subcategory ON subcategory_brands(subcategory_id);
CREATE INDEX IF NOT EXISTS idx_subcategory_brands_brand ON subcategory_brands(brand_id);

-- Ads (actualizados)
CREATE INDEX IF NOT EXISTS idx_ads_category ON ads(category_id) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_ads_subcategory ON ads(subcategory_id) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_ads_brand ON ads(brand_id) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_ads_model ON ads(model_id) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_ads_brand_model ON ads(brand_id, model_id) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_ads_year ON ads(year) WHERE status = 'active';

-- JSONB (GIN indexes para búsquedas en JSON)
CREATE INDEX IF NOT EXISTS idx_models_specifications ON models USING GIN (specifications);
CREATE INDEX IF NOT EXISTS idx_ads_dynamic_fields ON ads USING GIN (dynamic_fields);

-- Full-Text Search
CREATE INDEX IF NOT EXISTS idx_ads_title_fts ON ads USING GIN (to_tsvector('spanish', title));
CREATE INDEX IF NOT EXISTS idx_ads_description_fts ON ads USING GIN (to_tsvector('spanish', description));

-- Vector Search (pgvector) - DESHABILITADO: requiere pgvector instalado
-- CREATE INDEX IF NOT EXISTS idx_brands_embedding ON brands USING ivfflat (ml_embedding vector_cosine_ops) WITH (lists = 100);
-- CREATE INDEX IF NOT EXISTS idx_models_embedding ON models USING ivfflat (ml_embedding vector_cosine_ops) WITH (lists = 100);
-- CREATE INDEX IF NOT EXISTS idx_ads_keywords_vector ON ads USING ivfflat (keywords_vector vector_cosine_ops) WITH (lists = 100);

-- ML Logs
CREATE INDEX IF NOT EXISTS idx_ml_predictions_type ON ml_predictions(prediction_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ml_predictions_ad ON ml_predictions(ad_id);
CREATE INDEX IF NOT EXISTS idx_ml_predictions_user ON ml_predictions(user_id);

-- =====================================================
-- 11. TRIGGERS PARA UPDATED_AT
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar triggers (eliminar primero si existen)
DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_subcategories_updated_at ON subcategories;
CREATE TRIGGER update_subcategories_updated_at BEFORE UPDATE ON subcategories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_category_types_updated_at ON category_types;
CREATE TRIGGER update_category_types_updated_at BEFORE UPDATE ON category_types
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_brands_updated_at ON brands;
CREATE TRIGGER update_brands_updated_at BEFORE UPDATE ON brands
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_models_updated_at ON models;
CREATE TRIGGER update_models_updated_at BEFORE UPDATE ON models
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 12. VISTAS ÚTILES
-- =====================================================

-- Vista completa de modelos con marca y categoría
CREATE OR REPLACE VIEW models_full AS
SELECT 
  m.*,
  b.name AS brand_name,
  b.display_name AS brand_display_name,
  b.logo_url AS brand_logo_url,
  c.name AS category_name,
  c.display_name AS category_display_name,
  sc.name AS subcategory_name,
  sc.display_name AS subcategory_display_name
FROM models m
JOIN brands b ON m.brand_id = b.id
LEFT JOIN subcategory_brands sb ON b.id = sb.brand_id
LEFT JOIN subcategories sc ON sb.subcategory_id = sc.id
LEFT JOIN categories c ON sc.category_id = c.id;

-- Vista de avisos completa con todas las relaciones
CREATE OR REPLACE VIEW ads_full AS
SELECT 
  a.*,
  c.name AS category_name,
  c.display_name AS category_display_name,
  sc.name AS subcategory_name,
  sc.display_name AS subcategory_display_name,
  ct.name AS type_name,
  ct.display_name AS type_display_name,
  b.name AS brand_name,
  b.display_name AS brand_display_name,
  b.logo_url AS brand_logo_url,
  m.name AS model_name,
  m.display_name AS model_display_name,
  m.specifications AS model_specifications,
  m.main_image_url AS model_main_image,
  u.email AS seller_email,
  u.full_name AS seller_name,
  u.role AS seller_role
FROM ads a
LEFT JOIN categories c ON a.category_id = c.id
LEFT JOIN subcategories sc ON a.subcategory_id = sc.id
LEFT JOIN category_types ct ON a.category_type_id = ct.id
LEFT JOIN brands b ON a.brand_id = b.id
LEFT JOIN models m ON a.model_id = m.id
LEFT JOIN users u ON a.user_id = u.id;

-- Vista de categorías con estadísticas
CREATE OR REPLACE VIEW categories_stats AS
SELECT 
  c.id,
  c.name,
  c.display_name,
  c.icon,
  c.sort_order,
  COUNT(DISTINCT a.id) AS ads_count,
  COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'active') AS active_ads_count,
  COUNT(DISTINCT sc.id) AS subcategories_count,
  COUNT(DISTINCT b.id) AS brands_count,
  COUNT(DISTINCT m.id) AS models_count
FROM categories c
LEFT JOIN subcategories sc ON c.id = sc.category_id
LEFT JOIN subcategory_brands sb ON sc.id = sb.subcategory_id
LEFT JOIN brands b ON sb.brand_id = b.id
LEFT JOIN models m ON b.id = m.brand_id
LEFT JOIN ads a ON c.id = a.category_id
GROUP BY c.id, c.name, c.display_name, c.icon, c.sort_order
ORDER BY c.sort_order;

-- =====================================================
-- 13. RLS POLICIES
-- =====================================================

-- Habilitar RLS en tablas nuevas
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE subcategory_brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE models ENABLE ROW LEVEL SECURITY;
ALTER TABLE ml_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ml_training_data ENABLE ROW LEVEL SECURITY;

-- LECTURA: Todos pueden leer categorías, marcas y modelos (eliminar primero si existen)
DROP POLICY IF EXISTS "Anyone can read categories" ON categories;
CREATE POLICY "Anyone can read categories" ON categories FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Anyone can read subcategories" ON subcategories;
CREATE POLICY "Anyone can read subcategories" ON subcategories FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Anyone can read category_types" ON category_types;
CREATE POLICY "Anyone can read category_types" ON category_types FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Anyone can read brands" ON brands;
CREATE POLICY "Anyone can read brands" ON brands FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Anyone can read subcategory_brands" ON subcategory_brands;
CREATE POLICY "Anyone can read subcategory_brands" ON subcategory_brands FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can read models" ON models;
CREATE POLICY "Anyone can read models" ON models FOR SELECT USING (is_active = true);

-- ESCRITURA: Solo superadmins pueden modificar catálogo
DROP POLICY IF EXISTS "Only superadmins can modify categories" ON categories;
CREATE POLICY "Only superadmins can modify categories" ON categories FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() AND users.role = 'superadmin'
    )
  );

DROP POLICY IF EXISTS "Only superadmins can modify subcategories" ON subcategories;
CREATE POLICY "Only superadmins can modify subcategories" ON subcategories FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() AND users.role = 'superadmin'
    )
  );

DROP POLICY IF EXISTS "Only superadmins can modify brands" ON brands;
CREATE POLICY "Only superadmins can modify brands" ON brands FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() AND users.role = 'superadmin'
    )
  );

DROP POLICY IF EXISTS "Only superadmins can modify models" ON models;
CREATE POLICY "Only superadmins can modify models" ON models FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() AND users.role = 'superadmin'
    )
  );

-- ML Predictions: Los usuarios pueden ver sus propias predicciones
DROP POLICY IF EXISTS "Users can read own predictions" ON ml_predictions;
CREATE POLICY "Users can read own predictions" ON ml_predictions FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "System can insert predictions" ON ml_predictions;
CREATE POLICY "System can insert predictions" ON ml_predictions FOR INSERT
  WITH CHECK (true);

-- Training Data: Solo superadmins
DROP POLICY IF EXISTS "Only superadmins can access training data" ON ml_training_data;
CREATE POLICY "Only superadmins can access training data" ON ml_training_data FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() AND users.role = 'superadmin'
    )
  );

-- =====================================================
-- 14. FUNCIONES ÚTILES
-- =====================================================

-- Función para obtener modelos de una marca
CREATE OR REPLACE FUNCTION get_models_by_brand(brand_slug TEXT)
RETURNS TABLE (
  id UUID,
  name TEXT,
  display_name TEXT,
  year_from INTEGER,
  year_to INTEGER,
  short_description TEXT,
  main_image_url TEXT,
  price_range JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id,
    m.name,
    m.display_name,
    m.year_from,
    m.year_to,
    m.short_description,
    m.main_image_url,
    m.price_range
  FROM models m
  JOIN brands b ON m.brand_id = b.id
  WHERE b.slug = brand_slug
    AND m.is_active = true
  ORDER BY m.display_name;
END;
$$ LANGUAGE plpgsql;

-- Función para buscar modelos por texto
CREATE OR REPLACE FUNCTION search_models(search_term TEXT)
RETURNS TABLE (
  id UUID,
  brand_name TEXT,
  model_name TEXT,
  full_name TEXT,
  category TEXT,
  subcategory TEXT,
  confidence DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id,
    b.display_name AS brand_name,
    m.display_name AS model_name,
    CONCAT(b.display_name, ' ', m.display_name) AS full_name,
    c.display_name AS category,
    sc.display_name AS subcategory,
    CASE 
      WHEN LOWER(m.display_name) = LOWER(search_term) THEN 1.0
      WHEN LOWER(m.display_name) LIKE LOWER('%' || search_term || '%') THEN 0.8
      WHEN search_term = ANY(m.ml_aliases) THEN 0.9
      ELSE 0.5
    END AS confidence
  FROM models m
  JOIN brands b ON m.brand_id = b.id
  LEFT JOIN subcategory_brands sb ON b.id = sb.brand_id
  LEFT JOIN subcategories sc ON sb.subcategory_id = sc.id
  LEFT JOIN categories c ON sc.category_id = c.id
  WHERE m.is_active = true
    AND (
      LOWER(m.display_name) LIKE LOWER('%' || search_term || '%')
      OR LOWER(b.display_name) LIKE LOWER('%' || search_term || '%')
      OR search_term = ANY(m.ml_aliases)
    )
  ORDER BY confidence DESC
  LIMIT 10;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 15. COMENTARIOS EN TABLAS (Documentación)
-- =====================================================

COMMENT ON TABLE categories IS 'Categorías principales del catálogo (Maquinarias, Ganadería, etc.)';
COMMENT ON TABLE subcategories IS 'Subcategorías de segundo nivel (Tractores, Cosechadoras, etc.)';
COMMENT ON TABLE brands IS 'Marcas de productos (John Deere, Case IH, etc.)';
COMMENT ON TABLE models IS 'Modelos específicos con fichas técnicas completas (5075E, etc.)';
COMMENT ON COLUMN models.specifications IS 'Ficha técnica completa en formato JSONB flexible';
COMMENT ON COLUMN models.ai_generated IS 'Si los datos fueron extraídos por IA o cargados manualmente';
COMMENT ON COLUMN models.verified IS 'Si un admin verificó manualmente la precisión de los datos';
COMMENT ON TABLE ml_predictions IS 'Log de todas las predicciones/sugerencias de IA';
COMMENT ON TABLE ml_training_data IS 'Datos de entrenamiento acumulados de correcciones de usuarios';

-- =====================================================
-- ✅ MIGRACIÓN COMPLETADA
-- =====================================================

-- Verificar que todo se creó correctamente
DO $$
BEGIN
  RAISE NOTICE '✅ Migración completada exitosamente';
  RAISE NOTICE '📊 Tablas creadas: categories, subcategories, brands, models, etc.';
  RAISE NOTICE '🔍 Índices creados para performance óptima';
  RAISE NOTICE '🔐 RLS policies configuradas';
  RAISE NOTICE '📈 Vistas y funciones útiles disponibles';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Próximos pasos:';
  RAISE NOTICE '   1. Ejecutar seed de categorías (SEED_CATEGORIES.sql)';
  RAISE NOTICE '   2. Cargar marcas principales';
  RAISE NOTICE '   3. Empezar a cargar modelos con IA Assistant';
END $$;
