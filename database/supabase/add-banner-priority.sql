-- ============================================
-- Sistema de Priorización de Banners
-- ============================================
-- Permite marcar banners como "primero" para mostrar
-- en homepage al cargar, con estrategia de selección

-- Agregar columnas de prioridad
ALTER TABLE public.banners 
ADD COLUMN IF NOT EXISTS is_priority BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS priority_weight INTEGER DEFAULT 0;

-- Índice para consultas rápidas de banners prioritarios
CREATE INDEX IF NOT EXISTS idx_banners_priority 
ON public.banners(is_priority, priority_weight DESC) 
WHERE is_active = true;

-- Comentarios de documentación
COMMENT ON COLUMN public.banners.is_priority IS 'Marca si el banner tiene prioridad para mostrarse primero en homepage';
COMMENT ON COLUMN public.banners.priority_weight IS 'Peso de prioridad (mayor = más prioridad). 0 = rotación random entre activos';

-- Función para obtener banner prioritario o random
CREATE OR REPLACE FUNCTION get_homepage_banner(
  p_position text DEFAULT 'homepage_search',
  p_category text DEFAULT NULL,
  p_device text DEFAULT 'desktop'
)
RETURNS TABLE (
  id uuid,
  type text,
  title text,
  image_url text,
  link_url text,
  category text,
  position text,
  device_target text,
  is_active boolean,
  display_order integer,
  is_priority boolean,
  priority_weight integer,
  created_at timestamptz
) AS $$
BEGIN
  -- Primero intentar obtener banner prioritario
  RETURN QUERY
  SELECT b.*
  FROM banners b
  WHERE b.is_active = true
    AND b.is_priority = true
    AND b.position = p_position
    AND (p_category IS NULL OR b.category = p_category OR b.category IS NULL)
    AND (b.device_target = p_device OR b.device_target IS NULL)
  ORDER BY b.priority_weight DESC, RANDOM()
  LIMIT 1;
  
  -- Si no hay prioritario, devolver uno random de los activos
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT b.*
    FROM banners b
    WHERE b.is_active = true
      AND b.position = p_position
      AND (p_category IS NULL OR b.category = p_category OR b.category IS NULL)
      AND (b.device_target = p_device OR b.device_target IS NULL)
    ORDER BY RANDOM()
    LIMIT 1;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Verificar columnas agregadas
SELECT 
  column_name, 
  data_type, 
  column_default,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'banners' 
  AND column_name IN ('is_priority', 'priority_weight')
ORDER BY column_name;

-- Estadísticas de banners
SELECT 
  COUNT(*) as total_banners,
  COUNT(*) FILTER (WHERE is_active = true) as banners_activos,
  COUNT(*) FILTER (WHERE is_priority = true) as banners_prioritarios,
  COUNT(*) FILTER (WHERE is_priority = true AND is_active = true) as prioritarios_activos
FROM banners;
