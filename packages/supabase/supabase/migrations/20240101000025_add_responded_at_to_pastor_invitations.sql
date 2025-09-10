-- Add missing responded_at column to pastor_invitations table
-- This column is needed for tracking when invitations are accepted/declined

ALTER TABLE public.pastor_invitations 
ADD COLUMN IF NOT EXISTS responded_at TIMESTAMP WITH TIME ZONE;

-- Add a comment to document the column
COMMENT ON COLUMN public.pastor_invitations.responded_at IS 'Timestamp when the invitation was accepted or declined';
