-- ============================================================
-- Sprint UX-Location: Campos estructurados de dirección
-- Agrega calle, altura, piso_dpto a users
-- Actualiza calc_profile_completion (province + location = 10%)
-- ============================================================

-- 1. Agregar columnas estructuradas de dirección
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS calle      text,
  ADD COLUMN IF NOT EXISTS altura     character varying(10),
  ADD COLUMN IF NOT EXISTS piso_dpto  character varying(20);

-- 2. Actualizar calc_profile_completion
--    Antes:  province != ''            → +10%
--    Ahora:  province != '' AND location != '' → +10%
CREATE OR REPLACE FUNCTION public.calc_profile_completion(u public.users)
RETURNS integer
LANGUAGE plpgsql AS $$
DECLARE
  pct integer := 0;
BEGIN
  -- email verificado: 30%
  IF u.email_verified = true THEN pct := pct + 30; END IF;

  -- teléfono: 30%
  IF u.mobile IS NOT NULL AND u.mobile != '' THEN pct := pct + 30; END IF;

  -- nombre completo: 20%
  IF u.full_name IS NOT NULL AND length(trim(u.full_name)) > 2 THEN pct := pct + 20; END IF;

  -- ubicación completa (provincia + localidad): 10%
  IF u.province IS NOT NULL AND u.province != ''
     AND u.location IS NOT NULL AND u.location != ''
  THEN pct := pct + 10; END IF;

  -- foto de perfil: 10%
  IF u.avatar_url IS NOT NULL AND u.avatar_url != '' THEN pct := pct + 10; END IF;

  RETURN pct;
END;
$$;

-- 3. Recrear trigger para incluir location, calle, altura en las columnas vigiladas
DROP TRIGGER IF EXISTS trg_update_profile_completion ON public.users;
CREATE TRIGGER trg_update_profile_completion
  BEFORE INSERT OR UPDATE OF
    email_verified, mobile, full_name, province, location, calle, altura, avatar_url
  ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.update_profile_completion();
