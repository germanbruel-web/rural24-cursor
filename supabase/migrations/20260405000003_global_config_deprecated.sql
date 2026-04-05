-- ============================================================
-- S8-D: Marcar global_config como DEPRECATED
-- ============================================================
-- Todos los callsites de código frontend fueron migrados a
-- global_settings en S6. Los RPCs de DB (buy_featured,
-- get_featured_slot_availability, etc.) siguen leyendo
-- global_config hasta una futura migración explícita.
-- Esta tabla NO debe recibir nuevas referencias de código.
-- ============================================================

COMMENT ON TABLE public.global_config IS
  'DEPRECATED — migrado a global_settings (S6, 2026-04-05). '
  'Sin referencias en código frontend. '
  'RPCs de DB pendientes de migrar en futura versión. '
  'No agregar nuevas keys ni referencias de código.';
