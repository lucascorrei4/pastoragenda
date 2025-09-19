import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { toast } from 'react-hot-toast'
import { Calendar, Clock, ArrowLeft, CheckCircle } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR, enUS, es } from 'date-fns/locale'
import type { EventType, Profile } from '../lib/supabase'
import LanguageSwitcher from '../components/LanguageSwitcher'
import { notificationService } from '../lib/notification-service'
import { pastorNotificationService } from '../lib/pastor-notification-service'

interface LocationState {
  date: Date
  time: string
  endTime: string
  eventType: EventType
  profile: Profile
}

function BookingConfirmationPage() {
  const { alias, eventTypeId } = useParams<{ alias: string; eventTypeId: string }>()
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()

  // Get the correct locale for date formatting
  const getDateLocale = () => {
    switch (i18n.language) {
      case 'pt-BR':
        return ptBR
      case 'es-ES':
        return es
      case 'en-US':
      default:
        return enUS
    }
  }
  
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    booker_name: '',
    booker_email: '',
    booker_description: '',
    booker_phone: '',
    custom_answers: {} as Record<string, any>
  })

  const state = location.state as LocationState

  useEffect(() => {
    if (!state) {
      navigate(`/${alias}/${eventTypeId}`)
    }
  }, [state, navigate, alias, eventTypeId])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleCustomAnswerChange = (questionId: string, value: string | string[]) => {
    setFormData(prev => ({
      ...prev,
      custom_answers: {
        ...prev.custom_answers,
        [questionId]: value
      }
    }))
  }


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.booker_name.trim()) {
      toast.error(t('validation.required', { field: t('bookingConfirmation.fullName') }))
      return
    }

    if (!formData.booker_email.trim()) {
      toast.error(t('validation.required', { field: t('bookingConfirmation.email') }))
      return
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.booker_email)) {
      toast.error(t('validation.email'))
      return
    }

    try {
      setLoading(true)

                    // Create the booking
       const { data: booking, error: bookingError } = await supabase
         .from('bookings')
         .insert([{
           event_type_id: eventTypeId,
           start_time: state.date.toISOString(),
           end_time: new Date(state.date.getTime() + (state.eventType.duration * 60000)).toISOString(),
           booker_name: formData.booker_name.trim(),
           booker_email: formData.booker_email.trim(),
           booker_phone: formData.booker_phone.trim() || null,
           booker_description: formData.booker_description.trim() || null,
           custom_answers: Object.keys(formData.custom_answers).length > 0 ? formData.custom_answers : null,
           status: 'confirmed'
         }])
         .select()
         .single()

      if (bookingError) throw bookingError

      // Send confirmation emails directly (custom auth compatible)
      try {
        // Call the on-booking-created edge function directly
        const { error: emailError } = await supabase.functions.invoke('on-booking-created', {
          body: {
            record: {
              ...booking,
              user_id: state.eventType.user_id // Add user_id for the email function
            },
            old_record: null
          }
        })

        if (emailError) {
          console.error('Error sending confirmation emails:', emailError)
          // Don't throw error - booking was successful, just email failed
        } else {
          console.log('Confirmation emails sent successfully')
        }
      } catch (emailError) {
        console.error('Error calling email function:', emailError)
        // Don't throw error - booking was successful, just email failed
      }

      // Sync with Google Calendar
      try {
        const { error: syncError } = await supabase.functions.invoke('google-calendar-sync', {
          body: {
            action: 'create',
            bookingId: booking.id,
            eventTypeId: eventTypeId,
            userId: state.eventType.user_id
          }
        })

        if (syncError) {
          console.error('Error syncing with Google Calendar:', syncError)
          // Don't throw error - booking was successful, just sync failed
        } else {
          console.log('Booking synced with Google Calendar successfully')
        }
      } catch (syncError) {
        console.error('Error calling Google Calendar sync function:', syncError)
        // Don't throw error - booking was successful, just sync failed
      }

      // Send notifications for appointment creation
      try {
        // Send enhanced notification to pastor about new appointment
        await pastorNotificationService.sendAppointmentBooked(
          {
            id: booking.id,
            bookerName: formData.booker_name.trim(),
            bookerEmail: formData.booker_email.trim(),
            eventTypeName: state.eventType.title,
            appointmentDate: format(state.date, 'MMMM dd, yyyy'),
            appointmentTime: state.time,
            duration: state.eventType.duration,
            description: formData.booker_description.trim() || undefined,
            status: 'confirmed'
          },
          state.profile.email || '',
          state.profile.full_name || 'Pastor'
        )

        // Send confirmation notification to booker (keep existing for now)
        await notificationService.sendAppointmentConfirmationNotification({
          title: 'Appointment Confirmed!',
          body: `Your ${state.eventType.title} appointment is confirmed`,
          bookerName: formData.booker_name.trim(),
          bookerEmail: formData.booker_email.trim(),
          eventTypeName: state.eventType.title,
          appointmentDate: format(state.date, 'MMMM dd, yyyy'),
          appointmentTime: state.time,
          pastorName: state.profile.full_name || 'Pastor',
          pastorEmail: state.profile.email || ''
        })
      } catch (notificationError) {
        console.error('Error sending notifications:', notificationError)
        // Don't fail the booking if notifications fail
      }

      toast.success(t('bookingConfirmation.bookingSuccess'))
      
       // Navigate to success page with booking details
       navigate(`/${alias}/${eventTypeId}/success`, {
         state: {
           booking,
           eventType: state.eventType,
           profile: state.profile,
           date: state.date,
           time: state.time,
           endTime: state.endTime,
           booker_phone: formData.booker_phone.trim() || undefined,
           booker_description: formData.booker_description.trim() || undefined
         }
       })

    } catch (error) {
      console.error('Error creating booking:', error)
      toast.error(t('bookingConfirmation.bookingError'))
    } finally {
      setLoading(false)
    }
  }

  if (!state) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(`/${alias}/${eventTypeId}`)}
                className="text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-100"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('bookingConfirmation.title')}</h1>
                <p className="text-gray-600 dark:text-gray-300">{t('bookingConfirmation.with', { name: state.profile.full_name })}</p>
              </div>
            </div>
            <LanguageSwitcher />
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          {/* Appointment Summary */}
          <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-6 text-white">
            <div className="flex items-center space-x-3 mb-2">
              <CheckCircle className="w-6 h-6" />
              <h2 className="text-2xl font-bold">{t('bookingConfirmation.appointmentSummary')}</h2>
            </div>
            <p className="text-green-100">{t('bookingConfirmation.summarySubtitle')}</p>
          </div>

          <div className="p-6">
            {/* Agenda Info */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">{state.eventType.title}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center text-gray-600 dark:text-gray-300">
                  <Calendar className="w-4 h-4 mr-2" />
                  {format(state.date, 'EEEE, MMMM d, yyyy', { locale: getDateLocale() })}
                </div>
                <div className="flex items-center text-gray-600 dark:text-gray-300">
                  <Clock className="w-4 h-4 mr-2" />
                  {state.time} - {state.endTime} ({state.eventType.duration} {t('common.minutes')})
                </div>
              </div>
              {state.eventType.description && (
                <p className="text-gray-600 dark:text-gray-300 mt-3">{state.eventType.description}</p>
              )}
            </div>

            {/* Booking Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">{t('bookingConfirmation.yourInformation')}</h3>
              
              <div>
                <label htmlFor="booker_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('bookingConfirmation.fullName')} *
                </label>
                <input
                  type="text"
                  id="booker_name"
                  name="booker_name"
                  value={formData.booker_name}
                  onChange={handleInputChange}
                  required
                  className="input-field"
                  placeholder={t('bookingConfirmation.fullNamePlaceholder')}
                />
              </div>

              <div>
                <label htmlFor="booker_email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('bookingConfirmation.email')} *
                </label>
                <input
                  type="email"
                  id="booker_email"
                  name="booker_email"
                  value={formData.booker_email}
                  onChange={handleInputChange}
                  required
                  className="input-field"
                  placeholder={t('bookingConfirmation.emailPlaceholder')}
                />
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {t('bookingConfirmation.emailDescription')}
                </p>
              </div>

              <div>
                <label htmlFor="booker_phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('bookingConfirmation.phone')}
                </label>
                <input
                  type="tel"
                  id="booker_phone"
                  name="booker_phone"
                  value={formData.booker_phone}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder={t('bookingConfirmation.phonePlaceholder')}
                />
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {t('bookingConfirmation.phoneDescription')}
                </p>
              </div>

              <div>
                <label htmlFor="booker_description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('bookingConfirmation.description')}
                </label>
                <textarea
                  id="booker_description"
                  name="booker_description"
                  value={formData.booker_description}
                  onChange={handleInputChange}
                  rows={3}
                  className="input-field"
                  placeholder={t('bookingConfirmation.descriptionPlaceholder')}
                />
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {t('bookingConfirmation.descriptionDescription')}
                </p>
              </div>

               {/* Custom Questions */}
               {state.eventType.custom_questions && state.eventType.custom_questions.length > 0 && (
                 <div>
                   <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                     {t('bookingConfirmation.additionalQuestions')}
                   </label>
                   <div className="space-y-4">
                     {state.eventType.custom_questions.map((question) => (
                       <div key={question.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                         <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                           {question.question}
                           {question.required && <span className="text-red-500 ml-1">*</span>}
                         </label>
                         
                         {question.type === 'text' && (
                           <input
                             type="text"
                             value={formData.custom_answers[question.id] || ''}
                             onChange={(e) => handleCustomAnswerChange(question.id, e.target.value)}
                             required={question.required}
                             className="input-field"
                             placeholder={t('bookingConfirmation.answerPlaceholder')}
                           />
                         )}
                         
                         {question.type === 'radio' && question.options && (
                           <div className="space-y-2">
                             {question.options.map((option, index) => (
                               <label key={index} className="flex items-center">
                                 <input
                                   type="radio"
                                   name={`question_${question.id}`}
                                   value={option}
                                   checked={formData.custom_answers[question.id] === option}
                                   onChange={(e) => handleCustomAnswerChange(question.id, e.target.value)}
                                   required={question.required}
                                   className="mr-2 text-primary-600 focus:ring-primary-500"
                                 />
                                 <span className="text-sm text-gray-700 dark:text-gray-300">{option}</span>
                               </label>
                             ))}
                           </div>
                         )}
                         
                         {question.type === 'checkbox' && question.options && (
                           <div className="space-y-2">
                             {question.options.map((option, index) => (
                               <label key={index} className="flex items-center">
                                 <input
                                   type="checkbox"
                                   value={option}
                                   checked={formData.custom_answers[question.id]?.includes(option) || false}
                                   onChange={(e) => {
                                     const currentAnswers = formData.custom_answers[question.id] || []
                                     if (e.target.checked) {
                                       handleCustomAnswerChange(question.id, [...currentAnswers, option])
                                     } else {
                                       handleCustomAnswerChange(question.id, currentAnswers.filter((a: string) => a !== option))
                                     }
                                   }}
                                   className="mr-2 text-primary-600 focus:ring-primary-500"
                                 />
                                 <span className="text-sm text-gray-700 dark:text-gray-300">{option}</span>
                               </label>
                             ))}
                           </div>
                         )}
                       </div>
                     ))}
                   </div>
                 </div>
               )}

              {/* Important Notes */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-2">{t('bookingConfirmation.importantInfo')}</h4>
                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                  <li>• {t('bookingConfirmation.importantInfoItems.0')}</li>
                  <li>• {t('bookingConfirmation.importantInfoItems.1', { name: state.profile.full_name })}</li>
                  <li>• {t('bookingConfirmation.importantInfoItems.2')}</li>
                </ul>
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full flex items-center justify-center py-3 text-lg"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      {t('bookingConfirmation.bookingAppointment')}
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5 mr-2" />
                      {t('bookingConfirmation.confirmButton')}
                    </>
                  )}
                </button>
              </div>
            </form>


            {/* Back Button */}
            <div className="mt-6 text-center">
              <button
                onClick={() => navigate(`/${alias}/${eventTypeId}`)}
                className="text-gray-500 hover:text-gray-700"
              >
                {t('bookingConfirmation.backToTimeSelection')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BookingConfirmationPage
