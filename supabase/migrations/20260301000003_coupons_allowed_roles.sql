-- ============================================================
-- Migration: 20260301000003_coupons_allowed_roles
-- Agrega restricción de roles a cupones
--
-- Cambios:
--   1. coupons: columna allowed_roles TEXT[] DEFAULT ['all']
--   2. RPC redeem_coupon: valida rol del usuario antes de canjear
-- ============================================================

BEGIN;

-- ============================================================
-- 1. COUPONS — nueva columna allowed_roles
-- ============================================================

ALTER TABLE public.coupons
  ADD COLUMN IF NOT EXISTS allowed_roles TEXT[] NOT NULL DEFAULT ARRAY['all']::TEXT[];

COMMENT ON COLUMN public.coupons.allowed_roles IS
  'Roles autorizados a canjear este cupón. [''all''] = sin restricción. '
  'Valores posibles: all, free, premium, revendedor, superadmin';

-- Cupones existentes: todos pueden canjear (retrocompatible)
UPDATE public.coupons
SET allowed_roles = ARRAY['all']::TEXT[]
WHERE allowed_roles IS NULL OR array_length(allowed_roles, 1) IS NULL;

-- ============================================================
-- 2. RPC: redeem_coupon (reemplaza versión de wallet_phase2)
--    Agrega validación de rol ANTES del duplicado check
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
  v_user_role       TEXT;
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

  -- Verificar restricción de roles
  IF NOT ('all' = ANY(v_coupon.allowed_roles)) THEN
    SELECT role INTO v_user_role
    FROM public.users
    WHERE id = p_user_id;

    IF v_user_role IS NULL OR NOT (v_user_role = ANY(v_coupon.allowed_roles)) THEN
      RETURN json_build_object(
        'success', FALSE,
        'error',   'No tenés permisos para canjear este cupón'
      );
    END IF;
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

  -- Ledger auditable
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

COMMIT;
