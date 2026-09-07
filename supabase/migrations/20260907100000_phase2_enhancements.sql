-- ============================================================================
-- REPORTLY — PHASE 2 SCHEMA ENHANCEMENTS
-- ============================================================================

-- Add metrics_summary JSONB column to reports table for aggregated channel KPIs
ALTER TABLE public.reports 
ADD COLUMN IF NOT EXISTS metrics_summary JSONB NOT NULL DEFAULT '{
  "totalSpend": 0,
  "totalImpressions": 0,
  "totalClicks": 0,
  "totalConversions": 0,
  "roas": 0,
  "channels": {
    "google_ads": {"spend": 0, "conversions": 0},
    "meta_ads": {"spend": 0, "conversions": 0},
    "ga4": {"sessions": 0, "conversions": 0}
  }
}'::jsonb;

-- Add RLS policy allowing initial agency creation during sign-up onboarding
CREATE POLICY "Authenticated users can create an agency"
  ON public.agencies FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create agency membership on signup"
  ON public.agency_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);
