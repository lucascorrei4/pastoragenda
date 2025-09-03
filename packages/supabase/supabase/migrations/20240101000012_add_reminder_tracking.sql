-- Add reminder tracking fields to bookings table
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS reminder_sent_24h BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS reminder_sent_1h BOOLEAN DEFAULT FALSE;

-- Create index for efficient reminder queries
CREATE INDEX IF NOT EXISTS idx_bookings_reminder_24h 
ON public.bookings (start_time, reminder_sent_24h) 
WHERE reminder_sent_24h = FALSE;

CREATE INDEX IF NOT EXISTS idx_bookings_reminder_1h 
ON public.bookings (start_time, reminder_sent_1h) 
WHERE reminder_sent_1h = FALSE;

-- Add comment explaining the fields
COMMENT ON COLUMN public.bookings.reminder_sent_24h IS 'Tracks if 24-hour reminder has been sent for this booking';
COMMENT ON COLUMN public.bookings.reminder_sent_1h IS 'Tracks if 1-hour reminder has been sent for this booking';
