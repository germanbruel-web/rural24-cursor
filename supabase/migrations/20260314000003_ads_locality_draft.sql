-- Migration: 20260314000003_ads_locality_draft.sql
-- Sprint 8A — Backend Publicación Eficiente
-- Agrega locality_id (privacidad de localidad) y draft_expires_at (limpieza de drafts) a ads
-- 2026-03-14

-- ============================================================
-- 1. LOCALITY_ID — Privacidad de localidad en ads
-- ============================================================
-- locality_id se guarda en DB pero NO se expone en lecturas públicas
-- Solo se muestra la provincia (campo province existente)

ALTER TABLE public.ads
  ADD COLUMN locality_id uuid REFERENCES public.localities(id) ON DELETE SET NULL;

CREATE INDEX idx_ads_locality_id ON public.ads(locality_id);

COMMENT ON COLUMN public.ads.locality_id IS
  'FK a localities. Solo visible al dueño del aviso. Públicamente solo se expone province.';

-- ============================================================
-- 2. DRAFT_EXPIRES_AT — Limpieza automática de borradores
-- ============================================================
-- Ads con status=draft pasadas las 24h se marcan para cleanup
-- El cron endpoint DELETE /api/ads/cron/cleanup-drafts los elimina

ALTER TABLE public.ads
  ADD COLUMN draft_expires_at timestamptz;

CREATE INDEX idx_ads_draft_expires ON public.ads(draft_expires_at)
  WHERE status = 'draft';

COMMENT ON COLUMN public.ads.draft_expires_at IS
  'Timestamp de expiración para ads en borrador. Null = no expira (ads activos).';
