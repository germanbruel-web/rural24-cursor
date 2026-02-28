-- ============================================================================
-- MIGRATION: deletion_requests
-- Solicitudes de eliminación de cuenta enviadas por usuarios al superadmin.
-- NO elimina la cuenta automáticamente — el superadmin procesa manualmente.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.deletion_requests (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  user_email  TEXT NOT NULL,
  reason      TEXT NOT NULL CHECK (char_length(reason) >= 10),
  status      TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'processing', 'completed', 'rejected')),
  admin_notes TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ,
  processed_by UUID REFERENCES public.users(id)
);

-- Solo un request pendiente por usuario a la vez
CREATE UNIQUE INDEX deletion_requests_user_pending_idx
  ON public.deletion_requests (user_id)
  WHERE status IN ('pending', 'processing');

-- RLS
ALTER TABLE public.deletion_requests ENABLE ROW LEVEL SECURITY;

-- Usuario solo ve sus propias solicitudes
CREATE POLICY "deletion_requests_user_select"
  ON public.deletion_requests FOR SELECT
  USING (auth.uid() = user_id);

-- Usuario solo puede insertar su propia solicitud
CREATE POLICY "deletion_requests_user_insert"
  ON public.deletion_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Superadmin puede leer y actualizar todas
CREATE POLICY "deletion_requests_admin_all"
  ON public.deletion_requests FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'superadmin'
    )
  );

-- Trigger: actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER deletion_requests_updated_at
  BEFORE UPDATE ON public.deletion_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

COMMENT ON TABLE public.deletion_requests IS
  'Solicitudes de baja de cuenta enviadas por usuarios al superadmin para procesamiento manual.';
