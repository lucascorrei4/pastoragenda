-- Migration script to move existing auth.users data to profiles table
-- This script should be run after the profiles table has been updated with new fields

-- First, let's check if we have any existing auth.users data to migrate
DO $$
DECLARE
    user_count INTEGER;
BEGIN
    -- Count existing auth.users
    SELECT COUNT(*) INTO user_count FROM auth.users;
    
    IF user_count > 0 THEN
        RAISE NOTICE 'Found % users in auth.users table to migrate', user_count;
        
        -- Update profiles with email data from auth.users
        UPDATE public.profiles 
        SET 
            email = auth_users.email,
            email_verified = COALESCE(auth_users.email_confirmed_at IS NOT NULL, false),
            last_login_at = auth_users.last_sign_in_at,
            updated_at = NOW()
        FROM auth.users AS auth_users
        WHERE profiles.id = auth_users.id
        AND profiles.email IS NULL; -- Only update if email is not already set
        
        RAISE NOTICE 'Migration completed successfully';
    ELSE
        RAISE NOTICE 'No users found in auth.users table to migrate';
    END IF;
END $$;

-- Create a backup of the auth.users table (optional - for safety)
-- CREATE TABLE auth.users_backup AS SELECT * FROM auth.users;

-- Verify the migration
SELECT 
    p.id,
    p.email,
    p.email_verified,
    p.last_login_at,
    p.full_name,
    p.alias
FROM public.profiles p
WHERE p.email IS NOT NULL
ORDER BY p.created_at DESC;

-- Add a comment to document the migration
COMMENT ON TABLE public.profiles IS 'User profiles with custom authentication (migrated from auth.users on ' || NOW() || ')';
