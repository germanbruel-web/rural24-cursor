-- ============================================
-- MIGRACIÓN: Sistema de Créditos y Destacados
-- Fecha: 5 Febrero 2026
-- ============================================

-- ============================================
-- 1. TABLA: global_config (Configuración centralizada)
-- ============================================
CREATE TABLE IF NOT EXISTS global_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(100) NOT NULL UNIQUE,
  value TEXT NOT NULL,
  value_type VARCHAR(20) NOT NULL, -- 'string', 'integer', 'decimal', 'boolean', 'json'
  description TEXT,
  category VARCHAR(50), -- 'credits', 'featured', 'promo', 'pricing'
  updated_by UUID REFERENCES users(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_global_config_key ON global_config(key);
CREATE INDEX idx_global_config_category ON global_config(category);

-- Insertar configuraciones base
INSERT INTO global_config (key, value, value_type, description, category) VALUES
  ('credit_base_price', '2500', 'decimal', 'Precio base: 1 crédito = X ARS', 'credits'),
  ('featured_durations', '[
    {"days": 7, "credits": 1, "label": "1 semana"},
    {"days": 14, "credits": 2, "label": "2 semanas"},
    {"days": 21, "credits": 3, "label": "3 semanas"},
    {"days": 28, "credits": 4, "label": "4 semanas"}
  ]', 'json', 'Duraciones de destacado y créditos requeridos', 'featured'),
  ('promo_signup_active', 'true', 'boolean', 'Activar promo de bienvenida', 'promo'),
  ('promo_signup_credits', '3', 'integer', 'Créditos gratis al registrarse', 'promo'),
  ('promo_signup_expiry_days', '30', 'integer', 'Días hasta que expiren los créditos de promo', 'promo')
ON CONFLICT (key) DO NOTHING;

-- ============================================
-- 2. ACTUALIZAR: membership_plans (si existe)
-- ============================================
DO $$
BEGIN
  -- Verificar si la tabla existe antes de ALTER
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'membership_plans'
  ) THEN
    ALTER TABLE membership_plans
    ADD COLUMN IF NOT EXISTS monthly_free_credits INT DEFAULT 0;
    
    ALTER TABLE membership_plans
    ADD COLUMN IF NOT EXISTS monthly_credits_expire_days INT DEFAULT 30;
    
    -- Actualizar planes existentes solo si existen registros
    UPDATE membership_plans SET
      monthly_free_credits = CASE
        WHEN slug = 'free' THEN 0
        WHEN slug = 'basic' THEN 1
        WHEN slug = 'professional' THEN 3
        WHEN slug = 'business' THEN 999
        ELSE 0
      END,
      monthly_credits_expire_days = 30
    WHERE monthly_free_credits = 0 
      AND is_active = true;
    
    RAISE NOTICE 'membership_plans actualizada correctamente';
  ELSE
    RAISE WARNING 'Tabla membership_plans no existe - omitiendo actualización';
  END IF;
END $$;

-- ============================================
-- 3. TABLA: user_credits
-- ============================================
CREATE TABLE IF NOT EXISTS user_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  balance INT NOT NULL DEFAULT 0,
  monthly_allowance INT DEFAULT 0,
  last_monthly_reset TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX idx_user_credits_user_id ON user_credits(user_id);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_user_credits_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_user_credits_updated_at ON user_credits;
CREATE TRIGGER trg_update_user_credits_updated_at
BEFORE UPDATE ON user_credits
FOR EACH ROW EXECUTE FUNCTION update_user_credits_updated_at();

-- ============================================
-- 4. TABLA: credit_transactions
-- ============================================
CREATE TABLE IF NOT EXISTS credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL, -- 'purchase', 'monthly_grant', 'promo_grant', 'spend', 'refund'
  amount INT NOT NULL,
  balance_after INT NOT NULL,
  description TEXT NOT NULL,
  payment_id UUID,
  featured_ad_id UUID REFERENCES featured_ads(id),
  promo_code VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX idx_credit_transactions_type ON credit_transactions(type);
CREATE INDEX idx_credit_transactions_created_at ON credit_transactions(created_at DESC);

-- ============================================
-- 5. CREAR o ACTUALIZAR: featured_ads
-- ============================================
CREATE TABLE IF NOT EXISTS featured_ads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id UUID NOT NULL REFERENCES ads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id),
  subcategory_id UUID REFERENCES subcategories(id),
  duration_days INT DEFAULT 7 CHECK (duration_days IN (7, 14, 21, 28)),
  credits_spent INT DEFAULT 1 CHECK (credits_spent IN (1, 2, 3, 4)),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
  activated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  transaction_id UUID REFERENCES credit_transactions(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_featured_ads_ad_id ON featured_ads(ad_id);
CREATE INDEX IF NOT EXISTS idx_featured_ads_user_id ON featured_ads(user_id);
CREATE INDEX IF NOT EXISTS idx_featured_ads_category_id ON featured_ads(category_id);
CREATE INDEX IF NOT EXISTS idx_featured_ads_status ON featured_ads(status);
CREATE INDEX IF NOT EXISTS idx_featured_ads_expires_at ON featured_ads(expires_at);

-- Si la tabla ya existe, agregar columnas nuevas (si faltan)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'featured_ads') THEN
    ALTER TABLE featured_ads
    ADD COLUMN IF NOT EXISTS duration_days INT DEFAULT 7;
    
    ALTER TABLE featured_ads
    ADD COLUMN IF NOT EXISTS credits_spent INT DEFAULT 1;
    
    ALTER TABLE featured_ads
    ADD COLUMN IF NOT EXISTS transaction_id UUID REFERENCES credit_transactions(id);
    
    -- Agregar constraints si no existen
    BEGIN
      ALTER TABLE featured_ads
      ADD CONSTRAINT chk_featured_duration CHECK (duration_days IN (7, 14, 21, 28));
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    
    BEGIN
      ALTER TABLE featured_ads
      ADD CONSTRAINT chk_featured_credits CHECK (credits_spent IN (1, 2, 3, 4));
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    
    RAISE NOTICE 'featured_ads actualizada correctamente';
  END IF;
END $$;

-- ============================================
-- 6. FUNCIÓN: Destacar aviso con créditos
-- ============================================
CREATE OR REPLACE FUNCTION activate_featured_with_credits(
  p_user_id UUID,
  p_ad_id UUID,
  p_duration_days INT
)
RETURNS JSON AS $$
DECLARE
  v_credits_needed INT;
  v_current_balance INT;
  v_new_balance INT;
  v_category_id UUID;
  v_subcategory_id UUID;
  v_featured_id UUID;
  v_transaction_id UUID;
  v_expires_at TIMESTAMPTZ;
  v_durations JSON;
BEGIN
  -- 1. Obtener configuración de duraciones
  SELECT value::JSON INTO v_durations
  FROM global_config
  WHERE key = 'featured_durations';
  
  -- 2. Buscar configuración para esta duración
  SELECT (elem ->> 'credits')::INT INTO v_credits_needed
  FROM jsonb_array_elements(v_durations::jsonb) AS elem
  WHERE (elem ->> 'days')::INT = p_duration_days;
  
  IF v_credits_needed IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Duración inválida',
      'valid_durations', v_durations
    );
  END IF;
  
  -- 3. Verificar balance
  SELECT balance INTO v_current_balance
  FROM user_credits
  WHERE user_id = p_user_id;
  
  IF v_current_balance IS NULL OR v_current_balance < v_credits_needed THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Créditos insuficientes',
      'current_balance', COALESCE(v_current_balance, 0),
      'needed', v_credits_needed
    );
  END IF;
  
  -- 4. Verificar aviso
  SELECT category_id, subcategory_id 
  INTO v_category_id, v_subcategory_id
  FROM ads
  WHERE id = p_ad_id AND user_id = p_user_id AND status = 'published';
  
  IF v_category_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Aviso no encontrado o no publicado'
    );
  END IF;
  
  -- 5. Verificar que no esté ya destacado
  IF EXISTS (
    SELECT 1 FROM featured_ads 
    WHERE ad_id = p_ad_id AND status = 'active'
  ) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Este aviso ya está destacado'
    );
  END IF;
  
  -- 6. Descontar créditos
  UPDATE user_credits
  SET balance = balance - v_credits_needed
  WHERE user_id = p_user_id
  RETURNING balance INTO v_new_balance;
  
  -- 7. Calcular expiración
  v_expires_at := NOW() + (p_duration_days || ' days')::INTERVAL;
  
  -- 8. Registrar transacción
  INSERT INTO credit_transactions (
    user_id, type, amount, balance_after, description
  ) VALUES (
    p_user_id,
    'spend',
    -v_credits_needed,
    v_new_balance,
    'Destacar aviso por ' || p_duration_days || ' días'
  ) RETURNING id INTO v_transaction_id;
  
  -- 9. Crear destacado
  INSERT INTO featured_ads (
    ad_id, user_id, category_id, subcategory_id,
    duration_days, credits_spent, status,
    activated_at, expires_at, transaction_id
  ) VALUES (
    p_ad_id, p_user_id, v_category_id, v_subcategory_id,
    p_duration_days, v_credits_needed, 'active',
    NOW(), v_expires_at, v_transaction_id
  ) RETURNING id INTO v_featured_id;
  
  UPDATE credit_transactions
  SET featured_ad_id = v_featured_id
  WHERE id = v_transaction_id;
  
  RETURN json_build_object(
    'success', true,
    'featured_id', v_featured_id,
    'new_balance', v_new_balance,
    'expires_at', v_expires_at
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 7. FUNCIÓN: Comprar créditos
-- ============================================
CREATE OR REPLACE FUNCTION purchase_credits(
  p_user_id UUID,
  p_credits INT,
  p_payment_id UUID
)
RETURNS JSON AS $$
DECLARE
  v_new_balance INT;
  v_transaction_id UUID;
BEGIN
  -- Crear registro si no existe
  INSERT INTO user_credits (user_id, balance)
  VALUES (p_user_id, 0)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Actualizar balance
  UPDATE user_credits
  SET balance = balance + p_credits
  WHERE user_id = p_user_id
  RETURNING balance INTO v_new_balance;
  
  -- Registrar transacción
  INSERT INTO credit_transactions (
    user_id, type, amount, balance_after, payment_id, description
  ) VALUES (
    p_user_id, 
    'purchase', 
    p_credits, 
    v_new_balance, 
    p_payment_id,
    'Compra de ' || p_credits || ' crédito(s)'
  ) RETURNING id INTO v_transaction_id;
  
  RETURN json_build_object(
    'success', true,
    'new_balance', v_new_balance,
    'transaction_id', v_transaction_id
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 8. FUNCIÓN: Otorgar promo de bienvenida
-- ============================================
CREATE OR REPLACE FUNCTION grant_signup_promo(
  p_user_id UUID
)
RETURNS JSON AS $$
DECLARE
  v_promo_active BOOLEAN;
  v_promo_credits INT;
  v_expiry_days INT;
  v_new_balance INT;
BEGIN
  SELECT value::BOOLEAN INTO v_promo_active
  FROM global_config WHERE key = 'promo_signup_active';
  
  IF NOT v_promo_active THEN
    RETURN json_build_object('success', false, 'error', 'Promoción no activa');
  END IF;
  
  SELECT value::INT INTO v_promo_credits
  FROM global_config WHERE key = 'promo_signup_credits';
  
  SELECT value::INT INTO v_expiry_days
  FROM global_config WHERE key = 'promo_signup_expiry_days';
  
  IF EXISTS (
    SELECT 1 FROM credit_transactions
    WHERE user_id = p_user_id AND type = 'promo_grant'
  ) THEN
    RETURN json_build_object('success', false, 'error', 'Ya recibiste tu bono de bienvenida');
  END IF;
  
  INSERT INTO user_credits (user_id, balance)
  VALUES (p_user_id, v_promo_credits)
  ON CONFLICT (user_id) DO UPDATE
  SET balance = user_credits.balance + v_promo_credits
  RETURNING balance INTO v_new_balance;
  
  INSERT INTO credit_transactions (
    user_id, type, amount, balance_after, description, promo_code
  ) VALUES (
    p_user_id, 'promo_grant', v_promo_credits, v_new_balance,
    '🎁 Bono de Bienvenida - ¡Promoción Lanzamiento! (Vence en ' || v_expiry_days || ' días)',
    'WELCOME2026'
  );
  
  RETURN json_build_object(
    'success', true,
    'credits_granted', v_promo_credits,
    'expiry_days', v_expiry_days,
    'new_balance', v_new_balance
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 9. FUNCIÓN: Otorgar créditos mensuales
-- ============================================
CREATE OR REPLACE FUNCTION grant_monthly_credits()
RETURNS JSON AS $$
DECLARE
  v_user RECORD;
  v_granted_count INT := 0;
BEGIN
  FOR v_user IN
    SELECT 
      u.id as user_id,
      mp.monthly_free_credits,
      mp.monthly_credits_expire_days,
      uc.last_monthly_reset
    FROM users u
    JOIN membership_plans mp ON u.membership_plan_id = mp.id
    LEFT JOIN user_credits uc ON uc.user_id = u.id
    WHERE mp.monthly_free_credits > 0
      AND mp.monthly_free_credits < 999
      AND (uc.last_monthly_reset IS NULL 
           OR uc.last_monthly_reset < DATE_TRUNC('month', NOW()))
  LOOP
    INSERT INTO user_credits (user_id, balance, monthly_allowance, last_monthly_reset)
    VALUES (v_user.user_id, v_user.monthly_free_credits, v_user.monthly_free_credits, NOW())
    ON CONFLICT (user_id) DO UPDATE
    SET 
      balance = user_credits.balance + v_user.monthly_free_credits,
      monthly_allowance = v_user.monthly_free_credits,
      last_monthly_reset = NOW();
    
    INSERT INTO credit_transactions (
      user_id, type, amount, balance_after, description
    ) VALUES (
      v_user.user_id, 'monthly_grant', v_user.monthly_free_credits,
      (SELECT balance FROM user_credits WHERE user_id = v_user.user_id),
      'Créditos mensuales de membresía (Vencen en ' || v_user.monthly_credits_expire_days || ' días)'
    );
    
    v_granted_count := v_granted_count + 1;
  END LOOP;
  
  RETURN json_build_object('success', true, 'users_granted', v_granted_count);
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 10. FUNCIÓN: Expirar destacados automáticamente
-- ============================================
CREATE OR REPLACE FUNCTION expire_featured_ads()
RETURNS INT AS $$
DECLARE
  v_expired INT;
BEGIN
  UPDATE featured_ads
  SET status = 'expired'
  WHERE status = 'active' AND expires_at <= NOW();
  
  GET DIAGNOSTICS v_expired = ROW_COUNT;
  RETURN v_expired;
END;
$$ LANGUAGE plpgsql;
