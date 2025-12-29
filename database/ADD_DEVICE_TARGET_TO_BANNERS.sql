-- =====================================================
-- MIGRATION: Add device_target column to banners table
-- Fecha: 2024-12-10
-- Descripción: Agregar campo device_target para filtrar banners por dispositivo
-- =====================================================

-- Agregar columna device_target con valor por defecto 'both'
ALTER TABLE banners 
ADD COLUMN IF NOT EXISTS device_target TEXT NOT NULL DEFAULT 'both' 
CHECK (device_target IN ('desktop', 'mobile', 'both'));

-- Crear índices para mejorar las consultas por dispositivo
CREATE INDEX IF NOT EXISTS idx_banners_device_target ON banners(device_target);
CREATE INDEX IF NOT EXISTS idx_banners_type_device_active ON banners(type, device_target, is_active);

-- Comentario de la columna
COMMENT ON COLUMN banners.device_target IS 'Dispositivo objetivo: desktop, mobile o both';

-- Actualizar banners existentes (si los hay) para que estén disponibles en ambos dispositivos
UPDATE banners 
SET device_target = 'both' 
WHERE device_target IS NULL;
