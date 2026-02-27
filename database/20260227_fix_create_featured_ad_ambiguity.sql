-- ============================================================
-- FIX: Eliminar función create_featured_ad(varchar) duplicada
-- Fecha: 2026-02-27
-- Problema: Dos overloads (TEXT vs VARCHAR) causan error de
--           ambigüedad en PostgreSQL al llamar con named params.
-- Solución: Eliminar la versión legacy (VARCHAR, sin defaults).
--           Se conserva la versión correcta (TEXT con defaults).
-- ============================================================

-- La versión que SE ELIMINA:
--   create_featured_ad(uuid, uuid, character varying, date)
--   retorna: TABLE(success boolean, featured_id uuid, error_message text)
--
-- La versión que SE CONSERVA:
--   create_featured_ad(uuid, uuid, text DEFAULT 'homepage', date DEFAULT CURRENT_DATE)
--   retorna: TABLE(success boolean, featured_id uuid, message text)

DROP FUNCTION IF EXISTS public.create_featured_ad(
  p_ad_id uuid,
  p_user_id uuid,
  p_placement character varying,
  p_scheduled_start date
);
