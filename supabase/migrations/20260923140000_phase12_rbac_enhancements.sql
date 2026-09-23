-- ============================================================================
-- REPORTLY — PHASE 12 TEAM MANAGEMENT & RBAC SCHEMA & RLS OVERHAUL
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. AGENCY_USERS TABLE (JOIN TABLE)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.agency_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_agency_user UNIQUE (agency_id, user_id)
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_agency_users_user_id ON public.agency_users(user_id);
CREATE INDEX IF NOT EXISTS idx_agency_users_agency_id ON public.agency_users(agency_id);
CREATE INDEX IF NOT EXISTS idx_agency_users_lookup ON public.agency_users(agency_id, user_id);

-- ----------------------------------------------------------------------------
-- 2. DATA MIGRATION / BACKFILL
-- ----------------------------------------------------------------------------
INSERT INTO public.agency_users (agency_id, user_id, role, created_at)
SELECT am.agency_id, am.user_id, am.role, am.created_at
FROM public.agency_members am
ON CONFLICT (agency_id, user_id) 
DO UPDATE SET role = EXCLUDED.role;

-- ----------------------------------------------------------------------------
-- 3. TWO-WAY SYNC TRIGGERS
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.sync_agency_users_to_members()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.agency_members (agency_id, user_id, role, created_at)
    VALUES (NEW.agency_id, NEW.user_id, NEW.role, NEW.created_at)
    ON CONFLICT (agency_id, user_id) DO UPDATE SET role = EXCLUDED.role;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE public.agency_members
    SET role = NEW.role
    WHERE agency_id = NEW.agency_id AND user_id = NEW.user_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    DELETE FROM public.agency_members
    WHERE agency_id = OLD.agency_id AND user_id = OLD.user_id;
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
    UPDATE public.agency_users
    SET role = NEW.role
    WHERE agency_id = NEW.agency_id AND user_id = NEW.user_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    DELETE FROM public.agency_users
    WHERE agency_id = OLD.agency_id AND user_id = OLD.user_id;
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

-- ----------------------------------------------------------------------------
-- 4. HELPER FUNCTIONS FOR RBAC & WORKSPACE MEMBERSHIP
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_user_agency_id(user_uuid UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT agency_id FROM public.agency_users WHERE user_id = user_uuid LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_user_role(user_uuid UUID, agency_uuid UUID)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT role FROM public.agency_users WHERE user_id = user_uuid AND agency_id = agency_uuid LIMIT 1;
$$;

-- ----------------------------------------------------------------------------
-- 5. ROW LEVEL SECURITY (RLS) OVERHAUL
-- ----------------------------------------------------------------------------
ALTER TABLE public.agency_users ENABLE ROW LEVEL SECURITY;

-- AGENCIES RLS
DROP POLICY IF EXISTS "Users can view their own agency" ON public.agencies;
DROP POLICY IF EXISTS "Owners and admins can update their agency" ON public.agencies;

CREATE POLICY "Users can view their own agency"
  ON public.agencies FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.agency_users au
      WHERE au.agency_id = public.agencies.id
      AND au.user_id = auth.uid()
    )
  );

CREATE POLICY "Owners and admins can update their agency"
  ON public.agencies FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.agency_users au
      WHERE au.agency_id = public.agencies.id
      AND au.user_id = auth.uid()
      AND au.role IN ('owner', 'admin')
    )
  );

-- AGENCY_USERS RLS
DROP POLICY IF EXISTS "Users can view agency users" ON public.agency_users;
DROP POLICY IF EXISTS "Owners and admins can manage agency users" ON public.agency_users;

CREATE POLICY "Users can view agency users"
  ON public.agency_users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.agency_users au
      WHERE au.agency_id = public.agency_users.agency_id
      AND au.user_id = auth.uid()
    )
  );

CREATE POLICY "Owners and admins can manage agency users"
  ON public.agency_users FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.agency_users au
      WHERE au.agency_id = public.agency_users.agency_id
      AND au.user_id = auth.uid()
      AND au.role IN ('owner', 'admin')
    )
  );

-- CLIENTS RLS
DROP POLICY IF EXISTS "Agency members can view their clients" ON public.clients;
DROP POLICY IF EXISTS "Agency members can insert clients" ON public.clients;
DROP POLICY IF EXISTS "Agency members can update their clients" ON public.clients;
DROP POLICY IF EXISTS "Agency members can delete their clients" ON public.clients;

CREATE POLICY "Agency members can view their clients"
  ON public.clients FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.agency_users au
      WHERE au.agency_id = public.clients.agency_id
      AND au.user_id = auth.uid()
    )
  );

CREATE POLICY "Agency members can insert clients"
  ON public.clients FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.agency_users au
      WHERE au.agency_id = public.clients.agency_id
      AND au.user_id = auth.uid()
    )
  );

CREATE POLICY "Agency members can update their clients"
  ON public.clients FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.agency_users au
      WHERE au.agency_id = public.clients.agency_id
      AND au.user_id = auth.uid()
    )
  );

CREATE POLICY "Agency members can delete their clients"
  ON public.clients FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.agency_users au
      WHERE au.agency_id = public.clients.agency_id
      AND au.user_id = auth.uid()
      AND au.role IN ('owner', 'admin')
    )
  );

-- INTEGRATIONS RLS
DROP POLICY IF EXISTS "Agency members can view their integrations" ON public.integrations;
DROP POLICY IF EXISTS "Agency members can manage integrations" ON public.integrations;

CREATE POLICY "Agency members can view their integrations"
  ON public.integrations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.agency_users au
      WHERE au.agency_id = public.integrations.agency_id
      AND au.user_id = auth.uid()
    )
  );

CREATE POLICY "Agency members can manage integrations"
  ON public.integrations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.agency_users au
      WHERE au.agency_id = public.integrations.agency_id
      AND au.user_id = auth.uid()
    )
  );

-- REPORTS RLS
DROP POLICY IF EXISTS "Agency members can view their reports" ON public.reports;
DROP POLICY IF EXISTS "Agency members can manage reports" ON public.reports;

CREATE POLICY "Agency members can view their reports"
  ON public.reports FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.agency_users au
      WHERE au.agency_id = public.reports.agency_id
      AND au.user_id = auth.uid()
    )
  );

CREATE POLICY "Agency members can manage reports"
  ON public.reports FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.agency_users au
      WHERE au.agency_id = public.reports.agency_id
      AND au.user_id = auth.uid()
    )
  );
