import { useLocation, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CheckCircle, Calendar, Clock, User, Phone, MessageSquare } from 'lucide-react'
import { format } from 'date-fns'

interface LocationState {
  booking: any
  eventType: any
  profile: any
  date: Date
  time: string
  endTime: string
  booker_phone?: string
  booker_description?: string
}

function BookingSuccessPage() {
  const location = useLocation()
  const { t } = useTranslation()
  const state = location.state as LocationState

  if (!state) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t('errors.notFound')}</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">{t('bookingSuccess.pageNotFound')}</p>
          <Link to="/" className="btn-primary">
            {t('navigation.home')}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            {t('bookingSuccess.title')}
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
            {t('bookingSuccess.subtitle', { name: state.profile.full_name })}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">{t('bookingSuccess.appointmentDetails')}</h2>
          
          <div className="space-y-4">
            <div className="flex items-center">
              <User className="w-5 h-5 text-gray-400 dark:text-gray-500 mr-3" />
              <span className="text-gray-600 dark:text-gray-300">{t('bookingSuccess.pastor')}:</span>
              <span className="ml-2 font-medium text-gray-900 dark:text-white">{state.profile.full_name}</span>
            </div>
            
            <div className="flex items-center">
              <Calendar className="w-5 h-5 text-gray-400 dark:text-gray-500 mr-3" />
              <span className="text-gray-600 dark:text-gray-300">{t('bookingSuccess.event')}:</span>
              <span className="ml-2 font-medium text-gray-900 dark:text-white">{state.eventType.title}</span>
            </div>
            
            <div className="flex items-center">
              <Calendar className="w-5 h-5 text-gray-400 dark:text-gray-500 mr-3" />
              <span className="text-gray-600 dark:text-gray-300">{t('bookingSuccess.date')}:</span>
              <span className="ml-2 font-medium text-gray-900 dark:text-white">
                {format(state.date, 'EEEE, MMMM d, yyyy')}
              </span>
            </div>
            
            <div className="flex items-center">
              <Clock className="w-5 h-5 text-gray-400 dark:text-gray-500 mr-3" />
              <span className="text-gray-600 dark:text-gray-300">{t('bookingSuccess.time')}:</span>
              <span className="ml-2 font-medium text-gray-900 dark:text-white">
                {state.time} - {state.endTime} ({state.eventType.duration} {t('common.minutes')})
              </span>
            </div>
            
            {state.booker_phone && (
              <div className="flex items-center">
                <Phone className="w-5 h-5 text-gray-400 dark:text-gray-500 mr-3" />
                <span className="text-gray-600 dark:text-gray-300">{t('bookingSuccess.phone')}:</span>
                <span className="ml-2 font-medium text-gray-900 dark:text-white">{state.booker_phone}</span>
              </div>
            )}
            
            {state.booker_description && (
              <div className="flex items-start">
                <MessageSquare className="w-5 h-5 text-gray-400 dark:text-gray-500 mr-3 mt-0.5" />
                <span className="text-gray-600 dark:text-gray-300">{t('bookingSuccess.description')}:</span>
                <span className="ml-2 font-medium text-gray-900 dark:text-white">{state.booker_description}</span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-medium text-blue-900 dark:text-blue-200 mb-3">What's Next?</h3>
          <ul className="text-blue-800 dark:text-blue-200 space-y-2">
            <li>• You'll receive a confirmation email shortly</li>
            <li>• Please arrive on time for your appointment</li>
            <li>• If you need to cancel, contact {state.profile.full_name} as soon as possible</li>
          </ul>
        </div>

        <div className="text-center space-y-4">
          <Link
            to={`/${state.profile.alias}`}
            className="btn-primary inline-block"
          >
            View Pastor's Profile
          </Link>
          
          <div>
            <Link
              to="/"
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BookingSuccessPage
