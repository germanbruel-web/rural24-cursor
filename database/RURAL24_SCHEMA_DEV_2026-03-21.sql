-- ============================================================
-- DEV Schema Dump — Rural24
-- Generado: 2026-03-21T12:08:32.953Z
-- Fuente: DEV (Staging)
-- Uso: aplicar a PROD con node scripts/db-apply-snapshot.mjs prod
-- ============================================================

--
-- PostgreSQL database dump
--

\restrict O6lW8gGL52bdU84ffZgxsjwYr7mPbM9PdXergqgotRyo0XopYm2lqCJ2rTwdE9S

-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA public;


--
-- Name: banner_placement; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.banner_placement AS ENUM (
    'hero_vip',
    'category_carousel',
    'results_lateral',
    'results_intercalated',
    'results_below_filter'
);


--
-- Name: wallet_bucket; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.wallet_bucket AS ENUM (
    'virtual',
    'real'
);


--
-- Name: wallet_tx_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.wallet_tx_type AS ENUM (
    'credit',
    'debit'
);


--
-- Name: activate_featured_by_tier(uuid, uuid, character varying, smallint); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.activate_featured_by_tier(p_user_id uuid, p_ad_id uuid, p_tier character varying, p_periods smallint DEFAULT 1) RETURNS json
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $_$
DECLARE
  v_ad               RECORD;
  v_wallet           RECORD;
  v_tier_config      JSON;
  v_price_per_period NUMERIC;
  v_total_price      NUMERIC;
  v_existing_count   INTEGER := 0;
  v_periods_available SMALLINT;
  v_max_slots        INTEGER := 20;
  v_active_count     INTEGER := 0;

  -- Período 1
  v_sched_start_p1   DATE;
  v_expires_at_p1    TIMESTAMPTZ;
  v_status_p1        VARCHAR(20);
  v_featured_id_p1   UUID;

  -- Período 2
  v_sched_start_p2   DATE;
  v_expires_at_p2    TIMESTAMPTZ;
  v_status_p2        VARCHAR(20);
  v_featured_id_p2   UUID;

  v_new_balance      NUMERIC;
BEGIN
  -- ── 1. Validaciones básicas ────────────────────────────────────────────────

  IF p_tier NOT IN ('alta', 'media', 'baja') THEN
    RETURN json_build_object('success', false, 'error', 'Tier inválido. Usar: alta, media, baja');
  END IF;

  IF p_periods NOT IN (1, 2) THEN
    RETURN json_build_object('success', false, 'error', 'Períodos inválido. Usar: 1 o 2');
  END IF;

  -- ── 2. Verificar que el aviso pertenece al usuario y está activo ───────────

  SELECT id, category_id, subcategory_id, user_id
  INTO v_ad
  FROM public.ads
  WHERE id = p_ad_id
    AND user_id = p_user_id
    AND status = 'active';

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Aviso no encontrado, no activo o no te pertenece');
  END IF;

  -- ── 3. Verificar cuántos períodos activos/pending ya tiene este aviso ──────

  SELECT COUNT(*) INTO v_existing_count
  FROM public.featured_ads
  WHERE ad_id = p_ad_id
    AND status IN ('active', 'pending');

  v_periods_available := 2 - v_existing_count;

  IF v_periods_available <= 0 THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Este aviso ya tiene 2 períodos activos. Esperá que venza el actual para renovarlo.'
    );
  END IF;

  IF p_periods > v_periods_available THEN
    RETURN json_build_object(
      'success', false,
      'error', format('Solo podés comprar %s período(s) más para este aviso.', v_periods_available)
    );
  END IF;

  -- ── 4. Obtener precio del tier desde global_config ─────────────────────────

  BEGIN
    SELECT elem->>'price_ars'
    INTO v_price_per_period
    FROM public.global_config,
         json_array_elements(value::json) AS elem
    WHERE key = 'tier_config'
      AND elem->>'tier' = p_tier;
  EXCEPTION WHEN OTHERS THEN
    -- Fallback hardcoded si falla la lectura de config
    v_price_per_period := CASE p_tier
      WHEN 'alta'  THEN 7500
      WHEN 'media' THEN 5000
      WHEN 'baja'  THEN 2500
    END;
  END;

  IF v_price_per_period IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'No se pudo obtener el precio del tier');
  END IF;

  v_total_price := v_price_per_period * p_periods;

  -- ── 5. Verificar saldo del wallet ──────────────────────────────────────────

  SELECT * INTO v_wallet
  FROM public.user_wallets
  WHERE user_id = p_user_id
  FOR UPDATE; -- lock para evitar race conditions

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'No tenés saldo disponible. Canjeá un cupón para obtener saldo.');
  END IF;

  IF v_wallet.virtual_balance < v_total_price THEN
    RETURN json_build_object(
      'success', false,
      'error', format(
        'Saldo insuficiente. Necesitás $%s ARS y tenés $%s ARS.',
        v_total_price::INTEGER,
        v_wallet.virtual_balance::INTEGER
      )
    );
  END IF;

  -- ── 6. Determinar scheduled_start y status para cada período ──────────────

  -- Leer max_slots para homepage
  IF p_tier IN ('alta', 'media') THEN
    BEGIN
      SELECT (value::json -> 'homepage' ->> 'max_active_per_category')::integer
      INTO v_max_slots
      FROM public.global_config WHERE key = 'slot_config';
    EXCEPTION WHEN OTHERS THEN
      v_max_slots := 20;
    END;

    SELECT COUNT(*) INTO v_active_count
    FROM public.featured_ads
    WHERE category_id = v_ad.category_id
      AND tier IN ('alta', 'media')
      AND status = 'active';
  END IF;

  -- PERÍODO 1
  -- Si hay slot disponible → pending con scheduled_start=hoy (cron activa en 15min)
  -- Si no hay slot → pending en cola con scheduled_start estimado
  IF p_tier IN ('alta', 'media') AND v_active_count >= v_max_slots THEN
    -- Cola: scheduled_start = fecha estimada de próximo slot
    SELECT COALESCE(MIN(expires_at)::date, CURRENT_DATE + 1)
    INTO v_sched_start_p1
    FROM public.featured_ads
    WHERE category_id = v_ad.category_id
      AND tier IN ('alta', 'media')
      AND status = 'active';
  ELSE
    v_sched_start_p1 := CURRENT_DATE;
  END IF;

  v_expires_at_p1 := (v_sched_start_p1 + INTERVAL '15 days');
  v_status_p1     := 'pending'; -- el cron lo activa al llegar scheduled_start

  -- PERÍODO 2 (si aplica)
  IF p_periods = 2 THEN
    v_sched_start_p2 := v_expires_at_p1::date;
    v_expires_at_p2  := v_sched_start_p2 + INTERVAL '15 days';
    v_status_p2      := 'pending';
  END IF;

  -- ── 7. Ejecutar transacción ────────────────────────────────────────────────

  -- 7a. Debitar wallet
  v_new_balance := v_wallet.virtual_balance - v_total_price;

  UPDATE public.user_wallets
  SET virtual_balance = v_new_balance,
      updated_at      = NOW()
  WHERE user_id = p_user_id;

  -- 7b. Registrar en ledger
  INSERT INTO public.wallet_transactions (
    user_id, bucket, tx_type, amount, balance_after,
    source, description, featured_ad_id
  ) VALUES (
    p_user_id,
    'virtual',
    'debit',
    v_total_price,
    v_new_balance,
    'featured_spend',
    format('Aviso Destacado %s — %s período(s) × $%s ARS',
           upper(p_tier), p_periods, v_price_per_period::INTEGER),
    NULL -- se actualiza abajo con el ID real
  );

  -- 7c. Crear registro período 1
  INSERT INTO public.featured_ads (
    ad_id, user_id, tier, period_number,
    category_id, subcategory_id,
    scheduled_start, expires_at, duration_days,
    status, credit_consumed, requires_payment,
    placement -- legacy: derivado del tier para compat con código viejo
  ) VALUES (
    p_ad_id, p_user_id, p_tier, (v_existing_count + 1),
    v_ad.category_id, v_ad.subcategory_id,
    v_sched_start_p1, v_expires_at_p1, 15,
    v_status_p1, true, true,
    CASE p_tier WHEN 'baja' THEN 'detail' ELSE 'homepage' END
  )
  RETURNING id INTO v_featured_id_p1;

  -- 7d. Crear registro período 2 (si aplica)
  IF p_periods = 2 THEN
    INSERT INTO public.featured_ads (
      ad_id, user_id, tier, period_number,
      category_id, subcategory_id,
      scheduled_start, expires_at, duration_days,
      status, credit_consumed, requires_payment,
      placement
    ) VALUES (
      p_ad_id, p_user_id, p_tier, (v_existing_count + 2),
      v_ad.category_id, v_ad.subcategory_id,
      v_sched_start_p2, v_expires_at_p2, 15,
      v_status_p2, true, true,
      CASE p_tier WHEN 'baja' THEN 'detail' ELSE 'homepage' END
    )
    RETURNING id INTO v_featured_id_p2;
  END IF;

  -- 7e. Registrar en audit
  INSERT INTO public.featured_ads_audit (
    featured_ad_id, action, performed_by,
    metadata
  ) VALUES (
    v_featured_id_p1, 'created', p_user_id,
    json_build_object(
      'tier', p_tier,
      'periods', p_periods,
      'price_ars', v_total_price,
      'period_2_id', v_featured_id_p2
    )
  );

  -- ── 8. Resultado ──────────────────────────────────────────────────────────

  RETURN json_build_object(
    'success',       true,
    'featured_id_p1', v_featured_id_p1,
    'featured_id_p2', v_featured_id_p2,
    'tier',           p_tier,
    'periods',        p_periods,
    'price_ars',      v_total_price,
    'new_balance',    v_new_balance,
    'status_p1',      v_status_p1,
    'expires_at_p1',  v_expires_at_p1,
    'status_p2',      v_status_p2,
    'expires_at_p2',  v_expires_at_p2,
    'queued',         (v_sched_start_p1 > CURRENT_DATE)
  );

EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'error',   SQLERRM
  );
END;
$_$;


--
-- Name: activate_featured_paid(uuid, uuid, text, integer, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.activate_featured_paid(p_user_id uuid, p_ad_id uuid, p_tier text, p_periods integer, p_payment_id uuid) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_price_ars     NUMERIC;
  v_featured_id   UUID;
  v_tier_config   JSONB;
  v_tier_row      JSONB;
  v_category_id   UUID;
  v_subcategory_id UUID;
  v_real_balance  NUMERIC;
BEGIN
  -- ── Idempotencia ──────────────────────────────────────────
  -- Si este payment_id ya fue procesado, retornar success sin duplicar
  IF EXISTS (
    SELECT 1 FROM public.wallet_transactions
    WHERE payment_id = p_payment_id
      AND source = 'mercadopago'
  ) THEN
    RETURN jsonb_build_object('success', true, 'message', 'already_processed');
  END IF;

  -- ── Validar tier y leer precio ────────────────────────────
  SELECT value INTO v_tier_config
  FROM public.global_config
  WHERE key = 'tier_config';

  SELECT elem INTO v_tier_row
  FROM jsonb_array_elements(v_tier_config) elem
  WHERE elem->>'tier' = p_tier
  LIMIT 1;

  IF v_tier_row IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'tier_not_found');
  END IF;

  v_price_ars := (v_tier_row->>'price_ars')::NUMERIC * p_periods;

  -- ── Leer datos del aviso ──────────────────────────────────
  SELECT category_id, subcategory_id
  INTO v_category_id, v_subcategory_id
  FROM public.ads
  WHERE id = p_ad_id;

  IF v_category_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'ad_not_found');
  END IF;

  -- ── Crear featured_ad (status=pending, pg_cron activa en ≤15min) ──
  INSERT INTO public.featured_ads (
    ad_id,
    user_id,
    tier,
    period_number,
    subcategory_id,
    category_id,
    placement,
    scheduled_start,
    duration_days,
    status,
    expires_at,
    requires_payment,
    credit_consumed
  ) VALUES (
    p_ad_id,
    p_user_id,
    p_tier,
    p_periods,
    v_subcategory_id,
    v_category_id,
    -- placement legacy: derivar del tier (campo obsoleto en Sprint 4)
    CASE p_tier
      WHEN 'alta'  THEN 'homepage'
      WHEN 'media' THEN 'homepage'
      ELSE              'detail'
    END,
    CURRENT_DATE,
    p_periods * 15,
    'pending',
    now() + ((p_periods * 15) || ' days')::interval,
    false,   -- ya pagado: no requiere pago adicional
    false
  ) RETURNING id INTO v_featured_id;

  -- ── Audit wallet (real bucket) ────────────────────────────
  -- Crear fila de wallet si no existe
  INSERT INTO public.user_wallets (user_id, currency)
  VALUES (p_user_id, 'ARS')
  ON CONFLICT (user_id) DO NOTHING;

  SELECT real_balance INTO v_real_balance
  FROM public.user_wallets
  WHERE user_id = p_user_id;

  -- Crédito: ingreso por MercadoPago (audit trail)
  INSERT INTO public.wallet_transactions (
    user_id, bucket, tx_type, amount, balance_after,
    source, description, payment_id, featured_ad_id
  ) VALUES (
    p_user_id, 'real', 'credit', v_price_ars, v_real_balance,
    'mercadopago',
    'Pago MercadoPago — Destacado ' || upper(p_tier) || ' (' || (p_periods * 15) || ' días)',
    p_payment_id,
    v_featured_id
  );

  -- Débito: gasto en destacado (audit trail, balance_after = 0 real)
  INSERT INTO public.wallet_transactions (
    user_id, bucket, tx_type, amount, balance_after,
    source, description, featured_ad_id
  ) VALUES (
    p_user_id, 'real', 'debit', v_price_ars, v_real_balance,
    'featured_spend',
    'Destacado tier ' || upper(p_tier) || ' — ' || p_periods || ' período(s)',
    v_featured_id
  );

  RETURN jsonb_build_object(
    'success',      true,
    'featured_id',  v_featured_id,
    'price_ars',    v_price_ars
  );
END;
$$;


--
-- Name: activate_featured_with_coupon(uuid, uuid, text, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.activate_featured_with_coupon(p_user_id uuid, p_ad_id uuid, p_tier text, p_coupon_code text, p_payment_id text DEFAULT NULL::text) RETURNS json
    LANGUAGE plpgsql SECURITY DEFINER
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


--
-- Name: activate_featured_with_credits(uuid, uuid, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.activate_featured_with_credits(p_user_id uuid, p_ad_id uuid, p_duration_days integer) RETURNS json
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


--
-- Name: activate_pending_featured_ads(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.activate_pending_featured_ads() RETURNS integer
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_activated INT := 0;
  v_expired INT := 0;
BEGIN
  -- 1. Activar los que su fecha de inicio llegó
  UPDATE featured_ads
  SET 
    status = 'active',
    actual_start = NOW()
  WHERE status = 'pending'
    AND scheduled_start <= CURRENT_DATE;
  
  GET DIAGNOSTICS v_activated = ROW_COUNT;
  
  -- 2. EXPIRAR los que ya pasaron su fecha (CRÍTICO: esto faltaba ejecutarse automáticamente)
  UPDATE featured_ads
  SET status = 'expired'
  WHERE status = 'active'
    AND expires_at < NOW();
  
  GET DIAGNOSTICS v_expired = ROW_COUNT;
  
  -- Log para debugging
  IF v_activated > 0 OR v_expired > 0 THEN
    RAISE NOTICE 'Featured ads: % activados, % expirados', v_activated, v_expired;
  END IF;
  
  RETURN v_activated;
END;
$$;


--
-- Name: activate_scheduled_featured_ads(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.activate_scheduled_featured_ads() RETURNS integer
    LANGUAGE plpgsql
    AS $$
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
$$;


--
-- Name: activate_subscription_on_payment(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.activate_subscription_on_payment() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  plan_id UUID;
  period_months INTEGER;
BEGIN
  IF NEW.status = 'completed' AND NEW.payment_type IN ('subscription', 'upgrade', 'renewal') THEN
    -- Obtener plan_id del metadata
    plan_id := (NEW.metadata->>'plan_id')::UUID;
    period_months := COALESCE((NEW.metadata->>'period_months')::INTEGER, 1);
    
    IF plan_id IS NOT NULL THEN
      UPDATE users SET
        subscription_plan_id = plan_id,
        subscription_status = 'active',
        subscription_started_at = NOW(),
        subscription_expires_at = NOW() + (period_months || ' months')::INTERVAL
      WHERE id = NEW.user_id;
      
      RAISE NOTICE 'Activated subscription for user % with plan %', NEW.user_id, plan_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;


--
-- Name: admin_cancel_featured_ad(uuid, uuid, text, boolean); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.admin_cancel_featured_ad(p_featured_ad_id uuid, p_admin_id uuid, p_reason text DEFAULT NULL::text, p_refund boolean DEFAULT false) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_featured_ad    RECORD;
  v_refund_amount  NUMERIC(14,2) := 0;
  v_new_balance    NUMERIC(14,2);
  v_can_refund     BOOLEAN := FALSE;
BEGIN
  SELECT * INTO v_featured_ad
  FROM featured_ads
  WHERE id = p_featured_ad_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', FALSE, 'error', 'Featured ad no encontrado');
  END IF;

  IF v_featured_ad.status = 'cancelled' THEN
    RETURN jsonb_build_object('success', FALSE, 'error', 'Featured ad ya está cancelado');
  END IF;

  IF v_featured_ad.refunded = TRUE THEN
    RETURN jsonb_build_object('success', FALSE, 'error', 'Ya se realizó un reembolso anteriormente');
  END IF;

  v_can_refund := (v_featured_ad.credit_consumed = TRUE AND p_refund = TRUE);

  -- Cancelar featured ad
  UPDATE featured_ads
  SET
    status           = 'cancelled',
    cancelled_by     = p_admin_id,
    cancelled_reason = p_reason,
    cancelled_at     = NOW(),
    refunded         = v_can_refund,
    updated_at       = NOW()
  WHERE id = p_featured_ad_id;

  -- Reembolso proporcional via wallet (nuevo sistema)
  IF v_can_refund THEN
    v_refund_amount := COALESCE(
      public.calculate_featured_refund(p_featured_ad_id)::NUMERIC,
      0
    );

    IF v_refund_amount > 0 THEN
      UPDATE public.user_wallets
      SET virtual_balance = virtual_balance + v_refund_amount,
          updated_at      = NOW()
      WHERE user_id = v_featured_ad.user_id
      RETURNING virtual_balance INTO v_new_balance;

      INSERT INTO public.wallet_transactions (
        user_id, bucket, tx_type, amount, balance_after,
        source, description, featured_ad_id
      ) VALUES (
        v_featured_ad.user_id,
        'virtual',
        'credit',
        v_refund_amount,
        v_new_balance,
        'featured_refund',
        'Reembolso proporcional por cancelación de destacado: ' || COALESCE(p_reason, 'cancelado por admin'),
        p_featured_ad_id
      );
    END IF;
  END IF;

  -- Auditoría
  INSERT INTO featured_ads_audit (featured_ad_id, action, performed_by, reason, metadata)
  VALUES (
    p_featured_ad_id,
    CASE WHEN v_can_refund THEN 'refunded' ELSE 'cancelled' END,
    p_admin_id,
    p_reason,
    jsonb_build_object(
      'refund_amount',          v_refund_amount,
      'new_balance',            v_new_balance,
      'previous_status',        v_featured_ad.status,
      'was_superadmin_created', NOT v_featured_ad.credit_consumed
    )
  );

  IF NOT v_featured_ad.credit_consumed AND p_refund = TRUE THEN
    RETURN jsonb_build_object(
      'success', TRUE, 'refunded', FALSE, 'refund_amount', 0, 'user_balance', NULL,
      'message', 'Featured ad cancelado (creado por SuperAdmin sin consumir saldo)'
    );
  ELSE
    RETURN jsonb_build_object(
      'success',       TRUE,
      'refunded',      v_can_refund,
      'refund_amount', v_refund_amount,
      'user_balance',  v_new_balance
    );
  END IF;
END;
$$;


--
-- Name: admin_featured_stats(date, date); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.admin_featured_stats(p_date_from date DEFAULT NULL::date, p_date_to date DEFAULT NULL::date) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_stats JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_active', COUNT(*) FILTER (WHERE status = 'active'),
    'total_pending', COUNT(*) FILTER (WHERE status = 'pending'),
    'total_expired', COUNT(*) FILTER (WHERE status = 'expired'),
    'total_cancelled', COUNT(*) FILTER (WHERE status = 'cancelled'),
    'total_credits_consumed', COUNT(*) FILTER (WHERE credit_consumed = TRUE AND (status != 'cancelled' OR refunded = FALSE)),
    'total_credits_refunded', COUNT(*) FILTER (WHERE refunded = TRUE),
    'avg_duration', COALESCE(AVG(duration_days), 0),
    'total_featured_ads', COUNT(*),
    'by_placement', (
      SELECT jsonb_object_agg(placement, cnt)
      FROM (
        SELECT placement, COUNT(*) as cnt
        FROM featured_ads
        WHERE (p_date_from IS NULL OR scheduled_start >= p_date_from)
          AND (p_date_to IS NULL OR scheduled_start <= p_date_to)
        GROUP BY placement
      ) sub
    ),
    'by_duration', (
      SELECT jsonb_object_agg(duration_days::TEXT, cnt)
      FROM (
        SELECT duration_days, COUNT(*) as cnt
        FROM featured_ads
        WHERE (p_date_from IS NULL OR scheduled_start >= p_date_from)
          AND (p_date_to IS NULL OR scheduled_start <= p_date_to)
        GROUP BY duration_days
      ) sub
    )
  ) INTO v_stats
  FROM featured_ads
  WHERE (p_date_from IS NULL OR scheduled_start >= p_date_from)
    AND (p_date_to IS NULL OR scheduled_start <= p_date_to);

  RETURN v_stats;
END;
$$;


--
-- Name: admin_get_featured_ads(character varying[], character varying, uuid, uuid, text, date, date, integer, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.admin_get_featured_ads(p_status character varying[] DEFAULT NULL::character varying[], p_placement character varying DEFAULT NULL::character varying, p_category_id uuid DEFAULT NULL::uuid, p_user_id uuid DEFAULT NULL::uuid, p_search text DEFAULT NULL::text, p_date_from date DEFAULT NULL::date, p_date_to date DEFAULT NULL::date, p_limit integer DEFAULT 50, p_offset integer DEFAULT 0) RETURNS TABLE(id uuid, ad_id uuid, user_id uuid, placement text, category_id uuid, scheduled_start date, actual_start timestamp with time zone, expires_at timestamp with time zone, duration_days integer, status text, priority integer, credit_consumed boolean, refunded boolean, cancelled_by uuid, cancelled_reason text, cancelled_at timestamp with time zone, created_at timestamp with time zone, updated_at timestamp with time zone, ad_title text, ad_slug text, ad_images jsonb, ad_price numeric, ad_currency text, ad_status text, user_email text, user_full_name text, user_role text, category_name text, category_slug text, total_count bigint)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  WITH filtered_ads AS (
    SELECT
      fa.id,
      fa.ad_id,
      fa.user_id,
      fa.placement::TEXT,
      fa.category_id,
      fa.scheduled_start,
      fa.actual_start,
      fa.expires_at,
      fa.duration_days,
      fa.status::TEXT,
      fa.priority,
      fa.credit_consumed,
      COALESCE(fa.refunded, FALSE),
      fa.cancelled_by,
      fa.cancelled_reason,
      fa.cancelled_at,
      fa.created_at,
      fa.updated_at,
      a.title::TEXT,
      a.slug::TEXT,
      a.images,
      a.price,
      a.currency::TEXT,
      a.status::TEXT,
      u.email::TEXT,
      u.full_name::TEXT,
      u.role::TEXT,
      c.name::TEXT,
      c.slug::TEXT
    FROM featured_ads fa
    LEFT JOIN ads       a ON fa.ad_id       = a.id
    LEFT JOIN users     u ON fa.user_id     = u.id
    LEFT JOIN categories c ON fa.category_id = c.id
    WHERE
      (p_status      IS NULL OR fa.status      = ANY(p_status))
      AND (p_placement   IS NULL OR fa.placement   = p_placement)
      AND (p_category_id IS NULL OR fa.category_id = p_category_id)
      AND (p_user_id     IS NULL OR fa.user_id     = p_user_id)
      AND (p_search      IS NULL OR
           a.title     ILIKE '%' || p_search || '%' OR
           u.email     ILIKE '%' || p_search || '%' OR
           u.full_name ILIKE '%' || p_search || '%')
      AND (p_date_from IS NULL OR fa.scheduled_start >= p_date_from)
      AND (p_date_to   IS NULL OR fa.scheduled_start <= p_date_to)
  ),
  total AS (SELECT COUNT(*) AS cnt FROM filtered_ads)
  SELECT fa.*, (SELECT cnt FROM total)
  FROM filtered_ads fa
  ORDER BY fa.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;


--
-- Name: admin_get_featured_audit(uuid, integer, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.admin_get_featured_audit(p_featured_ad_id uuid DEFAULT NULL::uuid, p_limit integer DEFAULT 100, p_offset integer DEFAULT 0) RETURNS TABLE(id uuid, featured_ad_id uuid, action character varying, performed_by uuid, reason text, metadata jsonb, created_at timestamp with time zone, admin_email text, admin_name text, total_count bigint)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  WITH filtered_audit AS (
    SELECT 
      faa.id,
      faa.featured_ad_id,
      faa.action,
      faa.performed_by,
      faa.reason,
      faa.metadata,
      faa.created_at,
      u.email as admin_email,
      u.full_name as admin_name
    FROM featured_ads_audit faa
    LEFT JOIN users u ON faa.performed_by = u.id
    WHERE (p_featured_ad_id IS NULL OR faa.featured_ad_id = p_featured_ad_id)
  ),
  total AS (
    SELECT COUNT(*) as cnt FROM filtered_audit
  )
  SELECT 
    fa.*,
    (SELECT cnt FROM total) as total_count
  FROM filtered_audit fa
  ORDER BY fa.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;


--
-- Name: admin_get_occupancy_grid(integer, integer, character varying); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.admin_get_occupancy_grid(p_year integer, p_month integer, p_placement character varying DEFAULT 'homepage'::character varying) RETURNS TABLE(category_id uuid, category_name text, category_slug text, date date, count_active integer, max_slots integer)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_start_date DATE;
  v_end_date DATE;
BEGIN
  v_start_date := make_date(p_year, p_month, 1);
  v_end_date := (v_start_date + INTERVAL '1 month' - INTERVAL '1 day')::DATE;

  RETURN QUERY
  WITH dates AS (
    SELECT generate_series(v_start_date, v_end_date, '1 day'::INTERVAL)::DATE as date
  ),
  categories_list AS (
    SELECT id, name, slug FROM categories WHERE parent_id IS NULL
  ),
  grid AS (
    SELECT 
      cl.id as category_id,
      cl.name::TEXT as category_name,
      cl.slug::TEXT as category_slug,
      d.date,
      10 as max_slots
    FROM dates d
    CROSS JOIN categories_list cl
  )
  SELECT 
    g.category_id,
    g.category_name::TEXT,
    g.category_slug::TEXT,
    g.date,
    COUNT(fa.id)::INT as count_active,
    g.max_slots
  FROM grid g
  LEFT JOIN featured_ads fa ON 
    fa.category_id = g.category_id
    AND fa.placement = p_placement
    AND fa.status = 'active'
    AND fa.scheduled_start <= g.date
    AND (fa.expires_at IS NULL OR DATE(fa.expires_at) >= g.date)
  GROUP BY g.category_id, g.category_name, g.category_slug, g.date, g.max_slots
  ORDER BY g.category_name, g.date;
END;
$$;


--
-- Name: apply_template_to_subcategory(uuid, uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.apply_template_to_subcategory(p_template_id uuid, p_target_category_id uuid, p_target_subcategory_id uuid) RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_inserted_count INTEGER;
BEGIN
  -- Obtener el siguiente sort_order disponible
  WITH max_order AS (
    SELECT COALESCE(MAX(sort_order), 0) AS max_sort
    FROM dynamic_attributes
    WHERE subcategory_id = p_target_subcategory_id
  )
  -- Insertar atributos desde el template
  INSERT INTO dynamic_attributes (
    category_id, subcategory_id, type_id,
    field_name, field_label, field_type, field_group,
    field_options, is_required, min_value, max_value,
    placeholder, help_text, prefix, suffix, sort_order, is_active
  )
  SELECT 
    p_target_category_id,
    p_target_subcategory_id,
    NULL, -- type_id siempre null (SOFT HIDE)
    field_name, field_label, field_type, field_group,
    field_options, is_required, min_value, max_value,
    placeholder, help_text, prefix, suffix,
    (SELECT max_sort FROM max_order) + sort_order, -- Offset para no sobrescribir
    true
  FROM attribute_template_fields
  WHERE template_id = p_template_id
  ORDER BY sort_order;
  
  GET DIAGNOSTICS v_inserted_count = ROW_COUNT;
  RETURN v_inserted_count;
END;
$$;


--
-- Name: assign_brand_to_subcategory(uuid, uuid, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.assign_brand_to_subcategory(p_subcategory_id uuid, p_brand_id uuid, p_sort_order integer DEFAULT 0) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_id UUID;
BEGIN
  -- Verificar que la subcategoría existe
  IF NOT EXISTS (SELECT 1 FROM subcategories WHERE id = p_subcategory_id) THEN
    RAISE EXCEPTION 'Subcategoría no existe';
  END IF;
  
  -- Verificar que la marca existe
  IF NOT EXISTS (SELECT 1 FROM brands WHERE id = p_brand_id) THEN
    RAISE EXCEPTION 'Marca no existe';
  END IF;
  
  -- Insertar o actualizar
  INSERT INTO subcategory_brands (subcategory_id, brand_id, sort_order)
  VALUES (p_subcategory_id, p_brand_id, p_sort_order)
  ON CONFLICT (subcategory_id, brand_id) 
  DO UPDATE SET sort_order = p_sort_order
  RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$;


--
-- Name: auto_approve_premium_ads(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.auto_approve_premium_ads() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  -- MVP: Auto-aprobar todos los avisos (admin y user)
  NEW.approval_status := 'approved';
  NEW.approved_at := NOW();
  NEW.status := 'active';
  
  RETURN NEW;
END;
$$;


--
-- Name: auto_approve_superadmin_ads(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.auto_approve_superadmin_ads() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT role INTO v_role FROM public.users WHERE id = NEW.user_id;

  IF v_role = 'superadmin' THEN
    NEW.approval_status := 'approved';
    NEW.status := 'active';
  END IF;

  RETURN NEW;
END;
$$;


--
-- Name: auto_deactivate_expired_banners(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.auto_deactivate_expired_banners() RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  UPDATE banners 
  SET is_active = false
  WHERE is_active = true 
    AND expires_at IS NOT NULL 
    AND expires_at < NOW();
END;
$$;


--
-- Name: auto_expire_featured_ads(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.auto_expire_featured_ads() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  -- Si el aviso tiene featured_until y ya pasó, quitar destacado
  IF NEW.featured = true AND NEW.featured_until IS NOT NULL AND NEW.featured_until < NOW() THEN
    NEW.featured := false;
    NEW.featured_until := NULL;
    NEW.featured_order := NULL;
    RAISE NOTICE 'Auto-expired featured ad: %', NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;


--
-- Name: auto_sitemap_for_premium(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.auto_sitemap_for_premium() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  -- Si el aviso es premium o destacado, agregarlo al sitemap automáticamente
  IF NEW.is_premium = TRUE OR NEW.featured = TRUE THEN
    NEW.in_sitemap := TRUE;
    NEW.sitemap_added_at := NOW();
  END IF;
  RETURN NEW;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id uuid NOT NULL,
    email character varying(255) NOT NULL,
    full_name character varying(255) NOT NULL,
    phone character varying(20),
    role character varying(50) DEFAULT 'free'::character varying NOT NULL,
    is_verified boolean DEFAULT false,
    display_name character varying(255),
    company_tax_id character varying(50),
    location character varying(255),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    email_verified boolean DEFAULT false,
    mobile text,
    user_type text DEFAULT 'particular'::text,
    province text,
    subscription_plan_id uuid,
    subscription_status character varying(20) DEFAULT 'active'::character varying,
    subscription_started_at timestamp with time zone,
    subscription_expires_at timestamp with time zone,
    subscription_auto_renew boolean DEFAULT true,
    custom_max_ads integer,
    custom_max_contacts integer,
    cuit character varying(13),
    verification_status character varying(20) DEFAULT 'verified'::character varying,
    verification_notes text,
    verified_by uuid,
    verified_at timestamp with time zone,
    first_name character varying(100),
    last_name character varying(100),
    contacts_used_this_month integer DEFAULT 0,
    contacts_reset_at timestamp with time zone,
    avatar_url text,
    bio text,
    services text,
    privacy_mode character varying(20) DEFAULT 'public'::character varying,
    profile_views integer DEFAULT 0,
    profile_contacts_received integer DEFAULT 0,
    activity character varying(50) DEFAULT NULL::character varying,
    mobile_verified boolean DEFAULT false,
    mobile_verification_code character varying(6),
    mobile_verification_sent_at timestamp with time zone,
    mobile_verification_attempts integer DEFAULT 0,
    domicilio text,
    codigo_postal character varying(10),
    billing_same_address boolean DEFAULT true NOT NULL,
    billing_address text,
    billing_localidad character varying(255),
    billing_provincia character varying(255),
    billing_codigo_postal character varying(10),
    profile_completion_pct integer DEFAULT 0,
    CONSTRAINT chk_users_activity CHECK (((activity IS NULL) OR ((activity)::text = ANY ((ARRAY['productor'::character varying, 'empresa'::character varying, 'comerciante'::character varying, 'profesional'::character varying, 'usuario_general'::character varying])::text[])))),
    CONSTRAINT users_role_check CHECK (((role)::text = ANY ((ARRAY['superadmin'::character varying, 'revendedor'::character varying, 'premium'::character varying, 'free'::character varying])::text[]))),
    CONSTRAINT users_subscription_status_check CHECK (((subscription_status)::text = ANY ((ARRAY['active'::character varying, 'inactive'::character varying, 'expired'::character varying, 'cancelled'::character varying, 'pending'::character varying])::text[]))),
    CONSTRAINT users_verification_status_check CHECK (((verification_status)::text = ANY ((ARRAY['pending'::character varying, 'pending_verification'::character varying, 'verified'::character varying, 'rejected'::character varying])::text[])))
);


--
-- Name: calc_profile_completion(public.users); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.calc_profile_completion(u public.users) RETURNS integer
    LANGUAGE plpgsql
    AS $$
DECLARE
  pct integer := 0;
BEGIN
  -- email verificado: 30%
  IF u.email_verified = true THEN pct := pct + 30; END IF;

  -- teléfono: mobile verificado O phone no vacío: 30%
  IF u.mobile IS NOT NULL AND u.mobile != '' THEN pct := pct + 30; END IF;

  -- nombre completo: 20%
  IF u.full_name IS NOT NULL AND length(trim(u.full_name)) > 2 THEN pct := pct + 20; END IF;

  -- provincia: 10%
  IF u.province IS NOT NULL AND u.province != '' THEN pct := pct + 10; END IF;

  -- foto de perfil: 10%
  IF u.avatar_url IS NOT NULL AND u.avatar_url != '' THEN pct := pct + 10; END IF;

  RETURN pct;
END;
$$;


--
-- Name: calculate_execution_time(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.calculate_execution_time() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF NEW.finished_at IS NOT NULL AND NEW.started_at IS NOT NULL THEN
    NEW.execution_time_ms := EXTRACT(EPOCH FROM (NEW.finished_at - NEW.started_at)) * 1000;
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: calculate_featured_refund(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.calculate_featured_refund(p_featured_id uuid) RETURNS integer
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_credits_spent INT;
  v_duration_days INT;
  v_expires_at TIMESTAMPTZ;
  v_days_remaining INT;
  v_refund_amount INT;
BEGIN
  -- Obtener datos del featured
  SELECT 
    COALESCE(credits_spent, 1),
    duration_days,
    expires_at
  INTO v_credits_spent, v_duration_days, v_expires_at
  FROM featured_ads
  WHERE id = p_featured_id;
  
  -- Validar que existe y está activo
  IF NOT FOUND OR v_expires_at IS NULL THEN
    RETURN 0;
  END IF;
  
  -- Calcular días restantes
  v_days_remaining := EXTRACT(DAY FROM (v_expires_at - NOW()))::INT;
  
  -- Si ya expiró, no hay reembolso
  IF v_days_remaining <= 0 THEN
    RETURN 0;
  END IF;
  
  -- Calcular reembolso proporcional (redondeo hacia arriba)
  v_refund_amount := CEIL(
    (v_days_remaining::DECIMAL / v_duration_days::DECIMAL) * v_credits_spent::DECIMAL
  )::INT;
  
  -- No puede ser mayor a los créditos originales
  IF v_refund_amount > v_credits_spent THEN
    v_refund_amount := v_credits_spent;
  END IF;
  
  RETURN v_refund_amount;
END;
$$;


--
-- Name: can_send_contact(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.can_send_contact() RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  user_role TEXT;
  sent_count INTEGER;
BEGIN
  -- Anónimos siempre pueden
  IF auth.uid() IS NULL THEN
    RETURN TRUE;
  END IF;
  
  -- Obtener rol
  SELECT role INTO user_role FROM users WHERE id = auth.uid();
  
  -- Premium/empresa/superadmin/verificado: sin límite
  IF user_role NOT IN ('free', 'free-verificado') THEN
    RETURN TRUE;
  END IF;
  
  -- FREE: verificar límite (bypass RLS con SECURITY DEFINER)
  SELECT COUNT(*) INTO sent_count 
  FROM contact_messages 
  WHERE sender_user_id = auth.uid();
  
  RETURN sent_count < 5;
END;
$$;


--
-- Name: can_user_send_contact(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.can_user_send_contact(user_uuid uuid) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  limits RECORD;
BEGIN
  SELECT * INTO limits FROM get_user_contact_limits(user_uuid);
  RETURN limits.can_send_more;
END;
$$;


--
-- Name: check_ad_limit(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.check_ad_limit() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  user_role TEXT;
  ad_count INTEGER;
  max_ads INTEGER;
BEGIN
  SELECT u.role INTO user_role
  FROM public.users u WHERE u.id = NEW.user_id;

  SELECT COUNT(*) INTO ad_count
  FROM public.ads WHERE user_id = NEW.user_id AND status IN ('active', 'paused');

  max_ads := CASE
    WHEN user_role = 'superadmin' THEN 999999
    WHEN user_role = 'revendedor' THEN 999999
    WHEN user_role = 'premium' THEN 20
    WHEN user_role = 'free' THEN 5
    ELSE 5
  END;

  IF ad_count >= max_ads THEN
    RAISE EXCEPTION 'Límite de avisos alcanzado (% de %)', ad_count, max_ads;
  END IF;

  RETURN NEW;
END;
$$;


--
-- Name: check_at_least_one_featured(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.check_at_least_one_featured() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  -- Solo aplicar para homepage_vip
  IF NEW.type = 'homepage_vip' THEN
    -- Si se está desactivando el último destacado de un device, bloquear
    IF OLD.is_featured = true AND NEW.is_featured = false THEN
      IF NOT EXISTS (
        SELECT 1 FROM banners 
        WHERE type = 'homepage_vip' 
          AND device_target = OLD.device_target 
          AND is_featured = true 
          AND is_active = true
          AND id != OLD.id
      ) THEN
        RAISE EXCEPTION 'Debe haber al menos 1 banner destacado activo para % en homepage_vip', OLD.device_target;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;


--
-- Name: check_featured_availability(text, uuid, date, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.check_featured_availability(p_placement text, p_category_id uuid, p_start_date date, p_duration_days integer) RETURNS TABLE(is_available boolean, max_slots integer, used_slots bigint, available_slots bigint, next_available_date date)
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_max_slots INT;
  v_end_date DATE;
  v_used_slots BIGINT;
  v_next_date DATE;
BEGIN
  SELECT (value #>> '{}')::INT INTO v_max_slots
  FROM global_settings
  WHERE key = 'featured_slots_' || p_placement;

  IF v_max_slots IS NULL THEN
    v_max_slots := 10;
  END IF;

  v_end_date := p_start_date + p_duration_days;

  -- Contar slots usados EXCLUYENDO SuperAdmin (is_manual = true)
  SELECT COUNT(DISTINCT fa.user_id) INTO v_used_slots
  FROM featured_ads fa
  WHERE fa.placement = p_placement
    AND fa.category_id = p_category_id
    AND fa.status IN ('active', 'pending')
    AND fa.is_manual = false  -- ← NO contar SuperAdmin
    AND (
      (fa.scheduled_start <= p_start_date AND COALESCE(fa.expires_at::date, fa.scheduled_start + fa.duration_days) > p_start_date)
      OR (fa.scheduled_start >= p_start_date AND fa.scheduled_start < v_end_date)
    );

  IF v_used_slots >= v_max_slots THEN
    SELECT MIN(COALESCE(fa.expires_at::date, fa.scheduled_start + fa.duration_days)) INTO v_next_date
    FROM featured_ads fa
    WHERE fa.placement = p_placement
      AND fa.category_id = p_category_id
      AND fa.status IN ('active', 'pending')
      AND fa.is_manual = false
      AND COALESCE(fa.expires_at::date, fa.scheduled_start + fa.duration_days) > CURRENT_DATE;
  END IF;

  RETURN QUERY SELECT
    (v_used_slots < v_max_slots),
    v_max_slots,
    v_used_slots,
    (v_max_slots - v_used_slots)::BIGINT,
    COALESCE(v_next_date, p_start_date);
END;
$$;


--
-- Name: check_featured_availability(character varying, uuid, date, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.check_featured_availability(p_placement character varying, p_category_id uuid, p_start_date date, p_duration_days integer DEFAULT 15) RETURNS TABLE(is_available boolean, slots_total integer, slots_used integer, slots_available integer, next_available_date date)
    LANGUAGE plpgsql
    AS $$
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
$$;


--
-- Name: check_max_companies_per_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.check_max_companies_per_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_max_allowed   integer;
  v_current_count integer;
  v_user_role     text;
BEGIN
  -- Solo aplica al rol 'owner'
  IF NEW.role != 'owner' THEN RETURN NEW; END IF;

  -- Obtener rol del usuario
  SELECT role INTO v_user_role FROM public.users WHERE id = NEW.user_id;

  -- Superadmin: sin límite
  IF v_user_role = 'superadmin' THEN RETURN NEW; END IF;

  -- Obtener límite del plan
  SELECT COALESCE(sp.max_company_profiles, 0)
    INTO v_max_allowed
    FROM public.users u
    LEFT JOIN public.subscription_plans sp ON u.subscription_plan_id = sp.id
    WHERE u.id = NEW.user_id;

  -- Sin plan asignado = FREE = 0
  IF v_max_allowed IS NULL THEN v_max_allowed := 0; END IF;

  -- Contar empresas actuales donde es owner
  SELECT COUNT(*) INTO v_current_count
    FROM public.business_profile_members
    WHERE user_id = NEW.user_id AND role = 'owner';

  IF v_current_count >= v_max_allowed THEN
    RAISE EXCEPTION 'COMPANY_LIMIT_REACHED: Tu plan permite hasta % empresa(s). Contratá un plan superior para agregar más.', v_max_allowed
      USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$;


--
-- Name: check_promo_status(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.check_promo_status(p_user_id uuid) RETURNS TABLE(promo_active boolean, can_claim boolean, already_claimed boolean, credits_available integer, promo_message text, promo_end_date date)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
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
$$;


--
-- Name: check_recipient_limit(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.check_recipient_limit() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  recipient_limits RECORD;
BEGIN
  -- Obtener límites del destinatario (vendedor)
  SELECT * INTO recipient_limits
  FROM get_user_contact_limits(NEW.ad_owner_id);
  
  -- Si el vendedor alcanzó su límite de recibidos
  IF NOT recipient_limits.can_receive_more THEN
    -- Crear el contacto pero marcarlo como bloqueado
    NEW.status := 'blocked';
    NEW.is_blocked := true;
    NEW.blocked_reason := 'recipient_limit_reached';
    
    -- Crear notificación para el vendedor
    INSERT INTO contact_notifications (
      user_id, 
      contact_message_id, 
      type, 
      title, 
      message
    ) VALUES (
      NEW.ad_owner_id,
      NEW.id,
      'limit_reached',
      'Nueva consulta bloqueada - Límite alcanzado',
      format('Recibiste una nueva consulta pero alcanzaste tu límite de %s contactos. Actualiza a Premium para desbloquearla.', 
        recipient_limits.max_received)
    );
  ELSE
    -- Crear notificación normal de nuevo contacto
    INSERT INTO contact_notifications (
      user_id, 
      contact_message_id, 
      type, 
      title, 
      message
    ) VALUES (
      NEW.ad_owner_id,
      NEW.id,
      'new_contact',
      'Nueva consulta recibida',
      format('Tienes una nueva consulta sobre tu aviso. Contactos: %s de %s', 
        recipient_limits.current_received + 1,
        COALESCE(recipient_limits.max_received::TEXT, '∞'))
    );
  END IF;
  
  RETURN NEW;
END;
$$;


--
-- Name: claim_promo_credits(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.claim_promo_credits(p_user_id uuid) RETURNS TABLE(success boolean, credits_granted integer, message text)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
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
$$;


--
-- Name: clean_price_decimals(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.clean_price_decimals() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  -- Si price es NOT NULL y es un entero (sin decimales significativos)
  IF NEW.price IS NOT NULL AND NEW.price = FLOOR(NEW.price) THEN
    -- Guardarlo sin decimales
    NEW.price := FLOOR(NEW.price);
  END IF;
  
  -- Si price_negotiable es TRUE, limpiar el precio
  IF NEW.price_negotiable = TRUE THEN
    NEW.price := NULL;
  END IF;
  
  RETURN NEW;
END;
$$;


--
-- Name: cleanup_expired_featured_ads(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.cleanup_expired_featured_ads() RETURNS integer
    LANGUAGE plpgsql
    AS $$
DECLARE
  affected_count INTEGER;
BEGIN
  UPDATE ads
  SET 
    featured = false,
    featured_until = NULL,
    featured_order = NULL
  WHERE 
    featured = true 
    AND featured_until IS NOT NULL 
    AND featured_until < NOW();
  
  GET DIAGNOSTICS affected_count = ROW_COUNT;
  
  RAISE NOTICE 'Cleaned up % expired featured ads', affected_count;
  
  RETURN affected_count;
END;
$$;


--
-- Name: cleanup_old_search_analytics(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.cleanup_old_search_analytics() RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
    DELETE FROM public.search_analytics 
    WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$;


--
-- Name: complete_expired_featured_ads(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.complete_expired_featured_ads() RETURNS integer
    LANGUAGE plpgsql
    AS $$
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
$$;


--
-- Name: create_coupon(uuid, character varying, character varying, character varying, text, integer, uuid, integer, timestamp with time zone); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.create_coupon(p_admin_id uuid, p_code character varying, p_name character varying, p_title character varying, p_description text, p_credits_amount integer, p_membership_id uuid, p_max_redemptions integer, p_expires_at timestamp with time zone) RETURNS json
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_coupon_id UUID;
BEGIN
  -- Verificar que es superadmin
  IF NOT EXISTS (
    SELECT 1 FROM users 
    WHERE id = p_admin_id AND role = 'superadmin'
  ) THEN
    RETURN json_build_object('success', false, 'error', 'No autorizado');
  END IF;
  
  -- Verificar código único
  IF EXISTS (SELECT 1 FROM coupons WHERE UPPER(code) = UPPER(p_code)) THEN
    RETURN json_build_object('success', false, 'error', 'El código ya existe');
  END IF;
  
  -- Crear cupón
  INSERT INTO coupons (
    code, name, title, description, credits_amount, 
    membership_id, max_redemptions, expires_at, created_by
  ) VALUES (
    UPPER(p_code), p_name, p_title, p_description, p_credits_amount,
    p_membership_id, p_max_redemptions, p_expires_at, p_admin_id
  ) RETURNING id INTO v_coupon_id;
  
  RETURN json_build_object(
    'success', true,
    'coupon_id', v_coupon_id,
    'message', 'Cupón creado exitosamente'
  );
END;
$$;


--
-- Name: create_coupon_invitation(uuid, uuid, character varying); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.create_coupon_invitation(p_admin_id uuid, p_coupon_id uuid, p_email character varying) RETURNS json
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_token VARCHAR;
  v_invitation_id UUID;
  v_coupon RECORD;
BEGIN
  -- Verificar que es superadmin
  IF NOT EXISTS (
    SELECT 1 FROM users 
    WHERE id = p_admin_id AND role = 'superadmin'
  ) THEN
    RETURN json_build_object('success', false, 'error', 'No autorizado');
  END IF;
  
  -- Verificar cupón
  SELECT * INTO v_coupon FROM coupons WHERE id = p_coupon_id AND is_active = true;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Cupón no encontrado o inactivo');
  END IF;
  
  -- Generar token único
  v_token := encode(gen_random_bytes(32), 'hex');
  
  -- Crear invitación
  INSERT INTO coupon_invitations (
    coupon_id, email, invited_by, token
  ) VALUES (
    p_coupon_id, LOWER(p_email), p_admin_id, v_token
  ) RETURNING id INTO v_invitation_id;
  
  RETURN json_build_object(
    'success', true,
    'invitation_id', v_invitation_id,
    'token', v_token,
    'email', p_email,
    'coupon_code', v_coupon.code,
    'message', 'Invitación creada. Enviar email manualmente o integrar con servicio de email.'
  );
END;
$$;


--
-- Name: create_coupon_v2(uuid, character varying, character varying, character varying, text, boolean, integer, boolean, boolean, uuid[], integer, timestamp with time zone); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.create_coupon_v2(p_admin_id uuid, p_code character varying, p_name character varying, p_title character varying, p_description text, p_gives_credits boolean, p_credits_amount integer, p_gives_membership boolean, p_membership_all boolean, p_membership_plan_ids uuid[], p_max_redemptions integer, p_expires_at timestamp with time zone) RETURNS json
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_coupon_id UUID;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM users WHERE id = p_admin_id AND role = 'superadmin'
  ) THEN
    RETURN json_build_object('success', false, 'error', 'No autorizado');
  END IF;
  
  IF EXISTS (SELECT 1 FROM coupons WHERE UPPER(code) = UPPER(p_code)) THEN
    RETURN json_build_object('success', false, 'error', 'El código ya existe');
  END IF;
  
  IF NOT p_gives_credits AND NOT p_gives_membership THEN
    RETURN json_build_object('success', false, 'error', 'El cupón debe regalar créditos o membresía');
  END IF;
  
  INSERT INTO coupons (
    code, name, title, description, 
    gives_credits, credits_amount, 
    gives_membership, membership_all, membership_plan_ids,
    max_redemptions, expires_at, created_by
  ) VALUES (
    UPPER(p_code), p_name, p_title, p_description,
    p_gives_credits, CASE WHEN p_gives_credits THEN p_credits_amount ELSE 0 END,
    p_gives_membership, 
    CASE WHEN p_gives_membership THEN p_membership_all ELSE false END,
    CASE WHEN p_gives_membership AND NOT p_membership_all THEN p_membership_plan_ids ELSE '{}' END,
    p_max_redemptions, p_expires_at, p_admin_id
  ) RETURNING id INTO v_coupon_id;
  
  RETURN json_build_object(
    'success', true,
    'coupon_id', v_coupon_id,
    'message', 'Cupón creado exitosamente'
  );
END;
$$;


--
-- Name: create_featured_ad(uuid, uuid, text, date); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.create_featured_ad(p_ad_id uuid, p_user_id uuid, p_placement text DEFAULT 'homepage'::text, p_scheduled_start date DEFAULT CURRENT_DATE) RETURNS TABLE(success boolean, featured_id uuid, message text)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_category_id UUID;
  v_ad_user_id UUID;
  v_credits_available INT;
  v_is_available BOOLEAN;
  v_duration INT;
  v_new_id UUID;
  v_user_role VARCHAR(50);
  v_is_superadmin BOOLEAN := FALSE;
BEGIN
  -- 0. CHECK SUPERADMIN
  SELECT role INTO v_user_role FROM users WHERE id = p_user_id;
  v_is_superadmin := (v_user_role = 'superadmin');

  -- 1. Verificar que el aviso existe
  SELECT category_id, user_id INTO v_category_id, v_ad_user_id
  FROM ads WHERE id = p_ad_id;

  IF v_category_id IS NULL THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, 'Aviso no encontrado'::TEXT;
    RETURN;
  END IF;

  -- SuperAdmin puede destacar CUALQUIER aviso
  IF NOT v_is_superadmin AND v_ad_user_id != p_user_id THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, 'No sos el dueño de este aviso'::TEXT;
    RETURN;
  END IF;

  -- 2. Verificar créditos (SKIP para SuperAdmin)
  IF NOT v_is_superadmin THEN
    SELECT (credits_total - credits_used) INTO v_credits_available
    FROM user_featured_credits WHERE user_id = p_user_id;

    IF COALESCE(v_credits_available, 0) <= 0 THEN
      RETURN QUERY SELECT FALSE, NULL::UUID, 'No tenés créditos disponibles'::TEXT;
      RETURN;
    END IF;
  END IF;

  -- 3. Verificar que no esté ya destacado en este placement
  IF EXISTS (
    SELECT 1 FROM featured_ads
    WHERE ad_id = p_ad_id AND placement = p_placement AND status IN ('pending', 'active')
  ) THEN
    RETURN QUERY SELECT FALSE, NULL::UUID,
      'Este aviso ya está destacado en esta ubicación.'::TEXT;
    RETURN;
  END IF;

  -- 4. Duración desde settings
  SELECT (value #>> '{}')::INT INTO v_duration
  FROM global_settings WHERE key = 'featured_duration_days';
  v_duration := COALESCE(v_duration, 15);

  -- 5. Verificar slots (SKIP para SuperAdmin - sin límites)
  IF NOT v_is_superadmin THEN
    SELECT fa.is_available INTO v_is_available
    FROM check_featured_availability(p_placement, v_category_id, p_scheduled_start, v_duration) fa;

    IF NOT v_is_available THEN
      RETURN QUERY SELECT FALSE, NULL::UUID,
        'No hay slots disponibles en esa fecha.'::TEXT;
      RETURN;
    END IF;
  END IF;

  -- 6. Crear featured ad
  --    SuperAdmin: is_manual=true, status='active', actual_start=NOW()
  --    Usuario:    is_manual=false, status='pending', actual_start=NULL
  INSERT INTO featured_ads (
    ad_id, user_id, placement, category_id,
    scheduled_start, duration_days, status, priority,
    is_manual, credit_consumed,
    actual_start, expires_at
  ) VALUES (
    p_ad_id,
    p_user_id,
    p_placement,
    v_category_id,
    p_scheduled_start,
    CASE WHEN v_is_superadmin THEN 9999 ELSE v_duration END,
    CASE WHEN v_is_superadmin THEN 'active' ELSE 'pending' END,
    (SELECT COALESCE(MAX(priority), 0) + 1
     FROM featured_ads
     WHERE placement = p_placement AND category_id = v_category_id),
    v_is_superadmin,        -- is_manual = true para SuperAdmin
    NOT v_is_superadmin,    -- credit_consumed = false para SuperAdmin
    CASE WHEN v_is_superadmin THEN NOW() ELSE NULL END,
    NULL                    -- expires_at: NULL = sin límite de expiración
  )
  RETURNING id INTO v_new_id;

  -- 7. Consumir crédito (SKIP para SuperAdmin)
  IF NOT v_is_superadmin THEN
    UPDATE user_featured_credits
    SET credits_used = credits_used + 1, updated_at = NOW()
    WHERE user_id = p_user_id;
  END IF;

  -- 8. SuperAdmin: auto-aprobar y activar el aviso base
  IF v_is_superadmin THEN
    UPDATE ads
    SET approval_status = 'approved',
        status = 'active',
        featured = true,
        featured_at = NOW()
    WHERE id = p_ad_id
      AND (approval_status != 'approved' OR status != 'active' OR featured != true);

    RETURN QUERY SELECT TRUE, v_new_id,
      'SuperAviso activado en todas las ubicaciones sin límites'::TEXT;
  ELSE
    RETURN QUERY SELECT TRUE, v_new_id,
      'Aviso programado para destacar'::TEXT;
  END IF;
END;
$$;


--
-- Name: create_template_from_subcategory(text, text, uuid, uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.create_template_from_subcategory(p_name text, p_description text, p_category_id uuid, p_subcategory_id uuid, p_created_by uuid) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_template_id UUID;
BEGIN
  -- Crear template
  INSERT INTO attribute_templates (
    name, description, category_id, subcategory_id, created_by
  ) VALUES (
    p_name, p_description, p_category_id, p_subcategory_id, p_created_by
  )
  RETURNING id INTO v_template_id;
  
  -- Copiar todos los atributos de la subcategoría
  INSERT INTO attribute_template_fields (
    template_id, field_name, field_label, field_type, field_group,
    field_options, is_required, min_value, max_value, placeholder,
    help_text, prefix, suffix, sort_order
  )
  SELECT 
    v_template_id, field_name, field_label, field_type, field_group,
    field_options, is_required, min_value, max_value, placeholder,
    help_text, prefix, suffix, sort_order
  FROM dynamic_attributes
  WHERE subcategory_id = p_subcategory_id
    AND is_active = true
  ORDER BY sort_order;
  
  RETURN v_template_id;
END;
$$;


--
-- Name: delete_coupon(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.delete_coupon(p_admin_id uuid, p_coupon_id uuid) RETURNS json
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  -- Verificar que es superadmin
  IF NOT EXISTS (
    SELECT 1 FROM users 
    WHERE id = p_admin_id AND role = 'superadmin'
  ) THEN
    RETURN json_build_object('success', false, 'error', 'No autorizado');
  END IF;
  
  -- Eliminar cupón
  DELETE FROM coupons WHERE id = p_coupon_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Cupón no encontrado');
  END IF;
  
  RETURN json_build_object('success', true, 'message', 'Cupón eliminado');
END;
$$;


--
-- Name: expire_featured_ads(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.expire_featured_ads() RETURNS integer
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_expired INT;
BEGIN
  UPDATE public.featured_ads
  SET status = 'expired'
  WHERE status = 'active' AND expires_at <= NOW();
  
  GET DIAGNOSTICS v_expired = ROW_COUNT;
  RETURN v_expired;
END;
$$;


--
-- Name: featured_ads_audit_trigger(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.featured_ads_audit_trigger() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  -- Solo registrar cambios de estado relevantes
  IF TG_OP = 'INSERT' THEN
    INSERT INTO featured_ads_audit (featured_ad_id, action, performed_by, metadata)
    VALUES (NEW.id, 'created', NEW.user_id, jsonb_build_object('status', NEW.status));
  
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status != NEW.status THEN
      INSERT INTO featured_ads_audit (featured_ad_id, action, performed_by, reason, metadata)
      VALUES (
        NEW.id, 
        CASE 
          WHEN NEW.status = 'cancelled' THEN 'cancelled'
          WHEN NEW.status = 'active' AND OLD.status = 'pending' THEN 'activated'
          WHEN NEW.status = 'expired' THEN 'expired'
          ELSE 'edited'
        END,
        COALESCE(NEW.cancelled_by, NEW.user_id),
        NEW.cancelled_reason,
        jsonb_build_object(
          'old_status', OLD.status,
          'new_status', NEW.status,
          'refunded', NEW.refunded
        )
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;


--
-- Name: featured_ads_daily_maintenance(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.featured_ads_daily_maintenance() RETURNS TABLE(activated integer, completed integer)
    LANGUAGE plpgsql
    AS $$
BEGIN
  activated := activate_scheduled_featured_ads();
  completed := complete_expired_featured_ads();
  RETURN NEXT;
END;
$$;


--
-- Name: generate_ad_slug(text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.generate_ad_slug(title text, short_id text) RETURNS text
    LANGUAGE plpgsql
    AS $$
DECLARE
  base_slug TEXT;
BEGIN
  -- Normalizar título: quitar acentos, espacios -> guiones, solo alfanuméricos
  base_slug := lower(
    regexp_replace(
      regexp_replace(
        regexp_replace(
          regexp_replace(
            regexp_replace(
              regexp_replace(
                regexp_replace(title, '[áàäâã]', 'a', 'gi'),
                '[éèëê]', 'e', 'gi'),
              '[íìïî]', 'i', 'gi'),
            '[óòöôõ]', 'o', 'gi'),
          '[úùüû]', 'u', 'gi'),
        '[ñ]', 'n', 'gi'),
      '[^a-z0-9]+', '-', 'gi')
  );
  
  -- Quitar guiones al inicio y final, limitar a 100 chars
  base_slug := left(trim(both '-' from base_slug), 100);
  
  -- Retornar slug con short_id al final
  RETURN base_slug || '-' || short_id;
END;
$$;


--
-- Name: generate_payment_receipt_number(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.generate_payment_receipt_number() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF NEW.status = 'completed' AND NEW.receipt_number IS NULL THEN
    NEW.receipt_number := 'R24-' || TO_CHAR(NOW(), 'YYYYMM') || '-' || LPAD(nextval('payment_receipt_seq')::TEXT, 6, '0');
    NEW.completed_at := NOW();
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: generate_short_id(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.generate_short_id() RETURNS text
    LANGUAGE plpgsql
    AS $$
DECLARE
  chars TEXT := 'abcdefghijklmnopqrstuvwxyz0123456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$;


--
-- Name: get_ad_contact_status(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_ad_contact_status(p_user_id uuid, p_ad_id uuid) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_msg   contact_messages%ROWTYPE;
  v_reply contact_messages%ROWTYPE;
BEGIN
  -- Mensaje raíz más reciente de este usuario para este aviso
  SELECT * INTO v_msg
  FROM contact_messages
  WHERE sender_user_id = p_user_id
    AND ad_id           = p_ad_id
    AND (is_reply = false OR is_reply IS NULL)
  ORDER BY created_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('status', 'available');
  END IF;

  -- Si el hilo tiene respuesta del vendedor → desbloqueado
  IF v_msg.thread_id IS NOT NULL THEN
    SELECT * INTO v_reply
    FROM contact_messages
    WHERE thread_id       = v_msg.thread_id
      AND is_reply        = true
      AND sender_user_id  = v_msg.ad_owner_id
    ORDER BY created_at ASC
    LIMIT 1;

    IF FOUND THEN
      RETURN jsonb_build_object(
        'status',      'replied',
        'thread_id',   v_msg.thread_id,
        'sent_at',     v_msg.created_at,
        'replied_at',  v_reply.created_at
      );
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'status',    'pending',
    'thread_id', v_msg.thread_id,
    'sent_at',   v_msg.created_at
  );
END;
$$;


--
-- Name: get_admin_coupons(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_admin_coupons(p_admin_id uuid) RETURNS json
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM users WHERE id = p_admin_id AND role = 'superadmin'
  ) THEN
    RETURN json_build_object('success', false, 'error', 'No autorizado');
  END IF;
  
  RETURN json_build_object(
    'success', true,
    'coupons', (
      SELECT COALESCE(json_agg(
        json_build_object(
          'id', c.id,
          'code', c.code,
          'name', c.name,
          'title', c.title,
          'description', c.description,
          'gives_credits', COALESCE(c.gives_credits, c.credits_amount > 0),
          'credits_amount', c.credits_amount,
          'gives_membership', COALESCE(c.gives_membership, c.membership_id IS NOT NULL),
          'membership_all', COALESCE(c.membership_all, false),
          'membership_plan_ids', COALESCE(c.membership_plan_ids, '{}'),
          'membership_plan_names', get_plan_names(COALESCE(c.membership_plan_ids, '{}')),
          'max_redemptions', c.max_redemptions,
          'current_redemptions', c.current_redemptions,
          'expires_at', c.expires_at,
          'is_active', c.is_active,
          'created_at', c.created_at
        ) ORDER BY c.created_at DESC
      ), '[]'::json)
      FROM coupons c
    )
  );
END;
$$;


--
-- Name: get_category_ad_count(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_category_ad_count(category_name text) RETURNS integer
    LANGUAGE plpgsql
    AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INT 
    FROM ads 
    WHERE category = category_name 
    AND status = 'active'
  );
END;
$$;


--
-- Name: get_company_public_page(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_company_public_page(p_slug text) RETURNS TABLE(id uuid, slug character varying, company_name text, logo_url text, cover_url text, tagline text, description text, whatsapp character varying, website text, phone character varying, email character varying, address text, social_networks jsonb, brands_worked jsonb, gallery_images jsonb, province text, city text, is_verified boolean, profile_views integer, owner_public boolean, owner_full_name text, category_name text, ads_count bigint, created_at timestamp with time zone, anos_experiencia integer, area_cobertura character varying, superficie_maxima integer, cultivos_json jsonb, equipamiento_propio boolean, aplica_precision boolean, usa_drones boolean, factura boolean)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  -- Incrementar vistas (alias bp_upd para evitar ambigüedad con columna del RETURNS TABLE)
  UPDATE public.business_profiles AS bp_upd
    SET profile_views = bp_upd.profile_views + 1
    WHERE bp_upd.slug = p_slug
      AND bp_upd.is_active = true;

  RETURN QUERY
    SELECT
      bp.id,
      bp.slug,
      bp.company_name,
      bp.logo_url,
      bp.cover_url,
      bp.tagline,
      bp.description,
      bp.whatsapp,
      bp.website,
      bp.phone,
      bp.email,
      bp.address,
      bp.social_networks,
      bp.brands_worked,
      bp.gallery_images,
      bp.province,
      bp.city,
      bp.is_verified,
      bp.profile_views,
      bp.owner_public,
      CASE WHEN bp.owner_public THEN u.full_name::text ELSE NULL END AS owner_full_name,
      c.display_name::text AS category_name,
      (
        SELECT COUNT(*) FROM public.ads
        WHERE business_profile_id = bp.id
          AND status = 'active'
          AND approval_status = 'approved'
      ) AS ads_count,
      bp.created_at,
      -- Social Proof
      bp.anos_experiencia,
      bp.area_cobertura,
      bp.superficie_maxima,
      bp.cultivos_json,
      bp.equipamiento_propio,
      bp.aplica_precision,
      bp.usa_drones,
      bp.factura
    FROM public.business_profiles bp
    LEFT JOIN public.users u ON u.id = bp.user_id
    LEFT JOIN public.categories c ON c.id = bp.category_id
    WHERE bp.slug = p_slug
      AND bp.is_active = true;
END;
$$;


--
-- Name: get_coupon_invitations(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_coupon_invitations(p_admin_id uuid, p_coupon_id uuid) RETURNS json
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  -- Verificar que es superadmin
  IF NOT EXISTS (
    SELECT 1 FROM users 
    WHERE id = p_admin_id AND role = 'superadmin'
  ) THEN
    RETURN json_build_object('success', false, 'error', 'No autorizado');
  END IF;
  
  RETURN json_build_object(
    'success', true,
    'invitations', (
      SELECT COALESCE(json_agg(
        json_build_object(
          'id', ci.id,
          'email', ci.email,
          'token', ci.token,
          'status', ci.status,
          'sent_at', ci.sent_at,
          'used_at', ci.used_at,
          'used_by_email', u.email
        ) ORDER BY ci.sent_at DESC
      ), '[]'::json)
      FROM coupon_invitations ci
      LEFT JOIN users u ON u.id = ci.used_by
      WHERE ci.coupon_id = p_coupon_id
    )
  );
END;
$$;


--
-- Name: get_credit_transactions(uuid, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_credit_transactions(p_user_id uuid, p_limit integer DEFAULT 20) RETURNS TABLE(id uuid, type character varying, amount integer, balance_after integer, description text, created_at timestamp with time zone)
    LANGUAGE plpgsql
    AS $$
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
$$;


--
-- Name: get_dynamic_field(jsonb, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_dynamic_field(ad_data jsonb, field_name text) RETURNS text
    LANGUAGE plpgsql IMMUTABLE
    AS $$
BEGIN
  RETURN ad_data->>field_name;
END;
$$;


--
-- Name: get_environment_mode(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_environment_mode() RETURNS text
    LANGUAGE sql STABLE
    AS $$
  SELECT value FROM public.system_config WHERE key = 'environment_mode';
$$;


--
-- Name: get_featured_by_category(uuid, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_featured_by_category(p_category_id uuid, p_limit integer DEFAULT 10) RETURNS TABLE(id uuid, ad_id uuid, expires_at timestamp with time zone, ad_title character varying, ad_price numeric, ad_images json)
    LANGUAGE plpgsql
    AS $$
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
$$;


--
-- Name: get_featured_by_category(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_featured_by_category(p_category_id uuid, p_subcategory_id uuid DEFAULT NULL::uuid) RETURNS TABLE(ad_id uuid, title character varying, description text, price numeric, image_url text, location character varying, user_name character varying, expires_at timestamp with time zone)
    LANGUAGE plpgsql
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id, a.title, a.description, a.price,
    a.image_url, a.location, u.full_name, fa.expires_at
  FROM featured_ads fa
  JOIN ads a ON fa.ad_id = a.id
  JOIN users u ON a.user_id = u.id
  WHERE fa.category_id = p_category_id
    AND (p_subcategory_id IS NULL OR fa.subcategory_id = p_subcategory_id)
    AND fa.status = 'active'
    AND fa.expires_at > NOW()
  ORDER BY fa.activated_at DESC;
END;
$$;


--
-- Name: get_featured_detail(uuid, uuid, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_featured_detail(p_ad_id uuid, p_category_id uuid, p_limit integer DEFAULT 15) RETURNS TABLE(featured_id uuid, ad_id uuid, tier character varying, expires_at timestamp with time zone, title character varying, slug character varying, price numeric, images jsonb, province character varying, city character varying, subcategory_id uuid, today_count integer)
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  WITH daily_impressions AS (
    SELECT featured_ad_id, count AS imp_count
    FROM public.featured_daily_impressions
    WHERE placement = 'detail'
      AND imp_date = CURRENT_DATE
  ),
  candidates AS (
    SELECT
      fa.id                     AS featured_id,
      fa.ad_id,
      fa.tier,
      fa.expires_at,
      a.title,
      a.slug,
      a.price,
      a.images,
      a.province,
      a.city,
      fa.subcategory_id,
      COALESCE(di.imp_count, 0) AS today_count,
      -- daily_cap por tier (hardcoded fallback; leído de slot_config si disponible)
      CASE fa.tier
        WHEN 'alta'  THEN 50
        WHEN 'media' THEN 30
        ELSE              15
      END AS tier_cap,
      -- tier_rank para priorizar por visibilidad
      CASE fa.tier
        WHEN 'alta'  THEN 1
        WHEN 'media' THEN 2
        ELSE              3
      END AS tier_rank
    FROM public.featured_ads fa
    JOIN public.ads a ON a.id = fa.ad_id
    LEFT JOIN daily_impressions di ON di.featured_ad_id = fa.id
    WHERE fa.status = 'active'
      AND fa.category_id = p_category_id
      AND fa.ad_id != p_ad_id
      AND fa.expires_at > NOW()
      AND a.status = 'active'
  )
  SELECT
    featured_id, ad_id, tier, expires_at,
    title, slug, price, images, province, city,
    subcategory_id, today_count
  FROM candidates
  ORDER BY
    -- 1: bajo cap (0) antes que sobre cap (1)
    CASE WHEN today_count < tier_cap THEN 0 ELSE 1 END ASC,
    -- 2: prioridad por tier
    tier_rank ASC,
    -- 3: random para variedad
    RANDOM()
  LIMIT p_limit;
$$;


--
-- Name: get_featured_for_detail(uuid, uuid, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_featured_for_detail(p_category_id uuid, p_current_ad_id uuid, p_limit integer DEFAULT 6) RETURNS TABLE(ad_id uuid, user_id uuid, featured_id uuid, priority integer, is_manual boolean)
    LANGUAGE plpgsql STABLE
    AS $$
BEGIN
  RETURN QUERY
  WITH user_featured AS (
    SELECT DISTINCT ON (fa.user_id)
      fa.ad_id,
      fa.user_id,
      fa.id as featured_id,
      1 as priority,
      fa.is_manual
    FROM featured_ads fa
    WHERE fa.placement = 'detail'
      AND fa.category_id = p_category_id
      AND fa.ad_id != p_current_ad_id  -- Excluir aviso actual
      AND fa.status = 'active'
      AND fa.is_manual = false
      AND (fa.expires_at IS NULL OR fa.expires_at > NOW())
    ORDER BY fa.user_id, fa.created_at ASC
  ),
  superadmin_featured AS (
    SELECT 
      fa.ad_id,
      fa.user_id,
      fa.id as featured_id,
      2 as priority,
      fa.is_manual
    FROM featured_ads fa
    WHERE fa.placement = 'detail'
      AND fa.category_id = p_category_id
      AND fa.ad_id != p_current_ad_id
      AND fa.status = 'active'
      AND fa.is_manual = true
      AND (fa.expires_at IS NULL OR fa.expires_at > NOW())
    ORDER BY fa.created_at ASC
  ),
  combined AS (
    SELECT * FROM user_featured
    UNION ALL
    SELECT * FROM superadmin_featured
  )
  SELECT 
    c.ad_id,
    c.user_id,
    c.featured_id,
    c.priority,
    c.is_manual
  FROM combined c
  ORDER BY c.priority ASC, c.featured_id ASC
  LIMIT p_limit;
END;
$$;


--
-- Name: get_featured_for_homepage(uuid, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_featured_for_homepage(p_category_id uuid, p_limit integer DEFAULT 10) RETURNS TABLE(ad_id uuid, user_id uuid, featured_id uuid, priority integer, is_manual boolean)
    LANGUAGE plpgsql STABLE
    AS $$
BEGIN
  RETURN QUERY
  WITH user_featured AS (
    -- 1. Usuarios que pagaron (1 por usuario, FIFO)
    SELECT DISTINCT ON (fa.user_id)
      fa.ad_id,
      fa.user_id,
      fa.id as featured_id,
      1 as priority,  -- Prioridad alta
      fa.is_manual
    FROM featured_ads fa
    WHERE fa.placement = 'homepage'
      AND fa.category_id = p_category_id
      AND fa.status = 'active'
      AND fa.is_manual = false
      AND (fa.expires_at IS NULL OR fa.expires_at > NOW())  -- Defensivo: filtrar expirados
    ORDER BY fa.user_id, fa.created_at ASC  -- FIFO por usuario
  ),
  superadmin_featured AS (
    -- 2. Superadmin manual (ilimitado para rellenar)
    SELECT 
      fa.ad_id,
      fa.user_id,
      fa.id as featured_id,
      2 as priority,  -- Prioridad baja
      fa.is_manual
    FROM featured_ads fa
    WHERE fa.placement = 'homepage'
      AND fa.category_id = p_category_id
      AND fa.status = 'active'
      AND fa.is_manual = true
      AND (fa.expires_at IS NULL OR fa.expires_at > NOW())  -- Defensivo: filtrar expirados
    ORDER BY fa.created_at ASC  -- FIFO
  ),
  combined AS (
    -- Combinar ambos con prioridad
    SELECT * FROM user_featured
    UNION ALL
    SELECT * FROM superadmin_featured
  )
  SELECT 
    c.ad_id,
    c.user_id,
    c.featured_id,
    c.priority,
    c.is_manual
  FROM combined c
  ORDER BY c.priority ASC, c.featured_id ASC  -- Users primero, luego superadmin
  LIMIT p_limit;
END;
$$;


--
-- Name: get_featured_for_results(uuid, integer, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_featured_for_results(p_category_id uuid, p_limit integer DEFAULT 4, p_offset integer DEFAULT 0) RETURNS TABLE(ad_id uuid, user_id uuid, featured_id uuid, priority integer, is_manual boolean)
    LANGUAGE plpgsql STABLE
    AS $$
BEGIN
  RETURN QUERY
  WITH user_featured AS (
    SELECT DISTINCT ON (fa.user_id)
      fa.ad_id,
      fa.user_id,
      fa.id as featured_id,
      1 as priority,
      fa.is_manual
    FROM featured_ads fa
    WHERE fa.placement = 'results'
      AND fa.category_id = p_category_id
      AND fa.status = 'active'
      AND fa.is_manual = false
      AND (fa.expires_at IS NULL OR fa.expires_at > NOW())
    ORDER BY fa.user_id, fa.created_at ASC
  ),
  superadmin_featured AS (
    SELECT 
      fa.ad_id,
      fa.user_id,
      fa.id as featured_id,
      2 as priority,
      fa.is_manual
    FROM featured_ads fa
    WHERE fa.placement = 'results'
      AND fa.category_id = p_category_id
      AND fa.status = 'active'
      AND fa.is_manual = true
      AND (fa.expires_at IS NULL OR fa.expires_at > NOW())
    ORDER BY fa.created_at ASC
  ),
  combined AS (
    SELECT * FROM user_featured
    UNION ALL
    SELECT * FROM superadmin_featured
  )
  SELECT 
    c.ad_id,
    c.user_id,
    c.featured_id,
    c.priority,
    c.is_manual
  FROM combined c
  ORDER BY c.priority ASC, c.featured_id ASC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;


--
-- Name: get_featured_homepage(uuid, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_featured_homepage(p_category_id uuid, p_limit integer DEFAULT 20) RETURNS TABLE(featured_id uuid, ad_id uuid, tier character varying, actual_start timestamp with time zone, expires_at timestamp with time zone, title character varying, slug character varying, price numeric, images jsonb, province character varying, city character varying, subcategory_id uuid, user_id uuid)
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT
    fa.id          AS featured_id,
    fa.ad_id,
    fa.tier,
    fa.actual_start,
    fa.expires_at,
    a.title,
    a.slug,
    a.price,
    a.images,
    a.province,
    a.city,
    fa.subcategory_id,
    fa.user_id
  FROM public.featured_ads fa
  JOIN public.ads a ON a.id = fa.ad_id
  WHERE fa.status = 'active'
    AND fa.tier IN ('alta', 'media')
    AND fa.category_id = p_category_id
    AND fa.expires_at > NOW()
    AND a.status = 'active'
  ORDER BY fa.actual_start ASC  -- FIFO: el más antiguo primero
  LIMIT p_limit;
$$;


--
-- Name: get_featured_month_availability(character varying, uuid, integer, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_featured_month_availability(p_placement character varying, p_category_id uuid, p_year integer, p_month integer) RETURNS TABLE(day integer, is_available boolean, slots_total integer, slots_used integer, slots_available integer)
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_max_slots INT;
  v_start_date DATE;
  v_end_date DATE;
BEGIN
  SELECT (value #>> '{}')::INT INTO v_max_slots
  FROM global_settings
  WHERE key = 'featured_slots_' || p_placement;

  IF v_max_slots IS NULL THEN
    v_max_slots := 10;
  END IF;

  v_start_date := make_date(p_year, p_month, 1);
  v_end_date := (make_date(p_year, p_month, 1) + INTERVAL '1 month - 1 day')::DATE;

  RETURN QUERY
  WITH days AS (
    SELECT generate_series(v_start_date, v_end_date, INTERVAL '1 day')::DATE AS day_date
  )
  SELECT
    EXTRACT(DAY FROM d.day_date)::INT AS day,
    (COUNT(DISTINCT fa.user_id) < v_max_slots) AS is_available,
    v_max_slots AS slots_total,
    COUNT(DISTINCT fa.user_id) AS slots_used,
    (v_max_slots - COUNT(DISTINCT fa.user_id)) AS slots_available
  FROM days d
  LEFT JOIN featured_ads fa
    ON fa.placement = p_placement
    AND fa.category_id = p_category_id
    AND fa.status IN ('active', 'pending')
    AND (
      fa.scheduled_start <= d.day_date
      AND COALESCE(fa.expires_at::DATE, fa.scheduled_start + fa.duration_days) > d.day_date
    )
  GROUP BY d.day_date
  ORDER BY d.day_date;
END;
$$;


--
-- Name: get_featured_results(uuid, uuid, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_featured_results(p_subcategory_id uuid, p_category_id uuid, p_limit integer DEFAULT 18) RETURNS TABLE(featured_id uuid, ad_id uuid, tier character varying, actual_start timestamp with time zone, expires_at timestamp with time zone, title character varying, slug character varying, price numeric, images jsonb, province character varying, city character varying, subcategory_id uuid, match_type text)
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  WITH exact_match AS (
    SELECT
      fa.id          AS featured_id,
      fa.ad_id,
      fa.tier,
      fa.actual_start,
      fa.expires_at,
      a.title,
      a.slug,
      a.price,
      a.images,
      a.province,
      a.city,
      fa.subcategory_id,
      'exact'::text AS match_type
    FROM public.featured_ads fa
    JOIN public.ads a ON a.id = fa.ad_id
    WHERE fa.status = 'active'
      AND fa.tier IN ('alta', 'media')
      AND fa.subcategory_id = p_subcategory_id
      AND fa.expires_at > NOW()
      AND a.status = 'active'
    ORDER BY fa.actual_start ASC
    LIMIT p_limit
  ),
  sibling_fill AS (
    SELECT
      fa.id          AS featured_id,
      fa.ad_id,
      fa.tier,
      fa.actual_start,
      fa.expires_at,
      a.title,
      a.slug,
      a.price,
      a.images,
      a.province,
      a.city,
      fa.subcategory_id,
      'sibling'::text AS match_type
    FROM public.featured_ads fa
    JOIN public.ads a ON a.id = fa.ad_id
    WHERE fa.status = 'active'
      AND fa.tier IN ('alta', 'media')
      AND fa.category_id = p_category_id
      AND (fa.subcategory_id != p_subcategory_id OR fa.subcategory_id IS NULL)
      AND fa.expires_at > NOW()
      AND a.status = 'active'
      AND NOT EXISTS (SELECT 1 FROM exact_match em WHERE em.featured_id = fa.id)
    ORDER BY fa.actual_start ASC
    LIMIT p_limit
  )
  SELECT * FROM exact_match
  UNION ALL
  SELECT * FROM sibling_fill
  LIMIT p_limit;
$$;


--
-- Name: get_featured_slot_availability(uuid, character varying); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_featured_slot_availability(p_ad_id uuid, p_tier character varying) RETURNS json
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_ad             RECORD;
  v_max_slots      INTEGER := 20;
  v_active_count   INTEGER := 0;
  v_existing       INTEGER := 0;
  v_next_expiry    TIMESTAMPTZ;
  v_days_until     INTEGER;
  v_available_now  BOOLEAN;
  v_can_purchase   BOOLEAN;
BEGIN
  -- Validar tier
  IF p_tier NOT IN ('alta', 'media', 'baja') THEN
    RETURN json_build_object('error', 'Tier inválido. Usar: alta, media, baja');
  END IF;

  -- Obtener datos del aviso
  SELECT category_id, user_id INTO v_ad
  FROM public.ads
  WHERE id = p_ad_id AND status = 'active';

  IF v_ad IS NULL THEN
    RETURN json_build_object('error', 'Aviso no encontrado o no activo');
  END IF;

  -- Períodos existentes para este aviso
  SELECT COUNT(*) INTO v_existing
  FROM public.featured_ads
  WHERE ad_id = p_ad_id
    AND status IN ('active', 'pending');

  v_can_purchase := (v_existing < 2);

  -- Contar activos en la categoría para homepage (aplica a alta y media)
  IF p_tier IN ('alta', 'media') THEN
    SELECT COUNT(*) INTO v_active_count
    FROM public.featured_ads
    WHERE category_id = v_ad.category_id
      AND tier IN ('alta', 'media')
      AND status = 'active';

    -- Leer max_slots desde global_config
    BEGIN
      SELECT (value::json -> 'homepage' ->> 'max_active_per_category')::integer
      INTO v_max_slots
      FROM public.global_config
      WHERE key = 'slot_config';
    EXCEPTION WHEN OTHERS THEN
      v_max_slots := 20; -- fallback
    END;

    v_available_now := (v_active_count < v_max_slots);

    IF NOT v_available_now THEN
      -- Estimar cuándo se libera el próximo slot
      SELECT MIN(expires_at) INTO v_next_expiry
      FROM public.featured_ads
      WHERE category_id = v_ad.category_id
        AND tier IN ('alta', 'media')
        AND status = 'active';

      v_days_until := GREATEST(1, CEIL(EXTRACT(EPOCH FROM (v_next_expiry - NOW())) / 86400))::INTEGER;
    END IF;
  ELSE
    -- baja → detail no tiene cap de slots globales
    v_available_now := true;
    v_active_count  := 0;
    v_max_slots     := 0; -- no aplica
  END IF;

  RETURN json_build_object(
    'available_now',        v_available_now,
    'active_count',         v_active_count,
    'max_slots',            v_max_slots,
    'next_available_days',  v_days_until,
    'existing_periods',     v_existing,
    'can_purchase',         v_can_purchase
  );
END;
$$;


--
-- Name: get_form_for_context(uuid, uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_form_for_context(p_category_id uuid DEFAULT NULL::uuid, p_subcategory_id uuid DEFAULT NULL::uuid, p_category_type_id uuid DEFAULT NULL::uuid) RETURNS TABLE(form_id uuid, form_name text, form_display_name text, sections jsonb, fields jsonb)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_template_id uuid;
BEGIN
  SELECT t.id INTO v_template_id
  FROM public.form_templates_v2 t
  WHERE t.is_active = true
    AND (
      (p_subcategory_id IS NOT NULL AND t.subcategory_id = p_subcategory_id)
      OR
      (p_subcategory_id IS NULL AND t.subcategory_id IS NULL
       AND p_category_id IS NOT NULL AND t.category_id = p_category_id)
    )
  ORDER BY
    CASE WHEN p_subcategory_id IS NOT NULL AND t.subcategory_id = p_subcategory_id THEN 0 ELSE 1 END,
    t.priority DESC
  LIMIT 1;

  IF v_template_id IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    t.id,
    t.name,
    t.display_name,
    t.sections,
    COALESCE(
      (SELECT jsonb_agg(
          jsonb_build_object(
            'id', f.id,
            'form_template_id', f.form_template_id,
            'field_name', f.field_name,
            'field_label', f.field_label,
            'section_id', f.section_id,
            'field_type', f.field_type,
            'field_width', f.field_width,
            'data_source', f.data_source,
            'data_source_config', f.data_source_config,
            'is_required', f.is_required,
            'validation_rules', f.validation_rules,
            'placeholder', f.placeholder,
            'help_text', f.help_text,
            'icon', f.icon,
            'display_order', f.display_order,
            'metadata', f.metadata,
            'options', f.options,
            'option_list_id', f.option_list_id,
            'created_at', f.created_at
          ) ORDER BY f.display_order)
       FROM public.form_fields_v2 f
       WHERE f.form_template_id = v_template_id),
      '[]'::jsonb
    )
  FROM public.form_templates_v2 t
  WHERE t.id = v_template_id;
END;
$$;


--
-- Name: get_form_template(uuid, uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_form_template(p_category_id uuid, p_subcategory_id uuid DEFAULT NULL::uuid, p_operation_type_id uuid DEFAULT NULL::uuid) RETURNS TABLE(template_id uuid, template_name character varying, template_display_name character varying, fields jsonb)
    LANGUAGE plpgsql
    AS $$
BEGIN
  RETURN QUERY
  WITH selected_template AS (
    SELECT 
      ft.id,
      ft.name,
      ft.display_name,
      ft.priority
    FROM form_templates ft
    WHERE ft.is_active = true
      AND (
        (ft.category_id = p_category_id 
         AND ft.subcategory_id = p_subcategory_id 
         AND ft.operation_type_id = p_operation_type_id
         AND p_subcategory_id IS NOT NULL 
         AND p_operation_type_id IS NOT NULL)
        OR
        (ft.category_id = p_category_id 
         AND ft.subcategory_id = p_subcategory_id 
         AND ft.operation_type_id IS NULL
         AND p_subcategory_id IS NOT NULL)
        OR
        (ft.category_id = p_category_id 
         AND ft.subcategory_id IS NULL 
         AND ft.operation_type_id IS NULL)
        OR
        ft.is_default = true
      )
    ORDER BY ft.priority DESC, ft.created_at DESC
    LIMIT 1
  )
  SELECT 
    st.id,
    st.name,
    st.display_name,
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', ff.id,
          'fieldName', ff.field_name,
          'fieldLabel', ff.field_label,
          'fieldType', ff.field_type,
          'placeholder', ff.placeholder,
          'helpText', ff.help_text,
          'sectionName', ff.section_name,
          'isRequired', ff.is_required,
          'minValue', ff.min_value,
          'maxValue', ff.max_value,
          'minLength', ff.min_length,
          'maxLength', ff.max_length,
          'pattern', ff.pattern,
          'options', ff.options,
          'dependsOn', ff.depends_on,
          'showWhen', ff.show_when,
          'displayOrder', ff.display_order,
          'fieldWidth', ff.field_width
        )
        ORDER BY ff.display_order, ff.field_name
      )
      FROM form_fields ff
      WHERE ff.form_template_id = st.id
        AND ff.is_active = true
    ) as fields
  FROM selected_template st;
END;
$$;


--
-- Name: get_full_category_name(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_full_category_name(ad_id uuid) RETURNS text
    LANGUAGE plpgsql STABLE
    AS $$
DECLARE
  result TEXT;
BEGIN
  SELECT 
    ot.display_name || ' > ' || c.display_name || ' > ' || sc.display_name
  INTO result
  FROM ads a
  LEFT JOIN operation_types ot ON a.operation_type_id = ot.id
  LEFT JOIN categories c ON a.category_id = c.id
  LEFT JOIN subcategories sc ON a.subcategory_id = sc.id
  WHERE a.id = ad_id;
  
  RETURN COALESCE(result, 'Sin categoría');
END;
$$;


--
-- Name: get_homepage_banners(text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_homepage_banners(p_type text, p_category text DEFAULT NULL::text) RETURNS TABLE(id uuid, title text, image_url text, link_url text, category text)
    LANGUAGE plpgsql
    AS $$
BEGIN
  RETURN QUERY
  SELECT b.id, b.title, b.image_url, b.link_url, b.category
  FROM banners b
  WHERE b.type = p_type
    AND b.is_active = true
    AND (p_category IS NULL OR b.category = p_category OR b.category IS NULL)
  ORDER BY b.display_order, b.created_at DESC
  LIMIT 6;
END;
$$;


--
-- Name: get_lateral_banners(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_lateral_banners(p_category text DEFAULT NULL::text) RETURNS TABLE(id uuid, title text, image_url text, link_url text, "position" text)
    LANGUAGE plpgsql
    AS $$
BEGIN
  RETURN QUERY
  SELECT b.id, b.title, b.image_url, b.link_url, b."position"
  FROM banners b
  WHERE b.type = 'results_lateral'
    AND b.is_active = true
    AND (p_category IS NULL OR b.category = p_category OR b.category IS NULL)
  ORDER BY b."position", b.display_order
  LIMIT 4;
END;
$$;


--
-- Name: get_models_by_brand(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_models_by_brand(brand_slug text) RETURNS TABLE(id uuid, name text, display_name text, year_from integer, year_to integer, short_description text, main_image_url text, price_range jsonb)
    LANGUAGE plpgsql
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id,
    m.name,
    m.display_name,
    m.year_from,
    m.year_to,
    m.short_description,
    m.main_image_url,
    m.price_range
  FROM models m
  JOIN brands b ON m.brand_id = b.id
  WHERE b.slug = brand_slug
    AND m.is_active = true
  ORDER BY m.display_name;
END;
$$;


--
-- Name: get_my_companies(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_my_companies(p_user_id uuid DEFAULT NULL::uuid) RETURNS TABLE(id uuid, slug character varying, company_name text, logo_url text, cover_url text, tagline text, description text, is_verified boolean, is_active boolean, profile_views integer, show_on_ad_detail boolean, owner_public boolean, role character varying, ads_count bigint, province text, city text)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_user_id uuid;
BEGIN
  v_user_id := COALESCE(p_user_id, auth.uid());

  RETURN QUERY
    SELECT
      bp.id,
      bp.slug,
      bp.company_name,
      bp.logo_url,
      bp.cover_url,
      bp.tagline,
      bp.description,
      bp.is_verified,
      bp.is_active,
      bp.profile_views,
      bp.show_on_ad_detail,
      bp.owner_public,
      bpm.role,
      (
        SELECT COUNT(*) FROM public.ads
        WHERE business_profile_id = bp.id
          AND status = 'active'
      ) AS ads_count,
      bp.province,
      bp.city
    FROM public.business_profiles bp
    JOIN public.business_profile_members bpm
      ON bpm.business_profile_id = bp.id
      AND bpm.user_id = v_user_id
    ORDER BY bp.created_at DESC;
END;
$$;


--
-- Name: get_my_role(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_my_role() RETURNS text
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    AS $$
DECLARE
  user_role TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NULL;
  END IF;
  
  SELECT role INTO user_role 
  FROM public.users 
  WHERE id = auth.uid();
  
  RETURN user_role;
END;
$$;


--
-- Name: get_online_users_random(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_online_users_random() RETURNS integer
    LANGUAGE plpgsql
    AS $$
DECLARE
  base INT;
  variation_factor DECIMAL;
  hour_slot INT;
  result INT;
BEGIN
  -- Obtener base_value de la stat "Online"
  SELECT base_value INTO base FROM cms_stats WHERE label = 'Online' LIMIT 1;
  
  IF base IS NULL THEN
    base := 15; -- Default
  END IF;

  -- Slot de 3 horas (0-7 = 8 slots en un día)
  hour_slot := (EXTRACT(HOUR FROM NOW())::INT / 3);

  -- Variación según slot (patron: -30%, +10%, +80%, +40%, repetir)
  CASE (hour_slot % 4)
    WHEN 0 THEN variation_factor := 0.70;  -- -30%
    WHEN 1 THEN variation_factor := 1.10;  -- +10%
    WHEN 2 THEN variation_factor := 1.80;  -- +80%
    WHEN 3 THEN variation_factor := 1.40;  -- +40%
    ELSE variation_factor := 1.0;
  END CASE;

  result := ROUND(base * variation_factor)::INT;
  
  RETURN GREATEST(result, 1); -- Mínimo 1
END;
$$;


--
-- Name: get_or_create_chat_channel(uuid, uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_or_create_chat_channel(p_ad_id uuid, p_buyer_id uuid, p_seller_id uuid) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_channel  public.chat_channels%ROWTYPE;
  v_role     text;
  v_count    int;
BEGIN
  -- Guard: no self-contact
  IF p_buyer_id = p_seller_id THEN
    RAISE EXCEPTION 'SELF_CONTACT: No podés contactarte a vos mismo';
  END IF;

  -- Verificar si ya existe el canal
  SELECT * INTO v_channel
  FROM public.chat_channels
  WHERE ad_id = p_ad_id AND buyer_id = p_buyer_id;

  IF FOUND THEN
    RETURN jsonb_build_object('channel', row_to_json(v_channel), 'is_new', false);
  END IF;

  -- Verificar plan del buyer
  SELECT role INTO v_role FROM public.users WHERE id = p_buyer_id;

  IF v_role = 'free' THEN
    SELECT COUNT(*) INTO v_count
    FROM public.chat_channels
    WHERE buyer_id = p_buyer_id AND status = 'active';

    IF v_count >= 3 THEN
      RAISE EXCEPTION 'PLAN_LIMIT_REACHED: Límite de 3 conversaciones para usuarios Free';
    END IF;
  END IF;

  -- Crear canal
  INSERT INTO public.chat_channels (ad_id, buyer_id, seller_id)
  VALUES (p_ad_id, p_buyer_id, p_seller_id)
  RETURNING * INTO v_channel;

  RETURN jsonb_build_object('channel', row_to_json(v_channel), 'is_new', true);
END;
$$;


--
-- Name: get_plan_names(uuid[]); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_plan_names(plan_ids uuid[]) RETURNS text[]
    LANGUAGE plpgsql
    AS $$
BEGIN
  RETURN ARRAY(
    SELECT name FROM membership_plans 
    WHERE id = ANY(plan_ids)
    ORDER BY price
  );
END;
$$;


--
-- Name: get_random_intercalated_banner(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_random_intercalated_banner(p_category text DEFAULT NULL::text) RETURNS TABLE(id uuid, title text, image_url text, link_url text)
    LANGUAGE plpgsql
    AS $$
BEGIN
  RETURN QUERY
  SELECT b.id, b.title, b.image_url, b.link_url
  FROM banners b
  WHERE b.type = 'results_intercalated'
    AND b.is_active = true
    AND (p_category IS NULL OR b.category = p_category OR b.category IS NULL)
  ORDER BY RANDOM()
  LIMIT 1;
END;
$$;


--
-- Name: get_sent_contacts_count(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_sent_contacts_count() RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  sent_count INTEGER;
BEGIN
  -- Si el usuario no está autenticado, retornar 0
  IF auth.uid() IS NULL THEN
    RETURN 0;
  END IF;
  
  SELECT COUNT(*)::INTEGER INTO sent_count
  FROM contact_messages
  WHERE sender_user_id = auth.uid();
  
  RETURN sent_count;
END;
$$;


--
-- Name: get_setting(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_setting(key text) RETURNS text
    LANGUAGE sql SECURITY DEFINER
    AS $$
  SELECT setting_value FROM site_settings WHERE setting_key = key LIMIT 1;
$$;


--
-- Name: get_setting(character varying); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_setting(setting_key character varying) RETURNS jsonb
    LANGUAGE sql STABLE
    AS $$
  SELECT value FROM global_settings WHERE key = setting_key;
$$;


--
-- Name: get_setting_bool(character varying); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_setting_bool(setting_key character varying) RETURNS boolean
    LANGUAGE sql STABLE
    AS $$
  SELECT (value #>> '{}')::BOOLEAN FROM global_settings WHERE key = setting_key;
$$;


--
-- Name: get_setting_int(character varying); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_setting_int(setting_key character varying) RETURNS integer
    LANGUAGE sql STABLE
    AS $$
  SELECT (value #>> '{}')::INTEGER FROM global_settings WHERE key = setting_key;
$$;


--
-- Name: get_settings_by_section(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_settings_by_section(sec text) RETURNS TABLE(key text, value text, type text, description text)
    LANGUAGE sql SECURITY DEFINER
    AS $$
  SELECT setting_key, setting_value, setting_type, description
  FROM site_settings
  WHERE section = sec
  ORDER BY setting_key;
$$;


--
-- Name: get_unread_messages_count(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_unread_messages_count() RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  unread_count INTEGER;
BEGIN
  SELECT COUNT(*)::INTEGER INTO unread_count
  FROM contact_messages
  WHERE ad_owner_id = auth.uid() AND is_read = false;
  
  RETURN unread_count;
END;
$$;


--
-- Name: get_user_chat_unread_count(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_user_chat_unread_count() RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_uid   uuid := auth.uid();
  v_total int;
BEGIN
  SELECT COALESCE(
    SUM(
      CASE
        WHEN buyer_id  = v_uid THEN buyer_unread
        WHEN seller_id = v_uid THEN seller_unread
        ELSE 0
      END
    ), 0
  )
  INTO v_total
  FROM public.chat_channels
  WHERE v_uid IN (buyer_id, seller_id)
    AND status = 'active';

  RETURN v_total;
END;
$$;


--
-- Name: get_user_contact_limits(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_user_contact_limits(user_uuid uuid) RETURNS TABLE(max_received integer, max_sent integer, current_received bigint, current_sent bigint, can_receive_more boolean, can_send_more boolean, plan_name text)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  plan_record RECORD;
  custom_limit INTEGER;
BEGIN
  -- Obtener plan del usuario y límites custom
  SELECT 
    sp.id,
    sp.name,
    sp.max_contacts_received,
    sp.max_contacts_sent,
    COALESCE(u.custom_max_contacts, NULL::INTEGER) as custom_max_contacts
  INTO plan_record
  FROM users u
  LEFT JOIN subscription_plans sp ON u.subscription_plan_id = sp.id
  WHERE u.id = user_uuid;
  
  -- Si el usuario no existe o no tiene plan asignado, usar plan FREE por defecto
  IF plan_record.id IS NULL OR plan_record.name IS NULL THEN
    SELECT 
      id,
      name,
      max_contacts_received,
      max_contacts_sent,
      NULL::INTEGER as custom_max_contacts
    INTO plan_record
    FROM subscription_plans
    WHERE name = 'free'
    LIMIT 1;
  END IF;
  
  -- Contar contactos recibidos activos
  SELECT COUNT(*) INTO current_received
  FROM contact_messages
  WHERE ad_owner_id = user_uuid
    AND status = 'active';
  
  -- Contar contactos enviados activos
  SELECT COUNT(*) INTO current_sent
  FROM contact_messages
  WHERE sender_user_id = user_uuid
    AND status = 'active';
  
  -- Aplicar límite custom si existe
  custom_limit := COALESCE(plan_record.custom_max_contacts, plan_record.max_contacts_sent);
  
  RETURN QUERY SELECT
    plan_record.max_contacts_received,
    COALESCE(custom_limit, 999999) AS max_sent,
    current_received,
    current_sent,
    (plan_record.max_contacts_received IS NULL OR current_received < plan_record.max_contacts_received) AS can_receive,
    (custom_limit IS NULL OR current_sent < custom_limit) AS can_send,
    COALESCE(plan_record.name, 'FREE')::TEXT;
END;
$$;


--
-- Name: get_user_featured_ads(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_user_featured_ads(p_user_id uuid) RETURNS TABLE(id uuid, ad_id uuid, status character varying, activated_at timestamp with time zone, expires_at timestamp with time zone, credits_spent integer, ad_title character varying)
    LANGUAGE plpgsql
    AS $$
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
$$;


--
-- Name: grant_monthly_credits(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.grant_monthly_credits() RETURNS json
    LANGUAGE plpgsql
    AS $$
BEGIN
  RETURN json_build_object(
    'success', false,
    'error', 'Función obsoleta — sistema migrado a user_wallets'
  );
END;
$$;


--
-- Name: grant_signup_promo(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.grant_signup_promo(p_user_id uuid) RETURNS json
    LANGUAGE plpgsql
    AS $$
BEGIN
  RETURN json_build_object(
    'success', false,
    'error', 'Función obsoleta — sistema migrado a user_wallets'
  );
END;
$$;


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$;


--
-- Name: increment_ad_view(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.increment_ad_view(p_ad_id uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  UPDATE public.ads
  SET views = views + 1
  WHERE id = p_ad_id
    AND status = 'active';
END;
$$;


--
-- Name: increment_banner_click(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.increment_banner_click(banner_id uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  UPDATE banners_clean
  SET clicks = COALESCE(clicks, 0) + 1
  WHERE id = banner_id;
END;
$$;


--
-- Name: increment_banner_impression(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.increment_banner_impression(banner_id uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  UPDATE banners_clean 
  SET impressions = COALESCE(impressions, 0) + 1
  WHERE id = banner_id;
END;
$$;


--
-- Name: increment_profile_view(uuid, uuid, character varying, character varying, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.increment_profile_view(p_profile_user_id uuid, p_visitor_user_id uuid DEFAULT NULL::uuid, p_visitor_ip character varying DEFAULT NULL::character varying, p_source_type character varying DEFAULT 'direct'::character varying, p_source_ad_id uuid DEFAULT NULL::uuid) RETURNS boolean
    LANGUAGE plpgsql
    AS $$
DECLARE
  last_view_time TIMESTAMPTZ;
BEGIN
  -- Verificar si hay una vista reciente (últimos 30 min) del mismo visitante
  SELECT MAX(created_at) INTO last_view_time
  FROM profile_views
  WHERE profile_user_id = p_profile_user_id
    AND (
      (p_visitor_user_id IS NOT NULL AND visitor_user_id = p_visitor_user_id)
      OR (p_visitor_ip IS NOT NULL AND visitor_ip = p_visitor_ip)
    )
    AND created_at > NOW() - INTERVAL '30 minutes';

  -- Si no hay vista reciente, registrar nueva
  IF last_view_time IS NULL THEN
    INSERT INTO profile_views (
      profile_user_id, visitor_user_id, visitor_ip, source_type, source_ad_id
    ) VALUES (
      p_profile_user_id, p_visitor_user_id, p_visitor_ip, p_source_type, p_source_ad_id
    );
    
    -- Actualizar contador en users
    UPDATE users SET profile_views = profile_views + 1 WHERE id = p_profile_user_id;
    
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$;


--
-- Name: is_admin(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_admin() RETURNS boolean
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    AS $$
BEGIN
  RETURN public.get_my_role() IN ('superadmin', 'revendedor');
END;
$$;


--
-- Name: is_admin_or_super(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_admin_or_super() RETURNS boolean
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    AS $$
BEGIN
  RETURN public.get_my_role() IN ('superadmin', 'admin', 'adminscrap');
END;
$$;


--
-- Name: is_admin_role(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_admin_role() RETURNS boolean
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    AS $$
DECLARE
  user_role TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;
  
  SELECT role INTO user_role 
  FROM public.users 
  WHERE id = auth.uid();
  
  -- Solo SuperAdmin y Admin (Revendedores) tienen acceso administrativo
  RETURN user_role IN ('superadmin', 'admin');
END;
$$;


--
-- Name: is_super_admin(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_super_admin() RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.users 
    WHERE id = auth.uid() 
    AND role = 'super-admin'
  );
END;
$$;


--
-- Name: is_superadmin(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_superadmin() RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role IN ('superadmin', 'admin')
  );
END;
$$;


--
-- Name: is_superadmin_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_superadmin_user() RETURNS boolean
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role IN ('superadmin', 'super-admin')
  );
END;
$$;


--
-- Name: log_moderation_action(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.log_moderation_action() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
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
$$;


--
-- Name: mark_channel_read(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.mark_channel_read(p_channel_id uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  -- Marcar mensajes individuales como leídos
  UPDATE public.chat_messages
  SET is_read = true
  WHERE channel_id = p_channel_id
    AND sender_id <> v_uid
    AND is_read = false;

  -- Reset contador en el canal
  UPDATE public.chat_channels
  SET
    buyer_unread  = CASE WHEN buyer_id  = v_uid THEN 0 ELSE buyer_unread  END,
    seller_unread = CASE WHEN seller_id = v_uid THEN 0 ELSE seller_unread END
  WHERE id = p_channel_id;
END;
$$;


--
-- Name: mark_message_as_read(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.mark_message_as_read(message_id uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  UPDATE contact_messages
  SET is_read = true, read_at = now()
  WHERE id = message_id AND ad_owner_id = auth.uid();
END;
$$;


--
-- Name: mark_notifications_read(uuid, uuid[]); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.mark_notifications_read(p_user_id uuid, p_ids uuid[] DEFAULT NULL::uuid[]) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF p_ids IS NULL THEN
    -- Marcar todas
    UPDATE public.notifications
    SET is_read = true, read_at = now()
    WHERE user_id = p_user_id AND is_read = false;
  ELSE
    -- Marcar las específicas
    UPDATE public.notifications
    SET is_read = true, read_at = now()
    WHERE user_id = p_user_id AND id = ANY(p_ids) AND is_read = false;
  END IF;
END;
$$;


--
-- Name: mask_sensitive_chat_content(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.mask_sensitive_chat_content() RETURNS trigger
    LANGUAGE plpgsql
    AS $_$
DECLARE
  v_original text := NEW.message;
  v_masked   text := NEW.message;
BEGIN
  -- Emails
  v_masked := regexp_replace(
    v_masked,
    '[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}',
    '[dato de contacto ocultado]',
    'g'
  );

  -- Teléfonos Argentina/Latam: +54, 0011, 011, 15 + 8 dígitos
  v_masked := regexp_replace(
    v_masked,
    '(\+?54[\s\-\.]?)?(\(?\d{2,4}\)?)[\s\-\.]?\d{4}[\s\-\.]?\d{4}',
    '[dato de contacto ocultado]',
    'g'
  );

  -- URLs (http / https)
  v_masked := regexp_replace(
    v_masked,
    'https?://[^\s]+',
    '[enlace externo ocultado]',
    'gi'
  );

  -- Plataformas externas (palabra completa, case-insensitive)
  v_masked := regexp_replace(
    v_masked,
    '(^|[^a-zA-Z])(whatsapp|wsp|telegram|instagram|facebook|mercadolibre|mercadopago|tiktok|signal|viber)([^a-zA-Z]|$)',
    '\1[plataforma externa]\3',
    'gi'
  );

  IF v_masked <> v_original THEN
    NEW.message    := v_masked;
    NEW.was_masked := true;
  END IF;

  RETURN NEW;
END;
$_$;


--
-- Name: notify_chat_message_received(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.notify_chat_message_received() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_channel     public.chat_channels%ROWTYPE;
  v_recipient   uuid;
  v_unread_prev int;
  v_ad_title    text;
  v_sender_name text;
BEGIN
  SELECT * INTO v_channel
  FROM public.chat_channels
  WHERE id = NEW.channel_id;

  -- Determinar receptor y su contador de no-leídos previo
  IF NEW.sender_id = v_channel.buyer_id THEN
    v_recipient   := v_channel.seller_id;
    v_unread_prev := v_channel.seller_unread;
  ELSE
    v_recipient   := v_channel.buyer_id;
    v_unread_prev := v_channel.buyer_unread;
  END IF;

  -- Solo notificar en la primera acumulación (unread era 0)
  IF v_unread_prev = 0 THEN
    SELECT title INTO v_ad_title
    FROM public.ads WHERE id = v_channel.ad_id;

    SELECT full_name INTO v_sender_name
    FROM public.users WHERE id = NEW.sender_id;

    INSERT INTO public.notifications (user_id, type, title, body, data)
    VALUES (
      v_recipient,
      'nuevo_mensaje_chat',
      'Nuevo mensaje de ' || COALESCE(v_sender_name, 'un usuario'),
      LEFT(NEW.message, 120),
      jsonb_build_object(
        'channel_id', NEW.channel_id,
        'ad_id',      v_channel.ad_id,
        'ad_title',   COALESCE(v_ad_title, ''),
        'sender_id',  NEW.sender_id
      )
    );
  END IF;

  RETURN NEW;
END;
$$;


--
-- Name: purchase_credits(uuid, integer, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.purchase_credits(p_user_id uuid, p_credits integer, p_payment_id uuid) RETURNS json
    LANGUAGE plpgsql
    AS $$
BEGIN
  RETURN json_build_object(
    'success', false,
    'error', 'Función obsoleta — sistema migrado a user_wallets'
  );
END;
$$;


--
-- Name: record_featured_impressions(uuid[], character varying); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.record_featured_impressions(p_featured_ids uuid[], p_placement character varying DEFAULT 'detail'::character varying) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF p_placement NOT IN ('homepage', 'results', 'detail') THEN
    RAISE EXCEPTION 'Placement inválido: %', p_placement;
  END IF;

  INSERT INTO public.featured_daily_impressions (featured_ad_id, placement, imp_date, count)
  SELECT
    unnest(p_featured_ids),
    p_placement,
    CURRENT_DATE,
    1
  ON CONFLICT (featured_ad_id, placement, imp_date)
  DO UPDATE SET count = featured_daily_impressions.count + 1;
END;
$$;


--
-- Name: redeem_coupon(uuid, character varying); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.redeem_coupon(p_user_id uuid, p_code character varying) RETURNS json
    LANGUAGE plpgsql SECURITY DEFINER
    AS $_$
DECLARE
  v_coupon           RECORD;
  v_plan             RECORD;
  v_current_balance  NUMERIC(14,2);
  v_new_balance      NUMERIC(14,2) := 0;
  v_user_role        TEXT;
  v_target_plan_id   UUID         := NULL;
  v_membership_exp   TIMESTAMPTZ  := NULL;
BEGIN

  -- Buscar cupón válido: ARS créditos OR membresía (o ambos)
  SELECT * INTO v_coupon
  FROM public.coupons
  WHERE UPPER(code) = UPPER(p_code)
    AND is_active = TRUE
    AND (expires_at IS NULL OR expires_at > NOW())
    AND (max_redemptions IS NULL OR current_redemptions < max_redemptions)
    AND (
      (ars_amount IS NOT NULL AND ars_amount > 0)
      OR gives_membership = TRUE
    );

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', FALSE,
      'error',   'Cupón inválido, expirado o agotado'
    );
  END IF;

  -- Verificar restricción de roles
  IF NOT ('all' = ANY(v_coupon.allowed_roles)) THEN
    SELECT role INTO v_user_role
    FROM public.users WHERE id = p_user_id;

    IF v_user_role IS NULL OR NOT (v_user_role = ANY(v_coupon.allowed_roles)) THEN
      RETURN json_build_object(
        'success', FALSE,
        'error',   'No tenés permisos para canjear este cupón'
      );
    END IF;
  END IF;

  -- Verificar canje único por usuario
  IF EXISTS (
    SELECT 1 FROM public.coupon_redemptions
    WHERE coupon_id = v_coupon.id AND user_id = p_user_id
  ) THEN
    RETURN json_build_object(
      'success', FALSE,
      'error',   'Ya canjeaste este cupón anteriormente'
    );
  END IF;

  -- ── BLOQUE 1: Acreditar ARS si corresponde ───────────────────────────────
  IF v_coupon.ars_amount IS NOT NULL AND v_coupon.ars_amount > 0 THEN

    SELECT virtual_balance INTO v_current_balance
    FROM public.user_wallets WHERE user_id = p_user_id;

    IF NOT FOUND THEN
      INSERT INTO public.user_wallets (user_id, currency, virtual_balance, real_balance)
      VALUES (p_user_id, 'ARS', 0, 0);
      v_current_balance := 0;
    END IF;

    v_new_balance := v_current_balance + v_coupon.ars_amount;

    UPDATE public.user_wallets
    SET virtual_balance = v_new_balance, updated_at = NOW()
    WHERE user_id = p_user_id;

    INSERT INTO public.wallet_transactions (
      user_id, bucket, tx_type, amount, balance_after,
      source, description, metadata
    ) VALUES (
      p_user_id, 'virtual', 'credit',
      v_coupon.ars_amount, v_new_balance, 'coupon',
      'Cupón canjeado: ' || COALESCE(v_coupon.name, v_coupon.code),
      json_build_object(
        'coupon_code', v_coupon.code,
        'coupon_id',   v_coupon.id,
        'coupon_name', v_coupon.name
      )::JSONB
    );

  END IF;

  -- ── BLOQUE 2: Otorgar membresía si corresponde ───────────────────────────
  IF v_coupon.gives_membership = TRUE THEN

    -- Preferir membership_plan_ids[1], fallback a membership_id
    IF v_coupon.membership_plan_ids IS NOT NULL
       AND array_length(v_coupon.membership_plan_ids, 1) > 0 THEN
      v_target_plan_id := v_coupon.membership_plan_ids[1];
    ELSIF v_coupon.membership_id IS NOT NULL THEN
      v_target_plan_id := v_coupon.membership_id;
    END IF;

    IF v_target_plan_id IS NOT NULL THEN
      SELECT id, name, display_name INTO v_plan
      FROM public.subscription_plans
      WHERE id = v_target_plan_id AND is_active = TRUE;

      IF FOUND THEN
        v_membership_exp :=
          NOW() + (COALESCE(v_coupon.membership_duration_days, 365) || ' days')::INTERVAL;

        -- Actualiza rol Y plan en la misma operación (fuente de verdad unificada)
        UPDATE public.users
        SET
          subscription_plan_id    = v_plan.id,
          subscription_status     = 'active',
          subscription_started_at = NOW(),
          subscription_expires_at = v_membership_exp,
          role                    = CASE
                                      WHEN v_plan.name = 'free' THEN 'free'
                                      ELSE 'premium'
                                    END,
          updated_at              = NOW()
        WHERE id = p_user_id;
      END IF;
    END IF;

  END IF;

  -- ── Incrementar contador + registrar redención ───────────────────────────
  UPDATE public.coupons
  SET current_redemptions = current_redemptions + 1, updated_at = NOW()
  WHERE id = v_coupon.id;

  INSERT INTO public.coupon_redemptions (coupon_id, user_id, membership_granted)
  VALUES (v_coupon.id, p_user_id, v_target_plan_id);

  -- ── Respuesta ─────────────────────────────────────────────────────────────
  RETURN json_build_object(
    'success',              TRUE,
    'ars_credited',         COALESCE(v_coupon.ars_amount, 0),
    'new_balance',          v_new_balance,
    'membership_granted',   v_coupon.gives_membership,
    'plan_name',            COALESCE(v_plan.name, ''),
    'plan_display_name',    COALESCE(v_plan.display_name, ''),
    'membership_expires_at', v_membership_exp,
    'message',              CASE
      WHEN v_coupon.gives_membership AND (v_coupon.ars_amount IS NOT NULL AND v_coupon.ars_amount > 0) THEN
        'Membresía ' || COALESCE(v_plan.display_name, 'Premium') || ' activada y $' ||
        to_char(v_coupon.ars_amount, 'FM999G999G999') || ' ARS acreditados'
      WHEN v_coupon.gives_membership THEN
        'Membresía ' || COALESCE(v_plan.display_name, 'Premium') || ' activada exitosamente'
      ELSE
        'Se acreditaron $' || to_char(v_coupon.ars_amount, 'FM999G999G999') || ' ARS a tu saldo'
    END
  );

EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', FALSE, 'error', SQLERRM);
END;
$_$;


--
-- Name: reset_monthly_contacts(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.reset_monthly_contacts() RETURNS integer
    LANGUAGE plpgsql
    AS $$
DECLARE
  reset_count INTEGER;
BEGIN
  UPDATE users
  SET contacts_used_this_month = 0,
      contacts_reset_at = NOW()
  WHERE contacts_reset_at IS NULL 
     OR contacts_reset_at < DATE_TRUNC('month', NOW());
  
  GET DIAGNOSTICS reset_count = ROW_COUNT;
  RAISE NOTICE 'Reset contacts for % users', reset_count;
  RETURN reset_count;
END;
$$;


--
-- Name: search_models(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.search_models(search_term text) RETURNS TABLE(id uuid, brand_name text, model_name text, full_name text, category text, subcategory text, confidence numeric)
    LANGUAGE plpgsql
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id,
    b.display_name AS brand_name,
    m.display_name AS model_name,
    CONCAT(b.display_name, ' ', m.display_name) AS full_name,
    c.display_name AS category,
    sc.display_name AS subcategory,
    CASE 
      WHEN LOWER(m.display_name) = LOWER(search_term) THEN 1.0
      WHEN LOWER(m.display_name) LIKE LOWER('%' || search_term || '%') THEN 0.8
      WHEN search_term = ANY(m.ml_aliases) THEN 0.9
      ELSE 0.5
    END AS confidence
  FROM models m
  JOIN brands b ON m.brand_id = b.id
  LEFT JOIN subcategory_brands sb ON b.id = sb.brand_id
  LEFT JOIN subcategories sc ON sb.subcategory_id = sc.id
  LEFT JOIN categories c ON sc.category_id = c.id
  WHERE m.is_active = true
    AND (
      LOWER(m.display_name) LIKE LOWER('%' || search_term || '%')
      OR LOWER(b.display_name) LIKE LOWER('%' || search_term || '%')
      OR search_term = ANY(m.ml_aliases)
    )
  ORDER BY confidence DESC
  LIMIT 10;
END;
$$;


--
-- Name: search_subcategory_paths(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.search_subcategory_paths(search_query text) RETURNS TABLE(leaf_id uuid, category_id uuid, parent_sub_id uuid, cat_name text, cat_icon text, sub_name text, leaf_name text, path text, leaf_slug text)
    LANGUAGE sql STABLE SECURITY DEFINER
    AS $$
  -- Nivel 3: Category > Sub > Leaf (parent_id IS NOT NULL)
  SELECT
    s3.id                                                                   AS leaf_id,
    cat.id                                                                  AS category_id,
    s3.parent_id                                                            AS parent_sub_id,
    cat.display_name                                                        AS cat_name,
    cat.icon                                                                AS cat_icon,
    s2.display_name                                                         AS sub_name,
    s3.display_name                                                         AS leaf_name,
    cat.display_name || ' > ' || s2.display_name || ' > ' || s3.display_name AS path,
    s3.slug                                                                 AS leaf_slug
  FROM public.subcategories s3
  JOIN public.subcategories  s2  ON s3.parent_id    = s2.id
  JOIN public.categories     cat ON s2.category_id  = cat.id
  WHERE s3.is_active  = true
    AND s2.is_active  = true
    AND cat.is_active = true
    AND (
      s3.display_name ILIKE '%' || search_query || '%'
      OR s2.display_name ILIKE '%' || search_query || '%'
      OR cat.display_name ILIKE '%' || search_query || '%'
    )

  UNION ALL

  -- Nivel 2 sin hijos: Category > Sub (leaf de 2 niveles)
  SELECT
    s2.id                                        AS leaf_id,
    cat.id                                       AS category_id,
    NULL::uuid                                   AS parent_sub_id,
    cat.display_name                             AS cat_name,
    cat.icon                                     AS cat_icon,
    NULL                                         AS sub_name,
    s2.display_name                              AS leaf_name,
    cat.display_name || ' > ' || s2.display_name AS path,
    s2.slug                                      AS leaf_slug
  FROM public.subcategories s2
  JOIN public.categories cat ON s2.category_id = cat.id
  WHERE s2.is_active  = true
    AND cat.is_active = true
    AND s2.parent_id  IS NULL
    AND NOT EXISTS (
      SELECT 1 FROM public.subcategories s3c
      WHERE s3c.parent_id = s2.id AND s3c.is_active = true
    )
    AND (
      s2.display_name ILIKE '%' || search_query || '%'
      OR cat.display_name ILIKE '%' || search_query || '%'
    )

  ORDER BY path
  LIMIT 20;
$$;


--
-- Name: set_featured_order(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_featured_order() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  -- Si se marca como destacado y no tiene orden, asignar el siguiente disponible
  IF NEW.featured = TRUE AND NEW.featured_order IS NULL THEN
    SELECT COALESCE(MAX(featured_order), 0) + 1
    INTO NEW.featured_order
    FROM ads
    WHERE category_id = NEW.category_id
    AND featured = TRUE;
    
    NEW.featured_at := NOW();
  END IF;
  
  -- Si se desmarca, limpiar campos
  IF NEW.featured = FALSE THEN
    NEW.featured_order := NULL;
    NEW.featured_at := NULL;
  END IF;
  
  RETURN NEW;
END;
$$;


--
-- Name: set_thread_id_on_root_message(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_thread_id_on_root_message() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF NEW.thread_id IS NULL AND (NEW.is_reply IS NULL OR NEW.is_reply = false) THEN
    NEW.thread_id := NEW.id;
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: set_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


--
-- Name: sync_ad_category_names(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.sync_ad_category_names() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  -- Sincronizar nombre de categoría si category_id está presente
  IF NEW.category_id IS NOT NULL THEN
    SELECT display_name INTO NEW.category
    FROM categories 
    WHERE id = NEW.category_id;
  END IF;
  
  -- Sincronizar nombre de subcategoría si subcategory_id está presente
  IF NEW.subcategory_id IS NOT NULL THEN
    SELECT display_name INTO NEW.subcategory
    FROM subcategories 
    WHERE id = NEW.subcategory_id;
  END IF;
  
  RETURN NEW;
END;
$$;


--
-- Name: sync_ad_featured_status(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.sync_ad_featured_status() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
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
$$;


--
-- Name: trg_fn_notify_new_contact(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.trg_fn_notify_new_contact() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_ad_title text;
BEGIN
  -- Obtener título del aviso
  SELECT COALESCE(title, 'Tu aviso') INTO v_ad_title
  FROM public.ads WHERE id = NEW.ad_id;

  INSERT INTO public.notifications(user_id, type, title, body, data)
  VALUES (
    NEW.ad_owner_id,
    'nuevo_contacto',
    'Nuevo mensaje recibido',
    COALESCE(NEW.sender_name, 'Alguien') || ' te escribió sobre "' || left(v_ad_title, 50) || '"',
    jsonb_build_object(
      'ad_id',          NEW.ad_id,
      'message_id',     NEW.id,
      'sender_name',    NEW.sender_name,
      'sender_email',   NEW.sender_email
    )
  );

  RETURN NEW;
END;
$$;


--
-- Name: trg_fn_notify_subcategory_followers(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.trg_fn_notify_subcategory_followers() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_sub_name text;
BEGIN
  -- Solo cuando el aviso pasa a 'active' (nuevo o transición)
  IF NEW.status = 'active' AND (OLD IS NULL OR OLD.status IS DISTINCT FROM 'active') THEN
    -- Obtener nombre de subcategoría
    SELECT COALESCE(display_name, name) INTO v_sub_name
    FROM public.subcategories WHERE id = NEW.subcategory_id;

    INSERT INTO public.notifications(user_id, type, title, body, data)
    SELECT
      uf.user_id,
      'nuevo_aviso_favorito',
      'Nuevo aviso en ' || COALESCE(v_sub_name, 'tu categoría favorita'),
      '"' || left(NEW.title, 60) || '"',
      jsonb_build_object(
        'ad_id',          NEW.id,
        'subcategory_id', NEW.subcategory_id,
        'ad_slug',        NEW.slug
      )
    FROM public.user_favorites uf
    WHERE uf.subcategory_id = NEW.subcategory_id
      AND uf.notify_new_ads = true
      AND uf.user_id != NEW.user_id;  -- no notificar al publicador
  END IF;

  RETURN NEW;
END;
$$;


--
-- Name: trigger_featured_ads_audit(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.trigger_featured_ads_audit() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  -- Solo registrar cambios importantes
  IF (TG_OP = 'UPDATE' AND (
    OLD.status != NEW.status OR
    OLD.cancelled_at IS DISTINCT FROM NEW.cancelled_at OR
    OLD.expires_at != NEW.expires_at
  )) THEN
    
    INSERT INTO featured_ads_audit (
      featured_ad_id,
      ad_id,
      user_id,
      action,
      reason,
      metadata,
      created_at
    ) VALUES (
      NEW.id,
      NEW.ad_id,
      NEW.user_id,
      CASE 
        WHEN NEW.status = 'cancelled' THEN 'cancelled'
        WHEN NEW.status = 'expired' THEN 'expired'
        WHEN NEW.status = 'active' AND OLD.status != 'active' THEN 'activated'
        ELSE 'edited'
      END,
      NEW.cancelled_reason,
      jsonb_build_object(
        'old_status', OLD.status,
        'new_status', NEW.status,
        'old_expires_at', OLD.expires_at,
        'new_expires_at', NEW.expires_at,
        'refunded', NEW.refunded,
        'auto_trigger', true
      ),
      NOW()
    );
    
  END IF;
  
  RETURN NEW;
END;
$$;


--
-- Name: trigger_generate_ad_slug(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.trigger_generate_ad_slug() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  -- Asegurar que short_id esté presente
  IF NEW.short_id IS NULL OR NEW.short_id = '' THEN
    NEW.short_id := generate_short_id();
  END IF;
  
  -- Generar slug si no existe o si cambió el título
  IF NEW.slug IS NULL OR NEW.slug = '' OR 
     (TG_OP = 'UPDATE' AND OLD.title IS DISTINCT FROM NEW.title) THEN
    NEW.slug := generate_ad_slug(NEW.title::TEXT, NEW.short_id::TEXT);
  END IF;
  
  RETURN NEW;
END;
$$;


--
-- Name: update_ads_search_vector(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_ads_search_vector() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_brand_name TEXT := '';
  v_model_name TEXT := '';
  v_attrs_text TEXT := '';
BEGIN
  -- Resolver nombre de marca desde tabla brands
  IF NEW.brand_id IS NOT NULL THEN
    SELECT COALESCE(b.name, '') INTO v_brand_name
    FROM brands b WHERE b.id = NEW.brand_id;
  END IF;

  -- Resolver nombre de modelo desde tabla models
  IF NEW.model_id IS NOT NULL THEN
    SELECT COALESCE(m.name, '') INTO v_model_name
    FROM models m WHERE m.id = NEW.model_id;
  END IF;

  -- Extraer atributos clave del JSONB attributes
  -- Estos son los atributos de "segundo nivel" que los usuarios buscan
  IF NEW.attributes IS NOT NULL AND NEW.attributes != '{}'::jsonb THEN
    v_attrs_text := CONCAT_WS(' ',
      COALESCE(NEW.attributes->>'marca', ''),
      COALESCE(NEW.attributes->>'brand', ''),
      COALESCE(NEW.attributes->>'modelo', ''),
      COALESCE(NEW.attributes->>'model', ''),
      COALESCE(NEW.attributes->>'raza', ''),
      COALESCE(NEW.attributes->>'breed', ''),
      COALESCE(NEW.attributes->>'tipobovino', ''),
      COALESCE(NEW.attributes->>'tipo', ''),
      COALESCE(NEW.attributes->>'variedad', ''),
      COALESCE(NEW.attributes->>'cultivo', ''),
      COALESCE(NEW.attributes->>'especie', '')
    );
  END IF;

  NEW.search_vector := 
    setweight(to_tsvector('spanish', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('spanish', COALESCE(v_brand_name, '')), 'A') ||
    setweight(to_tsvector('spanish', COALESCE(v_model_name, '')), 'A') ||
    setweight(to_tsvector('spanish', COALESCE(v_attrs_text, '')), 'A') ||
    setweight(to_tsvector('spanish', COALESCE(NEW.description, '')), 'B') ||
    setweight(to_tsvector('spanish', COALESCE(NEW.province, '')), 'C') ||
    setweight(to_tsvector('spanish', COALESCE(NEW.city, '')), 'C');
  RETURN NEW;
END;
$$;


--
-- Name: update_ads_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_ads_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


--
-- Name: update_attribute_groups_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_attribute_groups_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


--
-- Name: update_attribute_templates_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_attribute_templates_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


--
-- Name: update_banners_clean_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_banners_clean_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


--
-- Name: update_banners_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_banners_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


--
-- Name: update_channel_on_new_message(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_channel_on_new_message() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  UPDATE public.chat_channels
  SET
    last_message_at      = NEW.created_at,
    last_message_preview = LEFT(NEW.message, 80),
    buyer_unread  = CASE
                     WHEN NEW.sender_id <> buyer_id  THEN buyer_unread  + 1
                     ELSE buyer_unread
                   END,
    seller_unread = CASE
                     WHEN NEW.sender_id <> seller_id THEN seller_unread + 1
                     ELSE seller_unread
                   END
  WHERE id = NEW.channel_id;
  RETURN NEW;
END;
$$;


--
-- Name: update_cms_header_timestamp(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_cms_header_timestamp() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


--
-- Name: update_cms_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_cms_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


--
-- Name: update_coupon(uuid, uuid, character varying, character varying, text, integer, uuid, integer, timestamp with time zone, boolean); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_coupon(p_admin_id uuid, p_coupon_id uuid, p_name character varying, p_title character varying, p_description text, p_credits_amount integer, p_membership_id uuid, p_max_redemptions integer, p_expires_at timestamp with time zone, p_is_active boolean) RETURNS json
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  -- Verificar que es superadmin
  IF NOT EXISTS (
    SELECT 1 FROM users 
    WHERE id = p_admin_id AND role = 'superadmin'
  ) THEN
    RETURN json_build_object('success', false, 'error', 'No autorizado');
  END IF;
  
  -- Actualizar cupón
  UPDATE coupons SET
    name = COALESCE(p_name, name),
    title = COALESCE(p_title, title),
    description = COALESCE(p_description, description),
    credits_amount = COALESCE(p_credits_amount, credits_amount),
    membership_id = p_membership_id,
    max_redemptions = COALESCE(p_max_redemptions, max_redemptions),
    expires_at = COALESCE(p_expires_at, expires_at),
    is_active = COALESCE(p_is_active, is_active)
  WHERE id = p_coupon_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Cupón no encontrado');
  END IF;
  
  RETURN json_build_object('success', true, 'message', 'Cupón actualizado');
END;
$$;


--
-- Name: update_coupon_v2(uuid, uuid, character varying, character varying, text, boolean, integer, boolean, boolean, uuid[], integer, timestamp with time zone, boolean); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_coupon_v2(p_admin_id uuid, p_coupon_id uuid, p_name character varying, p_title character varying, p_description text, p_gives_credits boolean, p_credits_amount integer, p_gives_membership boolean, p_membership_all boolean, p_membership_plan_ids uuid[], p_max_redemptions integer, p_expires_at timestamp with time zone, p_is_active boolean) RETURNS json
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM users WHERE id = p_admin_id AND role = 'superadmin'
  ) THEN
    RETURN json_build_object('success', false, 'error', 'No autorizado');
  END IF;
  
  UPDATE coupons SET
    name = COALESCE(p_name, name),
    title = COALESCE(p_title, title),
    description = COALESCE(p_description, description),
    gives_credits = COALESCE(p_gives_credits, gives_credits),
    credits_amount = COALESCE(p_credits_amount, credits_amount),
    gives_membership = COALESCE(p_gives_membership, gives_membership),
    membership_all = COALESCE(p_membership_all, membership_all),
    membership_plan_ids = COALESCE(p_membership_plan_ids, membership_plan_ids),
    max_redemptions = COALESCE(p_max_redemptions, max_redemptions),
    expires_at = COALESCE(p_expires_at, expires_at),
    is_active = COALESCE(p_is_active, is_active)
  WHERE id = p_coupon_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Cupón no encontrado');
  END IF;
  
  RETURN json_build_object('success', true, 'message', 'Cupón actualizado');
END;
$$;


--
-- Name: update_coupons_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_coupons_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


--
-- Name: update_featured_ads_timestamp(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_featured_ads_timestamp() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


--
-- Name: update_featured_queue_timestamp(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_featured_queue_timestamp() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


--
-- Name: update_form_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_form_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


--
-- Name: update_full_name(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_full_name() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  -- Concatenar first_name y last_name para crear full_name
  NEW.full_name := TRIM(CONCAT(NEW.first_name, ' ', NEW.last_name));
  RETURN NEW;
END;
$$;


--
-- Name: update_global_settings_timestamp(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_global_settings_timestamp() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


--
-- Name: update_hero_images_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_hero_images_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$;


--
-- Name: update_images_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_images_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$;


--
-- Name: update_payments_timestamp(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_payments_timestamp() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


--
-- Name: update_profile_completion(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_profile_completion() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.profile_completion_pct := public.calc_profile_completion(NEW);
  RETURN NEW;
END;
$$;


--
-- Name: update_profile_contacts_count(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_profile_contacts_count() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  UPDATE users 
  SET profile_contacts_received = (
    SELECT COUNT(*) FROM profile_contacts WHERE profile_user_id = NEW.profile_user_id
  )
  WHERE id = NEW.profile_user_id;
  RETURN NEW;
END;
$$;


--
-- Name: update_site_settings_timestamp(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_site_settings_timestamp() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$;


--
-- Name: update_sources_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_sources_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


--
-- Name: update_user_credits_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_user_credits_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


--
-- Name: update_user_wallets_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_user_wallets_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
  BEGIN
    NEW.updated_at = now();
    RETURN NEW;
  END;
  $$;


--
-- Name: update_users_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_users_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


--
-- Name: validate_contact_send_limit(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.validate_contact_send_limit() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  can_send BOOLEAN;
  limits RECORD;
BEGIN
  -- Solo validar si el sender_user_id está presente (usuarios autenticados)
  IF NEW.sender_user_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Obtener límites del usuario
  SELECT * INTO limits FROM get_user_contact_limits(NEW.sender_user_id);
  
  IF NOT limits.can_send_more THEN
    RAISE EXCEPTION 'LIMIT_REACHED: Has alcanzado el límite de contactos enviados (% de %)', 
      limits.current_sent, limits.max_sent;
  END IF;
  
  RETURN NEW;
END;
$$;


--
-- Name: validate_coupon(character varying); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.validate_coupon(p_code character varying) RETURNS json
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_coupon RECORD;
BEGIN
  SELECT c.*, get_plan_names(c.membership_plan_ids) as plan_names
  INTO v_coupon
  FROM coupons c
  WHERE UPPER(c.code) = UPPER(p_code) AND c.is_active = true;
  
  IF NOT FOUND THEN
    RETURN json_build_object('valid', false, 'error', 'Cupón no encontrado');
  END IF;
  
  IF v_coupon.expires_at < NOW() THEN
    RETURN json_build_object('valid', false, 'error', 'Este cupón ha expirado');
  END IF;
  
  IF v_coupon.current_redemptions >= v_coupon.max_redemptions THEN
    RETURN json_build_object('valid', false, 'error', 'Este cupón ya no está disponible');
  END IF;
  
  RETURN json_build_object(
    'valid', true,
    'coupon', json_build_object(
      'id', v_coupon.id,
      'code', v_coupon.code,
      'title', v_coupon.title,
      'description', v_coupon.description,
      'gives_credits', COALESCE(v_coupon.gives_credits, true),
      'credits_amount', v_coupon.credits_amount,
      'gives_membership', COALESCE(v_coupon.gives_membership, false),
      'membership_all', COALESCE(v_coupon.membership_all, false),
      'membership_plan_ids', COALESCE(v_coupon.membership_plan_ids, '{}'),
      'membership_plan_names', COALESCE(v_coupon.plan_names, '{}'),
      'expires_at', v_coupon.expires_at,
      'remaining', v_coupon.max_redemptions - v_coupon.current_redemptions
    )
  );
END;
$$;


--
-- Name: validate_coupon_for_checkout(text, text, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.validate_coupon_for_checkout(p_code text, p_tier text, p_base_price integer) RETURNS json
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
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


--
-- Name: validate_invitation_token(character varying); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.validate_invitation_token(p_token character varying) RETURNS json
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_invitation RECORD;
  v_coupon RECORD;
BEGIN
  SELECT ci.*, c.code, c.title, c.description, c.credits_amount, c.membership_id
  INTO v_invitation
  FROM coupon_invitations ci
  JOIN coupons c ON c.id = ci.coupon_id
  WHERE ci.token = p_token
    AND ci.status = 'pending';
  
  IF NOT FOUND THEN
    RETURN json_build_object('valid', false, 'error', 'Invitación no válida o ya usada');
  END IF;
  
  -- Verificar que el cupón sigue activo
  SELECT * INTO v_coupon FROM coupons 
  WHERE id = v_invitation.coupon_id 
    AND is_active = true 
    AND expires_at > NOW()
    AND current_redemptions < max_redemptions;
  
  IF NOT FOUND THEN
    -- Marcar invitación como expirada
    UPDATE coupon_invitations SET status = 'expired' WHERE token = p_token;
    RETURN json_build_object('valid', false, 'error', 'El cupón asociado ha expirado');
  END IF;
  
  RETURN json_build_object(
    'valid', true,
    'email', v_invitation.email,
    'coupon', json_build_object(
      'code', v_invitation.code,
      'title', v_invitation.title,
      'description', v_invitation.description,
      'credits_amount', v_invitation.credits_amount
    )
  );
END;
$$;


--
-- Name: ad_images; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ad_images (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ad_id uuid NOT NULL,
    url text NOT NULL,
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT valid_url CHECK ((url ~* '^https?://.*'::text))
);


--
-- Name: ads; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ads (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    category_id uuid NOT NULL,
    subcategory_id uuid,
    title character varying(200) NOT NULL,
    description text,
    price numeric(12,2),
    currency character varying(3) DEFAULT 'ARS'::character varying,
    province character varying(100),
    city character varying(100),
    attributes jsonb DEFAULT '{}'::jsonb,
    status character varying(20) DEFAULT 'pending'::character varying,
    is_premium boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    published_at timestamp with time zone,
    expires_at timestamp with time zone,
    search_vector tsvector,
    featured boolean DEFAULT false,
    approval_status text DEFAULT 'pending'::text,
    images jsonb DEFAULT '[]'::jsonb,
    location text,
    contact_phone text,
    contact_email text,
    views integer DEFAULT 0,
    featured_at timestamp without time zone,
    featured_order integer,
    brand_id uuid,
    model_id uuid,
    category_type_id uuid,
    year integer,
    condition character varying(50),
    dynamic_fields jsonb DEFAULT '{}'::jsonb,
    slug character varying(200) NOT NULL,
    short_id character varying(8) NOT NULL,
    featured_until timestamp with time zone,
    price_negotiable boolean DEFAULT false,
    in_sitemap boolean DEFAULT false,
    sitemap_added_at timestamp with time zone,
    sitemap_added_by uuid,
    category character varying(255),
    subcategory character varying(255),
    ad_type character varying(20) DEFAULT 'product'::character varying,
    company_profile_id uuid,
    cloned_from_ad_id uuid,
    business_profile_id uuid,
    price_unit character varying(30),
    locality_id uuid,
    draft_expires_at timestamp with time zone,
    CONSTRAINT valid_status CHECK (((status)::text = ANY ((ARRAY['draft'::character varying, 'pending'::character varying, 'active'::character varying, 'paused'::character varying, 'sold'::character varying, 'expired'::character varying, 'deleted'::character varying])::text[])))
);


--
-- Name: admin_ads_overview; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.admin_ads_overview WITH (security_invoker='on') AS
 SELECT count(*) AS total_ads,
    count(*) FILTER (WHERE ((status)::text = 'active'::text)) AS active_ads,
    count(*) FILTER (WHERE ((status)::text = 'paused'::text)) AS paused_ads,
    count(*) FILTER (WHERE ((status)::text = 'pending'::text)) AS pending_ads,
    count(*) FILTER (WHERE (expires_at < now())) AS expired_ads,
    count(*) FILTER (WHERE (featured = true)) AS featured_ads,
    count(DISTINCT user_id) AS unique_users,
    max(created_at) AS last_ad_created,
    min(created_at) AS first_ad_created
   FROM public.ads;


--
-- Name: ads_moderation_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ads_moderation_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ad_id uuid,
    moderator_id uuid,
    action text NOT NULL,
    reason text,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT ads_moderation_log_action_check CHECK ((action = ANY (ARRAY['approved'::text, 'rejected'::text])))
);


--
-- Name: attribute_groups; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.attribute_groups (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    subcategory_id uuid NOT NULL,
    name character varying(100) NOT NULL,
    display_name character varying(100) NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: attribute_options; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.attribute_options (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    attribute_id uuid NOT NULL,
    value character varying(100) NOT NULL,
    label character varying(100) NOT NULL,
    display_order integer DEFAULT 0,
    is_active boolean DEFAULT true,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: attribute_template_fields; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.attribute_template_fields (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    template_id uuid NOT NULL,
    field_name text NOT NULL,
    field_label text NOT NULL,
    field_type text NOT NULL,
    field_group text NOT NULL,
    field_options jsonb,
    is_required boolean DEFAULT false,
    min_value numeric,
    max_value numeric,
    placeholder text,
    help_text text,
    prefix text,
    suffix text,
    sort_order integer DEFAULT 1 NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: attribute_templates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.attribute_templates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    category_id uuid,
    subcategory_id uuid,
    created_by uuid,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: attributes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.attributes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    slug character varying(100) NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    input_type character varying(50) NOT NULL,
    data_type character varying(20) NOT NULL,
    ui_config jsonb DEFAULT '{}'::jsonb,
    validations jsonb DEFAULT '{}'::jsonb,
    is_filterable boolean DEFAULT true,
    is_searchable boolean DEFAULT false,
    is_featured boolean DEFAULT false,
    display_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT valid_data_type CHECK (((data_type)::text = ANY ((ARRAY['string'::character varying, 'integer'::character varying, 'decimal'::character varying, 'boolean'::character varying, 'array'::character varying, 'date'::character varying])::text[]))),
    CONSTRAINT valid_input_type CHECK (((input_type)::text = ANY ((ARRAY['text'::character varying, 'number'::character varying, 'select'::character varying, 'multiselect'::character varying, 'boolean'::character varying, 'range'::character varying, 'date'::character varying])::text[])))
);


--
-- Name: backup_featured_ads_20260226; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.backup_featured_ads_20260226 (
    id uuid,
    ad_id uuid,
    user_id uuid,
    placement character varying(20),
    category_id uuid,
    scheduled_start date,
    actual_start timestamp with time zone,
    expires_at timestamp with time zone,
    duration_days integer,
    status character varying(20),
    priority integer,
    credit_consumed boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    transaction_id uuid,
    cancelled_by uuid,
    cancelled_reason text,
    refunded boolean,
    cancelled_at timestamp with time zone,
    is_manual boolean,
    manual_activated_by uuid,
    requires_payment boolean,
    admin_notes text,
    credits_spent integer
);


--
-- Name: banners; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.banners (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    type text NOT NULL,
    title text NOT NULL,
    image_url text NOT NULL,
    link_url text,
    category text,
    device_target text DEFAULT 'both'::text NOT NULL,
    is_active boolean DEFAULT true,
    impressions integer DEFAULT 0,
    clicks integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    display_order integer DEFAULT 0,
    is_priority boolean DEFAULT false,
    "position" text,
    priority_weight integer DEFAULT 0,
    CONSTRAINT banners_category_check CHECK ((category IS NOT NULL)),
    CONSTRAINT banners_device_target_check CHECK ((device_target = ANY (ARRAY['desktop'::text, 'mobile'::text, 'both'::text]))),
    CONSTRAINT banners_type_check CHECK ((type = ANY (ARRAY['homepage_vip'::text, 'homepage_category'::text, 'results_lateral'::text, 'results_intercalated'::text]))),
    CONSTRAINT check_category_only_for_bc CHECK ((((type = 'homepage_category'::text) AND (category IS NOT NULL)) OR (type = 'homepage_vip'::text)))
);


--
-- Name: banners_clean; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.banners_clean (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    placement public.banner_placement NOT NULL,
    category character varying(100),
    client_name character varying(255) NOT NULL,
    link_url text,
    desktop_image_url text,
    mobile_image_url text,
    carousel_image_url text,
    starts_at timestamp with time zone,
    expires_at timestamp with time zone,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    impressions integer DEFAULT 0,
    clicks integer DEFAULT 0,
    link_name text,
    link_target text DEFAULT '_self'::text,
    CONSTRAINT banners_clean_link_target_check CHECK ((link_target = ANY (ARRAY['_self'::text, '_blank'::text]))),
    CONSTRAINT valid_images CHECK ((((placement = 'hero_vip'::public.banner_placement) AND (desktop_image_url IS NOT NULL) AND (mobile_image_url IS NOT NULL)) OR ((placement = 'category_carousel'::public.banner_placement) AND (carousel_image_url IS NOT NULL)) OR ((placement = 'results_lateral'::public.banner_placement) AND (desktop_image_url IS NOT NULL)) OR ((placement = 'results_intercalated'::public.banner_placement) AND (desktop_image_url IS NOT NULL)) OR ((placement = 'results_below_filter'::public.banner_placement) AND (desktop_image_url IS NOT NULL))))
);


--
-- Name: brands; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.brands (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    name character varying(200) NOT NULL,
    slug character varying(200),
    logo_url text,
    website text,
    country character varying(100),
    description text,
    is_active boolean DEFAULT true,
    sort_order integer DEFAULT 0,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: business_profile_members; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.business_profile_members (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_profile_id uuid NOT NULL,
    user_id uuid NOT NULL,
    role character varying(20) DEFAULT 'owner'::character varying,
    joined_at timestamp with time zone DEFAULT now(),
    CONSTRAINT business_profile_members_role_check CHECK (((role)::text = ANY ((ARRAY['owner'::character varying, 'admin'::character varying, 'editor'::character varying])::text[])))
);


--
-- Name: business_profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.business_profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    slug character varying(120) NOT NULL,
    company_name text NOT NULL,
    logo_url text,
    cover_url text,
    tagline text,
    description text,
    whatsapp character varying(20),
    website text,
    social_networks jsonb DEFAULT '{}'::jsonb,
    category_id uuid,
    province text,
    city text,
    is_verified boolean DEFAULT false,
    is_active boolean DEFAULT true,
    profile_views integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    brands_worked jsonb DEFAULT '[]'::jsonb,
    gallery_images jsonb DEFAULT '[]'::jsonb,
    phone character varying(30),
    email character varying(150),
    address text,
    owner_public boolean DEFAULT false,
    show_on_ad_detail boolean DEFAULT true,
    owner_dni character varying(15),
    owner_cuil character varying(15),
    business_cuit character varying(15),
    invoice_type character varying(5) DEFAULT 'C'::character varying,
    verified_at timestamp with time zone,
    verified_by uuid,
    anos_experiencia integer,
    area_cobertura character varying(20),
    superficie_maxima integer,
    cultivos_json jsonb DEFAULT '[]'::jsonb,
    equipamiento_propio boolean DEFAULT false,
    aplica_precision boolean DEFAULT false,
    usa_drones boolean DEFAULT false,
    factura boolean DEFAULT false,
    CONSTRAINT business_profiles_anos_experiencia_check CHECK (((anos_experiencia >= 0) AND (anos_experiencia <= 100))),
    CONSTRAINT business_profiles_area_cobertura_check CHECK (((area_cobertura)::text = ANY ((ARRAY['local'::character varying, 'regional'::character varying, 'nacional'::character varying])::text[]))),
    CONSTRAINT business_profiles_superficie_maxima_check CHECK ((superficie_maxima >= 0))
);


--
-- Name: catalog_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.catalog_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    catalog_id uuid NOT NULL,
    title character varying(200) NOT NULL,
    description text,
    images jsonb DEFAULT '[]'::jsonb,
    price numeric(15,2),
    currency character varying(3) DEFAULT 'USD'::character varying,
    price_type character varying(20) DEFAULT 'fixed'::character varying,
    specs jsonb DEFAULT '{}'::jsonb,
    is_active boolean DEFAULT true,
    sort_order integer DEFAULT 0,
    views_count integer DEFAULT 0,
    contact_count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: catalogs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.catalogs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_id uuid NOT NULL,
    name character varying(150) NOT NULL,
    slug character varying(150) NOT NULL,
    description text,
    cover_image_url text,
    is_active boolean DEFAULT true,
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.categories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    display_name text NOT NULL,
    description text,
    icon text,
    is_active boolean DEFAULT true,
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    slug character varying(100),
    is_filter boolean DEFAULT true NOT NULL
);


--
-- Name: category_icons; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.category_icons (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(100) NOT NULL,
    url_light character varying(500) NOT NULL,
    url_dark character varying(500),
    storage_path character varying(300),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    title text,
    paragraph text
);


--
-- Name: category_types; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.category_types (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    category_id uuid NOT NULL,
    subcategory_id uuid,
    name text NOT NULL,
    display_name text NOT NULL,
    description text,
    is_active boolean DEFAULT true,
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    slug character varying(100),
    page_type character varying(20) DEFAULT 'particular'::character varying,
    CONSTRAINT category_types_page_type_check CHECK (((page_type)::text = ANY ((ARRAY['particular'::character varying, 'empresa'::character varying])::text[])))
);


--
-- Name: chat_channels; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chat_channels (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ad_id uuid NOT NULL,
    buyer_id uuid NOT NULL,
    seller_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    last_message_at timestamp with time zone DEFAULT now() NOT NULL,
    last_message_preview text,
    buyer_unread integer DEFAULT 0 NOT NULL,
    seller_unread integer DEFAULT 0 NOT NULL,
    status character varying(20) DEFAULT 'active'::character varying NOT NULL,
    CONSTRAINT chat_channels_status_check CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'archived'::character varying, 'blocked'::character varying])::text[]))),
    CONSTRAINT chk_no_self_chat CHECK ((buyer_id <> seller_id))
);


--
-- Name: chat_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chat_messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    channel_id uuid NOT NULL,
    sender_id uuid NOT NULL,
    message text NOT NULL,
    is_read boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    was_masked boolean DEFAULT false NOT NULL,
    CONSTRAINT chat_messages_message_check CHECK ((char_length(message) >= 1))
);


--
-- Name: cms_footer; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cms_footer (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    logo_url text DEFAULT '/images/logos/logo.svg'::text,
    logo_alt text DEFAULT 'Clasify'::text,
    description character varying(300) DEFAULT 'Conectando el Campo'::character varying,
    show_social_media boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    logo_width integer DEFAULT 100,
    logo_height integer DEFAULT 100,
    show_logo boolean DEFAULT true,
    logo_original_width integer,
    logo_original_height integer
);


--
-- Name: cms_footer_columns; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cms_footer_columns (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title character varying(100) NOT NULL,
    column_type character varying(20) DEFAULT 'manual'::character varying,
    display_order integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT cms_footer_columns_column_type_check CHECK (((column_type)::text = ANY ((ARRAY['manual'::character varying, 'categories'::character varying, 'subcategories'::character varying])::text[])))
);


--
-- Name: cms_footer_links; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cms_footer_links (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    column_id uuid,
    label character varying(100) NOT NULL,
    url text NOT NULL,
    display_order integer DEFAULT 0,
    is_active boolean DEFAULT true,
    open_new_tab boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: cms_header; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cms_header (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    logo_url text DEFAULT '/images/logos/logo.svg'::text NOT NULL,
    logo_alt text DEFAULT 'Clasify'::text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    logo_width integer DEFAULT 100,
    logo_height integer DEFAULT 100,
    logo_dark_url text,
    favicon_url text DEFAULT '/favicon.ico'::text,
    show_logo boolean DEFAULT true,
    click_action text DEFAULT 'homepage'::text,
    custom_url text,
    logo_original_width integer,
    logo_original_height integer
);


--
-- Name: cms_hero_images; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cms_hero_images (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    image_url text NOT NULL,
    alt_text text,
    overlay_color character varying(50) DEFAULT 'rgba(0,0,0,0.3)'::character varying,
    overlay_opacity numeric(3,2) DEFAULT 0.30,
    display_order integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true,
    fade_duration integer DEFAULT 5000,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT cms_hero_images_overlay_opacity_check CHECK (((overlay_opacity >= (0)::numeric) AND (overlay_opacity <= (1)::numeric)))
);


--
-- Name: cms_nav_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cms_nav_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    label character varying(100) NOT NULL,
    url text NOT NULL,
    is_active boolean DEFAULT true,
    display_order integer DEFAULT 0 NOT NULL,
    open_new_tab boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: cms_search_config; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cms_search_config (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title character varying(200) DEFAULT 'Encontrá lo que necesitás para tu campo'::character varying,
    subtitle character varying(300) DEFAULT 'Miles de productos agrícolas, maquinarias y servicios en un solo lugar'::character varying,
    show_stats boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: cms_social_media; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cms_social_media (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    platform character varying(50) NOT NULL,
    url text NOT NULL,
    icon_svg text,
    display_order integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: cms_stats; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cms_stats (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    label character varying(50) NOT NULL,
    value_type character varying(20) DEFAULT 'dynamic'::character varying,
    static_value character varying(50),
    display_order integer DEFAULT 0,
    is_active boolean DEFAULT true,
    base_value integer DEFAULT 0,
    variation_mode character varying(20) DEFAULT 'percentage'::character varying,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    image_stat text,
    CONSTRAINT cms_stats_value_type_check CHECK (((value_type)::text = ANY ((ARRAY['dynamic'::character varying, 'static'::character varying])::text[]))),
    CONSTRAINT cms_stats_variation_mode_check CHECK (((variation_mode)::text = ANY ((ARRAY['percentage'::character varying, 'fixed'::character varying])::text[])))
);


--
-- Name: company_profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.company_profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    company_name character varying(200) NOT NULL,
    slug character varying(200) NOT NULL,
    logo_url text,
    banner_url text,
    description text,
    contact_first_name character varying(100) NOT NULL,
    contact_last_name character varying(100) NOT NULL,
    contact_phone character varying(50),
    contact_whatsapp character varying(50),
    contact_email character varying(150),
    allow_whatsapp boolean DEFAULT true,
    allow_contact_form boolean DEFAULT true,
    province character varying(100),
    city character varying(100),
    address text,
    services_offered jsonb DEFAULT '[]'::jsonb,
    business_hours jsonb,
    website_url text,
    facebook_url text,
    instagram_url text,
    is_active boolean DEFAULT true,
    is_verified boolean DEFAULT false,
    verified_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: contact_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contact_messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ad_id uuid NOT NULL,
    ad_owner_id uuid NOT NULL,
    sender_name text NOT NULL,
    sender_last_name text,
    sender_phone text,
    sender_email text NOT NULL,
    message text NOT NULL,
    is_read boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    read_at timestamp with time zone,
    sender_user_id uuid,
    status character varying(20) DEFAULT 'active'::character varying,
    is_blocked boolean DEFAULT false,
    blocked_reason character varying(50),
    thread_id uuid,
    parent_message_id uuid,
    is_reply boolean DEFAULT false,
    CONSTRAINT contact_messages_status_check CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'blocked'::character varying, 'spam'::character varying, 'archived'::character varying])::text[]))),
    CONSTRAINT valid_message CHECK ((char_length(message) >= 10))
);


--
-- Name: contact_notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contact_notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    contact_message_id uuid NOT NULL,
    type character varying(50) NOT NULL,
    title character varying(200) NOT NULL,
    message text NOT NULL,
    is_read boolean DEFAULT false,
    is_email_sent boolean DEFAULT false,
    email_sent_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    read_at timestamp with time zone
);


--
-- Name: coupon_invitations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.coupon_invitations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    coupon_id uuid NOT NULL,
    email character varying(255) NOT NULL,
    invited_by uuid NOT NULL,
    token character varying(100) NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    sent_at timestamp with time zone DEFAULT now() NOT NULL,
    used_at timestamp with time zone,
    used_by uuid,
    CONSTRAINT coupon_invitations_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'used'::character varying, 'expired'::character varying])::text[])))
);


--
-- Name: coupon_redemptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.coupon_redemptions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    coupon_id uuid NOT NULL,
    user_id uuid NOT NULL,
    credits_granted integer DEFAULT 0 NOT NULL,
    membership_granted uuid,
    redeemed_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: coupons; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.coupons (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    code character varying(50) NOT NULL,
    name character varying(100) NOT NULL,
    title character varying(150) NOT NULL,
    description text,
    credits_amount integer DEFAULT 0 NOT NULL,
    membership_id uuid,
    max_redemptions integer DEFAULT 1 NOT NULL,
    current_redemptions integer DEFAULT 0 NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_by uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    gives_credits boolean DEFAULT true,
    gives_membership boolean DEFAULT false,
    membership_all boolean DEFAULT false,
    membership_plan_ids uuid[] DEFAULT '{}'::uuid[],
    ars_amount numeric(14,2),
    allowed_roles text[] DEFAULT ARRAY['all'::text] NOT NULL,
    featured_tier text,
    discount_type text DEFAULT 'percentage'::text NOT NULL,
    discount_percent integer,
    membership_duration_days integer DEFAULT 365,
    CONSTRAINT coupons_discount_percent_check CHECK (((discount_percent IS NULL) OR ((discount_percent >= 1) AND (discount_percent <= 100)))),
    CONSTRAINT coupons_discount_type_check CHECK ((discount_type = ANY (ARRAY['full'::text, 'percentage'::text]))),
    CONSTRAINT coupons_featured_tier_check CHECK ((featured_tier = ANY (ARRAY['alta'::text, 'media'::text, 'baja'::text])))
);


--
-- Name: deletion_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.deletion_requests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    user_email text NOT NULL,
    reason text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    admin_notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    processed_at timestamp with time zone,
    processed_by uuid,
    CONSTRAINT deletion_requests_reason_check CHECK ((char_length(reason) >= 10)),
    CONSTRAINT deletion_requests_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'processing'::text, 'completed'::text, 'rejected'::text])))
);


--
-- Name: dynamic_attributes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dynamic_attributes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    category_id uuid,
    subcategory_id uuid,
    type_id uuid,
    field_name text NOT NULL,
    field_label text NOT NULL,
    field_type text NOT NULL,
    field_group text,
    field_options jsonb,
    is_required boolean DEFAULT false,
    min_value numeric,
    max_value numeric,
    validation_regex text,
    placeholder text,
    help_text text,
    prefix text,
    suffix text,
    sort_order integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    is_filterable boolean DEFAULT false,
    filter_type character varying(20) DEFAULT 'select'::character varying,
    filter_order integer DEFAULT 99,
    group_id uuid,
    CONSTRAINT dynamic_attributes_check CHECK ((((category_id IS NOT NULL) AND (subcategory_id IS NULL) AND (type_id IS NULL)) OR ((category_id IS NOT NULL) AND (subcategory_id IS NOT NULL) AND (type_id IS NULL)) OR ((category_id IS NOT NULL) AND (subcategory_id IS NOT NULL) AND (type_id IS NOT NULL))))
);


--
-- Name: featured_ads; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.featured_ads (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ad_id uuid NOT NULL,
    user_id uuid NOT NULL,
    placement character varying(20),
    category_id uuid NOT NULL,
    scheduled_start date NOT NULL,
    actual_start timestamp with time zone,
    expires_at timestamp with time zone,
    duration_days integer DEFAULT 15 NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    priority integer DEFAULT 0,
    credit_consumed boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    cancelled_by uuid,
    cancelled_reason text,
    refunded boolean DEFAULT false,
    cancelled_at timestamp with time zone,
    is_manual boolean DEFAULT false,
    manual_activated_by uuid,
    requires_payment boolean DEFAULT true,
    admin_notes text,
    credits_spent integer,
    tier character varying(10) NOT NULL,
    period_number smallint DEFAULT 1 NOT NULL,
    subcategory_id uuid,
    CONSTRAINT featured_ads_period_check CHECK ((period_number = ANY (ARRAY[1, 2]))),
    CONSTRAINT featured_ads_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'active'::character varying, 'expired'::character varying, 'cancelled'::character varying])::text[]))),
    CONSTRAINT featured_ads_tier_check CHECK (((tier)::text = ANY ((ARRAY['alta'::character varying, 'media'::character varying, 'baja'::character varying])::text[])))
);


--
-- Name: featured_ads_audit; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.featured_ads_audit (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    featured_ad_id uuid,
    action character varying(50) NOT NULL,
    performed_by uuid,
    reason text,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    ad_id uuid,
    user_id uuid,
    performer_email character varying(255),
    performer_name character varying(255),
    performer_role character varying(20),
    CONSTRAINT featured_ads_audit_action_check CHECK (((action)::text = ANY ((ARRAY['created'::character varying, 'activated'::character varying, 'cancelled'::character varying, 'expired'::character varying, 'refunded'::character varying, 'edited'::character varying])::text[])))
);


--
-- Name: featured_ads_queue; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.featured_ads_queue (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ad_id uuid NOT NULL,
    category_id uuid NOT NULL,
    user_id uuid NOT NULL,
    requested_at timestamp with time zone DEFAULT now(),
    scheduled_start date,
    scheduled_end date,
    status character varying(20) DEFAULT 'queued'::character varying,
    payment_id uuid,
    notified_start boolean DEFAULT false,
    notified_end_soon boolean DEFAULT false,
    notified_end boolean DEFAULT false,
    admin_notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT featured_ads_queue_status_check CHECK (((status)::text = ANY ((ARRAY['queued'::character varying, 'scheduled'::character varying, 'active'::character varying, 'completed'::character varying, 'cancelled'::character varying, 'expired'::character varying])::text[])))
);


--
-- Name: featured_daily_impressions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.featured_daily_impressions (
    featured_ad_id uuid NOT NULL,
    placement character varying(20) NOT NULL,
    imp_date date DEFAULT CURRENT_DATE NOT NULL,
    count integer DEFAULT 0 NOT NULL,
    CONSTRAINT featured_daily_impressions_count_check CHECK ((count >= 0)),
    CONSTRAINT featured_daily_impressions_placement_check CHECK (((placement)::text = ANY ((ARRAY['homepage'::character varying, 'results'::character varying, 'detail'::character varying])::text[])))
);


--
-- Name: featured_queue_details; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.featured_queue_details WITH (security_invoker='on') AS
 SELECT faq.id,
    faq.ad_id,
    faq.category_id,
    faq.user_id,
    faq.requested_at,
    faq.scheduled_start,
    faq.scheduled_end,
    faq.status,
    faq.payment_id,
    faq.notified_start,
    faq.notified_end_soon,
    faq.notified_end,
    faq.admin_notes,
    faq.created_at,
    faq.updated_at,
    a.title AS ad_title,
    a.slug AS ad_slug,
    c.display_name AS category_name,
    u.email AS user_email,
    u.full_name AS user_name
   FROM (((public.featured_ads_queue faq
     JOIN public.ads a ON ((a.id = faq.ad_id)))
     JOIN public.categories c ON ((c.id = faq.category_id)))
     JOIN public.users u ON ((u.id = faq.user_id)))
  ORDER BY
        CASE faq.status
            WHEN 'queued'::text THEN 1
            WHEN 'scheduled'::text THEN 2
            WHEN 'active'::text THEN 3
            ELSE 4
        END, faq.requested_at;


--
-- Name: global_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.global_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    key character varying(100) NOT NULL,
    value jsonb NOT NULL,
    category character varying(50) DEFAULT 'general'::character varying NOT NULL,
    display_name character varying(200),
    description text,
    value_type character varying(20) DEFAULT 'string'::character varying,
    is_public boolean DEFAULT false,
    updated_at timestamp with time zone DEFAULT now(),
    updated_by uuid
);


--
-- Name: featured_slots_availability; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.featured_slots_availability WITH (security_invoker='on') AS
 WITH settings AS (
         SELECT ( SELECT ((global_settings.value #>> '{}'::text[]))::integer AS int4
                   FROM public.global_settings
                  WHERE ((global_settings.key)::text = 'featured_slots_homepage'::text)) AS homepage_max,
            ( SELECT ((global_settings.value #>> '{}'::text[]))::integer AS int4
                   FROM public.global_settings
                  WHERE ((global_settings.key)::text = 'featured_slots_results'::text)) AS results_max,
            ( SELECT ((global_settings.value #>> '{}'::text[]))::integer AS int4
                   FROM public.global_settings
                  WHERE ((global_settings.key)::text = 'featured_slots_detail'::text)) AS detail_max
        )
 SELECT c.id AS category_id,
    c.name AS category_name,
    c.slug AS category_slug,
    'homepage'::text AS placement,
    s.homepage_max AS max_slots,
    count(fa.id) FILTER (WHERE ((fa.status)::text = 'active'::text)) AS active_count,
    count(fa.id) FILTER (WHERE ((fa.status)::text = 'pending'::text)) AS pending_count,
    (s.homepage_max - count(fa.id) FILTER (WHERE ((fa.status)::text = ANY ((ARRAY['active'::character varying, 'pending'::character varying])::text[])))) AS available_slots
   FROM ((public.categories c
     CROSS JOIN settings s)
     LEFT JOIN public.featured_ads fa ON (((fa.category_id = c.id) AND ((fa.placement)::text = 'homepage'::text) AND ((fa.status)::text = ANY ((ARRAY['active'::character varying, 'pending'::character varying])::text[])))))
  WHERE (c.is_active = true)
  GROUP BY c.id, c.name, c.slug, s.homepage_max
UNION ALL
 SELECT c.id AS category_id,
    c.name AS category_name,
    c.slug AS category_slug,
    'results'::text AS placement,
    s.results_max AS max_slots,
    count(fa.id) FILTER (WHERE ((fa.status)::text = 'active'::text)) AS active_count,
    count(fa.id) FILTER (WHERE ((fa.status)::text = 'pending'::text)) AS pending_count,
    (s.results_max - count(fa.id) FILTER (WHERE ((fa.status)::text = ANY ((ARRAY['active'::character varying, 'pending'::character varying])::text[])))) AS available_slots
   FROM ((public.categories c
     CROSS JOIN settings s)
     LEFT JOIN public.featured_ads fa ON (((fa.category_id = c.id) AND ((fa.placement)::text = 'results'::text) AND ((fa.status)::text = ANY ((ARRAY['active'::character varying, 'pending'::character varying])::text[])))))
  WHERE (c.is_active = true)
  GROUP BY c.id, c.name, c.slug, s.results_max;


--
-- Name: featured_slots_summary; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.featured_slots_summary AS
SELECT
    NULL::uuid AS category_id,
    NULL::text AS category_name,
    NULL::bigint AS active_count,
    NULL::bigint AS scheduled_count,
    NULL::bigint AS queued_count,
    NULL::integer AS max_slots,
    NULL::bigint AS available_slots;


--
-- Name: form_field_options_v2; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.form_field_options_v2 (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    field_id uuid NOT NULL,
    option_value text NOT NULL,
    option_label text NOT NULL,
    display_order integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    metadata jsonb
);


--
-- Name: form_fields_v2; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.form_fields_v2 (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    form_template_id uuid NOT NULL,
    field_name text NOT NULL,
    field_label text NOT NULL,
    section_id text,
    field_type text NOT NULL,
    field_width text DEFAULT 'half'::text NOT NULL,
    data_source text,
    data_source_config jsonb,
    is_required boolean DEFAULT false NOT NULL,
    validation_rules jsonb,
    placeholder text,
    help_text text,
    icon text,
    display_order integer DEFAULT 0 NOT NULL,
    metadata jsonb,
    options jsonb,
    option_list_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT form_fields_v2_data_source_check CHECK ((data_source = ANY (ARRAY['brands'::text, 'models'::text, 'features'::text, 'custom'::text]))),
    CONSTRAINT form_fields_v2_field_type_check CHECK ((field_type = ANY (ARRAY['text'::text, 'number'::text, 'select'::text, 'autocomplete'::text, 'textarea'::text, 'checkbox'::text, 'checkbox_group'::text, 'radio'::text, 'features'::text, 'tags'::text, 'range'::text]))),
    CONSTRAINT form_fields_v2_field_width_check CHECK ((field_width = ANY (ARRAY['full'::text, 'half'::text, 'third'::text])))
);


--
-- Name: form_templates_v2; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.form_templates_v2 (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    display_name text NOT NULL,
    category_id uuid,
    subcategory_id uuid,
    category_type_id uuid,
    sections jsonb DEFAULT '[]'::jsonb NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    priority integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    price_config jsonb
);


--
-- Name: global_config; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.global_config (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    key character varying(100) NOT NULL,
    value text NOT NULL,
    value_type character varying(20) NOT NULL,
    description text,
    category character varying(50),
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: hero_images; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hero_images (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    image_url text NOT NULL,
    alt_text text,
    display_order integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true,
    fade_duration integer DEFAULT 5000,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    title text,
    subtitle text,
    cta_text text DEFAULT 'Ver más'::text,
    cta_url text,
    slide_duration integer DEFAULT 5000
);


--
-- Name: images; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.images (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    listing_id uuid,
    listing_type character varying(50) NOT NULL,
    original_url text NOT NULL,
    optimized_url text,
    thumbnail_url text,
    width integer,
    height integer,
    file_size integer,
    optimized_size integer,
    format character varying(10),
    hash character varying(64),
    perceptual_hash character varying(64),
    is_optimized boolean DEFAULT false,
    display_order integer DEFAULT 0,
    alt_text text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);


--
-- Name: images_stats; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.images_stats WITH (security_invoker='on') AS
 SELECT listing_type,
    count(*) AS total_images,
    sum(
        CASE
            WHEN (is_optimized = true) THEN 1
            ELSE 0
        END) AS optimized_images,
    avg(file_size) AS avg_file_size,
    avg(optimized_size) AS avg_optimized_size,
    sum(file_size) AS total_storage_bytes,
    sum(optimized_size) AS total_optimized_storage_bytes
   FROM public.images
  GROUP BY listing_type;


--
-- Name: jobs_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.jobs_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    job_name character varying(255) NOT NULL,
    job_type character varying(100) NOT NULL,
    source_id uuid,
    status character varying(50) NOT NULL,
    message text,
    items_processed integer DEFAULT 0,
    items_success integer DEFAULT 0,
    items_failed integer DEFAULT 0,
    execution_time_ms integer,
    error_details jsonb,
    metadata jsonb DEFAULT '{}'::jsonb,
    started_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    finished_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);


--
-- Name: jobs_stats; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.jobs_stats WITH (security_invoker='on') AS
 SELECT job_type,
    count(*) AS total_executions,
    sum(
        CASE
            WHEN ((status)::text = 'success'::text) THEN 1
            ELSE 0
        END) AS successful,
    sum(
        CASE
            WHEN ((status)::text = 'failed'::text) THEN 1
            ELSE 0
        END) AS failed,
    avg(execution_time_ms) AS avg_execution_time_ms,
    max(started_at) AS last_execution
   FROM public.jobs_log
  GROUP BY job_type;


--
-- Name: localities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.localities (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    province_id uuid NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: membership_plans; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.membership_plans (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(255) NOT NULL,
    slug character varying(100) NOT NULL,
    description text,
    price numeric(10,2),
    is_active boolean DEFAULT true,
    monthly_free_credits integer DEFAULT 0,
    monthly_credits_expire_days integer DEFAULT 30,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: models; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.models (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    brand_id uuid NOT NULL,
    name character varying(200) NOT NULL,
    slug character varying(200),
    year_from integer,
    year_to integer,
    is_current_production boolean DEFAULT true,
    specifications jsonb DEFAULT '{}'::jsonb,
    features text[] DEFAULT '{}'::text[],
    short_description text,
    main_image_url text,
    gallery_images text[] DEFAULT '{}'::text[],
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    type text NOT NULL,
    title text NOT NULL,
    body text,
    is_read boolean DEFAULT false NOT NULL,
    read_at timestamp with time zone,
    data jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: option_list_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.option_list_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    list_id uuid NOT NULL,
    value text NOT NULL,
    label text NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    metadata jsonb,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: option_lists; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.option_lists (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    display_name text NOT NULL,
    scope text DEFAULT 'global'::text NOT NULL,
    category_id uuid,
    description text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT option_lists_scope_check CHECK ((scope = ANY (ARRAY['global'::text, 'category'::text])))
);


--
-- Name: payment_receipt_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.payment_receipt_seq
    START WITH 1000
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: payments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    payment_type character varying(30) NOT NULL,
    amount numeric(12,2) NOT NULL,
    currency character varying(3) DEFAULT 'ARS'::character varying,
    status character varying(20) DEFAULT 'pending'::character varying,
    payment_method character varying(30) DEFAULT 'simulated'::character varying,
    external_id character varying(255),
    external_status character varying(100),
    description text,
    metadata jsonb DEFAULT '{}'::jsonb,
    receipt_number character varying(50),
    receipt_url text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    completed_at timestamp with time zone,
    expires_at timestamp with time zone,
    admin_notes text,
    CONSTRAINT payments_payment_method_check CHECK (((payment_method)::text = ANY ((ARRAY['simulated'::character varying, 'mercadopago'::character varying, 'stripe'::character varying, 'transfer'::character varying, 'cash'::character varying, 'other'::character varying])::text[]))),
    CONSTRAINT payments_payment_type_check CHECK (((payment_type)::text = ANY ((ARRAY['subscription'::character varying, 'featured_ad'::character varying, 'upgrade'::character varying, 'renewal'::character varying, 'other'::character varying])::text[]))),
    CONSTRAINT payments_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'processing'::character varying, 'completed'::character varying, 'failed'::character varying, 'refunded'::character varying, 'cancelled'::character varying])::text[])))
);


--
-- Name: payments_monthly_summary; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.payments_monthly_summary WITH (security_invoker='on') AS
 SELECT date_trunc('month'::text, created_at) AS month,
    count(*) FILTER (WHERE ((status)::text = 'completed'::text)) AS completed_count,
    sum(amount) FILTER (WHERE ((status)::text = 'completed'::text)) AS total_revenue,
    sum(amount) FILTER (WHERE (((status)::text = 'completed'::text) AND ((payment_type)::text = 'subscription'::text))) AS subscription_revenue,
    sum(amount) FILTER (WHERE (((status)::text = 'completed'::text) AND ((payment_type)::text = 'featured_ad'::text))) AS featured_revenue,
    count(*) FILTER (WHERE ((status)::text = 'pending'::text)) AS pending_count
   FROM public.payments
  GROUP BY (date_trunc('month'::text, created_at))
  ORDER BY (date_trunc('month'::text, created_at)) DESC;


--
-- Name: subscription_plans; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.subscription_plans (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(50) NOT NULL,
    display_name character varying(100) NOT NULL,
    max_ads integer DEFAULT 3,
    max_contacts_received integer,
    max_contacts_sent integer,
    max_featured_ads integer DEFAULT 0,
    max_highlighted_ads integer DEFAULT 0,
    can_publish_immediately boolean DEFAULT false,
    has_inbox boolean DEFAULT true,
    has_analytics boolean DEFAULT false,
    has_priority_support boolean DEFAULT false,
    has_public_profile boolean DEFAULT false,
    has_catalog boolean DEFAULT false,
    has_multiuser boolean DEFAULT false,
    price_monthly numeric(10,2) DEFAULT 0,
    price_yearly numeric(10,2) DEFAULT 0,
    currency character varying(3) DEFAULT 'ARS'::character varying,
    is_active boolean DEFAULT true,
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    max_contacts_per_month integer,
    description text,
    features jsonb DEFAULT '[]'::jsonb,
    badge_color character varying(20) DEFAULT 'gray'::character varying,
    icon_name character varying(50) DEFAULT 'gift'::character varying,
    badge_text character varying(100),
    is_featured boolean DEFAULT false,
    max_catalogs integer DEFAULT 0,
    max_catalog_items_per_catalog integer DEFAULT 0,
    can_have_company_profile boolean DEFAULT false,
    show_company_branding boolean DEFAULT false,
    slug character varying(50),
    monthly_free_credits integer DEFAULT 0,
    monthly_credits_expire_days integer DEFAULT 30,
    max_company_profiles integer DEFAULT 0
);


--
-- Name: payments_with_user; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.payments_with_user WITH (security_invoker='on') AS
 SELECT p.id,
    p.user_id,
    p.payment_type,
    p.amount,
    p.currency,
    p.status,
    p.payment_method,
    p.external_id,
    p.external_status,
    p.description,
    p.metadata,
    p.receipt_number,
    p.receipt_url,
    p.created_at,
    p.updated_at,
    p.completed_at,
    p.expires_at,
    p.admin_notes,
    u.email AS user_email,
    u.full_name AS user_name,
    sp.display_name AS plan_name
   FROM ((public.payments p
     JOIN public.users u ON ((u.id = p.user_id)))
     LEFT JOIN public.subscription_plans sp ON ((sp.id = ((p.metadata ->> 'plan_id'::text))::uuid)))
  ORDER BY p.created_at DESC;


--
-- Name: search_analytics; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.search_analytics (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    query text NOT NULL,
    "timestamp" timestamp with time zone NOT NULL,
    result_count integer,
    session_id text NOT NULL,
    filters jsonb,
    source text,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT search_analytics_source_check CHECK ((source = ANY (ARRAY['header'::text, 'hero'::text, 'page'::text])))
);


--
-- Name: popular_searches; Type: MATERIALIZED VIEW; Schema: public; Owner: -
--

CREATE MATERIALIZED VIEW public.popular_searches AS
 SELECT query,
    count(*) AS search_count,
    max(created_at) AS last_searched,
    count(DISTINCT session_id) AS unique_sessions
   FROM public.search_analytics
  WHERE (created_at > (now() - '30 days'::interval))
  GROUP BY query
  ORDER BY (count(*)) DESC
 LIMIT 100
  WITH NO DATA;


--
-- Name: products; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.products (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    price numeric,
    currency text DEFAULT 'USD'::text NOT NULL,
    location text NOT NULL,
    image_url text NOT NULL,
    source_url text NOT NULL,
    category text NOT NULL,
    is_sponsored boolean DEFAULT false,
    enriched_data jsonb,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: profile_contacts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profile_contacts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    profile_user_id uuid NOT NULL,
    sender_user_id uuid,
    sender_first_name character varying(100) NOT NULL,
    sender_last_name character varying(100) NOT NULL,
    sender_phone character varying(50) NOT NULL,
    sender_email character varying(255) NOT NULL,
    message text NOT NULL,
    source_type character varying(50) DEFAULT 'profile'::character varying,
    source_ad_id uuid,
    status character varying(20) DEFAULT 'unread'::character varying,
    read_at timestamp with time zone,
    replied_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: profile_views; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profile_views (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    profile_user_id uuid NOT NULL,
    visitor_user_id uuid,
    visitor_ip character varying(45),
    visitor_user_agent text,
    source_type character varying(50) DEFAULT 'direct'::character varying,
    source_ad_id uuid,
    source_url text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: provinces; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.provinces (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: reseller_points_of_sale; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reseller_points_of_sale (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    revendedor_id uuid NOT NULL,
    managed_user_id uuid,
    name character varying(200) NOT NULL,
    logo_url text,
    province character varying(100),
    city character varying(100),
    address text,
    contact_name character varying(200),
    contact_phone character varying(50),
    contact_email character varying(255),
    category_ids jsonb DEFAULT '[]'::jsonb,
    notes text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: site_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.site_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    setting_key text NOT NULL,
    setting_value text,
    setting_type text NOT NULL,
    section text NOT NULL,
    description text,
    updated_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT site_settings_section_check CHECK ((section = ANY (ARRAY['header'::text, 'footer'::text, 'content'::text, 'general'::text]))),
    CONSTRAINT site_settings_setting_type_check CHECK ((setting_type = ANY (ARRAY['text'::text, 'image'::text, 'json'::text, 'html'::text])))
);


--
-- Name: sources; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sources (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(255) NOT NULL,
    url text NOT NULL,
    base_url text NOT NULL,
    scraper_type character varying(100) NOT NULL,
    is_active boolean DEFAULT true,
    scraping_interval integer DEFAULT 3600,
    last_scraped_at timestamp with time zone,
    total_listings_scraped integer DEFAULT 0,
    success_rate numeric(5,2) DEFAULT 100.00,
    config jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);


--
-- Name: subcategories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.subcategories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    category_id uuid NOT NULL,
    name text NOT NULL,
    display_name text NOT NULL,
    description text,
    icon text,
    is_active boolean DEFAULT true,
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    slug character varying(100),
    has_brands boolean DEFAULT false,
    has_models boolean DEFAULT false,
    has_year boolean DEFAULT false,
    has_condition boolean DEFAULT false,
    parent_id uuid,
    is_filter boolean DEFAULT false NOT NULL
);


--
-- Name: subcategory_attributes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.subcategory_attributes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    subcategory_id uuid NOT NULL,
    attribute_id uuid NOT NULL,
    is_required boolean DEFAULT false,
    display_order integer DEFAULT 0,
    field_group character varying(50) DEFAULT 'general'::character varying,
    override_config jsonb,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: subcategory_brands; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.subcategory_brands (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    subcategory_id uuid NOT NULL,
    brand_id uuid NOT NULL,
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: system_config; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.system_config (
    key text NOT NULL,
    value text NOT NULL,
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: user_favorites; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_favorites (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    ad_id uuid,
    subcategory_id uuid,
    notify_new_ads boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT fav_type_check CHECK ((((ad_id IS NOT NULL) AND (subcategory_id IS NULL)) OR ((ad_id IS NULL) AND (subcategory_id IS NOT NULL))))
);


--
-- Name: user_metrics_view; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.user_metrics_view WITH (security_invoker='on') AS
 SELECT u.id,
    u.full_name,
    u.display_name,
    u.user_type,
    u.avatar_url,
    u.profile_views,
    u.profile_contacts_received,
    sp.name AS plan_name,
    sp.features AS plan_features,
        CASE
            WHEN (u.profile_views > 0) THEN round((((u.profile_contacts_received)::numeric / (u.profile_views)::numeric) * (100)::numeric), 2)
            ELSE (0)::numeric
        END AS conversion_rate,
    ( SELECT count(*) AS count
           FROM public.profile_contacts pc
          WHERE ((pc.profile_user_id = u.id) AND ((pc.status)::text = 'unread'::text))) AS unread_contacts,
    ( SELECT count(*) AS count
           FROM public.profile_views pv
          WHERE ((pv.profile_user_id = u.id) AND (pv.created_at > (now() - '7 days'::interval)))) AS views_last_7_days,
    ( SELECT count(*) AS count
           FROM public.profile_contacts pc
          WHERE ((pc.profile_user_id = u.id) AND (pc.created_at > (now() - '7 days'::interval)))) AS contacts_last_7_days,
        CASE
            WHEN (u.user_type = 'empresa'::text) THEN true
            WHEN ((sp.name)::text = ANY ((ARRAY['premium'::character varying, 'profesional'::character varying, 'avanzado'::character varying])::text[])) THEN true
            ELSE false
        END AS has_premium_features
   FROM (public.users u
     LEFT JOIN public.subscription_plans sp ON ((u.subscription_plan_id = sp.id)));


--
-- Name: user_promo_claims; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_promo_claims (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    promo_code character varying(50) DEFAULT 'launch_2026'::character varying NOT NULL,
    credits_granted integer NOT NULL,
    claimed_at timestamp with time zone DEFAULT now()
);


--
-- Name: user_wallets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_wallets (
    user_id uuid NOT NULL,
    currency character varying(3) DEFAULT 'ARS'::character varying NOT NULL,
    virtual_balance numeric(14,2) DEFAULT 0 NOT NULL,
    real_balance numeric(14,2) DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: v_admin_featured_ads; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_admin_featured_ads WITH (security_invoker='on') AS
 SELECT fa.id,
    fa.ad_id,
    fa.user_id,
    fa.placement,
    fa.category_id,
    fa.scheduled_start,
    fa.actual_start,
    fa.expires_at,
    fa.duration_days,
    fa.status,
    fa.priority,
    fa.credit_consumed,
    COALESCE(fa.credits_spent, 1) AS credits_spent,
    fa.is_manual,
    fa.manual_activated_by,
    fa.requires_payment,
    fa.refunded,
    fa.cancelled_by,
    fa.cancelled_reason,
    fa.cancelled_at,
    fa.admin_notes,
    fa.created_at,
    fa.updated_at,
    a.title AS ad_title,
    a.slug AS ad_slug,
    a.images AS ad_images,
    a.price AS ad_price,
    a.currency AS ad_currency,
    a.status AS ad_status,
    u.email AS user_email,
    u.full_name AS user_full_name,
    u.role AS user_role,
    c.name AS category_name,
    c.slug AS category_slug,
    ma.email AS manual_activator_email,
    ma.full_name AS manual_activator_name,
    cb.email AS cancelled_by_email,
    cb.full_name AS cancelled_by_name,
        CASE
            WHEN (((fa.status)::text = 'active'::text) AND (fa.expires_at > now())) THEN (EXTRACT(day FROM (fa.expires_at - now())))::integer
            ELSE 0
        END AS days_remaining,
        CASE
            WHEN ((fa.credit_consumed = true) AND ((fa.status)::text = 'active'::text)) THEN public.calculate_featured_refund(fa.id)
            ELSE 0
        END AS potential_refund
   FROM (((((public.featured_ads fa
     LEFT JOIN public.ads a ON ((a.id = fa.ad_id)))
     LEFT JOIN public.users u ON ((u.id = fa.user_id)))
     LEFT JOIN public.categories c ON ((c.id = fa.category_id)))
     LEFT JOIN public.users ma ON ((ma.id = fa.manual_activated_by)))
     LEFT JOIN public.users cb ON ((cb.id = fa.cancelled_by)))
  ORDER BY fa.created_at DESC;


--
-- Name: wallet_transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.wallet_transactions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    bucket public.wallet_bucket NOT NULL,
    tx_type public.wallet_tx_type NOT NULL,
    amount numeric(14,2) NOT NULL,
    balance_after numeric(14,2) NOT NULL,
    source character varying(50) NOT NULL,
    description text,
    payment_id uuid,
    featured_ad_id uuid,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT wallet_transactions_amount_check CHECK ((amount > (0)::numeric))
);


--
-- Name: wizard_configs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.wizard_configs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    display_name text NOT NULL,
    category_id uuid,
    steps jsonb NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: ad_images ad_images_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ad_images
    ADD CONSTRAINT ad_images_pkey PRIMARY KEY (id);


--
-- Name: ads_moderation_log ads_moderation_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ads_moderation_log
    ADD CONSTRAINT ads_moderation_log_pkey PRIMARY KEY (id);


--
-- Name: ads ads_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ads
    ADD CONSTRAINT ads_pkey PRIMARY KEY (id);


--
-- Name: attribute_groups attribute_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attribute_groups
    ADD CONSTRAINT attribute_groups_pkey PRIMARY KEY (id);


--
-- Name: attribute_options attribute_options_attribute_id_value_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attribute_options
    ADD CONSTRAINT attribute_options_attribute_id_value_key UNIQUE (attribute_id, value);


--
-- Name: attribute_options attribute_options_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attribute_options
    ADD CONSTRAINT attribute_options_pkey PRIMARY KEY (id);


--
-- Name: attribute_template_fields attribute_template_fields_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attribute_template_fields
    ADD CONSTRAINT attribute_template_fields_pkey PRIMARY KEY (id);


--
-- Name: attribute_templates attribute_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attribute_templates
    ADD CONSTRAINT attribute_templates_pkey PRIMARY KEY (id);


--
-- Name: attributes attributes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attributes
    ADD CONSTRAINT attributes_pkey PRIMARY KEY (id);


--
-- Name: attributes attributes_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attributes
    ADD CONSTRAINT attributes_slug_key UNIQUE (slug);


--
-- Name: banners_clean banners_clean_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.banners_clean
    ADD CONSTRAINT banners_clean_pkey PRIMARY KEY (id);


--
-- Name: banners banners_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.banners
    ADD CONSTRAINT banners_pkey PRIMARY KEY (id);


--
-- Name: brands brands_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.brands
    ADD CONSTRAINT brands_pkey PRIMARY KEY (id);


--
-- Name: brands brands_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.brands
    ADD CONSTRAINT brands_slug_key UNIQUE (slug);


--
-- Name: business_profile_members business_profile_members_business_profile_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.business_profile_members
    ADD CONSTRAINT business_profile_members_business_profile_id_user_id_key UNIQUE (business_profile_id, user_id);


--
-- Name: business_profile_members business_profile_members_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.business_profile_members
    ADD CONSTRAINT business_profile_members_pkey PRIMARY KEY (id);


--
-- Name: business_profiles business_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.business_profiles
    ADD CONSTRAINT business_profiles_pkey PRIMARY KEY (id);


--
-- Name: business_profiles business_profiles_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.business_profiles
    ADD CONSTRAINT business_profiles_slug_key UNIQUE (slug);


--
-- Name: catalog_items catalog_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.catalog_items
    ADD CONSTRAINT catalog_items_pkey PRIMARY KEY (id);


--
-- Name: catalogs catalogs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.catalogs
    ADD CONSTRAINT catalogs_pkey PRIMARY KEY (id);


--
-- Name: categories categories_slug_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_slug_unique UNIQUE (slug);


--
-- Name: categories categories_v2_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_v2_name_key UNIQUE (name);


--
-- Name: categories categories_v2_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_v2_pkey PRIMARY KEY (id);


--
-- Name: category_icons category_icons_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.category_icons
    ADD CONSTRAINT category_icons_pkey PRIMARY KEY (id);


--
-- Name: category_types category_types_category_id_subcategory_id_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.category_types
    ADD CONSTRAINT category_types_category_id_subcategory_id_name_key UNIQUE (category_id, subcategory_id, name);


--
-- Name: category_types category_types_v2_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.category_types
    ADD CONSTRAINT category_types_v2_pkey PRIMARY KEY (id);


--
-- Name: chat_channels chat_channels_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_channels
    ADD CONSTRAINT chat_channels_pkey PRIMARY KEY (id);


--
-- Name: chat_messages chat_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_pkey PRIMARY KEY (id);


--
-- Name: cms_footer_columns cms_footer_columns_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cms_footer_columns
    ADD CONSTRAINT cms_footer_columns_pkey PRIMARY KEY (id);


--
-- Name: cms_footer_links cms_footer_links_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cms_footer_links
    ADD CONSTRAINT cms_footer_links_pkey PRIMARY KEY (id);


--
-- Name: cms_footer cms_footer_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cms_footer
    ADD CONSTRAINT cms_footer_pkey PRIMARY KEY (id);


--
-- Name: cms_header cms_header_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cms_header
    ADD CONSTRAINT cms_header_pkey PRIMARY KEY (id);


--
-- Name: cms_hero_images cms_hero_images_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cms_hero_images
    ADD CONSTRAINT cms_hero_images_pkey PRIMARY KEY (id);


--
-- Name: cms_nav_items cms_nav_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cms_nav_items
    ADD CONSTRAINT cms_nav_items_pkey PRIMARY KEY (id);


--
-- Name: cms_search_config cms_search_config_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cms_search_config
    ADD CONSTRAINT cms_search_config_pkey PRIMARY KEY (id);


--
-- Name: cms_social_media cms_social_media_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cms_social_media
    ADD CONSTRAINT cms_social_media_pkey PRIMARY KEY (id);


--
-- Name: cms_stats cms_stats_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cms_stats
    ADD CONSTRAINT cms_stats_pkey PRIMARY KEY (id);


--
-- Name: company_profiles company_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.company_profiles
    ADD CONSTRAINT company_profiles_pkey PRIMARY KEY (id);


--
-- Name: company_profiles company_profiles_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.company_profiles
    ADD CONSTRAINT company_profiles_slug_key UNIQUE (slug);


--
-- Name: contact_messages contact_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contact_messages
    ADD CONSTRAINT contact_messages_pkey PRIMARY KEY (id);


--
-- Name: contact_notifications contact_notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contact_notifications
    ADD CONSTRAINT contact_notifications_pkey PRIMARY KEY (id);


--
-- Name: coupon_invitations coupon_invitations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coupon_invitations
    ADD CONSTRAINT coupon_invitations_pkey PRIMARY KEY (id);


--
-- Name: coupon_invitations coupon_invitations_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coupon_invitations
    ADD CONSTRAINT coupon_invitations_token_key UNIQUE (token);


--
-- Name: coupon_redemptions coupon_redemptions_coupon_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coupon_redemptions
    ADD CONSTRAINT coupon_redemptions_coupon_id_user_id_key UNIQUE (coupon_id, user_id);


--
-- Name: coupon_redemptions coupon_redemptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coupon_redemptions
    ADD CONSTRAINT coupon_redemptions_pkey PRIMARY KEY (id);


--
-- Name: coupons coupons_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coupons
    ADD CONSTRAINT coupons_code_key UNIQUE (code);


--
-- Name: coupons coupons_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coupons
    ADD CONSTRAINT coupons_pkey PRIMARY KEY (id);


--
-- Name: deletion_requests deletion_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.deletion_requests
    ADD CONSTRAINT deletion_requests_pkey PRIMARY KEY (id);


--
-- Name: dynamic_attributes dynamic_attributes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dynamic_attributes
    ADD CONSTRAINT dynamic_attributes_pkey PRIMARY KEY (id);


--
-- Name: featured_ads_audit featured_ads_audit_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.featured_ads_audit
    ADD CONSTRAINT featured_ads_audit_pkey PRIMARY KEY (id);


--
-- Name: featured_ads featured_ads_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.featured_ads
    ADD CONSTRAINT featured_ads_pkey PRIMARY KEY (id);


--
-- Name: featured_ads_queue featured_ads_queue_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.featured_ads_queue
    ADD CONSTRAINT featured_ads_queue_pkey PRIMARY KEY (id);


--
-- Name: featured_daily_impressions featured_daily_impressions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.featured_daily_impressions
    ADD CONSTRAINT featured_daily_impressions_pkey PRIMARY KEY (featured_ad_id, placement, imp_date);


--
-- Name: form_field_options_v2 form_field_options_v2_field_id_option_value_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_field_options_v2
    ADD CONSTRAINT form_field_options_v2_field_id_option_value_key UNIQUE (field_id, option_value);


--
-- Name: form_field_options_v2 form_field_options_v2_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_field_options_v2
    ADD CONSTRAINT form_field_options_v2_pkey PRIMARY KEY (id);


--
-- Name: form_fields_v2 form_fields_v2_form_template_id_field_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_fields_v2
    ADD CONSTRAINT form_fields_v2_form_template_id_field_name_key UNIQUE (form_template_id, field_name);


--
-- Name: form_fields_v2 form_fields_v2_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_fields_v2
    ADD CONSTRAINT form_fields_v2_pkey PRIMARY KEY (id);


--
-- Name: form_templates_v2 form_templates_v2_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_templates_v2
    ADD CONSTRAINT form_templates_v2_name_key UNIQUE (name);


--
-- Name: form_templates_v2 form_templates_v2_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_templates_v2
    ADD CONSTRAINT form_templates_v2_pkey PRIMARY KEY (id);


--
-- Name: global_config global_config_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.global_config
    ADD CONSTRAINT global_config_key_key UNIQUE (key);


--
-- Name: global_config global_config_key_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.global_config
    ADD CONSTRAINT global_config_key_unique UNIQUE (key);


--
-- Name: global_config global_config_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.global_config
    ADD CONSTRAINT global_config_pkey PRIMARY KEY (id);


--
-- Name: global_settings global_settings_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.global_settings
    ADD CONSTRAINT global_settings_key_key UNIQUE (key);


--
-- Name: global_settings global_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.global_settings
    ADD CONSTRAINT global_settings_pkey PRIMARY KEY (id);


--
-- Name: hero_images hero_images_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hero_images
    ADD CONSTRAINT hero_images_pkey PRIMARY KEY (id);


--
-- Name: images images_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.images
    ADD CONSTRAINT images_pkey PRIMARY KEY (id);


--
-- Name: jobs_log jobs_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.jobs_log
    ADD CONSTRAINT jobs_log_pkey PRIMARY KEY (id);


--
-- Name: localities localities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.localities
    ADD CONSTRAINT localities_pkey PRIMARY KEY (id);


--
-- Name: localities localities_province_id_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.localities
    ADD CONSTRAINT localities_province_id_slug_key UNIQUE (province_id, slug);


--
-- Name: membership_plans membership_plans_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.membership_plans
    ADD CONSTRAINT membership_plans_pkey PRIMARY KEY (id);


--
-- Name: membership_plans membership_plans_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.membership_plans
    ADD CONSTRAINT membership_plans_slug_key UNIQUE (slug);


--
-- Name: models models_brand_id_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.models
    ADD CONSTRAINT models_brand_id_slug_key UNIQUE (brand_id, slug);


--
-- Name: models models_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.models
    ADD CONSTRAINT models_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: option_list_items option_list_items_list_id_value_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.option_list_items
    ADD CONSTRAINT option_list_items_list_id_value_key UNIQUE (list_id, value);


--
-- Name: option_list_items option_list_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.option_list_items
    ADD CONSTRAINT option_list_items_pkey PRIMARY KEY (id);


--
-- Name: option_lists option_lists_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.option_lists
    ADD CONSTRAINT option_lists_name_key UNIQUE (name);


--
-- Name: option_lists option_lists_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.option_lists
    ADD CONSTRAINT option_lists_pkey PRIMARY KEY (id);


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: profile_contacts profile_contacts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profile_contacts
    ADD CONSTRAINT profile_contacts_pkey PRIMARY KEY (id);


--
-- Name: profile_views profile_views_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profile_views
    ADD CONSTRAINT profile_views_pkey PRIMARY KEY (id);


--
-- Name: provinces provinces_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.provinces
    ADD CONSTRAINT provinces_name_key UNIQUE (name);


--
-- Name: provinces provinces_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.provinces
    ADD CONSTRAINT provinces_pkey PRIMARY KEY (id);


--
-- Name: provinces provinces_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.provinces
    ADD CONSTRAINT provinces_slug_key UNIQUE (slug);


--
-- Name: reseller_points_of_sale reseller_points_of_sale_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reseller_points_of_sale
    ADD CONSTRAINT reseller_points_of_sale_pkey PRIMARY KEY (id);


--
-- Name: search_analytics search_analytics_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.search_analytics
    ADD CONSTRAINT search_analytics_pkey PRIMARY KEY (id);


--
-- Name: site_settings site_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.site_settings
    ADD CONSTRAINT site_settings_pkey PRIMARY KEY (id);


--
-- Name: site_settings site_settings_setting_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.site_settings
    ADD CONSTRAINT site_settings_setting_key_key UNIQUE (setting_key);


--
-- Name: sources sources_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sources
    ADD CONSTRAINT sources_name_key UNIQUE (name);


--
-- Name: sources sources_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sources
    ADD CONSTRAINT sources_pkey PRIMARY KEY (id);


--
-- Name: subcategories subcategories_category_id_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subcategories
    ADD CONSTRAINT subcategories_category_id_name_key UNIQUE (category_id, name);


--
-- Name: subcategories subcategories_category_slug_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subcategories
    ADD CONSTRAINT subcategories_category_slug_unique UNIQUE (category_id, slug);


--
-- Name: subcategories subcategories_v2_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subcategories
    ADD CONSTRAINT subcategories_v2_pkey PRIMARY KEY (id);


--
-- Name: subcategory_attributes subcategory_attributes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subcategory_attributes
    ADD CONSTRAINT subcategory_attributes_pkey PRIMARY KEY (id);


--
-- Name: subcategory_attributes subcategory_attributes_subcategory_id_attribute_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subcategory_attributes
    ADD CONSTRAINT subcategory_attributes_subcategory_id_attribute_id_key UNIQUE (subcategory_id, attribute_id);


--
-- Name: subcategory_brands subcategory_brands_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subcategory_brands
    ADD CONSTRAINT subcategory_brands_pkey PRIMARY KEY (id);


--
-- Name: subcategory_brands subcategory_brands_subcategory_id_brand_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subcategory_brands
    ADD CONSTRAINT subcategory_brands_subcategory_id_brand_id_key UNIQUE (subcategory_id, brand_id);


--
-- Name: subscription_plans subscription_plans_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscription_plans
    ADD CONSTRAINT subscription_plans_name_key UNIQUE (name);


--
-- Name: subscription_plans subscription_plans_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscription_plans
    ADD CONSTRAINT subscription_plans_pkey PRIMARY KEY (id);


--
-- Name: system_config system_config_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_config
    ADD CONSTRAINT system_config_pkey PRIMARY KEY (key);


--
-- Name: catalogs unique_catalog_slug; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.catalogs
    ADD CONSTRAINT unique_catalog_slug UNIQUE (company_id, slug);


--
-- Name: attribute_groups unique_group_per_subcategory; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attribute_groups
    ADD CONSTRAINT unique_group_per_subcategory UNIQUE (subcategory_id, name);


--
-- Name: company_profiles unique_user_company; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.company_profiles
    ADD CONSTRAINT unique_user_company UNIQUE (user_id);


--
-- Name: chat_channels uq_channel_ad_buyer; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_channels
    ADD CONSTRAINT uq_channel_ad_buyer UNIQUE (ad_id, buyer_id);


--
-- Name: user_favorites user_favorites_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_favorites
    ADD CONSTRAINT user_favorites_pkey PRIMARY KEY (id);


--
-- Name: user_favorites user_favorites_user_id_ad_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_favorites
    ADD CONSTRAINT user_favorites_user_id_ad_id_key UNIQUE (user_id, ad_id);


--
-- Name: user_favorites user_favorites_user_id_subcategory_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_favorites
    ADD CONSTRAINT user_favorites_user_id_subcategory_id_key UNIQUE (user_id, subcategory_id);


--
-- Name: user_promo_claims user_promo_claims_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_promo_claims
    ADD CONSTRAINT user_promo_claims_pkey PRIMARY KEY (id);


--
-- Name: user_promo_claims user_promo_claims_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_promo_claims
    ADD CONSTRAINT user_promo_claims_unique UNIQUE (user_id, promo_code);


--
-- Name: user_wallets user_wallets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_wallets
    ADD CONSTRAINT user_wallets_pkey PRIMARY KEY (user_id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: wallet_transactions wallet_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wallet_transactions
    ADD CONSTRAINT wallet_transactions_pkey PRIMARY KEY (id);


--
-- Name: wizard_configs wizard_configs_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wizard_configs
    ADD CONSTRAINT wizard_configs_name_key UNIQUE (name);


--
-- Name: wizard_configs wizard_configs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wizard_configs
    ADD CONSTRAINT wizard_configs_pkey PRIMARY KEY (id);


--
-- Name: ads_seo_lookup; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ads_seo_lookup ON public.ads USING btree (category_id, subcategory_id, slug, short_id);


--
-- Name: ads_short_id_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ads_short_id_unique ON public.ads USING btree (short_id);


--
-- Name: ads_slug_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ads_slug_idx ON public.ads USING btree (slug);


--
-- Name: deletion_requests_user_pending_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX deletion_requests_user_pending_idx ON public.deletion_requests USING btree (user_id) WHERE (status = ANY (ARRAY['pending'::text, 'processing'::text]));


--
-- Name: idx_ad_images_ad_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ad_images_ad_id ON public.ad_images USING btree (ad_id);


--
-- Name: idx_ad_images_sort_order; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ad_images_sort_order ON public.ad_images USING btree (ad_id, sort_order);


--
-- Name: idx_ads_admin_listing; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ads_admin_listing ON public.ads USING btree (created_at DESC);


--
-- Name: idx_ads_attributes; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ads_attributes ON public.ads USING gin (attributes);


--
-- Name: idx_ads_brand; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ads_brand ON public.ads USING btree (brand_id);


--
-- Name: idx_ads_brand_model; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ads_brand_model ON public.ads USING btree (brand_id, model_id);


--
-- Name: idx_ads_business_profile; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ads_business_profile ON public.ads USING btree (business_profile_id);


--
-- Name: idx_ads_by_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ads_by_user ON public.ads USING btree (user_id, created_at DESC);


--
-- Name: idx_ads_cloned_from; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ads_cloned_from ON public.ads USING btree (cloned_from_ad_id);


--
-- Name: idx_ads_company; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ads_company ON public.ads USING btree (company_profile_id);


--
-- Name: idx_ads_draft_expires; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ads_draft_expires ON public.ads USING btree (draft_expires_at) WHERE ((status)::text = 'draft'::text);


--
-- Name: idx_ads_dynamic_fields; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ads_dynamic_fields ON public.ads USING gin (dynamic_fields);


--
-- Name: idx_ads_featured; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ads_featured ON public.ads USING btree (featured, category_id, featured_order) WHERE ((featured = true) AND ((status)::text = 'active'::text));


--
-- Name: idx_ads_featured_until; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ads_featured_until ON public.ads USING btree (featured_until) WHERE (featured_until IS NOT NULL);


--
-- Name: idx_ads_locality_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ads_locality_id ON public.ads USING btree (locality_id);


--
-- Name: idx_ads_location; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ads_location ON public.ads USING btree (province, city) WHERE ((status)::text = 'active'::text);


--
-- Name: idx_ads_model; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ads_model ON public.ads USING btree (model_id);


--
-- Name: idx_ads_price; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ads_price ON public.ads USING btree (price) WHERE ((status)::text = 'active'::text);


--
-- Name: idx_ads_price_negotiable; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ads_price_negotiable ON public.ads USING btree (price_negotiable) WHERE (price_negotiable = true);


--
-- Name: idx_ads_public_listing; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ads_public_listing ON public.ads USING btree (status, expires_at, created_at DESC) WHERE ((status)::text = 'active'::text);


--
-- Name: idx_ads_published_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ads_published_at ON public.ads USING btree (published_at DESC);


--
-- Name: idx_ads_search; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ads_search ON public.ads USING gin (search_vector);


--
-- Name: idx_ads_short_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ads_short_id ON public.ads USING btree (short_id);


--
-- Name: idx_ads_sitemap; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ads_sitemap ON public.ads USING btree (in_sitemap) WHERE (in_sitemap = true);


--
-- Name: idx_ads_slug; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ads_slug ON public.ads USING btree (slug);


--
-- Name: idx_ads_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ads_status ON public.ads USING btree (status, published_at DESC) WHERE ((status)::text = 'active'::text);


--
-- Name: idx_ads_status_approval; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ads_status_approval ON public.ads USING btree (status, approval_status);


--
-- Name: idx_ads_subcategory; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ads_subcategory ON public.ads USING btree (subcategory_id, status, published_at DESC);


--
-- Name: idx_ads_title; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ads_title ON public.ads USING btree (title);


--
-- Name: idx_ads_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ads_type ON public.ads USING btree (ad_type);


--
-- Name: idx_ads_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ads_user ON public.ads USING btree (user_id, status);


--
-- Name: idx_ads_year; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ads_year ON public.ads USING btree (year);


--
-- Name: idx_attr_options_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_attr_options_active ON public.attribute_options USING btree (attribute_id) WHERE (is_active = true);


--
-- Name: idx_attr_options_attribute; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_attr_options_attribute ON public.attribute_options USING btree (attribute_id, display_order);


--
-- Name: idx_attribute_groups_sort; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_attribute_groups_sort ON public.attribute_groups USING btree (subcategory_id, sort_order);


--
-- Name: idx_attribute_groups_subcategory; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_attribute_groups_subcategory ON public.attribute_groups USING btree (subcategory_id);


--
-- Name: idx_attributes_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_attributes_category ON public.dynamic_attributes USING btree (category_id);


--
-- Name: idx_attributes_filterable; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_attributes_filterable ON public.attributes USING btree (is_filterable) WHERE (is_filterable = true);


--
-- Name: idx_attributes_slug; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_attributes_slug ON public.attributes USING btree (slug);


--
-- Name: idx_attributes_subcategory; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_attributes_subcategory ON public.dynamic_attributes USING btree (subcategory_id);


--
-- Name: idx_attributes_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_attributes_type ON public.attributes USING btree (input_type);


--
-- Name: idx_banners_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_banners_active ON public.banners USING btree (is_active);


--
-- Name: idx_banners_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_banners_category ON public.banners USING btree (category);


--
-- Name: idx_banners_clean_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_banners_clean_active ON public.banners_clean USING btree (placement, category, is_active) WHERE (is_active = true);


--
-- Name: idx_banners_clean_expiration; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_banners_clean_expiration ON public.banners_clean USING btree (expires_at) WHERE ((is_active = true) AND (expires_at IS NOT NULL));


--
-- Name: idx_banners_device_target; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_banners_device_target ON public.banners USING btree (device_target);


--
-- Name: idx_banners_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_banners_type ON public.banners USING btree (type);


--
-- Name: idx_banners_type_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_banners_type_category ON public.banners USING btree (type, category) WHERE (is_active = true);


--
-- Name: idx_banners_type_device; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_banners_type_device ON public.banners USING btree (type, device_target) WHERE (is_active = true);


--
-- Name: idx_banners_type_device_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_banners_type_device_active ON public.banners USING btree (type, device_target, is_active);


--
-- Name: idx_bp_members_profile_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bp_members_profile_id ON public.business_profile_members USING btree (business_profile_id);


--
-- Name: idx_bp_members_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bp_members_user_id ON public.business_profile_members USING btree (user_id);


--
-- Name: idx_brands_slug; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_brands_slug ON public.brands USING btree (slug);


--
-- Name: idx_business_profiles_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_business_profiles_category ON public.business_profiles USING btree (category_id);


--
-- Name: idx_business_profiles_is_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_business_profiles_is_active ON public.business_profiles USING btree (is_active);


--
-- Name: idx_business_profiles_province; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_business_profiles_province ON public.business_profiles USING btree (province);


--
-- Name: idx_business_profiles_slug; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_business_profiles_slug ON public.business_profiles USING btree (slug) WHERE (is_active = true);


--
-- Name: idx_business_profiles_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_business_profiles_user_id ON public.business_profiles USING btree (user_id);


--
-- Name: idx_catalog_items_catalog; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_catalog_items_catalog ON public.catalog_items USING btree (catalog_id);


--
-- Name: idx_catalogs_company; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_catalogs_company ON public.catalogs USING btree (company_id);


--
-- Name: idx_categories_slug; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_categories_slug ON public.categories USING btree (slug);


--
-- Name: idx_category_icons_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_category_icons_name ON public.category_icons USING btree (name);


--
-- Name: idx_category_types_page_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_category_types_page_type ON public.category_types USING btree (page_type);


--
-- Name: idx_category_types_slug; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_category_types_slug ON public.category_types USING btree (subcategory_id, slug);


--
-- Name: idx_category_types_subcategory; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_category_types_subcategory ON public.category_types USING btree (subcategory_id);


--
-- Name: idx_chat_channels_ad; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chat_channels_ad ON public.chat_channels USING btree (ad_id);


--
-- Name: idx_chat_channels_buyer; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chat_channels_buyer ON public.chat_channels USING btree (buyer_id, last_message_at DESC);


--
-- Name: idx_chat_channels_seller; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chat_channels_seller ON public.chat_channels USING btree (seller_id, last_message_at DESC);


--
-- Name: idx_chat_messages_channel; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chat_messages_channel ON public.chat_messages USING btree (channel_id, created_at);


--
-- Name: idx_chat_messages_unread; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chat_messages_unread ON public.chat_messages USING btree (channel_id, is_read) WHERE (is_read = false);


--
-- Name: idx_cms_footer_columns_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cms_footer_columns_active ON public.cms_footer_columns USING btree (is_active);


--
-- Name: idx_cms_footer_columns_order; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cms_footer_columns_order ON public.cms_footer_columns USING btree (display_order);


--
-- Name: idx_cms_footer_links_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cms_footer_links_active ON public.cms_footer_links USING btree (is_active);


--
-- Name: idx_cms_footer_links_column; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cms_footer_links_column ON public.cms_footer_links USING btree (column_id);


--
-- Name: idx_cms_footer_links_order; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cms_footer_links_order ON public.cms_footer_links USING btree (display_order);


--
-- Name: idx_cms_footer_singleton; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_cms_footer_singleton ON public.cms_footer USING btree ((true));


--
-- Name: idx_cms_header_singleton; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_cms_header_singleton ON public.cms_header USING btree ((true));


--
-- Name: idx_cms_hero_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cms_hero_active ON public.cms_hero_images USING btree (is_active);


--
-- Name: idx_cms_hero_order; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cms_hero_order ON public.cms_hero_images USING btree (display_order);


--
-- Name: idx_cms_nav_items_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cms_nav_items_active ON public.cms_nav_items USING btree (is_active);


--
-- Name: idx_cms_nav_items_order; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cms_nav_items_order ON public.cms_nav_items USING btree (display_order);


--
-- Name: idx_cms_search_singleton; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_cms_search_singleton ON public.cms_search_config USING btree ((true));


--
-- Name: idx_cms_social_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cms_social_active ON public.cms_social_media USING btree (is_active);


--
-- Name: idx_cms_social_order; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cms_social_order ON public.cms_social_media USING btree (display_order);


--
-- Name: idx_cms_stats_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cms_stats_active ON public.cms_stats USING btree (is_active);


--
-- Name: idx_cms_stats_order; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cms_stats_order ON public.cms_stats USING btree (display_order);


--
-- Name: idx_company_profiles_slug; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_company_profiles_slug ON public.company_profiles USING btree (slug);


--
-- Name: idx_company_profiles_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_company_profiles_user ON public.company_profiles USING btree (user_id);


--
-- Name: idx_contact_messages_ad; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contact_messages_ad ON public.contact_messages USING btree (ad_id);


--
-- Name: idx_contact_messages_ad_owner; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contact_messages_ad_owner ON public.contact_messages USING btree (ad_owner_id, created_at DESC);


--
-- Name: idx_contact_messages_is_read; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contact_messages_is_read ON public.contact_messages USING btree (ad_owner_id, is_read);


--
-- Name: idx_contact_messages_receiver; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contact_messages_receiver ON public.contact_messages USING btree (ad_owner_id, created_at DESC);


--
-- Name: idx_contact_messages_recipient_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contact_messages_recipient_status ON public.contact_messages USING btree (ad_owner_id, status, is_read, created_at DESC);


--
-- Name: idx_contact_messages_sender; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contact_messages_sender ON public.contact_messages USING btree (sender_user_id, created_at DESC);


--
-- Name: idx_contact_messages_sender_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contact_messages_sender_status ON public.contact_messages USING btree (sender_user_id, status, created_at DESC);


--
-- Name: idx_contact_notifications_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contact_notifications_user ON public.contact_notifications USING btree (user_id, is_read, created_at DESC);


--
-- Name: idx_coupon_invitations_coupon; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_coupon_invitations_coupon ON public.coupon_invitations USING btree (coupon_id);


--
-- Name: idx_coupon_invitations_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_coupon_invitations_email ON public.coupon_invitations USING btree (email);


--
-- Name: idx_coupon_invitations_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_coupon_invitations_status ON public.coupon_invitations USING btree (status);


--
-- Name: idx_coupon_invitations_token; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_coupon_invitations_token ON public.coupon_invitations USING btree (token);


--
-- Name: idx_coupon_redemptions_coupon; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_coupon_redemptions_coupon ON public.coupon_redemptions USING btree (coupon_id);


--
-- Name: idx_coupon_redemptions_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_coupon_redemptions_user ON public.coupon_redemptions USING btree (user_id);


--
-- Name: idx_coupons_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_coupons_active ON public.coupons USING btree (is_active, expires_at);


--
-- Name: idx_coupons_code; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_coupons_code ON public.coupons USING btree (code);


--
-- Name: idx_coupons_created_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_coupons_created_by ON public.coupons USING btree (created_by);


--
-- Name: idx_dynamic_attributes_filterable; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dynamic_attributes_filterable ON public.dynamic_attributes USING btree (category_id, subcategory_id, is_filterable) WHERE (is_filterable = true);


--
-- Name: idx_dynamic_attributes_group; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dynamic_attributes_group ON public.dynamic_attributes USING btree (group_id);


--
-- Name: idx_featured_ads_ad_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_featured_ads_ad_id ON public.featured_ads USING btree (ad_id);


--
-- Name: idx_featured_ads_ad_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_featured_ads_ad_status ON public.featured_ads USING btree (ad_id, status);


--
-- Name: idx_featured_ads_audit_action; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_featured_ads_audit_action ON public.featured_ads_audit USING btree (action);


--
-- Name: idx_featured_ads_audit_ad_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_featured_ads_audit_ad_id ON public.featured_ads_audit USING btree (ad_id);


--
-- Name: idx_featured_ads_audit_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_featured_ads_audit_created_at ON public.featured_ads_audit USING btree (created_at);


--
-- Name: idx_featured_ads_audit_featured_ad; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_featured_ads_audit_featured_ad ON public.featured_ads_audit USING btree (featured_ad_id);


--
-- Name: idx_featured_ads_audit_featured_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_featured_ads_audit_featured_id ON public.featured_ads_audit USING btree (featured_ad_id);


--
-- Name: idx_featured_ads_audit_performed_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_featured_ads_audit_performed_by ON public.featured_ads_audit USING btree (performed_by);


--
-- Name: idx_featured_ads_audit_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_featured_ads_audit_user_id ON public.featured_ads_audit USING btree (user_id);


--
-- Name: idx_featured_ads_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_featured_ads_category ON public.featured_ads USING btree (category_id);


--
-- Name: idx_featured_ads_category_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_featured_ads_category_id ON public.featured_ads USING btree (category_id);


--
-- Name: idx_featured_ads_expires; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_featured_ads_expires ON public.featured_ads USING btree (expires_at) WHERE ((status)::text = 'active'::text);


--
-- Name: idx_featured_ads_expires_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_featured_ads_expires_at ON public.featured_ads USING btree (expires_at);


--
-- Name: idx_featured_ads_is_manual; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_featured_ads_is_manual ON public.featured_ads USING btree (is_manual) WHERE (is_manual = true);


--
-- Name: idx_featured_ads_manual_activated_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_featured_ads_manual_activated_by ON public.featured_ads USING btree (manual_activated_by) WHERE (manual_activated_by IS NOT NULL);


--
-- Name: idx_featured_ads_placement; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_featured_ads_placement ON public.featured_ads USING btree (placement);


--
-- Name: idx_featured_ads_placement_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_featured_ads_placement_category ON public.featured_ads USING btree (placement, category_id);


--
-- Name: idx_featured_ads_placement_category_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_featured_ads_placement_category_status ON public.featured_ads USING btree (placement, category_id, status);


--
-- Name: idx_featured_ads_scheduled; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_featured_ads_scheduled ON public.featured_ads USING btree (scheduled_start) WHERE ((status)::text = 'pending'::text);


--
-- Name: idx_featured_ads_scheduled_start; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_featured_ads_scheduled_start ON public.featured_ads USING btree (scheduled_start);


--
-- Name: idx_featured_ads_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_featured_ads_status ON public.featured_ads USING btree (status);


--
-- Name: idx_featured_ads_subcategory; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_featured_ads_subcategory ON public.featured_ads USING btree (subcategory_id, tier, status);


--
-- Name: idx_featured_ads_tier_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_featured_ads_tier_category ON public.featured_ads USING btree (tier, category_id, status);


--
-- Name: idx_featured_ads_unique_active_placement; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_featured_ads_unique_active_placement ON public.featured_ads USING btree (ad_id, placement) WHERE ((status)::text = 'active'::text);


--
-- Name: idx_featured_ads_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_featured_ads_user ON public.featured_ads USING btree (user_id);


--
-- Name: idx_featured_ads_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_featured_ads_user_id ON public.featured_ads USING btree (user_id);


--
-- Name: idx_featured_ads_user_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_featured_ads_user_status ON public.featured_ads USING btree (user_id, status);


--
-- Name: idx_featured_daily_imp_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_featured_daily_imp_date ON public.featured_daily_impressions USING btree (imp_date, placement);


--
-- Name: idx_featured_queue_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_featured_queue_active ON public.featured_ads_queue USING btree (category_id, status) WHERE ((status)::text = ANY ((ARRAY['active'::character varying, 'scheduled'::character varying])::text[]));


--
-- Name: idx_featured_queue_ad; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_featured_queue_ad ON public.featured_ads_queue USING btree (ad_id);


--
-- Name: idx_featured_queue_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_featured_queue_category ON public.featured_ads_queue USING btree (category_id);


--
-- Name: idx_featured_queue_dates; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_featured_queue_dates ON public.featured_ads_queue USING btree (scheduled_start, scheduled_end);


--
-- Name: idx_featured_queue_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_featured_queue_status ON public.featured_ads_queue USING btree (status);


--
-- Name: idx_featured_queue_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_featured_queue_user ON public.featured_ads_queue USING btree (user_id);


--
-- Name: idx_global_config_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_global_config_category ON public.global_config USING btree (category);


--
-- Name: idx_global_config_key; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_global_config_key ON public.global_config USING btree (key);


--
-- Name: idx_global_settings_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_global_settings_category ON public.global_settings USING btree (category);


--
-- Name: idx_global_settings_key; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_global_settings_key ON public.global_settings USING btree (key);


--
-- Name: idx_hero_images_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_hero_images_active ON public.hero_images USING btree (is_active);


--
-- Name: idx_hero_images_active_order; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_hero_images_active_order ON public.hero_images USING btree (is_active, display_order) WHERE (is_active = true);


--
-- Name: idx_hero_images_order; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_hero_images_order ON public.hero_images USING btree (display_order);


--
-- Name: idx_images_hash; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_images_hash ON public.images USING btree (hash);


--
-- Name: idx_images_is_optimized; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_images_is_optimized ON public.images USING btree (is_optimized);


--
-- Name: idx_images_listing_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_images_listing_id ON public.images USING btree (listing_id);


--
-- Name: idx_images_listing_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_images_listing_type ON public.images USING btree (listing_type);


--
-- Name: idx_images_perceptual_hash; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_images_perceptual_hash ON public.images USING btree (perceptual_hash);


--
-- Name: idx_jobs_log_job_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_jobs_log_job_name ON public.jobs_log USING btree (job_name);


--
-- Name: idx_jobs_log_job_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_jobs_log_job_type ON public.jobs_log USING btree (job_type);


--
-- Name: idx_jobs_log_source_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_jobs_log_source_id ON public.jobs_log USING btree (source_id);


--
-- Name: idx_jobs_log_started_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_jobs_log_started_at ON public.jobs_log USING btree (started_at DESC);


--
-- Name: idx_jobs_log_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_jobs_log_status ON public.jobs_log USING btree (status);


--
-- Name: idx_localities_province_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_localities_province_id ON public.localities USING btree (province_id) WHERE (is_active = true);


--
-- Name: idx_models_brand; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_models_brand ON public.models USING btree (brand_id);


--
-- Name: idx_models_production_years; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_models_production_years ON public.models USING btree (year_from, year_to);


--
-- Name: idx_models_slug; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_models_slug ON public.models USING btree (brand_id, slug);


--
-- Name: idx_models_specifications; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_models_specifications ON public.models USING gin (specifications);


--
-- Name: idx_moderation_log_ad_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_moderation_log_ad_id ON public.ads_moderation_log USING btree (ad_id);


--
-- Name: idx_notifications_user_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_user_created ON public.notifications USING btree (user_id, created_at DESC);


--
-- Name: idx_notifications_user_unread; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_user_unread ON public.notifications USING btree (user_id, is_read, created_at DESC);


--
-- Name: idx_option_list_items_list_order; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_option_list_items_list_order ON public.option_list_items USING btree (list_id, sort_order);


--
-- Name: idx_payments_completed; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payments_completed ON public.payments USING btree (completed_at DESC) WHERE ((status)::text = 'completed'::text);


--
-- Name: idx_payments_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payments_created ON public.payments USING btree (created_at DESC);


--
-- Name: idx_payments_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payments_status ON public.payments USING btree (status);


--
-- Name: idx_payments_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payments_type ON public.payments USING btree (payment_type);


--
-- Name: idx_payments_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payments_user ON public.payments USING btree (user_id);


--
-- Name: idx_popular_searches_query; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_popular_searches_query ON public.popular_searches USING btree (query);


--
-- Name: idx_pos_managed_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pos_managed_user ON public.reseller_points_of_sale USING btree (managed_user_id);


--
-- Name: idx_pos_revendedor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pos_revendedor ON public.reseller_points_of_sale USING btree (revendedor_id);


--
-- Name: idx_products_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_products_category ON public.products USING btree (category);


--
-- Name: idx_products_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_products_created_at ON public.products USING btree (created_at DESC);


--
-- Name: idx_products_is_sponsored; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_products_is_sponsored ON public.products USING btree (is_sponsored);


--
-- Name: idx_products_location; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_products_location ON public.products USING btree (location);


--
-- Name: idx_profile_contacts_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profile_contacts_created ON public.profile_contacts USING btree (created_at DESC);


--
-- Name: idx_profile_contacts_profile_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profile_contacts_profile_user ON public.profile_contacts USING btree (profile_user_id);


--
-- Name: idx_profile_contacts_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profile_contacts_status ON public.profile_contacts USING btree (status);


--
-- Name: idx_profile_views_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profile_views_created ON public.profile_views USING btree (created_at DESC);


--
-- Name: idx_profile_views_profile_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profile_views_profile_user ON public.profile_views USING btree (profile_user_id);


--
-- Name: idx_search_analytics_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_search_analytics_created_at ON public.search_analytics USING btree (created_at DESC);


--
-- Name: idx_search_analytics_query; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_search_analytics_query ON public.search_analytics USING btree (query);


--
-- Name: idx_search_analytics_session; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_search_analytics_session ON public.search_analytics USING btree (session_id);


--
-- Name: idx_search_analytics_source; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_search_analytics_source ON public.search_analytics USING btree (source);


--
-- Name: idx_site_settings_key; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_site_settings_key ON public.site_settings USING btree (setting_key);


--
-- Name: idx_site_settings_section; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_site_settings_section ON public.site_settings USING btree (section);


--
-- Name: idx_sources_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sources_active ON public.sources USING btree (is_active);


--
-- Name: idx_sources_last_scraped; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sources_last_scraped ON public.sources USING btree (last_scraped_at);


--
-- Name: idx_sources_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sources_type ON public.sources USING btree (scraper_type);


--
-- Name: idx_subcat_attrs_required; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_subcat_attrs_required ON public.subcategory_attributes USING btree (subcategory_id) WHERE (is_required = true);


--
-- Name: idx_subcat_attrs_subcat; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_subcat_attrs_subcat ON public.subcategory_attributes USING btree (subcategory_id, display_order);


--
-- Name: idx_subcategories_parent_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_subcategories_parent_id ON public.subcategories USING btree (parent_id);


--
-- Name: idx_subcategories_slug; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_subcategories_slug ON public.subcategories USING btree (category_id, slug);


--
-- Name: idx_subcategory_brands_brand; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_subcategory_brands_brand ON public.subcategory_brands USING btree (brand_id);


--
-- Name: idx_subcategory_brands_subcategory; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_subcategory_brands_subcategory ON public.subcategory_brands USING btree (subcategory_id);


--
-- Name: idx_template_fields_sort; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_template_fields_sort ON public.attribute_template_fields USING btree (template_id, sort_order);


--
-- Name: idx_template_fields_template; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_template_fields_template ON public.attribute_template_fields USING btree (template_id);


--
-- Name: idx_templates_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_templates_active ON public.attribute_templates USING btree (is_active);


--
-- Name: idx_templates_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_templates_category ON public.attribute_templates USING btree (category_id);


--
-- Name: idx_templates_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_templates_name ON public.attribute_templates USING btree (name);


--
-- Name: idx_templates_subcategory; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_templates_subcategory ON public.attribute_templates USING btree (subcategory_id);


--
-- Name: idx_types_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_types_category ON public.category_types USING btree (category_id);


--
-- Name: idx_types_subcategory; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_types_subcategory ON public.category_types USING btree (subcategory_id);


--
-- Name: idx_user_favorites_subcategory; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_favorites_subcategory ON public.user_favorites USING btree (subcategory_id) WHERE (subcategory_id IS NOT NULL);


--
-- Name: idx_user_favorites_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_favorites_user ON public.user_favorites USING btree (user_id);


--
-- Name: idx_user_promo_claims_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_promo_claims_user ON public.user_promo_claims USING btree (user_id);


--
-- Name: idx_user_wallets_currency; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_wallets_currency ON public.user_wallets USING btree (currency);


--
-- Name: idx_users_activity; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_activity ON public.users USING btree (activity) WHERE (activity IS NOT NULL);


--
-- Name: idx_users_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_created_at ON public.users USING btree (created_at DESC);


--
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_email ON public.users USING btree (email);


--
-- Name: idx_users_email_verified; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_email_verified ON public.users USING btree (email_verified);


--
-- Name: idx_users_mobile; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_mobile ON public.users USING btree (mobile) WHERE (mobile IS NOT NULL);


--
-- Name: idx_users_mobile_verified_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_users_mobile_verified_unique ON public.users USING btree (mobile) WHERE ((mobile IS NOT NULL) AND (mobile_verified = true));


--
-- Name: idx_users_province; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_province ON public.users USING btree (province);


--
-- Name: idx_users_role; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_role ON public.users USING btree (role);


--
-- Name: idx_users_subscription_plan; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_subscription_plan ON public.users USING btree (subscription_plan_id) WHERE (subscription_plan_id IS NOT NULL);


--
-- Name: idx_users_verification_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_verification_status ON public.users USING btree (verification_status, user_type) WHERE (user_type = 'empresa'::text);


--
-- Name: idx_wallet_tx_bucket; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_wallet_tx_bucket ON public.wallet_transactions USING btree (bucket);


--
-- Name: idx_wallet_tx_source; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_wallet_tx_source ON public.wallet_transactions USING btree (source);


--
-- Name: idx_wallet_tx_user_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_wallet_tx_user_created ON public.wallet_transactions USING btree (user_id, created_at DESC);


--
-- Name: featured_slots_summary _RETURN; Type: RULE; Schema: public; Owner: -
--

CREATE OR REPLACE VIEW public.featured_slots_summary WITH (security_invoker='on') AS
 SELECT c.id AS category_id,
    c.display_name AS category_name,
    count(*) FILTER (WHERE ((faq.status)::text = 'active'::text)) AS active_count,
    count(*) FILTER (WHERE ((faq.status)::text = 'scheduled'::text)) AS scheduled_count,
    count(*) FILTER (WHERE ((faq.status)::text = 'queued'::text)) AS queued_count,
    ( SELECT public.get_setting_int('featured_max_per_category'::character varying) AS get_setting_int) AS max_slots,
    (( SELECT public.get_setting_int('featured_max_per_category'::character varying) AS get_setting_int) - count(*) FILTER (WHERE ((faq.status)::text = 'active'::text))) AS available_slots
   FROM (public.categories c
     LEFT JOIN public.featured_ads_queue faq ON (((faq.category_id = c.id) AND ((faq.status)::text = ANY ((ARRAY['active'::character varying, 'scheduled'::character varying, 'queued'::character varying])::text[])))))
  WHERE (c.is_active = true)
  GROUP BY c.id, c.display_name
  ORDER BY c.sort_order;


--
-- Name: ads ads_search_update; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER ads_search_update BEFORE INSERT OR UPDATE OF title, description, province, city ON public.ads FOR EACH ROW EXECUTE FUNCTION public.update_ads_search_vector();


--
-- Name: contact_messages check_recipient_contact_limit; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER check_recipient_contact_limit AFTER INSERT ON public.contact_messages FOR EACH ROW EXECUTE FUNCTION public.check_recipient_limit();


--
-- Name: deletion_requests deletion_requests_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER deletion_requests_updated_at BEFORE UPDATE ON public.deletion_requests FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: contact_messages enforce_contact_send_limit; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER enforce_contact_send_limit BEFORE INSERT ON public.contact_messages FOR EACH ROW EXECUTE FUNCTION public.validate_contact_send_limit();


--
-- Name: business_profile_members enforce_max_companies; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER enforce_max_companies BEFORE INSERT ON public.business_profile_members FOR EACH ROW EXECUTE FUNCTION public.check_max_companies_per_user();


--
-- Name: featured_ads featured_ads_audit_auto; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER featured_ads_audit_auto AFTER INSERT OR UPDATE ON public.featured_ads FOR EACH ROW EXECUTE FUNCTION public.featured_ads_audit_trigger();


--
-- Name: business_profiles set_business_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_business_profiles_updated_at BEFORE UPDATE ON public.business_profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: jobs_log set_execution_time; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_execution_time BEFORE UPDATE OF finished_at ON public.jobs_log FOR EACH ROW EXECUTE FUNCTION public.calculate_execution_time();


--
-- Name: hero_images set_hero_images_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_hero_images_updated_at BEFORE UPDATE ON public.hero_images FOR EACH ROW EXECUTE FUNCTION public.update_hero_images_updated_at();


--
-- Name: images set_images_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_images_updated_at BEFORE UPDATE ON public.images FOR EACH ROW EXECUTE FUNCTION public.update_images_updated_at();


--
-- Name: sources set_sources_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_sources_updated_at BEFORE UPDATE ON public.sources FOR EACH ROW EXECUTE FUNCTION public.update_sources_updated_at();


--
-- Name: ads tr_generate_ad_slug; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tr_generate_ad_slug BEFORE INSERT OR UPDATE ON public.ads FOR EACH ROW EXECUTE FUNCTION public.trigger_generate_ad_slug();


--
-- Name: ads trg_auto_approve_superadmin; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_auto_approve_superadmin BEFORE INSERT OR UPDATE ON public.ads FOR EACH ROW EXECUTE FUNCTION public.auto_approve_superadmin_ads();


--
-- Name: banners_clean trg_banners_clean_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_banners_clean_updated_at BEFORE UPDATE ON public.banners_clean FOR EACH ROW EXECUTE FUNCTION public.update_banners_clean_updated_at();


--
-- Name: banners trg_check_featured; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_check_featured BEFORE UPDATE ON public.banners FOR EACH ROW EXECUTE FUNCTION public.check_at_least_one_featured();


--
-- Name: cms_header trg_cms_header_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_cms_header_updated BEFORE UPDATE ON public.cms_header FOR EACH ROW EXECUTE FUNCTION public.update_cms_header_timestamp();


--
-- Name: featured_ads trg_featured_ads_audit; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_featured_ads_audit AFTER UPDATE ON public.featured_ads FOR EACH ROW EXECUTE FUNCTION public.trigger_featured_ads_audit();


--
-- Name: chat_messages trg_mask_chat_content; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_mask_chat_content BEFORE INSERT ON public.chat_messages FOR EACH ROW EXECUTE FUNCTION public.mask_sensitive_chat_content();


--
-- Name: chat_messages trg_notify_chat_message; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_notify_chat_message AFTER INSERT ON public.chat_messages FOR EACH ROW EXECUTE FUNCTION public.notify_chat_message_received();


--
-- Name: contact_messages trg_notify_new_contact; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_notify_new_contact AFTER INSERT ON public.contact_messages FOR EACH ROW WHEN ((new.ad_owner_id IS NOT NULL)) EXECUTE FUNCTION public.trg_fn_notify_new_contact();


--
-- Name: ads trg_notify_subcategory_followers; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_notify_subcategory_followers AFTER INSERT OR UPDATE OF status ON public.ads FOR EACH ROW EXECUTE FUNCTION public.trg_fn_notify_subcategory_followers();


--
-- Name: contact_messages trg_set_thread_id; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_set_thread_id BEFORE INSERT ON public.contact_messages FOR EACH ROW EXECUTE FUNCTION public.set_thread_id_on_root_message();


--
-- Name: chat_messages trg_update_channel_on_message; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_update_channel_on_message AFTER INSERT ON public.chat_messages FOR EACH ROW EXECUTE FUNCTION public.update_channel_on_new_message();


--
-- Name: coupons trg_update_coupons_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_update_coupons_updated_at BEFORE UPDATE ON public.coupons FOR EACH ROW EXECUTE FUNCTION public.update_coupons_updated_at();


--
-- Name: users trg_update_profile_completion; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_update_profile_completion BEFORE INSERT OR UPDATE OF email_verified, mobile, full_name, province, avatar_url ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_profile_completion();


--
-- Name: user_wallets trg_user_wallets_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_user_wallets_updated_at BEFORE UPDATE ON public.user_wallets FOR EACH ROW EXECUTE FUNCTION public.update_user_wallets_updated_at();


--
-- Name: payments trigger_activate_subscription; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_activate_subscription AFTER UPDATE ON public.payments FOR EACH ROW WHEN ((((new.status)::text = 'completed'::text) AND ((old.status)::text <> 'completed'::text))) EXECUTE FUNCTION public.activate_subscription_on_payment();


--
-- Name: attribute_groups trigger_attribute_groups_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_attribute_groups_updated_at BEFORE UPDATE ON public.attribute_groups FOR EACH ROW EXECUTE FUNCTION public.update_attribute_groups_updated_at();


--
-- Name: ads trigger_auto_expire_featured; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_auto_expire_featured BEFORE UPDATE ON public.ads FOR EACH ROW EXECUTE FUNCTION public.auto_expire_featured_ads();


--
-- Name: ads trigger_auto_sitemap; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_auto_sitemap BEFORE INSERT OR UPDATE OF is_premium, featured ON public.ads FOR EACH ROW EXECUTE FUNCTION public.auto_sitemap_for_premium();


--
-- Name: ads trigger_clean_price_decimals; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_clean_price_decimals BEFORE INSERT OR UPDATE ON public.ads FOR EACH ROW EXECUTE FUNCTION public.clean_price_decimals();


--
-- Name: featured_ads trigger_featured_ads_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_featured_ads_updated BEFORE UPDATE ON public.featured_ads FOR EACH ROW EXECUTE FUNCTION public.update_featured_ads_timestamp();


--
-- Name: featured_ads_queue trigger_featured_queue_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_featured_queue_updated BEFORE UPDATE ON public.featured_ads_queue FOR EACH ROW EXECUTE FUNCTION public.update_featured_queue_timestamp();


--
-- Name: global_settings trigger_global_settings_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_global_settings_updated BEFORE UPDATE ON public.global_settings FOR EACH ROW EXECUTE FUNCTION public.update_global_settings_timestamp();


--
-- Name: payments trigger_payment_receipt; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_payment_receipt BEFORE UPDATE ON public.payments FOR EACH ROW WHEN ((((new.status)::text = 'completed'::text) AND ((old.status)::text <> 'completed'::text))) EXECUTE FUNCTION public.generate_payment_receipt_number();


--
-- Name: payments trigger_payments_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_payments_updated BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.update_payments_timestamp();


--
-- Name: ads trigger_set_featured_order; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_set_featured_order BEFORE UPDATE OF featured ON public.ads FOR EACH ROW EXECUTE FUNCTION public.set_featured_order();


--
-- Name: ads trigger_sync_ad_category_names; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_sync_ad_category_names BEFORE INSERT OR UPDATE OF category_id, subcategory_id ON public.ads FOR EACH ROW EXECUTE FUNCTION public.sync_ad_category_names();


--
-- Name: featured_ads_queue trigger_sync_ad_featured; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_sync_ad_featured AFTER UPDATE ON public.featured_ads_queue FOR EACH ROW EXECUTE FUNCTION public.sync_ad_featured_status();


--
-- Name: banners trigger_update_banners_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_banners_updated_at BEFORE UPDATE ON public.banners FOR EACH ROW EXECUTE FUNCTION public.update_banners_updated_at();


--
-- Name: users trigger_update_full_name; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_full_name BEFORE INSERT OR UPDATE OF first_name, last_name ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_full_name();


--
-- Name: profile_contacts trigger_update_profile_contacts_count; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_profile_contacts_count AFTER INSERT ON public.profile_contacts FOR EACH ROW EXECUTE FUNCTION public.update_profile_contacts_count();


--
-- Name: site_settings trigger_update_site_settings_timestamp; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_site_settings_timestamp BEFORE UPDATE ON public.site_settings FOR EACH ROW EXECUTE FUNCTION public.update_site_settings_timestamp();


--
-- Name: attribute_template_fields trigger_update_template_fields_timestamp; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_template_fields_timestamp BEFORE UPDATE ON public.attribute_template_fields FOR EACH ROW EXECUTE FUNCTION public.update_attribute_templates_updated_at();


--
-- Name: attribute_templates trigger_update_templates_timestamp; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_templates_timestamp BEFORE UPDATE ON public.attribute_templates FOR EACH ROW EXECUTE FUNCTION public.update_attribute_templates_updated_at();


--
-- Name: users trigger_users_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_users_updated_at();


--
-- Name: brands update_brands_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_brands_updated_at BEFORE UPDATE ON public.brands FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: category_types update_category_types_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_category_types_updated_at BEFORE UPDATE ON public.category_types FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: cms_footer_columns update_cms_footer_columns_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_cms_footer_columns_updated_at BEFORE UPDATE ON public.cms_footer_columns FOR EACH ROW EXECUTE FUNCTION public.update_cms_updated_at();


--
-- Name: cms_footer_links update_cms_footer_links_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_cms_footer_links_updated_at BEFORE UPDATE ON public.cms_footer_links FOR EACH ROW EXECUTE FUNCTION public.update_cms_updated_at();


--
-- Name: cms_footer update_cms_footer_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_cms_footer_updated_at BEFORE UPDATE ON public.cms_footer FOR EACH ROW EXECUTE FUNCTION public.update_cms_updated_at();


--
-- Name: cms_header update_cms_header_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_cms_header_updated_at BEFORE UPDATE ON public.cms_header FOR EACH ROW EXECUTE FUNCTION public.update_cms_updated_at();


--
-- Name: cms_hero_images update_cms_hero_images_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_cms_hero_images_updated_at BEFORE UPDATE ON public.cms_hero_images FOR EACH ROW EXECUTE FUNCTION public.update_cms_updated_at();


--
-- Name: cms_nav_items update_cms_nav_items_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_cms_nav_items_updated_at BEFORE UPDATE ON public.cms_nav_items FOR EACH ROW EXECUTE FUNCTION public.update_cms_updated_at();


--
-- Name: cms_search_config update_cms_search_config_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_cms_search_config_updated_at BEFORE UPDATE ON public.cms_search_config FOR EACH ROW EXECUTE FUNCTION public.update_cms_updated_at();


--
-- Name: cms_social_media update_cms_social_media_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_cms_social_media_updated_at BEFORE UPDATE ON public.cms_social_media FOR EACH ROW EXECUTE FUNCTION public.update_cms_updated_at();


--
-- Name: cms_stats update_cms_stats_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_cms_stats_updated_at BEFORE UPDATE ON public.cms_stats FOR EACH ROW EXECUTE FUNCTION public.update_cms_updated_at();


--
-- Name: models update_models_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_models_updated_at BEFORE UPDATE ON public.models FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: products update_products_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: users update_users_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: ads ads_brand_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ads
    ADD CONSTRAINT ads_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brands(id);


--
-- Name: ads ads_business_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ads
    ADD CONSTRAINT ads_business_profile_id_fkey FOREIGN KEY (business_profile_id) REFERENCES public.business_profiles(id) ON DELETE SET NULL;


--
-- Name: ads ads_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ads
    ADD CONSTRAINT ads_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id);


--
-- Name: ads ads_category_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ads
    ADD CONSTRAINT ads_category_type_id_fkey FOREIGN KEY (category_type_id) REFERENCES public.category_types(id);


--
-- Name: ads ads_cloned_from_ad_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ads
    ADD CONSTRAINT ads_cloned_from_ad_id_fkey FOREIGN KEY (cloned_from_ad_id) REFERENCES public.ads(id) ON DELETE SET NULL;


--
-- Name: ads ads_company_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ads
    ADD CONSTRAINT ads_company_profile_id_fkey FOREIGN KEY (company_profile_id) REFERENCES public.company_profiles(id);


--
-- Name: ads ads_locality_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ads
    ADD CONSTRAINT ads_locality_id_fkey FOREIGN KEY (locality_id) REFERENCES public.localities(id) ON DELETE SET NULL;


--
-- Name: ads ads_model_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ads
    ADD CONSTRAINT ads_model_id_fkey FOREIGN KEY (model_id) REFERENCES public.models(id);


--
-- Name: ads_moderation_log ads_moderation_log_moderator_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ads_moderation_log
    ADD CONSTRAINT ads_moderation_log_moderator_id_fkey FOREIGN KEY (moderator_id) REFERENCES auth.users(id);


--
-- Name: ads ads_sitemap_added_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ads
    ADD CONSTRAINT ads_sitemap_added_by_fkey FOREIGN KEY (sitemap_added_by) REFERENCES public.users(id);


--
-- Name: ads ads_subcategory_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ads
    ADD CONSTRAINT ads_subcategory_id_fkey FOREIGN KEY (subcategory_id) REFERENCES public.subcategories(id);


--
-- Name: ads ads_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ads
    ADD CONSTRAINT ads_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: attribute_groups attribute_groups_subcategory_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attribute_groups
    ADD CONSTRAINT attribute_groups_subcategory_id_fkey FOREIGN KEY (subcategory_id) REFERENCES public.subcategories(id) ON DELETE CASCADE;


--
-- Name: attribute_options attribute_options_attribute_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attribute_options
    ADD CONSTRAINT attribute_options_attribute_id_fkey FOREIGN KEY (attribute_id) REFERENCES public.attributes(id) ON DELETE CASCADE;


--
-- Name: attribute_template_fields attribute_template_fields_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attribute_template_fields
    ADD CONSTRAINT attribute_template_fields_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.attribute_templates(id) ON DELETE CASCADE;


--
-- Name: attribute_templates attribute_templates_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attribute_templates
    ADD CONSTRAINT attribute_templates_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE CASCADE;


--
-- Name: attribute_templates attribute_templates_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attribute_templates
    ADD CONSTRAINT attribute_templates_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: attribute_templates attribute_templates_subcategory_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attribute_templates
    ADD CONSTRAINT attribute_templates_subcategory_id_fkey FOREIGN KEY (subcategory_id) REFERENCES public.subcategories(id) ON DELETE SET NULL;


--
-- Name: business_profile_members business_profile_members_business_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.business_profile_members
    ADD CONSTRAINT business_profile_members_business_profile_id_fkey FOREIGN KEY (business_profile_id) REFERENCES public.business_profiles(id) ON DELETE CASCADE;


--
-- Name: business_profile_members business_profile_members_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.business_profile_members
    ADD CONSTRAINT business_profile_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: business_profiles business_profiles_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.business_profiles
    ADD CONSTRAINT business_profiles_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE SET NULL;


--
-- Name: business_profiles business_profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.business_profiles
    ADD CONSTRAINT business_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: business_profiles business_profiles_verified_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.business_profiles
    ADD CONSTRAINT business_profiles_verified_by_fkey FOREIGN KEY (verified_by) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: catalog_items catalog_items_catalog_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.catalog_items
    ADD CONSTRAINT catalog_items_catalog_id_fkey FOREIGN KEY (catalog_id) REFERENCES public.catalogs(id) ON DELETE CASCADE;


--
-- Name: catalogs catalogs_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.catalogs
    ADD CONSTRAINT catalogs_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.company_profiles(id) ON DELETE CASCADE;


--
-- Name: category_types category_types_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.category_types
    ADD CONSTRAINT category_types_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE CASCADE;


--
-- Name: category_types category_types_subcategory_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.category_types
    ADD CONSTRAINT category_types_subcategory_id_fkey FOREIGN KEY (subcategory_id) REFERENCES public.subcategories(id) ON DELETE CASCADE;


--
-- Name: chat_channels chat_channels_ad_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_channels
    ADD CONSTRAINT chat_channels_ad_id_fkey FOREIGN KEY (ad_id) REFERENCES public.ads(id) ON DELETE CASCADE;


--
-- Name: chat_channels chat_channels_buyer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_channels
    ADD CONSTRAINT chat_channels_buyer_id_fkey FOREIGN KEY (buyer_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: chat_channels chat_channels_seller_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_channels
    ADD CONSTRAINT chat_channels_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: chat_messages chat_messages_channel_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_channel_id_fkey FOREIGN KEY (channel_id) REFERENCES public.chat_channels(id) ON DELETE CASCADE;


--
-- Name: chat_messages chat_messages_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: cms_footer_links cms_footer_links_column_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cms_footer_links
    ADD CONSTRAINT cms_footer_links_column_id_fkey FOREIGN KEY (column_id) REFERENCES public.cms_footer_columns(id) ON DELETE CASCADE;


--
-- Name: company_profiles company_profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.company_profiles
    ADD CONSTRAINT company_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: contact_messages contact_messages_ad_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contact_messages
    ADD CONSTRAINT contact_messages_ad_owner_id_fkey FOREIGN KEY (ad_owner_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: contact_messages contact_messages_parent_message_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contact_messages
    ADD CONSTRAINT contact_messages_parent_message_id_fkey FOREIGN KEY (parent_message_id) REFERENCES public.contact_messages(id);


--
-- Name: contact_messages contact_messages_sender_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contact_messages
    ADD CONSTRAINT contact_messages_sender_user_id_fkey FOREIGN KEY (sender_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: contact_notifications contact_notifications_contact_message_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contact_notifications
    ADD CONSTRAINT contact_notifications_contact_message_id_fkey FOREIGN KEY (contact_message_id) REFERENCES public.contact_messages(id) ON DELETE CASCADE;


--
-- Name: contact_notifications contact_notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contact_notifications
    ADD CONSTRAINT contact_notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: coupon_invitations coupon_invitations_coupon_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coupon_invitations
    ADD CONSTRAINT coupon_invitations_coupon_id_fkey FOREIGN KEY (coupon_id) REFERENCES public.coupons(id) ON DELETE CASCADE;


--
-- Name: coupon_invitations coupon_invitations_invited_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coupon_invitations
    ADD CONSTRAINT coupon_invitations_invited_by_fkey FOREIGN KEY (invited_by) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: coupon_invitations coupon_invitations_used_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coupon_invitations
    ADD CONSTRAINT coupon_invitations_used_by_fkey FOREIGN KEY (used_by) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: coupon_redemptions coupon_redemptions_coupon_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coupon_redemptions
    ADD CONSTRAINT coupon_redemptions_coupon_id_fkey FOREIGN KEY (coupon_id) REFERENCES public.coupons(id) ON DELETE CASCADE;


--
-- Name: coupon_redemptions coupon_redemptions_membership_granted_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coupon_redemptions
    ADD CONSTRAINT coupon_redemptions_membership_granted_fkey FOREIGN KEY (membership_granted) REFERENCES public.membership_plans(id) ON DELETE SET NULL;


--
-- Name: coupon_redemptions coupon_redemptions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coupon_redemptions
    ADD CONSTRAINT coupon_redemptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: coupons coupons_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coupons
    ADD CONSTRAINT coupons_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: coupons coupons_membership_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coupons
    ADD CONSTRAINT coupons_membership_id_fkey FOREIGN KEY (membership_id) REFERENCES public.membership_plans(id) ON DELETE SET NULL;


--
-- Name: deletion_requests deletion_requests_processed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.deletion_requests
    ADD CONSTRAINT deletion_requests_processed_by_fkey FOREIGN KEY (processed_by) REFERENCES public.users(id);


--
-- Name: deletion_requests deletion_requests_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.deletion_requests
    ADD CONSTRAINT deletion_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: dynamic_attributes dynamic_attributes_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dynamic_attributes
    ADD CONSTRAINT dynamic_attributes_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE CASCADE;


--
-- Name: dynamic_attributes dynamic_attributes_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dynamic_attributes
    ADD CONSTRAINT dynamic_attributes_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.attribute_groups(id) ON DELETE SET NULL;


--
-- Name: dynamic_attributes dynamic_attributes_subcategory_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dynamic_attributes
    ADD CONSTRAINT dynamic_attributes_subcategory_id_fkey FOREIGN KEY (subcategory_id) REFERENCES public.subcategories(id) ON DELETE CASCADE;


--
-- Name: dynamic_attributes dynamic_attributes_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dynamic_attributes
    ADD CONSTRAINT dynamic_attributes_type_id_fkey FOREIGN KEY (type_id) REFERENCES public.category_types(id) ON DELETE CASCADE;


--
-- Name: featured_ads featured_ads_ad_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.featured_ads
    ADD CONSTRAINT featured_ads_ad_id_fkey FOREIGN KEY (ad_id) REFERENCES public.ads(id) ON DELETE CASCADE;


--
-- Name: featured_ads_audit featured_ads_audit_ad_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.featured_ads_audit
    ADD CONSTRAINT featured_ads_audit_ad_id_fkey FOREIGN KEY (ad_id) REFERENCES public.ads(id) ON DELETE SET NULL;


--
-- Name: featured_ads_audit featured_ads_audit_featured_ad_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.featured_ads_audit
    ADD CONSTRAINT featured_ads_audit_featured_ad_id_fkey FOREIGN KEY (featured_ad_id) REFERENCES public.featured_ads(id) ON DELETE CASCADE;


--
-- Name: featured_ads_audit featured_ads_audit_performed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.featured_ads_audit
    ADD CONSTRAINT featured_ads_audit_performed_by_fkey FOREIGN KEY (performed_by) REFERENCES public.users(id);


--
-- Name: featured_ads_audit featured_ads_audit_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.featured_ads_audit
    ADD CONSTRAINT featured_ads_audit_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: featured_ads featured_ads_cancelled_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.featured_ads
    ADD CONSTRAINT featured_ads_cancelled_by_fkey FOREIGN KEY (cancelled_by) REFERENCES public.users(id);


--
-- Name: featured_ads featured_ads_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.featured_ads
    ADD CONSTRAINT featured_ads_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id);


--
-- Name: featured_ads featured_ads_manual_activated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.featured_ads
    ADD CONSTRAINT featured_ads_manual_activated_by_fkey FOREIGN KEY (manual_activated_by) REFERENCES public.users(id);


--
-- Name: featured_ads_queue featured_ads_queue_ad_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.featured_ads_queue
    ADD CONSTRAINT featured_ads_queue_ad_id_fkey FOREIGN KEY (ad_id) REFERENCES public.ads(id) ON DELETE CASCADE;


--
-- Name: featured_ads_queue featured_ads_queue_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.featured_ads_queue
    ADD CONSTRAINT featured_ads_queue_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id);


--
-- Name: featured_ads_queue featured_ads_queue_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.featured_ads_queue
    ADD CONSTRAINT featured_ads_queue_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: featured_ads featured_ads_subcategory_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.featured_ads
    ADD CONSTRAINT featured_ads_subcategory_id_fkey FOREIGN KEY (subcategory_id) REFERENCES public.subcategories(id);


--
-- Name: featured_ads featured_ads_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.featured_ads
    ADD CONSTRAINT featured_ads_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: featured_daily_impressions featured_daily_impressions_featured_ad_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.featured_daily_impressions
    ADD CONSTRAINT featured_daily_impressions_featured_ad_id_fkey FOREIGN KEY (featured_ad_id) REFERENCES public.featured_ads(id) ON DELETE CASCADE;


--
-- Name: featured_ads_queue fk_featured_queue_payment; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.featured_ads_queue
    ADD CONSTRAINT fk_featured_queue_payment FOREIGN KEY (payment_id) REFERENCES public.payments(id);


--
-- Name: form_field_options_v2 form_field_options_v2_field_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_field_options_v2
    ADD CONSTRAINT form_field_options_v2_field_id_fkey FOREIGN KEY (field_id) REFERENCES public.form_fields_v2(id) ON DELETE CASCADE;


--
-- Name: form_fields_v2 form_fields_v2_form_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_fields_v2
    ADD CONSTRAINT form_fields_v2_form_template_id_fkey FOREIGN KEY (form_template_id) REFERENCES public.form_templates_v2(id) ON DELETE CASCADE;


--
-- Name: form_fields_v2 form_fields_v2_option_list_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_fields_v2
    ADD CONSTRAINT form_fields_v2_option_list_id_fkey FOREIGN KEY (option_list_id) REFERENCES public.option_lists(id) ON DELETE SET NULL;


--
-- Name: form_templates_v2 form_templates_v2_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_templates_v2
    ADD CONSTRAINT form_templates_v2_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE SET NULL;


--
-- Name: form_templates_v2 form_templates_v2_subcategory_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_templates_v2
    ADD CONSTRAINT form_templates_v2_subcategory_id_fkey FOREIGN KEY (subcategory_id) REFERENCES public.subcategories(id) ON DELETE SET NULL;


--
-- Name: global_settings global_settings_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.global_settings
    ADD CONSTRAINT global_settings_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(id);


--
-- Name: jobs_log jobs_log_source_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.jobs_log
    ADD CONSTRAINT jobs_log_source_id_fkey FOREIGN KEY (source_id) REFERENCES public.sources(id) ON DELETE SET NULL;


--
-- Name: localities localities_province_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.localities
    ADD CONSTRAINT localities_province_id_fkey FOREIGN KEY (province_id) REFERENCES public.provinces(id) ON DELETE CASCADE;


--
-- Name: models models_brand_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.models
    ADD CONSTRAINT models_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brands(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: option_list_items option_list_items_list_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.option_list_items
    ADD CONSTRAINT option_list_items_list_id_fkey FOREIGN KEY (list_id) REFERENCES public.option_lists(id) ON DELETE CASCADE;


--
-- Name: option_lists option_lists_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.option_lists
    ADD CONSTRAINT option_lists_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE SET NULL;


--
-- Name: payments payments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: profile_contacts profile_contacts_profile_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profile_contacts
    ADD CONSTRAINT profile_contacts_profile_user_id_fkey FOREIGN KEY (profile_user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: profile_contacts profile_contacts_sender_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profile_contacts
    ADD CONSTRAINT profile_contacts_sender_user_id_fkey FOREIGN KEY (sender_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: profile_contacts profile_contacts_source_ad_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profile_contacts
    ADD CONSTRAINT profile_contacts_source_ad_id_fkey FOREIGN KEY (source_ad_id) REFERENCES public.ads(id) ON DELETE SET NULL;


--
-- Name: profile_views profile_views_profile_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profile_views
    ADD CONSTRAINT profile_views_profile_user_id_fkey FOREIGN KEY (profile_user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: profile_views profile_views_source_ad_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profile_views
    ADD CONSTRAINT profile_views_source_ad_id_fkey FOREIGN KEY (source_ad_id) REFERENCES public.ads(id) ON DELETE SET NULL;


--
-- Name: profile_views profile_views_visitor_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profile_views
    ADD CONSTRAINT profile_views_visitor_user_id_fkey FOREIGN KEY (visitor_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: reseller_points_of_sale reseller_points_of_sale_managed_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reseller_points_of_sale
    ADD CONSTRAINT reseller_points_of_sale_managed_user_id_fkey FOREIGN KEY (managed_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: reseller_points_of_sale reseller_points_of_sale_revendedor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reseller_points_of_sale
    ADD CONSTRAINT reseller_points_of_sale_revendedor_id_fkey FOREIGN KEY (revendedor_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: site_settings site_settings_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.site_settings
    ADD CONSTRAINT site_settings_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: subcategories subcategories_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subcategories
    ADD CONSTRAINT subcategories_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE CASCADE;


--
-- Name: subcategories subcategories_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subcategories
    ADD CONSTRAINT subcategories_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.subcategories(id) ON DELETE CASCADE;


--
-- Name: subcategory_attributes subcategory_attributes_attribute_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subcategory_attributes
    ADD CONSTRAINT subcategory_attributes_attribute_id_fkey FOREIGN KEY (attribute_id) REFERENCES public.attributes(id) ON DELETE CASCADE;


--
-- Name: subcategory_brands subcategory_brands_brand_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subcategory_brands
    ADD CONSTRAINT subcategory_brands_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brands(id) ON DELETE CASCADE;


--
-- Name: subcategory_brands subcategory_brands_subcategory_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subcategory_brands
    ADD CONSTRAINT subcategory_brands_subcategory_id_fkey FOREIGN KEY (subcategory_id) REFERENCES public.subcategories(id) ON DELETE CASCADE;


--
-- Name: user_favorites user_favorites_ad_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_favorites
    ADD CONSTRAINT user_favorites_ad_id_fkey FOREIGN KEY (ad_id) REFERENCES public.ads(id) ON DELETE CASCADE;


--
-- Name: user_favorites user_favorites_subcategory_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_favorites
    ADD CONSTRAINT user_favorites_subcategory_id_fkey FOREIGN KEY (subcategory_id) REFERENCES public.subcategories(id) ON DELETE CASCADE;


--
-- Name: user_favorites user_favorites_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_favorites
    ADD CONSTRAINT user_favorites_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_promo_claims user_promo_claims_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_promo_claims
    ADD CONSTRAINT user_promo_claims_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_wallets user_wallets_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_wallets
    ADD CONSTRAINT user_wallets_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: users users_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: users users_subscription_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_subscription_plan_id_fkey FOREIGN KEY (subscription_plan_id) REFERENCES public.subscription_plans(id);


--
-- Name: users users_verified_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_verified_by_fkey FOREIGN KEY (verified_by) REFERENCES public.users(id);


--
-- Name: wallet_transactions wallet_transactions_featured_ad_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wallet_transactions
    ADD CONSTRAINT wallet_transactions_featured_ad_id_fkey FOREIGN KEY (featured_ad_id) REFERENCES public.featured_ads(id);


--
-- Name: wallet_transactions wallet_transactions_payment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wallet_transactions
    ADD CONSTRAINT wallet_transactions_payment_id_fkey FOREIGN KEY (payment_id) REFERENCES public.payments(id);


--
-- Name: wallet_transactions wallet_transactions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wallet_transactions
    ADD CONSTRAINT wallet_transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: wizard_configs wizard_configs_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wizard_configs
    ADD CONSTRAINT wizard_configs_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE SET NULL;


--
-- Name: contact_messages Ad owner can update messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Ad owner can update messages" ON public.contact_messages FOR UPDATE TO authenticated USING ((ad_owner_id = auth.uid())) WITH CHECK ((ad_owner_id = auth.uid()));


--
-- Name: attribute_templates Admin puede eliminar templates; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin puede eliminar templates" ON public.attribute_templates FOR DELETE USING ((auth.uid() IN ( SELECT users.id
   FROM public.users
  WHERE ((users.role)::text = ANY ((ARRAY['admin'::character varying, 'superadmin'::character varying])::text[])))));


--
-- Name: attribute_templates Admin/gestor puede crear templates; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin/gestor puede crear templates" ON public.attribute_templates FOR INSERT WITH CHECK ((auth.uid() IN ( SELECT users.id
   FROM public.users
  WHERE ((users.role)::text = ANY ((ARRAY['admin'::character varying, 'superadmin'::character varying, 'gestor_contenidos'::character varying])::text[])))));


--
-- Name: attribute_templates Admin/gestor puede editar templates; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin/gestor puede editar templates" ON public.attribute_templates FOR UPDATE USING ((auth.uid() IN ( SELECT users.id
   FROM public.users
  WHERE ((users.role)::text = ANY ((ARRAY['admin'::character varying, 'superadmin'::character varying, 'gestor_contenidos'::character varying])::text[])))));


--
-- Name: attribute_template_fields Admin/gestor puede gestionar fields; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin/gestor puede gestionar fields" ON public.attribute_template_fields USING ((auth.uid() IN ( SELECT users.id
   FROM public.users
  WHERE ((users.role)::text = ANY ((ARRAY['admin'::character varying, 'superadmin'::character varying, 'gestor_contenidos'::character varying])::text[])))));


--
-- Name: products Allow delete for authenticated users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow delete for authenticated users" ON public.products FOR DELETE USING (((auth.uid() IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.id = auth.uid()) AND ((users.role)::text = 'superadmin'::text))))));


--
-- Name: hero_images Allow delete hero images; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow delete hero images" ON public.hero_images FOR DELETE USING (true);


--
-- Name: hero_images Allow insert hero images; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow insert hero images" ON public.hero_images FOR INSERT WITH CHECK (true);


--
-- Name: subscription_plans Allow public read subscription_plans; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public read subscription_plans" ON public.subscription_plans FOR SELECT USING (true);


--
-- Name: hero_images Allow update hero images; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow update hero images" ON public.hero_images FOR UPDATE USING (true) WITH CHECK (true);


--
-- Name: profile_contacts Anyone can send profile contact; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can send profile contact" ON public.profile_contacts FOR INSERT WITH CHECK (true);


--
-- Name: featured_ads Anyone can view active featured ads; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view active featured ads" ON public.featured_ads FOR SELECT USING ((((status)::text = 'active'::text) AND (expires_at > now())));


--
-- Name: cms_footer_columns Anyone can view active footer columns; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view active footer columns" ON public.cms_footer_columns FOR SELECT USING ((is_active = true));


--
-- Name: cms_footer_links Anyone can view active footer links; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view active footer links" ON public.cms_footer_links FOR SELECT USING ((is_active = true));


--
-- Name: cms_hero_images Anyone can view active hero images; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view active hero images" ON public.cms_hero_images FOR SELECT USING ((is_active = true));


--
-- Name: cms_nav_items Anyone can view active nav items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view active nav items" ON public.cms_nav_items FOR SELECT USING ((is_active = true));


--
-- Name: cms_social_media Anyone can view active social media; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view active social media" ON public.cms_social_media FOR SELECT USING ((is_active = true));


--
-- Name: sources Anyone can view active sources; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view active sources" ON public.sources FOR SELECT USING ((is_active = true));


--
-- Name: cms_stats Anyone can view active stats; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view active stats" ON public.cms_stats FOR SELECT USING ((is_active = true));


--
-- Name: cms_header Anyone can view cms_header; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view cms_header" ON public.cms_header FOR SELECT USING (true);


--
-- Name: cms_footer Anyone can view footer; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view footer" ON public.cms_footer FOR SELECT USING (true);


--
-- Name: cms_header Anyone can view header; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view header" ON public.cms_header FOR SELECT USING (true);


--
-- Name: images Anyone can view images; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view images" ON public.images FOR SELECT USING (true);


--
-- Name: subscription_plans Anyone can view plans; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view plans" ON public.subscription_plans FOR SELECT USING ((is_active = true));


--
-- Name: cms_search_config Anyone can view search config; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view search config" ON public.cms_search_config FOR SELECT USING (true);


--
-- Name: site_settings Anyone can view site settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view site settings" ON public.site_settings FOR SELECT USING (true);


--
-- Name: coupons Authenticated users can preview active coupons; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can preview active coupons" ON public.coupons FOR SELECT TO authenticated USING ((is_active = true));


--
-- Name: images Authenticated users can upload images; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can upload images" ON public.images FOR INSERT WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: chat_channels Buyer can create channel; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Buyer can create channel" ON public.chat_channels FOR INSERT WITH CHECK ((auth.uid() = buyer_id));


--
-- Name: chat_messages Channel participants can send messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Channel participants can send messages" ON public.chat_messages FOR INSERT WITH CHECK (((auth.uid() = sender_id) AND (EXISTS ( SELECT 1
   FROM public.chat_channels c
  WHERE ((c.id = chat_messages.channel_id) AND ((auth.uid() = c.buyer_id) OR (auth.uid() = c.seller_id)))))));


--
-- Name: chat_messages Channel participants can view messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Channel participants can view messages" ON public.chat_messages FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.chat_channels c
  WHERE ((c.id = chat_messages.channel_id) AND ((auth.uid() = c.buyer_id) OR (auth.uid() = c.seller_id))))));


--
-- Name: catalog_items Company owners can manage catalog items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Company owners can manage catalog items" ON public.catalog_items USING ((catalog_id IN ( SELECT c.id
   FROM (public.catalogs c
     JOIN public.company_profiles cp ON ((c.company_id = cp.id)))
  WHERE (cp.user_id = auth.uid()))));


--
-- Name: catalogs Company owners can manage catalogs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Company owners can manage catalogs" ON public.catalogs USING ((company_id IN ( SELECT company_profiles.id
   FROM public.company_profiles
  WHERE (company_profiles.user_id = auth.uid()))));


--
-- Name: products Enable insert for authenticated users only; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable insert for authenticated users only" ON public.products FOR INSERT WITH CHECK ((auth.role() = 'authenticated_role'::text));


--
-- Name: products Enable read access for all users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable read access for all users" ON public.products FOR SELECT USING (true);


--
-- Name: attribute_template_fields Fields visibles para admin/gestor; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Fields visibles para admin/gestor" ON public.attribute_template_fields FOR SELECT USING ((auth.uid() IN ( SELECT users.id
   FROM public.users
  WHERE ((users.role)::text = ANY ((ARRAY['admin'::character varying, 'superadmin'::character varying, 'gestor_contenidos'::character varying])::text[])))));


--
-- Name: site_settings Only superadmin can delete settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Only superadmin can delete settings" ON public.site_settings FOR DELETE TO authenticated USING (true);


--
-- Name: site_settings Only superadmin can insert settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Only superadmin can insert settings" ON public.site_settings FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: subscription_plans Only superadmin can manage plans; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Only superadmin can manage plans" ON public.subscription_plans USING ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.id = auth.uid()) AND ((users.role)::text = 'superadmin'::text)))));


--
-- Name: site_settings Only superadmin can update settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Only superadmin can update settings" ON public.site_settings FOR UPDATE TO authenticated USING (true) WITH CHECK (true);


--
-- Name: chat_channels Participants can update channel; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Participants can update channel" ON public.chat_channels FOR UPDATE USING (((auth.uid() = buyer_id) OR (auth.uid() = seller_id)));


--
-- Name: chat_channels Participants can view their channels; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Participants can view their channels" ON public.chat_channels FOR SELECT USING (((auth.uid() = buyer_id) OR (auth.uid() = seller_id)));


--
-- Name: subscription_plans Plans are viewable by everyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Plans are viewable by everyone" ON public.subscription_plans FOR SELECT USING (true);


--
-- Name: contact_messages Public can insert contacts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can insert contacts" ON public.contact_messages FOR INSERT WITH CHECK (true);


--
-- Name: hero_images Public can read active hero images; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can read active hero images" ON public.hero_images FOR SELECT USING ((is_active = true));


--
-- Name: ad_images Public can read ad_images; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can read ad_images" ON public.ad_images FOR SELECT USING (true);


--
-- Name: attribute_groups Public can read attribute_groups; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can read attribute_groups" ON public.attribute_groups FOR SELECT USING (true);


--
-- Name: attribute_options Public can read attribute_options; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can read attribute_options" ON public.attribute_options FOR SELECT USING (true);


--
-- Name: attributes Public can read attributes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can read attributes" ON public.attributes FOR SELECT USING (true);


--
-- Name: global_config Public can read global_config; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can read global_config" ON public.global_config FOR SELECT USING (true);


--
-- Name: membership_plans Public can read membership_plans; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can read membership_plans" ON public.membership_plans FOR SELECT USING (true);


--
-- Name: products Public can read products; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can read products" ON public.products FOR SELECT USING (true);


--
-- Name: subcategory_attributes Public can read subcategory_attributes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can read subcategory_attributes" ON public.subcategory_attributes FOR SELECT USING (true);


--
-- Name: subcategory_brands Public can read subcategory_brands; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can read subcategory_brands" ON public.subcategory_brands FOR SELECT USING (true);


--
-- Name: system_config Public can read system_config; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can read system_config" ON public.system_config FOR SELECT USING (true);


--
-- Name: catalog_items Public can view active catalog items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can view active catalog items" ON public.catalog_items FOR SELECT USING ((is_active = true));


--
-- Name: catalogs Public can view active catalogs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can view active catalogs" ON public.catalogs FOR SELECT USING ((is_active = true));


--
-- Name: company_profiles Public can view active company profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can view active company profiles" ON public.company_profiles FOR SELECT USING ((is_active = true));


--
-- Name: featured_ads Public can view active featured; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can view active featured" ON public.featured_ads FOR SELECT USING (((status)::text = 'active'::text));


--
-- Name: hero_images Public can view active hero images; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can view active hero images" ON public.hero_images FOR SELECT USING ((is_active = true));


--
-- Name: hero_images Public can view all hero images; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can view all hero images" ON public.hero_images FOR SELECT USING (true);


--
-- Name: category_types Public read category_types; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public read category_types" ON public.category_types FOR SELECT USING (true);


--
-- Name: dynamic_attributes Public read dynamic_attributes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public read dynamic_attributes" ON public.dynamic_attributes FOR SELECT USING ((is_active = true));


--
-- Name: global_settings Public settings are readable; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public settings are readable" ON public.global_settings FOR SELECT USING ((is_public = true));


--
-- Name: reseller_points_of_sale Revendedores actualizan sus PdV; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Revendedores actualizan sus PdV" ON public.reseller_points_of_sale FOR UPDATE USING ((revendedor_id = auth.uid()));


--
-- Name: reseller_points_of_sale Revendedores crean PdV; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Revendedores crean PdV" ON public.reseller_points_of_sale FOR INSERT WITH CHECK ((revendedor_id = auth.uid()));


--
-- Name: reseller_points_of_sale Revendedores eliminan sus PdV; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Revendedores eliminan sus PdV" ON public.reseller_points_of_sale FOR DELETE USING ((revendedor_id = auth.uid()));


--
-- Name: reseller_points_of_sale Revendedores ven sus PdV; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Revendedores ven sus PdV" ON public.reseller_points_of_sale FOR SELECT USING ((revendedor_id = auth.uid()));


--
-- Name: featured_ads_audit Sistema puede insertar en auditoría; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Sistema puede insertar en auditoría" ON public.featured_ads_audit FOR INSERT WITH CHECK (true);


--
-- Name: reseller_points_of_sale SuperAdmin acceso total PdV; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "SuperAdmin acceso total PdV" ON public.reseller_points_of_sale USING ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.id = auth.uid()) AND ((users.role)::text = 'superadmin'::text)))));


--
-- Name: banners_clean SuperAdmin can insert banners_clean; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "SuperAdmin can insert banners_clean" ON public.banners_clean FOR INSERT TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.id = auth.uid()) AND ((users.role)::text = 'superadmin'::text)))));


--
-- Name: featured_ads_queue SuperAdmin can manage all queue; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "SuperAdmin can manage all queue" ON public.featured_ads_queue USING ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.id = auth.uid()) AND ((users.role)::text = 'superadmin'::text)))));


--
-- Name: payments SuperAdmin can manage payments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "SuperAdmin can manage payments" ON public.payments USING ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.id = auth.uid()) AND ((users.role)::text = 'superadmin'::text)))));


--
-- Name: global_config SuperAdmin can modify global_config; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "SuperAdmin can modify global_config" ON public.global_config USING ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.id = auth.uid()) AND ((users.role)::text = 'superadmin'::text)))));


--
-- Name: global_settings SuperAdmin can modify settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "SuperAdmin can modify settings" ON public.global_settings USING ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.id = auth.uid()) AND ((users.role)::text = 'superadmin'::text)))));


--
-- Name: global_settings SuperAdmin can read all settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "SuperAdmin can read all settings" ON public.global_settings FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.id = auth.uid()) AND ((users.role)::text = 'superadmin'::text)))));


--
-- Name: payments SuperAdmin can view all payments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "SuperAdmin can view all payments" ON public.payments FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.id = auth.uid()) AND ((users.role)::text = 'superadmin'::text)))));


--
-- Name: featured_ads_queue SuperAdmin can view all queue; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "SuperAdmin can view all queue" ON public.featured_ads_queue FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.id = auth.uid()) AND ((users.role)::text = 'superadmin'::text)))));


--
-- Name: cms_header SuperAdmin full access cms_header; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "SuperAdmin full access cms_header" ON public.cms_header USING ((auth.uid() IN ( SELECT users.id
   FROM public.users
  WHERE ((users.role)::text = 'superadmin'::text))));


--
-- Name: coupons SuperAdmin full access coupons; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "SuperAdmin full access coupons" ON public.coupons TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.id = auth.uid()) AND ((users.role)::text = 'superadmin'::text)))));


--
-- Name: cms_footer SuperAdmin full access footer; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "SuperAdmin full access footer" ON public.cms_footer USING ((auth.uid() IN ( SELECT users.id
   FROM public.users
  WHERE ((users.role)::text = 'superadmin'::text))));


--
-- Name: cms_footer_columns SuperAdmin full access footer columns; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "SuperAdmin full access footer columns" ON public.cms_footer_columns USING ((auth.uid() IN ( SELECT users.id
   FROM public.users
  WHERE ((users.role)::text = 'superadmin'::text))));


--
-- Name: cms_footer_links SuperAdmin full access footer links; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "SuperAdmin full access footer links" ON public.cms_footer_links USING ((auth.uid() IN ( SELECT users.id
   FROM public.users
  WHERE ((users.role)::text = 'superadmin'::text))));


--
-- Name: cms_header SuperAdmin full access header; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "SuperAdmin full access header" ON public.cms_header USING ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.id = auth.uid()) AND ((users.role)::text = 'superadmin'::text)))));


--
-- Name: cms_hero_images SuperAdmin full access hero images; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "SuperAdmin full access hero images" ON public.cms_hero_images USING ((auth.uid() IN ( SELECT users.id
   FROM public.users
  WHERE ((users.role)::text = 'superadmin'::text))));


--
-- Name: coupon_invitations SuperAdmin full access invitations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "SuperAdmin full access invitations" ON public.coupon_invitations TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.id = auth.uid()) AND ((users.role)::text = 'superadmin'::text)))));


--
-- Name: cms_nav_items SuperAdmin full access nav items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "SuperAdmin full access nav items" ON public.cms_nav_items USING ((auth.uid() IN ( SELECT users.id
   FROM public.users
  WHERE ((users.role)::text = 'superadmin'::text))));


--
-- Name: coupon_redemptions SuperAdmin full access redemptions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "SuperAdmin full access redemptions" ON public.coupon_redemptions TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.id = auth.uid()) AND ((users.role)::text = 'superadmin'::text)))));


--
-- Name: cms_search_config SuperAdmin full access search config; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "SuperAdmin full access search config" ON public.cms_search_config USING ((auth.uid() IN ( SELECT users.id
   FROM public.users
  WHERE ((users.role)::text = 'superadmin'::text))));


--
-- Name: cms_social_media SuperAdmin full access social media; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "SuperAdmin full access social media" ON public.cms_social_media USING ((auth.uid() IN ( SELECT users.id
   FROM public.users
  WHERE ((users.role)::text = 'superadmin'::text))));


--
-- Name: cms_stats SuperAdmin full access stats; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "SuperAdmin full access stats" ON public.cms_stats USING ((auth.uid() IN ( SELECT users.id
   FROM public.users
  WHERE ((users.role)::text = 'superadmin'::text))));


--
-- Name: featured_ads_audit SuperAdmin puede ver auditoría; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "SuperAdmin puede ver auditoría" ON public.featured_ads_audit FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.id = auth.uid()) AND ((users.role)::text = 'superadmin'::text)))));


--
-- Name: category_types SuperAdmins manage category_types; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "SuperAdmins manage category_types" ON public.category_types TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.id = auth.uid()) AND ((users.role)::text = ANY ((ARRAY['superadmin'::character varying, 'super-admin'::character varying])::text[])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.id = auth.uid()) AND ((users.role)::text = ANY ((ARRAY['superadmin'::character varying, 'super-admin'::character varying])::text[]))))));


--
-- Name: dynamic_attributes SuperAdmins manage dynamic_attributes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "SuperAdmins manage dynamic_attributes" ON public.dynamic_attributes TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.id = auth.uid()) AND ((users.role)::text = ANY ((ARRAY['superadmin'::character varying, 'super-admin'::character varying])::text[])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.id = auth.uid()) AND ((users.role)::text = ANY ((ARRAY['superadmin'::character varying, 'super-admin'::character varying])::text[]))))));


--
-- Name: sources Superadmin can manage sources; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Superadmin can manage sources" ON public.sources USING ((auth.uid() IN ( SELECT users.id
   FROM public.users
  WHERE ((users.role)::text = 'superadmin'::text)))) WITH CHECK ((auth.uid() IN ( SELECT users.id
   FROM public.users
  WHERE ((users.role)::text = 'superadmin'::text))));


--
-- Name: ads_moderation_log Superadmin can read ads_moderation_log; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Superadmin can read ads_moderation_log" ON public.ads_moderation_log FOR SELECT USING (public.is_superadmin());


--
-- Name: jobs_log Superadmin can view all jobs logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Superadmin can view all jobs logs" ON public.jobs_log FOR SELECT USING ((auth.uid() IN ( SELECT users.id
   FROM public.users
  WHERE ((users.role)::text = 'superadmin'::text))));


--
-- Name: contact_messages Superadmin full access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Superadmin full access" ON public.contact_messages TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.id = auth.uid()) AND ((users.role)::text = 'superadmin'::text)))));


--
-- Name: chat_channels Superadmin full access channels; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Superadmin full access channels" ON public.chat_channels USING ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.id = auth.uid()) AND ((users.role)::text = 'superadmin'::text)))));


--
-- Name: chat_messages Superadmin full access messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Superadmin full access messages" ON public.chat_messages USING ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.id = auth.uid()) AND ((users.role)::text = 'superadmin'::text)))));


--
-- Name: jobs_log System can insert jobs logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "System can insert jobs logs" ON public.jobs_log FOR INSERT WITH CHECK (true);


--
-- Name: contact_notifications System can insert notifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "System can insert notifications" ON public.contact_notifications FOR INSERT WITH CHECK (true);


--
-- Name: user_promo_claims System can insert promo claims; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "System can insert promo claims" ON public.user_promo_claims USING (true);


--
-- Name: attribute_templates Templates visibles para admin/gestor; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Templates visibles para admin/gestor" ON public.attribute_templates FOR SELECT USING ((auth.uid() IN ( SELECT users.id
   FROM public.users
  WHERE ((users.role)::text = ANY ((ARRAY['admin'::character varying, 'superadmin'::character varying, 'gestor_contenidos'::character varying])::text[])))));


--
-- Name: featured_ads Users can cancel own pending; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can cancel own pending" ON public.featured_ads FOR UPDATE USING (((auth.uid() = user_id) AND ((status)::text = 'pending'::text)));


--
-- Name: featured_ads_queue Users can cancel own queued entries; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can cancel own queued entries" ON public.featured_ads_queue FOR UPDATE USING (((user_id = auth.uid()) AND ((status)::text = 'queued'::text)));


--
-- Name: featured_ads Users can create featured ads; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create featured ads" ON public.featured_ads FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: payments Users can create own payments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create own payments" ON public.payments FOR INSERT WITH CHECK ((user_id = auth.uid()));


--
-- Name: company_profiles Users can manage their company profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage their company profile" ON public.company_profiles USING ((auth.uid() = user_id));


--
-- Name: featured_ads_queue Users can request featured for own ads; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can request featured for own ads" ON public.featured_ads_queue FOR INSERT WITH CHECK (((user_id = auth.uid()) AND (EXISTS ( SELECT 1
   FROM public.ads
  WHERE ((ads.id = featured_ads_queue.ad_id) AND (ads.user_id = auth.uid()))))));


--
-- Name: featured_ads Users can update own featured; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own featured" ON public.featured_ads FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: contact_notifications Users can update own notifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own notifications" ON public.contact_notifications FOR UPDATE USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: featured_ads Users can view own featured ads; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own featured ads" ON public.featured_ads FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: contact_notifications Users can view own notifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own notifications" ON public.contact_notifications FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: payments Users can view own payments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own payments" ON public.payments FOR SELECT USING ((user_id = auth.uid()));


--
-- Name: user_promo_claims Users can view own promo claims; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own promo claims" ON public.user_promo_claims FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: featured_ads_queue Users can view own queue entries; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own queue entries" ON public.featured_ads_queue FOR SELECT USING ((user_id = auth.uid()));


--
-- Name: profile_views Users can view their profile views; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their profile views" ON public.profile_views FOR SELECT USING ((profile_user_id = auth.uid()));


--
-- Name: profile_contacts Users can view their received contacts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their received contacts" ON public.profile_contacts FOR SELECT USING ((profile_user_id = auth.uid()));


--
-- Name: contact_messages Users view own messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users view own messages" ON public.contact_messages FOR SELECT TO authenticated USING (((sender_user_id = auth.uid()) OR (ad_owner_id = auth.uid())));


--
-- Name: coupon_redemptions Users view own redemptions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users view own redemptions" ON public.coupon_redemptions FOR SELECT TO authenticated USING ((user_id = auth.uid()));


--
-- Name: ad_images; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ad_images ENABLE ROW LEVEL SECURITY;

--
-- Name: ads; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;

--
-- Name: ads ads_delete_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY ads_delete_own ON public.ads FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: ads ads_delete_superadmin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY ads_delete_superadmin ON public.ads FOR DELETE USING (public.is_superadmin());


--
-- Name: ads ads_insert_authenticated; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY ads_insert_authenticated ON public.ads FOR INSERT WITH CHECK (((auth.uid() = user_id) AND (auth.uid() IS NOT NULL)));


--
-- Name: ads_moderation_log; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ads_moderation_log ENABLE ROW LEVEL SECURITY;

--
-- Name: ads ads_update_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY ads_update_own ON public.ads FOR UPDATE USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: ads ads_update_superadmin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY ads_update_superadmin ON public.ads FOR UPDATE USING (public.is_superadmin()) WITH CHECK (public.is_superadmin());


--
-- Name: ads ads_view_active_approved; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY ads_view_active_approved ON public.ads FOR SELECT USING ((((status)::text = 'active'::text) AND (approval_status = 'approved'::text)));


--
-- Name: ads ads_view_all_superadmin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY ads_view_all_superadmin ON public.ads FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.id = auth.uid()) AND ((users.role)::text = 'superadmin'::text)))));


--
-- Name: ads ads_view_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY ads_view_own ON public.ads FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: attribute_groups; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.attribute_groups ENABLE ROW LEVEL SECURITY;

--
-- Name: attribute_options; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.attribute_options ENABLE ROW LEVEL SECURITY;

--
-- Name: attribute_template_fields; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.attribute_template_fields ENABLE ROW LEVEL SECURITY;

--
-- Name: attribute_templates; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.attribute_templates ENABLE ROW LEVEL SECURITY;

--
-- Name: attributes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.attributes ENABLE ROW LEVEL SECURITY;

--
-- Name: banners; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

--
-- Name: banners_clean; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.banners_clean ENABLE ROW LEVEL SECURITY;

--
-- Name: banners banners_manage_superadmin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY banners_manage_superadmin ON public.banners USING ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.id = auth.uid()) AND ((users.role)::text = 'superadmin'::text)))));


--
-- Name: banners banners_view_active; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY banners_view_active ON public.banners FOR SELECT USING ((is_active = true));


--
-- Name: business_profiles bp_owner_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY bp_owner_all ON public.business_profiles USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: business_profiles bp_public_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY bp_public_select ON public.business_profiles FOR SELECT USING ((is_active = true));


--
-- Name: business_profiles bp_superadmin_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY bp_superadmin_all ON public.business_profiles USING ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.id = auth.uid()) AND ((users.role)::text = 'superadmin'::text)))));


--
-- Name: business_profile_members bpm_owner_manage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY bpm_owner_manage ON public.business_profile_members USING ((EXISTS ( SELECT 1
   FROM public.business_profiles
  WHERE ((business_profiles.id = business_profile_members.business_profile_id) AND (business_profiles.user_id = auth.uid())))));


--
-- Name: business_profile_members bpm_superadmin_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY bpm_superadmin_all ON public.business_profile_members USING ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.id = auth.uid()) AND ((users.role)::text = 'superadmin'::text)))));


--
-- Name: business_profile_members bpm_user_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY bpm_user_select ON public.business_profile_members FOR SELECT USING ((user_id = auth.uid()));


--
-- Name: brands; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;

--
-- Name: brands brands_manage_superadmin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY brands_manage_superadmin ON public.brands USING ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.id = auth.uid()) AND ((users.role)::text = 'superadmin'::text)))));


--
-- Name: brands brands_read_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY brands_read_all ON public.brands FOR SELECT USING (true);


--
-- Name: business_profile_members; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.business_profile_members ENABLE ROW LEVEL SECURITY;

--
-- Name: business_profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.business_profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: catalog_items; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.catalog_items ENABLE ROW LEVEL SECURITY;

--
-- Name: catalogs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.catalogs ENABLE ROW LEVEL SECURITY;

--
-- Name: categories; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

--
-- Name: categories categories_manage_superadmin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY categories_manage_superadmin ON public.categories USING ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.id = auth.uid()) AND ((users.role)::text = 'superadmin'::text)))));


--
-- Name: categories categories_read_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY categories_read_all ON public.categories FOR SELECT USING (true);


--
-- Name: category_icons; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.category_icons ENABLE ROW LEVEL SECURITY;

--
-- Name: category_icons category_icons_public_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY category_icons_public_read ON public.category_icons FOR SELECT USING (true);


--
-- Name: category_icons category_icons_superadmin_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY category_icons_superadmin_all ON public.category_icons USING ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.id = auth.uid()) AND ((users.role)::text = 'superadmin'::text)))));


--
-- Name: category_types; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.category_types ENABLE ROW LEVEL SECURITY;

--
-- Name: chat_channels; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.chat_channels ENABLE ROW LEVEL SECURITY;

--
-- Name: chat_messages; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

--
-- Name: cms_footer; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.cms_footer ENABLE ROW LEVEL SECURITY;

--
-- Name: cms_footer_columns; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.cms_footer_columns ENABLE ROW LEVEL SECURITY;

--
-- Name: cms_footer_links; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.cms_footer_links ENABLE ROW LEVEL SECURITY;

--
-- Name: cms_header; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.cms_header ENABLE ROW LEVEL SECURITY;

--
-- Name: cms_hero_images; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.cms_hero_images ENABLE ROW LEVEL SECURITY;

--
-- Name: cms_nav_items; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.cms_nav_items ENABLE ROW LEVEL SECURITY;

--
-- Name: cms_search_config; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.cms_search_config ENABLE ROW LEVEL SECURITY;

--
-- Name: cms_social_media; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.cms_social_media ENABLE ROW LEVEL SECURITY;

--
-- Name: cms_stats; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.cms_stats ENABLE ROW LEVEL SECURITY;

--
-- Name: company_profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.company_profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: contact_messages; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

--
-- Name: contact_notifications; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.contact_notifications ENABLE ROW LEVEL SECURITY;

--
-- Name: coupon_invitations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.coupon_invitations ENABLE ROW LEVEL SECURITY;

--
-- Name: coupon_redemptions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.coupon_redemptions ENABLE ROW LEVEL SECURITY;

--
-- Name: coupons; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

--
-- Name: deletion_requests; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.deletion_requests ENABLE ROW LEVEL SECURITY;

--
-- Name: deletion_requests deletion_requests_admin_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY deletion_requests_admin_all ON public.deletion_requests USING ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.id = auth.uid()) AND ((users.role)::text = 'superadmin'::text)))));


--
-- Name: deletion_requests deletion_requests_user_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY deletion_requests_user_insert ON public.deletion_requests FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: deletion_requests deletion_requests_user_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY deletion_requests_user_select ON public.deletion_requests FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: dynamic_attributes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.dynamic_attributes ENABLE ROW LEVEL SECURITY;

--
-- Name: featured_ads; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.featured_ads ENABLE ROW LEVEL SECURITY;

--
-- Name: featured_ads_audit; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.featured_ads_audit ENABLE ROW LEVEL SECURITY;

--
-- Name: featured_ads_queue; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.featured_ads_queue ENABLE ROW LEVEL SECURITY;

--
-- Name: featured_daily_impressions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.featured_daily_impressions ENABLE ROW LEVEL SECURITY;

--
-- Name: featured_daily_impressions featured_daily_impressions_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY featured_daily_impressions_select ON public.featured_daily_impressions FOR SELECT USING (true);


--
-- Name: form_field_options_v2; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.form_field_options_v2 ENABLE ROW LEVEL SECURITY;

--
-- Name: form_field_options_v2 form_field_options_v2_select_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY form_field_options_v2_select_all ON public.form_field_options_v2 FOR SELECT USING (true);


--
-- Name: form_field_options_v2 form_field_options_v2_write_superadmin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY form_field_options_v2_write_superadmin ON public.form_field_options_v2 USING ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.id = auth.uid()) AND ((users.role)::text = 'superadmin'::text))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.id = auth.uid()) AND ((users.role)::text = 'superadmin'::text)))));


--
-- Name: form_fields_v2; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.form_fields_v2 ENABLE ROW LEVEL SECURITY;

--
-- Name: form_fields_v2 form_fields_v2_select_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY form_fields_v2_select_all ON public.form_fields_v2 FOR SELECT USING (true);


--
-- Name: form_fields_v2 form_fields_v2_write_superadmin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY form_fields_v2_write_superadmin ON public.form_fields_v2 USING ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.id = auth.uid()) AND ((users.role)::text = 'superadmin'::text))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.id = auth.uid()) AND ((users.role)::text = 'superadmin'::text)))));


--
-- Name: form_templates_v2 form_templates_v2_select_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY form_templates_v2_select_all ON public.form_templates_v2 FOR SELECT USING (true);


--
-- Name: form_templates_v2 form_templates_v2_write_superadmin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY form_templates_v2_write_superadmin ON public.form_templates_v2 USING ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.id = auth.uid()) AND ((users.role)::text = 'superadmin'::text))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.id = auth.uid()) AND ((users.role)::text = 'superadmin'::text)))));


--
-- Name: global_config; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.global_config ENABLE ROW LEVEL SECURITY;

--
-- Name: global_settings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.global_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: hero_images; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.hero_images ENABLE ROW LEVEL SECURITY;

--
-- Name: images; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.images ENABLE ROW LEVEL SECURITY;

--
-- Name: jobs_log; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.jobs_log ENABLE ROW LEVEL SECURITY;

--
-- Name: localities; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.localities ENABLE ROW LEVEL SECURITY;

--
-- Name: localities localities_select_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY localities_select_all ON public.localities FOR SELECT USING (true);


--
-- Name: localities localities_write_superadmin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY localities_write_superadmin ON public.localities USING ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.id = auth.uid()) AND ((users.role)::text = 'superadmin'::text))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.id = auth.uid()) AND ((users.role)::text = 'superadmin'::text)))));


--
-- Name: membership_plans; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.membership_plans ENABLE ROW LEVEL SECURITY;

--
-- Name: models; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.models ENABLE ROW LEVEL SECURITY;

--
-- Name: models models_manage_superadmin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY models_manage_superadmin ON public.models USING ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.id = auth.uid()) AND ((users.role)::text = 'superadmin'::text)))));


--
-- Name: models models_read_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY models_read_all ON public.models FOR SELECT USING (true);


--
-- Name: notifications; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

--
-- Name: option_list_items; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.option_list_items ENABLE ROW LEVEL SECURITY;

--
-- Name: option_list_items option_list_items_select_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY option_list_items_select_all ON public.option_list_items FOR SELECT USING (true);


--
-- Name: option_list_items option_list_items_write_superadmin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY option_list_items_write_superadmin ON public.option_list_items USING ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.id = auth.uid()) AND ((users.role)::text = 'superadmin'::text))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.id = auth.uid()) AND ((users.role)::text = 'superadmin'::text)))));


--
-- Name: option_lists; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.option_lists ENABLE ROW LEVEL SECURITY;

--
-- Name: option_lists option_lists_select_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY option_lists_select_all ON public.option_lists FOR SELECT USING (true);


--
-- Name: option_lists option_lists_write_superadmin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY option_lists_write_superadmin ON public.option_lists USING ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.id = auth.uid()) AND ((users.role)::text = 'superadmin'::text))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.id = auth.uid()) AND ((users.role)::text = 'superadmin'::text)))));


--
-- Name: payments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

--
-- Name: products; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

--
-- Name: profile_contacts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profile_contacts ENABLE ROW LEVEL SECURITY;

--
-- Name: profile_views; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profile_views ENABLE ROW LEVEL SECURITY;

--
-- Name: provinces; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.provinces ENABLE ROW LEVEL SECURITY;

--
-- Name: provinces provinces_select_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY provinces_select_all ON public.provinces FOR SELECT USING (true);


--
-- Name: provinces provinces_write_superadmin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY provinces_write_superadmin ON public.provinces USING ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.id = auth.uid()) AND ((users.role)::text = 'superadmin'::text))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.id = auth.uid()) AND ((users.role)::text = 'superadmin'::text)))));


--
-- Name: banners_clean public_read_active_banners; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY public_read_active_banners ON public.banners_clean FOR SELECT USING (((is_active = true) AND ((starts_at IS NULL) OR (starts_at <= now())) AND ((expires_at IS NULL) OR (expires_at > now()))));


--
-- Name: reseller_points_of_sale; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.reseller_points_of_sale ENABLE ROW LEVEL SECURITY;

--
-- Name: search_analytics; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.search_analytics ENABLE ROW LEVEL SECURITY;

--
-- Name: search_analytics search_analytics_insert_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY search_analytics_insert_policy ON public.search_analytics FOR INSERT WITH CHECK (true);


--
-- Name: search_analytics search_analytics_select_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY search_analytics_select_policy ON public.search_analytics FOR SELECT USING (true);


--
-- Name: user_favorites service_role_all_favorites; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY service_role_all_favorites ON public.user_favorites TO service_role USING (true);


--
-- Name: notifications service_role_all_notifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY service_role_all_notifications ON public.notifications TO service_role USING (true);


--
-- Name: site_settings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: sources; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.sources ENABLE ROW LEVEL SECURITY;

--
-- Name: subcategories; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.subcategories ENABLE ROW LEVEL SECURITY;

--
-- Name: subcategories subcategories_manage_superadmin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY subcategories_manage_superadmin ON public.subcategories USING ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.id = auth.uid()) AND ((users.role)::text = 'superadmin'::text)))));


--
-- Name: subcategories subcategories_read_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY subcategories_read_all ON public.subcategories FOR SELECT USING (true);


--
-- Name: subcategory_attributes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.subcategory_attributes ENABLE ROW LEVEL SECURITY;

--
-- Name: subcategory_brands; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.subcategory_brands ENABLE ROW LEVEL SECURITY;

--
-- Name: subscription_plans; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

--
-- Name: banners superadmin_all_banners; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY superadmin_all_banners ON public.banners TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.id = auth.uid()) AND ((users.role)::text = 'superadmin'::text))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.id = auth.uid()) AND ((users.role)::text = 'superadmin'::text)))));


--
-- Name: banners_clean superadmin_all_banners; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY superadmin_all_banners ON public.banners_clean TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.id = auth.uid()) AND ((users.role)::text = 'superadmin'::text))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.id = auth.uid()) AND ((users.role)::text = 'superadmin'::text)))));


--
-- Name: system_config; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;

--
-- Name: user_favorites; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;

--
-- Name: user_promo_claims; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_promo_claims ENABLE ROW LEVEL SECURITY;

--
-- Name: users; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

--
-- Name: users users_delete_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY users_delete_policy ON public.users FOR DELETE USING (public.is_superadmin());


--
-- Name: users users_insert_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY users_insert_policy ON public.users FOR INSERT WITH CHECK (true);


--
-- Name: user_favorites users_own_favorites; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY users_own_favorites ON public.user_favorites USING ((auth.uid() = user_id));


--
-- Name: notifications users_own_notifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY users_own_notifications ON public.notifications USING ((auth.uid() = user_id));


--
-- Name: users users_select_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY users_select_policy ON public.users FOR SELECT USING (((auth.uid() = id) OR public.is_superadmin()));


--
-- Name: users users_update_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY users_update_policy ON public.users FOR UPDATE USING (((auth.uid() = id) OR public.is_superadmin()));


--
-- Name: wizard_configs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.wizard_configs ENABLE ROW LEVEL SECURITY;

--
-- Name: wizard_configs wizard_configs_select_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY wizard_configs_select_all ON public.wizard_configs FOR SELECT USING (true);


--
-- Name: wizard_configs wizard_configs_write_superadmin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY wizard_configs_write_superadmin ON public.wizard_configs USING ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.id = auth.uid()) AND ((users.role)::text = 'superadmin'::text))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.id = auth.uid()) AND ((users.role)::text = 'superadmin'::text)))));


--
-- PostgreSQL database dump complete
--

\unrestrict O6lW8gGL52bdU84ffZgxsjwYr7mPbM9PdXergqgotRyo0XopYm2lqCJ2rTwdE9S

