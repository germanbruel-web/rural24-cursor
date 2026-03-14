-- ============================================================
-- Sprint 7C — Membership Coupons
-- Fecha: 2026-03-14
-- Objetivo: Permitir cupones que otorguen membresías (planes)
--           además de / en lugar de saldo ARS
--
-- Cambios:
--   1. coupons.membership_duration_days — duración de la membresía
--   2. redeem_coupon() — maneja ARS créditos + membresías
-- ============================================================

-- ── 1. Columna membership_duration_days ─────────────────────────────────────
ALTER TABLE public.coupons
  ADD COLUMN IF NOT EXISTS membership_duration_days INTEGER DEFAULT 365;

COMMENT ON COLUMN public.coupons.membership_duration_days
  IS 'Días de vigencia de la membresía otorgada por el cupón (default 365)';

-- ── 2. redeem_coupon — versión 2 (ARS + membresía) ──────────────────────────
CREATE OR REPLACE FUNCTION public.redeem_coupon(p_user_id UUID, p_code VARCHAR)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER
AS $$
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
$$;

GRANT EXECUTE ON FUNCTION public.redeem_coupon(UUID, VARCHAR) TO authenticated;
