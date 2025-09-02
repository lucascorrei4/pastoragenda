-- Safe profiles table update - handles existing columns gracefully
-- Add missing fields to profiles table for custom authentication
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE;

-- Create unique constraint on email if it doesn't exist
DO $$
BEGIN
    -- Check if unique constraint already exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'profiles_email_key' 
        AND conrelid = 'public.profiles'::regclass
    ) THEN
        -- Add unique constraint on email
        ALTER TABLE public.profiles ADD CONSTRAINT profiles_email_key UNIQUE (email);
    END IF;
END $$;

-- Create index for email lookups (only if it doesn't exist)
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- Update the profiles table to remove the dependency on auth.users
-- Since we're using custom auth, we don't need the foreign key to auth.users
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Add comments to document the change (safe to run multiple times)
COMMENT ON TABLE public.profiles IS 'User profiles with custom JWT authentication (no longer dependent on auth.users)';
COMMENT ON COLUMN public.profiles.email IS 'User email address (unique)';
COMMENT ON COLUMN public.profiles.email_verified IS 'Whether the user has verified their email address';
COMMENT ON COLUMN public.profiles.last_login_at IS 'Timestamp of the user''s last login';
