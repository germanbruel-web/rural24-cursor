-- =====================================================
-- Mobile Phone Verification System
-- Rural24 - Feb 2026
-- =====================================================
-- Adds columns for mobile verification OTP flow
-- and a unique partial index to prevent duplicate
-- verified mobile numbers across profiles.
-- =====================================================

-- 1. Add verification columns
ALTER TABLE public.users 
  ADD COLUMN IF NOT EXISTS mobile_verified boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS mobile_verification_code varchar(6),
  ADD COLUMN IF NOT EXISTS mobile_verification_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS mobile_verification_attempts int DEFAULT 0;

-- 2. Create unique PARTIAL index: only verified mobiles must be unique
-- This allows multiple users to have the same mobile while unverified,
-- but once verified, no other user can verify the same number.
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_mobile_verified_unique 
  ON public.users (mobile) 
  WHERE mobile IS NOT NULL AND mobile_verified = true;

-- 3. Index for quick lookups during verification
CREATE INDEX IF NOT EXISTS idx_users_mobile 
  ON public.users (mobile) 
  WHERE mobile IS NOT NULL;

-- 4. Comment
COMMENT ON COLUMN public.users.mobile_verified IS 'Whether the mobile number has been verified via OTP';
COMMENT ON COLUMN public.users.mobile_verification_code IS 'Current OTP code (hashed or plain in dev)';
COMMENT ON COLUMN public.users.mobile_verification_sent_at IS 'When the last OTP was sent';
COMMENT ON COLUMN public.users.mobile_verification_attempts IS 'Failed verification attempts for current code';
