-- Sprint S2: Insertar keys faltantes en global_settings
-- Todas las inserciones usan ON CONFLICT DO NOTHING — idempotente.
-- Si la key ya existe en la DB, no se toca.

INSERT INTO public.global_settings (key, value, category, display_name, description, value_type, is_public)
VALUES

  -- CARDS
  ('card_color_category_slugs',
   '["servicios","empleos"]',
   'cards',
   'Categorías sin foto de portada',
   'Slugs de categorías que usan fondo de color + avatar en lugar de foto. Modificar para agregar nuevas categorías sin deploy.',
   'array',
   true),

  ('card_description_max_chars',
   '100',
   'cards',
   'Truncado descripción EmpleoCard',
   'Cantidad máxima de caracteres de la descripción visible en la card de empleos.',
   'number',
   true),

  -- SEARCH
  ('search_results_per_page',
   '20',
   'search',
   'Resultados por página',
   'Cantidad de avisos por página en la búsqueda/resultados.',
   'number',
   true),

  ('search_banner_intercalated_freq',
   '8',
   'search',
   'Frecuencia de banner intercalado',
   'Cada cuántos resultados se intercala un banner publicitario (ej: 8 = cada 8 cards).',
   'number',
   true),

  ('search_grid_cols_mobile',
   '2',
   'search',
   'Columnas grilla (mobile)',
   'Columnas del grid de resultados en mobile (1-3).',
   'number',
   true),

  ('search_grid_cols_tablet',
   '3',
   'search',
   'Columnas grilla (tablet)',
   'Columnas del grid de resultados en tablet.',
   'number',
   true),

  ('search_grid_cols_desktop',
   '5',
   'search',
   'Columnas grilla (desktop)',
   'Columnas del grid de resultados en desktop.',
   'number',
   true),

  -- ADS
  ('similar_ads_limit',
   '6',
   'ads',
   'Avisos similares en detalle',
   'Cantidad de avisos similares mostrados en la página de detalle del aviso.',
   'number',
   true),

  ('site_canonical_url',
   '"https://rural24.com.ar"',
   'ads',
   'URL canónica del sitio',
   'URL base usada para SEO, meta tags y links canónicos. Sin barra final.',
   'string',
   true),

  ('seo_description_max_chars',
   '155',
   'ads',
   'Longitud meta description',
   'Caracteres máximos de la meta description generada para SEO en la página de detalle.',
   'number',
   true),

  -- HOME
  ('home_section_default_limit',
   '8',
   'home',
   'Límite default de secciones home',
   'Cantidad de avisos por sección en el home cuando query_filter.limit no está configurado.',
   'number',
   true),

  -- FEATURED (ampliación de keys existentes)
  ('featured_bar_cards_per_page',
   '5',
   'featured',
   'Cards visibles en carrusel destacados',
   'Cantidad de cards visibles simultáneamente en el carrusel de avisos destacados (UserFeaturedAdsBar).',
   'number',
   true),

  ('featured_bar_load_batch',
   '10',
   'featured',
   'Lote de carga del carrusel',
   'Cantidad de destacados que se cargan inicialmente y por cada "Cargar más" en el carrusel.',
   'number',
   true),

  ('featured_bar_max_ads',
   '30',
   'featured',
   'Máximo total en carrusel',
   'Cantidad máxima de destacados que puede mostrar el carrusel por sesión.',
   'number',
   true)

ON CONFLICT (key) DO NOTHING;
