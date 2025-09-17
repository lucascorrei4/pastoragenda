-- Enable the http extension for database triggers
-- This is required for the on-booking-created trigger to work

CREATE EXTENSION IF NOT EXISTS http;
