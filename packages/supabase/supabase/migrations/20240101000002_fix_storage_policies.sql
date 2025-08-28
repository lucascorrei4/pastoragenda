-- Fix storage policies for avatars
-- Drop existing policies
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;

-- Create corrected storage policies for avatars
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects
    FOR SELECT USING (bucket_id = 'avatars');

-- Users can upload avatars to their own folder
CREATE POLICY "Users can upload their own avatar" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'avatars' 
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- Users can update avatars in their own folder
CREATE POLICY "Users can update their own avatar" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'avatars' 
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- Users can delete avatars in their own folder
CREATE POLICY "Users can delete their own avatar" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'avatars' 
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- Alternative policy that's more permissive for development
-- CREATE POLICY "Users can upload any avatar" ON storage.objects
--     FOR INSERT WITH CHECK (bucket_id = 'avatars');

-- CREATE POLICY "Users can update any avatar" ON storage.objects
--     FOR UPDATE USING (bucket_id = 'avatars');

-- CREATE POLICY "Users can delete any avatar" ON storage.objects
--     FOR DELETE USING (bucket_id = 'avatars');
