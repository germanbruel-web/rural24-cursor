-- ============================================================
-- Migration: 20260318000003 — Chat B: Notificaciones + Enmascarado
-- Fecha: 2026-03-18
-- 1. was_masked column en chat_messages
-- 2. Trigger BEFORE INSERT: enmascara teléfonos, emails, links, plataformas
-- 3. Trigger AFTER INSERT: notifica al receptor cuando unread era 0
-- ============================================================


-- ── 1. COLUMNA was_masked ────────────────────────────────────

ALTER TABLE public.chat_messages
  ADD COLUMN was_masked boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.chat_messages.was_masked IS
  'true si el mensaje fue modificado por el filtro de contenido sensible';


-- ── 2. FUNCIÓN + TRIGGER: enmascarar contenido sensible ──────
--
-- Orden: BEFORE INSERT → se ejecuta antes de guardar.
-- Patrones:
--   - Teléfonos Argentina/Latam (prefijos +54, 011, 15)
--   - Cualquier dirección de email
--   - URLs (http/https)
--   - Nombres de plataformas externas

CREATE OR REPLACE FUNCTION mask_sensitive_chat_content()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  v_original text := NEW.message;
  v_masked   text := NEW.message;
BEGIN
  -- Emails
  v_masked := regexp_replace(
    v_masked,
    '[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}',
    '[dato de contacto ocultado]',
    'g'
  );

  -- Teléfonos Argentina/Latam: +54, 0011, 011, 15 + 8 dígitos
  v_masked := regexp_replace(
    v_masked,
    '(\+?54[\s\-\.]?)?(\(?\d{2,4}\)?)[\s\-\.]?\d{4}[\s\-\.]?\d{4}',
    '[dato de contacto ocultado]',
    'g'
  );

  -- URLs (http / https)
  v_masked := regexp_replace(
    v_masked,
    'https?://[^\s]+',
    '[enlace externo ocultado]',
    'gi'
  );

  -- Plataformas externas (palabra completa, case-insensitive)
  v_masked := regexp_replace(
    v_masked,
    '(^|[^a-zA-Z])(whatsapp|wsp|telegram|instagram|facebook|mercadolibre|mercadopago|tiktok|signal|viber)([^a-zA-Z]|$)',
    '\1[plataforma externa]\3',
    'gi'
  );

  IF v_masked <> v_original THEN
    NEW.message    := v_masked;
    NEW.was_masked := true;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_mask_chat_content
  BEFORE INSERT ON public.chat_messages
  FOR EACH ROW EXECUTE FUNCTION mask_sensitive_chat_content();

COMMENT ON FUNCTION mask_sensitive_chat_content IS
  'Enmascara datos de contacto y links externos antes de guardar el mensaje';


-- ── 3. FUNCIÓN + TRIGGER: notificar al receptor ──────────────
--
-- Orden: AFTER INSERT, nombre "trg_notify_chat_message" (n < u)
-- → se ejecuta ANTES que trg_update_channel_on_message (u)
-- → por tanto lee unread ANTES del incremento → 0 = primera notificación
--
-- Solo inserta notificación cuando el receptor tenía 0 no-leídos,
-- evitando spam en conversaciones activas.

CREATE OR REPLACE FUNCTION notify_chat_message_received()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_channel     public.chat_channels%ROWTYPE;
  v_recipient   uuid;
  v_unread_prev int;
  v_ad_title    text;
  v_sender_name text;
BEGIN
  SELECT * INTO v_channel
  FROM public.chat_channels
  WHERE id = NEW.channel_id;

  -- Determinar receptor y su contador de no-leídos previo
  IF NEW.sender_id = v_channel.buyer_id THEN
    v_recipient   := v_channel.seller_id;
    v_unread_prev := v_channel.seller_unread;
  ELSE
    v_recipient   := v_channel.buyer_id;
    v_unread_prev := v_channel.buyer_unread;
  END IF;

  -- Solo notificar en la primera acumulación (unread era 0)
  IF v_unread_prev = 0 THEN
    SELECT title INTO v_ad_title
    FROM public.ads WHERE id = v_channel.ad_id;

    SELECT full_name INTO v_sender_name
    FROM public.users WHERE id = NEW.sender_id;

    INSERT INTO public.notifications (user_id, type, title, body, data)
    VALUES (
      v_recipient,
      'nuevo_mensaje_chat',
      'Nuevo mensaje de ' || COALESCE(v_sender_name, 'un usuario'),
      LEFT(NEW.message, 120),
      jsonb_build_object(
        'channel_id', NEW.channel_id,
        'ad_id',      v_channel.ad_id,
        'ad_title',   COALESCE(v_ad_title, ''),
        'sender_id',  NEW.sender_id
      )
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_chat_message
  AFTER INSERT ON public.chat_messages
  FOR EACH ROW EXECUTE FUNCTION notify_chat_message_received();

COMMENT ON FUNCTION notify_chat_message_received IS
  'Inserta notificación in-app al receptor cuando tenía 0 mensajes sin leer';
