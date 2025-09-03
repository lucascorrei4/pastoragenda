-- Update existing default event types to use translation keys
-- This migration updates the hardcoded English titles and descriptions to use translation keys

UPDATE public.event_types 
SET 
  title = 'defaultEventTypes.pastoralCounseling.title',
  description = 'defaultEventTypes.pastoralCounseling.description'
WHERE title = 'Pastoral Counseling' 
  AND description = 'One-on-one pastoral counseling session'
  AND duration = 60;

UPDATE public.event_types 
SET 
  title = 'defaultEventTypes.prayerMeeting.title',
  description = 'defaultEventTypes.prayerMeeting.description'
WHERE title = 'Prayer Meeting' 
  AND description = 'Personal prayer and spiritual guidance'
  AND duration = 30;

UPDATE public.event_types 
SET 
  title = 'defaultEventTypes.ministryMeeting.title',
  description = 'defaultEventTypes.ministryMeeting.description'
WHERE title = 'Ministry Meeting' 
  AND description = 'Ministry planning and discussion'
  AND duration = 45;

-- Add comment for documentation
COMMENT ON TABLE public.event_types IS 'Event types table with localized default event types using translation keys';
