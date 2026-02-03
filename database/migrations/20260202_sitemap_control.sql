-- ============================================================
-- MIGRACIÓN: Campo in_sitemap para control SEO de avisos
-- Rural24 - 2 Feb 2026
-- ============================================================

-- 1. Agregar campo in_sitemap a ads
ALTER TABLE ads ADD COLUMN IF NOT EXISTS in_sitemap BOOLEAN DEFAULT FALSE;
ALTER TABLE ads ADD COLUMN IF NOT EXISTS sitemap_added_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE ads ADD COLUMN IF NOT EXISTS sitemap_added_by UUID REFERENCES users(id);

-- 2. Crear índice para consultas rápidas del sitemap
CREATE INDEX IF NOT EXISTS idx_ads_sitemap ON ads(in_sitemap) WHERE in_sitemap = TRUE;

-- 3. Comentarios de documentación
COMMENT ON COLUMN ads.in_sitemap IS 'Si el aviso debe aparecer en sitemap.xml (SEO). Auto para premium, manual por admin.';
COMMENT ON COLUMN ads.sitemap_added_at IS 'Fecha en que se agregó al sitemap';
COMMENT ON COLUMN ads.sitemap_added_by IS 'Admin que agregó manualmente al sitemap (NULL si fue automático por plan)';

-- 4. Función para auto-agregar avisos premium al sitemap
CREATE OR REPLACE FUNCTION auto_sitemap_for_premium()
RETURNS TRIGGER AS $$
BEGIN
  -- Si el aviso es premium o destacado, agregarlo al sitemap automáticamente
  IF NEW.is_premium = TRUE OR NEW.featured = TRUE THEN
    NEW.in_sitemap := TRUE;
    NEW.sitemap_added_at := NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Trigger para nuevos avisos
DROP TRIGGER IF EXISTS trigger_auto_sitemap ON ads;
CREATE TRIGGER trigger_auto_sitemap
  BEFORE INSERT OR UPDATE OF is_premium, featured ON ads
  FOR EACH ROW
  EXECUTE FUNCTION auto_sitemap_for_premium();

-- 6. Actualizar avisos existentes: agregar al sitemap los premium/destacados
UPDATE ads 
SET 
  in_sitemap = TRUE,
  sitemap_added_at = NOW()
WHERE (is_premium = TRUE OR featured = TRUE)
  AND status = 'active'
  AND approval_status = 'approved'
  AND in_sitemap IS NOT TRUE;

-- 7. Verificación
SELECT 
  COUNT(*) FILTER (WHERE in_sitemap = TRUE) as avisos_en_sitemap,
  COUNT(*) FILTER (WHERE is_premium = TRUE) as avisos_premium,
  COUNT(*) FILTER (WHERE featured = TRUE) as avisos_destacados,
  COUNT(*) as total_avisos
FROM ads
WHERE status = 'active';
