-- ============================================================
-- Migration: 20260318000002 — Sistema de Chat P2P
-- Fecha: 2026-03-18
-- Modelo: chat_channels (ad_id + buyer + seller) + chat_messages
-- ============================================================

-- ── 1. TABLAS ────────────────────────────────────────────────

CREATE TABLE public.chat_channels (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id            uuid NOT NULL REFERENCES public.ads(id) ON DELETE CASCADE,
  buyer_id         uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  seller_id        uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at       timestamptz NOT NULL DEFAULT now(),
  last_message_at  timestamptz NOT NULL DEFAULT now(),
  last_message_preview text,
  buyer_unread     int NOT NULL DEFAULT 0,
  seller_unread    int NOT NULL DEFAULT 0,
  status           varchar(20) NOT NULL DEFAULT 'active'
                   CHECK (status IN ('active', 'archived', 'blocked')),
  CONSTRAINT uq_channel_ad_buyer    UNIQUE (ad_id, buyer_id),
  CONSTRAINT chk_no_self_chat       CHECK  (buyer_id <> seller_id)
);

COMMENT ON TABLE public.chat_channels IS
  'Canal P2P por aviso: un comprador solo puede abrir un canal por aviso';
COMMENT ON COLUMN public.chat_channels.buyer_unread  IS 'Mensajes sin leer para el comprador';
COMMENT ON COLUMN public.chat_channels.seller_unread IS 'Mensajes sin leer para el vendedor';

CREATE TABLE public.chat_messages (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id  uuid NOT NULL REFERENCES public.chat_channels(id) ON DELETE CASCADE,
  sender_id   uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  message     text NOT NULL CHECK (char_length(message) >= 1),
  is_read     boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.chat_messages IS
  'Mensajes dentro de un canal de chat P2P';


-- ── 2. ÍNDICES ───────────────────────────────────────────────

CREATE INDEX idx_chat_channels_buyer   ON public.chat_channels (buyer_id,  last_message_at DESC);
CREATE INDEX idx_chat_channels_seller  ON public.chat_channels (seller_id, last_message_at DESC);
CREATE INDEX idx_chat_channels_ad      ON public.chat_channels (ad_id);
CREATE INDEX idx_chat_messages_channel ON public.chat_messages (channel_id, created_at ASC);
CREATE INDEX idx_chat_messages_unread  ON public.chat_messages (channel_id, is_read) WHERE is_read = false;


-- ── 3. TRIGGER: actualizar stats del canal al insertar mensaje ─

CREATE OR REPLACE FUNCTION update_channel_on_new_message()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE public.chat_channels
  SET
    last_message_at      = NEW.created_at,
    last_message_preview = LEFT(NEW.message, 80),
    buyer_unread  = CASE
                     WHEN NEW.sender_id <> buyer_id  THEN buyer_unread  + 1
                     ELSE buyer_unread
                   END,
    seller_unread = CASE
                     WHEN NEW.sender_id <> seller_id THEN seller_unread + 1
                     ELSE seller_unread
                   END
  WHERE id = NEW.channel_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_update_channel_on_message
  AFTER INSERT ON public.chat_messages
  FOR EACH ROW EXECUTE FUNCTION update_channel_on_new_message();


-- ── 4. RLS ───────────────────────────────────────────────────

ALTER TABLE public.chat_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages  ENABLE ROW LEVEL SECURITY;

-- chat_channels: solo participantes ven/modifican sus canales
CREATE POLICY "Participants can view their channels"
  ON public.chat_channels FOR SELECT
  USING (auth.uid() IN (buyer_id, seller_id));

CREATE POLICY "Buyer can create channel"
  ON public.chat_channels FOR INSERT
  WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Participants can update channel"
  ON public.chat_channels FOR UPDATE
  USING (auth.uid() IN (buyer_id, seller_id));

-- chat_messages: solo participantes del canal ven/insertan mensajes
CREATE POLICY "Channel participants can view messages"
  ON public.chat_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_channels c
      WHERE c.id = channel_id
        AND auth.uid() IN (c.buyer_id, c.seller_id)
    )
  );

CREATE POLICY "Channel participants can send messages"
  ON public.chat_messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM public.chat_channels c
      WHERE c.id = channel_id
        AND auth.uid() IN (c.buyer_id, c.seller_id)
    )
  );

CREATE POLICY "Superadmin full access channels"
  ON public.chat_channels FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'superadmin')
  );

CREATE POLICY "Superadmin full access messages"
  ON public.chat_messages FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'superadmin')
  );


-- ── 5. RPC: get_or_create_chat_channel ───────────────────────
--
-- Valida:
--   - No self-contact
--   - Plan FREE: máximo 3 canales activos como buyer
-- Retorna: { channel: {...}, is_new: bool }

CREATE OR REPLACE FUNCTION get_or_create_chat_channel(
  p_ad_id     uuid,
  p_buyer_id  uuid,
  p_seller_id uuid
)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_channel  public.chat_channels%ROWTYPE;
  v_role     text;
  v_count    int;
BEGIN
  -- Guard: no self-contact
  IF p_buyer_id = p_seller_id THEN
    RAISE EXCEPTION 'SELF_CONTACT: No podés contactarte a vos mismo';
  END IF;

  -- Verificar si ya existe el canal
  SELECT * INTO v_channel
  FROM public.chat_channels
  WHERE ad_id = p_ad_id AND buyer_id = p_buyer_id;

  IF FOUND THEN
    RETURN jsonb_build_object('channel', row_to_json(v_channel), 'is_new', false);
  END IF;

  -- Verificar plan del buyer
  SELECT role INTO v_role FROM public.users WHERE id = p_buyer_id;

  IF v_role = 'free' THEN
    SELECT COUNT(*) INTO v_count
    FROM public.chat_channels
    WHERE buyer_id = p_buyer_id AND status = 'active';

    IF v_count >= 3 THEN
      RAISE EXCEPTION 'PLAN_LIMIT_REACHED: Límite de 3 conversaciones para usuarios Free';
    END IF;
  END IF;

  -- Crear canal
  INSERT INTO public.chat_channels (ad_id, buyer_id, seller_id)
  VALUES (p_ad_id, p_buyer_id, p_seller_id)
  RETURNING * INTO v_channel;

  RETURN jsonb_build_object('channel', row_to_json(v_channel), 'is_new', true);
END;
$$;

COMMENT ON FUNCTION get_or_create_chat_channel IS
  'Crea o retorna canal existente. Plan FREE: máx 3 canales como comprador';


-- ── 6. RPC: mark_channel_read ────────────────────────────────

CREATE OR REPLACE FUNCTION mark_channel_read(p_channel_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  -- Marcar mensajes individuales como leídos
  UPDATE public.chat_messages
  SET is_read = true
  WHERE channel_id = p_channel_id
    AND sender_id <> v_uid
    AND is_read = false;

  -- Reset contador en el canal
  UPDATE public.chat_channels
  SET
    buyer_unread  = CASE WHEN buyer_id  = v_uid THEN 0 ELSE buyer_unread  END,
    seller_unread = CASE WHEN seller_id = v_uid THEN 0 ELSE seller_unread END
  WHERE id = p_channel_id;
END;
$$;


-- ── 7. RPC: get_user_chat_unread_count ───────────────────────

CREATE OR REPLACE FUNCTION get_user_chat_unread_count()
RETURNS int LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_uid   uuid := auth.uid();
  v_total int;
BEGIN
  SELECT COALESCE(
    SUM(
      CASE
        WHEN buyer_id  = v_uid THEN buyer_unread
        WHEN seller_id = v_uid THEN seller_unread
        ELSE 0
      END
    ), 0
  )
  INTO v_total
  FROM public.chat_channels
  WHERE v_uid IN (buyer_id, seller_id)
    AND status = 'active';

  RETURN v_total;
END;
$$;
