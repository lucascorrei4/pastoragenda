-- Create pastor_sharing_settings table
CREATE TABLE IF NOT EXISTS public.pastor_sharing_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    pastor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    is_public_enabled BOOLEAN DEFAULT false,
    public_slug TEXT UNIQUE, -- Custom slug for public URL (e.g., "pastor-john-agenda")
    allow_booking_view BOOLEAN DEFAULT true, -- Allow viewing of bookings
    allow_event_types_view BOOLEAN DEFAULT false, -- Allow viewing of event types
    show_pastor_name BOOLEAN DEFAULT true,
    show_pastor_contact BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create master_pastor_follows table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS public.master_pastor_follows (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    master_pastor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    followed_pastor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    invitation_status TEXT DEFAULT 'pending' CHECK (invitation_status IN ('pending', 'accepted', 'declined', 'revoked')),
    invited_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL, -- Who sent the invitation
    invitation_token TEXT UNIQUE, -- Token for invitation acceptance
    invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    responded_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(master_pastor_id, followed_pastor_id)
);

-- Create pastor_invitations table for tracking invitations
CREATE TABLE IF NOT EXISTS public.pastor_invitations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    from_pastor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    to_email TEXT NOT NULL,
    invitation_token TEXT UNIQUE NOT NULL,
    invitation_type TEXT DEFAULT 'master_pastor' CHECK (invitation_type IN ('master_pastor', 'viewer')),
    permissions JSONB DEFAULT '{"view_bookings": true, "view_event_types": false, "view_contact": false}',
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
    accepted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_pastor_sharing_settings_pastor_id ON public.pastor_sharing_settings(pastor_id);
CREATE INDEX IF NOT EXISTS idx_pastor_sharing_settings_public_slug ON public.pastor_sharing_settings(public_slug);
CREATE INDEX IF NOT EXISTS idx_master_pastor_follows_master_id ON public.master_pastor_follows(master_pastor_id);
CREATE INDEX IF NOT EXISTS idx_master_pastor_follows_followed_id ON public.master_pastor_follows(followed_pastor_id);
CREATE INDEX IF NOT EXISTS idx_master_pastor_follows_status ON public.master_pastor_follows(invitation_status);
CREATE INDEX IF NOT EXISTS idx_pastor_invitations_token ON public.pastor_invitations(invitation_token);
CREATE INDEX IF NOT EXISTS idx_pastor_invitations_email ON public.pastor_invitations(to_email);
CREATE INDEX IF NOT EXISTS idx_pastor_invitations_status ON public.pastor_invitations(status);

-- Enable Row Level Security
ALTER TABLE public.pastor_sharing_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_pastor_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pastor_invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for pastor_sharing_settings
CREATE POLICY "Users can view their own sharing settings" ON public.pastor_sharing_settings
    FOR SELECT USING (auth.uid() = pastor_id);

CREATE POLICY "Users can update their own sharing settings" ON public.pastor_sharing_settings
    FOR UPDATE USING (auth.uid() = pastor_id);

CREATE POLICY "Users can insert their own sharing settings" ON public.pastor_sharing_settings
    FOR INSERT WITH CHECK (auth.uid() = pastor_id);

CREATE POLICY "Public sharing settings are viewable by anyone" ON public.pastor_sharing_settings
    FOR SELECT USING (is_public_enabled = true);

-- RLS Policies for master_pastor_follows
CREATE POLICY "Users can view follows they are involved in" ON public.master_pastor_follows
    FOR SELECT USING (auth.uid() = master_pastor_id OR auth.uid() = followed_pastor_id);

CREATE POLICY "Users can create follows as master pastor" ON public.master_pastor_follows
    FOR INSERT WITH CHECK (auth.uid() = master_pastor_id);

CREATE POLICY "Followed pastors can update invitation status" ON public.master_pastor_follows
    FOR UPDATE USING (auth.uid() = followed_pastor_id);

CREATE POLICY "Either party can delete the follow" ON public.master_pastor_follows
    FOR DELETE USING (auth.uid() = master_pastor_id OR auth.uid() = followed_pastor_id);

-- RLS Policies for pastor_invitations
CREATE POLICY "Users can view invitations they sent or received" ON public.pastor_invitations
    FOR SELECT USING (auth.uid() = from_pastor_id OR to_email = (SELECT email FROM auth.users WHERE id = auth.uid()));

CREATE POLICY "Users can create invitations" ON public.pastor_invitations
    FOR INSERT WITH CHECK (auth.uid() = from_pastor_id);

CREATE POLICY "Invited users can update invitation status" ON public.pastor_invitations
    FOR UPDATE USING (to_email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- Function to generate unique public slug
CREATE OR REPLACE FUNCTION generate_public_slug(pastor_alias TEXT)
RETURNS TEXT AS $$
DECLARE
    base_slug TEXT;
    final_slug TEXT;
    counter INTEGER := 0;
BEGIN
    base_slug := lower(replace(pastor_alias, ' ', '-'));
    final_slug := base_slug || '-agenda';
    
    -- Check if slug exists and make it unique
    WHILE EXISTS (SELECT 1 FROM public.pastor_sharing_settings WHERE public_slug = final_slug) LOOP
        counter := counter + 1;
        final_slug := base_slug || '-agenda-' || counter;
    END LOOP;
    
    RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- Function to create default sharing settings for new pastors
CREATE OR REPLACE FUNCTION create_default_sharing_settings()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.pastor_sharing_settings (pastor_id, public_slug)
    VALUES (NEW.id, generate_public_slug(NEW.alias));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create default sharing settings when a new profile is created
CREATE TRIGGER create_default_sharing_settings_trigger
    AFTER INSERT ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION create_default_sharing_settings();

-- Add comments for documentation
COMMENT ON TABLE public.pastor_sharing_settings IS 'Settings for sharing pastor agendas publicly';
COMMENT ON TABLE public.master_pastor_follows IS 'Many-to-many relationship between master pastors and pastors they follow';
COMMENT ON TABLE public.pastor_invitations IS 'Invitations sent by pastors to master pastors or other viewers';
COMMENT ON COLUMN public.pastor_sharing_settings.public_slug IS 'Custom slug for public agenda URL (e.g., /agenda/pastor-john-agenda)';
COMMENT ON COLUMN public.master_pastor_follows.invitation_status IS 'Status of the follow relationship invitation';
COMMENT ON COLUMN public.pastor_invitations.permissions IS 'JSON object defining what the invited user can view';
