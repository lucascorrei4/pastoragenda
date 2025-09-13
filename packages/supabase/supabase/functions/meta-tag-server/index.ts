// supabase/functions/meta-tag-server/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

// Generic default values (no changes here)
const GENERIC_TITLE = 'PastorAgenda - Schedule with Pastors';
const GENERIC_DESCRIPTION = 'Schedule appointments with pastors and religious leaders through our easy-to-use booking platform.';
const GENERIC_IMAGE = 'https://pastoragenda.com/pwa-512x512.png';

// Placeholders (no changes here)
const OG_TITLE = '__OG_TITLE__';
const OG_DESCRIPTION = '__OG_DESCRIPTION__';
const OG_IMAGE = '__OG_IMAGE__';

serve(async (req) => {
    let title = GENERIC_TITLE;
    let description = GENERIC_DESCRIPTION;
    let imageUrl = GENERIC_IMAGE;

    try {
        const url = new URL(req.url);
        const pathParts = url.pathname.split('/').filter((part) => part);
        const alias = pathParts[0];

        // --- Handle Pastor Page (Dynamic Tags) ---
        if (alias) {
            const supabaseClient = createClient(
                Deno.env.get('SUPABASE_URL') ?? '',
                Deno.env.get('SUPABASE_ANON_KEY') ?? ''
            );
            const { data: profile } = await supabaseClient
                .from('profiles')
                .select('full_name, bio, avatar_url')
                .eq('alias', alias)
                .single();

            if (profile) {
                title = `${profile.full_name}'s Agenda on PastorAgenda`;
                description = profile.bio || `Schedule appointments with ${profile.full_name}.`;
                imageUrl = profile.avatar_url || GENERIC_IMAGE;
            }
        }

        // --- FIX IS HERE ---
        // Read the local index.html file instead of fetching it from the live site
        let html = await Deno.readTextFile('./index.html');

        // Replace the placeholder meta tags
        html = html.replaceAll(OG_TITLE, title)
                   .replaceAll(OG_DESCRIPTION, description)
                   .replaceAll(OG_IMAGE, imageUrl);

        return new Response(html, {
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
        });

    } catch (error) {
        console.error(error);
        // Fallback: Read the local file and serve it with generic tags
        try {
            let html = await Deno.readTextFile('./index.html');
            html = html.replaceAll(OG_TITLE, GENERIC_TITLE)
                       .replaceAll(OG_DESCRIPTION, GENERIC_DESCRIPTION)
                       .replaceAll(OG_IMAGE, GENERIC_IMAGE);
            return new Response(html, {
                headers: { 'Content-Type': 'text/html; charset=utf-8' },
            });
        } catch (e) {
            // Absolute fallback if reading the file fails
            return new Response("Something went wrong.", { status: 500 });
        }
    }
});