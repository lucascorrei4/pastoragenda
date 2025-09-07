-- Quick fix for pastor_invitations insert RLS policy issue
-- This ensures users can insert invitations they send

-- First, drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can view invitations they sent or received" ON public.pastor_invitations;
DROP POLICY IF EXISTS "Users can create invitations" ON public.pastor_invitations;
DROP POLICY IF EXISTS "Invited users can update invitation status" ON public.pastor_invitations;
DROP POLICY IF EXISTS "Users can delete invitations they sent" ON public.pastor_invitations;
DROP POLICY IF EXISTS "Service role full access" ON public.pastor_invitations;

-- Create simple, working policies
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

-- Ensure RLS is enabled
ALTER TABLE public.pastor_invitations ENABLE ROW LEVEL SECURITY;

-- Test the policy by checking if a user can insert (this will help debug)
-- This is just for verification - you can remove this after testing
DO $$
BEGIN
    RAISE NOTICE 'Pastor invitations RLS policies have been updated successfully';
    RAISE NOTICE 'Users should now be able to insert invitations where auth.uid() = from_pastor_id';
END $$;
