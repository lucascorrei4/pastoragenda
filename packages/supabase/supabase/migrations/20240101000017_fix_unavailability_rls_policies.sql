-- Fix RLS policies for unavailability_periods table to work with custom authentication
-- Since this project uses custom JWT authentication instead of Supabase Auth,
-- we need to either disable RLS or create policies that work with the custom system

-- Option 1: Disable RLS for unavailability_periods (recommended for custom auth)
-- The application handles authentication at the API level, so RLS is redundant
ALTER TABLE public.unavailability_periods DISABLE ROW LEVEL SECURITY;

-- Drop the existing policies that don't work with custom auth
DROP POLICY IF EXISTS "Users can view their own unavailability periods" ON public.unavailability_periods;
DROP POLICY IF EXISTS "Users can insert their own unavailability periods" ON public.unavailability_periods;
DROP POLICY IF EXISTS "Users can update their own unavailability periods" ON public.unavailability_periods;
DROP POLICY IF EXISTS "Users can delete their own unavailability periods" ON public.unavailability_periods;

-- Add comment explaining the decision
COMMENT ON TABLE public.unavailability_periods IS 'Stores periods when pastors are unavailable for appointments (conferences, vacations, etc.). RLS disabled because this project uses custom JWT authentication handled at the application level.';
