import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Helmet } from 'react-helmet-async'
import { supabase } from '../lib/supabase'
import { QRCodeSVG } from 'qrcode.react'
import { Calendar, Clock, User, Share2 } from 'lucide-react'
import type { Profile, EventType } from '../lib/supabase'
import LanguageSwitcher from '../components/LanguageSwitcher'
import { translateDefaultEventTypes } from '../lib/eventTypeTranslations'

function PublicProfilePage() {
  const { alias } = useParams<{ alias: string }>()
  const { t } = useTranslation()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [eventTypes, setEventTypes] = useState<EventType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    
    if (alias) {
      if (!supabase || !supabase.auth) {
        console.error('PublicProfilePage: Supabase client is not properly initialized!')
        if (mounted) {
          setError('Configuration error: Supabase client not initialized.')
          setLoading(false)
        }
        return
      }
      
      fetchProfileData()
    }
    
    return () => {
      mounted = false
    }
  }, [alias]) // Only depend on alias changes

  // Re-translate event types when language changes
  useEffect(() => {
    if (eventTypes.length > 0) {
      const translatedData = translateDefaultEventTypes(eventTypes, t)
      setEventTypes(translatedData)
    }
  }, [t])

  const fetchProfileData = async () => {
    let mounted = true
    
    try {
      setLoading(true)
      setError(null)

      // Fetch profile by alias
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('alias', alias)
        .single()

      if (!mounted) return

      if (profileError) {
        console.error('PublicProfilePage: Profile fetch error:', profileError)
        if (profileError.code === 'PGRST116') {
          setError(t('publicProfile.notFound'))
        } else {
          setError(t('publicProfile.loadError'))
        }
        setLoading(false) // Make sure to set loading to false on error
        return
      }

      if (!profileData) {
        setError(t('publicProfile.notFound'))
        setLoading(false) // Make sure to set loading to false when no data
        return
      }

      setProfile(profileData)

      // Fetch agendas for this pastor
      const { data: eventTypesData, error: eventTypesError } = await supabase
        .from('event_types')
        .select('*')
        .eq('user_id', profileData.id)

      if (!mounted) return

      if (eventTypesError) {
        console.error('PublicProfilePage: Event types fetch error:', eventTypesError)
        // Don't fail the whole request if agendas fail
        setEventTypes([])
      } else {
        // Translate default event types
        const translatedEventTypes = translateDefaultEventTypes(eventTypesData || [], t)
        setEventTypes(translatedEventTypes)
      }

    } catch (error) {
      console.error('PublicProfilePage: Error fetching profile data:', error)
      if (mounted) {
        setError(t('publicProfile.loadError'))
      }
    } finally {
      if (mounted) {
        setLoading(false)
      }
    }
  }

  const shareProfile = async () => {
    const url = window.location.href
    
    if (!profile) return
    
    const isFemale = profile.full_name.toLowerCase().includes('pastora') || 
                    profile.full_name.toLowerCase().includes('reverenda') ||
                    profile.full_name.toLowerCase().includes('pastora')
    
    const shareTitle = `${profile.full_name}'s Agenda - Choose the best time to talk with ${isFemale ? 'her' : 'him'}`
    const shareText = `Schedule appointments with ${profile.full_name}${profile.bio ? ` - ${profile.bio}` : ''}. Book your time with ${isFemale ? 'her' : 'him'} through our easy-to-use scheduling platform.`
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: url
        })
      } catch (error) {
        console.error('Error sharing:', error)
      }
    } else {
      // Fallback to copying to clipboard
      try {
        await navigator.clipboard.writeText(`${shareTitle}\n\n${shareText}\n\n${url}`)
        alert('Profile link copied to clipboard!')
      } catch (error) {
        console.error('Error copying to clipboard:', error)
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300"></p>
        </div>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <User className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t('publicProfile.notFound')}</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            {error || t('publicProfile.notFoundDesc')}
          </p>
          <Link
            to="/"
            className="btn-primary"
          >
            {t('common.goHome')}
          </Link>
        </div>
      </div>
    )
  }

  // Generate SEO-friendly content
  const getPastorTitle = (name: string) => {
    const isFemale = name.toLowerCase().includes('pastora') || 
                    name.toLowerCase().includes('reverenda') ||
                    name.toLowerCase().includes('pastora')
    return isFemale ? `${name}'s Agenda - Choose the best time to talk with her` : `${name}'s Agenda - Choose the best time to talk with him`
  }

  const getPastorDescription = (profile: Profile, eventTypes: EventType[]) => {
    const isFemale = profile.full_name.toLowerCase().includes('pastora') || 
                    profile.full_name.toLowerCase().includes('reverenda') ||
                    profile.full_name.toLowerCase().includes('pastora')
    
    const appointmentText = eventTypes.length > 1 ? 'appointments' : 'appointment'
    const pronoun = isFemale ? 'her' : 'him'
    
    return `Schedule ${appointmentText} with ${profile.full_name}${profile.bio ? ` - ${profile.bio}` : ''}. Book your time with ${pronoun} through our easy-to-use scheduling platform.`
  }

  const getStructuredData = () => {
    if (!profile) return null

    const isFemale = profile.full_name.toLowerCase().includes('pastora') || 
                    profile.full_name.toLowerCase().includes('reverenda') ||
                    profile.full_name.toLowerCase().includes('pastora')

    return {
      "@context": "https://schema.org",
      "@type": "Person",
      "name": profile.full_name,
      "jobTitle": isFemale ? "Pastora" : "Pastor",
      "description": profile.bio || `Schedule appointments with ${profile.full_name}`,
      "image": profile.avatar_url || `${window.location.origin}/default-pastor-avatar.svg`,
      "url": window.location.href,
      "sameAs": [],
      "worksFor": {
        "@type": "Organization",
        "name": "PastorAgenda",
        "url": "https://pastoragenda.com"
      },
      "offers": eventTypes.map(eventType => ({
        "@type": "Offer",
        "name": eventType.title,
        "description": eventType.description,
        "price": "0",
        "priceCurrency": "USD",
        "availability": "https://schema.org/InStock"
      }))
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* SEO Meta Tags */}
      {profile && (
        <Helmet>
          <title>{getPastorTitle(profile.full_name)}</title>
          <meta name="description" content={getPastorDescription(profile, eventTypes)} />
          <meta name="keywords" content={`${profile.full_name}, pastor, appointment, booking, schedule, ministry, counseling, ${eventTypes.map(et => et.title).join(', ')}`} />
          <meta name="author" content={profile.full_name} />
          <link rel="canonical" href={window.location.href} />
          
          {/* Open Graph / Facebook */}
          <meta property="og:type" content="profile" />
          <meta property="og:url" content={window.location.href} />
          <meta property="og:title" content={getPastorTitle(profile.full_name)} />
          <meta property="og:description" content={getPastorDescription(profile, eventTypes)} />
          <meta property="og:image" content={profile.avatar_url || `${window.location.origin}/default-pastor-avatar.svg`} />
          <meta property="og:image:width" content="1200" />
          <meta property="og:image:height" content="630" />
          <meta property="og:image:alt" content={`${profile.full_name} - Pastor Profile`} />
          <meta property="profile:first_name" content={profile.full_name.split(' ')[0]} />
          <meta property="profile:last_name" content={profile.full_name.split(' ').slice(1).join(' ')} />
          
          {/* Twitter */}
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:url" content={window.location.href} />
          <meta name="twitter:title" content={getPastorTitle(profile.full_name)} />
          <meta name="twitter:description" content={getPastorDescription(profile, eventTypes)} />
          <meta name="twitter:image" content={profile.avatar_url || `${window.location.origin}/default-pastor-avatar.svg`} />
          <meta name="twitter:image:alt" content={`${profile.full_name} - Pastor Profile`} />
          
          {/* Additional SEO */}
          <meta name="robots" content="index, follow" />
          <meta name="googlebot" content="index, follow" />
          <meta name="theme-color" content="#0ea5e9" />
          
          {/* Performance hints */}
          <link rel="preload" href={profile.avatar_url || "/default-pastor-avatar.svg"} as="image" />
          <link rel="dns-prefetch" href="//fonts.googleapis.com" />
          <link rel="dns-prefetch" href="//fonts.gstatic.com" />
          
          {/* Structured Data */}
          <script type="application/ld+json">
            {JSON.stringify(getStructuredData())}
          </script>
        </Helmet>
      )}

      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center">
              <img src="/logo.png" alt="PastorAgenda" className="h-16 w-auto" />
            </Link>
            <div className="flex items-center space-x-4">
              <LanguageSwitcher />
              <button
                onClick={shareProfile}
                className="btn-secondary flex items-center"
              >
                <Share2 className="w-4 h-4 mr-2" />
                {t('common.share')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Breadcrumbs */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <nav aria-label="Breadcrumb" className="text-sm text-gray-600 dark:text-gray-400">
          <ol className="flex items-center space-x-2">
            <li><Link to="/" className="hover:text-primary-600">Home</Link></li>
            <li className="flex items-center">
              <span className="mx-2">/</span>
              <span className="text-gray-900 dark:text-white">{profile?.full_name}</span>
            </li>
          </ol>
        </nav>
      </div>

      {/* Profile Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden" itemScope itemType="https://schema.org/Person">
          {/* Profile Header */}
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-8 text-white">
            <div className="flex items-center space-x-6">
              <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center overflow-hidden" style={{ aspectRatio: '1/1' }}>
                {profile.avatar_url ? (
                  <img 
                    src={profile.avatar_url} 
                    alt={`${profile.full_name} - Pastor Profile Picture`}
                    className="w-full h-full object-cover rounded-full"
                    width="96"
                    height="96"
                    loading="eager"
                    decoding="async"
                    fetchPriority="high"
                    style={{ aspectRatio: '1/1' }}
                  />
                ) : (
                  <img 
                    src="/default-pastor-avatar.svg" 
                    alt={`${profile.full_name} - Pastor Profile Picture`}
                    className="w-full h-full object-cover rounded-full"
                    width="96"
                    height="96"
                    loading="eager"
                    decoding="async"
                    fetchPriority="high"
                    style={{ aspectRatio: '1/1' }}
                  />
                )}
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold" itemProp="name">{profile.full_name}</h1>
                {profile.bio && (
                  <p className="text-primary-100 mt-2 text-lg" itemProp="description">{profile.bio}</p>
                )}
              </div>
              <div className="hidden md:block">
                <div className="bg-white/10 rounded-lg p-4 text-center">
                  <QRCodeSVG 
                    value={window.location.href} 
                    size={80}
                    className="mx-auto"
                  />
                  <p className="text-xs text-primary-100 mt-2">{t('publicProfile.qrDescription')}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Agendas */}
          <div className="p-6" itemScope itemType="https://schema.org/Person">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Available Appointments
            </h2>

            {eventTypes.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2">
                {eventTypes.map((eventType) => (
                  <article key={eventType.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-6 hover:border-primary-300 hover:shadow-md transition-all" itemScope itemType="https://schema.org/Offer">
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white" itemProp="name">
                        {eventType.title}
                      </h3>
                      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <Clock className="w-4 h-4 mr-1" aria-hidden="true" />
                        <span itemProp="duration">{eventType.duration} {t('common.min')}</span>
                      </div>
                    </div>
                    
                    {eventType.description && (
                      <p className="text-gray-600 dark:text-gray-300 mb-4" itemProp="description">{eventType.description}</p>
                    )}
                    
                    <Link
                      to={`/${alias}/${eventType.id}`}
                      className="btn-primary w-full text-center"
                      aria-label={`Book ${eventType.title} appointment with ${profile.full_name}`}
                    >
                      <Calendar className="w-4 h-4 mr-2 inline" aria-hidden="true" />
                      Book Appointment
                    </Link>
                  </article>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Calendar className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">{t('publicProfile.noEventTypes')}</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  {t('publicProfile.noEventTypesDesc', { name: profile.full_name })}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Mobile QR Code */}
        <div className="md:hidden mt-6 bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">{t('publicProfile.mobileQrTitle')}</h3>
          <QRCodeSVG 
            value={window.location.href} 
            size={120}
            className="mx-auto"
          />
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{t('publicProfile.mobileQrDescription')}</p>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-800 mt-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <img src="/logo.png" alt="PastorAgenda" className="h-16 w-auto mx-auto mb-2" />
            <p className="text-gray-400">
              {t('home.footer.description')}
            </p>
            <p className="text-gray-500 text-sm mt-4">
              {t('home.footer.copyright')}
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default PublicProfilePage
