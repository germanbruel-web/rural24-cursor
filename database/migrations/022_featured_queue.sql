-- ============================================================================
-- MIGRACIÓN 022: Featured Ads Queue
-- Sistema de cola para gestión de avisos destacados con fechas programadas
-- ============================================================================

-- 1. Crear tabla featured_ads_queue
CREATE TABLE IF NOT EXISTS featured_ads_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Referencias
  ad_id UUID NOT NULL REFERENCES ads(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id),
  user_id UUID NOT NULL REFERENCES users(id),
  
  -- Fechas de solicitud y programación
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  scheduled_start DATE, -- NULL = en cola esperando slot
  scheduled_end DATE,
  
  -- Estado del destacado
  status VARCHAR(20) DEFAULT 'queued' CHECK (
    status IN ('queued', 'scheduled', 'active', 'completed', 'cancelled', 'expired')
  ),
  -- queued: esperando asignación de fecha
  -- scheduled: tiene fechas asignadas, esperando inicio
  -- active: actualmente destacado en homepage
  -- completed: período terminado correctamente
  -- cancelled: cancelado por usuario o admin
  -- expired: venció sin renovar
  
  -- Pago asociado (para futuro)
  payment_id UUID, -- REFERENCES payments(id) - se agregará después
  
  -- Notificaciones
  notified_start BOOLEAN DEFAULT false, -- Se notificó inicio
  notified_end_soon BOOLEAN DEFAULT false, -- Se notificó que vence pronto
  notified_end BOOLEAN DEFAULT false, -- Se notificó fin
  
  -- Metadata
  admin_notes TEXT, -- Notas del webmaster
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Índices para performance
CREATE INDEX IF NOT EXISTS idx_featured_queue_ad ON featured_ads_queue(ad_id);
CREATE INDEX IF NOT EXISTS idx_featured_queue_category ON featured_ads_queue(category_id);
CREATE INDEX IF NOT EXISTS idx_featured_queue_user ON featured_ads_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_featured_queue_status ON featured_ads_queue(status);
CREATE INDEX IF NOT EXISTS idx_featured_queue_dates ON featured_ads_queue(scheduled_start, scheduled_end);
CREATE INDEX IF NOT EXISTS idx_featured_queue_active ON featured_ads_queue(category_id, status) 
  WHERE status IN ('active', 'scheduled');

-- 3. Constraint: No puede haber más de MAX destacados activos por categoría
-- Esto se validará en la aplicación porque depende de global_settings

-- 4. Trigger para updated_at
CREATE OR REPLACE FUNCTION update_featured_queue_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_featured_queue_updated ON featured_ads_queue;
CREATE TRIGGER trigger_featured_queue_updated
  BEFORE UPDATE ON featured_ads_queue
  FOR EACH ROW
  EXECUTE FUNCTION update_featured_queue_timestamp();

-- 5. Trigger para sincronizar con ads.featured
CREATE OR REPLACE FUNCTION sync_ad_featured_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Cuando un slot se activa, marcar el ad como featured
  IF NEW.status = 'active' AND (OLD.status IS NULL OR OLD.status != 'active') THEN
    UPDATE ads 
    SET featured = true, 
        featured_until = NEW.scheduled_end,
        featured_order = (
          SELECT COALESCE(MAX(featured_order), 0) + 1 
          FROM ads 
          WHERE category_id = NEW.category_id AND featured = true
        )
    WHERE id = NEW.ad_id;
  END IF;
  
  -- Cuando un slot termina/cancela, quitar featured del ad
  IF NEW.status IN ('completed', 'cancelled', 'expired') AND OLD.status = 'active' THEN
    UPDATE ads 
    SET featured = false, 
        featured_until = NULL,
        featured_order = NULL
    WHERE id = NEW.ad_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sync_ad_featured ON featured_ads_queue;
CREATE TRIGGER trigger_sync_ad_featured
  AFTER UPDATE ON featured_ads_queue
  FOR EACH ROW
  EXECUTE FUNCTION sync_ad_featured_status();

-- 6. Función para activar slots cuya fecha de inicio llegó
CREATE OR REPLACE FUNCTION activate_scheduled_featured_ads()
RETURNS INTEGER AS $$
DECLARE
  activated_count INTEGER;
BEGIN
  UPDATE featured_ads_queue
  SET status = 'active'
  WHERE status = 'scheduled'
    AND scheduled_start <= CURRENT_DATE;
  
  GET DIAGNOSTICS activated_count = ROW_COUNT;
  
  RAISE NOTICE 'Activated % scheduled featured ads', activated_count;
  RETURN activated_count;
END;
$$ LANGUAGE plpgsql;

-- 7. Función para completar slots cuya fecha de fin llegó
CREATE OR REPLACE FUNCTION complete_expired_featured_ads()
RETURNS INTEGER AS $$
DECLARE
  completed_count INTEGER;
BEGIN
  UPDATE featured_ads_queue
  SET status = 'completed'
  WHERE status = 'active'
    AND scheduled_end < CURRENT_DATE;
  
  GET DIAGNOSTICS completed_count = ROW_COUNT;
  
  RAISE NOTICE 'Completed % expired featured ads', completed_count;
  RETURN completed_count;
END;
$$ LANGUAGE plpgsql;

-- 8. Función combinada para mantenimiento diario
CREATE OR REPLACE FUNCTION featured_ads_daily_maintenance()
RETURNS TABLE(activated INTEGER, completed INTEGER) AS $$
BEGIN
  activated := activate_scheduled_featured_ads();
  completed := complete_expired_featured_ads();
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

-- 9. RLS Policies
ALTER TABLE featured_ads_queue ENABLE ROW LEVEL SECURITY;

-- Usuarios pueden ver sus propias solicitudes
CREATE POLICY "Users can view own queue entries" ON featured_ads_queue
  FOR SELECT
  USING (user_id = auth.uid());

-- Usuarios pueden crear solicitudes para sus propios avisos
CREATE POLICY "Users can request featured for own ads" ON featured_ads_queue
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (SELECT 1 FROM ads WHERE ads.id = ad_id AND ads.user_id = auth.uid())
  );

-- Usuarios pueden cancelar sus propias solicitudes en cola
CREATE POLICY "Users can cancel own queued entries" ON featured_ads_queue
  FOR UPDATE
  USING (
    user_id = auth.uid() AND 
    status = 'queued'
  );

-- SuperAdmin puede ver todo
CREATE POLICY "SuperAdmin can view all queue" ON featured_ads_queue
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'superadmin'
    )
  );

-- SuperAdmin puede modificar todo
CREATE POLICY "SuperAdmin can manage all queue" ON featured_ads_queue
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

-- Vista de slots activos por categoría con conteo
CREATE OR REPLACE VIEW featured_slots_summary AS
SELECT 
  c.id as category_id,
  c.display_name as category_name,
  COUNT(*) FILTER (WHERE faq.status = 'active') as active_count,
  COUNT(*) FILTER (WHERE faq.status = 'scheduled') as scheduled_count,
  COUNT(*) FILTER (WHERE faq.status = 'queued') as queued_count,
  (SELECT get_setting_int('featured_max_per_category')) as max_slots,
  (SELECT get_setting_int('featured_max_per_category')) - COUNT(*) FILTER (WHERE faq.status = 'active') as available_slots
FROM categories c
LEFT JOIN featured_ads_queue faq ON faq.category_id = c.id AND faq.status IN ('active', 'scheduled', 'queued')
WHERE c.is_active = true
GROUP BY c.id, c.display_name
ORDER BY c.sort_order;

-- Vista de cola completa con detalles
CREATE OR REPLACE VIEW featured_queue_details AS
SELECT 
  faq.*,
  a.title as ad_title,
  a.slug as ad_slug,
  c.display_name as category_name,
  u.email as user_email,
  u.full_name as user_name
FROM featured_ads_queue faq
JOIN ads a ON a.id = faq.ad_id
JOIN categories c ON c.id = faq.category_id
JOIN users u ON u.id = faq.user_id
ORDER BY 
  CASE faq.status 
    WHEN 'queued' THEN 1 
    WHEN 'scheduled' THEN 2 
    WHEN 'active' THEN 3 
    ELSE 4 
  END,
  faq.requested_at;

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================
SELECT 'featured_ads_queue created successfully' as status;
SELECT * FROM featured_slots_summary;
