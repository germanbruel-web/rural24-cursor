-- =========================================
-- ÍNDICES OBLIGATORIOS PARA RURAL24 MARKETPLACE
-- PostgreSQL Performance Optimization
-- =========================================
-- Aplicar en orden. Ejecutar en producción fuera de horas pico.
-- Cada CREATE INDEX CONCURRENTLY no bloquea lecturas/escrituras.

-- =========================================
-- 1. BÚSQUEDAS DE AVISOS (ads table)
-- =========================================
-- Query típico: SELECT * FROM ads WHERE status = 'active' AND category_id = X ORDER BY created_at DESC

-- Índice compuesto para búsquedas con status + categoría + orden
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ads_search_category_date 
ON ads (status, category_id, created_at DESC) 
WHERE status = 'active';

-- Índice para búsquedas por provincia + categoría
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ads_search_location 
ON ads (status, province, category_id, created_at DESC) 
WHERE status = 'active';

-- Índice para búsquedas full-text en título + descripción
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ads_fulltext_search 
ON ads USING GIN (to_tsvector('spanish', title || ' ' || COALESCE(description, ''))) 
WHERE status = 'active';

-- Índice para avisos destacados (featured/sponsored)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ads_featured 
ON ads (is_featured, is_sponsored, featured_until, created_at DESC) 
WHERE status = 'active' AND (is_featured = true OR is_sponsored = true);

-- Índice para avisos por usuario (mi panel)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ads_by_user 
ON ads (user_id, status, created_at DESC);

-- Índice para búsqueda por slug (SEO URLs)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ads_slug 
ON ads (slug) 
WHERE slug IS NOT NULL;

-- =========================================
-- 2. CATEGORÍAS (categories table)
-- =========================================

-- Índice para categorías activas ordenadas
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_categories_active_order 
ON categories (is_active, display_order, name) 
WHERE is_active = true;

-- Índice para búsqueda por slug
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_categories_slug 
ON categories (slug);

-- Índice para jerarquía (si hay subcategorías)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_categories_parent 
ON categories (parent_id) 
WHERE parent_id IS NOT NULL;

-- =========================================
-- 3. MENSAJERÍA (messages table)
-- =========================================
-- Query típico: SELECT * FROM messages WHERE (sender_id = X OR receiver_id = X) ORDER BY created_at DESC

-- Índice compuesto para conversaciones de un usuario
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_user_conversations 
ON messages (
  CASE WHEN sender_id < receiver_id THEN sender_id ELSE receiver_id END,
  CASE WHEN sender_id < receiver_id THEN receiver_id ELSE sender_id END,
  created_at DESC
);

-- Índice para mensajes recibidos no leídos
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_unread 
ON messages (receiver_id, is_read, created_at DESC) 
WHERE is_read = false;

-- Índice para mensajes relacionados a un aviso
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_by_ad 
ON messages (ad_id, created_at DESC) 
WHERE ad_id IS NOT NULL;

-- Índice para búsqueda por sender
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_sender 
ON messages (sender_id, created_at DESC);

-- Índice para búsqueda por receiver
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_receiver 
ON messages (receiver_id, created_at DESC);

-- =========================================
-- 4. USUARIOS (users table)
-- =========================================

-- Índice para login por email
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email_unique 
ON users (LOWER(email));

-- Índice para búsqueda por rol
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_by_role 
ON users (role, created_at DESC);

-- Índice para usuarios activos
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_active 
ON users (is_active, last_login DESC) 
WHERE is_active = true;

-- =========================================
-- 5. IMÁGENES (images table)
-- =========================================

-- Índice para obtener imágenes de un aviso ordenadas
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_images_by_ad 
ON images (ad_id, display_order);

-- Índice para limpiar imágenes huérfanas
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_images_created 
ON images (created_at) 
WHERE ad_id IS NULL;

-- =========================================
-- 6. PLANES Y CRÉDITOS (subscriptions, credits)
-- =========================================

-- Índice para suscripción activa de un usuario
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_subscriptions_active_user 
ON subscriptions (user_id, status, expires_at DESC) 
WHERE status = 'active';

-- Índice para créditos disponibles
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_credits_available 
ON user_credits (user_id, available_credits, expires_at) 
WHERE available_credits > 0;

-- Índice para transacciones de créditos
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_credit_transactions_user 
ON credit_transactions (user_id, created_at DESC);

-- =========================================
-- 7. BANNERS (banners_clean table)
-- =========================================

-- Índice para banners activos por posición
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_banners_active_position 
ON banners_clean (position, is_active, display_order) 
WHERE is_active = true;

-- Índice para banners por categoría
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_banners_category 
ON banners_clean (category_slug, is_active, expires_at) 
WHERE is_active = true AND expires_at > NOW();

-- =========================================
-- 8. FEATURED ADS QUEUE (featured_ads_queue)
-- =========================================

-- Índice para procesar cola pendiente
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_featured_queue_pending 
ON featured_ads_queue (status, created_at) 
WHERE status = 'pending';

-- Índice para featured ads activos por aviso
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_featured_queue_by_ad 
ON featured_ads_queue (ad_id, status, featured_until DESC);

-- =========================================
-- 9. SESIONES (sessions table - si se usa DB sessions)
-- =========================================

-- Tabla de sesiones (crear si no existe)
CREATE TABLE IF NOT EXISTS sessions (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  jti TEXT NOT NULL UNIQUE, -- JWT ID para revocación
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índice para verificar sesión válida
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sessions_jti_valid 
ON sessions (jti, expires_at) 
WHERE expires_at > NOW();

-- Índice para revocar todas las sesiones de un usuario
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sessions_by_user 
ON sessions (user_id, expires_at DESC);

-- Índice para cleanup de sesiones expiradas
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sessions_expired 
ON sessions (expires_at) 
WHERE expires_at < NOW();

-- =========================================
-- 10. CACHE (cache_entries - si se usa DB cache)
-- =========================================

-- Tabla de cache (crear si no existe)
CREATE TABLE IF NOT EXISTS cache_entries (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índice para cleanup de cache expirado
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cache_expired 
ON cache_entries (expires_at) 
WHERE expires_at < NOW();

-- =========================================
-- 11. AUDITORÍA Y LOGS (opcional pero recomendado)
-- =========================================

-- Tabla de logs de actividad (opcional)
CREATE TABLE IF NOT EXISTS activity_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índice para buscar actividad por usuario
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_activity_logs_user 
ON activity_logs (user_id, created_at DESC);

-- Índice para buscar actividad por recurso
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_activity_logs_resource 
ON activity_logs (resource_type, resource_id, created_at DESC);

-- Índice para buscar por IP (detección de fraude)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_activity_logs_ip 
ON activity_logs (ip_address, created_at DESC);

-- =========================================
-- 12. MANTENIMIENTO AUTOMÁTICO
-- =========================================

-- Función para limpiar sesiones expiradas (ejecutar con cron job)
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM sessions WHERE expires_at < NOW();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Función para limpiar cache expirado
CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM cache_entries WHERE expires_at < NOW();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Función para limpiar logs antiguos (más de 90 días)
CREATE OR REPLACE FUNCTION cleanup_old_logs()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM activity_logs WHERE created_at < NOW() - INTERVAL '90 days';
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- =========================================
-- 13. VACUUM Y ANALYZE (ejecutar periódicamente)
-- =========================================

-- Actualizar estadísticas de PostgreSQL para optimizador de queries
-- Ejecutar después de crear índices y periódicamente (1x semana)
ANALYZE ads;
ANALYZE messages;
ANALYZE users;
ANALYZE categories;
ANALYZE images;
ANALYZE subscriptions;
ANALYZE sessions;
ANALYZE cache_entries;

-- =========================================
-- 14. MONITOREO DE ÍNDICES
-- =========================================

-- Query para ver uso de índices (ejecutar para validar efectividad)
-- SELECT 
--   schemaname, 
--   tablename, 
--   indexname, 
--   idx_scan as scans, 
--   idx_tup_read as tuples_read, 
--   idx_tup_fetch as tuples_fetched
-- FROM pg_stat_user_indexes
-- WHERE schemaname = 'public'
-- ORDER BY idx_scan DESC;

-- Query para ver índices NO usados (candidatos para eliminar)
-- SELECT 
--   schemaname, 
--   tablename, 
--   indexname
-- FROM pg_stat_user_indexes
-- WHERE idx_scan = 0 
--   AND indexname NOT LIKE '%_pkey'
-- ORDER BY tablename;

-- =========================================
-- NOTAS DE IMPLEMENTACIÓN
-- =========================================
-- 
-- 1. CONCURRENTLY: No bloquea escrituras, pero tarda más. Ideal para producción.
-- 2. Partial indexes (WHERE): Más pequeños y rápidos para queries filtradas.
-- 3. DESC en índices: Para ORDER BY ... DESC (muy común en listings).
-- 4. GIN indexes: Para full-text search (más espacio pero mucho más rápido).
-- 5. Composite indexes: Orden de columnas importa (más selectiva primero).
-- 6. maintenance_work_mem: Aumentar antes de crear índices grandes (SET maintenance_work_mem = '1GB').
--
-- MANTENIMIENTO RECOMENDADO:
-- - Ejecutar VACUUM ANALYZE semanalmente
-- - Ejecutar cleanup_expired_* diariamente (cron job)
-- - Monitorear pg_stat_user_indexes mensualmente
-- - Revisar slow query log regularmente
