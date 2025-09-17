import { useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CheckCircle, Calendar, Clock, User, Home } from 'lucide-react'
import { format } from 'date-fns'
import type { BookingWithDetails } from '../lib/supabase'
import LanguageSwitcher from '../components/LanguageSwitcher'

interface LocationState {
  booking: BookingWithDetails
  message: string
}

function BookingCancelledPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { t } = useTranslation()
  
  const state = location.state as LocationState
  const { booking, message } = state || {}

  if (!booking) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            {t('bookingCancelled.errorTitle')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {t('bookingCancelled.noBookingData')}
          </p>
          <button
            onClick={() => navigate('/')}
            className="btn-primary"
          >
            {t('common.goHome')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {t('bookingCancelled.title')}
            </h1>
            <LanguageSwitcher />
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Success Header */}
          <div className="bg-green-50 dark:bg-green-900/20 px-6 py-8 text-center">
            <CheckCircle className="h-16 w-16 text-green-600 dark:text-green-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-green-900 dark:text-green-100 mb-2">
              {t('bookingCancelled.successTitle')}
            </h2>
            <p className="text-green-700 dark:text-green-300">
              {message || t('bookingCancelled.successMessage')}
            </p>
          </div>

          {/* Cancelled Booking Details */}
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {t('bookingCancelled.cancelledBooking')}
            </h3>
            
            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 mb-6 border border-red-200 dark:border-red-800">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-red-400" />
                  <div>
                    <p className="text-sm font-medium text-red-600 dark:text-red-400">
                      {t('bookingCancelled.date')}
                    </p>
                    <p className="text-red-900 dark:text-red-100">
                      {format(new Date(booking.start_time), 'EEEE, MMMM dd, yyyy')}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Clock className="h-5 w-5 text-red-400" />
                  <div>
                    <p className="text-sm font-medium text-red-600 dark:text-red-400">
                      {t('bookingCancelled.time')}
                    </p>
                    <p className="text-red-900 dark:text-red-100">
                      {format(new Date(booking.start_time), 'h:mm a')} - {format(new Date(booking.end_time), 'h:mm a')}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <User className="h-5 w-5 text-red-400" />
                  <div>
                    <p className="text-sm font-medium text-red-600 dark:text-red-400">
                      {t('bookingCancelled.eventType')}
                    </p>
                    <p className="text-red-900 dark:text-red-100">
                      {booking.event_types?.title || 'Appointment'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Clock className="h-5 w-5 text-red-400" />
                  <div>
                    <p className="text-sm font-medium text-red-600 dark:text-red-400">
                      {t('bookingCancelled.duration')}
                    </p>
                    <p className="text-red-900 dark:text-red-100">
                      {booking.event_types?.duration || 0} {t('common.minutes')}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Next Steps */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
              <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                {t('bookingCancelled.nextSteps')}
              </h4>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <li>• {t('bookingCancelled.nextStep1')}</li>
                <li>• {t('bookingCancelled.nextStep2')}</li>
                <li>• {t('bookingCancelled.nextStep3')}</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => navigate('/')}
                className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center"
              >
                <Home className="h-5 w-5 mr-2" />
                {t('bookingCancelled.backToHome')}
              </button>
              
              <button
                onClick={() => navigate('/')}
                className="flex-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-900 dark:text-white font-medium py-3 px-6 rounded-lg transition-colors"
              >
                {t('bookingCancelled.bookAnother')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BookingCancelledPage
