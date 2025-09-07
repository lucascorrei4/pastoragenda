import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { 
  Users, 
  Calendar, 
  Plus, 
  Eye, 
  EyeOff, 
  Trash2, 
  Mail, 
  CheckCircle, 
  XCircle,
  Clock,
  ExternalLink,
  Settings
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { customAuth } from '../lib/custom-auth'
import { toast } from 'react-hot-toast'

interface FollowedPastor {
  id: string
  master_pastor_id: string
  followed_pastor_id: string
  invitation_status: 'pending' | 'accepted' | 'declined'
  created_at: string
  updated_at: string
  followed_pastor: {
    id: string
    alias: string
    full_name: string
    email: string
    avatar_url?: string
  }
  sharing_settings?: {
    is_public_enabled: boolean
    public_slug: string
    allow_booking_view: boolean
    allow_event_types_view: boolean
    show_pastor_name: boolean
    show_pastor_contact: boolean
  }
}

interface PastorInvitation {
  id: string
  from_pastor_id: string
  to_email: string
  invitation_token: string
  permissions: string[]
  status: 'pending' | 'accepted' | 'declined'
  created_at: string
  from_pastor?: {
    alias: string
    full_name: string
  }
}

const MasterPastorDashboard: React.FC = () => {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [followedPastors, setFollowedPastors] = useState<FollowedPastor[]>([])
  const [invitations, setInvitations] = useState<PastorInvitation[]>([])
  const [loading, setLoading] = useState(true)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [invitePermissions, setInvitePermissions] = useState<string[]>(['view_bookings', 'view_event_types'])
  const [sendingInvite, setSendingInvite] = useState(false)

  // Helper function to get auth token
  const getAuthToken = () => {
    const token = customAuth.getToken()
    if (!token) {
      throw new Error('No authentication token found')
    }
    return token
  }

  useEffect(() => {
    if (user) {
      fetchFollowedPastors()
      fetchInvitations()
    }
  }, [user])

  const fetchFollowedPastors = async () => {
    try {
      const { data, error } = await supabase
        .from('master_pastor_follows')
        .select(`
          *,
          followed_pastor:profiles!master_pastor_follows_followed_pastor_id_fkey(
            id,
            alias,
            full_name,
            email,
            avatar_url
          )
        `)
        .eq('master_pastor_id', user?.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Fetch sharing settings for each followed pastor
      const pastorsWithSettings = await Promise.all(
        (data || []).map(async (follow) => {
          const { data: settings } = await supabase
            .from('pastor_sharing_settings')
            .select('*')
            .eq('pastor_id', follow.followed_pastor_id)
            .single()

          return {
            ...follow,
            sharing_settings: settings
          }
        })
      )

      setFollowedPastors(pastorsWithSettings)
    } catch (error) {
      console.error('Error fetching followed pastors:', error)
      toast.error(t('masterDashboard.loadError'))
    }
  }

  const fetchInvitations = async () => {
    try {
      const token = getAuthToken()

    console.log('=== DEBUG TOKEN INFO ===')
    console.log('Token length:', token.length)
    console.log('Token starts with:', token.substring(0, 50) + '...')
    console.log('Token parts count:', token.split('.').length)
    console.log('Is JWT format?', token.split('.').length === 3)
    console.log('VITE_JWT_SECRET length:', import.meta.env.VITE_JWT_SECRET?.length)
    console.log('========================')
      console.log('Frontend token length:', token.length)
      console.log('Frontend token starts with:', token.substring(0, 20) + '...')

      const API_BASE_URL = import.meta.env.VITE_SUPABASE_URL?.replace('/rest/v1', '') || ''
      console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL)
      console.log('API_BASE_URL:', API_BASE_URL)
      console.log('Full request URL:', `${API_BASE_URL}/functions/v1/pastor-invitations/received`)
      
      console.log('About to make fetch request...')
      const response = await fetch(`${API_BASE_URL}/functions/v1/pastor-invitations/received`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      console.log('Fetch response received:', response.status, response.statusText)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch invitations')
      }

      const { data } = await response.json()
      setInvitations(data || [])
    } catch (error) {
      console.error('Error fetching invitations:', error)
      toast.error(t('masterDashboard.loadInvitationsError'))
    } finally {
      setLoading(false)
    }
  }

  const handleAcceptInvitation = async (invitationId: string, _fromPastorId: string) => {
    try {
      const token = getAuthToken()
      const API_BASE_URL = import.meta.env.VITE_SUPABASE_URL?.replace('/rest/v1', '') || ''

      const response = await fetch(`${API_BASE_URL}/functions/v1/pastor-invitations/respond`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          invitation_id: invitationId,
          response: 'accepted'
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to accept invitation')
      }

      toast.success(t('masterDashboard.invitationAccepted'))
      fetchFollowedPastors()
      fetchInvitations()
    } catch (error) {
      console.error('Error accepting invitation:', error)
      toast.error(t('masterDashboard.acceptError'))
    }
  }

  const handleDeclineInvitation = async (invitationId: string) => {
    try {
      const token = getAuthToken()
      const API_BASE_URL = import.meta.env.VITE_SUPABASE_URL?.replace('/rest/v1', '') || ''

      const response = await fetch(`${API_BASE_URL}/functions/v1/pastor-invitations/respond`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          invitation_id: invitationId,
          response: 'declined'
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to decline invitation')
      }

      toast.success(t('masterDashboard.invitationDeclined'))
      fetchInvitations()
    } catch (error) {
      console.error('Error declining invitation:', error)
      toast.error(t('masterDashboard.declineError'))
    }
  }

  const handleUnfollowPastor = async (followId: string) => {
    try {
      const { error } = await supabase
        .from('master_pastor_follows')
        .delete()
        .eq('id', followId)

      if (error) throw error

      toast.success(t('masterDashboard.unfollowed'))
      fetchFollowedPastors()
    } catch (error) {
      console.error('Error unfollowing pastor:', error)
      toast.error(t('masterDashboard.unfollowError'))
    }
  }

  const handleSendInvite = async () => {
    if (!inviteEmail.trim()) {
      toast.error(t('masterDashboard.emailRequired'))
      return
    }

    try {
      setSendingInvite(true)
      const token = getAuthToken()
      const API_BASE_URL = import.meta.env.VITE_SUPABASE_URL?.replace('/rest/v1', '') || ''

      const response = await fetch(`${API_BASE_URL}/functions/v1/pastor-invitations/invite`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          to_email: inviteEmail.trim(),
          permissions: invitePermissions
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to send invitation')
      }

      toast.success(t('masterDashboard.inviteSent'))
      setShowInviteModal(false)
      setInviteEmail('')
      setInvitePermissions(['view_bookings', 'view_event_types'])
      fetchInvitations()
    } catch (error) {
      console.error('Error sending invite:', error)
      toast.error(t('masterDashboard.inviteError'))
    } finally {
      setSendingInvite(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'declined':
        return <XCircle className="w-4 h-4 text-red-500" />
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />
      default:
        return null
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'accepted':
        return t('masterDashboard.statusAccepted')
      case 'declined':
        return t('masterDashboard.statusDeclined')
      case 'pending':
        return t('masterDashboard.statusPending')
      default:
        return status
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {t('masterDashboard.title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t('masterDashboard.subtitle')}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <Users className="w-8 h-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {t('masterDashboard.totalFollowed')}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {followedPastors.filter(p => p.invitation_status === 'accepted').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <Calendar className="w-8 h-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {t('masterDashboard.pendingInvitations')}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {invitations.filter(i => i.status === 'pending').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <Settings className="w-8 h-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {t('masterDashboard.activeAgendas')}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {followedPastors.filter(p => 
                    p.invitation_status === 'accepted' && 
                    p.sharing_settings?.is_public_enabled
                  ).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Followed Pastors */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-8 border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t('masterDashboard.followedPastors')}
            </h2>
            <button
              onClick={() => setShowInviteModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              {t('masterDashboard.invitePastor')}
            </button>
          </div>

          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {followedPastors.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <Users className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">{t('masterDashboard.noFollowedPastors')}</p>
              </div>
            ) : (
              followedPastors.map((pastor) => (
                <div key={pastor.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center">
                        {pastor.followed_pastor.avatar_url ? (
                          <img
                            src={pastor.followed_pastor.avatar_url}
                            alt={pastor.followed_pastor.alias}
                            className="w-10 h-10 rounded-full"
                          />
                        ) : (
                          <span className="text-gray-600 dark:text-gray-300 font-medium">
                            {pastor.followed_pastor.alias?.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                          {pastor.followed_pastor.full_name || pastor.followed_pastor.alias}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {pastor.followed_pastor.email}
                        </p>
                        <div className="flex items-center mt-1">
                          {getStatusIcon(pastor.invitation_status)}
                          <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">
                            {getStatusText(pastor.invitation_status)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {pastor.sharing_settings?.is_public_enabled && (
                        <a
                          href={`/agenda/${pastor.sharing_settings.public_slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-3 py-1 border border-gray-300 dark:border-gray-600 text-xs font-medium rounded text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                        >
                          <ExternalLink className="w-3 h-3 mr-1" />
                          {t('masterDashboard.viewAgenda')}
                        </a>
                      )}
                      
                      {pastor.invitation_status === 'accepted' && (
                        <button
                          onClick={() => handleUnfollowPastor(pastor.id)}
                          className="inline-flex items-center px-3 py-1 border border-red-300 dark:border-red-600 text-xs font-medium rounded text-red-700 dark:text-red-400 bg-white dark:bg-gray-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          {t('masterDashboard.unfollow')}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Pending Invitations */}
        {invitations.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t('masterDashboard.pendingInvitations')}
              </h2>
            </div>

            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {invitations.map((invitation) => (
                <div key={invitation.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                        {t('masterDashboard.invitationFrom', { 
                          name: invitation.from_pastor?.full_name || invitation.from_pastor?.alias || 'Unknown Pastor'
                        })}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {invitation.to_email}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        {new Date(invitation.created_at).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleAcceptInvitation(invitation.id, invitation.from_pastor_id)}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="w-3 h-3 mr-1" />
                        {t('masterDashboard.accept')}
                      </button>
                      <button
                        onClick={() => handleDeclineInvitation(invitation.id)}
                        className="inline-flex items-center px-3 py-1 border border-gray-300 dark:border-gray-600 text-xs font-medium rounded text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                      >
                        <XCircle className="w-3 h-3 mr-1" />
                        {t('masterDashboard.decline')}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Invite Modal */}
        {showInviteModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <div className="mt-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    {t('masterDashboard.invitePastor')}
                  </h3>
                  <button
                    onClick={() => setShowInviteModal(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('masterDashboard.pastorEmail')}
                    </label>
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder={t('masterDashboard.emailPlaceholder')}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('masterDashboard.permissions')}
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={invitePermissions.includes('view_bookings')}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setInvitePermissions([...invitePermissions, 'view_bookings'])
                            } else {
                              setInvitePermissions(invitePermissions.filter(p => p !== 'view_bookings'))
                            }
                          }}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {t('masterDashboard.viewBookings')}
                        </span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={invitePermissions.includes('view_event_types')}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setInvitePermissions([...invitePermissions, 'view_event_types'])
                            } else {
                              setInvitePermissions(invitePermissions.filter(p => p !== 'view_event_types'))
                            }
                          }}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {t('masterDashboard.viewEventTypes')}
                        </span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setShowInviteModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 rounded-md hover:bg-gray-200 dark:hover:bg-gray-500"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    onClick={handleSendInvite}
                    disabled={sendingInvite}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {sendingInvite ? t('common.sending') : t('masterDashboard.sendInvite')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default MasterPastorDashboard
