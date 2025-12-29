-- ================================================
-- TABLA: jobs_log (Logs de jobs y scraping)
-- ================================================

CREATE TABLE IF NOT EXISTS public.jobs_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_name VARCHAR(255) NOT NULL,
  job_type VARCHAR(100) NOT NULL, -- 'scraping', 'image_optimization', 'cleanup', 'duplicate_detection', etc.
  source_id UUID REFERENCES public.sources(id) ON DELETE SET NULL,
  status VARCHAR(50) NOT NULL, -- 'running', 'success', 'failed', 'partial'
  message TEXT,
  items_processed INTEGER DEFAULT 0,
  items_success INTEGER DEFAULT 0,
  items_failed INTEGER DEFAULT 0,
  execution_time_ms INTEGER, -- tiempo de ejecución en milisegundos
  error_details JSONB, -- detalles de errores si los hay
  metadata JSONB DEFAULT '{}'::jsonb, -- metadata adicional
  started_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  finished_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_jobs_log_job_name ON public.jobs_log(job_name);
CREATE INDEX IF NOT EXISTS idx_jobs_log_job_type ON public.jobs_log(job_type);
CREATE INDEX IF NOT EXISTS idx_jobs_log_source_id ON public.jobs_log(source_id);
CREATE INDEX IF NOT EXISTS idx_jobs_log_status ON public.jobs_log(status);
CREATE INDEX IF NOT EXISTS idx_jobs_log_started_at ON public.jobs_log(started_at DESC);

-- RLS Policies
ALTER TABLE public.jobs_log ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes si ya existen
DROP POLICY IF EXISTS "Superadmin can view all jobs logs" ON public.jobs_log;
DROP POLICY IF EXISTS "System can insert jobs logs" ON public.jobs_log;

-- Policy: Solo SuperAdmin puede VER logs
CREATE POLICY "Superadmin can view all jobs logs"
ON public.jobs_log FOR SELECT
USING (
  auth.uid() IN (
    SELECT id FROM public.users WHERE role = 'superadmin'
  )
);

-- Policy: El sistema (backend) puede insertar logs
-- NOTA: Para permitir inserciones desde el backend, necesitamos una service_role key
-- Esta política permite inserciones autenticadas
CREATE POLICY "System can insert jobs logs"
ON public.jobs_log FOR INSERT
WITH CHECK (true);

-- Función para calcular execution_time_ms automáticamente
CREATE OR REPLACE FUNCTION calculate_execution_time()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.finished_at IS NOT NULL AND NEW.started_at IS NOT NULL THEN
    NEW.execution_time_ms := EXTRACT(EPOCH FROM (NEW.finished_at - NEW.started_at)) * 1000;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para calcular execution_time_ms
DROP TRIGGER IF EXISTS set_execution_time ON public.jobs_log;
CREATE TRIGGER set_execution_time
  BEFORE UPDATE OF finished_at ON public.jobs_log
  FOR EACH ROW
  EXECUTE FUNCTION calculate_execution_time();

-- Vista para estadísticas de jobs
CREATE OR REPLACE VIEW public.jobs_stats AS
SELECT 
  job_type,
  COUNT(*) as total_executions,
  SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as successful,
  SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
  AVG(execution_time_ms) as avg_execution_time_ms,
  MAX(started_at) as last_execution
FROM public.jobs_log
GROUP BY job_type;

-- Comentarios para documentación
COMMENT ON TABLE public.jobs_log IS 'Registro de ejecución de jobs automáticos y scraping';
COMMENT ON COLUMN public.jobs_log.job_type IS 'Tipo de job (scraping, image_optimization, cleanup, duplicate_detection)';
COMMENT ON COLUMN public.jobs_log.execution_time_ms IS 'Tiempo de ejecución en milisegundos';
COMMENT ON COLUMN public.jobs_log.error_details IS 'Detalles JSON de errores si los hay';
