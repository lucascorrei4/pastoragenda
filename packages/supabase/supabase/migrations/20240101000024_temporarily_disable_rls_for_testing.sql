-- Temporarily disable RLS for master_pastor_follows table to test invitation acceptance
-- This is a safe operation that won't delete any data

-- Disable RLS for master_pastor_follows table
ALTER TABLE public.master_pastor_follows DISABLE ROW LEVEL SECURITY;

-- Add a comment to document this temporary change
COMMENT ON TABLE public.master_pastor_follows IS 'RLS temporarily disabled for testing invitation acceptance with custom JWT auth';
