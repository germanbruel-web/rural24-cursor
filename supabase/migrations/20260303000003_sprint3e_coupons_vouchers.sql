-- ============================================================
-- Sprint 3E — Coupons como Vouchers de Producto (#NoSaldo)
-- 2026-03-03
-- ============================================================
-- Concepto: Cupón = derecho a 1 período de un tier específico
-- con descuento (% o gratis). El saldo virtual desaparece del UX.
-- ============================================================

-- ============================================================
-- 1. Nuevas columnas en coupons
-- ============================================================

ALTER TABLE public.coupons
  ADD COLUMN IF NOT EXISTS featured_tier   TEXT CHECK (featured_tier   IN ('alta', 'media', 'baja')),
  ADD COLUMN IF NOT EXISTS discount_type   TEXT NOT NULL DEFAULT 'percentage'
    CHECK (discount_type IN ('full', 'percentage')),
  ADD COLUMN IF NOT EXISTS discount_percent INT
    CHECK (discount_percent IS NULL OR (discount_percent >= 1 AND discount_percent <= 100));

COMMENT ON COLUMN public.coupons.featured_tier    IS 'Nivel al que aplica: alta|media|baja. NULL = cualquier tier.';
COMMENT ON COLUMN public.coupons.discount_type    IS 'full = gratis, percentage = descuento %';
COMMENT ON COLUMN public.coupons.discount_percent IS '1-100. Solo si discount_type = percentage.';

-- ============================================================
-- 2. RPC: validate_coupon_for_checkout
-- Lectura pura — NO consume el cupón.
-- Llamada desde el frontend al ingresar el código.
-- ============================================================

CREATE OR REPLACE FUNCTION public.validate_coupon_for_checkout(
  p_code       TEXT,
  p_tier       TEXT,
  p_base_price INT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_coupon        RECORD;
  v_effective_price INT;
BEGIN
  -- Buscar cupón activo
  SELECT * INTO v_coupon
  FROM public.coupons
  WHERE UPPER(TRIM(code)) = UPPER(TRIM(p_code))
    AND is_active = TRUE
    AND (expires_at IS NULL OR expires_at > NOW())
    AND (max_redemptions IS NULL OR current_redemptions < max_redemptions);

  IF NOT FOUND THEN
    RETURN json_build_object('valid', false, 'error', 'Cupón inválido, expirado o agotado');
  END IF;

  -- Verificar compatibilidad de tier (NULL = aplica a cualquier nivel)
  IF v_coupon.featured_tier IS NOT NULL
     AND LOWER(v_coupon.featured_tier) != LOWER(p_tier) THEN
    RETURN json_build_object(
      'valid', false,
      'error', 'Este cupón solo aplica para el nivel ' || UPPER(v_coupon.featured_tier)
    );
  END IF;

  -- Calcular precio efectivo
  IF v_coupon.discount_type = 'full' THEN
    v_effective_price := 0;
  ELSIF v_coupon.discount_percent IS NOT NULL THEN
    v_effective_price := GREATEST(
      0,
      ROUND(p_base_price * (100 - v_coupon.discount_percent)::NUMERIC / 100)::INT
    );
  ELSE
    RETURN json_build_object('valid', false, 'error', 'Cupón no configurado correctamente');
  END IF;

  RETURN json_build_object(
    'valid',            true,
    'discount_type',    v_coupon.discount_type,
    'discount_percent', v_coupon.discount_percent,
    'effective_price',  v_effective_price,
    'coupon_id',        v_coupon.id,
    'coupon_name',      v_coupon.name
  );
END;
$$;

-- ============================================================
-- 3. RPC: activate_featured_with_coupon
-- Crea el featured_ad y marca el cupón como redimido.
-- Seguro contra race conditions (FOR UPDATE en coupon).
-- ============================================================

CREATE OR REPLACE FUNCTION public.activate_featured_with_coupon(
  p_user_id     UUID,
  p_ad_id       UUID,
  p_tier        TEXT,
  p_coupon_code TEXT,
  p_payment_id  TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_coupon          RECORD;
  v_ad              RECORD;
  v_tier_config     JSONB;
  v_tier_data       JSONB;
  v_base_price      INT;
  v_effective_price INT;
  v_duration_days   INT;
  v_featured_id     UUID;
  v_ends_at         TIMESTAMPTZ;
  v_real_balance    NUMERIC := 0;
BEGIN
  -- Verificar que el aviso pertenece al usuario
  SELECT id, category_id, subcategory_id, placement
  INTO v_ad
  FROM public.ads
  WHERE id = p_ad_id AND user_id = p_user_id;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Aviso no encontrado o no pertenece al usuario');
  END IF;

  -- Leer tier config de global_config
  SELECT value::JSONB INTO v_tier_config
  FROM public.global_config WHERE key = 'tier_config';

  v_tier_data     := v_tier_config -> LOWER(p_tier);
  v_base_price    := (v_tier_data ->> 'price_ars')::INT;
  v_duration_days := (v_tier_data ->> 'duration_days')::INT;

  -- Bloquear cupón (FOR UPDATE evita doble redención concurrente)
  SELECT * INTO v_coupon
  FROM public.coupons
  WHERE UPPER(TRIM(code)) = UPPER(TRIM(p_coupon_code))
    AND is_active = TRUE
    AND (expires_at IS NULL OR expires_at > NOW())
    AND (max_redemptions IS NULL OR current_redemptions < max_redemptions)
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Cupón inválido, expirado o agotado');
  END IF;

  -- Verificar tier
  IF v_coupon.featured_tier IS NOT NULL
     AND LOWER(v_coupon.featured_tier) != LOWER(p_tier) THEN
    RETURN json_build_object('success', false, 'error', 'El cupón no aplica para el nivel ' || p_tier);
  END IF;

  -- Verificar que el usuario no haya redimido este cupón antes
  IF EXISTS (
    SELECT 1 FROM public.coupon_redemptions
    WHERE coupon_id = v_coupon.id AND user_id = p_user_id
  ) THEN
    RETURN json_build_object('success', false, 'error', 'Ya utilizaste este cupón anteriormente');
  END IF;

  -- Calcular precio efectivo
  IF v_coupon.discount_type = 'full' THEN
    v_effective_price := 0;
  ELSIF v_coupon.discount_percent IS NOT NULL THEN
    v_effective_price := GREATEST(
      0,
      ROUND(v_base_price * (100 - v_coupon.discount_percent)::NUMERIC / 100)::INT
    );
  ELSE
    RETURN json_build_object('success', false, 'error', 'Cupón sin descuento configurado');
  END IF;

  -- Fecha de expiración
  v_ends_at := NOW() + (v_duration_days || ' days')::INTERVAL;

  -- Crear featured_ad
  INSERT INTO public.featured_ads (
    ad_id, user_id, tier, category_id, subcategory_id,
    placement, period_number, duration_days,
    scheduled_start, expires_at, status, requires_payment, credit_consumed
  ) VALUES (
    p_ad_id, p_user_id, LOWER(p_tier), v_ad.category_id, v_ad.subcategory_id,
    v_ad.placement, 1, v_duration_days,
    CURRENT_DATE, v_ends_at, 'pending', FALSE, FALSE
  )
  RETURNING id INTO v_featured_id;

  -- Consumir cupón: registrar redemption + incrementar contador
  INSERT INTO public.coupon_redemptions (coupon_id, user_id)
  VALUES (v_coupon.id, p_user_id);

  UPDATE public.coupons
  SET current_redemptions = current_redemptions + 1,
      updated_at = NOW()
  WHERE id = v_coupon.id;

  -- Audit trail en wallet_transactions (solo si hubo pago parcial vía MP)
  IF v_effective_price > 0 AND p_payment_id IS NOT NULL THEN
    -- Obtener saldo real actual
    SELECT COALESCE(real_balance, 0) INTO v_real_balance
    FROM public.user_wallets WHERE user_id = p_user_id;

    INSERT INTO public.wallet_transactions (
      user_id, bucket, tx_type, amount, balance_after,
      source, description, payment_id
    ) VALUES (
      p_user_id, 'real', 'credit', v_effective_price, v_real_balance + v_effective_price,
      'mercadopago', 'Pago MercadoPago — Destacado ' || UPPER(p_tier), p_payment_id
    );

    INSERT INTO public.wallet_transactions (
      user_id, bucket, tx_type, amount, balance_after,
      source, description, featured_ad_id
    ) VALUES (
      p_user_id, 'real', 'debit', v_effective_price, v_real_balance,
      'featured_spend',
      'Destacado nivel ' || UPPER(p_tier) || ' (cupón ' || UPPER(p_coupon_code) || ')',
      v_featured_id
    );
  END IF;

  RETURN json_build_object(
    'success',     true,
    'featured_id', v_featured_id,
    'price_ars',   v_effective_price
  );
END;
$$;

-- ============================================================
-- 4. Permisos: solo service_role puede ejecutar estas RPCs
-- ============================================================

REVOKE ALL ON FUNCTION public.validate_coupon_for_checkout(TEXT, TEXT, INT)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.validate_coupon_for_checkout(TEXT, TEXT, INT)
  TO service_role;

REVOKE ALL ON FUNCTION public.activate_featured_with_coupon(UUID, UUID, TEXT, TEXT, TEXT)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.activate_featured_with_coupon(UUID, UUID, TEXT, TEXT, TEXT)
  TO service_role;
