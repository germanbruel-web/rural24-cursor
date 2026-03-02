-- Agregar política RLS para que superadmin pueda modificar global_config
-- global_config solo tenía SELECT público, sin UPDATE

CREATE POLICY "SuperAdmin can modify global_config"
ON public.global_config
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
      AND users.role::text = 'superadmin'::text
  )
);
