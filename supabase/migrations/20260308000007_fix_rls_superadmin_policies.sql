-- ============================================================
-- Fix: RLS write policies para superadmin — Sprint 4 (4A→4F)
-- ============================================================
-- Las migraciones 4A, 4B, 4F usaron auth.jwt() ->> 'role' = 'superadmin'
-- que no funciona. El patrón correcto del proyecto es:
--   EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'superadmin')
-- ============================================================

-- ─── option_lists ─────────────────────────────────────────────

DROP POLICY IF EXISTS "option_lists_write_superadmin" ON public.option_lists;
CREATE POLICY "option_lists_write_superadmin"
  ON public.option_lists FOR ALL
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role::text = 'superadmin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role::text = 'superadmin'));

-- ─── option_list_items ────────────────────────────────────────

DROP POLICY IF EXISTS "option_list_items_write_superadmin" ON public.option_list_items;
CREATE POLICY "option_list_items_write_superadmin"
  ON public.option_list_items FOR ALL
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role::text = 'superadmin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role::text = 'superadmin'));

-- ─── form_templates_v2 ────────────────────────────────────────

DROP POLICY IF EXISTS "form_templates_v2_write_superadmin" ON public.form_templates_v2;
CREATE POLICY "form_templates_v2_write_superadmin"
  ON public.form_templates_v2 FOR ALL
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role::text = 'superadmin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role::text = 'superadmin'));

-- ─── form_fields_v2 ───────────────────────────────────────────

DROP POLICY IF EXISTS "form_fields_v2_write_superadmin" ON public.form_fields_v2;
CREATE POLICY "form_fields_v2_write_superadmin"
  ON public.form_fields_v2 FOR ALL
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role::text = 'superadmin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role::text = 'superadmin'));

-- ─── form_field_options_v2 ────────────────────────────────────

DROP POLICY IF EXISTS "form_field_options_v2_write_superadmin" ON public.form_field_options_v2;
CREATE POLICY "form_field_options_v2_write_superadmin"
  ON public.form_field_options_v2 FOR ALL
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role::text = 'superadmin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role::text = 'superadmin'));

-- ─── wizard_configs ───────────────────────────────────────────

DROP POLICY IF EXISTS "wizard_configs_write_superadmin" ON public.wizard_configs;
CREATE POLICY "wizard_configs_write_superadmin"
  ON public.wizard_configs FOR ALL
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role::text = 'superadmin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role::text = 'superadmin'));

DO $$ BEGIN
  RAISE NOTICE 'Fix RLS: políticas write superadmin corregidas en 6 tablas Sprint 4.';
END $$;
