// supabase/functions/meta-tag-server/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

// Generic values (no change)
const GENERIC_TITLE = 'PastorAgenda - Schedule with Pastors';
const GENERIC_DESCRIPTION = 'Schedule appointments with pastors and religious leaders through our easy-to-use booking platform.';
const GENERIC_IMAGE = 'https://pastoragenda.com/pwa-512x512.png';

// Placeholders (updated to match the new HTML)
const OG_TITLE = 'PastorAgenda - Schedule with Pastors';
const OG_DESCRIPTION = 'Schedule appointments with pastors and religious leaders through our easy-to-use booking platform.';
const OG_IMAGE = 'https://pastoragenda.com/pwa-512x512.png';

// Embedded HTML template
const HTML_TEMPLATE = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>__OG_TITLE__</title>
    <!-- Favicon -->
    <link rel="icon" type="image/x-icon" href="/favicon.ico" />
    <!-- Viewport and basic meta -->
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    <meta name="description" content="__OG_DESCRIPTION__" />
    <meta name="keywords" content="pastor, appointment, booking, schedule, religious, ministry" />
    <meta name="author" content="PastorAgenda" />
    
    <!-- PWA Meta Tags -->
    <meta name="theme-color" content="#0ea5e9" />
    <meta name="msapplication-TileColor" content="#0ea5e9" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <meta name="apple-mobile-web-app-title" content="PastorAgenda" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="application-name" content="PastorAgenda" />
    <meta name="format-detection" content="telephone=no" />
    <meta name="msapplication-tap-highlight" content="no" />
    
    <!-- iOS specific meta tags -->
    <meta name="apple-touch-fullscreen" content="yes" />
    <meta name="apple-mobile-web-app-orientations" content="portrait" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <meta name="apple-touch-startup-image" content="/apple-touch-icon.png" />
    
    <!-- Android specific meta tags -->
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="msapplication-config" content="/browserconfig.xml" />
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website" />
    <meta property="og:url" content="https://pastoragenda.com/" />
    <meta property="og:title" content="__OG_TITLE__" />
    <meta property="og:description" content="__OG_DESCRIPTION__" />
    <meta property="og:image" content="__OG_IMAGE__" />
    <meta property="og:image:width" content="512" />
    <meta property="og:image:height" content="512" />
    <meta property="og:image:alt" content="__OG_TITLE__" />
    <meta property="og:site_name" content="PastorAgenda" />
    <meta property="og:locale" content="en_US" />
    
    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:url" content="https://pastoragenda.com/" />
    <meta name="twitter:title" content="__OG_TITLE__" />
    <meta name="twitter:description" content="__OG_DESCRIPTION__" />
    <meta name="twitter:image" content="__OG_IMAGE__" />
    <meta name="twitter:image:alt" content="__OG_TITLE__" />
    <meta name="twitter:site" content="@pastoragenda" />
    <meta name="twitter:creator" content="@pastoragenda" />
    
    <!-- Icons - Only reference existing files -->
    <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
    <link rel="apple-touch-icon" sizes="152x152" href="/apple-touch-icon-152x152.png" />
    <link rel="apple-touch-icon" sizes="167x167" href="/apple-touch-icon-167x167.png" />
    <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon-180x180.png" />
    
    <!-- PWA Icons -->
    <link rel="icon" type="image/png" sizes="192x192" href="/pwa-192x192.png" />
    <link rel="icon" type="image/png" sizes="512x512" href="__OG_IMAGE__" />
    
    <!-- Manifest -->
    <link rel="manifest" href="/manifest.json" />
    
    <!-- Preconnect to external domains -->
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    
    <!-- Additional SEO -->
    <link rel="canonical" href="https://pastoragenda.com/" />
    <meta name="robots" content="index, follow" />
    <meta name="googlebot" content="index, follow" />
    <meta name="bingbot" content="index, follow" />
    
    <!-- Structured Data for Organization -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "PastorAgenda",
      "url": "https://pastoragenda.com",
      "logo": "https://pastoragenda.com/logo.png",
      "description": "__OG_DESCRIPTION__",
      "sameAs": [
        "https://twitter.com/pastoragenda",
        "https://facebook.com/pastoragenda"
      ],
      "contactPoint": {
        "@type": "ContactPoint",
        "contactType": "customer service",
        "email": "support@pastoragenda.com"
      }
    }
    </script>
    
    
    <script type="module" crossorigin src="/assets/index-DQ57i0Sv.js"></script>
    <link rel="stylesheet" crossorigin href="/assets/index-w1pixyB6.css">
  <link rel="manifest" href="/manifest.json"><script id="vite-plugin-pwa:register-sw" src="/registerSW.js"></script></head>
  <body>
    <div id="root"></div>

    
    <!-- PWA pa Prompt -->
    <div id="pwa-install-prompt" style="display: none;">
      <div class="pwa-prompt">
        <p>Install PastorAgenda for a better experience</p>
        <button id="pwa-install-btn">Install</button>
        <button id="pwa-dismiss-btn">Not now</button>
      </div>
    </div>
  </body>
</html>`;

serve(async (req) => {
    let title = GENERIC_TITLE;
    let description = GENERIC_DESCRIPTION;
    let imageUrl = GENERIC_IMAGE;

    try {
        const url = new URL(req.url);
        const path = url.pathname;

        // Read the actual built index.html file
        let html = '';
        try {
            const htmlPath = new URL('./index.html', import.meta.url);
            html = await Deno.readTextFile(htmlPath);
        } catch (error) {
            console.log('Could not read index.html, using embedded template:', error.message);
            html = HTML_TEMPLATE;
        }

        // Handle specific public routes that don't need a DB query
        switch (path) {
            case '/privacy-policy':
                title = 'Privacy Policy';
                description = 'Read the privacy policy for PastorAgenda.';
                // imageUrl stays generic
                break;
            case '/support':
                title = 'Support & Help';
                description = 'Contact our support team for help and assistance.';
                // imageUrl stays generic
                break;
            default:
                // Handle dynamic routes with a Supabase query
                const pathParts = path.split('/').filter(part => part);
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
                    } else {
                        // If no profile found for the alias, return a 404
                        return new Response('Not Found', { status: 404, headers: { 'Content-Type': 'text/plain' } });
                    }
                }
                break;
        }

        // Replace placeholders using global regex for better compatibility
        html = html.replace(new RegExp(OG_TITLE.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), title)
                  .replace(new RegExp(OG_DESCRIPTION.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), description)
                  .replace(new RegExp(OG_IMAGE.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), imageUrl);

        return new Response(html, {
            headers: { 
                'Content-Type': 'text/html; charset=utf-8',
                'Cache-Control': 'public, max-age=300' // Cache for 5 minutes
            },
        });

    } catch (error) {
        console.error(error);
        // Fallback - try to read index.html, otherwise use embedded template
        try {
            let html = '';
            try {
                const htmlPath = new URL('./index.html', import.meta.url);
                html = await Deno.readTextFile(htmlPath);
            } catch (error) {
                console.log('Fallback: Could not read index.html, using embedded template:', error.message);
                html = HTML_TEMPLATE;
            }
            
            html = html.replace(new RegExp(OG_TITLE.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), GENERIC_TITLE)
                       .replace(new RegExp(OG_DESCRIPTION.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), GENERIC_DESCRIPTION)
                       .replace(new RegExp(OG_IMAGE.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), GENERIC_IMAGE);
            return new Response(html, {
                headers: { 
                    'Content-Type': 'text/html; charset=utf-8',
                    'Cache-Control': 'public, max-age=300'
                },
            });
        } catch (e) {
            console.error("CRITICAL: Could not process fallback HTML.", e);
            return new Response("Something went wrong.", { status: 500 });
        }
    }
});
