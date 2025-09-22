import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import { customAuth } from '../lib/custom-auth'
import { toast } from 'react-hot-toast'
import { User, Save, Upload, ExternalLink, Calendar, Trash2, AlertTriangle } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Profile } from '../lib/supabase'
import GoogleCalendarIntegration from '../components/GoogleCalendarIntegration'

function ProfileSettingsPage() {
  const { user } = useAuth()
  const { t } = useTranslation()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [activeTab, setActiveTab] = useState<'profile' | 'calendar' | 'account'>('profile')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)

  const [formData, setFormData] = useState({
    full_name: '',
    alias: '',
    bio: '',
    avatar_url: ''
  })

  useEffect(() => {
    if (user) {
      fetchProfile()
    }
  }, [user])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // Profile doesn't exist, create one
          await createProfile()
        } else {
          throw error
        }
      } else {
        setProfile(data)
        setFormData({
          full_name: data.full_name || '',
          alias: data.alias || '',
          bio: data.bio || '',
          avatar_url: data.avatar_url || ''
        })
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
      toast.error(t('profile.loadError'))
    } finally {
      setLoading(false)
    }
  }

  const createProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .insert([
          {
            id: user?.id,
            full_name: user?.full_name || '',
            alias: '',
            bio: '',
            avatar_url: ''
          }
        ])
        .select()
        .single()

      if (error) throw error

      setProfile(data)
      setFormData({
        full_name: data.full_name || '',
        alias: data.alias || '',
        bio: data.bio || '',
        avatar_url: data.avatar_url || ''
      })
    } catch (error) {
      console.error('Error creating profile:', error)
      toast.error(t('profile.createError'))
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setUploading(true)

      // Convert file to base64 for storage in database
      const reader = new FileReader()
      reader.onload = async (event) => {
        try {
          const base64String = event.target?.result as string
          
          // Store avatar as base64 in the profiles table
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ 
              avatar_url: base64String,
              updated_at: new Date().toISOString()
            })
            .eq('id', user?.id)

          if (updateError) throw updateError

          setFormData(prev => ({
            ...prev,
            avatar_url: base64String
          }))

          toast.success(t('profile.avatarUploadSuccess'))
        } catch (error) {
          console.error('Error saving avatar:', error)
          toast.error(t('profile.avatarUploadError'))
        } finally {
          setUploading(false)
        }
      }
      
      reader.readAsDataURL(file)
    } catch (error) {
      console.error('Error processing avatar:', error)
      toast.error(t('profile.avatarUploadError'))
      setUploading(false)
    }
  }

  const checkAliasAvailability = async (alias: string): Promise<boolean> => {
    if (!alias) return false

    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('alias', alias)
      .neq('id', user?.id)
      .single()

    if (error && error.code === 'PGRST116') {
      return true // Alias is available
    }

    return !data // Return true if no data found (available)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.full_name.trim()) {
      toast.error(t('profile.fullNameRequired'))
      return
    }

    if (!formData.alias.trim()) {
      toast.error(t('profile.aliasRequired'))
      return
    }

    // Check alias availability
    const isAvailable = await checkAliasAvailability(formData.alias)
    if (!isAvailable) {
      toast.error(t('profile.aliasTaken'))
      return
    }

    try {
      setSaving(true)

      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user?.id,
          full_name: formData.full_name.trim(),
          alias: formData.alias.trim().toLowerCase(),
          bio: formData.bio.trim(),
          avatar_url: formData.avatar_url
        })

      if (error) throw error

      toast.success(t('profile.updateSuccess'))

      // Refresh profile data
      await fetchProfile()
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error(t('profile.updateError'))
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      toast.error(t('profile.deleteAccountConfirmText'))
      return
    }

    try {
      setDeleting(true)

      // Delete all user data in the correct order (respecting foreign key constraints)
      const userId = user?.id
      if (!userId) {
        throw new Error('User ID not found')
      }

      // 1. Delete bookings
      await supabase.from('bookings').delete().eq('user_id', userId)
      
      // 2. Delete event types
      await supabase.from('event_types').delete().eq('user_id', userId)
      
      // 3. Delete unavailability
      await supabase.from('unavailability').delete().eq('user_id', userId)
      
      // 4. Delete notification preferences
      await supabase.from('notification_preferences').delete().eq('user_id', userId)
      
      // 5. Delete device registrations
      await supabase.from('device_registrations').delete().eq('user_id', userId)
      
      // 6. Delete pastor invitations (both sent and received)
      await supabase.from('pastor_invitations').delete().or(`inviter_id.eq.${userId},invitee_id.eq.${userId}`)
      
      // 7. Delete agenda sharing settings
      await supabase.from('agenda_sharing_settings').delete().eq('user_id', userId)
      
      // 8. Delete followed pastors
      await supabase.from('followed_pastors').delete().eq('follower_id', userId)
      
      // 9. Delete profile (this should be last as it might be referenced by other tables)
      await supabase.from('profiles').delete().eq('id', userId)

      toast.success(t('profile.deleteAccountSuccess'))
      
      // Sign out the user
      await customAuth.signOut()
      
      // Redirect to home page
      window.location.href = '/'
      
    } catch (error) {
      console.error('Error deleting account:', error)
      toast.error(t('profile.deleteAccountError'))
    } finally {
      setDeleting(false)
      setShowDeleteConfirm(false)
      setDeleteConfirmText('')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-6">
            {t('profile.title')}
          </h3>

          {/* Tab Navigation */}
          <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
            <nav className="-mb-px flex flex-wrap gap-2 sm:gap-4">
              <button
                onClick={() => setActiveTab('profile')}
                className={`py-3 px-3 sm:px-4 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap flex items-center ${
                  activeTab === 'profile'
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <User className="w-4 h-4 mr-2 flex-shrink-0" />
                <span className="hidden sm:inline">{t('profile.title')}</span>
                <span className="sm:hidden">Profile</span>
              </button>
              <button
                onClick={() => setActiveTab('calendar')}
                className={`py-3 px-3 sm:px-4 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap flex items-center ${
                  activeTab === 'calendar'
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <Calendar className="w-4 h-4 mr-2 flex-shrink-0" />
                <span className="hidden sm:inline">{t('googleCalendar.title')}</span>
                <span className="sm:hidden">Calendar</span>
              </button>
              <button
                onClick={() => setActiveTab('account')}
                className={`py-3 px-3 sm:px-4 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap flex items-center ${
                  activeTab === 'account'
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <Trash2 className="w-4 h-4 mr-2 flex-shrink-0" />
                <span className="hidden sm:inline">{t('profile.account')}</span>
                <span className="sm:hidden">Account</span>
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          {activeTab === 'profile' ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Avatar Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('profile.avatar')}
              </label>
              <div className="flex items-center space-x-4">
                <div className="w-20 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center overflow-hidden" style={{ aspectRatio: '1/1' }}>
                  {formData.avatar_url ? (
                    <img
                      src={formData.avatar_url}
                      alt="Profile"
                      className="w-full h-full object-cover rounded-full"
                      style={{ aspectRatio: '1/1' }}
                    />
                  ) : (
                    <User className="w-10 h-10 text-gray-400 dark:text-gray-500" />
                  )}
                </div>
                <div>
                  <label className="cursor-pointer bg-white dark:bg-gray-700 py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                    <Upload className="w-4 h-4 inline mr-2" />
                    {uploading ? t('profile.uploading') : t('profile.uploadPhoto')}
                    <input
                      type="file"
                      className="sr-only"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      disabled={uploading}
                    />
                  </label>
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    {t('profile.avatarDescription')}
                  </p>
                </div>
              </div>
            </div>

            {/* Full Name */}
            <div>
              <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('profile.fullName')} *
              </label>
              <input
                type="text"
                id="full_name"
                name="full_name"
                value={formData.full_name}
                onChange={handleInputChange}
                required
                className="input-field"
                placeholder={t('profile.fullNamePlaceholder')}
              />
            </div>

            {/* Alias */}
            <div>
              <label htmlFor="alias" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('profile.alias')} *
              </label>
              <div className="flex rounded-md shadow-sm">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-sm">
                  {t('common.domain')}/
                </span>
                <input
                  type="text"
                  id="alias"
                  name="alias"
                  value={formData.alias}
                  onChange={handleInputChange}
                  required
                  className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md border border-gray-300 dark:border-gray-600 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:text-gray-100"
                  placeholder={t('profile.aliasPlaceholder')}
                  pattern="[a-z0-9-]+"
                  title={t('profile.aliasValidation')}
                />
              </div>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {t('profile.aliasDescription')}
              </p>
            </div>

            {/* Bio */}
            <div>
              <label htmlFor="bio" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('profile.bio')}
              </label>
              <textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                rows={4}
                className="input-field"
                placeholder={t('profile.bioPlaceholder')}
              />
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {t('profile.bioDescription')}
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="btn-primary flex items-center"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {t('profile.saving')}
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {t('profile.saveChanges')}
                  </>
                )}
              </button>
            </div>
          </form>
          ) : activeTab === 'calendar' ? (
            <GoogleCalendarIntegration />
          ) : (
            <div className="space-y-6">
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
                <div className="flex items-start">
                  <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400 mr-3 mt-0.5" />
                  <div>
                    <h3 className="text-lg font-medium text-red-800 dark:text-red-200 mb-2">
                      {t('profile.deleteAccount')}
                    </h3>
                    <p className="text-sm text-red-700 dark:text-red-300 mb-4">
                      {t('profile.deleteAccountWarning')}
                    </p>
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 flex items-center"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      {t('profile.deleteAccountButton')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Public Profile Preview */}
      {profile?.alias && (
        <div className="mt-6 bg-white dark:bg-gray-800 shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">
              {t('profile.publicProfile')}
            </h3>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{t('profile.profileAvailableAt')}</p>
              <a
                href={`${window.location.origin}/${profile.alias}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center font-mono text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors duration-200"
              >
                /{profile.alias}
                <ExternalLink className="w-4 h-4 ml-2" />
              </a>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                {t('profile.shareLinkDescription')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 dark:bg-gray-900 dark:bg-opacity-75 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div className="mt-3">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/20">
                <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div className="mt-2 px-7 py-3">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white text-center">
                  {t('profile.deleteAccountConfirm')}
                </h3>
                <div className="mt-2 px-7 py-3">
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-4">
                    {t('profile.deleteAccountWarning')}
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 text-center mb-4">
                    {t('profile.deleteAccountConfirmText')}
                  </p>
                  <input
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder={t('profile.deleteAccountPlaceholder')}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-gray-100"
                  />
                </div>
              </div>
              <div className="items-center px-4 py-3">
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      setShowDeleteConfirm(false)
                      setDeleteConfirmText('')
                    }}
                    className="px-4 py-2 bg-gray-500 text-white text-base font-medium rounded-md shadow-sm hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={deleting || deleteConfirmText !== 'DELETE'}
                    className="px-4 py-2 bg-red-600 text-white text-base font-medium rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {deleting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        {t('profile.deleteAccountInProgress')}
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4 mr-2" />
                        {t('profile.deleteAccountButton')}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProfileSettingsPage
