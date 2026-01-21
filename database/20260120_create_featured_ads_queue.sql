-- Tabla para historial y gestión de destacados (cola)
CREATE TABLE public.featured_ads_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ad_id UUID NOT NULL REFERENCES ads(id) ON DELETE CASCADE,
    activated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deactivated_at TIMESTAMPTZ,
    activated_by UUID REFERENCES users(id),
    status VARCHAR(20) NOT NULL DEFAULT 'active', -- active, inactive, expired, restored
    expires_at TIMESTAMPTZ,
    reason TEXT,
    restored_from UUID REFERENCES featured_ads_queue(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices útiles
CREATE INDEX idx_featured_ads_queue_ad_id ON public.featured_ads_queue(ad_id);
CREATE INDEX idx_featured_ads_queue_status ON public.featured_ads_queue(status);
CREATE INDEX idx_featured_ads_queue_expires_at ON public.featured_ads_queue(expires_at);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_featured_ads_queue_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_featured_ads_queue_updated_at
BEFORE UPDATE ON public.featured_ads_queue
FOR EACH ROW EXECUTE FUNCTION update_featured_ads_queue_updated_at();
