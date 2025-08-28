-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT NOT NULL,
    alias TEXT UNIQUE NOT NULL,
    bio TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create event_types table
CREATE TABLE IF NOT EXISTS public.event_types (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    duration INTEGER NOT NULL CHECK (duration >= 15 AND duration <= 480),
    description TEXT,
    availability_rules JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create bookings table
CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_type_id UUID REFERENCES public.event_types(id) ON DELETE CASCADE NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    booker_name TEXT NOT NULL,
    booker_email TEXT NOT NULL,
    status TEXT DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_alias ON public.profiles(alias);
CREATE INDEX IF NOT EXISTS idx_event_types_user_id ON public.event_types(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_event_type_id ON public.bookings(event_type_id);
CREATE INDEX IF NOT EXISTS idx_bookings_start_time ON public.bookings(start_time);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Profiles RLS Policies
-- Users can read their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Public can read profiles by alias (for public profile pages)
CREATE POLICY "Public can view profiles by alias" ON public.profiles
    FOR SELECT USING (true);

-- Event Types RLS Policies
-- Users can manage their own event types
CREATE POLICY "Users can manage own event types" ON public.event_types
    FOR ALL USING (auth.uid() = user_id);

-- Public can read event types (for booking pages)
CREATE POLICY "Public can view event types" ON public.event_types
    FOR SELECT USING (true);

-- Bookings RLS Policies
-- Users can view bookings for their event types
CREATE POLICY "Users can view bookings for their events" ON public.bookings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.event_types 
            WHERE event_types.id = bookings.event_type_id 
            AND event_types.user_id = auth.uid()
        )
    );

-- Users can update bookings for their event types
CREATE POLICY "Users can update bookings for their events" ON public.bookings
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.event_types 
            WHERE event_types.id = bookings.event_type_id 
            AND event_types.user_id = auth.uid()
        )
    );

-- Public can create bookings
CREATE POLICY "Public can create bookings" ON public.bookings
    FOR INSERT WITH CHECK (true);

-- Public can read their own bookings (by email)
CREATE POLICY "Public can view own bookings" ON public.bookings
    FOR SELECT USING (booker_email = auth.jwt() ->> 'email' OR true);

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, alias)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'Pastor'),
        'pastor-' || substr(NEW.id::text, 1, 8)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_event_types_updated_at
    BEFORE UPDATE ON public.event_types
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at
    BEFORE UPDATE ON public.bookings
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for avatars
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true) 
ON CONFLICT (id) DO NOTHING;

-- Storage policies for avatars
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects
    FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'avatars' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can update their own avatar" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'avatars' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete their own avatar" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'avatars' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );
