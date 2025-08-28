import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import { QRCodeSVG } from 'qrcode.react'
import { Calendar, Clock, User, Share2 } from 'lucide-react'
import type { Profile, EventType } from '../lib/supabase'
import LanguageSwitcher from '../components/LanguageSwitcher'

function PublicProfilePage() {
  const { alias } = useParams<{ alias: string }>()
  const { t } = useTranslation()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [eventTypes, setEventTypes] = useState<EventType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (alias) {
      fetchProfileData()
    }
  }, [alias])

  const fetchProfileData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch profile by alias
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('alias', alias)
        .single()

      if (profileError) {
        if (profileError.code === 'PGRST116') {
          setError(t('publicProfile.notFound'))
        } else {
          throw profileError
        }
        return
      }

      setProfile(profileData)

      // Fetch event types for this pastor
      const { data: eventTypesData, error: eventTypesError } = await supabase
        .from('event_types')
        .select('*')
        .eq('user_id', profileData.id)

      if (eventTypesError) throw eventTypesError
      setEventTypes(eventTypesData || [])

    } catch (error) {
      console.error('Error fetching profile data:', error)
      setError(t('publicProfile.loadError'))
    } finally {
      setLoading(false)
    }
  }

  const shareProfile = async () => {
    const url = window.location.href
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: t('publicProfile.shareTitle', { name: profile?.full_name }),
          text: t('publicProfile.shareText', { name: profile?.full_name }),
          url: url
        })
      } catch (error) {
        console.log('Error sharing:', error)
      }
    } else {
      // Fallback to copying to clipboard
      try {
        await navigator.clipboard.writeText(url)
        alert(t('publicProfile.linkCopied'))
      } catch (error) {
        console.log('Error copying to clipboard:', error)
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center">
              <img src="/logo.png" alt="PastorTalk" className="h-16 w-auto" />
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

      {/* Profile Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          {/* Profile Header */}
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-8 text-white">
            <div className="flex items-center space-x-6">
              <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center overflow-hidden">
                {profile.avatar_url ? (
                  <img 
                    src={profile.avatar_url} 
                    alt={profile.full_name} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-12 h-12 text-white/80" />
                )}
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold">{profile.full_name}</h1>
                {profile.bio && (
                  <p className="text-primary-100 mt-2 text-lg">{profile.bio}</p>
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

          {/* Event Types */}
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              {t('publicProfile.eventTypes')}
            </h2>

            {eventTypes.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2">
                {eventTypes.map((eventType) => (
                  <div key={eventType.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-6 hover:border-primary-300 hover:shadow-md transition-all">
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                        {eventType.title}
                      </h3>
                      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <Clock className="w-4 h-4 mr-1" />
                        {eventType.duration} {t('common.min')}
                      </div>
                    </div>
                    
                    {eventType.description && (
                      <p className="text-gray-600 dark:text-gray-300 mb-4">{eventType.description}</p>
                    )}
                    
                    <Link
                      to={`/${alias}/${eventType.id}`}
                      className="btn-primary w-full text-center"
                    >
                      <Calendar className="w-4 h-4 mr-2 inline" />
                      {t('publicProfile.bookAppointment')}
                    </Link>
                  </div>
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
            <img src="/logo.png" alt="PastorTalk" className="h-16 w-auto mx-auto mb-2" />
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
