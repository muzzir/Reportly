-- ============================================================================
-- REPORTLY — PHASE 10 PUBLIC CLIENT PORTALS & SHARE TOKENS
-- ============================================================================

-- 1. Add public_token and is_public_sharing_enabled columns to clients table
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS public_token UUID NOT NULL DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS is_public_sharing_enabled BOOLEAN NOT NULL DEFAULT true;

-- 2. Add unique constraint & index on public_token for fast lookup
ALTER TABLE public.clients
  ADD CONSTRAINT unique_client_public_token UNIQUE (public_token);

CREATE INDEX IF NOT EXISTS idx_clients_public_token ON public.clients(public_token);

-- 3. Backfill existing clients if any have null public_token
UPDATE public.clients
SET public_token = gen_random_uuid()
WHERE public_token IS NULL;
