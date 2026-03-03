-- ============================================================
-- MIGRATION: fix_featured_unique_constraint
-- Fecha: 2026-03-03
-- Problema: idx_featured_ads_unique_ad_placement aplicaba a
--   status IN ('pending','active'), lo que impedía tener 2 filas
--   pending del mismo (ad_id, placement) — necesario para el
--   sistema de 2 períodos (Sprint 3A/3B).
--
-- Fix: Relajar el constraint para que solo aplique a status='active'.
--   Permite múltiples filas pending (cola de períodos 1 y 2),
--   pero impide que 2 períodos se activen simultáneamente para
--   el mismo aviso y placement.
-- ============================================================

-- 1. Eliminar el índice viejo (restrictivo)
DROP INDEX IF EXISTS public.idx_featured_ads_unique_ad_placement;

-- 2. Crear nuevo índice (solo status='active')
--    Un aviso no puede tener 2 destacados ACTIVOS con el mismo placement,
--    pero sí puede tener múltiples en cola (pending).
CREATE UNIQUE INDEX idx_featured_ads_unique_active_placement
  ON public.featured_ads (ad_id, placement)
  WHERE status = 'active';
