-- ============================================================================
-- MIGRACIÓN: Sistema Unificado de Avisos Destacados
-- ============================================================================
-- Fecha: 2026-02-11
-- Objetivo: Unificar user featured + superadmin featured en un solo sistema
-- 
-- CAMBIOS:
-- 1. Agregar columna is_manual a featured_ads (si no existe)
-- 2. Función unificada get_featured_for_homepage con lógica de prioridad
-- 3. Cleanup automático de expirados (defensivo)
-- 4. Limitar a 10 slots (1 por user, ilimitado superadmin)
-- ============================================================================

-- ============================================================================
-- 1. AGREGAR COLUMNA is_manual (si no existe)
-- ============================================================================
-- Para diferenciar entre:
--   - is_manual = true  → Superadmin manual (para rellenar slots vacíos)
--   - is_manual = false → Usuario que pagó con créditos
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'featured_ads' AND column_name = 'is_manual'
  ) THEN
    ALTER TABLE featured_ads 
    ADD COLUMN is_manual BOOLEAN NOT NULL DEFAULT false;
    
    -- Crear índice para queries rápidos
    CREATE INDEX IF NOT EXISTS idx_featured_ads_is_manual 
      ON featured_ads(is_manual) WHERE is_manual = true;
    
    RAISE NOTICE 'Columna is_manual agregada a featured_ads';
  ELSE
    RAISE NOTICE 'Columna is_manual ya existe en featured_ads';
  END IF;
END $$;

-- ============================================================================
-- 2. FUNCIÓN UNIFICADA: get_featured_for_homepage (REEMPLAZA ANTERIOR)
-- ============================================================================
-- Prioridad:
--   1. Usuarios que pagaron (is_manual = false) - Max 1 por usuario (FIFO)
--   2. Superadmin manual (is_manual = true) - Ilimitado para rellenar
-- Límite: 10 slots totales
-- Filtro: SIEMPRE excluir expirados (defensivo)

-- Eliminar función anterior si existe
DROP FUNCTION IF EXISTS get_featured_for_homepage(UUID, INT);

CREATE OR REPLACE FUNCTION get_featured_for_homepage(
  p_category_id UUID,
  p_limit INT DEFAULT 10
)
RETURNS TABLE (
  ad_id UUID,
  user_id UUID,
  featured_id UUID,
  priority INT,
  is_manual BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  WITH user_featured AS (
    -- 1. Usuarios que pagaron (1 por usuario, FIFO)
    SELECT DISTINCT ON (fa.user_id)
      fa.ad_id,
      fa.user_id,
      fa.id as featured_id,
      1 as priority,  -- Prioridad alta
      fa.is_manual
    FROM featured_ads fa
    WHERE fa.placement = 'homepage'
      AND fa.category_id = p_category_id
      AND fa.status = 'active'
      AND fa.is_manual = false
      AND (fa.expires_at IS NULL OR fa.expires_at > NOW())  -- Defensivo: filtrar expirados
    ORDER BY fa.user_id, fa.created_at ASC  -- FIFO por usuario
  ),
  superadmin_featured AS (
    -- 2. Superadmin manual (ilimitado para rellenar)
    SELECT 
      fa.ad_id,
      fa.user_id,
      fa.id as featured_id,
      2 as priority,  -- Prioridad baja
      fa.is_manual
    FROM featured_ads fa
    WHERE fa.placement = 'homepage'
      AND fa.category_id = p_category_id
      AND fa.status = 'active'
      AND fa.is_manual = true
      AND (fa.expires_at IS NULL OR fa.expires_at > NOW())  -- Defensivo: filtrar expirados
    ORDER BY fa.created_at ASC  -- FIFO
  ),
  combined AS (
    -- Combinar ambos con prioridad
    SELECT * FROM user_featured
    UNION ALL
    SELECT * FROM superadmin_featured
  )
  SELECT 
    c.ad_id,
    c.user_id,
    c.featured_id,
    c.priority,
    c.is_manual
  FROM combined c
  ORDER BY c.priority ASC, c.featured_id ASC  -- Users primero, luego superadmin
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- 3. ACTUALIZAR get_featured_for_results (mismo patrón)
-- ============================================================================

-- Eliminar función anterior si existe
DROP FUNCTION IF EXISTS get_featured_for_results(UUID, INT, INT);

CREATE OR REPLACE FUNCTION get_featured_for_results(
  p_category_id UUID,
  p_limit INT DEFAULT 4,
  p_offset INT DEFAULT 0
)
RETURNS TABLE (
  ad_id UUID,
  user_id UUID,
  featured_id UUID,
  priority INT,
  is_manual BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  WITH user_featured AS (
    SELECT DISTINCT ON (fa.user_id)
      fa.ad_id,
      fa.user_id,
      fa.id as featured_id,
      1 as priority,
      fa.is_manual
    FROM featured_ads fa
    WHERE fa.placement = 'results'
      AND fa.category_id = p_category_id
      AND fa.status = 'active'
      AND fa.is_manual = false
      AND (fa.expires_at IS NULL OR fa.expires_at > NOW())
    ORDER BY fa.user_id, fa.created_at ASC
  ),
  superadmin_featured AS (
    SELECT 
      fa.ad_id,
      fa.user_id,
      fa.id as featured_id,
      2 as priority,
      fa.is_manual
    FROM featured_ads fa
    WHERE fa.placement = 'results'
      AND fa.category_id = p_category_id
      AND fa.status = 'active'
      AND fa.is_manual = true
      AND (fa.expires_at IS NULL OR fa.expires_at > NOW())
    ORDER BY fa.created_at ASC
  ),
  combined AS (
    SELECT * FROM user_featured
    UNION ALL
    SELECT * FROM superadmin_featured
  )
  SELECT 
    c.ad_id,
    c.user_id,
    c.featured_id,
    c.priority,
    c.is_manual
  FROM combined c
  ORDER BY c.priority ASC, c.featured_id ASC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- 4. ACTUALIZAR get_featured_for_detail (mismo patrón)
-- ============================================================================

-- Eliminar función anterior si existe
DROP FUNCTION IF EXISTS get_featured_for_detail(UUID, UUID, INT);

CREATE OR REPLACE FUNCTION get_featured_for_detail(
  p_category_id UUID,
  p_current_ad_id UUID,
  p_limit INT DEFAULT 6
)
RETURNS TABLE (
  ad_id UUID,
  user_id UUID,
  featured_id UUID,
  priority INT,
  is_manual BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  WITH user_featured AS (
    SELECT DISTINCT ON (fa.user_id)
      fa.ad_id,
      fa.user_id,
      fa.id as featured_id,
      1 as priority,
      fa.is_manual
    FROM featured_ads fa
    WHERE fa.placement = 'detail'
      AND fa.category_id = p_category_id
      AND fa.ad_id != p_current_ad_id  -- Excluir aviso actual
      AND fa.status = 'active'
      AND fa.is_manual = false
      AND (fa.expires_at IS NULL OR fa.expires_at > NOW())
    ORDER BY fa.user_id, fa.created_at ASC
  ),
  superadmin_featured AS (
    SELECT 
      fa.ad_id,
      fa.user_id,
      fa.id as featured_id,
      2 as priority,
      fa.is_manual
    FROM featured_ads fa
    WHERE fa.placement = 'detail'
      AND fa.category_id = p_category_id
      AND fa.ad_id != p_current_ad_id
      AND fa.status = 'active'
      AND fa.is_manual = true
      AND (fa.expires_at IS NULL OR fa.expires_at > NOW())
    ORDER BY fa.created_at ASC
  ),
  combined AS (
    SELECT * FROM user_featured
    UNION ALL
    SELECT * FROM superadmin_featured
  )
  SELECT 
    c.ad_id,
    c.user_id,
    c.featured_id,
    c.priority,
    c.is_manual
  FROM combined c
  ORDER BY c.priority ASC, c.featured_id ASC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- 5. ACTUALIZAR activate_pending_featured_ads (con cleanup de expirados)
-- ============================================================================
CREATE OR REPLACE FUNCTION activate_pending_featured_ads()
RETURNS INTEGER AS $$
DECLARE
  v_activated INT := 0;
  v_expired INT := 0;
BEGIN
  -- 1. Activar los que su fecha de inicio llegó
  UPDATE featured_ads
  SET 
    status = 'active',
    actual_start = NOW()
  WHERE status = 'pending'
    AND scheduled_start <= CURRENT_DATE;
  
  GET DIAGNOSTICS v_activated = ROW_COUNT;
  
  -- 2. EXPIRAR los que ya pasaron su fecha (CRÍTICO: esto faltaba ejecutarse automáticamente)
  UPDATE featured_ads
  SET status = 'expired'
  WHERE status = 'active'
    AND expires_at < NOW();
  
  GET DIAGNOSTICS v_expired = ROW_COUNT;
  
  -- Log para debugging
  IF v_activated > 0 OR v_expired > 0 THEN
    RAISE NOTICE 'Featured ads: % activados, % expirados', v_activated, v_expired;
  END IF;
  
  RETURN v_activated;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 6. LIMPIAR ads.featured (legacy) - OPCIONAL
-- ============================================================================
-- Si querés eliminar completamente el sistema viejo de ads.featured:
-- COMENTADO por seguridad, ejecutar manualmente si es necesario
/*
UPDATE ads 
SET 
  featured = false,
  featured_until = NULL,
  featured_order = NULL
WHERE featured = true;

COMMENT ON COLUMN ads.featured IS 'DEPRECATED: Usar tabla featured_ads';
COMMENT ON COLUMN ads.featured_until IS 'DEPRECATED: Usar tabla featured_ads';
COMMENT ON COLUMN ads.featured_order IS 'DEPRECATED: Usar tabla featured_ads';
*/

-- ============================================================================
-- 7. VERIFICACIÓN
-- ============================================================================
-- Ver estado de featured_ads por placement y origen
-- SELECT 
--   placement,
--   CASE 
--     WHEN is_manual THEN 'SuperAdmin'
--     ELSE 'Usuario Pago'
--   END as origen,
--   status,
--   COUNT(*) as cantidad
-- FROM featured_ads
-- GROUP BY placement, is_manual, status
-- ORDER BY placement, is_manual, status;

-- Probar función unificada (ejemplo con categoría ficticia)
-- SELECT * FROM get_featured_for_homepage('550e8400-e29b-41d4-a716-446655440000'::UUID, 10);

DO $$ 
BEGIN
  RAISE NOTICE '✅ Migración 048: Sistema Unificado completado';
END $$;
