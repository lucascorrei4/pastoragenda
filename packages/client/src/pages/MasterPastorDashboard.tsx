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
  Settings,
  User,
  Phone,
  AlertCircle,
  Edit3,
  Image,
  FileText,
  Link,
  ArrowRight
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
    email: string
    avatar_url?: string
  }
}

const MasterPastorDashboard: React.FC = () => {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [followedPastors, setFollowedPastors] = useState<FollowedPastor[]>([])
  const [invitations, setInvitations] = useState<PastorInvitation[]>([])
  const [bookings, setBookings] = useState<any[]>([])
  const [selectedPastorId, setSelectedPastorId] = useState<string>('all')
  const [selectedTab, setSelectedTab] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<{
    id: string
    full_name?: string
    avatar_url?: string
    bio?: string
    alias?: string
    email?: string
  } | null>(null)
  const [showProfileAdvice, setShowProfileAdvice] = useState(false)
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

  // Filter bookings by status and date
  const getFilteredBookings = () => {
    let filtered = bookings

    // Filter by pastor if not "all"
    if (selectedPastorId !== 'all') {
      filtered = filtered.filter(booking => 
        booking.event_type?.pastor?.id === selectedPastorId
      )
    }

    // Filter by tab status
    const now = new Date()
    switch (selectedTab) {
      case 'upcoming':
        return filtered.filter(booking => {
          const startTime = new Date(booking.start_time)
          return startTime > now && booking.status === 'confirmed'
        })
      case 'past':
        return filtered.filter(booking => {
          const startTime = new Date(booking.start_time)
          return startTime <= now && booking.status === 'confirmed'
        })
      case 'cancelled':
        return filtered.filter(booking => booking.status === 'cancelled')
      case 'all':
      default:
        return filtered
    }
  }

  // Get booking counts for tabs
  const getBookingCounts = () => {
    const now = new Date()
    let filtered = bookings

    // Filter by pastor if not "all"
    if (selectedPastorId !== 'all') {
      filtered = filtered.filter(booking => 
        booking.event_type?.pastor?.id === selectedPastorId
      )
    }

    return {
      all: filtered.length,
      upcoming: filtered.filter(booking => {
        const startTime = new Date(booking.start_time)
        return startTime > now && booking.status === 'confirmed'
      }).length,
      past: filtered.filter(booking => {
        const startTime = new Date(booking.start_time)
        return startTime <= now && booking.status === 'confirmed'
      }).length,
      cancelled: filtered.filter(booking => booking.status === 'cancelled').length
    }
  }

  // Fetch profile data
  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single()

      if (error) {
        console.error('Error fetching profile:', error)
        return
      }

      setProfile(data)
      
      // Check if profile needs completion
      const missingFields: string[] = []
      if (!data?.full_name) missingFields.push('full_name')
      if (!data?.avatar_url) missingFields.push('avatar_url')
      if (!data?.bio) missingFields.push('bio')
      if (!data?.alias) missingFields.push('alias')
      
      setShowProfileAdvice(missingFields.length > 0)
    } catch (error) {
      console.error('Error fetching profile:', error)
    }
  }

  // Get missing profile fields
  const getMissingFields = () => {
    if (!profile) return []
    
    const missing: Array<{ field: string; label: string; icon: any }> = []
    if (!profile.full_name) missing.push({ field: 'full_name', label: t('common.completeProfile.fullName'), icon: User })
    if (!profile.avatar_url) missing.push({ field: 'avatar_url', label: t('common.completeProfile.profilePicture'), icon: Image })
    if (!profile.bio) missing.push({ field: 'bio', label: t('common.completeProfile.bioDescription'), icon: FileText })
    if (!profile.alias) missing.push({ field: 'alias', label: t('common.completeProfile.publicUrlSlug'), icon: Link })
    
    return missing
  }

  useEffect(() => {
    if (user) {
      fetchFollowedPastors()
      fetchInvitations()
      fetchBookings()
      fetchProfile()
    }
  }, [user])

  useEffect(() => {
    if (followedPastors.length > 0) {
      fetchBookings()
    }
  }, [followedPastors, selectedPastorId])

  const fetchFollowedPastors = async () => {
    try {
      console.log('=== FETCHING FOLLOWED PASTORS ===')
      console.log('User ID:', user?.id)
      
      // Use the service role through an Edge Function to bypass RLS
      const token = getAuthToken()
      const API_BASE_URL = import.meta.env.VITE_SUPABASE_URL?.replace('/rest/v1', '') || ''

      const response = await fetch(`${API_BASE_URL}/functions/v1/pastor-invitations/followed-pastors`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      console.log('Followed pastors response status:', response.status)

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Error fetching followed pastors:', errorData)
        throw new Error(errorData.error || 'Failed to fetch followed pastors')
      }

      const { data } = await response.json()
      console.log('Followed pastors data:', data)
      setFollowedPastors(data || [])
    } catch (error) {
      console.error('Error fetching followed pastors:', error)
      // Fallback to empty array if there's an error
      setFollowedPastors([])
    }
  }

  const fetchBookings = async () => {
    try {
      console.log('=== FETCHING BOOKINGS ===')
      console.log('Selected pastor ID:', selectedPastorId)
      
      const token = getAuthToken()
      const API_BASE_URL = import.meta.env.VITE_SUPABASE_URL?.replace('/rest/v1', '') || ''

      const response = await fetch(`${API_BASE_URL}/functions/v1/pastor-invitations/bookings`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          pastor_id: selectedPastorId === 'all' ? null : selectedPastorId
        })
      })

      console.log('Bookings response status:', response.status)

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Error fetching bookings:', errorData)
        throw new Error(errorData.error || 'Failed to fetch bookings')
      }

      const { data } = await response.json()
      console.log('Bookings data:', data)
      setBookings(data || [])
    } catch (error) {
      console.error('Error fetching bookings:', error)
      setBookings([])
    }
  }

  const fetchInvitations = async () => {
    try {
      console.log('=== FETCHING INVITATIONS ===')
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
      console.log('Received invitations data:', data)
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
      console.log('=== ACCEPTING INVITATION ===')
      console.log('Invitation ID:', invitationId)
      console.log('From Pastor ID:', _fromPastorId)
      
      const token = getAuthToken()
      const API_BASE_URL = import.meta.env.VITE_SUPABASE_URL?.replace('/rest/v1', '') || ''
      
      console.log('API Base URL:', API_BASE_URL)
      console.log('Token length:', token.length)

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

      console.log('Response status:', response.status)
      console.log('Response ok:', response.ok)

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Error response:', errorData)
        throw new Error(errorData.error || 'Failed to accept invitation')
      }

      const responseData = await response.json()
      console.log('Success response:', responseData)

      // Show success message with more details
      const pastorName = responseData.data?.from_pastor?.full_name || responseData.data?.from_pastor?.alias || 'Pastor'
      toast.success(`${t('masterDashboard.invitationAccepted')} - ${pastorName}`)
      
      console.log('Refreshing data...')
      
      // Refresh both data sources
      console.log('Calling fetchFollowedPastors...')
      await fetchFollowedPastors()
      
      console.log('Calling fetchInvitations...')
      await fetchInvitations()
      
      console.log('Data refreshed successfully')
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
      await fetchInvitations()
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {t('masterDashboard.followAgendas')}
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            {t('masterDashboard.followAgendasSubtitle')}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
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
                  {invitations.length}
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

        {/* Profile Advice */}
        {showProfileAdvice && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-700 mb-6 sm:mb-8">
            <div className="px-4 sm:px-6 py-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <AlertCircle className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="ml-3 flex-1">
                  <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-2">
                    {t('common.completeProfile.title')}
                  </h3>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mb-4">
                    {t('common.completeProfile.description')}
                  </p>
                  
                  <div className="space-y-2 mb-4">
                    {getMissingFields().map((field, index) => {
                      const IconComponent = field.icon
                      return (
                        <div key={index} className="flex items-center text-sm text-blue-700 dark:text-blue-300">
                          <IconComponent className="w-4 h-4 mr-2 flex-shrink-0" />
                          <span>{field.label}</span>
                        </div>
                      )
                    })}
                  </div>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <p className="text-xs text-blue-600 dark:text-blue-400 flex-1">
                      {t('common.completeProfile.helpText')}
                    </p>
                    <button
                      onClick={() => window.location.href = '/dashboard/profile'}
                      className="inline-flex items-center justify-center px-4 py-2.5 sm:px-3 sm:py-2 text-sm font-medium text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-800/30 hover:bg-blue-200 dark:hover:bg-blue-800/50 rounded-md transition-colors duration-200 w-full sm:w-auto"
                    >
                      <Edit3 className="w-4 h-4 mr-2 flex-shrink-0" />
                      <span className="truncate">{t('common.completeProfile.editProfile')}</span>
                      <ArrowRight className="w-4 h-4 ml-2 flex-shrink-0" />
                    </button>
                  </div>
                </div>
                <div className="flex-shrink-0 ml-2 sm:ml-4">
                  <button
                    onClick={() => setShowProfileAdvice(false)}
                    className="text-blue-400 hover:text-blue-600 dark:text-blue-500 dark:hover:text-blue-300 transition-colors duration-200 p-1"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Followed Pastors */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6 sm:mb-8 border border-gray-200 dark:border-gray-700">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t('masterDashboard.followedPastors')}
            </h2>
            <button
              onClick={() => setShowInviteModal(true)}
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
            >
              <Plus className="w-4 h-4 mr-2" />
              {t('masterDashboard.invitePastor')}
            </button>
          </div>

          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {followedPastors.length === 0 ? (
              <div className="px-4 sm:px-6 py-8 sm:py-12 text-center">
                <Users className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">{t('masterDashboard.noFollowedPastors')}</p>
              </div>
            ) : (
              followedPastors.map((pastor) => (
                <div key={pastor.id} className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                          {pastor.followed_pastor.avatar_url ? (
                            <img
                              src={pastor.followed_pastor.avatar_url}
                              alt={pastor.followed_pastor.alias}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            <span className="text-blue-600 dark:text-blue-400 font-medium text-lg">
                              {(pastor.followed_pastor.full_name || pastor.followed_pastor.alias || 'U').charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                          {pastor.followed_pastor.full_name || pastor.followed_pastor.alias}
                        </h3>
                        
                        <div className="mt-1 space-y-1">
                          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                            <Mail className="w-3 h-3 mr-1.5 flex-shrink-0" />
                            <span className="truncate">{pastor.followed_pastor.email}</span>
                          </div>
                          
                          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                            {getStatusIcon(pastor.invitation_status)}
                            <span className="ml-1">{getStatusText(pastor.invitation_status)}</span>
                          </div>
                          
                          {pastor.invitation_status === 'accepted' && (
                            <div className="flex items-center text-xs text-green-600 dark:text-green-400">
                              <CheckCircle className="w-3 h-3 mr-1.5 flex-shrink-0" />
                              <span>Agenda Acessível</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                      {pastor.invitation_status === 'accepted' ? (
                        <a
                          href={`/dashboard/master/agenda/${pastor.followed_pastor.alias}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center px-3 py-2 border border-blue-300 dark:border-blue-600 text-sm font-medium rounded-md text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors duration-200"
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          {t('masterDashboard.viewAgenda')}
                        </a>
                      ) : (
                        <span className="inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 rounded-md">
                          <Clock className="w-4 h-4 mr-2" />
                          {t('masterDashboard.invitationPending')}
                        </span>
                      )}
                      
                      {pastor.invitation_status === 'accepted' && (
                        <button
                          onClick={() => handleUnfollowPastor(pastor.id)}
                          className="inline-flex items-center justify-center px-3 py-2 border border-red-300 dark:border-red-600 text-sm font-medium rounded-md text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors duration-200"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
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
            <div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t('masterDashboard.pendingInvitations')}
              </h2>
            </div>

            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {invitations.map((invitation) => {
                console.log('Rendering invitation:', invitation)
                console.log('From pastor data:', invitation.from_pastor)
                console.log('From pastor name:', invitation.from_pastor?.full_name)
                console.log('From pastor alias:', invitation.from_pastor?.alias)
                return (
                <div key={invitation.id} className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    {/* Invitation Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start space-x-3">
                        {/* Avatar */}
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                            {invitation.from_pastor?.avatar_url ? (
                              <img
                                src={invitation.from_pastor.avatar_url}
                                alt={invitation.from_pastor.full_name || invitation.from_pastor.alias}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              <span className="text-blue-600 dark:text-blue-400 font-medium text-sm">
                                {(invitation.from_pastor?.full_name || invitation.from_pastor?.alias || 'U').charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                            {t('masterDashboard.invitationFrom').replace('{name}', invitation.from_pastor?.full_name || invitation.from_pastor?.alias || 'Unknown Pastor')}
                          </h3>
                          
                          <div className="mt-1 space-y-1">
                            <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                              <Mail className="w-3 h-3 mr-1.5 flex-shrink-0" />
                              <span className="truncate">{invitation.from_pastor?.email || 'Unknown email'}</span>
                            </div>
                            
                            <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                              <User className="w-3 h-3 mr-1.5 flex-shrink-0" />
                              <span className="truncate">{invitation.to_email}</span>
                            </div>
                            
                            <div className="flex items-center text-xs text-gray-400 dark:text-gray-500">
                              <Calendar className="w-3 h-3 mr-1.5 flex-shrink-0" />
                              <span>{new Date(invitation.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                      <button
                        onClick={() => handleAcceptInvitation(invitation.id, invitation.from_pastor_id)}
                        className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        {t('masterDashboard.accept')}
                      </button>
                      <button
                        onClick={() => handleDeclineInvitation(invitation.id)}
                        className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        {t('masterDashboard.decline')}
                      </button>
                    </div>
                  </div>
                </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Bookings Section */}
        {followedPastors.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
            <div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {t('masterDashboard.allBookings')}
                </h2>
                
                {/* Pastor Filter */}
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('masterDashboard.filterByPastor')}:
                  </label>
                  <select
                    value={selectedPastorId}
                    onChange={(e) => setSelectedPastorId(e.target.value)}
                    className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">{t('masterDashboard.allPastors')}</option>
                    {followedPastors.map((pastor) => (
                      <option key={pastor.followed_pastor.id} value={pastor.followed_pastor.id}>
                        {pastor.followed_pastor.full_name || pastor.followed_pastor.alias}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Booking Status Tabs */}
            <div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex gap-1 overflow-x-auto scrollbar-hide pb-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {[
                  { key: 'all', label: t('bookings.filter.all') },
                  { key: 'upcoming', label: t('bookings.filter.upcoming') },
                  { key: 'past', label: t('bookings.filter.past') },
                  { key: 'cancelled', label: t('bookings.filter.cancelled') }
                ].map((tab) => {
                  const counts = getBookingCounts()
                  const count = counts[tab.key as keyof typeof counts]
                  const isActive = selectedTab === tab.key
                  
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setSelectedTab(tab.key)}
                      className={`px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors duration-200 flex items-center space-x-1 sm:space-x-2 whitespace-nowrap flex-shrink-0 ${
                        isActive
                          ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-b-2 border-blue-500'
                          : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      <span>{tab.label}</span>
                      <span className={`inline-flex items-center justify-center px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs font-semibold rounded-full min-w-[20px] ${
                        isActive
                          ? 'bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200'
                          : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                      }`}>
                        {count}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {getFilteredBookings().length === 0 ? (
                <div className="px-4 sm:px-6 py-8 sm:py-12 text-center">
                  <Calendar className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                  <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">
                    {selectedPastorId === 'all' 
                      ? t('masterDashboard.noBookings')
                      : t('masterDashboard.noBookingsForPastor')
                    }
                  </p>
                </div>
              ) : (
                getFilteredBookings().map((booking) => (
                  <div key={booking.id} className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      {/* Booking Details */}
                      <div className="flex-1 min-w-0">
                        {/* Status Badge */}
                        <div className="mb-2">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            booking.status === 'confirmed' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                              : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                          }`}>
                            {booking.status === 'confirmed' ? (
                              <>
                                <CheckCircle className="w-3 h-3 mr-1" />
                                {t('masterDashboard.confirmed')}
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3 h-3 mr-1" />
                                {t('masterDashboard.cancelled')}
                              </>
                            )}
                          </span>
                        </div>
                        
                        {/* Booking Info */}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                            {booking.event_type?.title || t('masterDashboard.appointment')}
                          </h3>
                            
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-2">
                              <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                                <Calendar className="w-4 h-4 mr-2 flex-shrink-0" />
                                <span>{new Date(booking.start_time).toLocaleDateString('en-US', { 
                                  weekday: 'long', 
                                  year: 'numeric', 
                                  month: 'long', 
                                  day: 'numeric' 
                                })}</span>
                              </div>
                              
                              <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                                <Clock className="w-4 h-4 mr-2 flex-shrink-0" />
                                <span>
                                  {new Date(booking.start_time).toLocaleTimeString('en-US', { 
                                    hour: 'numeric', 
                                    minute: '2-digit',
                                    hour12: true 
                                  })} - {new Date(booking.end_time).toLocaleTimeString('en-US', { 
                                    hour: 'numeric', 
                                    minute: '2-digit',
                                    hour12: true 
                                  })} ({Math.round((new Date(booking.end_time).getTime() - new Date(booking.start_time).getTime()) / (1000 * 60))} {t('common.min')})
                                </span>
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                                <User className="w-4 h-4 mr-2 flex-shrink-0" />
                                <span className="truncate">{booking.booker_name}</span>
                              </div>
                              
                              <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                                <Mail className="w-4 h-4 mr-2 flex-shrink-0" />
                                <span className="truncate">{booking.booker_email}</span>
                              </div>
                              
                              {booking.booker_phone && (
                                <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                                  <Phone className="w-4 h-4 mr-2 flex-shrink-0" />
                                  <span>{booking.booker_phone}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          
                        </div>
                        
                        {/* Description */}
                        {booking.booker_description && (
                          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <div className="flex items-start">
                              <div className="flex-shrink-0">
                                <div className="w-6 h-6 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center">
                                  <span className="text-xs text-gray-600 dark:text-gray-300">💬</span>
                                </div>
                              </div>
                              <div className="ml-3">
                                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                                  {t('masterDashboard.description')}
                                </h4>
                                <p className="text-sm text-gray-600 dark:text-gray-300">
                                  {booking.booker_description}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Booking Date */}
                    <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-600">
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {t('masterDashboard.bookedOn')} {new Date(booking.created_at).toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </div>
                    </div>
                  </div>
                ))
              )}
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
