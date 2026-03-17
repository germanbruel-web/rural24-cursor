-- ============================================================
-- Fix: activate_featured_with_coupon
-- 2026-03-16
-- Bug: leía global_config.tier_config como objeto JSON con
--      v_tier_config -> LOWER(p_tier), pero el valor está
--      almacenado como array JSON: [{"tier":"alta","price_ars":...}]
-- Fix: usa jsonb_array_elements + filtro elem->>'tier' = p_tier
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
  -- ads no tiene columna placement; featured_ads.placement es nullable
  SELECT id, category_id, subcategory_id
  INTO v_ad
  FROM public.ads
  WHERE id = p_ad_id AND user_id = p_user_id;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Aviso no encontrado o no pertenece al usuario');
  END IF;

  -- Leer tier_config (array JSON) de global_config
  SELECT value::JSONB INTO v_tier_config
  FROM public.global_config WHERE key = 'tier_config';

  -- Extraer datos del tier buscado en el array
  SELECT elem INTO v_tier_data
  FROM jsonb_array_elements(v_tier_config) elem
  WHERE elem->>'tier' = LOWER(p_tier)
  LIMIT 1;

  IF v_tier_data IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Tier inválido: ' || p_tier);
  END IF;

  v_base_price    := (v_tier_data ->> 'price_ars')::INT;
  v_duration_days := COALESCE((v_tier_data ->> 'duration_days')::INT, 15);

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

  -- Verificar tier del cupón
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
  -- Activar directamente (sin pasar por cola): el cupón ya valida todo
  INSERT INTO public.featured_ads (
    ad_id, user_id, tier, category_id, subcategory_id,
    period_number, duration_days,
    scheduled_start, actual_start, expires_at, status, requires_payment, credit_consumed
  ) VALUES (
    p_ad_id, p_user_id, LOWER(p_tier), v_ad.category_id, v_ad.subcategory_id,
    1, v_duration_days,
    CURRENT_DATE, NOW(), v_ends_at, 'active', FALSE, FALSE
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

-- Permisos: solo service_role
REVOKE ALL ON FUNCTION public.activate_featured_with_coupon(UUID, UUID, TEXT, TEXT, TEXT)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.activate_featured_with_coupon(UUID, UUID, TEXT, TEXT, TEXT)
  TO service_role;
