-- ============================================================
-- Fix FK coupon_redemptions.membership_granted
-- La FK apuntaba a membership_plans (tabla legacy).
-- El RPC redeem_coupon usa subscription_plans.id → FK incorrecta.
-- ============================================================

ALTER TABLE public.coupon_redemptions
  DROP CONSTRAINT IF EXISTS coupon_redemptions_membership_granted_fkey;

ALTER TABLE public.coupon_redemptions
  ADD CONSTRAINT coupon_redemptions_membership_granted_fkey
  FOREIGN KEY (membership_granted)
  REFERENCES public.subscription_plans(id)
  ON DELETE SET NULL;
