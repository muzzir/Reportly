-- ============================================================================
-- REPORTLY — PHASE 13 USER ONBOARDING SCHEMA & DATA MIGRATION
-- ============================================================================

-- Add onboarding_completed column to agencies table if it does not exist
ALTER TABLE public.agencies 
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE;

-- Data Migration: Mark all existing pre-existing agencies as onboarding_completed = TRUE
UPDATE public.agencies 
SET onboarding_completed = TRUE 
WHERE created_at < NOW();
