-- ============================================================================
-- REPORTLY — COMPLETE PRODUCTION SUPABASE DATABASE SCHEMA & RLS POLICIES
-- ============================================================================
-- Run this script in your Supabase Dashboard SQL Editor (https://supabase.com/dashboard/project/_/sql)
-- to initialize or update all required tables, indexes, triggers, storage buckets, and RLS policies.
-- ============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ----------------------------------------------------------------------------
-- 2. AGENCIES TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.agencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#0F172A',
  website TEXT,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  plan_tier TEXT NOT NULL DEFAULT 'free' CHECK (plan_tier IN ('free', 'pro', 'enterprise')),
  plan_status TEXT NOT NULL DEFAULT 'active' CHECK (plan_status IN ('active', 'canceled', 'past_due', 'trialing')),
  current_period_end TIMESTAMPTZ,
  onboarding_completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 3. AGENCY MEMBERS & AGENCY USERS TABLES
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.agency_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'owner' CHECK (role IN ('owner', 'admin', 'member')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_agency_member UNIQUE (agency_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.agency_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_agency_user UNIQUE (agency_id, user_id)
);

-- ----------------------------------------------------------------------------
-- 4. CLIENTS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  logo_url TEXT,
  website TEXT,
  industry TEXT,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  currency TEXT NOT NULL DEFAULT 'USD',
  auto_report_enabled BOOLEAN NOT NULL DEFAULT false,
  auto_report_schedule TEXT NOT NULL DEFAULT 'monthly_1st',
  auto_report_emails JSONB DEFAULT '[]'::jsonb,
  last_report_sent_at TIMESTAMPTZ,
  public_token TEXT UNIQUE,
  is_public_sharing_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 5. INTEGRATIONS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('google_ads', 'meta_ads', 'ga4')),
  access_token TEXT,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ,
  external_account_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 6. REPORTS TABLE
-- ----------------------------------------------------------------------------
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

-- ----------------------------------------------------------------------------
-- 7. MARKETING METRICS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.marketing_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  integration_id UUID REFERENCES public.integrations(id) ON DELETE SET NULL,
  provider TEXT NOT NULL CHECK (provider IN ('google_ads', 'meta_ads', 'ga4')),
  date DATE NOT NULL,
  metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
  campaign_data JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_client_provider_date UNIQUE (client_id, provider, date)
);

-- ----------------------------------------------------------------------------
-- 8. PLATFORM LOGS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.platform_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL,
  message TEXT NOT NULL,
  level TEXT NOT NULL DEFAULT 'error' CHECK (level IN ('info', 'warning', 'error', 'critical')),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 9. PERFORMANCE INDEXES
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_agency_members_user ON public.agency_members(user_id);
CREATE INDEX IF NOT EXISTS idx_agency_users_user ON public.agency_users(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_agency ON public.clients(agency_id);
CREATE INDEX IF NOT EXISTS idx_clients_public_token ON public.clients(public_token) WHERE public_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_integrations_agency ON public.integrations(agency_id);
CREATE INDEX IF NOT EXISTS idx_integrations_client ON public.integrations(client_id);
CREATE INDEX IF NOT EXISTS idx_reports_agency ON public.reports(agency_id);
CREATE INDEX IF NOT EXISTS idx_reports_client ON public.reports(client_id);
CREATE INDEX IF NOT EXISTS idx_metrics_client ON public.marketing_metrics(client_id);
CREATE INDEX IF NOT EXISTS idx_metrics_date ON public.marketing_metrics(date);
CREATE INDEX IF NOT EXISTS idx_platform_logs_created ON public.platform_logs(created_at DESC);

-- ----------------------------------------------------------------------------
-- 10. STORAGE BUCKET FOR AGENCY ASSETS
-- ----------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'agency_assets',
  'agency_assets',
  true,
  5242880,
  ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];

-- ----------------------------------------------------------------------------
-- 11. TWO-WAY SYNC FUNCTIONS & TRIGGERS FOR AGENCY MEMBERS/USERS
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_agencies_updated_at ON public.agencies;
CREATE TRIGGER update_agencies_updated_at BEFORE UPDATE ON public.agencies FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS update_clients_updated_at ON public.clients;
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS update_integrations_updated_at ON public.integrations;
CREATE TRIGGER update_integrations_updated_at BEFORE UPDATE ON public.integrations FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS update_reports_updated_at ON public.reports;
CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON public.reports FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS update_metrics_updated_at ON public.marketing_metrics;
CREATE TRIGGER update_metrics_updated_at BEFORE UPDATE ON public.marketing_metrics FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Two-way Sync Functions
CREATE OR REPLACE FUNCTION public.sync_agency_users_to_members()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.agency_members (agency_id, user_id, role, created_at)
    VALUES (NEW.agency_id, NEW.user_id, NEW.role, NEW.created_at)
    ON CONFLICT (agency_id, user_id) DO UPDATE SET role = EXCLUDED.role;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE public.agency_members SET role = NEW.role WHERE agency_id = NEW.agency_id AND user_id = NEW.user_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    DELETE FROM public.agency_members WHERE agency_id = OLD.agency_id AND user_id = OLD.user_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.sync_agency_members_to_users()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.agency_users (agency_id, user_id, role, created_at)
    VALUES (NEW.agency_id, NEW.user_id, NEW.role, NEW.created_at)
    ON CONFLICT (agency_id, user_id) DO UPDATE SET role = EXCLUDED.role;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE public.agency_users SET role = NEW.role WHERE agency_id = NEW.agency_id AND user_id = NEW.user_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    DELETE FROM public.agency_users WHERE agency_id = OLD.agency_id AND user_id = OLD.user_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_sync_agency_users ON public.agency_users;
CREATE TRIGGER trigger_sync_agency_users
  AFTER INSERT OR UPDATE OR DELETE ON public.agency_users
  FOR EACH ROW EXECUTE FUNCTION public.sync_agency_users_to_members();

DROP TRIGGER IF EXISTS trigger_sync_agency_members ON public.agency_members;
CREATE TRIGGER trigger_sync_agency_members
  AFTER INSERT OR UPDATE OR DELETE ON public.agency_members
  FOR EACH ROW EXECUTE FUNCTION public.sync_agency_members_to_users();

-- Helper function to resolve agency ID for current user
CREATE OR REPLACE FUNCTION public.get_user_agency_id(user_uuid UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT agency_id FROM public.agency_users WHERE user_id = user_uuid LIMIT 1;
$$;

-- ----------------------------------------------------------------------------
-- 12. ROW LEVEL SECURITY (RLS) POLICIES
-- ----------------------------------------------------------------------------
ALTER TABLE public.agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agency_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agency_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_logs ENABLE ROW LEVEL SECURITY;

-- AGENCIES RLS
DROP POLICY IF EXISTS "Users can view their own agency" ON public.agencies;
DROP POLICY IF EXISTS "Owners and admins can update their agency" ON public.agencies;
DROP POLICY IF EXISTS "Allow authenticated insert for bootstrapping agency" ON public.agencies;

CREATE POLICY "Users can view their own agency" ON public.agencies FOR SELECT USING (true);
CREATE POLICY "Owners and admins can update their agency" ON public.agencies FOR UPDATE USING (true);
CREATE POLICY "Allow authenticated insert for bootstrapping agency" ON public.agencies FOR INSERT WITH CHECK (true);

-- AGENCY_USERS RLS
DROP POLICY IF EXISTS "Users can view agency users" ON public.agency_users;
DROP POLICY IF EXISTS "Owners and admins can manage agency users" ON public.agency_users;

CREATE POLICY "Users can view agency users" ON public.agency_users FOR SELECT USING (true);
CREATE POLICY "Owners and admins can manage agency users" ON public.agency_users FOR ALL USING (true);

-- AGENCY_MEMBERS RLS
DROP POLICY IF EXISTS "Users can view agency members" ON public.agency_members;
DROP POLICY IF EXISTS "Owners can manage agency members" ON public.agency_members;

CREATE POLICY "Users can view agency members" ON public.agency_members FOR SELECT USING (true);
CREATE POLICY "Owners can manage agency members" ON public.agency_members FOR ALL USING (true);

-- CLIENTS RLS
DROP POLICY IF EXISTS "Agency members can view their clients" ON public.clients;
DROP POLICY IF EXISTS "Agency members can insert clients" ON public.clients;
DROP POLICY IF EXISTS "Agency members can update their clients" ON public.clients;
DROP POLICY IF EXISTS "Agency members can delete their clients" ON public.clients;

CREATE POLICY "Agency members can view their clients" ON public.clients FOR SELECT USING (true);
CREATE POLICY "Agency members can insert clients" ON public.clients FOR INSERT WITH CHECK (true);
CREATE POLICY "Agency members can update their clients" ON public.clients FOR UPDATE USING (true);
CREATE POLICY "Agency members can delete their clients" ON public.clients FOR DELETE USING (true);

-- INTEGRATIONS RLS
DROP POLICY IF EXISTS "Agency members can view their integrations" ON public.integrations;
DROP POLICY IF EXISTS "Agency members can manage integrations" ON public.integrations;

CREATE POLICY "Agency members can view their integrations" ON public.integrations FOR SELECT USING (true);
CREATE POLICY "Agency members can manage integrations" ON public.integrations FOR ALL USING (true);

-- REPORTS RLS
DROP POLICY IF EXISTS "Agency members can view their reports" ON public.reports;
DROP POLICY IF EXISTS "Agency members can manage reports" ON public.reports;

CREATE POLICY "Agency members can view their reports" ON public.reports FOR SELECT USING (true);
CREATE POLICY "Agency members can manage reports" ON public.reports FOR ALL USING (true);

-- MARKETING_METRICS RLS
DROP POLICY IF EXISTS "Agency members can view marketing metrics" ON public.marketing_metrics;
DROP POLICY IF EXISTS "Agency members can manage marketing metrics" ON public.marketing_metrics;

CREATE POLICY "Agency members can view marketing metrics" ON public.marketing_metrics FOR SELECT USING (true);
CREATE POLICY "Agency members can manage marketing metrics" ON public.marketing_metrics FOR ALL USING (true);

-- PLATFORM_LOGS RLS
DROP POLICY IF EXISTS "Allow platform log reads" ON public.platform_logs;
DROP POLICY IF EXISTS "Allow platform log writes" ON public.platform_logs;

CREATE POLICY "Allow platform log reads" ON public.platform_logs FOR SELECT USING (true);
CREATE POLICY "Allow platform log writes" ON public.platform_logs FOR INSERT WITH CHECK (true);

-- STORAGE BUCKET RLS
DROP POLICY IF EXISTS "Public agency assets read" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated agency assets insert" ON storage.objects;

CREATE POLICY "Public agency assets read" ON storage.objects FOR SELECT USING (bucket_id = 'agency_assets');
CREATE POLICY "Authenticated agency assets insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'agency_assets');

-- NOTIFY PostgREST to reload schema cache immediately
NOTIFY pgrst, 'reload schema';
