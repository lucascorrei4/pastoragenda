-- Remove booking trigger since we're using custom auth
-- Database triggers don't work well with custom JWT authentication
-- We'll handle email sending directly in the client instead

-- Drop the trigger
DROP TRIGGER IF EXISTS on_booking_created ON public.bookings;

-- Drop the trigger function
DROP FUNCTION IF EXISTS public.handle_booking_created();

-- Add comment explaining the decision
COMMENT ON TABLE public.bookings IS 'Appointment bookings. Email sending handled client-side due to custom JWT authentication.';
