-- Add Google Calendar integration fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS google_calendar_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS google_calendar_id TEXT,
ADD COLUMN IF NOT EXISTS google_calendar_access_token TEXT,
ADD COLUMN IF NOT EXISTS google_calendar_refresh_token TEXT,
ADD COLUMN IF NOT EXISTS google_calendar_token_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS google_calendar_sync_enabled BOOLEAN DEFAULT FALSE;

-- Add Google Calendar event ID to bookings table for sync tracking
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS google_calendar_event_id TEXT,
ADD COLUMN IF NOT EXISTS google_calendar_synced_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS google_calendar_sync_status TEXT DEFAULT 'pending' CHECK (google_calendar_sync_status IN ('pending', 'synced', 'failed', 'disabled'));

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_google_calendar_enabled ON public.profiles(google_calendar_enabled);
CREATE INDEX IF NOT EXISTS idx_bookings_google_calendar_event_id ON public.bookings(google_calendar_event_id);
CREATE INDEX IF NOT EXISTS idx_bookings_google_calendar_sync_status ON public.bookings(google_calendar_sync_status);

-- Add comments for documentation
COMMENT ON COLUMN public.profiles.google_calendar_enabled IS 'Whether Google Calendar integration is enabled for this user';
COMMENT ON COLUMN public.profiles.google_calendar_id IS 'Google Calendar ID for this user';
COMMENT ON COLUMN public.profiles.google_calendar_access_token IS 'OAuth2 access token for Google Calendar API';
COMMENT ON COLUMN public.profiles.google_calendar_refresh_token IS 'OAuth2 refresh token for Google Calendar API';
COMMENT ON COLUMN public.profiles.google_calendar_token_expires_at IS 'When the access token expires';
COMMENT ON COLUMN public.profiles.google_calendar_sync_enabled IS 'Whether automatic sync is enabled';
COMMENT ON COLUMN public.bookings.google_calendar_event_id IS 'Google Calendar event ID for this booking';
COMMENT ON COLUMN public.bookings.google_calendar_synced_at IS 'When this booking was last synced to Google Calendar';
COMMENT ON COLUMN public.bookings.google_calendar_sync_status IS 'Current sync status of this booking with Google Calendar';

-- Update RLS policies to allow users to manage their own Google Calendar settings
-- Note: RLS is disabled for custom auth, so this policy is not needed

-- Create function to handle Google Calendar sync
CREATE OR REPLACE FUNCTION public.handle_google_calendar_sync()
RETURNS TRIGGER AS $$
BEGIN
    -- Only sync if Google Calendar is enabled and this is a confirmed booking
    IF NEW.status = 'confirmed' AND EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = (SELECT user_id FROM public.event_types WHERE id = NEW.event_type_id)
        AND google_calendar_enabled = true
        AND google_calendar_sync_enabled = true
    ) THEN
        -- Mark booking as pending sync
        NEW.google_calendar_sync_status = 'pending';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for Google Calendar sync
CREATE TRIGGER on_booking_google_calendar_sync
    BEFORE INSERT OR UPDATE ON public.bookings
    FOR EACH ROW EXECUTE FUNCTION public.handle_google_calendar_sync();
