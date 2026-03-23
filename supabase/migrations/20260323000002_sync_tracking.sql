-- Tabla de tracking de migraciones aplicadas en cada entorno.
-- Usada por el SyncPanel del dashboard admin para detectar qué
-- migraciones están pendientes en PROD vs DEV.
-- Creada tanto en DEV como en PROD con esta migración.
-- NO se incluye en db-clone-config.mjs (su estado es independiente por env).

CREATE TABLE IF NOT EXISTS public._rural24_migrations (
  filename    TEXT        PRIMARY KEY,
  applied_at  TIMESTAMPTZ DEFAULT now() NOT NULL,
  applied_by  TEXT        DEFAULT 'migration-script'
);

-- Solo service_role puede acceder (RLS bloqueante sin policies explícitas)
ALTER TABLE public._rural24_migrations ENABLE ROW LEVEL SECURITY;

-- Registrar las migraciones que ya están aplicadas en este entorno.
-- (Este INSERT se ejecuta al correr la migración, por lo que el filename
--  de cada migración se registra en el momento de su aplicación.)
-- Las anteriores a este sistema se registran como "pre-sync" para
-- que el panel las muestre como ya aplicadas y no como pendientes.
INSERT INTO public._rural24_migrations (filename, applied_by) VALUES
  ('20260314000001_enable_rls_global_config.sql',              'pre-sync'),
  ('20260314000002_add_user_type_column.sql',                  'pre-sync'),
  ('20260314000003_create_ads_table.sql',                      'pre-sync'),
  ('20260314000004_create_featured_ads_table.sql',             'pre-sync'),
  ('20260314000005_featured_ads_rls.sql',                      'pre-sync'),
  ('20260314000006_wallet_tables.sql',                         'pre-sync'),
  ('20260314000007_companies_tables.sql',                      'pre-sync'),
  ('20260314000008_notification_tables.sql',                   'pre-sync'),
  ('20260314000009_favorites_table.sql',                       'pre-sync'),
  ('20260314000010_search_analytics.sql',                      'pre-sync'),
  ('20260314000011_home_sections_table.sql',                   'pre-sync'),
  ('20260314000012_banners_clean_table.sql',                   'pre-sync'),
  ('20260315000001_fix_ads_rls.sql',                           'pre-sync'),
  ('20260318000002_chat_p2p.sql',                              'pre-sync'),
  ('20260318000003_chat_b_notifications.sql',                  'pre-sync'),
  ('20260321000001_categories_fixes.sql',                      'pre-sync'),
  ('20260321000002_subcategories_seeds.sql',                   'pre-sync'),
  ('20260321000003_categories_seeds_fix.sql',                  'pre-sync'),
  ('20260321000004_banners_clean_jsonb_meta.sql',              'pre-sync'),
  ('20260321000005_home_sections_cms.sql',                     'pre-sync'),
  ('20260321000008_home_sections_check_constraint.sql',        'pre-sync'),
  ('20260322000001_global_config_card_countdown.sql',          'pre-sync'),
  ('20260322000002_seed_maquinaria_attributes_marca.sql',      'pre-sync'),
  ('20260322000003_fix_seed_images_dir_dme.sql',               'pre-sync'),
  ('20260323000001_fix_activate_pending_featured_ads_order.sql', 'pre-sync'),
  ('20260323000002_sync_tracking.sql',                         'migration-script')
ON CONFLICT (filename) DO NOTHING;
