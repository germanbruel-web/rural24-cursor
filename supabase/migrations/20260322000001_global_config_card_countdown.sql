-- Sprint: Countdown Badge — configuración global para tarjetas de avisos
-- Usa global_settings (jsonb, con display_name/is_public) para aparecer en panel admin

INSERT INTO public.global_settings (key, value, value_type, display_name, description, category, is_public)
VALUES
  ('card_countdown_enabled',         'true'::jsonb, 'boolean', 'Countdown Vencimiento Habilitado',
   'Muestra cuenta regresiva en la tarjeta cuando un destacado está por vencer', 'cards', true),
  ('card_countdown_threshold_hours', '48'::jsonb,   'number',  'Horas umbral para countdown',
   'Horas antes del vencimiento a partir de las cuales se muestra el countdown (ej: 48)', 'cards', true)
ON CONFLICT (key) DO NOTHING;
