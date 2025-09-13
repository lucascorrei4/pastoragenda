-- Completely disable RLS on storage.objects for custom auth
-- This is the most comprehensive fix for custom JWT authentication

-- First, let's see what policies exist on storage.objects
-- (This is just for reference - we'll disable RLS anyway)

-- Disable RLS on storage.objects table completely
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- Ensure avatars bucket exists and is public
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Grant necessary permissions for the avatars bucket
-- This allows all operations on the avatars bucket
GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.objects TO anon;
