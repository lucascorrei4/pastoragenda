-- Add custom questions field to event_types table
ALTER TABLE public.event_types 
ADD COLUMN IF NOT EXISTS custom_questions JSONB DEFAULT '[]'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN public.event_types.custom_questions IS 'Array of custom questions for users to answer when booking this event type';
