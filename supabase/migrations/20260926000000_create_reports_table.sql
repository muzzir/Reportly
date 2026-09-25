-- ============================================================================
-- REPORTLY — ENSURE REPORTS TABLE & RLS POLICIES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  period_start DATE NOT NULL DEFAULT CURRENT_DATE,
  period_end DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'generating', 'published', 'archived')),
  title TEXT NOT NULL DEFAULT 'Client Performance Overview',
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  metrics_summary JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reports_agency_id ON public.reports(agency_id);
CREATE INDEX IF NOT EXISTS idx_reports_client_id ON public.reports(client_id);
CREATE INDEX IF NOT EXISTS idx_reports_period ON public.reports(period_start, period_end);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'reports' AND policyname = 'Agency members can view their reports'
  ) THEN
    CREATE POLICY "Agency members can view their reports"
      ON public.reports FOR SELECT
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'reports' AND policyname = 'Agency members can manage reports'
  ) THEN
    CREATE POLICY "Agency members can manage reports"
      ON public.reports FOR ALL
      USING (true);
  END IF;
END $$;
