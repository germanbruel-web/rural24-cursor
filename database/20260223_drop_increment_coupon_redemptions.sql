-- ============================================================================
-- Migración: DROP función redundante increment_coupon_redemptions
-- Fecha: 2026-02-23
-- Autor: Copilot
-- Impacto: Elimina RPC helper que ya está incluida en redeem_coupon()
-- Pre-requisito: La RPC redeem_coupon() ya realiza el incremento internamente.
--                Verificar que ningún otro código llame a increment_coupon_redemptions.
-- ============================================================================

-- Verificación previa (ejecutar PRIMERO, solo lectura)
-- Confirmar que la función existe:
-- SELECT routine_name FROM information_schema.routines
-- WHERE routine_name = 'increment_coupon_redemptions' AND routine_schema = 'public';

-- Migración
DROP FUNCTION IF EXISTS public.increment_coupon_redemptions(uuid);

-- Rollback (en caso de problemas)
-- CREATE OR REPLACE FUNCTION public.increment_coupon_redemptions(coupon_uuid uuid)
-- RETURNS void
-- LANGUAGE plpgsql
-- AS $$
-- BEGIN
--   UPDATE coupons
--   SET
--     current_redemptions = current_redemptions + 1,
--     updated_at = now()
--   WHERE id = coupon_uuid;
-- END;
-- $$;
