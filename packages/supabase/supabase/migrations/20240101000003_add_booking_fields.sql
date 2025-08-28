-- Add description and phone fields to bookings table
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS booker_description TEXT,
ADD COLUMN IF NOT EXISTS booker_phone TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.bookings.booker_description IS 'Optional description provided by the person booking the appointment';
COMMENT ON COLUMN public.bookings.booker_phone IS 'Phone number provided by the person booking the appointment';
