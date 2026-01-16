-- ============================================================================
-- CATEGORY ICONS TABLE - Gestión de Iconos de Categorías
-- ============================================================================
-- Ejecutar en Supabase SQL Editor
-- Fecha: 15 Enero 2026
-- ============================================================================

-- 1. Crear tabla category_icons
CREATE TABLE IF NOT EXISTS category_icons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  url_light VARCHAR(500) NOT NULL,      -- URL icono para fondo oscuro (Hero)
  url_dark VARCHAR(500),                 -- URL icono para fondo claro (futuro)
  storage_path VARCHAR(300),             -- Path en Supabase Storage bucket:cms
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Crear índice para búsquedas
CREATE INDEX IF NOT EXISTS idx_category_icons_name ON category_icons(name);

-- 3. RLS Policies
ALTER TABLE category_icons ENABLE ROW LEVEL SECURITY;

-- Lectura pública (para mostrar en Hero)
CREATE POLICY "category_icons_public_read" ON category_icons
  FOR SELECT USING (true);

-- CRUD solo para superadmin
CREATE POLICY "category_icons_superadmin_all" ON category_icons
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'superadmin'
    )
  );

-- 4. Migrar iconos existentes desde categories.icon
-- (Solo si hay datos en la columna icon de categories)
INSERT INTO category_icons (name, url_light, storage_path)
SELECT 
  display_name,
  CASE 
    WHEN icon LIKE 'http%' THEN icon
    ELSE '/images/icons/' || icon
  END,
  NULL
FROM categories 
WHERE icon IS NOT NULL 
  AND icon != ''
ON CONFLICT DO NOTHING;

-- 5. Agregar FK a categories (opcional, para futura integración)
-- ALTER TABLE categories ADD COLUMN icon_id UUID REFERENCES category_icons(id);

-- 6. Comentarios de documentación
COMMENT ON TABLE category_icons IS 'Iconos gestionables para categorías del Hero';
COMMENT ON COLUMN category_icons.url_light IS 'URL del icono para fondo oscuro (Hero homepage)';
COMMENT ON COLUMN category_icons.url_dark IS 'URL del icono para fondo claro (futuro)';
COMMENT ON COLUMN category_icons.storage_path IS 'Path en Supabase Storage si fue subido';

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================
-- SELECT * FROM category_icons ORDER BY name;
