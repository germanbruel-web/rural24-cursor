-- ============================================================
-- Registrar jobs canónicos pg_cron para Featured Ads
-- 2026-03-27
-- ============================================================
-- Contexto: los jobs legacy fueron limpiados en 20260326000001
-- pero los 3 canónicos nunca fueron registrados.
--
-- Jobs canónicos (INMUTABLES según CLAUDE.md):
--   1. rural24-activate-featured   */15 * * * *   pending → active
--   2. rural24-expire-featured     */15 * * * *   active  → expired
--   3. rural24-featured-expiry-check  0 12 * * *  campanita 24h antes
-- ============================================================

-- ── Función: notificación campanita 24h antes de vencer ───────────────────────
-- Se llama desde el job diario a las 12:00.
-- Busca featured_ads con expires_at en las próximas 24-26h y crea una
-- notificación en la tabla `notifications` (campanita) si no existe ya.

CREATE OR REPLACE FUNCTION public.notify_featured_expiring_soon()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INT := 0;
  v_rec   RECORD;
BEGIN
  FOR v_rec IN
    SELECT
      fa.id          AS featured_id,
      fa.user_id,
      fa.expires_at,
      a.title        AS ad_title,
      a.slug         AS ad_slug
    FROM public.featured_ads fa
    JOIN public.ads a ON a.id = fa.ad_id
    WHERE fa.status    = 'active'
      AND fa.expires_at BETWEEN NOW() AND NOW() + INTERVAL '26 hours'
      -- deduplicar: no insertar si ya existe notificación para este featured_ad hoy
      AND NOT EXISTS (
        SELECT 1 FROM public.notifications n
        WHERE n.user_id = fa.user_id
          AND n.type    = 'featured_expiring'
          AND (n.data->>'featured_id') = fa.id::text
          AND n.created_at >= NOW() - INTERVAL '25 hours'
      )
  LOOP
    INSERT INTO public.notifications (user_id, type, title, body, data)
    VALUES (
      v_rec.user_id,
      'featured_expiring',
      '¡Tu destacado vence mañana!',
      'El aviso "' || v_rec.ad_title || '" deja de estar destacado mañana.',
      jsonb_build_object(
        'featured_id', v_rec.featured_id,
        'ad_slug',     v_rec.ad_slug,
        'expires_at',  v_rec.expires_at
      )
    );
    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;

-- ── Registrar los 3 jobs canónicos ────────────────────────────────────────────
-- Patrón obligatorio: unschedule primero (idempotente), luego schedule.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN

    -- ── Job 1: activar pending → active (también expira vencidos en el mismo paso) ──
    PERFORM cron.unschedule('rural24-activate-featured')
      WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'rural24-activate-featured');

    PERFORM cron.schedule(
      'rural24-activate-featured',
      '*/15 * * * *',
      'SELECT public.activate_pending_featured_ads()'
    );

    -- ── Job 2: expirar active → expired (belt-and-suspenders) ──────────────────
    PERFORM cron.unschedule('rural24-expire-featured')
      WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'rural24-expire-featured');

    PERFORM cron.schedule(
      'rural24-expire-featured',
      '*/15 * * * *',
      'SELECT public.expire_featured_ads()'
    );

    -- ── Job 3: campanita 24h antes de vencer (diario 12:00 UTC) ────────────────
    PERFORM cron.unschedule('rural24-featured-expiry-check')
      WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'rural24-featured-expiry-check');

    PERFORM cron.schedule(
      'rural24-featured-expiry-check',
      '0 12 * * *',
      'SELECT public.notify_featured_expiring_soon()'
    );

    RAISE NOTICE 'pg_cron: 3 jobs registrados correctamente';
    RAISE NOTICE '  rural24-activate-featured    → */15 * * * *';
    RAISE NOTICE '  rural24-expire-featured      → */15 * * * *';
    RAISE NOTICE '  rural24-featured-expiry-check → 0 12 * * *';

  ELSE
    RAISE NOTICE 'pg_cron no disponible — jobs no registrados';
  END IF;
END $$;
