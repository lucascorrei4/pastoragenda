-- Create the database trigger to call the Edge Function when a booking is created
CREATE OR REPLACE FUNCTION public.handle_booking_created()
RETURNS TRIGGER AS $$
BEGIN
    -- Call the Edge Function
    PERFORM
        net.http_post(
            url := 'https://qllicbvfcggtveuzvbqu.supabase.co/functions/v1/on-booking-created',
            headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('request.header.apikey') || '"}',
            body := json_build_object(
                'record', NEW,
                'old_record', OLD
            )::text
        );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
CREATE TRIGGER on_booking_created
    AFTER INSERT ON public.bookings
    FOR EACH ROW EXECUTE FUNCTION public.handle_booking_created();

-- Note: You'll need to enable the http extension and update the URL to match your actual Supabase project
-- Enable the http extension (run this manually in your Supabase dashboard or CLI)
-- CREATE EXTENSION IF NOT EXISTS http;
