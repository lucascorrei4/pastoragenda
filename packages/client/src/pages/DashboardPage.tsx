import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import { Calendar, Clock, Users, TrendingUp, MessageSquare, ExternalLink, Edit, Globe, Plus, Settings, Ban } from 'lucide-react'
import type { Profile, BookingWithDetails, EventType } from '../lib/supabase'
import { translateDefaultEventTypes } from '../lib/eventTypeTranslations'

function DashboardPage() {
  const { user } = useAuth()
  const { t } = useTranslation()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [recentBookings, setRecentBookings] = useState<BookingWithDetails[]>([])
  const [eventTypes, setEventTypes] = useState<EventType[]>([])
  const [stats, setStats] = useState({
    totalBookings: 0,
    thisMonthBookings: 0,
    totalEventTypes: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchDashboardData()
    }
  }, [user])

  // Re-translate event types when language changes
  useEffect(() => {
    if (eventTypes.length > 0) {
      const translatedData = translateDefaultEventTypes(eventTypes, t)
      setEventTypes(translatedData)
    }
  }, [t])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single()

      if (profileData) {
        setProfile(profileData)
      }

      // Fetch agendas
      const { data: eventTypesData } = await supabase
        .from('event_types')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })

      if (eventTypesData) {
        // Translate default event types
        const translatedEventTypes = translateDefaultEventTypes(eventTypesData, t)
        setEventTypes(translatedEventTypes)
      }

      // Fetch recent bookings - first get event type IDs for this user
      const { data: userEventTypes } = await supabase
        .from('event_types')
        .select('id')
        .eq('user_id', user?.id)

              if (userEventTypes && userEventTypes.length > 0) {
          const eventTypeIds = userEventTypes.map((et: { id: string }) => et.id)
        
        // Fetch recent bookings for user's agendas
        const { data: bookingsData } = await supabase
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
          .limit(5)

        if (bookingsData) {
          setRecentBookings(bookingsData)
        }

        // Calculate stats
        const { count: totalBookings } = await supabase
          .from('bookings')
          .select('*', { count: 'exact', head: true })
          .in('event_type_id', eventTypeIds)

        const thisMonth = new Date()
        thisMonth.setDate(1)
        thisMonth.setHours(0, 0, 0, 0)

        const { count: thisMonthBookings } = await supabase
          .from('bookings')
          .select('*', { count: 'exact', head: true })
          .in('event_type_id', eventTypeIds)
          .gte('start_time', thisMonth.toISOString())

        setStats({
          totalBookings: totalBookings || 0,
          thisMonthBookings: thisMonthBookings || 0,
          totalEventTypes: eventTypesData?.length || 0
        })
      } else {
        // No agendas, set stats to 0
        setStats({
          totalBookings: 0,
          thisMonthBookings: 0,
          totalEventTypes: 0
        })
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t('dashboard.welcome', { name: profile?.full_name || t('common.pastor') })}
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mt-2">
          {t('dashboard.subtitle')}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Calendar className="h-8 w-8 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('dashboard.stats.totalBookings')}</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.totalBookings}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TrendingUp className="h-8 w-8 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('dashboard.stats.thisMonth')}</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.thisMonthBookings}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Clock className="h-8 w-8 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('dashboard.stats.eventTypes')}</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.totalEventTypes}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Agendas Overview */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
            <Calendar className="h-5 w-5 text-primary-600 mr-2" />
            {t('dashboard.agendas.title')}
          </h2>
          <Link
            to="/dashboard/event-types"
            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-md hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            {t('dashboard.agendas.createNew')}
          </Link>
        </div>
        
        {eventTypes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {eventTypes.slice(0, 6).map((eventType) => (
              <div key={eventType.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:border-primary-300 hover:shadow-md transition-all">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-2">
                    {eventType.title}
                  </h3>
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 ml-2">
                    <Clock className="w-4 h-4 mr-1" />
                    {eventType.duration} {t('common.min')}
                  </div>
                </div>
                
                {eventType.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
                    {eventType.description}
                  </p>
                )}
                
                <div className="space-y-2">
                  <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    {t('dashboard.agendas.availability')}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(eventType.availability_rules || {}).map(([day, slots]) => {
                      if (!slots || slots.length === 0) return null
                      const dayNames = {
                        monday: t('common.days.monday'),
                        tuesday: t('common.days.tuesday'),
                        wednesday: t('common.days.wednesday'),
                        thursday: t('common.days.thursday'),
                        friday: t('common.days.friday'),
                        saturday: t('common.days.saturday'),
                        sunday: t('common.days.sunday')
                      }
                      return (
                        <span
                          key={day}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                        >
                          {dayNames[day as keyof typeof dayNames]}
                        </span>
                      )
                    })}
                  </div>
                </div>
                
                <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-600">
                  <Link
                    to={`/dashboard/event-types?edit=${eventType.id}`}
                    className="inline-flex items-center text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300"
                  >
                    <Settings className="w-4 h-4 mr-1.5" />
                    {t('dashboard.agendas.manage')}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {t('dashboard.agendas.noAgendas')}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {t('dashboard.agendas.noAgendasDesc')}
            </p>
            <Link
              to="/dashboard/event-types"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <Plus className="w-4 h-4 mr-2" />
              {t('dashboard.agendas.createFirst')}
            </Link>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">{t('dashboard.quickActions.title')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/dashboard/event-types"
            className="flex items-center p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:border-primary-300 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
          >
            <Calendar className="h-6 w-6 text-primary-600 mr-3" />
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">{t('dashboard.quickActions.createEventType')}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('dashboard.quickActions.createEventTypeDesc')}</p>
            </div>
          </Link>

          <Link
            to="/dashboard/unavailability"
            className="flex items-center p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:border-primary-300 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
          >
            <Ban className="h-6 w-6 text-primary-600 mr-3" />
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">{t('dashboard.quickActions.manageUnavailability')}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('dashboard.quickActions.manageUnavailabilityDesc')}</p>
            </div>
          </Link>

          <Link
            to="/dashboard/profile"
            className="flex items-center p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:border-primary-300 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
          >
            <Users className="h-6 w-6 text-primary-600 mr-3" />
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">{t('dashboard.quickActions.updateProfile')}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('dashboard.quickActions.updateProfileDesc')}</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Public Profile Preview */}
      {profile?.alias && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
              <Users className="h-5 w-5 text-primary-600 mr-2" />
              {t('dashboard.publicProfile.title')}
            </h2>
            <div className="flex space-x-2">
              <a
                href={`/${profile.alias}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-md hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors"
              >
                <ExternalLink className="w-4 h-4 mr-1.5" />
                {t('dashboard.publicProfile.view')}
              </a>
              <Link
                to="/dashboard/profile"
                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              >
                <Edit className="w-4 h-4 mr-1.5" />
                {t('dashboard.publicProfile.edit')}
              </Link>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-primary-50 to-blue-50 dark:from-primary-900/10 dark:to-blue-900/10 border border-primary-200 dark:border-primary-800 rounded-lg p-4">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center overflow-hidden">
                  {profile.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Users className="w-8 h-8 text-primary-600 dark:text-primary-400" />
                  )}
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                  {profile.full_name || t('common.pastor')}
                </h3>
                {profile.bio && (
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">
                    {profile.bio}
                  </p>
                )}
                
                <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-center">
                    <Globe className="w-4 h-4 mr-1.5" />
                    <a 
                      href={`${window.location.origin}/${profile.alias}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 underline transition-colors"
                    >
                      {window.location.origin}/{profile.alias}
                    </a>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1.5" />
                    <span>{stats.totalEventTypes} {t('dashboard.publicProfile.eventTypes')}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-primary-200 dark:border-primary-800">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t('dashboard.publicProfile.description')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Recent Bookings */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">{t('dashboard.recentBookings.title')}</h2>
          <Link
            to="/dashboard/bookings"
            className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300"
          >
            {t('dashboard.recentBookings.viewAll')}
          </Link>
        </div>
        
        {recentBookings.length > 0 ? (
          <div className="space-y-4">
            {recentBookings.map((booking) => (
              <div key={booking.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white">{booking.booker_name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{booking.booker_email}</p>
                  {booking.booker_phone && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">{booking.booker_phone}</p>
                  )}
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {new Date(booking.start_time).toLocaleDateString('en-US')} at{' '}
                    {new Date(booking.start_time).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true
                    })}
                  </p>
                   {booking.booker_description && (
                     <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 italic">
                       "{booking.booker_description}"
                     </p>
                   )}
                   {booking.custom_answers && Object.keys(booking.custom_answers).length > 0 && (
                     <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded text-xs">
                       <div className="flex items-start space-x-2 mb-2">
                         <MessageSquare className="w-4 h-4 text-blue-500 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                         <span className="font-medium text-blue-700 dark:text-blue-300">{t('dashboard.recentBookings.customQandA')}:</span>
                       </div>
                       <div className="space-y-1 ml-6">
                         {Object.entries(booking.custom_answers).map(([questionId, answer]) => {
                           // Find the corresponding question from event type
                           const question = booking.event_types.custom_questions?.find(q => q.id === questionId)
                           return (
                             <div key={questionId} className="text-blue-600 dark:text-blue-200">
                               <span className="font-medium">{question?.question || 'Question'}: </span>
                               <span>{Array.isArray(answer) ? answer.join(', ') : answer}</span>
                             </div>
                           )
                         })}
                       </div>
                     </div>
                   )}
                </div>
                <div className="text-right">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    booking.status === 'confirmed' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  }`}>
                    {booking.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Clock className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">{t('dashboard.recentBookings.noBookings')}</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
              {t('dashboard.recentBookings.noBookingsDesc')}
            </p>
          </div>
        )}
      </div>

      {/* Profile Completion */}
      {profile && !profile.alias && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <Users className="h-5 w-5 text-yellow-400 dark:text-yellow-500" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                {t('dashboard.profileCompletion.title')}
              </h3>
              <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                <p>
                  {t('dashboard.profileCompletion.description')}
                </p>
              </div>
              <div className="mt-4">
                <Link
                  to="/dashboard/profile"
                  className="bg-yellow-50 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 hover:bg-yellow-100 dark:hover:bg-yellow-900/50 px-4 py-2 rounded-md text-sm font-medium"
                >
                  {t('dashboard.profileCompletion.button')}
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default DashboardPage
