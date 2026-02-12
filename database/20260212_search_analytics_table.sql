-- Tabla para almacenar analytics de búsquedas
-- Rural24 Search Analytics
-- Fecha: 2026-02-12

CREATE TABLE IF NOT EXISTS public.search_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    query TEXT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    result_count INT,
    session_id TEXT NOT NULL,
    filters JSONB,
    source TEXT CHECK (source IN ('header', 'hero', 'page')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_search_analytics_query ON public.search_analytics(query);
CREATE INDEX IF NOT EXISTS idx_search_analytics_created_at ON public.search_analytics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_search_analytics_session ON public.search_analytics(session_id);
CREATE INDEX IF NOT EXISTS idx_search_analytics_source ON public.search_analytics(source);

-- Habilitar RLS
ALTER TABLE public.search_analytics ENABLE ROW LEVEL SECURITY;

-- Policy: Lectura pública (para analytics)
CREATE POLICY "search_analytics_select_policy" 
ON public.search_analytics 
FOR SELECT 
USING (true);

-- Policy: Inserción pública (para tracking)
CREATE POLICY "search_analytics_insert_policy" 
ON public.search_analytics 
FOR INSERT 
WITH CHECK (true);

-- Comentarios
COMMENT ON TABLE public.search_analytics IS 'Tabla para analytics de búsquedas - tracking de queries, tendencias y comportamiento de usuarios';
COMMENT ON COLUMN public.search_analytics.query IS 'Término de búsqueda (normalizado a lowercase)';
COMMENT ON COLUMN public.search_analytics.timestamp IS 'Timestamp del evento de búsqueda';
COMMENT ON COLUMN public.search_analytics.result_count IS 'Cantidad de resultados obtenidos';
COMMENT ON COLUMN public.search_analytics.session_id IS 'ID de sesión del usuario';
COMMENT ON COLUMN public.search_analytics.filters IS 'Filtros aplicados en la búsqueda (JSON)';
COMMENT ON COLUMN public.search_analytics.source IS 'Origen de la búsqueda: header, hero o page';

-- Vista materializada para queries populares (opcional, para performance)
CREATE MATERIALIZED VIEW IF NOT EXISTS public.popular_searches AS
SELECT 
    query,
    COUNT(*) as search_count,
    MAX(created_at) as last_searched,
    COUNT(DISTINCT session_id) as unique_sessions
FROM public.search_analytics
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY query
ORDER BY search_count DESC
LIMIT 100;

-- Índice en la vista materializada
CREATE UNIQUE INDEX idx_popular_searches_query ON public.popular_searches(query);

-- Refresh automático cada hora (opcional - requiere pg_cron extension)
-- SELECT cron.schedule('refresh-popular-searches', '0 * * * *', 'REFRESH MATERIALIZED VIEW CONCURRENTLY public.popular_searches');

-- Función para limpiar datos antiguos (mantener últimos 90 días)
CREATE OR REPLACE FUNCTION public.cleanup_old_search_analytics()
RETURNS void AS $$
BEGIN
    DELETE FROM public.search_analytics 
    WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- Job para ejecutar cleanup semanalmente (opcional)
-- SELECT cron.schedule('cleanup-search-analytics', '0 0 * * 0', 'SELECT public.cleanup_old_search_analytics()');
