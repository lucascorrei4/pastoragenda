-- Fix availability_rules format for existing event types
-- This migration fixes any event types that have 'start'/'end' instead of 'from'/'to'

-- Simple approach: Update each day individually using a safer method
UPDATE public.event_types 
SET availability_rules = jsonb_set(
  availability_rules, 
  '{monday}', 
  COALESCE(
    (SELECT jsonb_agg(jsonb_build_object('from', slot->>'start', 'to', slot->>'end'))
     FROM jsonb_array_elements(availability_rules->'monday') AS slot
     WHERE slot ? 'start' AND slot ? 'end'),
    availability_rules->'monday'
  )
)
WHERE availability_rules ? 'monday' 
  AND jsonb_typeof(availability_rules->'monday') = 'array'
  AND EXISTS (
    SELECT 1 FROM jsonb_array_elements(availability_rules->'monday') AS slot
    WHERE slot ? 'start' AND slot ? 'end'
  );

UPDATE public.event_types 
SET availability_rules = jsonb_set(
  availability_rules, 
  '{tuesday}', 
  COALESCE(
    (SELECT jsonb_agg(jsonb_build_object('from', slot->>'start', 'to', slot->>'end'))
     FROM jsonb_array_elements(availability_rules->'tuesday') AS slot
     WHERE slot ? 'start' AND slot ? 'end'),
    availability_rules->'tuesday'
  )
)
WHERE availability_rules ? 'tuesday' 
  AND jsonb_typeof(availability_rules->'tuesday') = 'array'
  AND EXISTS (
    SELECT 1 FROM jsonb_array_elements(availability_rules->'tuesday') AS slot
    WHERE slot ? 'start' AND slot ? 'end'
  );

UPDATE public.event_types 
SET availability_rules = jsonb_set(
  availability_rules, 
  '{wednesday}', 
  COALESCE(
    (SELECT jsonb_agg(jsonb_build_object('from', slot->>'start', 'to', slot->>'end'))
     FROM jsonb_array_elements(availability_rules->'wednesday') AS slot
     WHERE slot ? 'start' AND slot ? 'end'),
    availability_rules->'wednesday'
  )
)
WHERE availability_rules ? 'wednesday' 
  AND jsonb_typeof(availability_rules->'wednesday') = 'array'
  AND EXISTS (
    SELECT 1 FROM jsonb_array_elements(availability_rules->'wednesday') AS slot
    WHERE slot ? 'start' AND slot ? 'end'
  );

UPDATE public.event_types 
SET availability_rules = jsonb_set(
  availability_rules, 
  '{thursday}', 
  COALESCE(
    (SELECT jsonb_agg(jsonb_build_object('from', slot->>'start', 'to', slot->>'end'))
     FROM jsonb_array_elements(availability_rules->'thursday') AS slot
     WHERE slot ? 'start' AND slot ? 'end'),
    availability_rules->'thursday'
  )
)
WHERE availability_rules ? 'thursday' 
  AND jsonb_typeof(availability_rules->'thursday') = 'array'
  AND EXISTS (
    SELECT 1 FROM jsonb_array_elements(availability_rules->'thursday') AS slot
    WHERE slot ? 'start' AND slot ? 'end'
  );

UPDATE public.event_types 
SET availability_rules = jsonb_set(
  availability_rules, 
  '{friday}', 
  COALESCE(
    (SELECT jsonb_agg(jsonb_build_object('from', slot->>'start', 'to', slot->>'end'))
     FROM jsonb_array_elements(availability_rules->'friday') AS slot
     WHERE slot ? 'start' AND slot ? 'end'),
    availability_rules->'friday'
  )
)
WHERE availability_rules ? 'friday' 
  AND jsonb_typeof(availability_rules->'friday') = 'array'
  AND EXISTS (
    SELECT 1 FROM jsonb_array_elements(availability_rules->'friday') AS slot
    WHERE slot ? 'start' AND slot ? 'end'
  );

UPDATE public.event_types 
SET availability_rules = jsonb_set(
  availability_rules, 
  '{saturday}', 
  COALESCE(
    (SELECT jsonb_agg(jsonb_build_object('from', slot->>'start', 'to', slot->>'end'))
     FROM jsonb_array_elements(availability_rules->'saturday') AS slot
     WHERE slot ? 'start' AND slot ? 'end'),
    availability_rules->'saturday'
  )
)
WHERE availability_rules ? 'saturday' 
  AND jsonb_typeof(availability_rules->'saturday') = 'array'
  AND EXISTS (
    SELECT 1 FROM jsonb_array_elements(availability_rules->'saturday') AS slot
    WHERE slot ? 'start' AND slot ? 'end'
  );

UPDATE public.event_types 
SET availability_rules = jsonb_set(
  availability_rules, 
  '{sunday}', 
  COALESCE(
    (SELECT jsonb_agg(jsonb_build_object('from', slot->>'start', 'to', slot->>'end'))
     FROM jsonb_array_elements(availability_rules->'sunday') AS slot
     WHERE slot ? 'start' AND slot ? 'end'),
    availability_rules->'sunday'
  )
)
WHERE availability_rules ? 'sunday' 
  AND jsonb_typeof(availability_rules->'sunday') = 'array'
  AND EXISTS (
    SELECT 1 FROM jsonb_array_elements(availability_rules->'sunday') AS slot
    WHERE slot ? 'start' AND slot ? 'end'
  );

-- Add comment for documentation
COMMENT ON COLUMN public.event_types.availability_rules IS 'JSON object with day names as keys and arrays of time slots with from/to properties in HH:MM format';