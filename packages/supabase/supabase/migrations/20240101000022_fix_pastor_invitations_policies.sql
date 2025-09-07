-- Fix RLS policies for pastor_invitations to use profiles table instead of auth.users
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view invitations they sent or received" ON public.pastor_invitations;
DROP POLICY IF EXISTS "Users can create invitations" ON public.pastor_invitations;
DROP POLICY IF EXISTS "Invited users can update invitation status" ON public.pastor_invitations;

-- Recreate policies using profiles table
CREATE POLICY "Users can view invitations they sent or received" ON public.pastor_invitations
    FOR SELECT USING (
        auth.uid() = from_pastor_id OR 
        to_email = (SELECT email FROM public.profiles WHERE id = auth.uid())
    );

CREATE POLICY "Users can create invitations" ON public.pastor_invitations
    FOR INSERT WITH CHECK (auth.uid() = from_pastor_id);

CREATE POLICY "Invited users can update invitation status" ON public.pastor_invitations
    FOR UPDATE USING (to_email = (SELECT email FROM public.profiles WHERE id = auth.uid()));

-- Add additional policies for better access control
CREATE POLICY "Users can delete invitations they sent" ON public.pastor_invitations
    FOR DELETE USING (auth.uid() = from_pastor_id);

CREATE POLICY "Service role full access" ON public.pastor_invitations
    FOR ALL USING (auth.role() = 'service_role');
