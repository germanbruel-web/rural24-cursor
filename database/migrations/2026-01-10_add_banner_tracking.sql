-- =====================================================
-- MIGRACIÓN: Agregar tracking y funciones RPC
-- Fecha: 2026-01-10
-- Objetivo: Añadir contadores y funciones de tracking
-- =====================================================

-- PASO 1: Agregar columnas de tracking
ALTER TABLE banners_clean 
ADD COLUMN IF NOT EXISTS impressions INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS clicks INTEGER DEFAULT 0;

-- PASO 2: Función para incrementar impresiones
CREATE OR REPLACE FUNCTION increment_banner_impression(banner_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE banners_clean 
  SET impressions = COALESCE(impressions, 0) + 1
  WHERE id = banner_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PASO 3: Función para incrementar clics
CREATE OR REPLACE FUNCTION increment_banner_click(banner_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE banners_clean
  SET clicks = COALESCE(clicks, 0) + 1
  WHERE id = banner_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ✅ Funciones de tracking agregadas
