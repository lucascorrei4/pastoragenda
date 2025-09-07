import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import { toast } from 'react-hot-toast'
import { Share2, Copy, Eye, EyeOff, User, Mail, Settings, Link, CheckCircle, Calendar } from 'lucide-react'
import type { PastorSharingSettings } from '../lib/supabase'

interface AgendaSharingSettingsProps {
  onClose: () => void
}

function AgendaSharingSettings({ onClose }: AgendaSharingSettingsProps) {
  const { user } = useAuth()
  const { t } = useTranslation()
  const [sharingSettings, setSharingSettings] = useState<PastorSharingSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (user) {
      // Add a small delay to ensure session is fully loaded
      const timer = setTimeout(() => {
        fetchSharingSettings()
      }, 100)
      
      return () => clearTimeout(timer)
    }
  }, [user])

  const fetchSharingSettings = async () => {
    try {
      setLoading(true)
      
      // Try edge function first, fallback to direct Supabase call
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/pastor-sharing-settings/settings`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json'
            }
          })

          if (response.ok) {
            const { data } = await response.json()
            setSharingSettings(data)
            return
          }
        }
      } catch (edgeError) {
        console.warn('Edge function failed, falling back to direct Supabase call:', edgeError)
      }

      // Fallback to direct Supabase call
      console.log('Using direct Supabase call for user:', user?.id)
      const { data, error } = await supabase
        .from('pastor_sharing_settings')
        .select('*')
        .eq('pastor_id', user?.id)
        .single()
      
      console.log('Direct Supabase response:', { data, error })

      if (error) {
        // If it's a permission error, create default settings
        if (error.code === 'PGRST301' || error.message.includes('permission') || error.message.includes('406')) {
          console.warn('Permission denied, creating default settings')
          const slug = await generateSlug()
          const defaultSettings = {
            id: '',
            pastor_id: user?.id || '',
            is_public_enabled: false,
            public_slug: slug,
            allow_booking_view: true,
            allow_event_types_view: false,
            show_pastor_name: true,
            show_pastor_contact: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
          setSharingSettings(defaultSettings)
          return
        }
        // If it's a "no rows" error, that's expected for new users
        if (error.code === 'PGRST116') {
          const slug = await generateSlug()
          const defaultSettings = {
            id: '',
            pastor_id: user?.id || '',
            is_public_enabled: false,
            public_slug: slug,
            allow_booking_view: true,
            allow_event_types_view: false,
            show_pastor_name: true,
            show_pastor_contact: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
          setSharingSettings(defaultSettings)
          return
        }
        throw error
      }

      // If no settings exist, create default ones
      if (!data) {
        const slug = await generateSlug()
        const defaultSettings = {
          id: '',
          pastor_id: user?.id || '',
          is_public_enabled: false,
          public_slug: slug,
          allow_booking_view: true,
          allow_event_types_view: false,
          show_pastor_name: true,
          show_pastor_contact: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        setSharingSettings(defaultSettings)
      } else {
        setSharingSettings(data)
      }
    } catch (error) {
      console.error('Error fetching sharing settings:', error)
      toast.error(t('sharing.loadError'))
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!sharingSettings) return

    try {
      setSaving(true)
      
      // Try edge function first, fallback to direct Supabase call
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/pastor-sharing-settings/settings`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              is_public_enabled: sharingSettings.is_public_enabled,
              allow_booking_view: sharingSettings.allow_booking_view,
              allow_event_types_view: sharingSettings.allow_event_types_view,
              show_pastor_name: sharingSettings.show_pastor_name,
              show_pastor_contact: sharingSettings.show_pastor_contact,
              public_slug: sharingSettings.public_slug || await generateSlug()
            })
          })

          if (response.ok) {
            const { data } = await response.json()
            setSharingSettings(data)
            toast.success(t('sharing.saveSuccess'))
            return
          }
        }
      } catch (edgeError) {
        console.warn('Edge function failed, falling back to direct Supabase call:', edgeError)
      }

      // Fallback to direct Supabase call
      let data, error
      
      if (sharingSettings.id) {
        // Update existing settings
        const result = await supabase
          .from('pastor_sharing_settings')
          .update({
            is_public_enabled: sharingSettings.is_public_enabled,
            allow_booking_view: sharingSettings.allow_booking_view,
            allow_event_types_view: sharingSettings.allow_event_types_view,
            show_pastor_name: sharingSettings.show_pastor_name,
            show_pastor_contact: sharingSettings.show_pastor_contact,
            public_slug: sharingSettings.public_slug || await generateSlug()
          })
          .eq('id', sharingSettings.id)
          .select()
          .single()
        data = result.data
        error = result.error
      } else {
        // Insert new settings
        console.log('Inserting new sharing settings for user:', user?.id)
        const result = await supabase
          .from('pastor_sharing_settings')
          .insert({
            pastor_id: user?.id,
            is_public_enabled: sharingSettings.is_public_enabled,
            allow_booking_view: sharingSettings.allow_booking_view,
            allow_event_types_view: sharingSettings.allow_event_types_view,
            show_pastor_name: sharingSettings.show_pastor_name,
            show_pastor_contact: sharingSettings.show_pastor_contact,
            public_slug: sharingSettings.public_slug || await generateSlug()
          })
          .select()
          .single()
        data = result.data
        error = result.error
        console.log('Insert result:', { data, error })
      }

      if (error) {
        // If it's a permission error, show a helpful message
        if (error.code === 'PGRST301' || error.message.includes('permission') || error.message.includes('406')) {
          toast.error('Permission denied. Please try refreshing the page and logging in again.')
          return
        }
        throw error
      }

      setSharingSettings(data)
      toast.success(t('sharing.saveSuccess'))
    } catch (error) {
      console.error('Error saving sharing settings:', error)
      toast.error(t('sharing.saveError'))
    } finally {
      setSaving(false)
    }
  }

  const generateSlug = async () => {
    if (!user) return ''
    
    try {
      // Try to get user's profile to use alias
      const { data: profile } = await supabase
        .from('profiles')
        .select('alias')
        .eq('id', user.id)
        .single()
      
      if (profile?.alias) {
        return `${profile.alias.toLowerCase().replace(/\s+/g, '-')}-agenda`
      }
    } catch (error) {
      console.warn('Could not fetch profile for slug generation:', error)
    }
    
    // Fallback to user ID
    return `pastor-${user.id.slice(0, 8)}-agenda`
  }

  const copyAgendaLink = () => {
    if (!sharingSettings?.public_slug) return
    
    const url = `${window.location.origin}/agenda/${sharingSettings.public_slug}`
    navigator.clipboard.writeText(url).then(() => {
      toast.success(t('sharing.linkCopied'))
    }).catch(() => {
      toast.error(t('sharing.linkCopyError'))
    })
  }

  const updateSetting = (field: keyof PastorSharingSettings, value: any) => {
    setSharingSettings(prev => prev ? { ...prev, [field]: value } : null)
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 dark:bg-gray-900 dark:bg-opacity-75 overflow-y-auto h-full w-full z-50">
        <div className="relative top-4 mx-auto p-6 border w-11/12 md:w-2/3 lg:w-1/2 max-w-2xl shadow-lg rounded-lg bg-white dark:bg-gray-800 dark:border-gray-600 mb-8">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!sharingSettings) {
    return null
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 dark:bg-gray-900 dark:bg-opacity-75 overflow-y-auto h-full w-full z-50">
      <div className="relative top-4 mx-auto p-6 border w-11/12 md:w-2/3 lg:w-1/2 max-w-2xl shadow-lg rounded-lg bg-white dark:bg-gray-800 dark:border-gray-600 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            <Share2 className="w-6 h-6 mr-2" />
            {t('sharing.title')}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-full p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label="Close modal"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-6">
          {/* Public Access Toggle */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex items-center">
                  {sharingSettings.is_public_enabled ? (
                    <Eye className="w-5 h-5 text-green-500" />
                  ) : (
                    <EyeOff className="w-5 h-5 text-gray-400" />
                  )}
                </div>
                <div>
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                    {t('sharing.publicAccess')}
                  </h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t('sharing.publicAccessDesc')}
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={sharingSettings.is_public_enabled}
                  onChange={(e) => updateSetting('is_public_enabled', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
              </label>
            </div>
          </div>

          {/* Public Link */}
          {sharingSettings.is_public_enabled && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-lg font-medium text-blue-900 dark:text-blue-100 flex items-center">
                  <Link className="w-5 h-5 mr-2" />
                  {t('sharing.publicLink')}
                </h4>
                <button
                  onClick={copyAgendaLink}
                  className="btn-secondary flex items-center space-x-2 text-sm"
                >
                  <Copy className="w-4 h-4" />
                  <span>{t('sharing.copyLink')}</span>
                </button>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded border p-3 font-mono text-sm text-gray-700 dark:text-gray-300 break-all">
                {window.location.origin}/agenda/{sharingSettings.public_slug}
              </div>
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-2">
                {t('sharing.linkDescription')}
              </p>
            </div>
          )}

          {/* Privacy Settings */}
          {sharingSettings.is_public_enabled && (
            <div className="space-y-4">
              <h4 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                <Settings className="w-5 h-5 mr-2" />
                {t('sharing.privacySettings')}
              </h4>

              <div className="space-y-3">
                <label className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-5 h-5 text-gray-500" />
                    <div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t('sharing.showBookings')}
                      </span>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {t('sharing.showBookingsDesc')}
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sharingSettings.allow_booking_view}
                      onChange={(e) => updateSetting('allow_booking_view', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                  </label>
                </label>

                <label className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Settings className="w-5 h-5 text-gray-500" />
                    <div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t('sharing.showEventTypes')}
                      </span>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {t('sharing.showEventTypesDesc')}
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sharingSettings.allow_event_types_view}
                      onChange={(e) => updateSetting('allow_event_types_view', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                  </label>
                </label>

                <label className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <User className="w-5 h-5 text-gray-500" />
                    <div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t('sharing.showPastorName')}
                      </span>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {t('sharing.showPastorNameDesc')}
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sharingSettings.show_pastor_name}
                      onChange={(e) => updateSetting('show_pastor_name', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                  </label>
                </label>

                <label className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Mail className="w-5 h-5 text-gray-500" />
                    <div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t('sharing.showContact')}
                      </span>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {t('sharing.showContactDesc')}
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sharingSettings.show_pastor_contact}
                      onChange={(e) => updateSetting('show_pastor_contact', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                  </label>
                </label>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-6 border-t border-gray-200 dark:border-gray-600">
            <button
              onClick={onClose}
              className="btn-secondary px-6 py-3 text-base"
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-primary flex items-center justify-center px-8 py-3 text-base font-semibold"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  {t('common.saving')}
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5 mr-2" />
                  {t('sharing.saveSettings')}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AgendaSharingSettings
