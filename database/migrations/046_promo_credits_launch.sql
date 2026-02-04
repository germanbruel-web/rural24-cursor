-- ============================================================================
-- MIGRACIÓN 046: Sistema de Créditos Promocionales de Lanzamiento
-- ============================================================================
-- Fecha: 2026-02-04
-- Descripción: Configura créditos gratuitos temporales para todos los usuarios
--              durante el período de lanzamiento de la plataforma
-- ============================================================================

-- ============================================================================
-- 1. CONFIGURACIONES DE PROMOCIÓN
-- ============================================================================
INSERT INTO global_settings (key, value, category, display_name, description, value_type, is_public)
VALUES 
  -- Activar/desactivar promoción
  ('featured_promo_enabled', 'true'::jsonb, 'featured', 'Promoción activa', 
   'Habilita la promoción de créditos gratuitos de lanzamiento', 'boolean', true),
  
  -- Cantidad de créditos gratuitos
  ('featured_promo_credits', '3'::jsonb, 'featured', 'Créditos promocionales', 
   'Cantidad de créditos gratuitos que recibe cada usuario durante la promoción', 'number', true),
  
  -- Fecha de inicio de promoción
  ('featured_promo_start', '"2026-02-04"'::jsonb, 'featured', 'Inicio promoción', 
   'Fecha de inicio de la promoción de créditos (formato YYYY-MM-DD)', 'string', false),
  
  -- Fecha de fin de promoción
  ('featured_promo_end', '"2026-03-31"'::jsonb, 'featured', 'Fin promoción', 
   'Fecha de fin de la promoción de créditos (formato YYYY-MM-DD)', 'string', false),
  
  -- Mensaje promocional para mostrar en UI
  ('featured_promo_message', '"🎉 ¡Lanzamiento! Recibí 3 créditos GRATIS para destacar tus avisos"'::jsonb, 'featured', 'Mensaje promocional', 
   'Mensaje que se muestra a usuarios sobre la promoción', 'string', true)

ON CONFLICT (key) DO UPDATE SET 
  value = EXCLUDED.value,
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description;

-- ============================================================================
-- 2. TABLA PARA TRACKEAR QUIEN RECLAMÓ LA PROMOCIÓN
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_promo_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  promo_code VARCHAR(50) NOT NULL DEFAULT 'launch_2026',
  credits_granted INT NOT NULL,
  claimed_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT user_promo_claims_unique UNIQUE(user_id, promo_code)
);

CREATE INDEX IF NOT EXISTS idx_user_promo_claims_user ON user_promo_claims(user_id);
CREATE INDEX IF NOT EXISTS idx_user_promo_claims_code ON user_promo_claims(promo_code);

-- ============================================================================
-- 3. FUNCIÓN: Reclamar créditos promocionales
-- ============================================================================
CREATE OR REPLACE FUNCTION claim_promo_credits(p_user_id UUID)
RETURNS TABLE (
  success BOOLEAN,
  credits_granted INT,
  message TEXT
) AS $$
DECLARE
  v_promo_enabled BOOLEAN;
  v_promo_credits INT;
  v_promo_start DATE;
  v_promo_end DATE;
  v_already_claimed BOOLEAN;
BEGIN
  -- 1. Verificar si la promoción está activa
  SELECT (value #>> '{}')::BOOLEAN INTO v_promo_enabled
  FROM global_settings WHERE key = 'featured_promo_enabled';
  
  IF NOT COALESCE(v_promo_enabled, false) THEN
    RETURN QUERY SELECT FALSE, 0, 'La promoción no está activa';
    RETURN;
  END IF;
  
  -- 2. Verificar fechas
  SELECT (value #>> '{}')::DATE INTO v_promo_start
  FROM global_settings WHERE key = 'featured_promo_start';
  
  SELECT (value #>> '{}')::DATE INTO v_promo_end
  FROM global_settings WHERE key = 'featured_promo_end';
  
  IF CURRENT_DATE < COALESCE(v_promo_start, CURRENT_DATE) THEN
    RETURN QUERY SELECT FALSE, 0, 'La promoción aún no comenzó';
    RETURN;
  END IF;
  
  IF CURRENT_DATE > COALESCE(v_promo_end, '2099-12-31'::DATE) THEN
    RETURN QUERY SELECT FALSE, 0, 'La promoción ya finalizó';
    RETURN;
  END IF;
  
  -- 3. Verificar si ya reclamó
  SELECT EXISTS(
    SELECT 1 FROM user_promo_claims 
    WHERE user_id = p_user_id AND promo_code = 'launch_2026'
  ) INTO v_already_claimed;
  
  IF v_already_claimed THEN
    RETURN QUERY SELECT FALSE, 0, 'Ya reclamaste los créditos de esta promoción';
    RETURN;
  END IF;
  
  -- 4. Obtener cantidad de créditos
  SELECT (value #>> '{}')::INT INTO v_promo_credits
  FROM global_settings WHERE key = 'featured_promo_credits';
  v_promo_credits := COALESCE(v_promo_credits, 3);
  
  -- 5. Otorgar créditos (upsert en user_featured_credits)
  INSERT INTO user_featured_credits (user_id, credits_total, credits_used)
  VALUES (p_user_id, v_promo_credits, 0)
  ON CONFLICT (user_id) DO UPDATE 
  SET credits_total = user_featured_credits.credits_total + v_promo_credits;
  
  -- 6. Registrar el claim
  INSERT INTO user_promo_claims (user_id, promo_code, credits_granted)
  VALUES (p_user_id, 'launch_2026', v_promo_credits);
  
  RETURN QUERY SELECT TRUE, v_promo_credits, 
    'Felicitaciones! Recibiste ' || v_promo_credits || ' créditos gratis';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 4. FUNCIÓN: Verificar estado de promoción para un usuario
-- ============================================================================
CREATE OR REPLACE FUNCTION check_promo_status(p_user_id UUID)
RETURNS TABLE (
  promo_active BOOLEAN,
  can_claim BOOLEAN,
  already_claimed BOOLEAN,
  credits_available INT,
  promo_message TEXT,
  promo_end_date DATE
) AS $$
DECLARE
  v_promo_enabled BOOLEAN;
  v_promo_end DATE;
  v_claimed BOOLEAN;
  v_credits INT;
  v_message TEXT;
BEGIN
  -- Obtener configuración
  SELECT (value #>> '{}')::BOOLEAN INTO v_promo_enabled
  FROM global_settings WHERE key = 'featured_promo_enabled';
  
  SELECT (value #>> '{}')::DATE INTO v_promo_end
  FROM global_settings WHERE key = 'featured_promo_end';
  
  SELECT (value #>> '{}')::INT INTO v_credits
  FROM global_settings WHERE key = 'featured_promo_credits';
  
  SELECT value #>> '{}' INTO v_message
  FROM global_settings WHERE key = 'featured_promo_message';
  
  -- Verificar si ya reclamó
  SELECT EXISTS(
    SELECT 1 FROM user_promo_claims 
    WHERE user_id = p_user_id AND promo_code = 'launch_2026'
  ) INTO v_claimed;
  
  -- Determinar si puede reclamar
  RETURN QUERY SELECT 
    COALESCE(v_promo_enabled, false) AND CURRENT_DATE <= COALESCE(v_promo_end, '2099-12-31'::DATE),
    COALESCE(v_promo_enabled, false) AND NOT COALESCE(v_claimed, false) AND CURRENT_DATE <= COALESCE(v_promo_end, '2099-12-31'::DATE),
    COALESCE(v_claimed, false),
    COALESCE(v_credits, 3),
    COALESCE(v_message, '🎉 Créditos gratis de lanzamiento disponibles'),
    v_promo_end;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 5. RLS POLICIES
-- ============================================================================
ALTER TABLE user_promo_claims ENABLE ROW LEVEL SECURITY;

-- Usuario puede ver sus propios claims
CREATE POLICY "Users can view own promo claims" ON user_promo_claims
  FOR SELECT USING (auth.uid() = user_id);

-- Solo el sistema puede insertar (via función SECURITY DEFINER)
CREATE POLICY "System can insert promo claims" ON user_promo_claims
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 6. VERIFICACIÓN
-- ============================================================================
-- Ver configuración de promoción:
SELECT key, value, description 
FROM global_settings 
WHERE key LIKE 'featured_promo%'
ORDER BY key;

-- Test (comentar en producción):
-- SELECT * FROM check_promo_status('user-uuid-here');
-- SELECT * FROM claim_promo_credits('user-uuid-here');
