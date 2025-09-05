import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { generateSitemap, fetchAllPublicProfiles } from '../lib/sitemap-generator'

function SitemapPage() {
  const [sitemap, setSitemap] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const generateSitemapContent = async () => {
      try {
        const profiles = await fetchAllPublicProfiles(supabase)
        const sitemapContent = generateSitemap(profiles)
        setSitemap(sitemapContent)
      } catch (error) {
        console.error('Error generating sitemap:', error)
        setSitemap('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>')
      } finally {
        setLoading(false)
      }
    }

    generateSitemapContent()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Generating sitemap...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Sitemap</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            This is the XML sitemap for PastorAgenda. Search engines use this to discover and index our pages.
          </p>
          <pre className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg overflow-x-auto text-sm">
            <code>{sitemap}</code>
          </pre>
        </div>
      </div>
    </div>
  )
}

export default SitemapPage
