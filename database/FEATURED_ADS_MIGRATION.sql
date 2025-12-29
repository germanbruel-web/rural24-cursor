-- ============================================
-- MIGRACIÓN: Sistema de Avisos Destacados
-- ============================================
-- NOTA: Los campos 'featured' e 'is_premium' ya existen en la BD
-- Solo agregamos campos complementarios para orden manual

-- 1. Agregar SOLO los campos nuevos (featured ya existe)
ALTER TABLE ads 
ADD COLUMN IF NOT EXISTS featured_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS featured_order INTEGER;

-- 2. Índice para performance (query rápida de destacados)
-- USANDO EL CAMPO 'featured' EXISTENTE
CREATE INDEX IF NOT EXISTS idx_ads_featured 
ON ads(featured, category_id, featured_order) 
WHERE featured = TRUE AND status = 'active';

-- 3. RLS Policy: Solo superadmin puede marcar como destacado
CREATE POLICY "Superadmin puede destacar avisos"
ON ads
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'superadmin'
  )
);

-- 4. Función helper: Auto-incrementar featured_order
-- USANDO EL CAMPO 'featured' EXISTENTE
CREATE OR REPLACE FUNCTION set_featured_order()
RETURNS TRIGGER AS $$
BEGIN
  -- Si se marca como destacado y no tiene orden, asignar el siguiente disponible
  IF NEW.featured = TRUE AND NEW.featured_order IS NULL THEN
    SELECT COALESCE(MAX(featured_order), 0) + 1
    INTO NEW.featured_order
    FROM ads
    WHERE category_id = NEW.category_id
    AND featured = TRUE;
    
    NEW.featured_at := NOW();
  END IF;
  
  -- Si se desmarca, limpiar campos
  IF NEW.featured = FALSE THEN
    NEW.featured_order := NULL;
    NEW.featured_at := NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Trigger para auto-gestión
DROP TRIGGER IF EXISTS trigger_set_featured_order ON ads;
CREATE TRIGGER trigger_set_featured_order
BEFORE UPDATE OF featured ON ads
FOR EACH ROW
EXECUTE FUNCTION set_featured_order();

-- ============================================
-- VERIFICACIÓN
-- ============================================
-- SELECT 
--   id, title, category_id, featured, featured_order, featured_at
-- FROM ads
-- WHERE featured = TRUE
-- ORDER BY category_id, featured_order;
