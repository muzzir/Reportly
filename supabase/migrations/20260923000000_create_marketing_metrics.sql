-- ============================================================================
-- REPORTLY — PHASE 4 MARKETING METRICS SCHEMA & RLS POLICIES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. MARKETING_METRICS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.marketing_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  integration_id UUID NOT NULL REFERENCES public.integrations(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  campaign_name TEXT NOT NULL,
  spend NUMERIC(12, 4) NOT NULL DEFAULT 0,
  impressions INTEGER NOT NULL DEFAULT 0,
  clicks INTEGER NOT NULL DEFAULT 0,
  conversions NUMERIC(12, 4) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Unique constraint for safe upserts & preventing duplicate daily records per campaign & integration
  CONSTRAINT unique_integration_date_campaign UNIQUE (integration_id, date, campaign_name)
);

-- ----------------------------------------------------------------------------
-- PERFORMANCE INDEXES
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_marketing_metrics_client_id ON public.marketing_metrics(client_id);
CREATE INDEX IF NOT EXISTS idx_marketing_metrics_integration_id ON public.marketing_metrics(integration_id);
CREATE INDEX IF NOT EXISTS idx_marketing_metrics_date ON public.marketing_metrics(date);
CREATE INDEX IF NOT EXISTS idx_marketing_metrics_client_date ON public.marketing_metrics(client_id, date);

-- ----------------------------------------------------------------------------
-- AUTOMATIC UPDATED_AT TRIGGER
-- ----------------------------------------------------------------------------
CREATE TRIGGER update_marketing_metrics_updated_at
  BEFORE UPDATE ON public.marketing_metrics
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ----------------------------------------------------------------------------
-- MULTI-TENANT RLS (ROW LEVEL SECURITY)
-- ----------------------------------------------------------------------------
ALTER TABLE public.marketing_metrics ENABLE ROW LEVEL SECURITY;

-- Agency members can ONLY view marketing metrics for clients belonging to their agency
CREATE POLICY "Agency members can view their client marketing metrics"
  ON public.marketing_metrics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.clients c
      WHERE c.id = public.marketing_metrics.client_id
      AND c.agency_id = public.get_user_agency_id(auth.uid())
    )
  );

-- Agency members can manage (INSERT, UPDATE, DELETE) marketing metrics for their clients
CREATE POLICY "Agency members can manage their client marketing metrics"
  ON public.marketing_metrics FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.clients c
      WHERE c.id = public.marketing_metrics.client_id
      AND c.agency_id = public.get_user_agency_id(auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.clients c
      WHERE c.id = public.marketing_metrics.client_id
      AND c.agency_id = public.get_user_agency_id(auth.uid())
    )
  );
