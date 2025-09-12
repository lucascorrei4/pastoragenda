-- Add time-limited sharing fields to pastor_sharing_settings table
ALTER TABLE public.pastor_sharing_settings 
ADD COLUMN IF NOT EXISTS sharing_token TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS token_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS sharing_type TEXT DEFAULT 'public' CHECK (sharing_type IN ('public', 'time_limited')),
ADD COLUMN IF NOT EXISTS anonymous_id TEXT UNIQUE;

-- Create index for token lookups
CREATE INDEX IF NOT EXISTS idx_pastor_sharing_settings_token ON public.pastor_sharing_settings(sharing_token);
CREATE INDEX IF NOT EXISTS idx_pastor_sharing_settings_expires ON public.pastor_sharing_settings(token_expires_at);
CREATE INDEX IF NOT EXISTS idx_pastor_sharing_settings_anonymous ON public.pastor_sharing_settings(anonymous_id);

-- Add comment explaining the new fields
COMMENT ON COLUMN public.pastor_sharing_settings.sharing_token IS 'Unique token for time-limited sharing (e.g., abc123def456)';
COMMENT ON COLUMN public.pastor_sharing_settings.token_expires_at IS 'When the sharing token expires (NULL for permanent public access)';
COMMENT ON COLUMN public.pastor_sharing_settings.sharing_type IS 'Type of sharing: public (permanent) or time_limited (with expiration)';
COMMENT ON COLUMN public.pastor_sharing_settings.anonymous_id IS 'Anonymous ID for anonymous sharing (e.g., anon-abc123)';
