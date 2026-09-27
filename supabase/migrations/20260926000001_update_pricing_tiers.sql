-- Migration: Update agencies_plan_tier_check constraint to allow 'normal'

-- 1. Drop existing constraint
ALTER TABLE public.agencies 
  DROP CONSTRAINT IF EXISTS agencies_plan_tier_check;

-- 2. Update default value to 'normal'
ALTER TABLE public.agencies 
  ALTER COLUMN plan_tier SET DEFAULT 'normal';

-- 3. Update existing records with 'free', 'starter', or NULL to 'normal'
UPDATE public.agencies 
SET plan_tier = 'normal' 
WHERE plan_tier IS NULL OR plan_tier IN ('free', 'starter');

-- 4. Re-add check constraint allowing 'normal', 'pro', 'enterprise'
ALTER TABLE public.agencies 
  ADD CONSTRAINT agencies_plan_tier_check 
  CHECK (plan_tier IN ('normal', 'pro', 'enterprise'));
