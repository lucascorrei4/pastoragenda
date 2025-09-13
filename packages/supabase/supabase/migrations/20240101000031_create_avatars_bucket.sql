-- Create avatars bucket for custom auth system
-- This migration only creates the bucket without modifying RLS policies

-- Ensure the avatars bucket exists and is public
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;
