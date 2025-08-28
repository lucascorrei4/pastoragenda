-- Add custom answers field to bookings table
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS custom_answers JSONB DEFAULT '{}'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN public.bookings.custom_answers IS 'JSON object storing answers to custom questions for this booking';
