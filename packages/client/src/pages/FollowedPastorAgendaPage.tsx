import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { Calendar, Clock, ArrowLeft, Check, User, Mail, Phone, MessageSquare } from 'lucide-react'
import { format, addDays, startOfWeek, addWeeks, isSameDay, parseISO } from 'date-fns'
import type { Profile, EventType, BookingWithDetails } from '../lib/supabase'
import { translateDefaultEventTypes } from '../lib/eventTypeTranslations'
import { customAuth } from '../lib/custom-auth'

interface AvailableTimeSlot {
  date: Date
  time: string
  endTime: string
  isBooked: boolean
}

function FollowedPastorAgendaPage() {
  const { pastorAlias } = useParams<{ pastorAlias: string }>()
  const { user } = useAuth()
  const { t } = useTranslation()
  const navigate = useNavigate()
  
  const [pastor, setPastor] = useState<Profile | null>(null)
  const [eventTypes, setEventTypes] = useState<EventType[]>([])
  const [bookings, setBookings] = useState<BookingWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (pastorAlias && user) {
      fetchPastorData()
    }
  }, [pastorAlias, user])

  // Re-translate event types when language changes
  useEffect(() => {
    if (eventTypes.length > 0) {
      const translatedData = translateDefaultEventTypes(eventTypes, t)
      setEventTypes(translatedData)
    }
  }, [t])

  const fetchPastorData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Use Edge Function to verify authorization and fetch data
      const token = customAuth.getToken()
      if (!token) {
        setError('Authentication required')
        return
      }

      const API_BASE_URL = import.meta.env.VITE_SUPABASE_URL?.replace('/rest/v1', '') || ''

      console.log('Fetching pastor agenda data:', { pastorAlias, masterPastorId: user?.id })

      const response = await fetch(`${API_BASE_URL}/functions/v1/pastor-invitations/pastor-agenda`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          pastor_alias: pastorAlias
        })
      })

      console.log('Pastor agenda response status:', response.status)

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Error fetching pastor agenda:', errorData)
        setError(errorData.error || 'Failed to fetch pastor agenda')
        return
      }

      const { data } = await response.json()
      console.log('Pastor agenda data:', data)

      if (!data || !data.pastor) {
        setError('Pastor not found or not authorized')
        return
      }

      // Set data from Edge Function response
      setPastor(data.pastor)
      
      // Debug event types before translation
      console.log('Event types before translation:', data.eventTypes)
      
      // Translate event types
      const translatedEventTypes = translateDefaultEventTypes(data.eventTypes || [], t)
      console.log('Event types after translation:', translatedEventTypes)
      setEventTypes(translatedEventTypes)
      
      setBookings(data.bookings || [])

    } catch (error) {
      console.error('Error fetching pastor data:', error)
      setError('Failed to load pastor data')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Access Denied</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => navigate('/dashboard/master')}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Follow Agendas
          </button>
        </div>
      </div>
    )
  }

  if (!pastor) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Pastor Not Found</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">The requested pastor could not be found.</p>
          <button
            onClick={() => navigate('/dashboard/master')}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Follow Agendas
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/dashboard/master')}
                className="mr-4 p-2 text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-100"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {pastor.full_name || pastor.alias}'s Agenda
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Master Pastor Access
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Pastor Info */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center overflow-hidden">
              {pastor.avatar_url ? (
                <img
                  src={pastor.avatar_url}
                  alt="Pastor"
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <User className="w-8 h-8 text-primary-600 dark:text-primary-400" />
              )}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {pastor.full_name || pastor.alias}
              </h2>
              <p className="text-gray-600 dark:text-gray-400">{pastor.email}</p>
              {pastor.bio && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{pastor.bio}</p>
              )}
            </div>
          </div>
        </div>

        {/* Event Types */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Available Services
          </h3>
          {eventTypes.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">No services available</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {eventTypes.map((eventType) => (
                <div key={eventType.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                    {eventType.title}
                  </h4>
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                    <Clock className="w-4 h-4 mr-2" />
                    {eventType.duration} minutes
                  </div>
                  {eventType.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                      {eventType.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Bookings */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Recent Bookings
          </h3>
          {bookings.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">No recent bookings</p>
          ) : (
            <div className="space-y-4">
              {bookings.map((booking) => (
                <div key={booking.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {booking.event_types?.title || 'Appointment'}
                      </h4>
                      <div className="mt-2 space-y-1">
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                          <Calendar className="w-4 h-4 mr-2" />
                          {format(new Date(booking.start_time), 'EEEE, MMMM d, yyyy')}
                        </div>
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                          <Clock className="w-4 h-4 mr-2" />
                          {format(new Date(booking.start_time), 'h:mm a')} - {format(new Date(booking.end_time), 'h:mm a')}
                        </div>
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                          <User className="w-4 h-4 mr-2" />
                          {booking.booker_name}
                        </div>
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                          <Mail className="w-4 h-4 mr-2" />
                          {booking.booker_email}
                        </div>
                        {booking.booker_phone && (
                          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                            <Phone className="w-4 h-4 mr-2" />
                            {booking.booker_phone}
                          </div>
                        )}
                        {booking.booker_description && (
                          <div className="flex items-start text-sm text-gray-500 dark:text-gray-400 mt-2">
                            <MessageSquare className="w-4 h-4 mr-2 mt-0.5" />
                            <span>{booking.booker_description}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="ml-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        booking.status === 'confirmed' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                      }`}>
                        <Check className="w-3 h-3 mr-1" />
                        {booking.status === 'confirmed' ? 'Confirmed' : 'Cancelled'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default FollowedPastorAgendaPage
