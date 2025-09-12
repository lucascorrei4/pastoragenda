import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import { customAuth } from '../lib/custom-auth'
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
  const [sharingType, setSharingType] = useState<'public' | 'time_limited'>('time_limited')
  const [expirationHours, setExpirationHours] = useState<number>(0.5) // 30 minutes default
  const [generatedToken, setGeneratedToken] = useState<string>('')
  const [anonymousId, setAnonymousId] = useState<string>('')
  const [hasSaved, setHasSaved] = useState<boolean>(false)

  // Generate a unique sharing token
  const generateSharingToken = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    for (let i = 0; i < 12; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  // Generate anonymous ID
  const generateAnonymousId = () => {
    return `anon-${Math.random().toString(36).substring(2, 15)}`
  }

  // Get the sharing URL based on type - show preview or saved link
  const getSharingUrl = () => {
    if (!sharingSettings) return ''
    
    // Remove "-agenda" suffix if it exists (for backward compatibility)
    const cleanSlug = sharingSettings.public_slug?.replace(/-agenda$/, '') || ''
    
    if (sharingType === 'time_limited') {
      // Always use current state values for time_limited links (never saved values for security)
      if (!anonymousId || !generatedToken) {
        return 'Generating link...'
      }
      
      if (!hasSaved) {
        return `${window.location.origin}/${anonymousId}?token=${generatedToken} (Preview - Click Save to activate)`
      }
      
      return `${window.location.origin}/${anonymousId}?token=${generatedToken}`
    } else {
      // Public links use the pastor's alias
      return `${window.location.origin}/${cleanSlug}`
    }
  }

  useEffect(() => {
    if (user) {
      // Add a small delay to ensure session is fully loaded
      const timer = setTimeout(() => {
        fetchSharingSettings()
      }, 100)
      
      return () => clearTimeout(timer)
    }
  }, [user])

  // Generate new random values when modal opens or settings change
  useEffect(() => {
    if (sharingType === 'time_limited') {
      setGeneratedToken(generateSharingToken())
      setAnonymousId(generateAnonymousId())
      setHasSaved(false) // Mark as not saved when new values are generated
    }
  }, [sharingType, expirationHours]) // Generate new values when type or time changes

  const fetchSharingSettings = async () => {
    try {
      setLoading(true)
      
      // Try edge function first, fallback to direct Supabase call
      try {
        const token = await customAuth.getToken()
        if (token) {
          const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/pastor-sharing-settings`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          })

          if (response.ok) {
            const { data } = await response.json()
            setSharingSettings(data)
            // Initialize sharing type from existing settings
            if (data) {
              setSharingType(data.sharing_type || 'time_limited')
              setHasSaved(true) // Mark as saved if we have existing data
              if (data.token_expires_at) {
                const expiresAt = new Date(data.token_expires_at)
                const now = new Date()
                const hoursUntilExpiry = (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60)
                if (hoursUntilExpiry > 0) {
                  setExpirationHours(hoursUntilExpiry)
                }
              }
              // Don't load existing token/anonymous_id - generate new ones for security
            }
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
            allow_event_types_view: true,
            show_pastor_name: true,
            show_pastor_contact: false,
            sharing_type: 'time_limited' as const,
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
            allow_event_types_view: true,
            show_pastor_name: true,
            show_pastor_contact: false,
            sharing_type: 'time_limited' as const,
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
          sharing_type: 'time_limited' as const,
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
        const token = await customAuth.getToken()
        if (token) {
          const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/pastor-sharing-settings`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              is_public_enabled: sharingSettings.is_public_enabled,
              allow_booking_view: sharingSettings.allow_booking_view,
              allow_event_types_view: sharingSettings.allow_event_types_view,
              show_pastor_name: sharingSettings.show_pastor_name,
              show_pastor_contact: sharingSettings.show_pastor_contact,
              public_slug: sharingSettings.public_slug || await generateSlug(),
              sharing_type: sharingType,
              sharing_token: sharingType === 'time_limited' ? (generatedToken || generateSharingToken()) : null,
              token_expires_at: sharingType === 'time_limited' ? new Date(Date.now() + expirationHours * 60 * 60 * 1000).toISOString() : null,
              anonymous_id: sharingType === 'time_limited' ? (anonymousId || generateAnonymousId()) : null
            })
          })

          if (response.ok) {
            const { data } = await response.json()
            console.log('Edge function save response:', data)
            setSharingSettings(data)
            setHasSaved(true) // Mark as saved after successful save
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
            sharing_type: sharingType,
            sharing_token: sharingType === 'time_limited' ? (generatedToken || generateSharingToken()) : null,
            token_expires_at: sharingType === 'time_limited' ? new Date(Date.now() + expirationHours * 60 * 60 * 1000).toISOString() : null,
            anonymous_id: sharingType === 'time_limited' ? (anonymousId || generateAnonymousId()) : null,
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
            public_slug: sharingSettings.public_slug || await generateSlug(),
            sharing_type: sharingType,
            sharing_token: sharingType === 'time_limited' ? (generatedToken || generateSharingToken()) : null,
            token_expires_at: sharingType === 'time_limited' ? new Date(Date.now() + expirationHours * 60 * 60 * 1000).toISOString() : null,
            anonymous_id: sharingType === 'time_limited' ? (anonymousId || generateAnonymousId()) : null
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

      console.log('Direct Supabase save response:', data)
      setSharingSettings(data)
      setHasSaved(true) // Mark as saved after successful save
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
        return profile.alias.toLowerCase().replace(/\s+/g, '-')
      }
    } catch (error) {
      console.warn('Could not fetch profile for slug generation:', error)
    }
    
    // Fallback to user ID
    return `pastor-${user.id.slice(0, 8)}`
  }

  const copyAgendaLink = () => {
    const url = getSharingUrl()
    if (!url || url === 'Generating link...') return
    
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
                      <EyeOff className="w-5 h-5 text-red-500" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                      {t('sharing.publicAccess')}
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {sharingSettings.is_public_enabled 
                        ? "Your agenda is publicly accessible via the link below"
                        : "Your agenda is private and not accessible to others"
                      }
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
                  <div className={`w-11 h-6 rounded-full peer transition-all duration-200 ${
                    sharingSettings.is_public_enabled 
                      ? 'bg-green-500 peer-focus:ring-4 peer-focus:ring-green-300 dark:peer-focus:ring-green-800' 
                      : 'bg-red-500 peer-focus:ring-4 peer-focus:ring-red-300 dark:peer-focus:ring-red-800'
                  }`}>
                    <div className={`absolute top-[2px] left-[2px] bg-white rounded-full h-5 w-5 transition-all duration-200 ${
                      sharingSettings.is_public_enabled 
                        ? 'translate-x-full' 
                        : 'translate-x-0'
                    }`}></div>
                  </div>
                </label>
              </div>
          </div>

          {/* Sharing Type Selection */}
          {sharingSettings.is_public_enabled && (
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                {t('sharing.sharingType')}
              </h4>
              
              <div className="space-y-4">
                {/* Public (No Expiration) */}
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="sharingType"
                    value="public"
                    checked={sharingType === 'public'}
                    onChange={(e) => setSharingType(e.target.value as 'public' | 'time_limited')}
                    className="w-4 h-4 text-primary-600"
                  />
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {t('sharing.publicPermanent')}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {t('sharing.publicPermanentDesc')}
                    </div>
                  </div>
                </label>

                {/* Time Limited */}
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="sharingType"
                    value="time_limited"
                    checked={sharingType === 'time_limited'}
                    onChange={(e) => setSharingType(e.target.value as 'public' | 'time_limited')}
                    className="w-4 h-4 text-primary-600"
                  />
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {t('sharing.timeLimited')}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {t('sharing.timeLimitedDesc')} Anonymous links are generated automatically.
                    </div>
                  </div>
                </label>
              </div>

              {/* Expiration Options */}
              {sharingType === 'time_limited' && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('sharing.expirationTime')}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: 0.5, label: '30 min' },
                      { value: 1, label: '1 hr' },
                      { value: 4, label: '4 hrs' },
                      { value: 8, label: '8 hrs' },
                      { value: 24, label: '24 hrs' }
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setExpirationHours(option.value)}
                        className={`px-3 py-2 text-sm rounded-md border transition-colors ${
                          expirationHours === option.value
                            ? 'bg-primary-600 text-white border-primary-600'
                            : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

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

          {/* Public Link - Show after save/cancel buttons */}
          {sharingSettings.is_public_enabled && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mt-6">
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
                {getSharingUrl()}
              </div>
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-2">
                {sharingType === 'time_limited' 
                  ? `Share this time-limited link to give temporary access to book appointments. This link will work for ${expirationHours === 0.5 ? '30 minutes' : expirationHours === 1 ? '1 hour' : expirationHours === 4 ? '4 hours' : expirationHours === 8 ? '8 hours' : expirationHours === 24 ? '24 hours' : `${Math.round(expirationHours * 10) / 10} hours`} and then expire automatically.`
                  : 'Share this link with your community to let them view your agenda and book appointments.'
                }
              </p>
              {!hasSaved && (
                <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                  ⚠️ This is a preview link. Click "Save Settings" to activate it and make it accessible.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AgendaSharingSettings
