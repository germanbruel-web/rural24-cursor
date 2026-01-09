-- ============================================
-- MEJORAS EN PRECIO: A Convenir + Sin Decimales
-- ============================================

-- 1. Agregar columna price_negotiable
ALTER TABLE public.ads 
ADD COLUMN IF NOT EXISTS price_negotiable BOOLEAN DEFAULT false;

-- 2. Comentario para documentar el campo
COMMENT ON COLUMN public.ads.price_negotiable IS 
'TRUE = Precio a convenir (price puede ser NULL). FALSE = Precio fijo definido.';

-- 3. Trigger para limpiar decimales innecesarios
-- Si price es número redondo (50000.00), guardarlo sin decimales (50000)
CREATE OR REPLACE FUNCTION clean_price_decimals()
RETURNS TRIGGER AS $$
BEGIN
  -- Si price es NOT NULL y es un entero (sin decimales significativos)
  IF NEW.price IS NOT NULL AND NEW.price = FLOOR(NEW.price) THEN
    -- Guardarlo sin decimales
    NEW.price := FLOOR(NEW.price);
  END IF;
  
  -- Si price_negotiable es TRUE, limpiar el precio
  IF NEW.price_negotiable = TRUE THEN
    NEW.price := NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Crear trigger
DROP TRIGGER IF EXISTS trigger_clean_price_decimals ON public.ads;
CREATE TRIGGER trigger_clean_price_decimals
  BEFORE INSERT OR UPDATE ON public.ads
  FOR EACH ROW
  EXECUTE FUNCTION clean_price_decimals();

-- 5. Limpiar precios existentes (migración)
-- Convertir todos los precios redondos a formato sin decimales
UPDATE public.ads
SET price = FLOOR(price)
WHERE price IS NOT NULL 
  AND price = FLOOR(price);

-- 5.1. FORZAR actualización para activar trigger en todos los registros
-- Esto ejecutará el trigger en todos los avisos existentes
UPDATE public.ads
SET price = price
WHERE price IS NOT NULL;

COMMENT ON COLUMN public.ads.price IS 
'Precio en número entero (sin decimales). El trigger clean_price_decimals() limpia automáticamente los .00';

-- 6. Crear índice para búsquedas por precio negociable
CREATE INDEX IF NOT EXISTS idx_ads_price_negotiable 
  ON public.ads(price_negotiable) 
  WHERE price_negotiable = true;

-- 7. Verificar resultados
SELECT 
  id,
  title,
  price,
  price_negotiable,
  currency,
  CASE 
    WHEN price_negotiable THEN 'A Convenir'
    WHEN price IS NULL THEN 'Sin Precio'
    ELSE CONCAT(currency, ' ', price::TEXT)
  END as price_display
FROM public.ads
ORDER BY created_at DESC
LIMIT 10;
