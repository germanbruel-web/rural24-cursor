-- ============================================================
-- Limpieza de cron jobs duplicados — 2026-03-26
-- ============================================================
-- Contexto: dos migraciones distintas crearon el mismo job con
-- nombres diferentes. Los jobs legacy usan columnas incorrectas
-- (ends_at, activated_at) que ya no existen en el schema actual.
--
-- Jobs LEGACY a eliminar:
--   - featured-activator  → schedule hora, columna activated_at (no existe)
--   - featured-expirer    → columna ends_at (no existe, ahora es expires_at)
--
-- Jobs CANÓNICOS a conservar (definidos en CLAUDE.md como SAGRADOS):
--   - rural24-activate-featured   (*/15 min, pending→active)
--   - rural24-expire-featured     (*/15 min, active→expired)
--   - rural24-featured-expiry-check (diario 12:00, notificación 24h)
-- ============================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN

    -- Eliminar job legacy: activador con columna incorrecta y schedule hora
    PERFORM cron.unschedule('featured-activator')
      WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'featured-activator');

    -- Eliminar job legacy: expirador con columna ends_at (no existe)
    PERFORM cron.unschedule('featured-expirer')
      WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'featured-expirer');

  END IF;
END $$;
