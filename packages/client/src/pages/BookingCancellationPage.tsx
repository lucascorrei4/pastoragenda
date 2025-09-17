import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import { toast } from 'react-hot-toast'
import { Calendar, Clock, User, X, CheckCircle, AlertTriangle } from 'lucide-react'
import { format } from 'date-fns'
import type { BookingWithDetails } from '../lib/supabase'
import LanguageSwitcher from '../components/LanguageSwitcher'
import ConfirmationModal from '../components/ConfirmationModal'

function BookingCancellationPage() {
  const { bookingId } = useParams<{ bookingId: string }>()
  const { t } = useTranslation()
  const navigate = useNavigate()
  
  const [booking, setBooking] = useState<BookingWithDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (bookingId) {
      fetchBooking()
    }
  }, [bookingId])

  const fetchBooking = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('bookings')
        .select(`
          *,
          event_types (
            title,
            duration,
            user_id
          )
        `)
        .eq('id', bookingId)
        .single()

      if (fetchError) {
        console.error('Error fetching booking:', fetchError)
        setError('Booking not found or access denied')
        return
      }

      // Check if booking is already cancelled
      if (data.status === 'cancelled') {
        setError('This booking has already been cancelled')
        return
      }

      // Check if booking is in the past
      if (new Date(data.start_time) < new Date()) {
        setError('This booking is in the past and cannot be cancelled')
        return
      }

      setBooking(data)
    } catch (err) {
      console.error('Error fetching booking:', err)
      setError('Failed to load booking details')
    } finally {
      setLoading(false)
    }
  }

  const handleCancelBooking = () => {
    setShowCancelModal(true)
  }

  const confirmCancelBooking = async () => {
    if (!booking) return

    try {
      setCancelling(true)

      // Cancel the booking
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', booking.id)

      if (error) throw error

      // Send cancellation emails via edge function
      try {
        const { error: emailError } = await supabase.functions.invoke('on-booking-cancelled', {
          body: { bookingId: booking.id }
        })

        if (emailError) {
          console.error('Error sending cancellation emails:', emailError)
          // Don't throw error - booking was cancelled successfully, just email failed
        } else {
          console.log('Cancellation emails sent successfully')
        }
      } catch (emailError) {
        console.error('Error calling cancellation email function:', emailError)
        // Don't throw error - booking was cancelled successfully, just email failed
      }

      toast.success(t('bookingCancellation.cancelSuccess'))
      navigate('/booking-cancelled', { 
        state: { 
          booking, 
          message: t('bookingCancellation.cancelSuccessMessage') 
        } 
      })
    } catch (error) {
      console.error('Error cancelling booking:', error)
      toast.error(t('bookingCancellation.cancelError'))
    } finally {
      setCancelling(false)
      setShowCancelModal(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">{t('common.loading')}</p>
        </div>
      </div>
    )
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {t('bookingCancellation.errorTitle')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {error || t('bookingCancellation.bookingNotFound')}
          </p>
          <button
            onClick={() => navigate('/')}
            className="btn-primary"
          >
            {t('bookingCancellation.backToHome')}
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
              {t('bookingCancellation.title')}
            </h1>
            <LanguageSwitcher />
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Header */}
          <div className="bg-red-50 dark:bg-red-900/20 px-6 py-4 border-b border-red-200 dark:border-red-800">
            <div className="flex items-center">
              <X className="h-6 w-6 text-red-600 dark:text-red-400 mr-3" />
              <div>
                <h2 className="text-lg font-semibold text-red-900 dark:text-red-100">
                  {t('bookingCancellation.warningTitle')}
                </h2>
                <p className="text-sm text-red-700 dark:text-red-300">
                  {t('bookingCancellation.warningMessage')}
                </p>
              </div>
            </div>
          </div>

          {/* Booking Details */}
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {t('bookingCancellation.bookingDetails')}
            </h3>
            
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      {t('bookingConfirmation.date')}
                    </p>
                    <p className="text-gray-900 dark:text-white">
                      {format(new Date(booking.start_time), 'EEEE, MMMM dd, yyyy')}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Clock className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      {t('bookingConfirmation.time')}
                    </p>
                    <p className="text-gray-900 dark:text-white">
                      {format(new Date(booking.start_time), 'h:mm a')} - {format(new Date(booking.end_time), 'h:mm a')}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <User className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      {t('bookingConfirmation.eventType')}
                    </p>
                    <p className="text-gray-900 dark:text-white">
                      {booking.event_types?.title || 'Appointment'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Clock className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      {t('bookingConfirmation.duration')}
                    </p>
                    <p className="text-gray-900 dark:text-white">
                      {booking.event_types?.duration || 0} {t('common.minutes')}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {booking.booker_description && (
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                  {t('bookingConfirmation.description')}
                </h4>
                <p className="text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                  {booking.booker_description}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleCancelBooking}
                disabled={cancelling}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center"
              >
                {cancelling ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    {t('bookingCancellation.cancelling')}
                  </>
                ) : (
                  <>
                    <X className="h-5 w-5 mr-2" />
                    {t('bookingCancellation.cancelBooking')}
                  </>
                )}
              </button>
              
              <button
                onClick={() => navigate('/')}
                className="flex-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-900 dark:text-white font-medium py-3 px-6 rounded-lg transition-colors"
              >
                {t('bookingCancellation.keepBooking')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={confirmCancelBooking}
        title={t('bookingCancellation.confirmTitle')}
        message={t('bookingCancellation.confirmMessage', {
          eventType: booking.event_types?.title || 'Appointment',
          date: format(new Date(booking.start_time), 'MMMM dd, yyyy'),
          time: format(new Date(booking.start_time), 'h:mm a')
        })}
        confirmText={t('bookingCancellation.cancelBooking')}
        cancelText={t('bookingCancellation.keepBooking')}
        type="danger"
        loading={cancelling}
      />
    </div>
  )
}

export default BookingCancellationPage
