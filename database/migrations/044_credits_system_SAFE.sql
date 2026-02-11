-- ============================================
-- MIGRACIÓN SAFE: Sistema de Créditos (Re-ejecutable)
-- Fecha: 11 Febrero 2026
-- VERSIÓN SEGURA - Puede ejecutarse múltiples veces sin errores
-- ============================================

-- ============================================
-- 1. TABLA: global_config
-- ============================================
CREATE TABLE IF NOT EXISTS public.global_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(100) NOT NULL UNIQUE,
  value TEXT NOT NULL,
  value_type VARCHAR(20) NOT NULL,
  description TEXT,
  category VARCHAR(50),
  updated_by UUID REFERENCES public.users(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_global_config_key ON public.global_config(key);
CREATE INDEX IF NOT EXISTS idx_global_config_category ON public.global_config(category);

INSERT INTO public.global_config (key, value, value_type, description, category) VALUES
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
-- 2. ACTUALIZAR: subscription_plans
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'subscription_plans'
    AND column_name = 'slug'
  ) THEN
    ALTER TABLE public.subscription_plans ADD COLUMN slug VARCHAR(50);
    UPDATE public.subscription_plans
    SET slug = LOWER(REPLACE(name, ' ', '-'))
    WHERE slug IS NULL;
  END IF;
  
  ALTER TABLE public.subscription_plans
  ADD COLUMN IF NOT EXISTS monthly_free_credits INT DEFAULT 0;
  
  ALTER TABLE public.subscription_plans
  ADD COLUMN IF NOT EXISTS monthly_credits_expire_days INT DEFAULT 30;
  
  UPDATE public.subscription_plans SET
    monthly_free_credits = CASE
      WHEN name = 'free' OR name ILIKE '%free%' THEN 0
      WHEN name = 'basic' OR name ILIKE '%basic%' THEN 1
      WHEN name = 'professional' OR name ILIKE '%pro%' THEN 3
      WHEN name = 'business' OR name ILIKE '%business%' THEN 999
      ELSE 0
    END,
    monthly_credits_expire_days = 30
  WHERE monthly_free_credits = 0 
    AND is_active = true;
END $$;

-- ============================================
-- 3. TABLA: user_credits
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  balance INT NOT NULL DEFAULT 0,
  monthly_allowance INT DEFAULT 0,
  last_monthly_reset TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_credits_user_id ON public.user_credits(user_id);

CREATE OR REPLACE FUNCTION update_user_credits_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_user_credits_updated_at ON public.user_credits;
CREATE TRIGGER trg_update_user_credits_updated_at
BEFORE UPDATE ON public.user_credits
FOR EACH ROW EXECUTE FUNCTION update_user_credits_updated_at();

-- ============================================
-- 4. TABLA: credit_transactions
-- ============================================
CREATE TABLE IF NOT EXISTS public.credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL,
  amount INT NOT NULL,
  balance_after INT NOT NULL,
  description TEXT NOT NULL,
  payment_id UUID,
  featured_ad_id UUID,
  promo_code VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON public.credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_type ON public.credit_transactions(type);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON public.credit_transactions(created_at DESC);

-- ============================================
-- 5. TABLA: featured_ads
-- ============================================
CREATE TABLE IF NOT EXISTS public.featured_ads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id UUID NOT NULL REFERENCES public.ads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id),
  subcategory_id UUID REFERENCES public.subcategories(id),
  duration_days INT DEFAULT 7 CHECK (duration_days IN (7, 14, 21, 28)),
  credits_spent INT DEFAULT 1 CHECK (credits_spent IN (1, 2, 3, 4)),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
  activated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  transaction_id UUID REFERENCES public.credit_transactions(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_featured_ads_ad_id ON public.featured_ads(ad_id);
CREATE INDEX IF NOT EXISTS idx_featured_ads_user_id ON public.featured_ads(user_id);
CREATE INDEX IF NOT EXISTS idx_featured_ads_category_id ON public.featured_ads(category_id);
CREATE INDEX IF NOT EXISTS idx_featured_ads_status ON public.featured_ads(status);
CREATE INDEX IF NOT EXISTS idx_featured_ads_expires_at ON public.featured_ads(expires_at);

ALTER TABLE public.credit_transactions
DROP CONSTRAINT IF EXISTS credit_transactions_featured_ad_id_fkey;

ALTER TABLE public.credit_transactions
ADD CONSTRAINT credit_transactions_featured_ad_id_fkey
FOREIGN KEY (featured_ad_id) REFERENCES public.featured_ads(id) ON DELETE SET NULL;

-- ============================================
-- 6-11. FUNCIONES (ya usan CREATE OR REPLACE, son safe)
-- ============================================

CREATE OR REPLACE FUNCTION public.activate_featured_with_credits(
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
  SELECT value::JSON INTO v_durations
  FROM public.global_config
  WHERE key = 'featured_durations';
  
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
  
  SELECT balance INTO v_current_balance
  FROM public.user_credits
  WHERE user_id = p_user_id;
  
  IF v_current_balance IS NULL OR v_current_balance < v_credits_needed THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Créditos insuficientes',
      'current_balance', COALESCE(v_current_balance, 0),
      'needed', v_credits_needed
    );
  END IF;
  
  SELECT category_id, subcategory_id 
  INTO v_category_id, v_subcategory_id
  FROM public.ads
  WHERE id = p_ad_id 
    AND user_id = p_user_id 
    AND status IN ('published', 'active');
  
  IF v_category_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Aviso no encontrado o no publicado'
    );
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM public.featured_ads 
    WHERE ad_id = p_ad_id AND status = 'active'
  ) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Este aviso ya está destacado'
    );
  END IF;
  
  UPDATE public.user_credits
  SET balance = balance - v_credits_needed
  WHERE user_id = p_user_id
  RETURNING balance INTO v_new_balance;
  
  v_expires_at := NOW() + (p_duration_days || ' days')::INTERVAL;
  
  INSERT INTO public.credit_transactions (
    user_id, type, amount, balance_after, description
  ) VALUES (
    p_user_id,
    'spend',
    -v_credits_needed,
    v_new_balance,
    'Destacar aviso por ' || p_duration_days || ' días'
  ) RETURNING id INTO v_transaction_id;
  
  INSERT INTO public.featured_ads (
    ad_id, user_id, category_id, subcategory_id,
    duration_days, credits_spent, status,
    activated_at, expires_at, transaction_id
  ) VALUES (
    p_ad_id, p_user_id, v_category_id, v_subcategory_id,
    p_duration_days, v_credits_needed, 'active',
    NOW(), v_expires_at, v_transaction_id
  ) RETURNING id INTO v_featured_id;
  
  UPDATE public.credit_transactions
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

CREATE OR REPLACE FUNCTION public.purchase_credits(
  p_user_id UUID,
  p_credits INT,
  p_payment_id UUID
)
RETURNS JSON AS $$
DECLARE
  v_new_balance INT;
  v_transaction_id UUID;
BEGIN
  INSERT INTO public.user_credits (user_id, balance)
  VALUES (p_user_id, 0)
  ON CONFLICT (user_id) DO NOTHING;
  
  UPDATE public.user_credits
  SET balance = balance + p_credits
  WHERE user_id = p_user_id
  RETURNING balance INTO v_new_balance;
  
  INSERT INTO public.credit_transactions (
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

CREATE OR REPLACE FUNCTION public.grant_signup_promo(
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
  FROM public.global_config WHERE key = 'promo_signup_active';
  
  IF NOT v_promo_active THEN
    RETURN json_build_object('success', false, 'error', 'Promoción no activa');
  END IF;
  
  SELECT value::INT INTO v_promo_credits
  FROM public.global_config WHERE key = 'promo_signup_credits';
  
  SELECT value::INT INTO v_expiry_days
  FROM public.global_config WHERE key = 'promo_signup_expiry_days';
  
  IF EXISTS (
    SELECT 1 FROM public.credit_transactions
    WHERE user_id = p_user_id AND type = 'promo_grant'
  ) THEN
    RETURN json_build_object('success', false, 'error', 'Ya recibiste tu bono de bienvenida');
  END IF;
  
  INSERT INTO public.user_credits (user_id, balance)
  VALUES (p_user_id, v_promo_credits)
  ON CONFLICT (user_id) DO UPDATE
  SET balance = user_credits.balance + v_promo_credits
  RETURNING balance INTO v_new_balance;
  
  INSERT INTO public.credit_transactions (
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

CREATE OR REPLACE FUNCTION public.grant_monthly_credits()
RETURNS JSON AS $$
DECLARE
  v_user RECORD;
  v_granted_count INT := 0;
BEGIN
  FOR v_user IN
    SELECT 
      u.id as user_id,
      sp.monthly_free_credits,
      sp.monthly_credits_expire_days,
      uc.last_monthly_reset
    FROM public.users u
    JOIN public.subscription_plans sp ON u.subscription_plan_id = sp.id
    LEFT JOIN public.user_credits uc ON uc.user_id = u.id
    WHERE sp.monthly_free_credits > 0
      AND sp.monthly_free_credits < 999
      AND (uc.last_monthly_reset IS NULL 
           OR uc.last_monthly_reset < DATE_TRUNC('month', NOW()))
  LOOP
    INSERT INTO public.user_credits (user_id, balance, monthly_allowance, last_monthly_reset)
    VALUES (v_user.user_id, v_user.monthly_free_credits, v_user.monthly_free_credits, NOW())
    ON CONFLICT (user_id) DO UPDATE
    SET 
      balance = user_credits.balance + v_user.monthly_free_credits,
      monthly_allowance = v_user.monthly_free_credits,
      last_monthly_reset = NOW();
    
    INSERT INTO public.credit_transactions (
      user_id, type, amount, balance_after, description
    ) VALUES (
      v_user.user_id, 'monthly_grant', v_user.monthly_free_credits,
      (SELECT balance FROM public.user_credits WHERE user_id = v_user.user_id),
      'Créditos mensuales de membresía (Vencen en ' || v_user.monthly_credits_expire_days || ' días)'
    );
    
    v_granted_count := v_granted_count + 1;
  END LOOP;
  
  RETURN json_build_object('success', true, 'users_granted', v_granted_count);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.expire_featured_ads()
RETURNS INT AS $$
DECLARE
  v_expired INT;
BEGIN
  UPDATE public.featured_ads
  SET status = 'expired'
  WHERE status = 'active' AND expires_at <= NOW();
  
  GET DIAGNOSTICS v_expired = ROW_COUNT;
  RETURN v_expired;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.get_featured_by_category(
  p_category_id UUID,
  p_limit INT DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  ad_id UUID,
  expires_at TIMESTAMPTZ,
  ad_title VARCHAR,
  ad_price DECIMAL,
  ad_images JSON
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    fa.id,
    fa.ad_id,
    fa.expires_at,
    a.title,
    a.price,
    a.images
  FROM public.featured_ads fa
  JOIN public.ads a ON a.id = fa.ad_id
  WHERE fa.category_id = p_category_id
    AND fa.status = 'active'
    AND fa.expires_at > NOW()
  ORDER BY fa.activated_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.get_user_featured_ads(
  p_user_id UUID
)
RETURNS TABLE (
  id UUID,
  ad_id UUID,
  status VARCHAR,
  activated_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  credits_spent INT,
  ad_title VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    fa.id,
    fa.ad_id,
    fa.status,
    fa.activated_at,
    fa.expires_at,
    fa.credits_spent,
    a.title
  FROM public.featured_ads fa
  JOIN public.ads a ON a.id = fa.ad_id
  WHERE fa.user_id = p_user_id
  ORDER BY fa.created_at DESC;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.get_credit_transactions(
  p_user_id UUID,
  p_limit INT DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  type VARCHAR,
  amount INT,
  balance_after INT,
  description TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ct.id,
    ct.type,
    ct.amount,
    ct.balance_after,
    ct.description,
    ct.created_at
  FROM public.credit_transactions ct
  WHERE ct.user_id = p_user_id
  ORDER BY ct.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 12. RLS POLICIES (VERSIÓN SAFE)
-- ============================================

ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.featured_ads ENABLE ROW LEVEL SECURITY;

-- DROP existing policies primero
DROP POLICY IF EXISTS "Users can view own credits" ON public.user_credits;
DROP POLICY IF EXISTS "Users can update own credits" ON public.user_credits;
DROP POLICY IF EXISTS "Users can view own transactions" ON public.credit_transactions;
DROP POLICY IF EXISTS "Users can view own featured ads" ON public.featured_ads;
DROP POLICY IF EXISTS "Anyone can view active featured ads" ON public.featured_ads;

-- CREATE policies nuevamente
CREATE POLICY "Users can view own credits"
  ON public.user_credits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own credits"
  ON public.user_credits FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own transactions"
  ON public.credit_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own featured ads"
  ON public.featured_ads FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view active featured ads"
  ON public.featured_ads FOR SELECT
  USING (status = 'active' AND expires_at > NOW());

-- ============================================
-- VERIFICACIÓN FINAL
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '================================================';
  RAISE NOTICE '✅ Migración SAFE completada exitosamente';
  RAISE NOTICE '================================================';
  RAISE NOTICE 'Tablas: global_config, user_credits, credit_transactions, featured_ads';
  RAISE NOTICE 'Columnas: subscription_plans actualizado';
  RAISE NOTICE 'Funciones: 8 RPC creadas/actualizadas';
  RAISE NOTICE 'Policies: 5 RLS policies aplicadas';
  RAISE NOTICE '🚀 Sistema de créditos listo para usar';
  RAISE NOTICE '================================================';
END $$;
