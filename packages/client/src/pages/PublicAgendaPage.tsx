import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Helmet } from 'react-helmet-async'
import { supabase } from '../lib/supabase'
import { Calendar, Clock, User, Mail, Phone, MessageSquare, CheckCircle, XCircle, Copy } from 'lucide-react'
import { toast } from 'react-hot-toast'
import type { PastorSharingSettings, Profile, BookingWithDetails } from '../lib/supabase'
import LanguageSwitcher from '../components/LanguageSwitcher'
import { translateDefaultEventType } from '../lib/eventTypeTranslations'

interface PublicAgendaPageProps {
  slug?: string
  pastorId?: string
  isPreview?: boolean
}

function PublicAgendaPage({ slug: propSlug, pastorId, isPreview = false }: PublicAgendaPageProps = {}) {
  const { slug: urlSlug } = useParams<{ slug: string }>()
  const [searchParams] = useSearchParams()
  const { t } = useTranslation()
  
  // Use prop slug first, then fall back to URL slug
  const slug = propSlug || urlSlug
  const token = searchParams.get('token')
  const [profile, setProfile] = useState<Profile | null>(null)
  const [sharingSettings, setSharingSettings] = useState<PastorSharingSettings | null>(null)
  const [bookings, setBookings] = useState<BookingWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past' | 'cancelled'>('all')

  useEffect(() => {
    if (slug || pastorId) {
      fetchAgendaData()
    }
  }, [slug, pastorId])

  // Re-translate bookings when language changes
  useEffect(() => {
    if (bookings.length > 0) {
      const translatedBookings = bookings.map(booking => {
        if (booking.event_types) {
          const translatedEventType = translateDefaultEventType(booking.event_types, t)
          return {
            ...booking,
            event_types: translatedEventType
          }
        }
        return booking
      })
      setBookings(translatedBookings)
    }
  }, [t])

  const fetchAgendaData = async () => {
    try {
      setLoading(true)
      setError(null)

      let query = supabase
        .from('pastor_sharing_settings')
        .select(`
          *,
          profiles!pastor_sharing_settings_pastor_id_fkey (
            id,
            full_name,
            alias,
            bio,
            avatar_url
          )
        `)
      
      // Only require is_public_enabled = true if not in preview mode
      if (!isPreview) {
        query = query.eq('is_public_enabled', true)
      }

      // If we have a pastorId, use it; otherwise use slug
      if (pastorId) {
        query = query.eq('pastor_id', pastorId)
      } else if (slug) {
        query = query.eq('public_slug', slug)
      } else {
        throw new Error('Either slug or pastorId must be provided')
      }

      const { data: settingsData, error: settingsError } = await query.single()

      if (settingsError || !settingsData) {
        throw new Error('Agenda not found or not publicly available')
      }

      // Validate token if required
      if (settingsData.sharing_type === 'time_limited') {
        if (!token) {
          throw new Error('Access token required for this agenda')
        }
        
        if (settingsData.sharing_token !== token) {
          throw new Error('Invalid access token')
        }
        
        if (settingsData.token_expires_at) {
          const expiresAt = new Date(settingsData.token_expires_at)
          const now = new Date()
          if (now > expiresAt) {
            throw new Error('Access token has expired')
          }
        }
      }

      setSharingSettings(settingsData)
      setProfile(settingsData.profiles)

      // If booking view is allowed, fetch bookings
      if (settingsData.allow_booking_view) {
        const { data: eventTypes } = await supabase
          .from('event_types')
          .select('id')
          .eq('user_id', settingsData.pastor_id)

        if (eventTypes && eventTypes.length > 0) {
          const eventTypeIds = eventTypes.map(et => et.id)

          const { data: bookingsData, error: bookingsError } = await supabase
            .from('bookings')
            .select(`
              *,
              event_types (
                title,
                duration,
                custom_questions
              )
            `)
            .in('event_type_id', eventTypeIds)
            .order('start_time', { ascending: false })

          if (bookingsError) throw bookingsError

          // Translate event types in bookings
          const translatedBookings = (bookingsData || []).map(booking => {
            if (booking.event_types) {
              const translatedEventType = translateDefaultEventType(booking.event_types, t)
              return {
                ...booking,
                event_types: translatedEventType
              }
            }
            return booking
          })

          setBookings(translatedBookings)
        }
      }
    } catch (error) {
      console.error('Error fetching agenda data:', error)
      setError(error instanceof Error ? error.message : 'Failed to load agenda')
    } finally {
      setLoading(false)
    }
  }

  const getFilteredBookings = () => {
    const now = new Date()

    switch (filter) {
      case 'upcoming':
        return bookings.filter(booking =>
          new Date(booking.start_time) > now && booking.status === 'confirmed'
        )
      case 'past':
        return bookings.filter(booking =>
          new Date(booking.start_time) < now && booking.status === 'confirmed'
        )
      case 'cancelled':
        return bookings.filter(booking => booking.status === 'cancelled')
      default:
        return bookings
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'cancelled':
        return <XCircle className="w-5 h-5 text-red-500" />
      default:
        return <Clock className="w-5 h-5 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (error || !profile || !sharingSettings) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <Calendar className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {t('agenda.notFound')}
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            {error || t('agenda.notFoundDesc')}
          </p>
        </div>
      </div>
    )
  }

  const filteredBookings = getFilteredBookings()

  return (
    <div className={`${isPreview ? 'bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden' : 'min-h-screen bg-gray-50 dark:bg-gray-900'}`}>
      {!isPreview && (
        <Helmet>
          <title>{profile.full_name} - {t('agenda.title')}</title>
          <meta name="description" content={t('agenda.metaDescription', { name: profile.full_name })} />
        </Helmet>
      )}

      {/* Header */}
      <div className={`${isPreview ? 'bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-8' : 'bg-white dark:bg-gray-800 shadow'}`}>
        <div className={`${isPreview ? '' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'}`}>
          <div className={`flex ${isPreview ? 'items-center space-x-4' : 'justify-between items-center py-6'}`}>
            <div className="flex items-center space-x-4">
              {profile.avatar_url && (
                <img
                  src={profile.avatar_url}
                  alt={profile.full_name}
                  className={`${isPreview ? 'h-16 w-16 rounded-full object-cover border-2 border-white' : 'h-12 w-12 rounded-full object-cover'}`}
                />
              )}
              <div className="flex-1">
                <h1 className={`${isPreview ? 'text-2xl font-bold text-white' : 'text-2xl font-bold text-gray-900 dark:text-white'}`}>
                  {sharingSettings.show_pastor_name ? profile.full_name : t('agenda.pastor')}
                </h1>
                <p className={`${isPreview ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'}`}>
                  {t('agenda.title')}
                </p>
              </div>
            </div>
            {isPreview && (
              <div className="text-right">
                <div className="bg-white/20 rounded-lg p-2 mb-2">
                  <div className="w-16 h-16 bg-white rounded"></div>
                </div>
                <p className="text-xs text-blue-100">Scan to share</p>
              </div>
            )}
            {!isPreview && (
              <div className="flex items-center space-x-4">
                <LanguageSwitcher />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={`${isPreview ? 'p-6' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'}`}>
        <div className="space-y-6">
          {!isPreview && (
            <>
              {/* Filter Tabs */}
              <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="-mb-px flex flex-wrap gap-2 sm:gap-8 overflow-x-auto">
                  {[
                    { key: 'all', label: t('bookings.filter.all'), count: bookings.length },
                    { key: 'upcoming', label: t('bookings.filter.upcoming'), count: bookings.filter(b => {
                      const bookingTime = new Date(b.start_time)
                      const currentTime = new Date()
                      return bookingTime > currentTime && b.status === 'confirmed'
                    }).length },
                    { key: 'past', label: t('bookings.filter.past'), count: bookings.filter(b => {
                      const bookingTime = new Date(b.start_time)
                      const currentTime = new Date()
                      return bookingTime < currentTime && b.status === 'confirmed'
                    }).length },
                    { key: 'cancelled', label: t('bookings.filter.cancelled'), count: bookings.filter(b => b.status === 'cancelled').length }
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setFilter(tab.key as any)}
                      className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap flex items-center ${filter === tab.key
                          ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                          : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                    >
                      <span>{tab.label}</span>
                      <span className="ml-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 py-0.5 px-2.5 rounded-full text-xs flex-shrink-0">
                        {tab.count}
                      </span>
                    </button>
                  ))}
                </nav>
              </div>
            </>
          )}

          {isPreview && (
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Available Appointments
            </h4>
          )}

          {/* Bookings List */}
          {filteredBookings.length > 0 ? (
            <div className={`space-y-4 ${isPreview ? 'max-h-96 overflow-y-auto' : ''}`}>
              {filteredBookings.slice(0, isPreview ? 3 : undefined).map((booking) => (
                <div key={booking.id} className={`${isPreview ? 'bg-gray-50 dark:bg-gray-700 rounded-lg p-4' : 'bg-white dark:bg-gray-800 rounded-lg shadow p-6'}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(booking.status)}
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(booking.status)}`}>
                            {t(`bookings.status.${booking.status}`)}
                          </span>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                          {booking.event_types.title}
                        </h3>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                            <Calendar className="w-4 h-4 mr-2" />
                            {formatDate(booking.start_time)}
                          </div>
                          <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                            <Clock className="w-4 h-4 mr-2" />
                            {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                            <span className="ml-2 text-gray-500 dark:text-gray-400">
                              ({Math.round((new Date(booking.end_time).getTime() - new Date(booking.start_time).getTime()) / (1000 * 60))} {t('common.min')})
                            </span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                            <User className="w-4 h-4 mr-2" />
                            {booking.booker_name}
                          </div>
                          <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                            <Mail className="w-4 h-4 mr-2" />
                            {booking.booker_email}
                          </div>
                          {booking.booker_phone && (
                            <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                              <Phone className="w-4 h-4 mr-2" />
                              {booking.booker_phone}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Description */}
                      {booking.booker_description && (
                        <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <div className="flex items-start space-x-2">
                            <MessageSquare className="w-4 h-4 text-gray-500 dark:text-gray-400 mt-0.5 flex-shrink-0" />
                            <div>
                              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('bookings.details.description')}</h4>
                              <p className="text-sm text-gray-600 dark:text-gray-300">{booking.booker_description}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Custom Answers */}
                      {booking.custom_answers && Object.keys(booking.custom_answers).length > 0 && (
                        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                          <div className="flex items-start space-x-2">
                            <MessageSquare className="w-4 h-4 text-blue-500 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                              <h4 className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-2">{t('bookings.details.customQandA')}</h4>
                              <div className="space-y-2">
                                {Object.entries(booking.custom_answers).map(([questionId, answer]) => {
                                  // Find the corresponding question from event type
                                  const question = booking.event_types.custom_questions?.find(q => q.id === questionId)
                                  return (
                                    <div key={questionId} className="text-sm">
                                      <span className="font-medium text-blue-700 dark:text-blue-300">{question?.question || 'Question'}: </span>
                                      <span className="text-blue-600 dark:text-blue-200">
                                        {Array.isArray(answer) ? answer.join(', ') : answer}
                                      </span>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
                        {t('bookings.details.bookedOn')} {formatDate(booking.created_at)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {t(`bookings.noBookings.${filter}`)}
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                {t(`bookings.noBookingsDesc.${filter}`)}
              </p>
            </div>
          )}

          {/* View Full Agenda Link for Preview */}
          {isPreview && (
            <div className="mt-6 text-center">
              <a
                href={`/agenda/${sharingSettings?.public_slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
              >
                View Full Agenda
                <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default PublicAgendaPage
