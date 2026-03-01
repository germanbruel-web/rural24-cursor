-- ============================================================
-- Migration: 20260301000002_add_billing_fields
-- Agrega campos de domicilio, código postal y facturación
-- a la tabla public.users
--
-- Nota: cuit VARCHAR(13) ya existe (no se toca)
-- ============================================================

-- ── Ubicación física ─────────────────────────────────────────
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS domicilio     TEXT,
  ADD COLUMN IF NOT EXISTS codigo_postal VARCHAR(10);

-- ── Datos de facturación ─────────────────────────────────────
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS billing_same_address  BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS billing_address       TEXT,
  ADD COLUMN IF NOT EXISTS billing_localidad     VARCHAR(255),
  ADD COLUMN IF NOT EXISTS billing_provincia     VARCHAR(255),
  ADD COLUMN IF NOT EXISTS billing_codigo_postal VARCHAR(10);

-- ── Comentarios ──────────────────────────────────────────────
COMMENT ON COLUMN public.users.domicilio              IS 'Domicilio de ubicación física del usuario';
COMMENT ON COLUMN public.users.codigo_postal          IS 'Código postal de ubicación física';
COMMENT ON COLUMN public.users.billing_same_address   IS 'Si true, la dirección de facturación es la misma que la de ubicación';
COMMENT ON COLUMN public.users.billing_address        IS 'Domicilio de facturación (si difiere de ubicación)';
COMMENT ON COLUMN public.users.billing_localidad      IS 'Localidad de facturación';
COMMENT ON COLUMN public.users.billing_provincia      IS 'Provincia de facturación';
COMMENT ON COLUMN public.users.billing_codigo_postal  IS 'Código postal de facturación';
