-- ============================================================================
-- REPORTLY — PHASE 11 STRIPE BILLING & SUBSCRIPTION FIELDS
-- ============================================================================

ALTER TABLE public.agencies
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS plan_tier TEXT NOT NULL DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS plan_status TEXT NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ;

-- Indexes for Stripe webhook lookup performance
CREATE INDEX IF NOT EXISTS idx_agencies_stripe_customer_id ON public.agencies(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_agencies_stripe_subscription_id ON public.agencies(stripe_subscription_id);
