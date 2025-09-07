import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { customAuth } from '../lib/custom-auth'
import { toast } from 'react-hot-toast'
import { 
  Mail, 
  Plus, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  Clock,
  Users,
  Eye,
  EyeOff
} from 'lucide-react'

interface PastorInvitation {
  id: string
  from_pastor_id: string
  to_email: string
  invitation_token: string
  permissions: string[]
  status: 'pending' | 'accepted' | 'declined'
  created_at: string
  from_pastor?: {
    id: string
    alias: string
    full_name: string
  }
}

interface MasterPastorFollow {
  id: string
  master_pastor_id: string
  followed_pastor_id: string
  invitation_status: 'pending' | 'accepted' | 'declined'
  created_at: string
  master_pastor: {
    id: string
    alias: string
    full_name: string
    email: string
  }
}

const PastorInvitations: React.FC = () => {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [invitations, setInvitations] = useState<PastorInvitation[]>([])
  const [follows, setFollows] = useState<MasterPastorFollow[]>([])
  const [loading, setLoading] = useState(true)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [invitePermissions, setInvitePermissions] = useState<string[]>(['view_bookings', 'view_event_types'])
  const [sendingInvite, setSendingInvite] = useState(false)

  useEffect(() => {
    if (user) {
      fetchInvitations()
      fetchFollows()
    }
  }, [user])

  const fetchInvitations = async () => {
    try {
      const token = customAuth.getToken()
      if (!token) {
        throw new Error('No authentication token found')
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/pastor-invitations/received`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch invitations')
      }

      const { data } = await response.json()
      setInvitations(data || [])
    } catch (error) {
      console.error('Error fetching invitations:', error)
      toast.error(t('invitations.loadError'))
    }
  }

  const fetchFollows = async () => {
    try {
      const { data, error } = await supabase
        .from('master_pastor_follows')
        .select(`
          *,
          master_pastor:profiles!master_pastor_follows_master_pastor_id_fkey(
            id,
            alias,
            full_name,
            email
          )
        `)
        .eq('followed_pastor_id', user?.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setFollows(data || [])
    } catch (error) {
      console.error('Error fetching follows:', error)
      toast.error(t('invitations.loadFollowsError'))
    } finally {
      setLoading(false)
    }
  }

  const handleSendInvite = async () => {
    if (!inviteEmail.trim()) {
      toast.error(t('invitations.emailRequired'))
      return
    }

    try {
      setSendingInvite(true)

      const token = customAuth.getToken()
      if (!token) {
        throw new Error('No authentication token found')
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/pastor-invitations/invite`, {
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

      toast.success(t('invitations.inviteSent'))
      setShowInviteModal(false)
      setInviteEmail('')
      setInvitePermissions(['view_bookings', 'view_event_types'])
      fetchInvitations()
    } catch (error) {
      console.error('Error sending invite:', error)
      toast.error(t('invitations.inviteError'))
    } finally {
      setSendingInvite(false)
    }
  }

  const handleCancelInvite = async (invitationId: string) => {
    try {
      const token = customAuth.getToken()
      if (!token) {
        throw new Error('No authentication token found')
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/pastor-invitations/cancel`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          invitation_id: invitationId
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to cancel invitation')
      }

      toast.success(t('invitations.inviteCancelled'))
      fetchInvitations()
    } catch (error) {
      console.error('Error cancelling invite:', error)
      toast.error(t('invitations.cancelError'))
    }
  }

  const handleRevokeAccess = async (followId: string) => {
    try {
      const { error } = await supabase
        .from('master_pastor_follows')
        .delete()
        .eq('id', followId)

      if (error) throw error

      toast.success(t('invitations.accessRevoked'))
      fetchFollows()
    } catch (error) {
      console.error('Error revoking access:', error)
      toast.error(t('invitations.revokeError'))
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
        return t('invitations.statusAccepted')
      case 'declined':
        return t('invitations.statusDeclined')
      case 'pending':
        return t('invitations.statusPending')
      default:
        return status
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t('invitations.title')}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t('invitations.subtitle')}
          </p>
        </div>
        <button
          onClick={() => setShowInviteModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          {t('invitations.inviteMasterPastor')}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
          <div className="flex items-center">
            <Mail className="w-8 h-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {t('invitations.sentInvitations')}
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {invitations.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
          <div className="flex items-center">
            <Users className="w-8 h-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {t('invitations.activeFollowers')}
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {follows.filter(f => f.invitation_status === 'accepted').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
          <div className="flex items-center">
            <Clock className="w-8 h-8 text-yellow-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {t('invitations.pendingInvitations')}
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {invitations.filter(i => i.status === 'pending').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Sent Invitations */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-600">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            {t('invitations.sentInvitations')}
          </h3>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-600">
          {invitations.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                {t('invitations.noInvitations')}
              </p>
            </div>
          ) : (
            invitations.map((invitation) => (
              <div key={invitation.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center">
                      <Mail className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                        {invitation.from_pastor?.full_name || invitation.from_pastor?.alias || 'Unknown Pastor'}
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {invitation.to_email}
                      </p>
                      <div className="flex items-center mt-1">
                        {getStatusIcon(invitation.status)}
                        <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">
                          {getStatusText(invitation.status)}
                        </span>
                        <span className="ml-2 text-xs text-gray-400 dark:text-gray-500">
                          {new Date(invitation.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {invitation.status === 'pending' && (
                      <button
                        onClick={() => handleCancelInvite(invitation.id)}
                        className="inline-flex items-center px-3 py-1 border border-red-300 text-xs font-medium rounded text-red-700 bg-white hover:bg-red-50 dark:bg-gray-800 dark:border-red-600 dark:text-red-400 dark:hover:bg-red-900/20"
                      >
                        <XCircle className="w-3 h-3 mr-1" />
                        {t('invitations.cancel')}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Active Followers */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-600">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            {t('invitations.activeFollowers')}
          </h3>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-600">
          {follows.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                {t('invitations.noFollowers')}
              </p>
            </div>
          ) : (
            follows.map((follow) => (
              <div key={follow.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center">
                      <Users className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                        {follow.master_pastor.full_name || follow.master_pastor.alias}
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {follow.master_pastor.email}
                      </p>
                      <div className="flex items-center mt-1">
                        {getStatusIcon(follow.invitation_status)}
                        <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">
                          {getStatusText(follow.invitation_status)}
                        </span>
                        <span className="ml-2 text-xs text-gray-400 dark:text-gray-500">
                          {new Date(follow.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {follow.invitation_status === 'accepted' && (
                      <button
                        onClick={() => handleRevokeAccess(follow.id)}
                        className="inline-flex items-center px-3 py-1 border border-red-300 text-xs font-medium rounded text-red-700 bg-white hover:bg-red-50 dark:bg-gray-800 dark:border-red-600 dark:text-red-400 dark:hover:bg-red-900/20"
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        {t('invitations.revokeAccess')}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  {t('invitations.inviteMasterPastor')}
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
                    {t('invitations.masterPastorEmail')}
                  </label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder={t('invitations.emailPlaceholder')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('invitations.permissions')}
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
                        {t('invitations.viewBookings')}
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
                        {t('invitations.viewEventTypes')}
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
                  {sendingInvite ? t('common.sending') : t('invitations.sendInvite')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PastorInvitations
