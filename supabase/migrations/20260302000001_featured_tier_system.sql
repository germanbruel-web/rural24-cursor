-- =============================================================================
-- Migration: 20260302000001_featured_tier_system.sql
-- Sprint 3A — Sistema de Tiers para Avisos Destacados
-- =============================================================================
-- Cambios:
--   1. ALTER featured_ads: ADD tier, period_number, subcategory_id
--      placement queda como campo legacy nullable (se elimina en Sprint 4)
--   2. CREATE featured_daily_impressions (rotación/caps en Detail)
--   3. global_config: tier_config, slot_config, plan_features
--   4. pg_cron: activate pending→active, expire active→expired (c/15min)
--   5. RPCs:
--      - activate_featured_by_tier    → compra con saldo ARS
--      - get_featured_slot_availability → disponibilidad para checkout UI
--      - get_featured_homepage         → query homepage (FIFO, por categoría)
--      - get_featured_results          → query results (subcategoría + fallback)
--      - get_featured_detail           → query detail (random + cap diario)
--      - increment_ad_view             → contador de vistas para detalle
-- =============================================================================


-- =============================================================================
-- 1. ALTER TABLE featured_ads
-- =============================================================================

-- 1a. Hacer placement nullable + eliminar su CHECK constraint
--     (placement ahora es legacy — no se usa como input, se mantiene por compat)
ALTER TABLE public.featured_ads
  ALTER COLUMN placement DROP NOT NULL;

ALTER TABLE public.featured_ads
  DROP CONSTRAINT IF EXISTS featured_ads_placement_check;

-- 1b. Agregar columnas nuevas
ALTER TABLE public.featured_ads
  ADD COLUMN IF NOT EXISTS tier          VARCHAR(10),
  ADD COLUMN IF NOT EXISTS period_number SMALLINT NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS subcategory_id UUID REFERENCES public.subcategories(id);

-- 1c. Migrar filas existentes: derivar tier desde placement legacy
UPDATE public.featured_ads
SET tier = CASE
  WHEN placement = 'homepage' THEN 'alta'
  WHEN placement = 'results'  THEN 'media'
  WHEN placement = 'detail'   THEN 'baja'
  ELSE 'media'
END
WHERE tier IS NULL;

-- 1d. Hacer tier NOT NULL + constraints
ALTER TABLE public.featured_ads
  ALTER COLUMN tier SET NOT NULL,
  ADD CONSTRAINT featured_ads_tier_check   CHECK (tier IN ('alta', 'media', 'baja')),
  ADD CONSTRAINT featured_ads_period_check CHECK (period_number IN (1, 2));

-- 1e. Poplar subcategory_id desde el aviso relacionado (filas existentes)
UPDATE public.featured_ads fa
SET subcategory_id = a.subcategory_id
FROM public.ads a
WHERE fa.ad_id = a.id
  AND fa.subcategory_id IS NULL
  AND a.subcategory_id IS NOT NULL;

-- 1f. Índices
CREATE INDEX IF NOT EXISTS idx_featured_ads_tier_category
  ON public.featured_ads (tier, category_id, status);

CREATE INDEX IF NOT EXISTS idx_featured_ads_subcategory
  ON public.featured_ads (subcategory_id, tier, status);

CREATE INDEX IF NOT EXISTS idx_featured_ads_ad_status
  ON public.featured_ads (ad_id, status);


-- =============================================================================
-- 2. CREATE TABLE featured_daily_impressions
-- =============================================================================
-- Registra cuántas veces se mostró cada anuncio en cada placement por día.
-- Usado en Detail para el sistema de rotación con cap diario.

CREATE TABLE IF NOT EXISTS public.featured_daily_impressions (
  featured_ad_id  UUID        NOT NULL REFERENCES public.featured_ads(id) ON DELETE CASCADE,
  placement       VARCHAR(20) NOT NULL CHECK (placement IN ('homepage', 'results', 'detail')),
  imp_date        DATE        NOT NULL DEFAULT CURRENT_DATE,
  count           INTEGER     NOT NULL DEFAULT 0 CHECK (count >= 0),
  PRIMARY KEY (featured_ad_id, placement, imp_date)
);

CREATE INDEX IF NOT EXISTS idx_featured_daily_imp_date
  ON public.featured_daily_impressions (imp_date, placement);

-- RLS: lectura pública, escritura solo vía RPC (SECURITY DEFINER)
ALTER TABLE public.featured_daily_impressions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "featured_daily_impressions_select" ON public.featured_daily_impressions;
CREATE POLICY "featured_daily_impressions_select"
  ON public.featured_daily_impressions FOR SELECT USING (true);


-- =============================================================================
-- 3. global_config: tier_config, slot_config, plan_features
-- =============================================================================

-- Asegurar constraint UNIQUE en key (puede no existir)
ALTER TABLE public.global_config
  DROP CONSTRAINT IF EXISTS global_config_key_unique;
ALTER TABLE public.global_config
  ADD CONSTRAINT global_config_key_unique UNIQUE (key);

-- Eliminar featured_durations legacy (reemplazado por tier_config)
DELETE FROM public.global_config WHERE key = 'featured_durations';

INSERT INTO public.global_config (key, value, value_type, category, description) VALUES

-- Tiers: define placements, precio y label de cada tier
('tier_config',
 '[
   {"tier": "alta",  "placements": ["homepage","results","detail"], "price_ars": 7500,  "label": "ALTA",  "description": "Máxima visibilidad — Homepage, Resultados y Detalle"},
   {"tier": "media", "placements": ["homepage","results"],          "price_ars": 5000,  "label": "MEDIA", "description": "Alta visibilidad — Homepage y Resultados"},
   {"tier": "baja",  "placements": ["detail"],                      "price_ars": 2500,  "label": "BAJA",  "description": "Visibilidad en Detalle"}
 ]',
 'json', 'featured',
 'Tiers de avisos destacados. Editable desde GlobalSettingsPanel.'),

-- Slots: caps por placement
('slot_config',
 '{
   "homepage": {"max_active_per_category": 20},
   "results":  {"carousel_visible": 4,  "preload": 18},
   "detail":   {"carousel_visible": 5,  "preload": 15,
                 "daily_cap": {"alta": 50, "media": 30, "baja": 15}}
 }',
 'json', 'featured',
 'Configuración de slots por placement: máximos simultáneos y caps diarios.'),

-- Features por plan (ON/OFF desde GlobalSettingsPanel)
('plan_features',
 '{
   "free":    {"enabled": true,  "anonymous_ads": false, "verified_badge": false, "max_active_ads": 5,    "company_page": false},
   "premium": {"enabled": false, "anonymous_ads": true,  "verified_badge": true,  "max_active_ads": 20,   "company_page": false},
   "empresa": {"enabled": false, "anonymous_ads": false, "verified_badge": true,  "max_active_ads": null, "company_page": true}
 }',
 'json', 'plans',
 'Features habilitadas por plan. enabled=false oculta el plan. Editable desde GlobalSettingsPanel.')

ON CONFLICT (key) DO UPDATE SET
  value      = EXCLUDED.value,
  updated_at = NOW();


-- =============================================================================
-- 4. pg_cron — Activación y expiración automática de avisos destacados
-- =============================================================================
-- REQUISITO: habilitar la extensión pg_cron en Supabase Dashboard
--            Database → Extensions → pg_cron → Enable
-- Los jobs se crean en el schema "cron" que provee la extensión.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN

    -- Activar: pending → active cuando llega scheduled_start
    PERFORM cron.unschedule('rural24-activate-featured')
    WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'rural24-activate-featured');

    PERFORM cron.schedule(
      'rural24-activate-featured',
      '*/15 * * * *',
      $sql$
        UPDATE public.featured_ads
        SET
          status       = 'active',
          actual_start = NOW(),
          expires_at   = NOW() + (duration_days || ' days')::interval,
          updated_at   = NOW()
        WHERE status = 'pending'
          AND scheduled_start <= CURRENT_DATE;
      $sql$
    );

    -- Expirar: active → expired cuando pasa expires_at
    PERFORM cron.unschedule('rural24-expire-featured')
    WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'rural24-expire-featured');

    PERFORM cron.schedule(
      'rural24-expire-featured',
      '*/15 * * * *',
      $sql$
        UPDATE public.featured_ads
        SET status     = 'expired',
            updated_at = NOW()
        WHERE status = 'active'
          AND expires_at <= NOW();
      $sql$
    );

    RAISE NOTICE 'pg_cron: jobs rural24-activate-featured y rural24-expire-featured registrados.';
  ELSE
    RAISE WARNING 'pg_cron no está habilitado. Habilitarlo en Supabase Dashboard → Database → Extensions.';
  END IF;
END;
$$;


-- =============================================================================
-- 5a. RPC: get_featured_slot_availability
-- =============================================================================
-- Consulta de disponibilidad para el checkout modal.
-- Devuelve para un ad+tier: si hay slot libre y en cuántos días estimados.
--
-- Parámetros:
--   p_ad_id  UUID    — aviso a destacar
--   p_tier   VARCHAR — 'alta' | 'media' | 'baja'
--
-- Retorna JSON:
--   available_now       BOOLEAN — hay slot libre hoy
--   active_count        INTEGER — cuántos activos hay en la categoría ahora
--   max_slots           INTEGER — cap de slots simultáneos (20 para homepage)
--   next_available_days INTEGER — días estimados hasta próximo slot (NULL si ahora)
--   existing_periods    INTEGER — cuántos períodos activos/pending tiene este ad
--   can_purchase        BOOLEAN — puede comprar (no alcanzó el máximo de 2)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.get_featured_slot_availability(
  p_ad_id UUID,
  p_tier  VARCHAR(10)
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ad             RECORD;
  v_max_slots      INTEGER := 20;
  v_active_count   INTEGER := 0;
  v_existing       INTEGER := 0;
  v_next_expiry    TIMESTAMPTZ;
  v_days_until     INTEGER;
  v_available_now  BOOLEAN;
  v_can_purchase   BOOLEAN;
BEGIN
  -- Validar tier
  IF p_tier NOT IN ('alta', 'media', 'baja') THEN
    RETURN json_build_object('error', 'Tier inválido. Usar: alta, media, baja');
  END IF;

  -- Obtener datos del aviso
  SELECT category_id, user_id INTO v_ad
  FROM public.ads
  WHERE id = p_ad_id AND status = 'active';

  IF v_ad IS NULL THEN
    RETURN json_build_object('error', 'Aviso no encontrado o no activo');
  END IF;

  -- Períodos existentes para este aviso
  SELECT COUNT(*) INTO v_existing
  FROM public.featured_ads
  WHERE ad_id = p_ad_id
    AND status IN ('active', 'pending');

  v_can_purchase := (v_existing < 2);

  -- Contar activos en la categoría para homepage (aplica a alta y media)
  IF p_tier IN ('alta', 'media') THEN
    SELECT COUNT(*) INTO v_active_count
    FROM public.featured_ads
    WHERE category_id = v_ad.category_id
      AND tier IN ('alta', 'media')
      AND status = 'active';

    -- Leer max_slots desde global_config
    BEGIN
      SELECT (value::json -> 'homepage' ->> 'max_active_per_category')::integer
      INTO v_max_slots
      FROM public.global_config
      WHERE key = 'slot_config';
    EXCEPTION WHEN OTHERS THEN
      v_max_slots := 20; -- fallback
    END;

    v_available_now := (v_active_count < v_max_slots);

    IF NOT v_available_now THEN
      -- Estimar cuándo se libera el próximo slot
      SELECT MIN(expires_at) INTO v_next_expiry
      FROM public.featured_ads
      WHERE category_id = v_ad.category_id
        AND tier IN ('alta', 'media')
        AND status = 'active';

      v_days_until := GREATEST(1, CEIL(EXTRACT(EPOCH FROM (v_next_expiry - NOW())) / 86400))::INTEGER;
    END IF;
  ELSE
    -- baja → detail no tiene cap de slots globales
    v_available_now := true;
    v_active_count  := 0;
    v_max_slots     := 0; -- no aplica
  END IF;

  RETURN json_build_object(
    'available_now',        v_available_now,
    'active_count',         v_active_count,
    'max_slots',            v_max_slots,
    'next_available_days',  v_days_until,
    'existing_periods',     v_existing,
    'can_purchase',         v_can_purchase
  );
END;
$$;


-- =============================================================================
-- 5b. RPC: activate_featured_by_tier
-- =============================================================================
-- Compra y activa un aviso destacado usando saldo ARS del wallet.
-- Crea 1 o 2 registros en featured_ads (según p_periods).
-- Debita del wallet en una sola transacción.
--
-- Parámetros:
--   p_user_id UUID          — usuario comprador
--   p_ad_id   UUID          — aviso a destacar
--   p_tier    VARCHAR(10)   — 'alta' | 'media' | 'baja'
--   p_periods SMALLINT(1)   — 1 o 2 períodos de 15 días
--
-- Retorna JSON:
--   success        BOOLEAN
--   featured_ids   UUID[]    — IDs creados (1 o 2)
--   new_balance    NUMERIC   — saldo tras el débito
--   status_p1      VARCHAR   — status del período 1
--   status_p2      VARCHAR   — status del período 2 (si aplica)
--   expires_at_p1  TIMESTAMPTZ
--   expires_at_p2  TIMESTAMPTZ (si aplica)
--   error          TEXT
-- =============================================================================

CREATE OR REPLACE FUNCTION public.activate_featured_by_tier(
  p_user_id UUID,
  p_ad_id   UUID,
  p_tier    VARCHAR(10),
  p_periods SMALLINT DEFAULT 1
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ad               RECORD;
  v_wallet           RECORD;
  v_tier_config      JSON;
  v_price_per_period NUMERIC;
  v_total_price      NUMERIC;
  v_existing_count   INTEGER := 0;
  v_periods_available SMALLINT;
  v_max_slots        INTEGER := 20;
  v_active_count     INTEGER := 0;

  -- Período 1
  v_sched_start_p1   DATE;
  v_expires_at_p1    TIMESTAMPTZ;
  v_status_p1        VARCHAR(20);
  v_featured_id_p1   UUID;

  -- Período 2
  v_sched_start_p2   DATE;
  v_expires_at_p2    TIMESTAMPTZ;
  v_status_p2        VARCHAR(20);
  v_featured_id_p2   UUID;

  v_new_balance      NUMERIC;
BEGIN
  -- ── 1. Validaciones básicas ────────────────────────────────────────────────

  IF p_tier NOT IN ('alta', 'media', 'baja') THEN
    RETURN json_build_object('success', false, 'error', 'Tier inválido. Usar: alta, media, baja');
  END IF;

  IF p_periods NOT IN (1, 2) THEN
    RETURN json_build_object('success', false, 'error', 'Períodos inválido. Usar: 1 o 2');
  END IF;

  -- ── 2. Verificar que el aviso pertenece al usuario y está activo ───────────

  SELECT id, category_id, subcategory_id, user_id
  INTO v_ad
  FROM public.ads
  WHERE id = p_ad_id
    AND user_id = p_user_id
    AND status = 'active';

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Aviso no encontrado, no activo o no te pertenece');
  END IF;

  -- ── 3. Verificar cuántos períodos activos/pending ya tiene este aviso ──────

  SELECT COUNT(*) INTO v_existing_count
  FROM public.featured_ads
  WHERE ad_id = p_ad_id
    AND status IN ('active', 'pending');

  v_periods_available := 2 - v_existing_count;

  IF v_periods_available <= 0 THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Este aviso ya tiene 2 períodos activos. Esperá que venza el actual para renovarlo.'
    );
  END IF;

  IF p_periods > v_periods_available THEN
    RETURN json_build_object(
      'success', false,
      'error', format('Solo podés comprar %s período(s) más para este aviso.', v_periods_available)
    );
  END IF;

  -- ── 4. Obtener precio del tier desde global_config ─────────────────────────

  BEGIN
    SELECT elem->>'price_ars'
    INTO v_price_per_period
    FROM public.global_config,
         json_array_elements(value::json) AS elem
    WHERE key = 'tier_config'
      AND elem->>'tier' = p_tier;
  EXCEPTION WHEN OTHERS THEN
    -- Fallback hardcoded si falla la lectura de config
    v_price_per_period := CASE p_tier
      WHEN 'alta'  THEN 7500
      WHEN 'media' THEN 5000
      WHEN 'baja'  THEN 2500
    END;
  END;

  IF v_price_per_period IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'No se pudo obtener el precio del tier');
  END IF;

  v_total_price := v_price_per_period * p_periods;

  -- ── 5. Verificar saldo del wallet ──────────────────────────────────────────

  SELECT * INTO v_wallet
  FROM public.user_wallets
  WHERE user_id = p_user_id
  FOR UPDATE; -- lock para evitar race conditions

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'No tenés saldo disponible. Canjeá un cupón para obtener saldo.');
  END IF;

  IF v_wallet.virtual_balance < v_total_price THEN
    RETURN json_build_object(
      'success', false,
      'error', format(
        'Saldo insuficiente. Necesitás $%s ARS y tenés $%s ARS.',
        v_total_price::INTEGER,
        v_wallet.virtual_balance::INTEGER
      )
    );
  END IF;

  -- ── 6. Determinar scheduled_start y status para cada período ──────────────

  -- Leer max_slots para homepage
  IF p_tier IN ('alta', 'media') THEN
    BEGIN
      SELECT (value::json -> 'homepage' ->> 'max_active_per_category')::integer
      INTO v_max_slots
      FROM public.global_config WHERE key = 'slot_config';
    EXCEPTION WHEN OTHERS THEN
      v_max_slots := 20;
    END;

    SELECT COUNT(*) INTO v_active_count
    FROM public.featured_ads
    WHERE category_id = v_ad.category_id
      AND tier IN ('alta', 'media')
      AND status = 'active';
  END IF;

  -- PERÍODO 1
  -- Si hay slot disponible → pending con scheduled_start=hoy (cron activa en 15min)
  -- Si no hay slot → pending en cola con scheduled_start estimado
  IF p_tier IN ('alta', 'media') AND v_active_count >= v_max_slots THEN
    -- Cola: scheduled_start = fecha estimada de próximo slot
    SELECT COALESCE(MIN(expires_at)::date, CURRENT_DATE + 1)
    INTO v_sched_start_p1
    FROM public.featured_ads
    WHERE category_id = v_ad.category_id
      AND tier IN ('alta', 'media')
      AND status = 'active';
  ELSE
    v_sched_start_p1 := CURRENT_DATE;
  END IF;

  v_expires_at_p1 := (v_sched_start_p1 + INTERVAL '15 days');
  v_status_p1     := 'pending'; -- el cron lo activa al llegar scheduled_start

  -- PERÍODO 2 (si aplica)
  IF p_periods = 2 THEN
    v_sched_start_p2 := v_expires_at_p1::date;
    v_expires_at_p2  := v_sched_start_p2 + INTERVAL '15 days';
    v_status_p2      := 'pending';
  END IF;

  -- ── 7. Ejecutar transacción ────────────────────────────────────────────────

  -- 7a. Debitar wallet
  v_new_balance := v_wallet.virtual_balance - v_total_price;

  UPDATE public.user_wallets
  SET virtual_balance = v_new_balance,
      updated_at      = NOW()
  WHERE user_id = p_user_id;

  -- 7b. Registrar en ledger
  INSERT INTO public.wallet_transactions (
    user_id, bucket, tx_type, amount, balance_after,
    source, description, featured_ad_id
  ) VALUES (
    p_user_id,
    'virtual',
    'debit',
    v_total_price,
    v_new_balance,
    'featured_spend',
    format('Aviso Destacado %s — %s período(s) × $%s ARS',
           upper(p_tier), p_periods, v_price_per_period::INTEGER),
    NULL -- se actualiza abajo con el ID real
  );

  -- 7c. Crear registro período 1
  INSERT INTO public.featured_ads (
    ad_id, user_id, tier, period_number,
    category_id, subcategory_id,
    scheduled_start, expires_at, duration_days,
    status, credit_consumed, requires_payment,
    placement -- legacy: derivado del tier para compat con código viejo
  ) VALUES (
    p_ad_id, p_user_id, p_tier, (v_existing_count + 1),
    v_ad.category_id, v_ad.subcategory_id,
    v_sched_start_p1, v_expires_at_p1, 15,
    v_status_p1, true, true,
    CASE p_tier WHEN 'baja' THEN 'detail' ELSE 'homepage' END
  )
  RETURNING id INTO v_featured_id_p1;

  -- 7d. Crear registro período 2 (si aplica)
  IF p_periods = 2 THEN
    INSERT INTO public.featured_ads (
      ad_id, user_id, tier, period_number,
      category_id, subcategory_id,
      scheduled_start, expires_at, duration_days,
      status, credit_consumed, requires_payment,
      placement
    ) VALUES (
      p_ad_id, p_user_id, p_tier, (v_existing_count + 2),
      v_ad.category_id, v_ad.subcategory_id,
      v_sched_start_p2, v_expires_at_p2, 15,
      v_status_p2, true, true,
      CASE p_tier WHEN 'baja' THEN 'detail' ELSE 'homepage' END
    )
    RETURNING id INTO v_featured_id_p2;
  END IF;

  -- 7e. Registrar en audit
  INSERT INTO public.featured_ads_audit (
    featured_ad_id, action, performed_by,
    metadata
  ) VALUES (
    v_featured_id_p1, 'created', p_user_id,
    json_build_object(
      'tier', p_tier,
      'periods', p_periods,
      'price_ars', v_total_price,
      'period_2_id', v_featured_id_p2
    )
  );

  -- ── 8. Resultado ──────────────────────────────────────────────────────────

  RETURN json_build_object(
    'success',       true,
    'featured_id_p1', v_featured_id_p1,
    'featured_id_p2', v_featured_id_p2,
    'tier',           p_tier,
    'periods',        p_periods,
    'price_ars',      v_total_price,
    'new_balance',    v_new_balance,
    'status_p1',      v_status_p1,
    'expires_at_p1',  v_expires_at_p1,
    'status_p2',      v_status_p2,
    'expires_at_p2',  v_expires_at_p2,
    'queued',         (v_sched_start_p1 > CURRENT_DATE)
  );

EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'error',   SQLERRM
  );
END;
$$;


-- =============================================================================
-- 5c. RPC: get_featured_homepage
-- =============================================================================
-- Retorna avisos destacados para Homepage, filtrados por categoría padre.
-- Tiers: alta + media. Orden: FIFO por actual_start.
-- Fallback: si no hay suficientes en la categoría, no completa (homepage es estricta).

CREATE OR REPLACE FUNCTION public.get_featured_homepage(
  p_category_id UUID,
  p_limit       INTEGER DEFAULT 20
)
RETURNS TABLE (
  featured_id    UUID,
  ad_id          UUID,
  tier           VARCHAR,
  actual_start   TIMESTAMPTZ,
  expires_at     TIMESTAMPTZ,
  title          VARCHAR,
  slug           VARCHAR,
  price          NUMERIC,
  images         JSONB,
  province       VARCHAR,
  city           VARCHAR,
  subcategory_id UUID,
  user_id        UUID
)
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT
    fa.id          AS featured_id,
    fa.ad_id,
    fa.tier,
    fa.actual_start,
    fa.expires_at,
    a.title,
    a.slug,
    a.price,
    a.images,
    a.province,
    a.city,
    fa.subcategory_id,
    fa.user_id
  FROM public.featured_ads fa
  JOIN public.ads a ON a.id = fa.ad_id
  WHERE fa.status = 'active'
    AND fa.tier IN ('alta', 'media')
    AND fa.category_id = p_category_id
    AND fa.expires_at > NOW()
    AND a.status = 'active'
  ORDER BY fa.actual_start ASC  -- FIFO: el más antiguo primero
  LIMIT p_limit;
$$;


-- =============================================================================
-- 5d. RPC: get_featured_results
-- =============================================================================
-- Retorna avisos destacados para página de Resultados.
-- Prioridad: subcategoría exacta primero → fallback a subcategorías hermanas.
-- Tiers: alta + media. Orden: FIFO por actual_start.

CREATE OR REPLACE FUNCTION public.get_featured_results(
  p_subcategory_id UUID,
  p_category_id    UUID,
  p_limit          INTEGER DEFAULT 18
)
RETURNS TABLE (
  featured_id      UUID,
  ad_id            UUID,
  tier             VARCHAR,
  actual_start     TIMESTAMPTZ,
  expires_at       TIMESTAMPTZ,
  title            VARCHAR,
  slug             VARCHAR,
  price            NUMERIC,
  images           JSONB,
  province         VARCHAR,
  city             VARCHAR,
  subcategory_id   UUID,
  match_type       TEXT    -- 'exact' | 'sibling' — para debugging/analytics
)
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  WITH exact_match AS (
    SELECT
      fa.id          AS featured_id,
      fa.ad_id,
      fa.tier,
      fa.actual_start,
      fa.expires_at,
      a.title,
      a.slug,
      a.price,
      a.images,
      a.province,
      a.city,
      fa.subcategory_id,
      'exact'::text AS match_type
    FROM public.featured_ads fa
    JOIN public.ads a ON a.id = fa.ad_id
    WHERE fa.status = 'active'
      AND fa.tier IN ('alta', 'media')
      AND fa.subcategory_id = p_subcategory_id
      AND fa.expires_at > NOW()
      AND a.status = 'active'
    ORDER BY fa.actual_start ASC
    LIMIT p_limit
  ),
  sibling_fill AS (
    SELECT
      fa.id          AS featured_id,
      fa.ad_id,
      fa.tier,
      fa.actual_start,
      fa.expires_at,
      a.title,
      a.slug,
      a.price,
      a.images,
      a.province,
      a.city,
      fa.subcategory_id,
      'sibling'::text AS match_type
    FROM public.featured_ads fa
    JOIN public.ads a ON a.id = fa.ad_id
    WHERE fa.status = 'active'
      AND fa.tier IN ('alta', 'media')
      AND fa.category_id = p_category_id
      AND (fa.subcategory_id != p_subcategory_id OR fa.subcategory_id IS NULL)
      AND fa.expires_at > NOW()
      AND a.status = 'active'
      AND NOT EXISTS (SELECT 1 FROM exact_match em WHERE em.featured_id = fa.id)
    ORDER BY fa.actual_start ASC
    LIMIT p_limit
  )
  SELECT * FROM exact_match
  UNION ALL
  SELECT * FROM sibling_fill
  LIMIT p_limit;
$$;


-- =============================================================================
-- 5e. RPC: get_featured_detail
-- =============================================================================
-- Retorna avisos destacados para página de Detalle de aviso.
-- Todos los tiers. Orden: prioridad tier + cap diario + random.
-- Excluye el aviso que se está viendo (p_ad_id).

CREATE OR REPLACE FUNCTION public.get_featured_detail(
  p_ad_id       UUID,
  p_category_id UUID,
  p_limit       INTEGER DEFAULT 15
)
RETURNS TABLE (
  featured_id    UUID,
  ad_id          UUID,
  tier           VARCHAR,
  expires_at     TIMESTAMPTZ,
  title          VARCHAR,
  slug           VARCHAR,
  price          NUMERIC,
  images         JSONB,
  province       VARCHAR,
  city           VARCHAR,
  subcategory_id UUID,
  today_count    INTEGER
)
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  WITH daily_impressions AS (
    SELECT featured_ad_id, count AS imp_count
    FROM public.featured_daily_impressions
    WHERE placement = 'detail'
      AND imp_date = CURRENT_DATE
  ),
  candidates AS (
    SELECT
      fa.id                     AS featured_id,
      fa.ad_id,
      fa.tier,
      fa.expires_at,
      a.title,
      a.slug,
      a.price,
      a.images,
      a.province,
      a.city,
      fa.subcategory_id,
      COALESCE(di.imp_count, 0) AS today_count,
      -- daily_cap por tier (hardcoded fallback; leído de slot_config si disponible)
      CASE fa.tier
        WHEN 'alta'  THEN 50
        WHEN 'media' THEN 30
        ELSE              15
      END AS tier_cap,
      -- tier_rank para priorizar por visibilidad
      CASE fa.tier
        WHEN 'alta'  THEN 1
        WHEN 'media' THEN 2
        ELSE              3
      END AS tier_rank
    FROM public.featured_ads fa
    JOIN public.ads a ON a.id = fa.ad_id
    LEFT JOIN daily_impressions di ON di.featured_ad_id = fa.id
    WHERE fa.status = 'active'
      AND fa.category_id = p_category_id
      AND fa.ad_id != p_ad_id
      AND fa.expires_at > NOW()
      AND a.status = 'active'
  )
  SELECT
    featured_id, ad_id, tier, expires_at,
    title, slug, price, images, province, city,
    subcategory_id, today_count
  FROM candidates
  ORDER BY
    -- 1: bajo cap (0) antes que sobre cap (1)
    CASE WHEN today_count < tier_cap THEN 0 ELSE 1 END ASC,
    -- 2: prioridad por tier
    tier_rank ASC,
    -- 3: random para variedad
    RANDOM()
  LIMIT p_limit;
$$;


-- =============================================================================
-- 5f. RPC: record_featured_impressions
-- =============================================================================
-- Registra impresiones cuando el frontend monta un carrusel en Detail.
-- Llama con los IDs de los avisos mostrados para incrementar sus contadores.
-- Diseñado para llamarse UNA VEZ por render de carrusel (no por scroll).

CREATE OR REPLACE FUNCTION public.record_featured_impressions(
  p_featured_ids UUID[],
  p_placement    VARCHAR(20) DEFAULT 'detail'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_placement NOT IN ('homepage', 'results', 'detail') THEN
    RAISE EXCEPTION 'Placement inválido: %', p_placement;
  END IF;

  INSERT INTO public.featured_daily_impressions (featured_ad_id, placement, imp_date, count)
  SELECT
    unnest(p_featured_ids),
    p_placement,
    CURRENT_DATE,
    1
  ON CONFLICT (featured_ad_id, placement, imp_date)
  DO UPDATE SET count = featured_daily_impressions.count + 1;
END;
$$;


-- =============================================================================
-- 5g. RPC: increment_ad_view
-- =============================================================================
-- Incrementa el contador de vistas de un aviso (campo ads.views).
-- Llamado desde la página de detalle al montar el componente.
-- ads.views ya existe en el schema — solo faltaba el RPC.

CREATE OR REPLACE FUNCTION public.increment_ad_view(
  p_ad_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.ads
  SET views = views + 1
  WHERE id = p_ad_id
    AND status = 'active';
END;
$$;

-- Permisos: cualquier rol puede llamar increment_ad_view
-- (vistas se cuentan también para anónimos)
GRANT EXECUTE ON FUNCTION public.increment_ad_view(UUID) TO anon, authenticated;

-- Permisos: solo authenticated puede comprar o consultar disponibilidad
GRANT EXECUTE ON FUNCTION public.activate_featured_by_tier(UUID, UUID, VARCHAR, SMALLINT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_featured_slot_availability(UUID, VARCHAR) TO authenticated;

-- Permisos: queries públicas (homepage, results, detail son visibles para todos)
GRANT EXECUTE ON FUNCTION public.get_featured_homepage(UUID, INTEGER) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_featured_results(UUID, UUID, INTEGER) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_featured_detail(UUID, UUID, INTEGER) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_featured_impressions(UUID[], VARCHAR) TO anon, authenticated;


-- =============================================================================
-- FIN DE MIGRATION
-- =============================================================================
-- Próximos pasos post-migración:
--   1. Habilitar pg_cron en Supabase Dashboard → Database → Extensions
--   2. Verificar jobs: SELECT * FROM cron.job WHERE jobname LIKE 'rural24%';
--   3. Sprint 3B: Modal FeaturedCheckoutModal en frontend
--   4. Sprint 3C: Reemplazar llamadas a getFeaturedForHomepage/Results/Detail
--      con las nuevas RPCs get_featured_homepage/results/detail
-- =============================================================================
