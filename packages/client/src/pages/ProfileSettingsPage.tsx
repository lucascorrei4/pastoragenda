import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import { toast } from 'react-hot-toast'
import { User, Save, Upload, ExternalLink } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Profile } from '../lib/supabase'

function ProfileSettingsPage() {
  const { user } = useAuth()
  const { t } = useTranslation()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

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

      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`
      // Use user ID as folder name to match storage policy
      const filePath = `${user?.id}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      setFormData(prev => ({
        ...prev,
        avatar_url: publicUrl
      }))

      toast.success(t('profile.avatarUploadSuccess'))
    } catch (error) {
      console.error('Error uploading avatar:', error)
      toast.error(t('profile.avatarUploadError'))
    } finally {
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-6">
            {t('profile.title')}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Avatar Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('profile.avatar')}
              </label>
              <div className="flex items-center space-x-4">
                <div className="w-20 h-20 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center overflow-hidden">
                  {formData.avatar_url ? (
                    <img
                      src={formData.avatar_url}
                      alt="Profile"
                      className="w-full h-full object-cover"
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
                href={`/${profile.alias}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center font-mono text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors duration-200"
              >
                {window.location.origin}/{profile.alias}
                <ExternalLink className="w-4 h-4 ml-2" />
              </a>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                {t('profile.shareLinkDescription')}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProfileSettingsPage
