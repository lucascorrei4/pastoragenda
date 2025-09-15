import { useState, useEffect } from 'react'
import { useParams, Link, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Helmet } from 'react-helmet-async'
import { supabase } from '../lib/supabase'
import { QRCodeSVG } from 'qrcode.react'
import { Calendar, Clock, User, Share2, QrCode, X } from 'lucide-react'
import type { Profile, EventType, PastorSharingSettings } from '../lib/supabase'
import LanguageSwitcher from '../components/LanguageSwitcher'
import { translateDefaultEventTypes } from '../lib/eventTypeTranslations'

interface PublicProfilePageProps {
  alias?: string
  pastorId?: string
  isPreview?: boolean
}

function PublicProfilePage({ alias: propAlias, pastorId, isPreview = false }: PublicProfilePageProps = {}) {
  const { alias: urlAlias } = useParams<{ alias: string }>()
  const [searchParams] = useSearchParams()
  const { t, i18n } = useTranslation()
  
  // Use prop alias first, then fall back to URL alias
  const alias = propAlias || urlAlias
  const token = searchParams.get('token')
  const [profile, setProfile] = useState<Profile | null>(null)
  const [eventTypes, setEventTypes] = useState<EventType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeRemaining, setTimeRemaining] = useState<string | null>(null)
  const [sharingSettings, setSharingSettings] = useState<PastorSharingSettings | null>(null)
  const [showQRModal, setShowQRModal] = useState(false)

  useEffect(() => {
    let mounted = true
    
    if (alias || pastorId) {
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
  }, [alias, pastorId]) // Depend on both alias and pastorId changes

  // Re-translate event types when language changes
  useEffect(() => {
    if (eventTypes.length > 0) {
      const translatedData = translateDefaultEventTypes(eventTypes, t)
      setEventTypes(translatedData)
    }
  }, [t, i18n.language])

  // Timer for time-limited links
  useEffect(() => {
    if (!sharingSettings?.token_expires_at) return

    const updateTimeRemaining = () => {
      const expiresAt = new Date(sharingSettings.token_expires_at!)
      const now = new Date()
      const diff = expiresAt.getTime() - now.getTime()

      if (diff <= 0) {
        setTimeRemaining('Expired')
        // Redirect to home page instead of reloading to avoid service worker issues
        setTimeout(() => {
          window.location.href = '/'
        }, 2000) // Wait 2 seconds to show "Expired" message
        return
      }

      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

                if (hours > 0) {
                  setTimeRemaining(`${hours}h ${minutes}m`)
                } else if (minutes > 0) {
                  setTimeRemaining(`${minutes}m ${seconds}s`)
                } else {
                  setTimeRemaining(`${seconds}s`)
                }
    }

    updateTimeRemaining()
    const interval = setInterval(updateTimeRemaining, 1000)

    return () => clearInterval(interval)
  }, [sharingSettings?.token_expires_at])

  const fetchProfileData = async () => {
    let mounted = true
    
    try {
      setLoading(true)
      setError(null)

      let profileData: Profile | null = null
      let sharingSettings: PastorSharingSettings | null = null

      // Check if this is an anonymous link (starts with 'anon-')
      if (alias && alias.startsWith('anon-')) {
        // Look up sharing settings by anonymous_id first
        const { data: settingsData, error: settingsError } = await supabase
          .from('pastor_sharing_settings')
          .select('*')
          .eq('anonymous_id', alias)
          .single()

        if (settingsError || !settingsData) {
          console.error('PublicProfilePage: Anonymous ID not found:', settingsError)
          setError(t('publicProfile.notFound'))
          setLoading(false)
          return
        }

        sharingSettings = settingsData
        setSharingSettings(settingsData)

        // For anonymous links, token is REQUIRED
        if (!token) {
          setError('Access token required for this link')
          setLoading(false)
          return
        }

        // Validate token
        if (sharingSettings) {
          if (sharingSettings.sharing_token && sharingSettings.sharing_token !== token) {
            setError('Invalid access token')
            setLoading(false)
            return
          }
          
          if (sharingSettings.token_expires_at) {
            const expiresAt = new Date(sharingSettings.token_expires_at)
            const now = new Date()
            if (now > expiresAt) {
              setError('Access token has expired')
              setLoading(false)
              return
            }
          }
        }

        // Now fetch the pastor's profile using the pastor_id from sharing settings
        if (!sharingSettings || !sharingSettings.pastor_id) {
          setError(t('publicProfile.notFound'))
          setLoading(false)
          return
        }

        const { data: profileDataResult, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', sharingSettings.pastor_id)
          .single()

        if (profileError || !profileDataResult) {
          console.error('PublicProfilePage: Profile not found for pastor_id:', profileError)
          setError(t('publicProfile.notFound'))
          setLoading(false)
          return
        }

        profileData = profileDataResult
      } else {
        // Regular profile lookup by alias or pastorId
        let query = supabase.from('profiles').select('*')
        
        if (pastorId) {
          query = query.eq('id', pastorId)
        } else if (alias) {
          query = query.eq('alias', alias)
        } else {
          throw new Error('Either alias or pastorId must be provided')
        }

        const { data: profileDataResult, error: profileError } = await query.single()

        if (!mounted) return

        if (profileError) {
          console.error('PublicProfilePage: Profile fetch error:', profileError)
          if (profileError.code === 'PGRST116') {
            setError(t('publicProfile.notFound'))
          } else {
            setError(t('publicProfile.loadError'))
          }
          setLoading(false)
          return
        }

        if (!profileDataResult) {
          setError(t('publicProfile.notFound'))
          setLoading(false)
          return
        }

        profileData = profileDataResult

        // Check for time-limited sharing if token is provided
        if (token && profileData) {
          const { data: settingsData } = await supabase
            .from('pastor_sharing_settings')
            .select('*')
            .eq('pastor_id', profileData.id)
            .single()

          if (settingsData?.sharing_type === 'time_limited') {
            if (settingsData.sharing_token !== token) {
              setError('Invalid access token')
              setLoading(false)
              return
            }
            
            if (settingsData.token_expires_at) {
              const expiresAt = new Date(settingsData.token_expires_at)
              const now = new Date()
              if (now > expiresAt) {
                setError('Access token has expired')
                setLoading(false)
                return
              }
            }
          }
        }
      }

      if (!mounted || !profileData) return

      setProfile(profileData)

      // Fetch agendas for this pastor
      const { data: eventTypesData, error: eventTypesError } = await supabase
        .from('event_types')
        .select('*')
        .eq('user_id', profileData?.id || '')

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
    <div className={`${isPreview ? 'bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden' : 'min-h-screen bg-gray-50 dark:bg-gray-900'}`}>
      {/* SEO Meta Tags */}
      {profile && !isPreview && (
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
      {!isPreview && (
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
      )}

      {/* Time Remaining Warning */}
      {!isPreview && sharingSettings?.sharing_type === 'time_limited' && timeRemaining && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className={`border-l-4 p-4 rounded-r-lg ${
            timeRemaining === 'Expired' 
              ? 'bg-red-100 dark:bg-red-900/20 border-red-500' 
              : 'bg-yellow-100 dark:bg-yellow-900/20 border-yellow-500'
          }`}>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                {timeRemaining === 'Expired' ? (
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <div className="ml-3">
                <p className={`text-sm ${
                  timeRemaining === 'Expired' 
                    ? 'text-red-800 dark:text-red-200' 
                    : 'text-yellow-800 dark:text-yellow-200'
                }`}>
                  <strong>
                    {timeRemaining === 'Expired' ? 'Access Expired!' : 'Time-Limited Access:'}
                  </strong> 
                  {timeRemaining === 'Expired' 
                    ? ' This link has expired and will redirect to home page.' 
                    : ` This link will expire in `}
                  {timeRemaining !== 'Expired' && (
                    <span className="font-mono font-bold">{timeRemaining}</span>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Breadcrumbs */}
      {!isPreview && (
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
      )}

      {/* Profile Section */}
      <div className={`${isPreview ? '' : 'max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8'}`}>
        <div className={`${isPreview ? 'bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden' : 'bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden'}`} itemScope itemType="https://schema.org/Person">
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
              {!isPreview && (
                <div className="flex items-center space-x-4">
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
                  <div className="flex flex-col items-center space-y-2">
                    <p className="text-xs text-primary-100">{t('publicProfile.qrCode')}</p>
                    <button
                      onClick={() => setShowQRModal(true)}
                      className="bg-white/20 hover:bg-white/30 rounded-lg p-2 transition-colors flex items-center space-x-1"
                      aria-label={t('publicProfile.qrModal.openQRCode')}
                    >
                      <QrCode className="w-4 h-4" />
                      <span className="text-xs font-medium">{t('publicProfile.qrModal.expand')}</span>
                    </button>
                  </div>
                </div>
              )}
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
                      to={`/${profile.alias}/${eventType.id}`}
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
        {!isPreview && (
          <div className="md:hidden mt-6 bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">{t('publicProfile.mobileQrTitle')}</h3>
            <QRCodeSVG 
              value={window.location.href} 
              size={120}
              className="mx-auto"
            />
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{t('publicProfile.mobileQrDescription')}</p>
          </div>
        )}
      </div>

      {/* Footer */}
      {!isPreview && (
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
      )}

      {/* QR Code Modal */}
      {showQRModal && profile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-4 text-white flex items-center justify-between">
              <h3 className="text-lg font-semibold">{t('publicProfile.qrModal.title')}</h3>
              <button
                onClick={() => setShowQRModal(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                aria-label="Close QR Code modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Modal Content */}
            <div className="p-8 text-center">
              {/* Pastor Avatar and Name */}
              <div className="mb-6">
                <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden mx-auto mb-4">
                  {profile.avatar_url ? (
                    <img 
                      src={profile.avatar_url} 
                      alt={`${profile.full_name} - Pastor Profile Picture`}
                      className="w-full h-full object-cover rounded-full"
                      width="80"
                      height="80"
                    />
                  ) : (
                    <img 
                      src="/default-pastor-avatar.svg" 
                      alt={`${profile.full_name} - Pastor Profile Picture`}
                      className="w-full h-full object-cover rounded-full"
                      width="80"
                      height="80"
                    />
                  )}
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{profile.full_name}</h2>
                {profile.bio && (
                  <p className="text-gray-600 dark:text-gray-400 mt-1">{profile.bio}</p>
                )}
              </div>
              
              {/* Large QR Code */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 mb-6">
                <QRCodeSVG 
                  value={window.location.href} 
                  size={200}
                  className="mx-auto"
                />
              </div>
              
              {/* Instructions */}
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {t('publicProfile.qrModal.instructions', { name: profile.full_name })}
              </p>
              
              {/* Share Button */}
              <button
                onClick={shareProfile}
                className="btn-primary w-full flex items-center justify-center space-x-2"
              >
                <Share2 className="w-4 h-4" />
                <span>{t('publicProfile.qrModal.shareProfile')}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PublicProfilePage
