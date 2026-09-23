-- ============================================================================
-- REPORTLY — PHASE 14 PLATFORM LOGS & SYSTEM MONITORING SCHEMA
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.platform_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level TEXT NOT NULL DEFAULT 'error' CHECK (level IN ('info', 'warning', 'error', 'critical')),
  source TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_platform_logs_source ON public.platform_logs(source);
CREATE INDEX IF NOT EXISTS idx_platform_logs_created_at ON public.platform_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_platform_logs_level ON public.platform_logs(level);

-- Enable RLS
ALTER TABLE public.platform_logs ENABLE ROW LEVEL SECURITY;

-- Service Role full access policy
CREATE POLICY "Service role full access on platform_logs"
  ON public.platform_logs FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
