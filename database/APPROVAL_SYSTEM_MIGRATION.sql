-- ================================================
-- SISTEMA DE APROBACIÓN DE AVISOS
-- ================================================
-- Este archivo añade el sistema de moderación para avisos de usuarios gratuitos
-- Ejecutar en Supabase SQL Editor

-- ================================================
-- 1. AGREGAR COLUMNAS A TABLA ADS
-- ================================================

ALTER TABLE ads
ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'approved' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Comentarios para documentación
COMMENT ON COLUMN ads.approval_status IS 'Estado de aprobación: pending (esperando revisión), approved (aprobado), rejected (rechazado)';
COMMENT ON COLUMN ads.approved_by IS 'UUID del admin que aprobó/rechazó el aviso';
COMMENT ON COLUMN ads.approved_at IS 'Timestamp de cuando fue aprobado';
COMMENT ON COLUMN ads.rejection_reason IS 'Motivo del rechazo (visible para el usuario)';

-- ================================================
-- 2. CREAR ÍNDICES PARA PERFORMANCE
-- ================================================

-- Índice para búsquedas de avisos pendientes (usado por admins)
CREATE INDEX IF NOT EXISTS idx_ads_approval_status 
ON ads(approval_status) 
WHERE approval_status = 'pending';

-- Índice compuesto para queries de moderación
CREATE INDEX IF NOT EXISTS idx_ads_approval_created 
ON ads(approval_status, created_at DESC);

-- ================================================
-- 3. ACTUALIZAR AVISOS EXISTENTES
-- ================================================

-- Todos los avisos existentes se consideran aprobados
UPDATE ads
SET approval_status = 'approved',
    approved_at = created_at
WHERE approval_status IS NULL;

-- ================================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- ================================================

-- Eliminar políticas existentes que puedan entrar en conflicto
DROP POLICY IF EXISTS "Users can view their own pending ads" ON ads;
DROP POLICY IF EXISTS "SuperAdmins can approve/reject ads" ON ads;
DROP POLICY IF EXISTS "Public can view approved ads" ON ads;

-- Política: Los usuarios pueden ver sus propios avisos (cualquier estado)
CREATE POLICY "Users can view their own ads"
ON ads FOR SELECT
USING (
  auth.uid() = user_id
);

-- Política: El público solo ve avisos aprobados
CREATE POLICY "Public can view approved ads"
ON ads FOR SELECT
USING (
  approval_status = 'approved' AND status = 'active'
);

-- Política: SuperAdmins pueden ver todos los avisos
CREATE POLICY "SuperAdmins can view all ads"
ON ads FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'superadmin'
  )
);

-- Política: SuperAdmins pueden actualizar approval_status
CREATE POLICY "SuperAdmins can moderate ads"
ON ads FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'superadmin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'superadmin'
  )
);

-- Política: Los usuarios pueden actualizar sus propios avisos (excepto approval_status)
CREATE POLICY "Users can update their own ads"
ON ads FOR UPDATE
USING (
  auth.uid() = user_id
)
WITH CHECK (
  auth.uid() = user_id
  -- No permitir que usuarios cambien su propio approval_status
  AND (
    approval_status = (SELECT approval_status FROM ads WHERE id = ads.id)
    OR approval_status IS NULL
  )
);

-- ================================================
-- 5. FUNCIÓN PARA AUTO-APROBACIÓN (USUARIOS PREMIUM)
-- ================================================

CREATE OR REPLACE FUNCTION auto_approve_premium_ads()
RETURNS TRIGGER AS $$
BEGIN
  -- Si el usuario es premium, aprobar automáticamente
  IF EXISTS (
    SELECT 1 FROM users
    WHERE users.id = NEW.user_id
    AND users.role IN ('premium-particular', 'premium-empresa')
  ) THEN
    NEW.approval_status := 'approved';
    NEW.approved_at := NOW();
    NEW.status := 'active';
  ELSE
    -- Si es free, requiere aprobación
    NEW.approval_status := 'pending';
    NEW.status := 'paused';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para ejecutar la función en INSERT
DROP TRIGGER IF EXISTS auto_approve_premium_ads_trigger ON ads;

CREATE TRIGGER auto_approve_premium_ads_trigger
BEFORE INSERT ON ads
FOR EACH ROW
EXECUTE FUNCTION auto_approve_premium_ads();

-- ================================================
-- 6. FUNCIÓN PARA LOGGING DE MODERACIÓN
-- ================================================

-- Tabla de audit log para moderación
CREATE TABLE IF NOT EXISTS ads_moderation_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ad_id UUID REFERENCES ads(id) ON DELETE CASCADE,
  moderator_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL CHECK (action IN ('approved', 'rejected')),
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comentarios
COMMENT ON TABLE ads_moderation_log IS 'Registro de auditoría de acciones de moderación';
COMMENT ON COLUMN ads_moderation_log.action IS 'Acción realizada: approved o rejected';
COMMENT ON COLUMN ads_moderation_log.reason IS 'Motivo del rechazo (si aplica)';

-- Índice para queries por ad_id
CREATE INDEX idx_moderation_log_ad_id ON ads_moderation_log(ad_id);

-- Función para registrar acciones de moderación
CREATE OR REPLACE FUNCTION log_moderation_action()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo registrar si cambió el approval_status
  IF OLD.approval_status IS DISTINCT FROM NEW.approval_status THEN
    INSERT INTO ads_moderation_log (ad_id, moderator_id, action, reason)
    VALUES (
      NEW.id,
      auth.uid(),
      CASE NEW.approval_status
        WHEN 'approved' THEN 'approved'
        WHEN 'rejected' THEN 'rejected'
        ELSE NULL
      END,
      NEW.rejection_reason
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para logging
DROP TRIGGER IF EXISTS log_moderation_action_trigger ON ads;

CREATE TRIGGER log_moderation_action_trigger
AFTER UPDATE ON ads
FOR EACH ROW
WHEN (OLD.approval_status IS DISTINCT FROM NEW.approval_status)
EXECUTE FUNCTION log_moderation_action();

-- ================================================
-- 7. VISTA PARA DASHBOARD DE MODERACIÓN
-- ================================================

CREATE OR REPLACE VIEW pending_ads_summary AS
SELECT 
  COUNT(*) as total_pending,
  COUNT(CASE WHEN created_at > NOW() - INTERVAL '24 hours' THEN 1 END) as pending_24h,
  COUNT(CASE WHEN created_at > NOW() - INTERVAL '48 hours' THEN 1 END) as pending_48h,
  AVG(EXTRACT(EPOCH FROM (NOW() - created_at))) / 3600 as avg_wait_hours
FROM ads
WHERE approval_status = 'pending';

COMMENT ON VIEW pending_ads_summary IS 'Resumen estadístico de avisos pendientes de aprobación';

-- ================================================
-- 8. GRANT PERMISSIONS (SI ES NECESARIO)
-- ================================================

-- Asegurar que los usuarios autenticados puedan leer/escribir sus avisos
GRANT SELECT, INSERT, UPDATE ON ads TO authenticated;
GRANT SELECT ON pending_ads_summary TO authenticated;
GRANT SELECT ON ads_moderation_log TO authenticated;

-- ================================================
-- 9. VERIFICACIÓN
-- ================================================

-- Verificar que las columnas se crearon correctamente
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'ads'
  AND column_name IN ('approval_status', 'approved_by', 'approved_at', 'rejection_reason');

-- Verificar índices
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'ads'
  AND indexname LIKE '%approval%';

-- Verificar políticas RLS
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'ads'
ORDER BY policyname;

-- ================================================
-- 10. DATOS DE PRUEBA (OPCIONAL - SOLO DESARROLLO)
-- ================================================

-- Crear un aviso de prueba pendiente
/*
INSERT INTO ads (user_id, title, description, category, approval_status, status)
VALUES (
  (SELECT id FROM users WHERE role = 'free' LIMIT 1),
  'Tractor Usado - Prueba Pendiente',
  'Este aviso está pendiente de aprobación por moderación',
  'Maquinaria',
  'pending',
  'paused'
);
*/

-- ================================================
-- ROLLBACK (EN CASO DE NECESITAR REVERTIR)
-- ================================================

/*
-- Para revertir todos los cambios:

DROP TRIGGER IF EXISTS auto_approve_premium_ads_trigger ON ads;
DROP TRIGGER IF EXISTS log_moderation_action_trigger ON ads;
DROP FUNCTION IF EXISTS auto_approve_premium_ads();
DROP FUNCTION IF EXISTS log_moderation_action();
DROP VIEW IF EXISTS pending_ads_summary;
DROP TABLE IF EXISTS ads_moderation_log;
DROP INDEX IF EXISTS idx_ads_approval_status;
DROP INDEX IF EXISTS idx_ads_approval_created;
DROP INDEX IF EXISTS idx_moderation_log_ad_id;
ALTER TABLE ads DROP COLUMN IF EXISTS approval_status;
ALTER TABLE ads DROP COLUMN IF EXISTS approved_by;
ALTER TABLE ads DROP COLUMN IF EXISTS approved_at;
ALTER TABLE ads DROP COLUMN IF EXISTS rejection_reason;
*/

-- ================================================
-- FIN DE MIGRACIÓN
-- ================================================
