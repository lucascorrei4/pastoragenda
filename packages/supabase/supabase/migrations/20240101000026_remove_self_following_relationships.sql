-- Remove any self-following relationships where master_pastor_id = followed_pastor_id
DELETE FROM public.master_pastor_follows 
WHERE master_pastor_id = followed_pastor_id;

-- Add a constraint to prevent self-following in the future
ALTER TABLE public.master_pastor_follows 
ADD CONSTRAINT check_no_self_following 
CHECK (master_pastor_id != followed_pastor_id);
