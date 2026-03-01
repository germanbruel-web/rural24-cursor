-- ============================================================
-- Migration: 20260301000004_coupons_rls_select_authenticated
-- Permite a usuarios autenticados leer cupones activos
--
-- Problema: validateCoupon() en el frontend hace un SELECT directo
-- a la tabla coupons. Sin esta política, solo superadmins pueden
-- leer → el preview "Validar cupón" falla para todos los demás.
--
-- Seguridad:
--   - Solo SELECT, solo cupones activos (is_active = TRUE)
--   - INSERT/UPDATE/DELETE siguen restringidos a superadmin
--   - El canje real pasa por RPC SECURITY DEFINER (backend)
-- ============================================================

CREATE POLICY "Authenticated users can preview active coupons"
  ON public.coupons
  FOR SELECT
  TO authenticated
  USING (is_active = TRUE);
