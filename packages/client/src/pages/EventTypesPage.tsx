import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import { toast } from 'react-hot-toast'
import { Calendar, Plus, Edit, Trash2, Clock, Settings } from 'lucide-react'
import type { EventType, AvailabilityRules, CustomQuestion } from '../lib/supabase'

interface EventTypeFormData {
  title: string
  duration: number
  description: string
  availability_rules: AvailabilityRules
  custom_questions: CustomQuestion[]
}

function EventTypesPage() {
  const { user } = useAuth()
  const { t } = useTranslation()
  const [eventTypes, setEventTypes] = useState<EventType[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingEventType, setEditingEventType] = useState<EventType | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  const [formData, setFormData] = useState<EventTypeFormData>({
    title: '',
    duration: 30,
    description: '',
    availability_rules: {
      monday: [],
      tuesday: [],
      wednesday: [],
      thursday: [],
      friday: [],
      saturday: [],
      sunday: []
    },
    custom_questions: []
  })

  const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

  useEffect(() => {
    if (user) {
      fetchEventTypes()
    }
  }, [user])

  const fetchEventTypes = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('event_types')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setEventTypes(data || [])
    } catch (error) {
      console.error('Error fetching agendas:', error)
      toast.error(t('eventTypes.form.loadError'))
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      duration: 30,
      description: '',
      availability_rules: {
        monday: [],
        tuesday: [],
        wednesday: [],
        thursday: [],
        friday: [],
        saturday: [],
        sunday: []
      },
      custom_questions: []
    })
    setEditingEventType(null)
    setShowForm(false)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'duration' ? parseInt(value) : value
    }))
  }

  const toggleDayAvailability = (day: string) => {
    setFormData(prev => ({
      ...prev,
      availability_rules: {
        ...prev.availability_rules,
        [day]: prev.availability_rules[day].length > 0 ? [] : [{ from: '09:00', to: '17:00' }]
      }
    }))
  }

  const addTimeSlot = (day: string) => {
    setFormData(prev => ({
      ...prev,
      availability_rules: {
        ...prev.availability_rules,
        [day]: [...prev.availability_rules[day], { from: '09:00', to: '17:00' }]
      }
    }))
  }

  const removeTimeSlot = (day: string, index: number) => {
    setFormData(prev => ({
      ...prev,
      availability_rules: {
        ...prev.availability_rules,
        [day]: prev.availability_rules[day].filter((_, i) => i !== index)
      }
    }))
  }

  const updateTimeSlot = (day: string, index: number, field: 'from' | 'to', value: string) => {
    setFormData(prev => ({
      ...prev,
      availability_rules: {
        ...prev.availability_rules,
        [day]: prev.availability_rules[day].map((slot, i) => 
          i === index ? { ...slot, [field]: value } : slot
        )
      }
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
         if (!formData.title.trim()) {
       toast.error(t('eventTypes.validation.titleRequired'))
       return
     }

     if (formData.duration < 15 || formData.duration > 480) {
       toast.error(t('eventTypes.validation.durationRange'))
       return
     }

     // Check if at least one day has availability
     const hasAvailability = Object.values(formData.availability_rules).some(day => day.length > 0)
     if (!hasAvailability) {
       toast.error(t('eventTypes.validation.availabilityRequired'))
       return
     }

    try {
      setSaving(true)
      
      if (editingEventType) {
        // Update existing event type
        const { error } = await supabase
          .from('event_types')
          .update({
            title: formData.title.trim(),
            duration: formData.duration,
            description: formData.description.trim(),
            availability_rules: formData.availability_rules,
            custom_questions: formData.custom_questions
          })
          .eq('id', editingEventType.id)

                 if (error) throw error
         toast.success(t('eventTypes.messages.updateSuccess'))
       } else {
         // Create new event type
         const { error } = await supabase
           .from('event_types')
           .insert([{
             user_id: user?.id,
             title: formData.title.trim(),
             duration: formData.duration,
             description: formData.description.trim(),
             availability_rules: formData.availability_rules,
             custom_questions: formData.custom_questions
           }])

         if (error) throw error
         toast.success(t('eventTypes.messages.createSuccess'))
       }

      resetForm()
      fetchEventTypes()
         } catch (error) {
       console.error('Error saving event type:', error)
       toast.error(t('eventTypes.messages.saveError'))
     } finally {
      setSaving(false)
    }
  }

  const handleEdit = (eventType: EventType) => {
    setEditingEventType(eventType)
    setFormData({
      title: eventType.title,
      duration: eventType.duration,
      description: eventType.description || '',
      availability_rules: eventType.availability_rules,
      custom_questions: eventType.custom_questions || []
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
         if (!confirm(t('eventTypes.messages.confirmDelete'))) {
       return
     }

    try {
      setDeleting(id)
      const { error } = await supabase
        .from('event_types')
        .delete()
        .eq('id', id)

      if (error) throw error
      
               toast.success(t('eventTypes.messages.deleteSuccess'))
         fetchEventTypes()
       } catch (error) {
         console.error('Error deleting event type:', error)
         toast.error(t('eventTypes.messages.deleteError'))
       } finally {
      setDeleting(null)
    }
  }

  const addQuestion = () => {
    const newQuestion: CustomQuestion = {
      id: Date.now().toString(),
      question: '',
      type: 'text',
      required: false,
      options: []
    }
    setFormData(prev => ({
      ...prev,
      custom_questions: [...prev.custom_questions, newQuestion]
    }))
  }

  const removeQuestion = (index: number) => {
    setFormData(prev => ({
      ...prev,
      custom_questions: prev.custom_questions.filter((_, i) => i !== index)
    }))
  }

  const updateQuestion = (index: number, field: keyof CustomQuestion, value: any) => {
    setFormData(prev => ({
      ...prev,
      custom_questions: prev.custom_questions.map((q, i) => {
        if (i === index) {
          const updatedQuestion = { ...q, [field]: value }
          
          // If changing to radio or checkbox type and no options exist, initialize with one empty option
          if (field === 'type' && (value === 'radio' || value === 'checkbox') && (!updatedQuestion.options || updatedQuestion.options.length === 0)) {
            updatedQuestion.options = ['']
          }
          
          // If changing away from radio/checkbox, clear options
          if (field === 'type' && value === 'text') {
            updatedQuestion.options = []
          }
          
          return updatedQuestion
        }
        return q
      })
    }))
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
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('eventTypes.title')}</h1>
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          {t('eventTypes.createButton')}
        </button>
      </div>

      {/* Agendas List */}
      {eventTypes.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {eventTypes.map((eventType) => (
            <div key={eventType.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">{eventType.title}</h3>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(eventType)}
                    className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(eventType.id)}
                    disabled={deleting === eventType.id}
                    className="text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 disabled:opacity-50"
                  >
                    {deleting === eventType.id ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                  <Clock className="w-4 h-4 mr-2" />
                  {eventType.duration} {t('common.minutes')}
                </div>
                
                {eventType.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-300">{eventType.description}</p>
                )}
                
                <div className="pt-3 border-t border-gray-200 dark:border-gray-600">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('eventTypes.form.availability')}</h4>
                  <div className="space-y-1">
                    {daysOfWeek.map(day => {
                      const daySlots = eventType.availability_rules[day] || []
                      if (daySlots.length === 0) return null
                      
                      return (
                        <div key={day} className="text-xs text-gray-500 dark:text-gray-400">
                          <span className="capitalize">{day}:</span>
                          {daySlots.map((slot, index) => {
                            const formatTimeToAMPM = (time: string) => {
                              const [hour, minute] = time.split(':')
                              const hourNum = parseInt(hour)
                              const ampm = hourNum >= 12 ? 'PM' : 'AM'
                              const displayHour = hourNum === 0 ? 12 : (hourNum > 12 ? hourNum - 12 : hourNum)
                              return `${displayHour}:${minute} ${ampm}`
                            }
                            
                            return (
                              <span key={index} className="ml-2">
                                {formatTimeToAMPM(slot.from)}-{formatTimeToAMPM(slot.to)}
                                {index < daySlots.length - 1 ? ', ' : ''}
                              </span>
                            )
                          })}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Calendar className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">{t('eventTypes.noEventTypes')}</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            {t('eventTypes.noEventTypesDesc')}
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary"
          >
            {t('eventTypes.createButton')}
          </button>
        </div>
      )}

      {/* Create/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 dark:bg-gray-900 dark:bg-opacity-75 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white dark:bg-gray-800 dark:border-gray-600">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                {editingEventType ? t('eventTypes.editButton') : t('eventTypes.createButton')}
              </h3>
              <button
                onClick={resetForm}
                className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded"
                aria-label="Close modal"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('eventTypes.form.title')} *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  className="input-field"
                  placeholder="e.g., 30-Minute Counseling Session"
                />
              </div>

              {/* Duration */}
              <div>
                <label htmlFor="duration" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('eventTypes.form.duration')} *
                </label>
                <select
                  id="duration"
                  name="duration"
                  value={formData.duration}
                  onChange={handleInputChange}
                  required
                  className="input-field"
                >
                  <option value={15} className="bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">{t('eventTypes.form.durationOptions.15min')}</option>
                  <option value={30} className="bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">{t('eventTypes.form.durationOptions.30min')}</option>
                  <option value={45} className="bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">{t('eventTypes.form.durationOptions.45min')}</option>
                  <option value={60} className="bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">{t('eventTypes.form.durationOptions.1hour')}</option>
                  <option value={90} className="bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">{t('eventTypes.form.durationOptions.1.5hours')}</option>
                  <option value={120} className="bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">{t('eventTypes.form.durationOptions.2hours')}</option>
                  <option value={180} className="bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">{t('eventTypes.form.durationOptions.3hours')}</option>
                  <option value={300} className="bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">{t('eventTypes.form.durationOptions.5hours')}</option>
                  <option value={480} className="bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">{t('eventTypes.form.durationOptions.8hours')}</option>
                </select>
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('eventTypes.form.description')}
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="input-field"
                  placeholder="Describe what this appointment type is about..."
                />
              </div>

              {/* Availability Rules */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                  {t('eventTypes.form.availability')} *
                </label>
                <div className="space-y-4">
                  {daysOfWeek.map(day => (
                    <div key={day} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.availability_rules[day].length > 0}
                            onChange={() => toggleDayAvailability(day)}
                            className="rounded border-gray-300 dark:border-gray-500 text-primary-600 focus:ring-primary-500 dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                          />
                          <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                            {day}
                          </span>
                        </label>
                        {formData.availability_rules[day].length > 0 && (
                          <button
                            type="button"
                            onClick={() => addTimeSlot(day)}
                            className="text-sm text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
                          >
                            + {t('eventTypes.form.addTimeSlot')}
                          </button>
                        )}
                      </div>
                      
                      {formData.availability_rules[day].length > 0 && (
                        <div className="space-y-2">
                          {formData.availability_rules[day].map((slot, index) => (
                            <div key={index} className="flex items-center space-x-2">
                              <div className="flex-1 flex items-center space-x-2">
                                <select
                                  value={Math.floor(parseInt(slot.from.split(':')[0]) % 12) || 12}
                                  onChange={(e) => {
                                    const hour = parseInt(e.target.value)
                                    const minute = slot.from.split(':')[1]
                                    const ampm = parseInt(slot.from.split(':')[0]) >= 12 ? 'PM' : 'AM'
                                    const newHour = ampm === 'PM' ? (hour === 12 ? 12 : hour + 12) : (hour === 12 ? 0 : hour)
                                    const newTime = `${newHour.toString().padStart(2, '0')}:${minute}`
                                    updateTimeSlot(day, index, 'from', newTime)
                                  }}
                                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                >
                                  {Array.from({length: 12}, (_, i) => i + 1).map(hour => (
                                    <option key={hour} value={hour} className="bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                                      {hour}
                                    </option>
                                  ))}
                                </select>
                                <span className="text-gray-500 dark:text-gray-400">:</span>
                                <select
                                  value={slot.from.split(':')[1]}
                                  onChange={(e) => {
                                    const hour = slot.from.split(':')[0]
                                    const newTime = `${hour}:${e.target.value}`
                                    updateTimeSlot(day, index, 'from', newTime)
                                  }}
                                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                >
                                  {Array.from({length: 60}, (_, i) => i).map(minute => (
                                    <option key={minute} value={minute.toString().padStart(2, '0')} className="bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                                      {minute.toString().padStart(2, '0')}
                                    </option>
                                  ))}
                                </select>
                                <select
                                  value={parseInt(slot.from.split(':')[0]) >= 12 ? 'PM' : 'AM'}
                                  onChange={(e) => {
                                    const [hour, minute] = slot.from.split(':')
                                    const currentHour = parseInt(hour)
                                    let newHour
                                    if (e.target.value === 'PM') {
                                      newHour = currentHour >= 12 ? currentHour : currentHour + 12
                                    } else {
                                      newHour = currentHour >= 12 ? currentHour - 12 : currentHour
                                    }
                                    if (newHour === 0) newHour = 12
                                    if (newHour === 24) newHour = 12
                                    const newTime = `${newHour.toString().padStart(2, '0')}:${minute}`
                                    updateTimeSlot(day, index, 'from', newTime)
                                  }}
                                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                >
                                  <option value="AM" className="bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">AM</option>
                                  <option value="PM" className="bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">PM</option>
                                </select>
                              </div>
                              <span className="text-gray-500 dark:text-gray-400">{t('common.to')}</span>
                              <div className="flex-1 flex items-center space-x-2">
                                <select
                                  value={Math.floor(parseInt(slot.to.split(':')[0]) % 12) || 12}
                                  onChange={(e) => {
                                    const hour = parseInt(e.target.value)
                                    const minute = slot.to.split(':')[1]
                                    const ampm = parseInt(slot.to.split(':')[0]) >= 12 ? 'PM' : 'AM'
                                    const newHour = ampm === 'PM' ? (hour === 12 ? 12 : hour + 12) : (hour === 12 ? 0 : hour)
                                    const newTime = `${newHour.toString().padStart(2, '0')}:${minute}`
                                    updateTimeSlot(day, index, 'to', newTime)
                                  }}
                                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                >
                                  {Array.from({length: 12}, (_, i) => i + 1).map(hour => (
                                    <option key={hour} value={hour} className="bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                                      {hour}
                                    </option>
                                  ))}
                                </select>
                                <span className="text-gray-500 dark:text-gray-400">:</span>
                                <select
                                  value={slot.to.split(':')[1]}
                                  onChange={(e) => {
                                    const hour = slot.to.split(':')[0]
                                    const newTime = `${hour}:${e.target.value}`
                                    updateTimeSlot(day, index, 'to', newTime)
                                  }}
                                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                >
                                  {Array.from({length: 60}, (_, i) => i).map(minute => (
                                    <option key={minute} value={minute.toString().padStart(2, '0')} className="bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                                      {minute.toString().padStart(2, '0')}
                                    </option>
                                  ))}
                                </select>
                                <select
                                  value={parseInt(slot.to.split(':')[0]) >= 12 ? 'PM' : 'AM'}
                                  onChange={(e) => {
                                    const [hour, minute] = slot.to.split(':')
                                    const currentHour = parseInt(hour)
                                    let newHour
                                    if (e.target.value === 'PM') {
                                      newHour = currentHour >= 12 ? currentHour : currentHour + 12
                                    } else {
                                      newHour = currentHour >= 12 ? currentHour - 12 : currentHour
                                    }
                                    if (newHour === 0) newHour = 12
                                    if (newHour === 24) newHour = 12
                                    const newTime = `${newHour.toString().padStart(2, '0')}:${minute}`
                                    updateTimeSlot(day, index, 'to', newTime)
                                  }}
                                  className="px-3 py-2 border border-gray-300 dark:border-gray-700 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                >
                                  <option value="AM" className="bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">AM</option>
                                  <option value="PM" className="bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">PM</option>
                                </select>
                              </div>
                              {formData.availability_rules[day].length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeTimeSlot(day, index)}
                                  className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                                >
                                  ×
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Custom Questions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                  {t('eventTypes.form.customQuestions')}
                </label>
                <div className="space-y-4">
                  {formData.custom_questions.map((question, index) => (
                    <div key={question.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {t('eventTypes.form.question')} {index + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeQuestion(index)}
                          className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-sm"
                        >
                          {t('eventTypes.form.removeTimeSlot')}
                        </button>
                      </div>
                      
                      <div className="space-y-3">
                        <input
                          type="text"
                          value={question.question}
                          onChange={(e) => updateQuestion(index, 'question', e.target.value)}
                          placeholder="Enter your question"
                          className="input-field"
                        />
                        
                        <div className="flex items-center space-x-4">
                          <select
                            value={question.type}
                            onChange={(e) => updateQuestion(index, 'type', e.target.value as 'text' | 'radio' | 'checkbox')}
                            className="input-field flex-1"
                          >
                            <option value="text" className="bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">{t('eventTypes.form.type')} input</option>
                            <option value="radio" className="bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">{t('eventTypes.form.singleChoice')}</option>
                            <option value="checkbox" className="bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">{t('eventTypes.form.multipleChoice')}</option>
                          </select>
                          
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={question.required}
                              onChange={(e) => updateQuestion(index, 'required', e.target.checked)}
                              className="rounded border-gray-300 dark:border-gray-500 text-primary-600 focus:ring-primary-500 dark:bg-gray-700 dark:text-gray-100"
                            />
                            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">{t('eventTypes.form.required')}</span>
                          </label>
                        </div>
                        
                        {(question.type === 'radio' || question.type === 'checkbox') && (
                          <div className="space-y-3">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                              {t('eventTypes.form.options')}
                            </label>
                            <div className="space-y-2">
                              {question.options?.map((option, optionIndex) => (
                                <div key={optionIndex} className="flex items-center space-x-2">
                                  <input
                                    type="text"
                                    value={option}
                                    onChange={(e) => {
                                      const newOptions = [...(question.options || [])]
                                      newOptions[optionIndex] = e.target.value
                                      updateQuestion(index, 'options', newOptions)
                                    }}
                                    className="input-field flex-1"
                                    placeholder={`Option ${optionIndex + 1}`}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newOptions = question.options?.filter((_, i) => i !== optionIndex) || []
                                      updateQuestion(index, 'options', newOptions)
                                    }}
                                    className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 p-1"
                                    disabled={question.options?.length === 1}
                                  >
                                    ×
                                  </button>
                                </div>
                              ))}
                              <button
                                type="button"
                                onClick={() => {
                                  const newOptions = [...(question.options || []), '']
                                  updateQuestion(index, 'options', newOptions)
                                }}
                                className="text-sm text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
                              >
                                + Add Option
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  <button
                    type="button"
                    onClick={addQuestion}
                    className="w-full p-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:border-primary-400 dark:hover:border-primary-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                  >
                    + {t('eventTypes.form.addQuestion')}
                  </button>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={resetForm}
                  className="btn-secondary"
                >
                  {t('eventTypes.form.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary flex items-center"
                >
                  {saving ? (
                    <>
                                           <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                     {t('common.saving')}
                    </>
                  ) : (
                    <>
                      <Settings className="w-4 h-4 mr-2" />
                      {editingEventType ? t('common.update') : t('common.create')} {t('common.eventType')}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default EventTypesPage
