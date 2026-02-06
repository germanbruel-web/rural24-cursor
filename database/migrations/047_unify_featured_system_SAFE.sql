-- ============================================================================
-- MIGRACIÓN 047 (VERSIÓN SEGURA): Sistema Featured Ads Unificado
-- ============================================================================
-- Fecha: 2026-02-06
-- Descripción: Agrega funcionalidad de activación manual por SuperAdmin
--              Solo agrega lo que falta (featured_ads ya existe)
--              Migración idempotente y segura
-- ============================================================================

-- ============================================================================
-- 1. AGREGAR COLUMNAS FALTANTES A featured_ads
-- ============================================================================

-- Columnas para activación manual por SuperAdmin
ALTER TABLE featured_ads 
  ADD COLUMN IF NOT EXISTS is_manual BOOLEAN DEFAULT FALSE;

ALTER TABLE featured_ads 
  ADD COLUMN IF NOT EXISTS manual_activated_by UUID REFERENCES users(id);

ALTER TABLE featured_ads 
  ADD COLUMN IF NOT EXISTS requires_payment BOOLEAN DEFAULT TRUE;

-- Metadata adicional
ALTER TABLE featured_ads 
  ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- Créditos gastados (si no existe)
ALTER TABLE featured_ads 
  ADD COLUMN IF NOT EXISTS credits_spent INT;

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_featured_ads_is_manual 
  ON featured_ads(is_manual) WHERE is_manual = true;

CREATE INDEX IF NOT EXISTS idx_featured_ads_manual_activated_by 
  ON featured_ads(manual_activated_by) WHERE manual_activated_by IS NOT NULL;

-- ============================================================================
-- 2. AMPLIAR TABLA featured_ads_audit (Ya existe, agregar columnas faltantes)
-- ============================================================================

-- La tabla ya existe con: id, featured_ad_id, action, performed_by, reason, metadata, created_at
-- Agregar solo las columnas que faltan:

ALTER TABLE featured_ads_audit 
  ADD COLUMN IF NOT EXISTS ad_id UUID REFERENCES ads(id) ON DELETE SET NULL;

ALTER TABLE featured_ads_audit 
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE featured_ads_audit 
  ADD COLUMN IF NOT EXISTS performer_email VARCHAR(255);

ALTER TABLE featured_ads_audit 
  ADD COLUMN IF NOT EXISTS performer_name VARCHAR(255);

ALTER TABLE featured_ads_audit 
  ADD COLUMN IF NOT EXISTS performer_role VARCHAR(20);

-- Índices de auditoría (si no existen)
CREATE INDEX IF NOT EXISTS idx_featured_ads_audit_featured_id 
  ON featured_ads_audit(featured_ad_id);

CREATE INDEX IF NOT EXISTS idx_featured_ads_audit_ad_id 
  ON featured_ads_audit(ad_id);

CREATE INDEX IF NOT EXISTS idx_featured_ads_audit_user_id
  ON featured_ads_audit(user_id);

CREATE INDEX IF NOT EXISTS idx_featured_ads_audit_performed_by 
  ON featured_ads_audit(performed_by);

CREATE INDEX IF NOT EXISTS idx_featured_ads_audit_action 
  ON featured_ads_audit(action);

CREATE INDEX IF NOT EXISTS idx_featured_ads_audit_created_at 
  ON featured_ads_audit(created_at DESC);

-- Comentarios
COMMENT ON TABLE featured_ads_audit IS 'Auditoría de todas las acciones en featured ads';
COMMENT ON COLUMN featured_ads_audit.metadata IS 'JSON: old_values, new_values, refund_amount';

-- ============================================================================
-- 3. FUNCIÓN: Calcular reembolso proporcional
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_featured_refund(
  p_featured_id UUID
) RETURNS INT AS $$
DECLARE
  v_credits_spent INT;
  v_duration_days INT;
  v_expires_at TIMESTAMPTZ;
  v_days_remaining INT;
  v_refund_amount INT;
BEGIN
  -- Obtener datos del featured
  SELECT 
    COALESCE(credits_spent, 1),
    duration_days,
    expires_at
  INTO v_credits_spent, v_duration_days, v_expires_at
  FROM featured_ads
  WHERE id = p_featured_id;
  
  -- Validar que existe y está activo
  IF NOT FOUND OR v_expires_at IS NULL THEN
    RETURN 0;
  END IF;
  
  -- Calcular días restantes
  v_days_remaining := EXTRACT(DAY FROM (v_expires_at - NOW()))::INT;
  
  -- Si ya expiró, no hay reembolso
  IF v_days_remaining <= 0 THEN
    RETURN 0;
  END IF;
  
  -- Calcular reembolso proporcional (redondeo hacia arriba)
  v_refund_amount := CEIL(
    (v_days_remaining::DECIMAL / v_duration_days::DECIMAL) * v_credits_spent::DECIMAL
  )::INT;
  
  -- No puede ser mayor a los créditos originales
  IF v_refund_amount > v_credits_spent THEN
    v_refund_amount := v_credits_spent;
  END IF;
  
  RETURN v_refund_amount;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calculate_featured_refund IS 
  'Calcula reembolso proporcional de créditos con redondeo favorable al usuario';

-- ============================================================================
-- 4. TRIGGER: Auto-auditoría de cambios
-- ============================================================================

CREATE OR REPLACE FUNCTION trigger_featured_ads_audit()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo registrar cambios importantes
  IF (TG_OP = 'UPDATE' AND (
    OLD.status != NEW.status OR
    OLD.cancelled_at IS DISTINCT FROM NEW.cancelled_at OR
    OLD.expires_at != NEW.expires_at
  )) THEN
    
    INSERT INTO featured_ads_audit (
      featured_ad_id,
      ad_id,
      user_id,
      action,
      reason,
      metadata,
      created_at
    ) VALUES (
      NEW.id,
      NEW.ad_id,
      NEW.user_id,
      CASE 
        WHEN NEW.status = 'cancelled' THEN 'cancelled'
        WHEN NEW.status = 'expired' THEN 'expired'
        WHEN NEW.status = 'active' AND OLD.status != 'active' THEN 'activated'
        ELSE 'edited'
      END,
      NEW.cancelled_reason,
      jsonb_build_object(
        'old_status', OLD.status,
        'new_status', NEW.status,
        'old_expires_at', OLD.expires_at,
        'new_expires_at', NEW.expires_at,
        'refunded', NEW.refunded,
        'auto_trigger', true
      ),
      NOW()
    );
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_featured_ads_audit ON featured_ads;
CREATE TRIGGER trg_featured_ads_audit
  AFTER UPDATE ON featured_ads
  FOR EACH ROW
  EXECUTE FUNCTION trigger_featured_ads_audit();

-- ============================================================================
-- 5. VISTA: Featured Ads Administrativo
-- ============================================================================

CREATE OR REPLACE VIEW v_admin_featured_ads AS
SELECT 
  fa.id,
  fa.ad_id,
  fa.user_id,
  fa.placement,
  fa.category_id,
  fa.scheduled_start,
  fa.actual_start,
  fa.expires_at,
  fa.duration_days,
  fa.status,
  fa.priority,
  fa.credit_consumed,
  COALESCE(fa.credits_spent, 1) as credits_spent,
  fa.is_manual,
  fa.manual_activated_by,
  fa.requires_payment,
  fa.refunded,
  fa.cancelled_by,
  fa.cancelled_reason,
  fa.cancelled_at,
  fa.admin_notes,
  fa.created_at,
  fa.updated_at,
  
  -- Info del aviso
  a.title as ad_title,
  a.slug as ad_slug,
  a.images as ad_images,
  a.price as ad_price,
  a.currency as ad_currency,
  a.status as ad_status,
  
  -- Info del usuario
  u.email as user_email,
  u.full_name as user_full_name,
  u.role as user_role,
  
  -- Info de categoría
  c.name as category_name,
  c.slug as category_slug,
  
  -- Info de quien activó manual
  ma.email as manual_activator_email,
  ma.full_name as manual_activator_name,
  
  -- Info de quien canceló
  cb.email as cancelled_by_email,
  cb.full_name as cancelled_by_name,
  
  -- Cálculos
  CASE 
    WHEN fa.status = 'active' AND fa.expires_at > NOW() THEN
      EXTRACT(DAY FROM (fa.expires_at - NOW()))::INT
    ELSE 0
  END as days_remaining,
  
  CASE 
    WHEN fa.credit_consumed = true AND fa.status = 'active' THEN
      calculate_featured_refund(fa.id)
    ELSE 0
  END as potential_refund
  
FROM featured_ads fa
LEFT JOIN ads a ON a.id = fa.ad_id
LEFT JOIN users u ON u.id = fa.user_id
LEFT JOIN categories c ON c.id = fa.category_id
LEFT JOIN users ma ON ma.id = fa.manual_activated_by
LEFT JOIN users cb ON cb.id = fa.cancelled_by
ORDER BY fa.created_at DESC;

COMMENT ON VIEW v_admin_featured_ads IS 
  'Vista administrativa completa con JOINs y cálculos en tiempo real';

-- ============================================================================
-- 6. VERIFICACIÓN POST-MIGRACIÓN
-- ============================================================================

DO $$
DECLARE
  v_total_featured INT;
  v_manual_count INT;
  v_user_count INT;
  v_active_count INT;
  v_queue_count INT;
BEGIN
  SELECT COUNT(*) INTO v_total_featured FROM featured_ads;
  SELECT COUNT(*) INTO v_manual_count FROM featured_ads WHERE is_manual = true;
  SELECT COUNT(*) INTO v_user_count FROM featured_ads WHERE is_manual = false;
  SELECT COUNT(*) INTO v_active_count FROM featured_ads WHERE status = 'active';
  
  SELECT COUNT(*) INTO v_queue_count FROM featured_ads_queue 
  WHERE status IN ('active', 'pending');
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'MIGRACIÓN 047 COMPLETADA';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Total featured ads: %', v_total_featured;
  RAISE NOTICE 'Activados por SuperAdmin: %', v_manual_count;
  RAISE NOTICE 'Activados por usuarios: %', v_user_count;
  RAISE NOTICE 'Activos ahora: %', v_active_count;
  RAISE NOTICE '';
  RAISE NOTICE 'featured_ads_queue pendientes: %', v_queue_count;
  IF v_queue_count > 0 THEN
    RAISE NOTICE 'NOTA: Hay % registros en queue que podrian migrarse manualmente', v_queue_count;
  END IF;
  RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- FIN MIGRACIÓN 047 (VERSIÓN SEGURA)
-- ============================================================================
