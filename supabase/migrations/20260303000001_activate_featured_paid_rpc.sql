-- ============================================================
-- MIGRATION: activate_featured_paid_rpc
-- Fecha: 2026-03-03 (Sprint 3D — MercadoPago Checkout)
-- Objetivo: RPC para activar destacado pagado directamente con
--           MercadoPago (no usa wallet virtual_balance).
--           Idempotente: verifica payment_id antes de procesar.
-- ============================================================

CREATE OR REPLACE FUNCTION public.activate_featured_paid(
  p_user_id    UUID,
  p_ad_id      UUID,
  p_tier       TEXT,
  p_periods    INT,
  p_payment_id UUID
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- Permisos: solo service_role puede ejecutar esta función
REVOKE ALL ON FUNCTION public.activate_featured_paid(UUID, UUID, TEXT, INT, UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.activate_featured_paid(UUID, UUID, TEXT, INT, UUID) FROM anon;
REVOKE ALL ON FUNCTION public.activate_featured_paid(UUID, UUID, TEXT, INT, UUID) FROM authenticated;
GRANT  EXECUTE ON FUNCTION public.activate_featured_paid(UUID, UUID, TEXT, INT, UUID) TO service_role;
