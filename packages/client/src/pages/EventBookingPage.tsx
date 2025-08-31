import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import { Calendar, Clock, ArrowLeft, Check } from 'lucide-react'
import { format, addDays, startOfWeek, addWeeks, isSameDay, parseISO } from 'date-fns'
import type { EventType, Profile, AvailabilityRules } from '../lib/supabase'
import LanguageSwitcher from '../components/LanguageSwitcher'

interface AvailableTimeSlot {
  date: Date
  time: string
  endTime: string
  isBooked: boolean
}

function EventBookingPage() {
  const { alias, eventTypeId } = useParams<{ alias: string; eventTypeId: string }>()
  const { t } = useTranslation()
  const navigate = useNavigate()
  
  const [profile, setProfile] = useState<Profile | null>(null)
  const [eventType, setEventType] = useState<EventType | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [currentWeek, setCurrentWeek] = useState(new Date())
  const [availableSlots, setAvailableSlots] = useState<AvailableTimeSlot[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)

  useEffect(() => {
    if (alias && eventTypeId) {
      fetchEventData()
    }
  }, [alias, eventTypeId])

  useEffect(() => {
    if (selectedDate && eventType) {
      fetchAvailableSlots()
    }
  }, [selectedDate, eventType])

  const fetchEventData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch profile by alias
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('alias', alias)
        .single()

      if (profileError) throw profileError
      setProfile(profileData)

      // Fetch event type
      const { data: eventTypeData, error: eventTypeError } = await supabase
        .from('event_types')
        .select('*')
        .eq('id', eventTypeId)
        .eq('user_id', profileData.id)
        .single()

      if (eventTypeError) throw eventTypeError
      setEventType(eventTypeData)

    } catch (error) {
      console.error('Error fetching event data:', error)
      setError(t('booking.loadError'))
    } finally {
      setLoading(false)
    }
  }

  const fetchAvailableSlots = async () => {
    if (!selectedDate || !eventType) return

    try {
      setLoadingSlots(true)
      
      const dayOfWeek = format(selectedDate, 'EEEE').toLowerCase()
      const availabilityRules = eventType.availability_rules as AvailabilityRules
      const daySlots = availabilityRules[dayOfWeek] || []

      if (daySlots.length === 0) {
        setAvailableSlots([])
        return
      }

      // Get existing bookings for this date and event type
      const startOfDay = new Date(selectedDate)
      startOfDay.setHours(0, 0, 0, 0)
      const endOfDay = new Date(selectedDate)
      endOfDay.setHours(23, 59, 59, 999)

      const { data: existingBookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('start_time, end_time')
        .eq('event_type_id', eventTypeId)
        .eq('status', 'confirmed')
        .gte('start_time', startOfDay.toISOString())
        .lte('start_time', endOfDay.toISOString())

      if (bookingsError) throw bookingsError

      // Generate all time slots (both available and booked)
      const slots: AvailableTimeSlot[] = []
      const duration = eventType.duration

      daySlots.forEach(timeSlot => {
        const startTime = parseISO(`2000-01-01T${timeSlot.from}`)
        const endTime = parseISO(`2000-01-01T${timeSlot.to}`)
        
        let currentTime = new Date(startTime)
        
        while (currentTime < endTime) {
          const slotEndTime = new Date(currentTime.getTime() + duration * 60000)
          
          if (slotEndTime <= endTime) {
            const slotDate = new Date(selectedDate)
            slotDate.setHours(currentTime.getHours(), currentTime.getMinutes(), 0, 0)
            
            const slotEndDate = new Date(selectedDate)
            slotEndDate.setHours(slotEndTime.getHours(), slotEndTime.getMinutes(), 0, 0)
            
            // Check if this slot conflicts with existing bookings
            const isBooked = existingBookings?.some(booking => {
              const bookingStart = new Date(booking.start_time)
              const bookingEnd = new Date(booking.end_time)
              
              return (
                (slotDate >= bookingStart && slotDate < bookingEnd) ||
                (slotEndDate > bookingStart && slotEndDate <= bookingEnd) ||
                (slotDate <= bookingStart && slotEndDate >= bookingEnd)
              )
            }) || false

            // Add all slots (both available and booked)
            slots.push({
              date: slotDate,
              time: format(slotDate, 'h:mm a'),
              endTime: format(slotEndDate, 'h:mm a'),
              isBooked
            })
          }
          
          currentTime = new Date(currentTime.getTime() + 30 * 60000) // 30-minute intervals
        }
      })

      setAvailableSlots(slots)
    } catch (error) {
      console.error('Error fetching available slots:', error)
      setAvailableSlots([])
    } finally {
      setLoadingSlots(false)
    }
  }

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date)
    setSelectedTime(null)
  }

  const handleTimeSelect = (time: string) => {
    const slot = availableSlots.find(s => s.time === time)
    if (slot && !slot.isBooked) {
      setSelectedTime(time)
    }
  }

  const handleContinue = () => {
    if (selectedDate && selectedTime) {
      const selectedSlot = availableSlots.find(slot => slot.time === selectedTime)
      if (selectedSlot) {
        navigate(`/${alias}/${eventTypeId}/confirmation`, {
          state: {
            date: selectedSlot.date,
            time: selectedSlot.time,
            endTime: selectedSlot.endTime,
            eventType: eventType,
            profile: profile
          }
        })
      }
    }
  }

  const getWeekDates = () => {
    const start = startOfWeek(currentWeek, { weekStartsOn: 1 })
    const dates = []
    
    for (let i = 0; i < 7; i++) {
      dates.push(addDays(start, i))
    }
    
    return dates
  }

  const isDateAvailable = (date: Date) => {
    if (!eventType) return false
    
    const dayOfWeek = format(date, 'EEEE').toLowerCase()
    const availabilityRules = eventType.availability_rules as AvailabilityRules
    const daySlots = availabilityRules[dayOfWeek] || []
    
    // Check if the day has any availability rules
    if (daySlots.length === 0) return false
    
    // For dates in the past, mark as unavailable
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (date < today) return false
    
    return true
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (error || !profile || !eventType) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Calendar className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Event Not Found</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            {error || 'The event you are looking for could not be found.'}
          </p>
          <button
            onClick={() => navigate(`/${alias}`)}
            className="btn-primary"
          >
            Go Back
          </button>
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
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(`/${alias}`)}
                className="text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-100"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('booking.title')}</h1>
                <p className="text-gray-600 dark:text-gray-300">{t('booking.with', { name: profile.full_name })}</p>
              </div>
            </div>
            <LanguageSwitcher />
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          {/* Event Type Info */}
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-6 text-white">
            <h2 className="text-2xl font-bold">{eventType.title}</h2>
            <div className="flex items-center space-x-4 mt-2">
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-2" />
                {eventType.duration} {t('common.minutes')}
              </div>
            </div>
            {eventType.description && (
              <p className="text-primary-100 mt-2">{eventType.description}</p>
            )}
          </div>

          <div className="p-6">
            {/* Calendar */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">{t('booking.selectDate')}</h3>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setCurrentWeek(addWeeks(currentWeek, -1))}
                    className="p-2 text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-100"
                  >
                    ←
                  </button>
                  <button
                    onClick={() => setCurrentWeek(new Date())}
                    className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                  >
                    {t('common.today')}
                  </button>
                  <button
                    onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}
                    className="p-2 text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-100"
                  >
                    →
                  </button>
                </div>
              </div>
              
              {/* Calendar Legend */}
              <div className="flex items-center justify-center space-x-4 mb-4 text-xs">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                  <span className="text-gray-500 dark:text-gray-400">Has time slots</span>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-1">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                  <div key={day} className="text-center text-sm font-medium text-gray-500 dark:text-gray-400 py-2">
                    {day}
                  </div>
                ))}
                
                {getWeekDates().map((date) => {
                  const isAvailable = isDateAvailable(date)
                  const isSelected = selectedDate && isSameDay(date, selectedDate)
                  const isToday = isSameDay(date, new Date())
                  
                  return (
                    <button
                      key={date.toISOString()}
                      onClick={() => isAvailable && handleDateSelect(date)}
                      disabled={!isAvailable}
                      className={`
                        p-3 text-sm rounded-lg transition-colors relative
                        ${isAvailable 
                          ? 'hover:bg-primary-50 dark:hover:bg-primary-900/20 cursor-pointer text-gray-900 dark:text-gray-100' 
                          : 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                        }
                        ${isSelected ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-900 dark:text-primary-100' : ''}
                        ${isToday ? 'ring-2 ring-primary-300 dark:ring-primary-400' : ''}
                      `}
                    >
                      {format(date, 'd')}
                      {/* Show indicator if date has some booked slots */}
                      {isAvailable && (
                        <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full opacity-75"></div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Time Slots */}
            {selectedDate && (
              <div className="mb-8">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  {t('booking.selectTime', { date: format(selectedDate, 'EEEE, MMMM d, yyyy') })}
                </h3>
                
                {/* Slot Summary */}
                {availableSlots.length > 0 && (
                  <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-300">
                        {availableSlots.filter(slot => !slot.isBooked).length} {t('booking.availableSlots')}
                      </span>
                      <span className="text-gray-500 dark:text-gray-400">
                        {availableSlots.filter(slot => slot.isBooked).length} {t('booking.bookedSlots')}
                      </span>
                    </div>
                  </div>
                )}
                
                {loadingSlots ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                  </div>
                ) : availableSlots.length > 0 ? (
                  <>
                    {/* Legend */}
                    <div className="flex items-center justify-center space-x-6 mb-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded"></div>
                        <span className="text-gray-600 dark:text-gray-400">{t('booking.available')}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded"></div>
                        <span className="text-gray-400 dark:text-gray-500">{t('booking.booked')}</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {availableSlots.map((slot, index) => (
                        <button
                          key={index}
                          onClick={() => !slot.isBooked && handleTimeSelect(slot.time)}
                          disabled={slot.isBooked}
                          className={`
                            p-4 text-center rounded-lg border transition-colors relative
                            ${slot.isBooked
                              ? 'border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 cursor-not-allowed opacity-75'
                              : selectedTime === slot.time
                                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 text-primary-900 dark:text-primary-100'
                                : 'border-gray-200 dark:border-gray-600 hover:border-primary-300 dark:hover:border-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 text-gray-900 dark:text-gray-100'
                            }
                          `}
                        >
                          <div className="font-medium">{slot.time}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">to {slot.endTime}</div>
                          {slot.isBooked && (
                            <div className="absolute top-2 right-2">
                              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <Clock className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">{t('booking.noTimeSlotsAvailable')}</p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">{t('booking.tryDifferentDate')}</p>
                  </div>
                )}
              </div>
            )}

            {/* Continue Button */}
            {selectedDate && selectedTime && (
              <div className="border-t border-gray-200 dark:border-gray-600 pt-6">
                {(() => {
                  const selectedSlot = availableSlots.find(slot => slot.time === selectedTime)
                  const canContinue = selectedSlot && !selectedSlot.isBooked
                  
                  return canContinue ? (
                    <button
                      onClick={handleContinue}
                      className="btn-primary w-full flex items-center justify-center"
                    >
                      <Check className="w-4 h-4 mr-2" />
                      {t('booking.continueToConfirmation')}
                    </button>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-sm text-red-600 dark:text-red-400">
                        {t('booking.selectAvailableTimeToContinue')}
                      </p>
                    </div>
                  )
                })()}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default EventBookingPage
