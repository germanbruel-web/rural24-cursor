-- ====================================================================
-- FUNCIÓN: Incrementar canjes de un cupón (atómica)
-- Fecha: 2026-02-13
-- Uso: Llamado desde creditsService.redeemCoupon() via supabase.rpc()
-- ====================================================================

CREATE OR REPLACE FUNCTION public.increment_coupon_redemptions(coupon_uuid uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE coupons
  SET 
    current_redemptions = current_redemptions + 1,
    updated_at = now()
  WHERE id = coupon_uuid;
END;
$$;
