-- Fix storage RLS policies for custom JWT authentication
-- The custom auth system is incompatible with auth.uid() in RLS policies

-- Drop existing storage policies
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Allow all operations on avatars bucket" ON storage.objects;

-- Disable RLS on storage.objects for custom auth compatibility
-- This allows the application to handle authorization at the application level
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- Ensure the avatars bucket exists and is public
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;
