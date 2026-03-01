-- ============================================================
-- MIGRATION: wallet_phase1_tables
-- Fecha: 2026-03-01 (formalización de 20260227_wallet_virtual_real_phase1.sql)
-- Objetivo: Crear tablas user_wallets + wallet_transactions si no existen
--           (idempotente — segura en DEV donde ya existen, crea en PROD)
-- ============================================================

-- ── 1. ENUMs (idempotentes) ────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'wallet_bucket' AND n.nspname = 'public'
  ) THEN
    CREATE TYPE public.wallet_bucket AS ENUM ('virtual', 'real');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'wallet_tx_type' AND n.nspname = 'public'
  ) THEN
    CREATE TYPE public.wallet_tx_type AS ENUM ('credit', 'debit');
  END IF;
END $$;

-- ── 2. user_wallets ────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.user_wallets (
  user_id         UUID         PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  currency        VARCHAR(3)   NOT NULL DEFAULT 'ARS',
  virtual_balance NUMERIC(14,2) NOT NULL DEFAULT 0,
  real_balance    NUMERIC(14,2) NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_wallets_currency ON public.user_wallets(currency);

-- ── 3. wallet_transactions ─────────────────────────────────

CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id             UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID          NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  bucket         public.wallet_bucket     NOT NULL,
  tx_type        public.wallet_tx_type    NOT NULL,
  amount         NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  balance_after  NUMERIC(14,2) NOT NULL,
  source         VARCHAR(50)   NOT NULL,
  description    TEXT,
  payment_id     UUID          NULL REFERENCES public.payments(id),
  featured_ad_id UUID          NULL REFERENCES public.featured_ads(id),
  metadata       JSONB         NOT NULL DEFAULT '{}'::jsonb,
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wallet_tx_user_created ON public.wallet_transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_bucket       ON public.wallet_transactions(bucket);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_source       ON public.wallet_transactions(source);

-- ── 4. Trigger updated_at ──────────────────────────────────

CREATE OR REPLACE FUNCTION public.update_user_wallets_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_user_wallets_updated_at ON public.user_wallets;
CREATE TRIGGER trg_user_wallets_updated_at
  BEFORE UPDATE ON public.user_wallets
  FOR EACH ROW EXECUTE FUNCTION public.update_user_wallets_updated_at();

-- ── 5. RLS básico ──────────────────────────────────────────

ALTER TABLE public.user_wallets        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

-- Usuario puede leer su propio wallet
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_wallets' AND policyname = 'Users can view own wallet'
  ) THEN
    CREATE POLICY "Users can view own wallet"
      ON public.user_wallets FOR SELECT TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Usuario puede leer sus propias transacciones
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'wallet_transactions' AND policyname = 'Users can view own transactions'
  ) THEN
    CREATE POLICY "Users can view own transactions"
      ON public.wallet_transactions FOR SELECT TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- ── 6. Backfill desde user_credits (idempotente) ───────────

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
  SET virtual_balance = GREATEST(public.user_wallets.virtual_balance, EXCLUDED.virtual_balance),
      updated_at = now();

-- ── 7. global_settings (idempotente) ──────────────────────

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
