-- =====================================================
-- MIGRACIÓN: Agregar Gestión Temporal de Banners
-- Fecha: 2026-01-10
-- Objetivo: Sistema profesional con fecha de inicio/fin
-- =====================================================

-- PASO 1: Agregar columnas de temporalidad
ALTER TABLE banners 
ADD COLUMN IF NOT EXISTS starts_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- PASO 2: Índice para queries de banners activos con expiración
CREATE INDEX IF NOT EXISTS idx_banners_active_period 
ON banners(type, device_target, is_active, expires_at) 
WHERE is_active = true;

-- PASO 3: Función para auto-desactivar banners expirados (opcional - run diario)
CREATE OR REPLACE FUNCTION auto_deactivate_expired_banners() 
RETURNS void AS $$
BEGIN
  UPDATE banners 
  SET is_active = false
  WHERE is_active = true 
    AND expires_at IS NOT NULL 
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- PASO 4: Comentarios para documentación
COMMENT ON COLUMN banners.starts_at IS 'Fecha/hora inicio de campaña (NULL = inmediato)';
COMMENT ON COLUMN banners.expires_at IS 'Fecha/hora fin de campaña (NULL = sin expiración)';

-- ✅ Migración completada
-- Ahora los banners pueden ser programados y auto-expiran

