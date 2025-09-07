-- Comprehensive fix for all RLS policies to use profiles table instead of auth.users
-- This ensures all policies work with the custom authentication system

-- Fix pastor_invitations policies
DROP POLICY IF EXISTS "Users can view invitations they sent or received" ON public.pastor_invitations;
DROP POLICY IF EXISTS "Users can create invitations" ON public.pastor_invitations;
DROP POLICY IF EXISTS "Invited users can update invitation status" ON public.pastor_invitations;
DROP POLICY IF EXISTS "Users can delete invitations they sent" ON public.pastor_invitations;
DROP POLICY IF EXISTS "Service role full access" ON public.pastor_invitations;

-- Recreate pastor_invitations policies
CREATE POLICY "Users can view invitations they sent or received" ON public.pastor_invitations
    FOR SELECT USING (
        auth.uid() = from_pastor_id OR 
        to_email = (SELECT email FROM public.profiles WHERE id = auth.uid())
    );

CREATE POLICY "Users can create invitations" ON public.pastor_invitations
    FOR INSERT WITH CHECK (auth.uid() = from_pastor_id);

CREATE POLICY "Invited users can update invitation status" ON public.pastor_invitations
    FOR UPDATE USING (to_email = (SELECT email FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can delete invitations they sent" ON public.pastor_invitations
    FOR DELETE USING (auth.uid() = from_pastor_id);

CREATE POLICY "Service role full access" ON public.pastor_invitations
    FOR ALL USING (auth.role() = 'service_role');

-- Ensure pastor_sharing_settings policies are correct
DROP POLICY IF EXISTS "Users can view their own sharing settings" ON public.pastor_sharing_settings;
DROP POLICY IF EXISTS "Users can update their own sharing settings" ON public.pastor_sharing_settings;
DROP POLICY IF EXISTS "Users can insert their own sharing settings" ON public.pastor_sharing_settings;
DROP POLICY IF EXISTS "Users can delete their own sharing settings" ON public.pastor_sharing_settings;
DROP POLICY IF EXISTS "Public sharing settings are viewable by anyone" ON public.pastor_sharing_settings;
DROP POLICY IF EXISTS "Service role full access" ON public.pastor_sharing_settings;
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON public.pastor_sharing_settings;

-- Recreate pastor_sharing_settings policies
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

-- Ensure master_pastor_follows policies are correct
DROP POLICY IF EXISTS "Users can view follows they are involved in" ON public.master_pastor_follows;
DROP POLICY IF EXISTS "Users can create follows as master pastor" ON public.master_pastor_follows;
DROP POLICY IF EXISTS "Followed pastors can update invitation status" ON public.master_pastor_follows;
DROP POLICY IF EXISTS "Either party can delete the follow" ON public.master_pastor_follows;

-- Recreate master_pastor_follows policies
CREATE POLICY "Users can view follows they are involved in" ON public.master_pastor_follows
    FOR SELECT USING (auth.uid() = master_pastor_id OR auth.uid() = followed_pastor_id);

CREATE POLICY "Users can create follows as master pastor" ON public.master_pastor_follows
    FOR INSERT WITH CHECK (auth.uid() = master_pastor_id);

CREATE POLICY "Followed pastors can update invitation status" ON public.master_pastor_follows
    FOR UPDATE USING (auth.uid() = followed_pastor_id);

CREATE POLICY "Either party can delete the follow" ON public.master_pastor_follows
    FOR DELETE USING (auth.uid() = master_pastor_id OR auth.uid() = followed_pastor_id);

-- Add service role policy for master_pastor_follows
CREATE POLICY "Service role full access" ON public.master_pastor_follows
    FOR ALL USING (auth.role() = 'service_role');

-- Verify that all tables have RLS enabled
ALTER TABLE public.pastor_sharing_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_pastor_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pastor_invitations ENABLE ROW LEVEL SECURITY;
