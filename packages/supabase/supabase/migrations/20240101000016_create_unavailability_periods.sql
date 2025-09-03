-- Create unavailability_periods table for blocking appointments during conferences, vacations, etc.
CREATE TABLE IF NOT EXISTS public.unavailability_periods (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    start_time TIME DEFAULT '00:00:00',
    end_time TIME DEFAULT '23:59:59',
    is_all_day BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure end_date is not before start_date
    CONSTRAINT check_date_range CHECK (end_date >= start_date),
    
    -- Ensure end_time is not before start_time when not all day
    CONSTRAINT check_time_range CHECK (
        is_all_day = true OR 
        (is_all_day = false AND end_time >= start_time)
    )
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_unavailability_periods_user_id ON public.unavailability_periods(user_id);
CREATE INDEX IF NOT EXISTS idx_unavailability_periods_dates ON public.unavailability_periods(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_unavailability_periods_end_date ON public.unavailability_periods(end_date);

-- Enable Row Level Security
ALTER TABLE public.unavailability_periods ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own unavailability periods" ON public.unavailability_periods
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert their own unavailability periods" ON public.unavailability_periods
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own unavailability periods" ON public.unavailability_periods
    FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete their own unavailability periods" ON public.unavailability_periods
    FOR DELETE USING (auth.uid()::text = user_id::text);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_unavailability_periods_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER trigger_update_unavailability_periods_updated_at
    BEFORE UPDATE ON public.unavailability_periods
    FOR EACH ROW
    EXECUTE FUNCTION update_unavailability_periods_updated_at();

-- Add comment for documentation
COMMENT ON TABLE public.unavailability_periods IS 'Stores periods when pastors are unavailable for appointments (conferences, vacations, etc.)';
COMMENT ON COLUMN public.unavailability_periods.title IS 'Title of the unavailability period (e.g., "Annual Conference")';
COMMENT ON COLUMN public.unavailability_periods.description IS 'Optional description of why the pastor is unavailable';
COMMENT ON COLUMN public.unavailability_periods.start_date IS 'Start date of unavailability period';
COMMENT ON COLUMN public.unavailability_periods.end_date IS 'End date of unavailability period';
COMMENT ON COLUMN public.unavailability_periods.start_time IS 'Start time of unavailability (for partial day blocks)';
COMMENT ON COLUMN public.unavailability_periods.end_time IS 'End time of unavailability (for partial day blocks)';
COMMENT ON COLUMN public.unavailability_periods.is_all_day IS 'Whether the unavailability blocks the entire day or just specific hours';
