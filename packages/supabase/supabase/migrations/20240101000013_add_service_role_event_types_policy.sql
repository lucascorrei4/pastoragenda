-- Add service role policy for event_types table to allow default event type creation
-- This allows the service role (used in auth-verify-otp function) to insert default event types for new users

-- Drop existing policy if it exists to avoid conflicts
DROP POLICY IF EXISTS "Service role can manage event types" ON public.event_types;

-- Create service role policy for event_types
CREATE POLICY "Service role can manage event types" ON public.event_types
    FOR ALL USING (auth.role() = 'service_role');

-- Add comment for documentation
COMMENT ON POLICY "Service role can manage event types" ON public.event_types IS 'Allows service role to create default event types for new users during registration';
