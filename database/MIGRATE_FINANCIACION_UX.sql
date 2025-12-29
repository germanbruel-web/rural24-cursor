-- ================================================================
-- MIGRACIÓN: Actualizar campos de financiación para nueva UX
-- Fecha: 2025-12-12
-- Descripción: Actualizar campos de financiación en tabla ads
--              para reflejar nuevo diseño de UX con Si/No y cuotas
-- ================================================================

-- 1. Agregar TODOS los campos de condiciones comerciales si no existen
-- Ejecutar cada ALTER TABLE por separado para mejor control de errores
DO $$ 
BEGIN
    -- Descuento pago contado
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ads' AND column_name = 'discount') THEN
        ALTER TABLE ads ADD COLUMN discount DECIMAL(5, 2);
    END IF;
    
    -- Tiene financiación
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ads' AND column_name = 'tiene_financiacion') THEN
        ALTER TABLE ads ADD COLUMN tiene_financiacion BOOLEAN DEFAULT FALSE;
    END IF;
    
    -- Cuotas disponibles (usando JSONB en lugar de INTEGER[] para mejor compatibilidad)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ads' AND column_name = 'cuotas_disponibles') THEN
        ALTER TABLE ads ADD COLUMN cuotas_disponibles JSONB DEFAULT '[]'::jsonb;
    END IF;
    
    -- Entrega inmediata
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ads' AND column_name = 'entrega_inmediata') THEN
        ALTER TABLE ads ADD COLUMN entrega_inmediata BOOLEAN DEFAULT FALSE;
    END IF;
    
    -- Canje por usado
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ads' AND column_name = 'canje_usado') THEN
        ALTER TABLE ads ADD COLUMN canje_usado BOOLEAN DEFAULT FALSE;
    END IF;
    
    -- Canje por cereal
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ads' AND column_name = 'canje_cereal') THEN
        ALTER TABLE ads ADD COLUMN canje_cereal BOOLEAN DEFAULT FALSE;
    END IF;
    
    -- Envío incluido
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ads' AND column_name = 'envio_incluido') THEN
        ALTER TABLE ads ADD COLUMN envio_incluido BOOLEAN DEFAULT FALSE;
    END IF;
    
    -- Envío hasta X km
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ads' AND column_name = 'envio_km') THEN
        ALTER TABLE ads ADD COLUMN envio_km VARCHAR(10);
    END IF;
END $$;

-- Comentarios para documentación
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ads' AND column_name = 'discount') THEN
        COMMENT ON COLUMN ads.discount IS '% de descuento por pago contado';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ads' AND column_name = 'tiene_financiacion') THEN
        COMMENT ON COLUMN ads.tiene_financiacion IS 'Si tiene financiación disponible';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ads' AND column_name = 'cuotas_disponibles') THEN
        COMMENT ON COLUMN ads.cuotas_disponibles IS 'Array de opciones de cuotas: [12, 24, 48] en formato JSONB';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ads' AND column_name = 'entrega_inmediata') THEN
        COMMENT ON COLUMN ads.entrega_inmediata IS 'Disponibilidad para entrega inmediata';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ads' AND column_name = 'canje_usado') THEN
        COMMENT ON COLUMN ads.canje_usado IS 'Acepta canje por usado + efectivo';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ads' AND column_name = 'canje_cereal') THEN
        COMMENT ON COLUMN ads.canje_cereal IS 'Acepta canje por cereal + efectivo';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ads' AND column_name = 'envio_incluido') THEN
        COMMENT ON COLUMN ads.envio_incluido IS 'Envío incluido a todo el país';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ads' AND column_name = 'envio_km') THEN
        COMMENT ON COLUMN ads.envio_km IS 'Envío disponible hasta X km';
    END IF;
END $$;

-- 2. Migrar datos existentes (si hay columnas antiguas)
-- Si tiene financiacion_anios > 0 o tiene cuotas sin interes, marcar como financiación disponible
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ads' AND column_name = 'financiacion_anios') THEN
    UPDATE ads 
    SET tiene_financiacion = TRUE
    WHERE 
      financiacion_anios IS NOT NULL 
      AND financiacion_anios != '' 
      AND financiacion_anios ~ '^[0-9]+$'  -- Verifica que sea numérico
      AND financiacion_anios::INTEGER > 0;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ads' AND column_name = 'cuotas_sin_interes') THEN
    UPDATE ads 
    SET tiene_financiacion = TRUE
    WHERE cuotas_sin_interes = TRUE;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ads' AND column_name = 'cheque_sin_interes') THEN
    UPDATE ads 
    SET tiene_financiacion = TRUE
    WHERE cheque_sin_interes = TRUE;
  END IF;
END $$;

-- 3. Eliminar columnas antiguas (OPCIONAL - comentado por seguridad)
-- DESCOMENTAR SOLO SI ESTÁS SEGURO DE QUE LOS DATOS YA FUERON MIGRADOS
/*
ALTER TABLE ads 
DROP COLUMN IF EXISTS financiacion_anios,
DROP COLUMN IF EXISTS cheque_sin_interes,
DROP COLUMN IF EXISTS cuotas_sin_interes,
DROP COLUMN IF EXISTS entrega_financiacion;
*/

-- 4. Crear índices para búsquedas
CREATE INDEX IF NOT EXISTS idx_ads_tiene_financiacion ON ads(tiene_financiacion) WHERE tiene_financiacion = TRUE;
CREATE INDEX IF NOT EXISTS idx_ads_entrega_inmediata ON ads(entrega_inmediata) WHERE entrega_inmediata = TRUE;

-- 5. Verificar cambios
SELECT 
  id,
  title,
  tiene_financiacion,
  cuotas_disponibles,
  entrega_inmediata,
  canje_usado,
  canje_cereal,
  envio_incluido
FROM ads
WHERE tiene_financiacion = TRUE
LIMIT 5;

-- Verificar que todas las columnas se crearon correctamente
SELECT 
    'discount' as columna,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ads' AND column_name = 'discount') 
        THEN '✅ Creada' ELSE '❌ Falta' END as estado
UNION ALL
SELECT 'tiene_financiacion',
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ads' AND column_name = 'tiene_financiacion') 
        THEN '✅ Creada' ELSE '❌ Falta' END
UNION ALL
SELECT 'cuotas_disponibles',
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ads' AND column_name = 'cuotas_disponibles') 
        THEN '✅ Creada' ELSE '❌ Falta' END
UNION ALL
SELECT 'entrega_inmediata',
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ads' AND column_name = 'entrega_inmediata') 
        THEN '✅ Creada' ELSE '❌ Falta' END
UNION ALL
SELECT 'canje_usado',
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ads' AND column_name = 'canje_usado') 
        THEN '✅ Creada' ELSE '❌ Falta' END
UNION ALL
SELECT 'canje_cereal',
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ads' AND column_name = 'canje_cereal') 
        THEN '✅ Creada' ELSE '❌ Falta' END;

-- ================================================================
-- NOTAS IMPORTANTES:
-- 
-- ⚠️  CAMBIO IMPORTANTE: cuotas_disponibles usa JSONB en lugar de INTEGER[]
--     Esto evita problemas de compatibilidad con el cache de schema
--     El formato será: [12, 24, 48] almacenado como JSONB
--
-- - Los nuevos campos son:
--   * tiene_financiacion (BOOLEAN): Si tiene financiación disponible
--   * cuotas_disponibles (JSONB): Array de cuotas [12, 24, 48] en formato JSON
--   * discount (DECIMAL): % descuento por pago contado
-- 
-- - Los campos de condiciones comerciales:
--   * entrega_inmediata (BOOLEAN)
--   * canje_usado (BOOLEAN): "Canje por Usado + Efectivo"
--   * canje_cereal (BOOLEAN): "Canje por Cereal + Efectivo"
--   * envio_incluido (BOOLEAN)
--   * envio_km (VARCHAR): Kilómetros de envío disponible
--
-- - Para eliminar las columnas antiguas (financiacion_anios, etc.), 
--   descomenta la sección 3 después de verificar que todos los datos 
--   fueron migrados correctamente
-- ================================================================
