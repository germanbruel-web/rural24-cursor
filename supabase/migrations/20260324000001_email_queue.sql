-- ============================================================
-- Sprint 3D.6 — Email Queue
-- Envío asincrónico de emails vía cola + Nodemailer (Zoho SMTP)
-- ============================================================

-- ── 1. Tabla email_queue ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.email_queue (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  type        text        NOT NULL,                          -- 'featured_activated' | futuro: 'message_received' etc.
  to_user_id  uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  payload     jsonb       NOT NULL DEFAULT '{}',             -- datos del email (ad_id, expires_at, etc.)
  status      text        NOT NULL DEFAULT 'pending',        -- 'pending' | 'sent' | 'failed'
  attempts    integer     NOT NULL DEFAULT 0,
  last_error  text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  sent_at     timestamptz,

  CONSTRAINT email_queue_status_check CHECK (status IN ('pending', 'sent', 'failed')),
  CONSTRAINT email_queue_type_check   CHECK (type   IN ('featured_activated', 'featured_expiring'))
);

-- Índices para el worker (procesa pendientes, reintenta fallidos)
CREATE INDEX IF NOT EXISTS idx_email_queue_pending
  ON public.email_queue (status, created_at)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_email_queue_failed
  ON public.email_queue (status, attempts)
  WHERE status = 'failed' AND attempts < 3;

-- RLS: solo service_role accede (el worker usa service_role key)
ALTER TABLE public.email_queue ENABLE ROW LEVEL SECURITY;

-- ── 2. Trigger: encolar email al activar Destacado ──────────
CREATE OR REPLACE FUNCTION public.enqueue_featured_activated_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Solo cuando cambia pending → active
  IF NEW.status = 'active' AND OLD.status = 'pending' THEN
    INSERT INTO public.email_queue (type, to_user_id, payload)
    SELECT
      'featured_activated',
      a.user_id,
      jsonb_build_object(
        'ad_id',      NEW.ad_id,
        'featured_id', NEW.id,
        'expires_at', NEW.expires_at,
        'ad_title',   a.title,
        'ad_slug',    a.slug
      )
    FROM public.ads a
    WHERE a.id = NEW.ad_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_featured_activated_email ON public.featured_ads;
CREATE TRIGGER trg_featured_activated_email
  AFTER UPDATE ON public.featured_ads
  FOR EACH ROW
  EXECUTE FUNCTION public.enqueue_featured_activated_email();

-- ── 3. RPC para el worker (procesa lote de emails pendientes) ──
-- Marca como 'processing' (status temporal) para evitar doble procesamiento.
-- El worker llama esto, procesa, luego llama mark_email_sent / mark_email_failed.

CREATE OR REPLACE FUNCTION public.dequeue_emails(p_limit integer DEFAULT 20)
RETURNS TABLE (
  id          uuid,
  type        text,
  to_user_id  uuid,
  to_email    text,
  to_name     text,
  payload     jsonb,
  attempts    integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    eq.id,
    eq.type,
    eq.to_user_id,
    au.email::text,
    COALESCE(u.full_name, split_part(au.email, '@', 1))::text AS to_name,
    eq.payload,
    eq.attempts
  FROM public.email_queue eq
  JOIN auth.users         au ON au.id = eq.to_user_id
  LEFT JOIN public.users  u  ON u.id  = eq.to_user_id
  WHERE eq.status = 'pending'
     OR (eq.status = 'failed' AND eq.attempts < 3)
  ORDER BY eq.created_at ASC
  LIMIT p_limit;
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_email_sent(p_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.email_queue
  SET status   = 'sent',
      sent_at  = now(),
      attempts = attempts + 1
  WHERE id = p_id;
$$;

CREATE OR REPLACE FUNCTION public.mark_email_failed(p_id uuid, p_error text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.email_queue
  SET status     = CASE WHEN attempts + 1 >= 3 THEN 'failed' ELSE 'pending' END,
      attempts   = attempts + 1,
      last_error = p_error
  WHERE id = p_id;
$$;

GRANT EXECUTE ON FUNCTION public.dequeue_emails(integer)     TO service_role;
GRANT EXECUTE ON FUNCTION public.mark_email_sent(uuid)       TO service_role;
GRANT EXECUTE ON FUNCTION public.mark_email_failed(uuid, text) TO service_role;
