-- =============================================================================
-- MIGRACIÓN: fix_featured_placement
-- Fecha: 2026-03-29
-- Problema: activate_featured_with_coupon no seteaba el campo `placement`
--           → todos los registros creados por cupón tienen placement = NULL
--           → get_featured_for_homepage filtra WHERE placement = 'homepage'
--           → NULL != 'homepage' → 0 resultados → homepage siempre muestra fallback
-- =============================================================================

-- =============================================================================
-- PARTE 1: Reparar datos existentes con placement = NULL
-- =============================================================================

-- 1a. Setear placement base según tier para registros con NULL
UPDATE public.featured_ads
SET placement = CASE
  WHEN LOWER(tier) = 'baja' THEN 'detail'
  ELSE 'homepage'
END
WHERE placement IS NULL;

-- 1b. Para tier='alta': insertar fila 'results' faltante
INSERT INTO public.featured_ads (
  ad_id, user_id, tier, placement, category_id, subcategory_id,
  period_number, duration_days, scheduled_start, actual_start,
  expires_at, status, requires_payment, credit_consumed, created_at
)
SELECT
  ad_id, user_id, tier, 'results', category_id, subcategory_id,
  period_number, duration_days, scheduled_start, actual_start,
  expires_at, status, requires_payment, credit_consumed, created_at
FROM public.featured_ads
WHERE LOWER(tier) = 'alta'
  AND placement = 'homepage'
  AND status = 'active'
  AND NOT EXISTS (
    SELECT 1 FROM public.featured_ads fa2
    WHERE fa2.ad_id = featured_ads.ad_id
      AND fa2.placement = 'results'
      AND fa2.status = 'active'
  );

-- 1c. Para tier='alta': insertar fila 'detail' faltante
INSERT INTO public.featured_ads (
  ad_id, user_id, tier, placement, category_id, subcategory_id,
  period_number, duration_days, scheduled_start, actual_start,
  expires_at, status, requires_payment, credit_consumed, created_at
)
SELECT
  ad_id, user_id, tier, 'detail', category_id, subcategory_id,
  period_number, duration_days, scheduled_start, actual_start,
  expires_at, status, requires_payment, credit_consumed, created_at
FROM public.featured_ads
WHERE LOWER(tier) = 'alta'
  AND placement = 'homepage'
  AND status = 'active'
  AND NOT EXISTS (
    SELECT 1 FROM public.featured_ads fa2
    WHERE fa2.ad_id = featured_ads.ad_id
      AND fa2.placement = 'detail'
      AND fa2.status = 'active'
  );

-- 1d. Para tier='media': insertar fila 'results' faltante
INSERT INTO public.featured_ads (
  ad_id, user_id, tier, placement, category_id, subcategory_id,
  period_number, duration_days, scheduled_start, actual_start,
  expires_at, status, requires_payment, credit_consumed, created_at
)
SELECT
  ad_id, user_id, tier, 'results', category_id, subcategory_id,
  period_number, duration_days, scheduled_start, actual_start,
  expires_at, status, requires_payment, credit_consumed, created_at
FROM public.featured_ads
WHERE LOWER(tier) = 'media'
  AND placement = 'homepage'
  AND status = 'active'
  AND NOT EXISTS (
    SELECT 1 FROM public.featured_ads fa2
    WHERE fa2.ad_id = featured_ads.ad_id
      AND fa2.placement = 'results'
      AND fa2.status = 'active'
  );


-- =============================================================================
-- PARTE 2: Reemplazar RPC activate_featured_with_coupon
--          con versión que inserta múltiples filas según tier:
--            alta  → homepage + results + detail
--            media → homepage + results
--            baja  → detail
-- =============================================================================

CREATE OR REPLACE FUNCTION public.activate_featured_with_coupon(
  p_user_id     uuid,
  p_ad_id       uuid,
  p_tier        text,
  p_coupon_code text,
  p_payment_id  text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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
  v_placements      TEXT[];
  v_placement       TEXT;
  v_first_id        UUID;
BEGIN
  -- Verificar que el aviso pertenece al usuario
  SELECT id, category_id, subcategory_id
  INTO v_ad
  FROM public.ads
  WHERE id = p_ad_id AND user_id = p_user_id;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Aviso no encontrado o no pertenece al usuario');
  END IF;

  -- Leer tier_config de global_config
  SELECT value::JSONB INTO v_tier_config
  FROM public.global_config WHERE key = 'tier_config';

  -- Extraer datos del tier
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

  -- Determinar placements según tier
  --   alta  → homepage, results, detail
  --   media → homepage, results
  --   baja  → detail
  CASE LOWER(p_tier)
    WHEN 'alta'  THEN v_placements := ARRAY['homepage', 'results', 'detail'];
    WHEN 'media' THEN v_placements := ARRAY['homepage', 'results'];
    ELSE              v_placements := ARRAY['detail'];
  END CASE;

  -- Insertar una fila por placement
  v_first_id := NULL;
  FOREACH v_placement IN ARRAY v_placements LOOP
    INSERT INTO public.featured_ads (
      ad_id, user_id, tier, placement, category_id, subcategory_id,
      period_number, duration_days,
      scheduled_start, actual_start, expires_at, status, requires_payment, credit_consumed
    ) VALUES (
      p_ad_id, p_user_id, LOWER(p_tier), v_placement, v_ad.category_id, v_ad.subcategory_id,
      1, v_duration_days,
      CURRENT_DATE, NOW(), v_ends_at, 'active', FALSE, FALSE
    )
    RETURNING id INTO v_featured_id;

    -- Guardar el id del primer row (homepage para alta/media, detail para baja)
    IF v_first_id IS NULL THEN
      v_first_id := v_featured_id;
    END IF;
  END LOOP;

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
      v_first_id
    );
  END IF;

  RETURN json_build_object(
    'success',     true,
    'featured_id', v_first_id,
    'price_ars',   v_effective_price
  );
END;
$$;
