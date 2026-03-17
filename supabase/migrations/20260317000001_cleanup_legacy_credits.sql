-- ================================================================
-- Sprint: Limpieza tablas legacy créditos (#9) + credits_amount frontend (#10 parcial)
-- Fecha: 2026-03-17
-- Tablas eliminadas: user_credits, user_featured_credits, credit_transactions
-- RPCs actualizadas: admin_cancel_featured_ad (wallets), admin_get_featured_ads (sin transaction_id)
-- RPCs stubbeadas: grant_monthly_credits, grant_signup_promo, purchase_credits
-- ================================================================

-- ================================================================
-- STEP 1: Reescribir admin_cancel_featured_ad — usa user_wallets / wallet_transactions
-- ================================================================

CREATE OR REPLACE FUNCTION public.admin_cancel_featured_ad(
  p_featured_ad_id uuid,
  p_admin_id       uuid,
  p_reason         text    DEFAULT NULL::text,
  p_refund         boolean DEFAULT false
) RETURNS jsonb
  LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_featured_ad    RECORD;
  v_refund_amount  NUMERIC(14,2) := 0;
  v_new_balance    NUMERIC(14,2);
  v_can_refund     BOOLEAN := FALSE;
BEGIN
  SELECT * INTO v_featured_ad
  FROM featured_ads
  WHERE id = p_featured_ad_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', FALSE, 'error', 'Featured ad no encontrado');
  END IF;

  IF v_featured_ad.status = 'cancelled' THEN
    RETURN jsonb_build_object('success', FALSE, 'error', 'Featured ad ya está cancelado');
  END IF;

  IF v_featured_ad.refunded = TRUE THEN
    RETURN jsonb_build_object('success', FALSE, 'error', 'Ya se realizó un reembolso anteriormente');
  END IF;

  v_can_refund := (v_featured_ad.credit_consumed = TRUE AND p_refund = TRUE);

  -- Cancelar featured ad
  UPDATE featured_ads
  SET
    status           = 'cancelled',
    cancelled_by     = p_admin_id,
    cancelled_reason = p_reason,
    cancelled_at     = NOW(),
    refunded         = v_can_refund,
    updated_at       = NOW()
  WHERE id = p_featured_ad_id;

  -- Reembolso proporcional via wallet (nuevo sistema)
  IF v_can_refund THEN
    v_refund_amount := COALESCE(
      public.calculate_featured_refund(p_featured_ad_id)::NUMERIC,
      0
    );

    IF v_refund_amount > 0 THEN
      UPDATE public.user_wallets
      SET virtual_balance = virtual_balance + v_refund_amount,
          updated_at      = NOW()
      WHERE user_id = v_featured_ad.user_id
      RETURNING virtual_balance INTO v_new_balance;

      INSERT INTO public.wallet_transactions (
        user_id, bucket, tx_type, amount, balance_after,
        source, description, featured_ad_id
      ) VALUES (
        v_featured_ad.user_id,
        'virtual',
        'credit',
        v_refund_amount,
        v_new_balance,
        'featured_refund',
        'Reembolso proporcional por cancelación de destacado: ' || COALESCE(p_reason, 'cancelado por admin'),
        p_featured_ad_id
      );
    END IF;
  END IF;

  -- Auditoría
  INSERT INTO featured_ads_audit (featured_ad_id, action, performed_by, reason, metadata)
  VALUES (
    p_featured_ad_id,
    CASE WHEN v_can_refund THEN 'refunded' ELSE 'cancelled' END,
    p_admin_id,
    p_reason,
    jsonb_build_object(
      'refund_amount',          v_refund_amount,
      'new_balance',            v_new_balance,
      'previous_status',        v_featured_ad.status,
      'was_superadmin_created', NOT v_featured_ad.credit_consumed
    )
  );

  IF NOT v_featured_ad.credit_consumed AND p_refund = TRUE THEN
    RETURN jsonb_build_object(
      'success', TRUE, 'refunded', FALSE, 'refund_amount', 0, 'user_balance', NULL,
      'message', 'Featured ad cancelado (creado por SuperAdmin sin consumir saldo)'
    );
  ELSE
    RETURN jsonb_build_object(
      'success',       TRUE,
      'refunded',      v_can_refund,
      'refund_amount', v_refund_amount,
      'user_balance',  v_new_balance
    );
  END IF;
END;
$$;


-- ================================================================
-- STEP 2: Stub funciones legacy (ya no usadas activamente)
-- ================================================================

CREATE OR REPLACE FUNCTION public.grant_monthly_credits() RETURNS json
  LANGUAGE plpgsql AS $$
BEGIN
  RETURN json_build_object(
    'success', false,
    'error', 'Función obsoleta — sistema migrado a user_wallets'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.grant_signup_promo(p_user_id uuid) RETURNS json
  LANGUAGE plpgsql AS $$
BEGIN
  RETURN json_build_object(
    'success', false,
    'error', 'Función obsoleta — sistema migrado a user_wallets'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.purchase_credits(
  p_user_id   uuid,
  p_credits   integer,
  p_payment_id uuid
) RETURNS json
  LANGUAGE plpgsql AS $$
BEGIN
  RETURN json_build_object(
    'success', false,
    'error', 'Función obsoleta — sistema migrado a user_wallets'
  );
END;
$$;


-- ================================================================
-- STEP 3: Actualizar admin_get_featured_ads — eliminar transaction_id
-- (DROP previo necesario: cambia el tipo de retorno)
-- ================================================================

DROP FUNCTION IF EXISTS public.admin_get_featured_ads(
  character varying[], character varying, uuid, uuid, text, date, date, integer, integer
);

CREATE OR REPLACE FUNCTION public.admin_get_featured_ads(
  p_status      character varying[] DEFAULT NULL::character varying[],
  p_placement   character varying   DEFAULT NULL::character varying,
  p_category_id uuid                DEFAULT NULL::uuid,
  p_user_id     uuid                DEFAULT NULL::uuid,
  p_search      text                DEFAULT NULL::text,
  p_date_from   date                DEFAULT NULL::date,
  p_date_to     date                DEFAULT NULL::date,
  p_limit       integer             DEFAULT 50,
  p_offset      integer             DEFAULT 0
) RETURNS TABLE(
  id               uuid,
  ad_id            uuid,
  user_id          uuid,
  placement        text,
  category_id      uuid,
  scheduled_start  date,
  actual_start     timestamp with time zone,
  expires_at       timestamp with time zone,
  duration_days    integer,
  status           text,
  priority         integer,
  credit_consumed  boolean,
  refunded         boolean,
  cancelled_by     uuid,
  cancelled_reason text,
  cancelled_at     timestamp with time zone,
  created_at       timestamp with time zone,
  updated_at       timestamp with time zone,
  ad_title         text,
  ad_slug          text,
  ad_images        jsonb,
  ad_price         numeric,
  ad_currency      text,
  ad_status        text,
  user_email       text,
  user_full_name   text,
  user_role        text,
  category_name    text,
  category_slug    text,
  total_count      bigint
)
  LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH filtered_ads AS (
    SELECT
      fa.id,
      fa.ad_id,
      fa.user_id,
      fa.placement::TEXT,
      fa.category_id,
      fa.scheduled_start,
      fa.actual_start,
      fa.expires_at,
      fa.duration_days,
      fa.status::TEXT,
      fa.priority,
      fa.credit_consumed,
      COALESCE(fa.refunded, FALSE),
      fa.cancelled_by,
      fa.cancelled_reason,
      fa.cancelled_at,
      fa.created_at,
      fa.updated_at,
      a.title::TEXT,
      a.slug::TEXT,
      a.images,
      a.price,
      a.currency::TEXT,
      a.status::TEXT,
      u.email::TEXT,
      u.full_name::TEXT,
      u.role::TEXT,
      c.name::TEXT,
      c.slug::TEXT
    FROM featured_ads fa
    LEFT JOIN ads       a ON fa.ad_id       = a.id
    LEFT JOIN users     u ON fa.user_id     = u.id
    LEFT JOIN categories c ON fa.category_id = c.id
    WHERE
      (p_status      IS NULL OR fa.status      = ANY(p_status))
      AND (p_placement   IS NULL OR fa.placement   = p_placement)
      AND (p_category_id IS NULL OR fa.category_id = p_category_id)
      AND (p_user_id     IS NULL OR fa.user_id     = p_user_id)
      AND (p_search      IS NULL OR
           a.title     ILIKE '%' || p_search || '%' OR
           u.email     ILIKE '%' || p_search || '%' OR
           u.full_name ILIKE '%' || p_search || '%')
      AND (p_date_from IS NULL OR fa.scheduled_start >= p_date_from)
      AND (p_date_to   IS NULL OR fa.scheduled_start <= p_date_to)
  ),
  total AS (SELECT COUNT(*) AS cnt FROM filtered_ads)
  SELECT fa.*, (SELECT cnt FROM total)
  FROM filtered_ads fa
  ORDER BY fa.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;


-- ================================================================
-- STEP 4: Eliminar FK y columna transaction_id de featured_ads
-- ================================================================

ALTER TABLE public.featured_ads
  DROP CONSTRAINT IF EXISTS featured_ads_transaction_id_fkey;

ALTER TABLE public.featured_ads
  DROP COLUMN IF EXISTS transaction_id;


-- ================================================================
-- STEP 5: DROP tablas legacy (CASCADE para eliminar constraints residuales)
-- ================================================================

DROP TABLE IF EXISTS public.backup_credit_transactions_featured_20260226 CASCADE;
DROP TABLE IF EXISTS public.credit_transactions CASCADE;
DROP TABLE IF EXISTS public.user_credits CASCADE;
DROP TABLE IF EXISTS public.user_featured_credits CASCADE;

DO $$ BEGIN
  RAISE NOTICE '✅ Limpieza legacy credits completada — tablas eliminadas: credit_transactions, user_credits, user_featured_credits';
END $$;
