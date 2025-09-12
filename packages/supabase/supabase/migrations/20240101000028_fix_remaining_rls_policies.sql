-- Fix remaining RLS policies to work with custom authentication
-- Since this project uses custom JWT authentication instead of Supabase Auth,
-- we need to either disable RLS or create policies that work with the custom system

-- Disable RLS for profiles table (public access needed for public profile pages)
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Drop the existing policies that don't work with custom auth
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Public can view profiles by alias" ON public.profiles;

-- Disable RLS for event_types table (public access needed for public agenda pages)
ALTER TABLE public.event_types DISABLE ROW LEVEL SECURITY;

-- Drop the existing policies that don't work with custom auth
DROP POLICY IF EXISTS "Users can manage own agendas" ON public.event_types;
DROP POLICY IF EXISTS "Public can view agendas" ON public.event_types;

-- Disable RLS for bookings table (public access needed for public agenda pages)
ALTER TABLE public.bookings DISABLE ROW LEVEL SECURITY;

-- Drop the existing policies that don't work with custom auth
DROP POLICY IF EXISTS "Users can view bookings for their events" ON public.bookings;
DROP POLICY IF EXISTS "Users can update bookings for their events" ON public.bookings;
DROP POLICY IF EXISTS "Public can create bookings" ON public.bookings;
DROP POLICY IF EXISTS "Public can view own bookings" ON public.bookings;

-- Add comments explaining the decision
COMMENT ON TABLE public.profiles IS 'User profiles. RLS disabled because this project uses custom JWT authentication handled at the application level.';
COMMENT ON TABLE public.event_types IS 'Event types/agendas. RLS disabled because this project uses custom JWT authentication handled at the application level.';
COMMENT ON TABLE public.bookings IS 'Appointment bookings. RLS disabled because this project uses custom JWT authentication handled at the application level.';
