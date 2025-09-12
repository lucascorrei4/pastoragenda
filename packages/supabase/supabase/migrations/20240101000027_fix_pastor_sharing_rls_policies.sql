-- Fix RLS policies for pastor_sharing_settings table to work with custom authentication
-- Since this project uses custom JWT authentication instead of Supabase Auth,
-- we need to either disable RLS or create policies that work with the custom system

-- Option 1: Disable RLS for pastor_sharing_settings (recommended for custom auth)
-- The application handles authentication at the API level, so RLS is redundant
ALTER TABLE public.pastor_sharing_settings DISABLE ROW LEVEL SECURITY;

-- Drop the existing policies that don't work with custom auth
DROP POLICY IF EXISTS "Users can view their own sharing settings" ON public.pastor_sharing_settings;
DROP POLICY IF EXISTS "Users can update their own sharing settings" ON public.pastor_sharing_settings;
DROP POLICY IF EXISTS "Users can insert their own sharing settings" ON public.pastor_sharing_settings;
DROP POLICY IF EXISTS "Public sharing settings are viewable by anyone" ON public.pastor_sharing_settings;

-- Add comment explaining the decision
COMMENT ON TABLE public.pastor_sharing_settings IS 'Settings for sharing pastor agendas publicly. RLS disabled because this project uses custom JWT authentication handled at the application level.';
