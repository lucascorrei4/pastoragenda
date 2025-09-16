// supabase/functions/meta-tag-server/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

// Generic values (no change)
const GENERIC_TITLE = 'PastorAgenda - Schedule with Pastors';
const GENERIC_DESCRIPTION = 'Schedule appointments with pastors and religious leaders through our easy-to-use booking platform.';
const GENERIC_IMAGE = 'https://pastoragenda.com/pwa-512x512.png';

// Placeholders (no change)
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

        // --- ROBUST FILE READING ---
        // Create an unambiguous path to index.html relative to this script file
        const htmlPath = new URL('./index.html', import.meta.url);
        let html = await Deno.readTextFile(htmlPath);

        // Replace placeholders
        html = html.replaceAll(OG_TITLE, title)
                   .replaceAll(OG_DESCRIPTION, description)
                   .replaceAll(OG_IMAGE, imageUrl);

        return new Response(html, {
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
        });

    } catch (error) {
        console.error(error);
        // Fallback with robust file reading
        try {
            const htmlPath = new URL('./index.html', import.meta.url);
            let html = await Deno.readTextFile(htmlPath);
            html = html.replaceAll(OG_TITLE, GENERIC_TITLE)
                       .replaceAll(OG_DESCRIPTION, GENERIC_DESCRIPTION)
                       .replaceAll(OG_IMAGE, GENERIC_IMAGE);
            return new Response(html, {
                headers: { 'Content-Type': 'text/html; charset=utf-8' },
            });
        } catch (e) {
            console.error("CRITICAL: Could not even read fallback HTML.", e);
            return new Response("Something went wrong.", { status: 500 });
        }
    }
});