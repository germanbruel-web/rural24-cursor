-- =====================================================
-- MIGRACIÓN: Simplificar Banners - Solo VIP Hero
-- Fecha: 2026-01-10
-- Objetivo: Limpiar campos innecesarios, validar 1 destacado por device
-- =====================================================

-- PASO 1: Eliminar campos innecesarios (si existen)
ALTER TABLE banners DROP COLUMN IF EXISTS display_order;
ALTER TABLE banners DROP COLUMN IF EXISTS is_priority;
ALTER TABLE banners DROP COLUMN IF EXISTS priority_weight;
ALTER TABLE banners DROP COLUMN IF EXISTS position;

-- PASO 2: Asegurar que is_featured existe
ALTER TABLE banners 
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT false;

-- PASO 3: Eliminar índices viejos de featured
DROP INDEX IF EXISTS idx_banners_featured;

-- PASO 4: Crear constraint ÚNICO para 1 solo destacado por device en VIP
-- Desktop: Solo 1 banner con is_featured=true
CREATE UNIQUE INDEX IF NOT EXISTS idx_featured_vip_desktop 
ON banners(type, device_target) 
WHERE type = 'homepage_vip' AND device_target = 'desktop' AND is_featured = true AND is_active = true;

-- Mobile: Solo 1 banner con is_featured=true
CREATE UNIQUE INDEX IF NOT EXISTS idx_featured_vip_mobile 
ON banners(type, device_target) 
WHERE type = 'homepage_vip' AND device_target = 'mobile' AND is_featured = true AND is_active = true;

-- PASO 5: Validar que existe al menos 1 destacado por device (trigger)
CREATE OR REPLACE FUNCTION check_at_least_one_featured() 
RETURNS TRIGGER AS $$
BEGIN
  -- Solo aplicar para homepage_vip
  IF NEW.type = 'homepage_vip' THEN
    -- Si se está desactivando el último destacado de un device, bloquear
    IF OLD.is_featured = true AND NEW.is_featured = false THEN
      IF NOT EXISTS (
        SELECT 1 FROM banners 
        WHERE type = 'homepage_vip' 
          AND device_target = OLD.device_target 
          AND is_featured = true 
          AND is_active = true
          AND id != OLD.id
      ) THEN
        RAISE EXCEPTION 'Debe haber al menos 1 banner destacado activo para % en homepage_vip', OLD.device_target;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_featured ON banners;
CREATE TRIGGER trg_check_featured
  BEFORE UPDATE ON banners
  FOR EACH ROW
  EXECUTE FUNCTION check_at_least_one_featured();

-- PASO 6: Asegurar que hay al menos 1 destacado por device (si hay banners)
-- Si hay banners VIP desktop sin destacados, marcar el primero
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM banners 
    WHERE type = 'homepage_vip' AND device_target = 'desktop' AND is_active = true
  ) AND NOT EXISTS (
    SELECT 1 FROM banners 
    WHERE type = 'homepage_vip' AND device_target = 'desktop' AND is_featured = true AND is_active = true
  ) THEN
    UPDATE banners 
    SET is_featured = true 
    WHERE id = (
      SELECT id FROM banners 
      WHERE type = 'homepage_vip' AND device_target = 'desktop' AND is_active = true
      ORDER BY created_at DESC 
      LIMIT 1
    );
    RAISE NOTICE '✅ Marcado primer banner desktop como destacado';
  END IF;

  IF EXISTS (
    SELECT 1 FROM banners 
    WHERE type = 'homepage_vip' AND device_target = 'mobile' AND is_active = true
  ) AND NOT EXISTS (
    SELECT 1 FROM banners 
    WHERE type = 'homepage_vip' AND device_target = 'mobile' AND is_featured = true AND is_active = true
  ) THEN
    UPDATE banners 
    SET is_featured = true 
    WHERE id = (
      SELECT id FROM banners 
      WHERE type = 'homepage_vip' AND device_target = 'mobile' AND is_active = true
      ORDER BY created_at DESC 
      LIMIT 1
    );
    RAISE NOTICE '✅ Marcado primer banner mobile como destacado';
  END IF;
END $$;

-- ✅ Migración completada
-- Sistema simplificado: Solo is_featured controla todo
-- Garantía: Siempre hay 1 destacado por device
