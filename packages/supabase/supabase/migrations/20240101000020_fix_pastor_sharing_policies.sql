-- Fix any incorrect RLS policies for pastor_sharing_settings
-- Drop existing policies if they exist with wrong column names
DROP POLICY IF EXISTS "Users can view their own sharing settings" ON public.pastor_sharing_settings;
DROP POLICY IF EXISTS "Users can update their own sharing settings" ON public.pastor_sharing_settings;
DROP POLICY IF EXISTS "Users can insert their own sharing settings" ON public.pastor_sharing_settings;
DROP POLICY IF EXISTS "Users can delete their own sharing settings" ON public.pastor_sharing_settings;
DROP POLICY IF EXISTS "Public sharing settings are viewable by anyone" ON public.pastor_sharing_settings;
DROP POLICY IF EXISTS "Service role full access" ON public.pastor_sharing_settings;

-- Recreate correct policies using pastor_id column
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

-- Create or replace the update trigger function
CREATE OR REPLACE FUNCTION update_pastor_sharing_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create or replace the update trigger
DROP TRIGGER IF EXISTS update_pastor_sharing_settings_updated_at ON public.pastor_sharing_settings;
CREATE TRIGGER update_pastor_sharing_settings_updated_at
    BEFORE UPDATE ON public.pastor_sharing_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_pastor_sharing_settings_updated_at();
