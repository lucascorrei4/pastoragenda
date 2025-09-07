-- Fix RLS policies for pastor_sharing_settings to ensure inserts work properly
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own sharing settings" ON public.pastor_sharing_settings;
DROP POLICY IF EXISTS "Users can update their own sharing settings" ON public.pastor_sharing_settings;
DROP POLICY IF EXISTS "Users can insert their own sharing settings" ON public.pastor_sharing_settings;
DROP POLICY IF EXISTS "Users can delete their own sharing settings" ON public.pastor_sharing_settings;
DROP POLICY IF EXISTS "Public sharing settings are viewable by anyone" ON public.pastor_sharing_settings;
DROP POLICY IF EXISTS "Service role full access" ON public.pastor_sharing_settings;

-- Recreate policies with explicit checks
CREATE POLICY "Users can view their own sharing settings" ON public.pastor_sharing_settings
    FOR SELECT USING (auth.uid() = pastor_id);

CREATE POLICY "Users can update their own sharing settings" ON public.pastor_sharing_settings
    FOR UPDATE USING (auth.uid() = pastor_id);

CREATE POLICY "Users can insert their own sharing settings" ON public.pastor_sharing_settings
    FOR INSERT WITH CHECK (auth.uid() = pastor_id);

CREATE POLICY "Users can delete their own sharing settings" ON public.pastor_sharing_settings
    FOR DELETE USING (auth.uid() = pastor_id);

CREATE POLICY "Public sharing settings are viewable by anyone" ON public.pastor_sharing_settings
    FOR SELECT USING (is_public_enabled = true);

CREATE POLICY "Service role full access" ON public.pastor_sharing_settings
    FOR ALL USING (auth.role() = 'service_role');

-- Add a policy to allow inserts when pastor_id matches the authenticated user
CREATE POLICY "Allow insert for authenticated users" ON public.pastor_sharing_settings
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL AND 
        auth.uid() = pastor_id
    );

-- Ensure the table has the correct structure
ALTER TABLE public.pastor_sharing_settings 
    ALTER COLUMN pastor_id SET NOT NULL;

-- Add a unique constraint to prevent duplicate settings per pastor
ALTER TABLE public.pastor_sharing_settings 
    ADD CONSTRAINT unique_pastor_sharing_settings 
    UNIQUE (pastor_id);
