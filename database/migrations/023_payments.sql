-- ============================================================================
-- MIGRACIÓN 023: Payments (Sistema de pagos simulado)
-- Historial de pagos para suscripciones y destacados
-- ============================================================================

-- 1. Crear tabla payments
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Usuario
  user_id UUID NOT NULL REFERENCES users(id),
  
  -- Tipo de pago
  payment_type VARCHAR(30) NOT NULL CHECK (
    payment_type IN ('subscription', 'featured_ad', 'upgrade', 'renewal', 'other')
  ),
  
  -- Monto
  amount DECIMAL(12, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'ARS',
  
  -- Estado
  status VARCHAR(20) DEFAULT 'pending' CHECK (
    status IN ('pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled')
  ),
  
  -- Método de pago
  payment_method VARCHAR(30) DEFAULT 'simulated' CHECK (
    payment_method IN ('simulated', 'mercadopago', 'stripe', 'transfer', 'cash', 'other')
  ),
  
  -- Referencias externas (para pasarelas reales)
  external_id VARCHAR(255), -- ID de MercadoPago/Stripe
  external_status VARCHAR(100), -- Estado de la pasarela
  
  -- Descripción
  description TEXT,
  
  -- Metadata flexible para datos adicionales
  metadata JSONB DEFAULT '{}',
  -- Ej para suscripción: {"plan_id": "xxx", "period": "monthly"}
  -- Ej para destacado: {"ad_id": "xxx", "days": 7, "queue_id": "xxx"}
  
  -- Comprobante
  receipt_number VARCHAR(50), -- Número de comprobante interno
  receipt_url TEXT, -- URL al PDF/imagen del comprobante
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ, -- Cuando se completó el pago
  expires_at TIMESTAMPTZ, -- Para pagos pendientes con vencimiento
  
  -- Notas admin
  admin_notes TEXT
);

-- 2. Índices
CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_type ON payments(payment_type);
CREATE INDEX IF NOT EXISTS idx_payments_created ON payments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_completed ON payments(completed_at DESC) WHERE status = 'completed';

-- 3. Secuencia para número de comprobante
CREATE SEQUENCE IF NOT EXISTS payment_receipt_seq START 1000;

-- 4. Trigger para generar número de comprobante
CREATE OR REPLACE FUNCTION generate_payment_receipt_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND NEW.receipt_number IS NULL THEN
    NEW.receipt_number := 'R24-' || TO_CHAR(NOW(), 'YYYYMM') || '-' || LPAD(nextval('payment_receipt_seq')::TEXT, 6, '0');
    NEW.completed_at := NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_payment_receipt ON payments;
CREATE TRIGGER trigger_payment_receipt
  BEFORE UPDATE ON payments
  FOR EACH ROW
  WHEN (NEW.status = 'completed' AND OLD.status != 'completed')
  EXECUTE FUNCTION generate_payment_receipt_number();

-- 5. Trigger para updated_at
CREATE OR REPLACE FUNCTION update_payments_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_payments_updated ON payments;
CREATE TRIGGER trigger_payments_updated
  BEFORE UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_payments_timestamp();

-- 6. Trigger para activar suscripción cuando se completa pago
CREATE OR REPLACE FUNCTION activate_subscription_on_payment()
RETURNS TRIGGER AS $$
DECLARE
  plan_id UUID;
  period_months INTEGER;
BEGIN
  IF NEW.status = 'completed' AND NEW.payment_type IN ('subscription', 'upgrade', 'renewal') THEN
    -- Obtener plan_id del metadata
    plan_id := (NEW.metadata->>'plan_id')::UUID;
    period_months := COALESCE((NEW.metadata->>'period_months')::INTEGER, 1);
    
    IF plan_id IS NOT NULL THEN
      UPDATE users SET
        subscription_plan_id = plan_id,
        subscription_status = 'active',
        subscription_started_at = NOW(),
        subscription_expires_at = NOW() + (period_months || ' months')::INTERVAL
      WHERE id = NEW.user_id;
      
      RAISE NOTICE 'Activated subscription for user % with plan %', NEW.user_id, plan_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_activate_subscription ON payments;
CREATE TRIGGER trigger_activate_subscription
  AFTER UPDATE ON payments
  FOR EACH ROW
  WHEN (NEW.status = 'completed' AND OLD.status != 'completed')
  EXECUTE FUNCTION activate_subscription_on_payment();

-- 7. RLS Policies
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Usuarios pueden ver sus propios pagos
CREATE POLICY "Users can view own payments" ON payments
  FOR SELECT
  USING (user_id = auth.uid());

-- Usuarios pueden crear pagos para sí mismos
CREATE POLICY "Users can create own payments" ON payments
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- SuperAdmin puede ver todos los pagos
CREATE POLICY "SuperAdmin can view all payments" ON payments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'superadmin'
    )
  );

-- SuperAdmin puede modificar pagos
CREATE POLICY "SuperAdmin can manage payments" ON payments
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'superadmin'
    )
  );

-- ============================================================================
-- VISTAS ÚTILES
-- ============================================================================

-- Resumen de pagos por mes
CREATE OR REPLACE VIEW payments_monthly_summary AS
SELECT 
  DATE_TRUNC('month', created_at) as month,
  COUNT(*) FILTER (WHERE status = 'completed') as completed_count,
  SUM(amount) FILTER (WHERE status = 'completed') as total_revenue,
  SUM(amount) FILTER (WHERE status = 'completed' AND payment_type = 'subscription') as subscription_revenue,
  SUM(amount) FILTER (WHERE status = 'completed' AND payment_type = 'featured_ad') as featured_revenue,
  COUNT(*) FILTER (WHERE status = 'pending') as pending_count
FROM payments
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month DESC;

-- Pagos recientes con detalles de usuario
CREATE OR REPLACE VIEW payments_with_user AS
SELECT 
  p.*,
  u.email as user_email,
  u.full_name as user_name,
  sp.display_name as plan_name
FROM payments p
JOIN users u ON u.id = p.user_id
LEFT JOIN subscription_plans sp ON sp.id = (p.metadata->>'plan_id')::UUID
ORDER BY p.created_at DESC;

-- ============================================================================
-- AGREGAR FK en featured_ads_queue
-- ============================================================================
ALTER TABLE featured_ads_queue 
  ADD CONSTRAINT fk_featured_queue_payment 
  FOREIGN KEY (payment_id) REFERENCES payments(id);

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================
SELECT 'payments table created successfully' as status;
