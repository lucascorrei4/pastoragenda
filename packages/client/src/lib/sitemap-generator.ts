// Sitemap generation utility for SEO
export interface SitemapUrl {
  loc: string
  lastmod: string
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'
  priority: number
}

export interface PastorProfile {
  alias: string
  full_name: string
  updated_at: string
  event_types: Array<{
    id: string
    title: string
    updated_at: string
  }>
}

export function generateSitemap(profiles: PastorProfile[], baseUrl: string = 'https://pastoragenda.com'): string {
  const urls: SitemapUrl[] = [
    // Home page
    {
      loc: baseUrl,
      lastmod: new Date().toISOString().split('T')[0],
      changefreq: 'daily',
      priority: 1.0
    },
    // Auth page
    {
      loc: `${baseUrl}/auth`,
      lastmod: new Date().toISOString().split('T')[0],
      changefreq: 'monthly',
      priority: 0.3
    }
  ]

  // Add pastor profiles
  profiles.forEach(profile => {
    // Main profile page
    urls.push({
      loc: `${baseUrl}/${profile.alias}`,
      lastmod: profile.updated_at.split('T')[0],
      changefreq: 'weekly',
      priority: 0.8
    })

    // Individual event type pages
    profile.event_types.forEach(eventType => {
      urls.push({
        loc: `${baseUrl}/${profile.alias}/${eventType.id}`,
        lastmod: eventType.updated_at.split('T')[0],
        changefreq: 'weekly',
        priority: 0.6
      })
    })
  })

  // Generate XML sitemap
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(url => `  <url>
    <loc>${url.loc}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`).join('\n')}
</urlset>`

  return sitemap
}

export function generateRobotsTxt(baseUrl: string = 'https://pastoragenda.com'): string {
  return `User-agent: *
Allow: /

# Sitemap
Sitemap: ${baseUrl}/sitemap.xml

# Disallow admin areas
Disallow: /dashboard/
Disallow: /api/
Disallow: /_next/
Disallow: /static/
`
}

// Function to fetch all public profiles for sitemap generation
export async function fetchAllPublicProfiles(supabase: any): Promise<PastorProfile[]> {
  try {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select(`
        alias,
        full_name,
        updated_at,
        event_types (
          id,
          title,
          updated_at
        )
      `)
      .not('alias', 'is', null)
      .not('full_name', 'is', null)

    if (error) {
      console.error('Error fetching profiles for sitemap:', error)
      return []
    }

    return profiles || []
  } catch (error) {
    console.error('Error in fetchAllPublicProfiles:', error)
    return []
  }
}
