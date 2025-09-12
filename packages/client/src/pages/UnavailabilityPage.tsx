import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import { toast } from 'react-hot-toast'
import { Ban, Plus, Edit, Trash2, Calendar, Clock, AlertCircle } from 'lucide-react'
import type { UnavailabilityPeriod } from '../lib/supabase'

interface UnavailabilityFormData {
  title: string
  description: string
  start_date: string
  end_date: string
  start_time: string
  end_time: string
  is_all_day: boolean
}

function UnavailabilityPage() {
  const { user } = useAuth()
  const { t } = useTranslation()
  const [periods, setPeriods] = useState<UnavailabilityPeriod[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingPeriod, setEditingPeriod] = useState<UnavailabilityPeriod | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  const [formData, setFormData] = useState<UnavailabilityFormData>({
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    start_time: '09:00',
    end_time: '17:00',
    is_all_day: true
  })

  useEffect(() => {
    if (user) {
      fetchPeriods()
    }
  }, [user])

  const fetchPeriods = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('unavailability_periods')
        .select('*')
        .eq('user_id', user?.id)
        .order('start_date', { ascending: true })

      if (error) throw error
      setPeriods(data || [])
    } catch (error) {
      console.error('Error fetching unavailability periods:', error)
      toast.error(t('unavailability.loadError'))
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      start_date: '',
      end_date: '',
      start_time: '09:00',
      end_time: '17:00',
      is_all_day: true
    })
    setEditingPeriod(null)
    setShowForm(false)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title.trim()) {
      toast.error(t('unavailability.validation.titleRequired'))
      return
    }

    if (!formData.start_date || !formData.end_date) {
      toast.error(t('unavailability.validation.datesRequired'))
      return
    }

    if (new Date(formData.start_date) > new Date(formData.end_date)) {
      toast.error(t('unavailability.validation.endDateAfterStart'))
      return
    }

    try {
      setSaving(true)

      const periodData = {
        user_id: user?.id,
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        start_date: formData.start_date,
        end_date: formData.end_date,
        start_time: formData.is_all_day ? '00:00:00' : formData.start_time,
        end_time: formData.is_all_day ? '23:59:59' : formData.end_time,
        is_all_day: formData.is_all_day
      }

      if (editingPeriod) {
        const { error } = await supabase
          .from('unavailability_periods')
          .update(periodData)
          .eq('id', editingPeriod.id)

        if (error) throw error
        toast.success(t('unavailability.updateSuccess'))
      } else {
        const { error } = await supabase
          .from('unavailability_periods')
          .insert([periodData])

        if (error) throw error
        toast.success(t('unavailability.createSuccess'))
      }

      resetForm()
      fetchPeriods()
    } catch (error) {
      console.error('Error saving unavailability period:', error)
      toast.error(t('unavailability.saveError'))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm(t('unavailability.confirmDelete'))) return

    try {
      setDeleting(id)
      const { error } = await supabase
        .from('unavailability_periods')
        .delete()
        .eq('id', id)

      if (error) throw error
      toast.success(t('unavailability.deleteSuccess'))
      fetchPeriods()
    } catch (error) {
      console.error('Error deleting unavailability period:', error)
      toast.error(t('unavailability.deleteError'))
    } finally {
      setDeleting(null)
    }
  }

  const handleEdit = (period: UnavailabilityPeriod) => {
    setFormData({
      title: period.title,
      description: period.description || '',
      start_date: period.start_date,
      end_date: period.end_date,
      start_time: period.start_time,
      end_time: period.end_time,
      is_all_day: period.is_all_day
    })
    setEditingPeriod(period)
    setShowForm(true)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const formatTime = (timeString: string) => {
    // Convert 24-hour format to 12-hour format
    const [hours, minutes] = timeString.split(':').map(Number)
    const period = hours >= 12 ? 'PM' : 'AM'
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`
  }

  const isActive = (period: UnavailabilityPeriod) => {
    const now = new Date()
    const startDate = new Date(period.start_date)
    const endDate = new Date(period.end_date)
    return now >= startDate && now <= endDate
  }

  const isUpcoming = (period: UnavailabilityPeriod) => {
    const now = new Date()
    const startDate = new Date(period.start_date)
    return startDate > now
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            <Ban className="h-6 w-6 text-primary-600 mr-3" />
            {t('unavailability.title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            {t('unavailability.subtitle')}
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          {t('unavailability.createButton')}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            {editingPeriod ? t('unavailability.editTitle') : t('unavailability.createTitle')}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('unavailability.form.title')} *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder={t('unavailability.form.titlePlaceholder')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('unavailability.form.description')}
                </label>
                <input
                  type="text"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder={t('unavailability.form.descriptionPlaceholder')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('unavailability.form.startDate')} *
                </label>
                <input
                  type="date"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('unavailability.form.endDate')} *
                </label>
                <input
                  type="date"
                  name="end_date"
                  value={formData.end_date}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                name="is_all_day"
                checked={formData.is_all_day}
                onChange={handleInputChange}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                {t('unavailability.form.allDay')}
              </label>
            </div>

            {!formData.is_all_day && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('unavailability.form.startTime')}
                  </label>
                  <input
                    type="time"
                    name="start_time"
                    value={formData.start_time}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('unavailability.form.endTime')}
                  </label>
                  <input
                    type="time"
                    name="end_time"
                    value={formData.end_time}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                {t('common.cancel')}
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
                  t('common.save')
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Periods List */}
      {periods.length > 0 ? (
        <div className="space-y-4">
          {periods.map((period) => (
            <div key={period.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {period.title}
                    </h3>
                    <div className="ml-3 flex items-center">
                      {isActive(period) && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          {t('unavailability.status.active')}
                        </span>
                      )}
                      {isUpcoming(period) && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                          <Clock className="w-3 h-3 mr-1" />
                          {t('unavailability.status.upcoming')}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {period.description && (
                    <p className="text-gray-600 dark:text-gray-300 mb-3">
                      {period.description}
                    </p>
                  )}
                  
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 space-x-4">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      {formatDate(period.start_date)} - {formatDate(period.end_date)}
                    </div>
                    {!period.is_all_day && (
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {formatTime(period.start_time)} - {formatTime(period.end_time)}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => handleEdit(period)}
                    className="p-2 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(period.id)}
                    disabled={deleting === period.id}
                    className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                  >
                    {deleting === period.id ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Ban className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {t('unavailability.noPeriods')}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {t('unavailability.noPeriodsDesc')}
          </p>
        </div>
      )}
    </div>
  )
}

export default UnavailabilityPage
