-- ============================================================
-- Sprint 11B — Welcome email: capturar provider en payload
-- ============================================================
-- Actualiza enqueue_welcome_email() para incluir el proveedor
-- de autenticación (google, email, etc.) en el payload del email.
-- Esto permite enviar plantillas distintas según el método de registro.
-- ============================================================

CREATE OR REPLACE FUNCTION public.enqueue_welcome_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_provider text;
BEGIN
  -- Obtener proveedor de auth.users (google, facebook, email, etc.)
  SELECT COALESCE(raw_app_meta_data->>'provider', 'email')
    INTO v_provider
    FROM auth.users
   WHERE id = NEW.id;

  INSERT INTO public.email_queue (type, to_user_id, payload)
  VALUES (
    'welcome',
    NEW.id,
    jsonb_build_object(
      'first_name', COALESCE(NEW.first_name, split_part(NEW.full_name, ' ', 1), ''),
      'full_name',  COALESCE(NEW.full_name, NEW.email),
      'provider',   COALESCE(v_provider, 'email')
    )
  );
  RETURN NEW;
END;
$$;
