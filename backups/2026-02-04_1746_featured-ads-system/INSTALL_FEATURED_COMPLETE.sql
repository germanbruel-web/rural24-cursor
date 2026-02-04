-- ============================================================================
-- INSTALACIÓN COMPLETA: Sistema de Avisos Destacados
-- ============================================================================
-- Fecha: 2026-02-04
-- Este archivo consolida las migraciones 043, 045 y 046
-- Ejecutar COMPLETO en Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- PARTE 1: TABLAS
-- ============================================================================

-- 1.1 Tabla de créditos por usuario
CREATE TABLE IF NOT EXISTS user_featured_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  credits_total INT NOT NULL DEFAULT 0,
  credits_used INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT user_featured_credits_user_unique UNIQUE(user_id),
  CONSTRAINT credits_check CHECK (credits_used <= credits_total AND credits_total >= 0 AND credits_used >= 0)
);

-- 1.2 Tabla principal de avisos destacados
CREATE TABLE IF NOT EXISTS featured_ads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id UUID NOT NULL REFERENCES ads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  placement VARCHAR(20) NOT NULL CHECK (placement IN ('homepage', 'results', 'detail')),
  category_id UUID NOT NULL REFERENCES categories(id),
  scheduled_start DATE NOT NULL,
  actual_start TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  duration_days INT NOT NULL DEFAULT 15,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' 
    CHECK (status IN ('pending', 'active', 'expired', 'cancelled')),
  priority INT DEFAULT 0,
  credit_consumed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.3 Tabla de claims de promoción
CREATE TABLE IF NOT EXISTS user_promo_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  promo_code VARCHAR(50) NOT NULL DEFAULT 'launch_2026',
  credits_granted INT NOT NULL,
  claimed_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT user_promo_claims_unique UNIQUE(user_id, promo_code)
);

-- ============================================================================
-- PARTE 2: ÍNDICES
-- ============================================================================

CREATE UNIQUE INDEX IF NOT EXISTS idx_featured_ads_unique_ad_placement 
  ON featured_ads(ad_id, placement) 
  WHERE status IN ('pending', 'active');

CREATE UNIQUE INDEX IF NOT EXISTS idx_featured_ads_unique_user_placement 
  ON featured_ads(user_id, placement) 
  WHERE status IN ('pending', 'active');

CREATE INDEX IF NOT EXISTS idx_featured_ads_status ON featured_ads(status);
CREATE INDEX IF NOT EXISTS idx_featured_ads_placement ON featured_ads(placement);
CREATE INDEX IF NOT EXISTS idx_featured_ads_category ON featured_ads(category_id);
CREATE INDEX IF NOT EXISTS idx_featured_ads_user ON featured_ads(user_id);
CREATE INDEX IF NOT EXISTS idx_featured_ads_expires ON featured_ads(expires_at) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_featured_ads_scheduled ON featured_ads(scheduled_start) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_user_promo_claims_user ON user_promo_claims(user_id);

-- ============================================================================
-- PARTE 3: TRIGGER UPDATED_AT
-- ============================================================================

CREATE OR REPLACE FUNCTION update_featured_ads_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_featured_ads_updated ON featured_ads;
CREATE TRIGGER trigger_featured_ads_updated
  BEFORE UPDATE ON featured_ads
  FOR EACH ROW
  EXECUTE FUNCTION update_featured_ads_timestamp();

-- ============================================================================
-- PARTE 4: CONFIGURACIONES DE PROMOCIÓN
-- ============================================================================

INSERT INTO global_settings (key, value, category, display_name, description, value_type, is_public)
VALUES 
  ('featured_promo_enabled', 'true'::jsonb, 'featured', 'Promoción activa', 
   'Habilita la promoción de créditos gratuitos de lanzamiento', 'boolean', true),
  ('featured_promo_credits', '3'::jsonb, 'featured', 'Créditos promocionales', 
   'Cantidad de créditos gratuitos que recibe cada usuario durante la promoción', 'number', true),
  ('featured_promo_start', '"2026-02-04"'::jsonb, 'featured', 'Inicio promoción', 
   'Fecha de inicio de la promoción de créditos', 'string', false),
  ('featured_promo_end', '"2026-03-31"'::jsonb, 'featured', 'Fin promoción', 
   'Fecha de fin de la promoción de créditos', 'string', false),
  ('featured_promo_message', '"🎉 ¡Lanzamiento! Recibí 3 créditos GRATIS para destacar tus avisos"'::jsonb, 'featured', 'Mensaje promocional', 
   'Mensaje que se muestra a usuarios sobre la promoción', 'string', true)
ON CONFLICT (key) DO UPDATE SET 
  value = EXCLUDED.value,
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description;

-- ============================================================================
-- PARTE 5: FUNCIONES RPC
-- ============================================================================

-- 5.1 Verificar disponibilidad
CREATE OR REPLACE FUNCTION check_featured_availability(
  p_placement VARCHAR(20),
  p_category_id UUID,
  p_start_date DATE,
  p_duration_days INT DEFAULT 15
)
RETURNS TABLE (
  is_available BOOLEAN,
  slots_total INT,
  slots_used INT,
  slots_available INT,
  next_available_date DATE
) AS $$
DECLARE
  v_max_slots INT;
  v_end_date DATE;
  v_used_slots INT;
  v_next_date DATE;
BEGIN
  SELECT (value #>> '{}')::INT INTO v_max_slots
  FROM global_settings 
  WHERE key = 'featured_slots_' || p_placement;
  
  IF v_max_slots IS NULL THEN
    v_max_slots := 10;
  END IF;
  
  v_end_date := p_start_date + p_duration_days;
  
  SELECT COUNT(DISTINCT user_id) INTO v_used_slots
  FROM featured_ads
  WHERE placement = p_placement
    AND category_id = p_category_id
    AND status IN ('active', 'pending')
    AND (
      (scheduled_start <= p_start_date AND COALESCE(expires_at::date, scheduled_start + duration_days) > p_start_date)
      OR (scheduled_start >= p_start_date AND scheduled_start < v_end_date)
    );
  
  IF v_used_slots >= v_max_slots THEN
    SELECT MIN(COALESCE(expires_at::date, scheduled_start + duration_days)) INTO v_next_date
    FROM featured_ads
    WHERE placement = p_placement
      AND category_id = p_category_id
      AND status IN ('active', 'pending')
      AND COALESCE(expires_at::date, scheduled_start + duration_days) > CURRENT_DATE;
  END IF;
  
  RETURN QUERY SELECT 
    (v_used_slots < v_max_slots),
    v_max_slots,
    v_used_slots,
    (v_max_slots - v_used_slots),
    COALESCE(v_next_date, p_start_date);
END;
$$ LANGUAGE plpgsql;

-- 5.2 Crear destacado
CREATE OR REPLACE FUNCTION create_featured_ad(
  p_ad_id UUID,
  p_user_id UUID,
  p_placement VARCHAR(20),
  p_scheduled_start DATE
)
RETURNS TABLE (
  success BOOLEAN,
  featured_id UUID,
  error_message TEXT
) AS $$
DECLARE
  v_category_id UUID;
  v_ad_user_id UUID;
  v_credits_available INT;
  v_is_available BOOLEAN;
  v_duration INT;
  v_new_id UUID;
BEGIN
  SELECT category_id, user_id INTO v_category_id, v_ad_user_id
  FROM ads WHERE id = p_ad_id;
  
  IF v_category_id IS NULL THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, 'Aviso no encontrado';
    RETURN;
  END IF;
  
  IF v_ad_user_id != p_user_id THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, 'No sos el dueño de este aviso';
    RETURN;
  END IF;
  
  SELECT (credits_total - credits_used) INTO v_credits_available
  FROM user_featured_credits WHERE user_id = p_user_id;
  
  IF COALESCE(v_credits_available, 0) <= 0 THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, 'No tenés créditos disponibles';
    RETURN;
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM featured_ads 
    WHERE user_id = p_user_id 
      AND placement = p_placement 
      AND status IN ('pending', 'active')
  ) THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, 'Ya tenés un aviso destacado en esta ubicación';
    RETURN;
  END IF;
  
  SELECT (value #>> '{}')::INT INTO v_duration
  FROM global_settings WHERE key = 'featured_duration_days';
  v_duration := COALESCE(v_duration, 15);
  
  SELECT fa.is_available INTO v_is_available
  FROM check_featured_availability(p_placement, v_category_id, p_scheduled_start, v_duration) fa;
  
  IF NOT v_is_available THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, 'No hay lugares disponibles para esa fecha';
    RETURN;
  END IF;
  
  INSERT INTO featured_ads (
    ad_id, user_id, placement, category_id, 
    scheduled_start, duration_days, status, priority
  ) VALUES (
    p_ad_id, p_user_id, p_placement, v_category_id,
    p_scheduled_start, v_duration, 'pending', EXTRACT(EPOCH FROM NOW())::INT
  ) RETURNING id INTO v_new_id;
  
  UPDATE user_featured_credits 
  SET credits_used = credits_used + 1
  WHERE user_id = p_user_id;
  
  UPDATE featured_ads SET credit_consumed = TRUE WHERE id = v_new_id;
  
  RETURN QUERY SELECT TRUE, v_new_id, NULL::TEXT;
END;
$$ LANGUAGE plpgsql;

-- 5.3 Activar pendientes (CRON)
CREATE OR REPLACE FUNCTION activate_pending_featured_ads()
RETURNS INT AS $$
DECLARE
  v_count INT := 0;
BEGIN
  UPDATE featured_ads
  SET 
    status = 'active',
    actual_start = NOW(),
    expires_at = NOW() + (duration_days || ' days')::INTERVAL
  WHERE status = 'pending'
    AND scheduled_start <= CURRENT_DATE;
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  
  UPDATE featured_ads
  SET status = 'expired'
  WHERE status = 'active'
    AND expires_at < NOW();
  
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- 5.4 Obtener destacados para homepage
CREATE OR REPLACE FUNCTION get_featured_for_homepage(
  p_category_id UUID,
  p_limit INT DEFAULT 10
)
RETURNS TABLE (
  ad_id UUID,
  user_id UUID,
  featured_id UUID,
  priority INT
) AS $$
BEGIN
  RETURN QUERY
  WITH ranked AS (
    SELECT 
      fa.ad_id,
      fa.user_id,
      fa.id as featured_id,
      fa.priority,
      ROW_NUMBER() OVER (PARTITION BY fa.user_id ORDER BY fa.created_at ASC) as rn
    FROM featured_ads fa
    WHERE fa.placement = 'homepage'
      AND fa.category_id = p_category_id
      AND fa.status = 'active'
  )
  SELECT r.ad_id, r.user_id, r.featured_id, r.priority
  FROM ranked r
  WHERE r.rn = 1
  ORDER BY r.priority ASC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- 5.5 Obtener destacados para resultados
CREATE OR REPLACE FUNCTION get_featured_for_results(
  p_category_id UUID,
  p_limit INT DEFAULT 4,
  p_offset INT DEFAULT 0
)
RETURNS TABLE (
  ad_id UUID,
  user_id UUID,
  featured_id UUID
) AS $$
BEGIN
  RETURN QUERY
  WITH unique_users AS (
    SELECT DISTINCT ON (fa.user_id)
      fa.ad_id,
      fa.user_id,
      fa.id as featured_id,
      fa.created_at
    FROM featured_ads fa
    WHERE fa.placement = 'results'
      AND fa.category_id = p_category_id
      AND fa.status = 'active'
    ORDER BY fa.user_id, fa.created_at ASC
  )
  SELECT u.ad_id, u.user_id, u.featured_id
  FROM unique_users u
  ORDER BY u.created_at ASC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- 5.6 Verificar estado de promoción
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
  v_promo_start DATE;
  v_claimed BOOLEAN;
  v_credits INT;
  v_message TEXT;
BEGIN
  SELECT (value #>> '{}')::BOOLEAN INTO v_promo_enabled
  FROM global_settings WHERE key = 'featured_promo_enabled';
  
  SELECT (value #>> '{}')::DATE INTO v_promo_start
  FROM global_settings WHERE key = 'featured_promo_start';
  
  SELECT (value #>> '{}')::DATE INTO v_promo_end
  FROM global_settings WHERE key = 'featured_promo_end';
  
  SELECT (value #>> '{}')::INT INTO v_credits
  FROM global_settings WHERE key = 'featured_promo_credits';
  
  SELECT value #>> '{}' INTO v_message
  FROM global_settings WHERE key = 'featured_promo_message';
  
  SELECT EXISTS(
    SELECT 1 FROM user_promo_claims 
    WHERE user_id = p_user_id AND promo_code = 'launch_2026'
  ) INTO v_claimed;
  
  RETURN QUERY SELECT 
    COALESCE(v_promo_enabled, false) 
      AND CURRENT_DATE >= COALESCE(v_promo_start, CURRENT_DATE)
      AND CURRENT_DATE <= COALESCE(v_promo_end, '2099-12-31'::DATE),
    COALESCE(v_promo_enabled, false) 
      AND NOT COALESCE(v_claimed, false) 
      AND CURRENT_DATE >= COALESCE(v_promo_start, CURRENT_DATE)
      AND CURRENT_DATE <= COALESCE(v_promo_end, '2099-12-31'::DATE),
    COALESCE(v_claimed, false),
    COALESCE(v_credits, 3),
    COALESCE(v_message, '🎉 Créditos gratis de lanzamiento disponibles'),
    v_promo_end;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5.7 Reclamar créditos promocionales
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
  SELECT (value #>> '{}')::BOOLEAN INTO v_promo_enabled
  FROM global_settings WHERE key = 'featured_promo_enabled';
  
  IF NOT COALESCE(v_promo_enabled, false) THEN
    RETURN QUERY SELECT FALSE, 0, 'La promoción no está activa'::TEXT;
    RETURN;
  END IF;
  
  SELECT (value #>> '{}')::DATE INTO v_promo_start
  FROM global_settings WHERE key = 'featured_promo_start';
  
  SELECT (value #>> '{}')::DATE INTO v_promo_end
  FROM global_settings WHERE key = 'featured_promo_end';
  
  IF CURRENT_DATE < COALESCE(v_promo_start, CURRENT_DATE) THEN
    RETURN QUERY SELECT FALSE, 0, 'La promoción aún no comenzó'::TEXT;
    RETURN;
  END IF;
  
  IF CURRENT_DATE > COALESCE(v_promo_end, '2099-12-31'::DATE) THEN
    RETURN QUERY SELECT FALSE, 0, 'La promoción ya finalizó'::TEXT;
    RETURN;
  END IF;
  
  SELECT EXISTS(
    SELECT 1 FROM user_promo_claims 
    WHERE user_id = p_user_id AND promo_code = 'launch_2026'
  ) INTO v_already_claimed;
  
  IF v_already_claimed THEN
    RETURN QUERY SELECT FALSE, 0, 'Ya reclamaste los créditos de esta promoción'::TEXT;
    RETURN;
  END IF;
  
  SELECT (value #>> '{}')::INT INTO v_promo_credits
  FROM global_settings WHERE key = 'featured_promo_credits';
  v_promo_credits := COALESCE(v_promo_credits, 3);
  
  INSERT INTO user_featured_credits (user_id, credits_total, credits_used)
  VALUES (p_user_id, v_promo_credits, 0)
  ON CONFLICT (user_id) DO UPDATE 
  SET credits_total = user_featured_credits.credits_total + v_promo_credits;
  
  INSERT INTO user_promo_claims (user_id, promo_code, credits_granted)
  VALUES (p_user_id, 'launch_2026', v_promo_credits);
  
  RETURN QUERY SELECT TRUE, v_promo_credits, 
    ('¡Felicitaciones! Recibiste ' || v_promo_credits || ' créditos gratis')::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PARTE 6: RLS POLICIES
-- ============================================================================

ALTER TABLE user_featured_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE featured_ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_promo_claims ENABLE ROW LEVEL SECURITY;

-- Créditos
DROP POLICY IF EXISTS "Users can view own credits" ON user_featured_credits;
CREATE POLICY "Users can view own credits" ON user_featured_credits
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can manage credits" ON user_featured_credits;
CREATE POLICY "System can manage credits" ON user_featured_credits
  FOR ALL USING (true);

-- Featured Ads
DROP POLICY IF EXISTS "Users can view own featured ads" ON featured_ads;
CREATE POLICY "Users can view own featured ads" ON featured_ads
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Public can view active featured" ON featured_ads;
CREATE POLICY "Public can view active featured" ON featured_ads
  FOR SELECT USING (status = 'active');

DROP POLICY IF EXISTS "Users can create featured ads" ON featured_ads;
CREATE POLICY "Users can create featured ads" ON featured_ads
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own featured" ON featured_ads;
CREATE POLICY "Users can update own featured" ON featured_ads
  FOR UPDATE USING (auth.uid() = user_id);

-- Promo Claims
DROP POLICY IF EXISTS "Users can view own promo claims" ON user_promo_claims;
CREATE POLICY "Users can view own promo claims" ON user_promo_claims
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can insert promo claims" ON user_promo_claims;
CREATE POLICY "System can insert promo claims" ON user_promo_claims
  FOR ALL USING (true);

-- ============================================================================
-- VERIFICACIÓN FINAL
-- ============================================================================
SELECT 'Tablas creadas:' as info;
SELECT tablename FROM pg_tables WHERE tablename IN ('user_featured_credits', 'featured_ads', 'user_promo_claims');

SELECT 'Funciones creadas:' as info;
SELECT proname FROM pg_proc WHERE proname IN ('check_promo_status', 'claim_promo_credits', 'check_featured_availability', 'create_featured_ad', 'activate_pending_featured_ads', 'get_featured_for_homepage', 'get_featured_for_results');

SELECT 'Configuraciones de promoción:' as info;
SELECT key, value FROM global_settings WHERE key LIKE 'featured_promo%';
