-- Insertar configuración del panel de onboarding (logo + slogan)
-- Usados por OnboardingCarousel.tsx vía useSiteSetting()

INSERT INTO site_settings (setting_key, setting_value, setting_type, section, description)
VALUES
  ('carousel_logo_url',  '',                      'image', 'content', 'Logo del panel izquierdo en AuthPage (carrusel desktop/mobile). Vacío = usa logo de texto por defecto.'),
  ('carousel_slogan',    'Clasificados Agrarios', 'text',  'content', 'Slogan/subtítulo bajo el logo en el panel de onboarding.')
ON CONFLICT (setting_key) DO NOTHING;
