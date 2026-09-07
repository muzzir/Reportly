-- ============================================================================
-- REPORTLY — PHASE 1 INITIAL DATABASE SCHEMA & MULTI-TENANT RLS POLICIES
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ----------------------------------------------------------------------------
-- 1. AGENCIES TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.agencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#0F172A',
  website TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 2. AGENCY MEMBERS TABLE (Maps Supabase auth.users to agencies)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.agency_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'owner' CHECK (role IN ('owner', 'admin', 'member')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(agency_id, user_id)
);

-- ----------------------------------------------------------------------------
-- 3. CLIENTS TABLE
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
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 4. INTEGRATIONS TABLE
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
-- 5. REPORTS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'generating', 'published', 'archived')),
  title TEXT NOT NULL,
  generated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- PERFORMANCE INDEXES
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_agency_members_user_id ON public.agency_members(user_id);
CREATE INDEX IF NOT EXISTS idx_agency_members_agency_id ON public.agency_members(agency_id);

CREATE INDEX IF NOT EXISTS idx_clients_agency_id ON public.clients(agency_id);

CREATE INDEX IF NOT EXISTS idx_integrations_agency_id ON public.integrations(agency_id);
CREATE INDEX IF NOT EXISTS idx_integrations_client_id ON public.integrations(client_id);

CREATE INDEX IF NOT EXISTS idx_reports_agency_id ON public.reports(agency_id);
CREATE INDEX IF NOT EXISTS idx_reports_client_id ON public.reports(client_id);
CREATE INDEX IF NOT EXISTS idx_reports_period ON public.reports(period_start, period_end);

-- ----------------------------------------------------------------------------
-- AUTOMATIC UPDATED_AT TRIGGER FUNCTION
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_agencies_updated_at BEFORE UPDATE ON public.agencies FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER update_integrations_updated_at BEFORE UPDATE ON public.integrations FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON public.reports FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ----------------------------------------------------------------------------
-- MULTI-TENANT RLS (ROW LEVEL SECURITY)
-- ----------------------------------------------------------------------------

-- Enable RLS on all tables
ALTER TABLE public.agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agency_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Helper function to retrieve agency_id for currently authenticated user
CREATE OR REPLACE FUNCTION public.get_user_agency_id(user_uuid UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT agency_id FROM public.agency_members WHERE user_id = user_uuid LIMIT 1;
$$;

-- RLS Policies for AGENCIES
CREATE POLICY "Users can view their own agency"
  ON public.agencies FOR SELECT
  USING (id = public.get_user_agency_id(auth.uid()));

CREATE POLICY "Owners and admins can update their agency"
  ON public.agencies FOR UPDATE
  USING (id = public.get_user_agency_id(auth.uid()));

-- RLS Policies for AGENCY_MEMBERS
CREATE POLICY "Users can view members of their agency"
  ON public.agency_members FOR SELECT
  USING (agency_id = public.get_user_agency_id(auth.uid()) OR user_id = auth.uid());

CREATE POLICY "Owners can manage agency members"
  ON public.agency_members FOR ALL
  USING (agency_id = public.get_user_agency_id(auth.uid()));

-- RLS Policies for CLIENTS
CREATE POLICY "Agency members can view their clients"
  ON public.clients FOR SELECT
  USING (agency_id = public.get_user_agency_id(auth.uid()));

CREATE POLICY "Agency members can insert clients"
  ON public.clients FOR INSERT
  WITH CHECK (agency_id = public.get_user_agency_id(auth.uid()));

CREATE POLICY "Agency members can update their clients"
  ON public.clients FOR UPDATE
  USING (agency_id = public.get_user_agency_id(auth.uid()));

CREATE POLICY "Agency members can delete their clients"
  ON public.clients FOR DELETE
  USING (agency_id = public.get_user_agency_id(auth.uid()));

-- RLS Policies for INTEGRATIONS
CREATE POLICY "Agency members can view their integrations"
  ON public.integrations FOR SELECT
  USING (agency_id = public.get_user_agency_id(auth.uid()));

CREATE POLICY "Agency members can manage integrations"
  ON public.integrations FOR ALL
  USING (agency_id = public.get_user_agency_id(auth.uid()));

-- RLS Policies for REPORTS
CREATE POLICY "Agency members can view their reports"
  ON public.reports FOR SELECT
  USING (agency_id = public.get_user_agency_id(auth.uid()));

CREATE POLICY "Agency members can manage reports"
  ON public.reports FOR ALL
  USING (agency_id = public.get_user_agency_id(auth.uid()));
