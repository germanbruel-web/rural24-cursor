-- ============================================================================
-- ÍNDICES OBLIGATORIOS POSTGRESQL - Rural24 Marketplace
-- ============================================================================
-- Estos índices son CRÍTICOS para performance del marketplace
-- Ejecutar en orden para DB de producción
-- ============================================================================

-- ============================================================================
-- 1. TABLA: users (Usuarios y autenticación)
-- ============================================================================

-- Búsqueda por email (login, recuperación password)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email 
ON users(email) 
WHERE deleted_at IS NULL;

-- Búsqueda por rol (filtrar admins, vendors, etc.)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_role 
ON users(role);

-- Usuarios activos/verificados (para stats)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_status 
ON users(is_active, email_verified);

-- Búsqueda por fecha de registro (analytics)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_created_at 
ON users(created_at DESC);

-- ============================================================================
-- 2. TABLA: ads (Avisos/Publicaciones)
-- ============================================================================

-- Búsqueda principal: categoría + estado + fecha
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ads_category_status_date 
ON ads(category, status, created_at DESC) 
WHERE deleted_at IS NULL;

-- Filtro por provincia (búsquedas regionales)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ads_province_status 
ON ads(province, status, created_at DESC) 
WHERE deleted_at IS NULL AND status = 'active';

-- Avisos destacados (homepage, búsquedas premium)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ads_featured 
ON ads(is_featured, created_at DESC) 
WHERE is_featured = true AND status = 'active' AND deleted_at IS NULL;

-- Avisos por usuario (mis publicaciones)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ads_user_id 
ON ads(user_id, status, created_at DESC) 
WHERE deleted_at IS NULL;

-- Búsqueda full-text (título + descripción)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ads_fulltext 
ON ads USING gin(
  to_tsvector('spanish', COALESCE(title, '') || ' ' || COALESCE(description, ''))
);

-- Filtro por precio (rango de precios)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ads_price 
ON ads(price) 
WHERE price > 0 AND status = 'active' AND deleted_at IS NULL;

-- Expiración automática (cron job)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ads_expires_at 
ON ads(expires_at) 
WHERE expires_at IS NOT NULL AND status = 'active';

-- Slug para SEO (url amigable)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ads_slug 
ON ads(slug) 
WHERE deleted_at IS NULL;

-- ============================================================================
-- 3. TABLA: messages (Mensajería entre usuarios)
-- ============================================================================

-- Mensajes recibidos (inbox del usuario)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_recipient_date 
ON messages(recipient_id, created_at DESC) 
WHERE deleted_by_recipient = false;

-- Mensajes enviados (outbox del usuario)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_sender_date 
ON messages(sender_id, created_at DESC) 
WHERE deleted_by_sender = false;

-- Conversación completa (thread entre 2 usuarios)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_conversation 
ON messages(sender_id, recipient_id, created_at DESC);

-- Mensajes no leídos (notificaciones)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_unread 
ON messages(recipient_id, is_read, created_at DESC) 
WHERE is_read = false AND deleted_by_recipient = false;

-- Mensajes relacionados a un aviso específico
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_ad_id 
ON messages(ad_id, created_at DESC) 
WHERE ad_id IS NOT NULL;

-- ============================================================================
-- 4. TABLA: categories (Categorías)
-- ============================================================================

-- Categorías activas ordenadas
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_categories_active 
ON categories(is_active, display_order);

-- Búsqueda por slug (navegación)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_categories_slug 
ON categories(slug) 
WHERE is_active = true;

-- Categorías padre (árbol de categorías)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_categories_parent 
ON categories(parent_id) 
WHERE parent_id IS NOT NULL;

-- ============================================================================
-- 5. TABLA: images (Imágenes de avisos)
-- ============================================================================

-- Imágenes por aviso (galería)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_images_ad_id 
ON images(ad_id, display_order);

-- Imagen principal (thumbnail)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_images_is_main 
ON images(ad_id, is_main) 
WHERE is_main = true;

-- ============================================================================
-- 6. TABLA: favorites (Favoritos/Guardados)
-- ============================================================================

-- Favoritos por usuario
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_favorites_user_id 
ON favorites(user_id, created_at DESC);

-- Verificar si aviso está en favoritos (para botón corazón)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_favorites_user_ad 
ON favorites(user_id, ad_id);

-- Avisos más guardados (trending)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_favorites_ad_id 
ON favorites(ad_id);

-- ============================================================================
-- 7. TABLA: views (Vistas/Impresiones de avisos)
-- ============================================================================

-- Vistas por aviso (analytics)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_views_ad_date 
ON views(ad_id, created_at DESC);

-- Vistas únicas por IP (evitar duplicados)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_views_ip_ad 
ON views(ip_address, ad_id, created_at DESC);

-- Analytics por usuario (qué vió cada usuario)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_views_user_id 
ON views(user_id, created_at DESC) 
WHERE user_id IS NOT NULL;

-- ============================================================================
-- 8. TABLA: transactions (Transacciones/Pagos)
-- ============================================================================

-- Transacciones por usuario
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_user_id 
ON transactions(user_id, created_at DESC);

-- Transacciones por estado (pending, completed, failed)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_status 
ON transactions(status, created_at DESC);

-- Transacciones por aviso (historial de pagos de un aviso)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_ad_id 
ON transactions(ad_id, created_at DESC) 
WHERE ad_id IS NOT NULL;

-- ============================================================================
-- 9. TABLA: subscriptions (Planes/Suscripciones)
-- ============================================================================

-- Suscripciones activas por usuario
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_subscriptions_user_active 
ON subscriptions(user_id, status, expires_at DESC) 
WHERE status = 'active';

-- Suscripciones a punto de expirar (alertas)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_subscriptions_expiring 
ON subscriptions(expires_at) 
WHERE status = 'active' AND expires_at > NOW();

-- ============================================================================
-- 10. TABLA: notifications (Notificaciones)
-- ============================================================================

-- Notificaciones no leídas por usuario
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user_unread 
ON notifications(user_id, is_read, created_at DESC) 
WHERE is_read = false;

-- Todas las notificaciones de un usuario
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user_id 
ON notifications(user_id, created_at DESC);

-- ============================================================================
-- 11. TABLA: sessions (Sesiones - si usás DB sessions)
-- ============================================================================

-- Obtener sesión por ID (lookup principal)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sessions_id 
ON sessions(id) 
WHERE expires_at > NOW();

-- Sesiones activas por usuario
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sessions_user_id 
ON sessions(user_id, last_activity_at DESC) 
WHERE expires_at > NOW();

-- Cleanup de sesiones expiradas (cron)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sessions_expires_at 
ON sessions(expires_at);

-- ============================================================================
-- 12. ÍNDICES COMPUESTOS AVANZADOS (Para queries complejas)
-- ============================================================================

-- Búsqueda completa: categoría + provincia + precio + featured
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ads_search_composite 
ON ads(category, province, price, is_featured, created_at DESC) 
WHERE status = 'active' AND deleted_at IS NULL;

-- Estadísticas por usuario: avisos + mensajes + transacciones
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_activity 
ON ads(user_id, status) 
INCLUDE (created_at, views_count);

-- ============================================================================
-- 13. PARTITIONED INDEXES (Para tablas grandes - Futuro)
-- ============================================================================

-- views table (puede crecer a millones de registros)
-- Considerar particionamiento por fecha cuando > 10M registros
-- CREATE TABLE views (
--   ...
-- ) PARTITION BY RANGE (created_at);

-- ============================================================================
-- VERIFICAR ÍNDICES CREADOS
-- ============================================================================

-- Query para ver todos los índices de una tabla
-- SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'ads';

-- Query para ver tamaño de índices
-- SELECT 
--   schemaname, 
--   tablename, 
--   indexname, 
--   pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
-- FROM pg_stat_user_indexes
-- ORDER BY pg_relation_size(indexrelid) DESC;

-- ============================================================================
-- MANTENIMIENTO DE ÍNDICES (Ejecutar periódicamente)
-- ============================================================================

-- Reindexar si hay fragmentación (1 vez al mes en tabla grande)
-- REINDEX INDEX CONCURRENTLY idx_ads_category_status_date;

-- Vacuum para limpiar dead tuples
-- VACUUM ANALYZE ads;
-- VACUUM ANALYZE messages;

-- Actualizar estadísticas para query planner
-- ANALYZE ads;
-- ANALYZE messages;

-- ============================================================================
-- MONITORING DE PERFORMANCE
-- ============================================================================

-- Queries lentos que no usan índices
-- SELECT 
--   query, 
--   calls, 
--   total_time, 
--   mean_time
-- FROM pg_stat_statements
-- WHERE mean_time > 100  -- queries > 100ms
-- ORDER BY mean_time DESC
-- LIMIT 20;

-- Índices no utilizados (candidatos a eliminar)
-- SELECT 
--   schemaname, 
--   tablename, 
--   indexname, 
--   idx_scan,
--   pg_size_pretty(pg_relation_size(indexrelid)) AS size
-- FROM pg_stat_user_indexes
-- WHERE idx_scan = 0
-- AND indexrelid NOT IN (
--   SELECT conindid FROM pg_constraint WHERE contype IN ('p', 'u')
-- )
-- ORDER BY pg_relation_size(indexrelid) DESC;
