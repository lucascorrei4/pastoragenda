-- Add user_id field to bookings table for trigger functionality
-- This field is needed for the on-booking-created trigger to work properly

ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Add comment for documentation
COMMENT ON COLUMN public.bookings.user_id IS 'ID of the pastor who owns the event type for this booking';

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON public.bookings(user_id);
