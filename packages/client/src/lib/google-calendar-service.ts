import { supabase } from './supabase'

export interface GoogleCalendarEvent {
  id?: string
  summary: string
  description?: string
  start: {
    dateTime: string
    timeZone: string
  }
  end: {
    dateTime: string
    timeZone: string
  }
  attendees?: Array<{
    email: string
    displayName?: string
  }>
  reminders?: {
    useDefault: boolean
    overrides?: Array<{
      method: 'email' | 'popup'
      minutes: number
    }>
  }
}

export interface GoogleCalendarAuthResult {
  success: boolean
  authUrl?: string
  error?: string
}

export interface GoogleCalendarSyncResult {
  success: boolean
  eventId?: string
  error?: string
}

class GoogleCalendarService {
  private clientId: string
  private redirectUri: string
  private scopes = [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events'
  ]

  constructor() {
    this.clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''
    this.redirectUri = import.meta.env.VITE_GOOGLE_REDIRECT_URI || ''
    
    // Debug logging
    console.log('Google Calendar Service initialized:', {
      hasClientId: !!this.clientId,
      hasRedirectUri: !!this.redirectUri,
      clientIdLength: this.clientId.length,
      redirectUri: this.redirectUri
    })
  }

  /**
   * Get Google Calendar authorization URL
   */
  async getAuthUrl(): Promise<GoogleCalendarAuthResult> {
    if (!this.clientId || !this.redirectUri) {
      return {
        success: false,
        error: 'Google Calendar API not configured'
      }
    }

    try {
      const params = new URLSearchParams({
        client_id: this.clientId,
        redirect_uri: this.redirectUri,
        response_type: 'code',
        scope: this.scopes.join(' '),
        access_type: 'offline',
        prompt: 'consent'
      })

      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`

      return {
        success: true,
        authUrl
      }
    } catch (error) {
      console.error('Error generating auth URL:', error)
      return {
        success: false,
        error: 'Failed to generate authorization URL'
      }
    }
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForTokens(code: string): Promise<GoogleCalendarAuthResult> {
    if (!this.clientId || !this.redirectUri) {
      return {
        success: false,
        error: 'Google Calendar API not configured'
      }
    }

    try {
      // Exchange code for tokens
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: this.clientId,
          client_secret: import.meta.env.VITE_GOOGLE_CLIENT_SECRET || '',
          code: code,
          grant_type: 'authorization_code',
          redirect_uri: this.redirectUri,
        }),
      })

      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.json()
        throw new Error(errorData.error_description || 'Failed to exchange code for tokens')
      }

      const tokens = await tokenResponse.json()

      // Get user info
      const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`
        }
      })

      if (!userInfoResponse.ok) {
        throw new Error('Failed to get user info')
      }

      const userInfo = await userInfoResponse.json()

      // Get primary calendar
      const calendarListResponse = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`
        }
      })

      if (!calendarListResponse.ok) {
        throw new Error('Failed to get calendar list')
      }

      const calendarList = await calendarListResponse.json()
      const primaryCalendar = calendarList.items?.find((cal: any) => cal.primary === true)

      if (!primaryCalendar) {
        return {
          success: false,
          error: 'Could not find primary calendar'
        }
      }

      // Store tokens and calendar info in database
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return {
          success: false,
          error: 'User not authenticated'
        }
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          google_calendar_enabled: true,
          google_calendar_id: primaryCalendar.id,
          google_calendar_access_token: tokens.access_token,
          google_calendar_refresh_token: tokens.refresh_token,
          google_calendar_token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
          google_calendar_sync_enabled: true
        })
        .eq('id', user.id)

      if (error) {
        console.error('Error storing Google Calendar tokens:', error)
        return {
          success: false,
          error: 'Failed to store calendar credentials'
        }
      }

      return {
        success: true
      }
    } catch (error) {
      console.error('Error exchanging code for tokens:', error)
      return {
        success: false,
        error: 'Failed to exchange authorization code'
      }
    }
  }

  /**
   * Refresh access token if needed
   */
  async refreshTokenIfNeeded(): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    const { data: profile } = await supabase
      .from('profiles')
      .select('google_calendar_access_token, google_calendar_refresh_token, google_calendar_token_expires_at')
      .eq('id', user.id)
      .single()

    if (!profile?.google_calendar_refresh_token) return false

    const tokenExpiry = new Date(profile.google_calendar_token_expires_at)
    const now = new Date()
    
    // Refresh if token expires in less than 5 minutes
    if (tokenExpiry.getTime() - now.getTime() < 5 * 60 * 1000) {
      try {
        const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            client_id: this.clientId,
            client_secret: import.meta.env.VITE_GOOGLE_CLIENT_SECRET || '',
            refresh_token: profile.google_calendar_refresh_token,
            grant_type: 'refresh_token',
          }),
        })

        if (!refreshResponse.ok) {
          console.error('Failed to refresh token')
          return false
        }

        const credentials = await refreshResponse.json()
        
        // Update stored tokens
        await supabase
          .from('profiles')
          .update({
            google_calendar_access_token: credentials.access_token,
            google_calendar_token_expires_at: new Date(Date.now() + credentials.expires_in * 1000).toISOString()
          })
          .eq('id', user.id)

        return true
      } catch (error) {
        console.error('Error refreshing token:', error)
        return false
      }
    }

    return true
  }

  /**
   * Get current access token
   */
  async getAccessToken(): Promise<string | null> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data: profile } = await supabase
      .from('profiles')
      .select('google_calendar_access_token')
      .eq('id', user.id)
      .single()

    return profile?.google_calendar_access_token || null
  }

  /**
   * Create event in Google Calendar
   */
  async createEvent(event: GoogleCalendarEvent): Promise<GoogleCalendarSyncResult> {
    try {
      const refreshed = await this.refreshTokenIfNeeded()
      if (!refreshed) {
        return {
          success: false,
          error: 'Failed to refresh access token'
        }
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return {
          success: false,
          error: 'User not authenticated'
        }
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('google_calendar_id')
        .eq('id', user.id)
        .single()

      if (!profile?.google_calendar_id) {
        return {
          success: false,
          error: 'Google Calendar not configured'
        }
      }

      const accessToken = await this.getAccessToken()
      if (!accessToken) {
        return {
          success: false,
          error: 'No access token available'
        }
      }

      const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(profile.google_calendar_id)}/events`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error?.message || 'Failed to create calendar event')
      }

      const result = await response.json()

      return {
        success: true,
        eventId: result.id
      }
    } catch (error) {
      console.error('Error creating Google Calendar event:', error)
      return {
        success: false,
        error: 'Failed to create calendar event'
      }
    }
  }

  /**
   * Update event in Google Calendar
   */
  async updateEvent(eventId: string, event: GoogleCalendarEvent): Promise<GoogleCalendarSyncResult> {
    try {
      const refreshed = await this.refreshTokenIfNeeded()
      if (!refreshed) {
        return {
          success: false,
          error: 'Failed to refresh access token'
        }
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return {
          success: false,
          error: 'User not authenticated'
        }
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('google_calendar_id')
        .eq('id', user.id)
        .single()

      if (!profile?.google_calendar_id) {
        return {
          success: false,
          error: 'Google Calendar not configured'
        }
      }

      const accessToken = await this.getAccessToken()
      if (!accessToken) {
        return {
          success: false,
          error: 'No access token available'
        }
      }

      const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(profile.google_calendar_id)}/events/${eventId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error?.message || 'Failed to update calendar event')
      }

      const result = await response.json()

      return {
        success: true,
        eventId: result.id
      }
    } catch (error) {
      console.error('Error updating Google Calendar event:', error)
      return {
        success: false,
        error: 'Failed to update calendar event'
      }
    }
  }

  /**
   * Delete event from Google Calendar
   */
  async deleteEvent(eventId: string): Promise<GoogleCalendarSyncResult> {
    try {
      const refreshed = await this.refreshTokenIfNeeded()
      if (!refreshed) {
        return {
          success: false,
          error: 'Failed to refresh access token'
        }
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return {
          success: false,
          error: 'User not authenticated'
        }
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('google_calendar_id')
        .eq('id', user.id)
        .single()

      if (!profile?.google_calendar_id) {
        return {
          success: false,
          error: 'Google Calendar not configured'
        }
      }

      const accessToken = await this.getAccessToken()
      if (!accessToken) {
        return {
          success: false,
          error: 'No access token available'
        }
      }

      const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(profile.google_calendar_id)}/events/${eventId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error?.message || 'Failed to delete calendar event')
      }

      return {
        success: true
      }
    } catch (error) {
      console.error('Error deleting Google Calendar event:', error)
      return {
        success: false,
        error: 'Failed to delete calendar event'
      }
    }
  }

  /**
   * Disconnect Google Calendar
   */
  async disconnect(): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return false

      const { error } = await supabase
        .from('profiles')
        .update({
          google_calendar_enabled: false,
          google_calendar_id: null,
          google_calendar_access_token: null,
          google_calendar_refresh_token: null,
          google_calendar_token_expires_at: null,
          google_calendar_sync_enabled: false
        })
        .eq('id', user.id)

      if (error) {
        console.error('Error disconnecting Google Calendar:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error disconnecting Google Calendar:', error)
      return false
    }
  }

  /**
   * Check if Google Calendar is connected
   */
  async isConnected(): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return false

      const { data: profile } = await supabase
        .from('profiles')
        .select('google_calendar_enabled, google_calendar_sync_enabled')
        .eq('id', user.id)
        .single()

      return profile?.google_calendar_enabled === true && profile?.google_calendar_sync_enabled === true
    } catch (error) {
      console.error('Error checking Google Calendar connection:', error)
      return false
    }
  }
}

export const googleCalendarService = new GoogleCalendarService()