-- ============================================================
-- Migration: 20260316000001_notifications_favorites.sql
-- Sprint 10 — Notificaciones + Favoritos
-- Fecha: 2026-03-16
-- ============================================================

-- ============================================================
-- 1. TABLA notifications (centro de todas las notificaciones)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.notifications (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type       text        NOT NULL,
  -- Tipos: destacado_activado | destacado_por_vencer | aviso_publicado
  --        aviso_expirado | nuevo_contacto | cupon_canjeado | nuevo_aviso_favorito
  title      text        NOT NULL,
  body       text,
  is_read    boolean     NOT NULL DEFAULT false,
  read_at    timestamptz,
  data       jsonb,      -- { ad_id, conversation_id, subcategory_id, etc }
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user_unread
  ON public.notifications(user_id, is_read, created_at DESC);

CREATE INDEX idx_notifications_user_created
  ON public.notifications(user_id, created_at DESC);

-- RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_notifications" ON public.notifications
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "service_role_all_notifications" ON public.notifications
  FOR ALL TO service_role USING (true);

-- ============================================================
-- 2. TABLA user_favorites
-- Dos modos: bookmark de aviso (ad_id) + seguir subcategoría (subcategory_id)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.user_favorites (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  ad_id          uuid        REFERENCES public.ads(id) ON DELETE CASCADE,
  subcategory_id uuid        REFERENCES public.subcategories(id) ON DELETE CASCADE,
  notify_new_ads boolean     NOT NULL DEFAULT true,
  created_at     timestamptz NOT NULL DEFAULT now(),
  -- Solo un tipo activo por fila
  CONSTRAINT fav_type_check CHECK (
    (ad_id IS NOT NULL AND subcategory_id IS NULL) OR
    (ad_id IS NULL AND subcategory_id IS NOT NULL)
  ),
  UNIQUE(user_id, ad_id),
  UNIQUE(user_id, subcategory_id)
);

CREATE INDEX idx_user_favorites_user ON public.user_favorites(user_id);
CREATE INDEX idx_user_favorites_subcategory ON public.user_favorites(subcategory_id)
  WHERE subcategory_id IS NOT NULL;

-- RLS
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_favorites" ON public.user_favorites
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "service_role_all_favorites" ON public.user_favorites
  FOR ALL TO service_role USING (true);

-- ============================================================
-- 3. TRIGGER: nuevo mensaje en contact_messages → notificación al receptor
-- ============================================================

CREATE OR REPLACE FUNCTION public.trg_fn_notify_new_contact()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ad_title text;
BEGIN
  -- Obtener título del aviso
  SELECT COALESCE(title, 'Tu aviso') INTO v_ad_title
  FROM public.ads WHERE id = NEW.ad_id;

  INSERT INTO public.notifications(user_id, type, title, body, data)
  VALUES (
    NEW.ad_owner_id,
    'nuevo_contacto',
    'Nuevo mensaje recibido',
    COALESCE(NEW.sender_name, 'Alguien') || ' te escribió sobre "' || left(v_ad_title, 50) || '"',
    jsonb_build_object(
      'ad_id',          NEW.ad_id,
      'message_id',     NEW.id,
      'sender_name',    NEW.sender_name,
      'sender_email',   NEW.sender_email
    )
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_new_contact ON public.contact_messages;
CREATE TRIGGER trg_notify_new_contact
  AFTER INSERT ON public.contact_messages
  FOR EACH ROW
  WHEN (NEW.ad_owner_id IS NOT NULL)
  EXECUTE FUNCTION public.trg_fn_notify_new_contact();

-- ============================================================
-- 4. TRIGGER: aviso activo → notificar seguidores de subcategoría
-- ============================================================

CREATE OR REPLACE FUNCTION public.trg_fn_notify_subcategory_followers()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sub_name text;
BEGIN
  -- Solo cuando el aviso pasa a 'active' (nuevo o transición)
  IF NEW.status = 'active' AND (OLD IS NULL OR OLD.status IS DISTINCT FROM 'active') THEN
    -- Obtener nombre de subcategoría
    SELECT COALESCE(display_name, name) INTO v_sub_name
    FROM public.subcategories WHERE id = NEW.subcategory_id;

    INSERT INTO public.notifications(user_id, type, title, body, data)
    SELECT
      uf.user_id,
      'nuevo_aviso_favorito',
      'Nuevo aviso en ' || COALESCE(v_sub_name, 'tu categoría favorita'),
      '"' || left(NEW.title, 60) || '"',
      jsonb_build_object(
        'ad_id',          NEW.id,
        'subcategory_id', NEW.subcategory_id,
        'ad_slug',        NEW.slug
      )
    FROM public.user_favorites uf
    WHERE uf.subcategory_id = NEW.subcategory_id
      AND uf.notify_new_ads = true
      AND uf.user_id != NEW.user_id;  -- no notificar al publicador
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_subcategory_followers ON public.ads;
CREATE TRIGGER trg_notify_subcategory_followers
  AFTER INSERT OR UPDATE OF status ON public.ads
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_fn_notify_subcategory_followers();

-- ============================================================
-- 5. RPC: mark_notifications_read — marcar notificaciones como leídas
-- ============================================================

CREATE OR REPLACE FUNCTION public.mark_notifications_read(p_user_id uuid, p_ids uuid[] DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_ids IS NULL THEN
    -- Marcar todas
    UPDATE public.notifications
    SET is_read = true, read_at = now()
    WHERE user_id = p_user_id AND is_read = false;
  ELSE
    -- Marcar las específicas
    UPDATE public.notifications
    SET is_read = true, read_at = now()
    WHERE user_id = p_user_id AND id = ANY(p_ids) AND is_read = false;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.mark_notifications_read(uuid, uuid[]) TO authenticated;

-- ============================================================
-- 6. pg_cron: destacados por vencer (diario 9:00 AM UTC-3 = 12:00 UTC)
-- ============================================================

SELECT cron.schedule(
  'rural24-featured-expiry-check',
  '0 12 * * *',
  $$
    INSERT INTO public.notifications(user_id, type, title, body, data)
    SELECT
      a.user_id,
      'destacado_por_vencer',
      '¡Tu destacado vence mañana!',
      'El aviso "' || left(a.title, 50) || '" pierde el destacado en menos de 24 horas.',
      jsonb_build_object('ad_id', a.id, 'ad_slug', a.slug)
    FROM public.featured_ads fa
    JOIN public.ads a ON a.id = fa.ad_id
    WHERE fa.expires_at BETWEEN now() AND now() + interval '25 hours'
      AND fa.is_active = true
      AND a.user_id IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM public.notifications n
        WHERE n.data->>'ad_id' = fa.ad_id::text
          AND n.type = 'destacado_por_vencer'
          AND n.created_at > now() - interval '24 hours'
      );
  $$
);
