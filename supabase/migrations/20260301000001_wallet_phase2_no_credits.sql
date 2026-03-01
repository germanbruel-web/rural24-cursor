-- ============================================================
-- MIGRATION: wallet_phase2_no_credits
-- Fecha: 2026-03-01
-- Objetivo: Eliminar concepto "créditos" — todo el sistema
--           de saldo publicitario opera en ARS vía user_wallets
--
-- Cambios:
--   1. coupons: columna ars_amount (ARS directos, sin conversión)
--   2. global_config: featured_durations → price_ars (no credits)
--   3. global_config: agregar featured_slot_price_ars
--   4. user_wallets: resetear saldos legacy a 0
--   5. RPC redeem_coupon: lee ars_amount, escribe user_wallets
--   6. RPC activate_featured_with_credits: lee user_wallets
--   7. RPC create_featured_ad: lee user_wallets
-- ============================================================

BEGIN;

-- ============================================================
-- 1. COUPONS — nueva columna ars_amount
-- ============================================================

ALTER TABLE public.coupons
  ADD COLUMN IF NOT EXISTS ars_amount NUMERIC(14,2);

-- RURAL24: el nombre dice "50.000 ARS" → ars_amount = 50000
UPDATE public.coupons
SET ars_amount = 50000
WHERE code = 'RURAL24';

-- ============================================================
-- 2. GLOBAL_CONFIG — featured_durations en price_ars (no credits)
-- ============================================================

UPDATE public.global_config
SET value = '[
  {"days": 7,  "price_ars": 2500,  "label": "1 semana"},
  {"days": 14, "price_ars": 5000,  "label": "2 semanas"},
  {"days": 21, "price_ars": 7500,  "label": "3 semanas"},
  {"days": 28, "price_ars": 10000, "label": "4 semanas"}
]'
WHERE key = 'featured_durations';

-- Precio unitario para slots del modal (create_featured_ad)
INSERT INTO public.global_config (key, value, value_type, category, description)
VALUES (
  'featured_slot_price_ars',
  '2500',
  'integer',
  'featured',
  'Precio en ARS por slot de Aviso Destacado (create_featured_ad)'
)
ON CONFLICT (key) DO UPDATE SET
  value = '2500',
  value_type = 'integer';

-- ============================================================
-- 3. USER_WALLETS — resetear saldos legacy (backfill 1:1 en créditos)
-- ============================================================

UPDATE public.user_wallets
SET
  virtual_balance = 0,
  updated_at = NOW()
WHERE virtual_balance != 0;

-- ============================================================
-- 4. RPC: redeem_coupon
--    Lee coupons.ars_amount
--    Escribe user_wallets.virtual_balance + wallet_transactions
--    Ya NO escribe en user_featured_credits ni credit_transactions
-- ============================================================

CREATE OR REPLACE FUNCTION public.redeem_coupon(
  p_user_id UUID,
  p_code    CHARACTER VARYING
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_coupon          RECORD;
  v_current_balance NUMERIC(14,2);
  v_new_balance     NUMERIC(14,2);
BEGIN
  -- Buscar cupón válido con ars_amount configurado
  SELECT * INTO v_coupon
  FROM public.coupons
  WHERE UPPER(code) = UPPER(p_code)
    AND is_active = TRUE
    AND (expires_at IS NULL OR expires_at > NOW())
    AND (max_redemptions IS NULL OR current_redemptions < max_redemptions)
    AND ars_amount IS NOT NULL
    AND ars_amount > 0;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', FALSE,
      'error',   'Cupón inválido, expirado o agotado'
    );
  END IF;

  -- Verificar que el usuario no lo redimió antes (UNIQUE constraint)
  IF EXISTS (
    SELECT 1 FROM public.coupon_redemptions
    WHERE coupon_id = v_coupon.id AND user_id = p_user_id
  ) THEN
    RETURN json_build_object(
      'success', FALSE,
      'error',   'Ya canjeaste este cupón anteriormente'
    );
  END IF;

  -- Obtener balance actual del wallet
  SELECT virtual_balance INTO v_current_balance
  FROM public.user_wallets
  WHERE user_id = p_user_id;

  -- Crear wallet si no existe aún
  IF NOT FOUND THEN
    INSERT INTO public.user_wallets (user_id, currency, virtual_balance, real_balance)
    VALUES (p_user_id, 'ARS', 0, 0);
    v_current_balance := 0;
  END IF;

  v_new_balance := v_current_balance + v_coupon.ars_amount;

  -- Incrementar contador de canjes del cupón
  UPDATE public.coupons
  SET
    current_redemptions = current_redemptions + 1,
    updated_at          = NOW()
  WHERE id = v_coupon.id;

  -- Registrar la redención
  INSERT INTO public.coupon_redemptions (coupon_id, user_id)
  VALUES (v_coupon.id, p_user_id);

  -- Acreditar ARS en wallet virtual
  UPDATE public.user_wallets
  SET
    virtual_balance = v_new_balance,
    updated_at      = NOW()
  WHERE user_id = p_user_id;

  -- Ledger auditables
  INSERT INTO public.wallet_transactions (
    user_id, bucket, tx_type, amount, balance_after,
    source, description, metadata
  ) VALUES (
    p_user_id,
    'virtual',
    'credit',
    v_coupon.ars_amount,
    v_new_balance,
    'coupon',
    'Cupón canjeado: ' || COALESCE(v_coupon.name, v_coupon.code),
    json_build_object(
      'coupon_code', v_coupon.code,
      'coupon_id',   v_coupon.id,
      'coupon_name', v_coupon.name
    )::JSONB
  );

  RETURN json_build_object(
    'success',      TRUE,
    'ars_credited', v_coupon.ars_amount,
    'new_balance',  v_new_balance,
    'message',      '¡Cupón canjeado! Se acreditaron $' ||
                    to_char(v_coupon.ars_amount, 'FM999G999G999') ||
                    ' ARS a tu saldo'
  );

EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', FALSE,
    'error',   SQLERRM
  );
END;
$$;

-- ============================================================
-- 5. RPC: activate_featured_with_credits
--    Lee user_wallets.virtual_balance
--    Usa featured_durations.price_ars
--    Escribe wallet_transactions (debit)
-- ============================================================

CREATE OR REPLACE FUNCTION public.activate_featured_with_credits(
  p_user_id     UUID,
  p_ad_id       UUID,
  p_duration_days INTEGER
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  v_price_ars       NUMERIC(14,2);
  v_current_balance NUMERIC(14,2);
  v_new_balance     NUMERIC(14,2);
  v_category_id     UUID;
  v_subcategory_id  UUID;
  v_featured_id     UUID;
  v_expires_at      TIMESTAMPTZ;
  v_durations       JSONB;
BEGIN
  -- Obtener precio en ARS desde config
  SELECT value::JSONB INTO v_durations
  FROM public.global_config
  WHERE key = 'featured_durations';

  SELECT (elem ->> 'price_ars')::NUMERIC INTO v_price_ars
  FROM jsonb_array_elements(v_durations) AS elem
  WHERE (elem ->> 'days')::INT = p_duration_days;

  IF v_price_ars IS NULL THEN
    RETURN json_build_object(
      'success',         FALSE,
      'error',           'Duración inválida',
      'valid_durations', v_durations
    );
  END IF;

  -- Verificar saldo disponible
  SELECT virtual_balance INTO v_current_balance
  FROM public.user_wallets
  WHERE user_id = p_user_id;

  IF v_current_balance IS NULL OR v_current_balance < v_price_ars THEN
    RETURN json_build_object(
      'success',         FALSE,
      'error',           'Saldo insuficiente',
      'current_balance', COALESCE(v_current_balance, 0),
      'needed',          v_price_ars
    );
  END IF;

  -- Verificar aviso válido y del usuario
  SELECT category_id, subcategory_id
  INTO v_category_id, v_subcategory_id
  FROM public.ads
  WHERE id = p_ad_id
    AND user_id = p_user_id
    AND status IN ('published', 'active');

  IF v_category_id IS NULL THEN
    RETURN json_build_object(
      'success', FALSE,
      'error',   'Aviso no encontrado o no publicado'
    );
  END IF;

  -- Verificar que no esté ya destacado
  IF EXISTS (
    SELECT 1 FROM public.featured_ads
    WHERE ad_id = p_ad_id AND status = 'active'
  ) THEN
    RETURN json_build_object(
      'success', FALSE,
      'error',   'Este aviso ya está destacado'
    );
  END IF;

  v_new_balance := v_current_balance - v_price_ars;
  v_expires_at  := NOW() + (p_duration_days || ' days')::INTERVAL;

  -- Descontar del wallet
  UPDATE public.user_wallets
  SET
    virtual_balance = v_new_balance,
    updated_at      = NOW()
  WHERE user_id = p_user_id;

  -- Crear featured ad
  INSERT INTO public.featured_ads (
    ad_id, user_id, category_id, subcategory_id,
    duration_days, credits_spent, status,
    activated_at, expires_at
  ) VALUES (
    p_ad_id, p_user_id, v_category_id, v_subcategory_id,
    p_duration_days, v_price_ars::INT, 'active',
    NOW(), v_expires_at
  ) RETURNING id INTO v_featured_id;

  -- Ledger auditables
  INSERT INTO public.wallet_transactions (
    user_id, bucket, tx_type, amount, balance_after,
    source, description, featured_ad_id, metadata
  ) VALUES (
    p_user_id,
    'virtual',
    'debit',
    v_price_ars,
    v_new_balance,
    'featured_spend',
    'Aviso destacado por ' || p_duration_days || ' días',
    v_featured_id,
    json_build_object(
      'ad_id',        p_ad_id,
      'duration_days', p_duration_days,
      'price_ars',    v_price_ars
    )::JSONB
  );

  RETURN json_build_object(
    'success',     TRUE,
    'featured_id', v_featured_id,
    'new_balance', v_new_balance,
    'expires_at',  v_expires_at,
    'price_ars',   v_price_ars
  );

EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', FALSE,
    'error',   SQLERRM
  );
END;
$$;

-- ============================================================
-- 6. RPC: create_featured_ad (placement-based, modal de Destacados)
--    Lee user_wallets.virtual_balance
--    Usa global_config.featured_slot_price_ars (default 2500)
--    SuperAdmin sigue sin consumir saldo
-- ============================================================

CREATE OR REPLACE FUNCTION public.create_featured_ad(
  p_ad_id          UUID,
  p_user_id        UUID,
  p_placement      CHARACTER VARYING DEFAULT 'homepage',
  p_scheduled_start DATE             DEFAULT CURRENT_DATE
)
RETURNS TABLE(success BOOLEAN, featured_id UUID, error_message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_category_id     UUID;
  v_ad_user_id      UUID;
  v_current_balance NUMERIC(14,2);
  v_slot_price      NUMERIC(14,2);
  v_new_balance     NUMERIC(14,2);
  v_is_available    BOOLEAN;
  v_duration        INT;
  v_new_id          UUID;
  v_user_role       VARCHAR(50);
  v_is_superadmin   BOOLEAN := FALSE;
BEGIN
  -- 0. Verificar rol
  SELECT role INTO v_user_role
  FROM public.users WHERE id = p_user_id;

  v_is_superadmin := (v_user_role = 'superadmin');

  -- 1. Verificar que el aviso existe
  SELECT category_id, user_id INTO v_category_id, v_ad_user_id
  FROM public.ads WHERE id = p_ad_id;

  IF v_category_id IS NULL THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, 'Aviso no encontrado'::TEXT;
    RETURN;
  END IF;

  IF NOT v_is_superadmin AND v_ad_user_id != p_user_id THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, 'No sos el dueño de este aviso'::TEXT;
    RETURN;
  END IF;

  -- 2. Verificar saldo ARS (saltar para SuperAdmin)
  IF NOT v_is_superadmin THEN
    -- Precio del slot desde global_config
    SELECT value::NUMERIC INTO v_slot_price
    FROM public.global_config
    WHERE key = 'featured_slot_price_ars';

    v_slot_price := COALESCE(v_slot_price, 2500);

    SELECT virtual_balance INTO v_current_balance
    FROM public.user_wallets
    WHERE user_id = p_user_id;

    IF COALESCE(v_current_balance, 0) < v_slot_price THEN
      RETURN QUERY SELECT FALSE, NULL::UUID,
        ('Saldo insuficiente. Necesitás $' || v_slot_price::TEXT || ' ARS.')::TEXT;
      RETURN;
    END IF;
  END IF;

  -- 3. Verificar duplicado
  IF EXISTS (
    SELECT 1 FROM public.featured_ads
    WHERE ad_id      = p_ad_id
      AND placement  = p_placement
      AND status IN ('pending', 'active')
  ) THEN
    RETURN QUERY SELECT FALSE, NULL::UUID,
      'Este aviso ya está destacado en esa ubicación. Esperá a que expire.'::TEXT;
    RETURN;
  END IF;

  -- 4. Obtener duración de global_settings (igual que antes)
  SELECT (value #>> '{}')::INT INTO v_duration
  FROM public.global_settings WHERE key = 'featured_duration_days';
  v_duration := COALESCE(v_duration, 15);

  -- 5. Verificar disponibilidad de slot
  SELECT fa.is_available INTO v_is_available
  FROM check_featured_availability(p_placement, v_category_id, p_scheduled_start, v_duration) fa;

  IF NOT v_is_available THEN
    RETURN QUERY SELECT FALSE, NULL::UUID,
      'No hay slots disponibles en esa fecha. Probá con otra fecha.'::TEXT;
    RETURN;
  END IF;

  -- 6. Crear registro de destacado
  INSERT INTO public.featured_ads (
    ad_id, user_id, placement, category_id,
    scheduled_start, duration_days, status, priority
  ) VALUES (
    p_ad_id, p_user_id, p_placement, v_category_id,
    p_scheduled_start, v_duration, 'pending',
    (SELECT COALESCE(MAX(priority), 0) + 1
     FROM public.featured_ads
     WHERE placement = p_placement AND category_id = v_category_id)
  )
  RETURNING id INTO v_new_id;

  -- 7. Consumir saldo ARS (saltar para SuperAdmin)
  IF NOT v_is_superadmin THEN
    v_new_balance := v_current_balance - v_slot_price;

    UPDATE public.user_wallets
    SET
      virtual_balance = v_new_balance,
      updated_at      = NOW()
    WHERE user_id = p_user_id;

    -- Marcar crédito consumido
    UPDATE public.featured_ads
    SET credit_consumed = TRUE
    WHERE id = v_new_id;

    -- Ledger
    INSERT INTO public.wallet_transactions (
      user_id, bucket, tx_type, amount, balance_after,
      source, description, featured_ad_id, metadata
    ) VALUES (
      p_user_id,
      'virtual',
      'debit',
      v_slot_price,
      v_new_balance,
      'featured_spend',
      'Aviso destacado — ' || p_placement,
      v_new_id,
      json_build_object(
        'ad_id',        p_ad_id,
        'placement',    p_placement,
        'price_ars',    v_slot_price
      )::JSONB
    );

  ELSE
    -- SuperAdmin: no consume saldo
    UPDATE public.featured_ads
    SET credit_consumed = FALSE
    WHERE id = v_new_id;
  END IF;

  -- 8. Respuesta
  IF v_is_superadmin THEN
    RETURN QUERY SELECT TRUE, v_new_id,
      'SuperAdmin: Aviso programado sin consumir saldo'::TEXT;
  ELSE
    RETURN QUERY SELECT TRUE, v_new_id,
      'Aviso programado para destacar'::TEXT;
  END IF;
END;
$$;

COMMIT;
