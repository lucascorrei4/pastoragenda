// supabase/functions/meta-tag-server/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
// Generic default values for your homepage
const GENERIC_TITLE = 'PastorAgenda - Schedule with Pastors';
const GENERIC_DESCRIPTION = 'Schedule appointments with pastors and religious leaders through our easy-to-use booking platform';
const GENERIC_IMAGE = 'https://pastoragenda.com/pwa-512x512.png' // Your main logo or a generic image
;
// Placeholders in your index.html
const OG_TITLE = '__OG_TITLE__';
const OG_DESCRIPTION = '__OG_DESCRIPTION__';
const OG_IMAGE = '__OG_IMAGE__';
serve(async (req)=>{
  let title = GENERIC_TITLE;
  let description = GENERIC_DESCRIPTION;
  let imageUrl = GENERIC_IMAGE;
  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter((part)=>part);
    const alias = pathParts[0];
    // --- Check if an alias exists in the URL ---
    if (alias) {
      // --- Handle Pastor Page (Dynamic Tags) ---
      const supabaseClient = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_ANON_KEY') ?? '');
      const { data: profile } = await supabaseClient.from('profiles').select('full_name, bio, avatar_url').eq('alias', alias).single();
      // If we found a profile, update the tags
      if (profile) {
        title = `${profile.full_name}'s Agenda on PastorAgenda`;
        description = profile.bio || `Schedule appointments with ${profile.full_name}.`;
        imageUrl = profile.avatar_url || GENERIC_IMAGE;
      }
    }
    // --- If no alias, it will just use the generic tags defined above ---
    // Fetch the original index.html from your live site
    const htmlResponse = await fetch('https://pastoragenda.com/index.html');
    let html = await htmlResponse.text();
    // Replace the placeholder meta tags with either the dynamic or generic data
    html = html.replaceAll(OG_TITLE, title).replaceAll(OG_DESCRIPTION, description).replaceAll(OG_IMAGE, imageUrl);
    return new Response(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8'
      }
    });
  } catch (error) {
    console.error(error);
    // If anything fails, it's safest to just redirect to the homepage
    return Response.redirect('https://pastoragenda.com', 307);
  }
});
