-- ============================================================================
-- REPORTLY — PHASE 9 CLIENT AUTOMATION & SCHEDULED REPORTING FIELDS
-- ============================================================================

ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS auto_report_enabled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS auto_report_emails TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS last_report_sent_at TIMESTAMPTZ;

-- Index for cron job performance when querying auto-reporting clients
CREATE INDEX IF NOT EXISTS idx_clients_auto_report_enabled ON public.clients(auto_report_enabled) WHERE auto_report_enabled = true;
