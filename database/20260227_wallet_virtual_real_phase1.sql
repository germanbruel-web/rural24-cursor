-- ============================================================================
-- FASE 1 - Wallet ARS virtual vs ARS real (no destructivo)
-- Fecha: 2026-02-27
-- Objetivo:
--   1) Diferenciar contablemente ARS virtual (marketing/cupones) de ARS real (pagos)
--   2) Mantener compatibilidad con flujo actual de featured
--   3) Evitar cambios destructivos en esta etapa de lanzamiento
--
-- v2:
--   - Corrige insercion de settings para esquemas con value JSON/JSONB
--   - Evita dependencia de ON CONFLICT(key) en global_settings
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 0) Pre-checks (solo informativos)
-- ----------------------------------------------------------------------------
-- SELECT to_regclass('public.user_credits');
-- SELECT to_regclass('public.payments');
-- SELECT to_regclass('public.coupons');

-- ----------------------------------------------------------------------------
-- 1) Cuenta wallet por usuario (doble bucket)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_wallets (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  currency VARCHAR(3) NOT NULL DEFAULT 'ARS',
  virtual_balance NUMERIC(14,2) NOT NULL DEFAULT 0,
  real_balance NUMERIC(14,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_wallets_currency ON public.user_wallets(currency);

-- ----------------------------------------------------------------------------
-- 2) Ledger wallet (movimientos auditables)
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'wallet_bucket' AND n.nspname = 'public'
  ) THEN
    CREATE TYPE public.wallet_bucket AS ENUM ('virtual', 'real');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'wallet_tx_type' AND n.nspname = 'public'
  ) THEN
    CREATE TYPE public.wallet_tx_type AS ENUM ('credit', 'debit');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  bucket public.wallet_bucket NOT NULL,
  tx_type public.wallet_tx_type NOT NULL,
  amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  balance_after NUMERIC(14,2) NOT NULL,
  source VARCHAR(50) NOT NULL, -- coupon, payment, featured_spend, admin_adjustment, promo
  description TEXT,
  payment_id UUID NULL REFERENCES public.payments(id),
  featured_ad_id UUID NULL REFERENCES public.featured_ads(id),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wallet_tx_user_created ON public.wallet_transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_bucket ON public.wallet_transactions(bucket);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_source ON public.wallet_transactions(source);

-- ----------------------------------------------------------------------------
-- 3) Backfill inicial desde user_credits -> virtual_balance (1:1)
-- ----------------------------------------------------------------------------
INSERT INTO public.user_wallets (user_id, currency, virtual_balance, real_balance, created_at, updated_at)
SELECT
  uc.user_id,
  'ARS',
  COALESCE(uc.balance, 0)::NUMERIC(14,2),
  0::NUMERIC(14,2),
  now(),
  now()
FROM public.user_credits uc
ON CONFLICT (user_id) DO UPDATE
SET
  virtual_balance = GREATEST(public.user_wallets.virtual_balance, EXCLUDED.virtual_balance),
  updated_at = now();

-- Ledger snapshot inicial (solo si no existe para ese usuario/source)
INSERT INTO public.wallet_transactions (
  user_id, bucket, tx_type, amount, balance_after, source, description, metadata, created_at
)
SELECT
  uc.user_id,
  'virtual'::public.wallet_bucket,
  'credit'::public.wallet_tx_type,
  COALESCE(uc.balance, 0)::NUMERIC(14,2),
  COALESCE(uc.balance, 0)::NUMERIC(14,2),
  'migration',
  'Backfill inicial desde user_credits',
  jsonb_build_object('migration', '20260227_wallet_virtual_real_phase1'),
  now()
FROM public.user_credits uc
WHERE COALESCE(uc.balance, 0) > 0
AND NOT EXISTS (
  SELECT 1 FROM public.wallet_transactions wt
  WHERE wt.user_id = uc.user_id
    AND wt.source = 'migration'
);

-- ----------------------------------------------------------------------------
-- 4) Settings base para lanzamiento (pagos OFF, virtual ON)
-- Nota: se usa WHERE NOT EXISTS para compatibilidad de esquemas.
-- ----------------------------------------------------------------------------
INSERT INTO public.global_settings (key, value, category, description)
SELECT 'wallet_virtual_enabled', 'true'::jsonb, 'payments', 'Permite usar ARS virtual en destacados'
WHERE NOT EXISTS (SELECT 1 FROM public.global_settings WHERE key = 'wallet_virtual_enabled');

INSERT INTO public.global_settings (key, value, category, description)
SELECT 'wallet_real_enabled', 'false'::jsonb, 'payments', 'Permite usar ARS real (pasarela)'
WHERE NOT EXISTS (SELECT 1 FROM public.global_settings WHERE key = 'wallet_real_enabled');

INSERT INTO public.global_settings (key, value, category, description)
SELECT 'featured_checkout_mode', '"virtual_only"'::jsonb, 'payments', 'virtual_only | hybrid | real_only'
WHERE NOT EXISTS (SELECT 1 FROM public.global_settings WHERE key = 'featured_checkout_mode');

INSERT INTO public.global_settings (key, value, category, description)
SELECT 'featured_payments_enabled', 'false'::jsonb, 'payments', 'Checkout de destacados (pasarela)'
WHERE NOT EXISTS (SELECT 1 FROM public.global_settings WHERE key = 'featured_payments_enabled');

INSERT INTO public.global_settings (key, value, category, description)
SELECT 'mercadopago_enabled', 'false'::jsonb, 'payments', 'Metodo MercadoPago habilitado'
WHERE NOT EXISTS (SELECT 1 FROM public.global_settings WHERE key = 'mercadopago_enabled');

-- ----------------------------------------------------------------------------
-- 5) Trigger updated_at para user_wallets
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_user_wallets_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_user_wallets_updated_at ON public.user_wallets;
CREATE TRIGGER trg_user_wallets_updated_at
BEFORE UPDATE ON public.user_wallets
FOR EACH ROW
EXECUTE FUNCTION public.update_user_wallets_updated_at();

-- ============================================================================
-- NOTAS OPERATIVAS
-- - Esta fase NO elimina user_credits.
-- - create_featured_ad puede seguir operando con saldo legacy mientras migramos API.
-- - Fase 2: mover redeem_coupon y create_featured_ad a user_wallets/wallet_transactions.
-- ============================================================================
