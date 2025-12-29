-- Migration: Add brand, model, year, and condition fields to ads table
-- Date: 2025-12-13
-- Description: Adds fields to store product details (brand, model, year, condition)

-- Add brand field (marca del producto)
ALTER TABLE ads ADD COLUMN IF NOT EXISTS brand TEXT;

-- Add model field (modelo del producto)
ALTER TABLE ads ADD COLUMN IF NOT EXISTS model TEXT;

-- Add year field (año del producto)
ALTER TABLE ads ADD COLUMN IF NOT EXISTS year TEXT;

-- Add condition field (condición: Nuevo, Usado, Reconstruido, etc.)
ALTER TABLE ads ADD COLUMN IF NOT EXISTS condition TEXT;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_ads_brand ON ads(brand);
CREATE INDEX IF NOT EXISTS idx_ads_model ON ads(model);
CREATE INDEX IF NOT EXISTS idx_ads_year ON ads(year);
CREATE INDEX IF NOT EXISTS idx_ads_condition ON ads(condition);

-- Add comment to document the fields
COMMENT ON COLUMN ads.brand IS 'Marca del producto (ej: John Deere, Massey Ferguson)';
COMMENT ON COLUMN ads.model IS 'Modelo del producto (ej: 5075E, 4283)';
COMMENT ON COLUMN ads.year IS 'Año de fabricación o modelo';
COMMENT ON COLUMN ads.condition IS 'Condición del producto (Nuevo, Usado, Reconstruido, etc.)';
