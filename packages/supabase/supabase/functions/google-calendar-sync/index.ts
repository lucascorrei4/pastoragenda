import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { google } from 'https://esm.sh/googleapis@128.0.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface BookingData {
  id: string
  event_type_id: string
  start_time: string
  end_time: string
  booker_name: string
  booker_email: string
  booker_description?: string
  status: string
  google_calendar_event_id?: string
  google_calendar_sync_status?: string
}

interface EventTypeData {
  id: string
  title: string
  duration: number
  description?: string
}

interface ProfileData {
  id: string
  google_calendar_enabled: boolean
  google_calendar_id?: string
  google_calendar_access_token?: string
  google_calendar_refresh_token?: string
  google_calendar_token_expires_at?: string
  google_calendar_sync_enabled: boolean
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    const { action, bookingId, eventTypeId, userId } = await req.json()

    if (!bookingId || !eventTypeId || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get booking data
    const { data: booking, error: bookingError } = await supabaseClient
      .from('bookings')
      .select(`
        *,
        event_types (
          id,
          title,
          duration,
          description,
          user_id
        )
      `)
      .eq('id', bookingId)
      .single()

    if (bookingError || !booking) {
      return new Response(
        JSON.stringify({ error: 'Booking not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get user profile with Google Calendar settings
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: 'Profile not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if Google Calendar is enabled
    if (!profile.google_calendar_enabled || !profile.google_calendar_sync_enabled) {
      return new Response(
        JSON.stringify({ error: 'Google Calendar integration not enabled' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize Google Calendar API
    const oauth2Client = new google.auth.OAuth2(
      Deno.env.get('GOOGLE_CLIENT_ID'),
      Deno.env.get('GOOGLE_CLIENT_SECRET'),
      Deno.env.get('GOOGLE_REDIRECT_URI')
    )

    oauth2Client.setCredentials({
      access_token: profile.google_calendar_access_token,
      refresh_token: profile.google_calendar_refresh_token
    })

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client })

    let result: any = { success: false }

    switch (action) {
      case 'create':
        result = await createGoogleCalendarEvent(calendar, profile, booking)
        break
      case 'update':
        result = await updateGoogleCalendarEvent(calendar, profile, booking)
        break
      case 'delete':
        result = await deleteGoogleCalendarEvent(calendar, profile, booking)
        break
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }

    // Update booking sync status
    if (result.success) {
      await supabaseClient
        .from('bookings')
        .update({
          google_calendar_event_id: result.eventId || booking.google_calendar_event_id,
          google_calendar_synced_at: new Date().toISOString(),
          google_calendar_sync_status: 'synced'
        })
        .eq('id', bookingId)
    } else {
      await supabaseClient
        .from('bookings')
        .update({
          google_calendar_sync_status: 'failed'
        })
        .eq('id', bookingId)
    }

    return new Response(
      JSON.stringify(result),
      { 
        status: result.success ? 200 : 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in Google Calendar sync:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function createGoogleCalendarEvent(calendar: any, profile: ProfileData, booking: any) {
  try {
    const event = {
      summary: `${booking.event_types.title} - ${booking.booker_name}`,
      description: booking.booker_description || booking.event_types.description || '',
      start: {
        dateTime: booking.start_time,
        timeZone: 'UTC'
      },
      end: {
        dateTime: booking.end_time,
        timeZone: 'UTC'
      },
      attendees: [
        {
          email: booking.booker_email,
          displayName: booking.booker_name
        }
      ],
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 }, // 1 day before
          { method: 'popup', minutes: 60 } // 1 hour before
        ]
      }
    }

    const response = await calendar.events.insert({
      calendarId: profile.google_calendar_id,
      resource: event
    })

    return {
      success: true,
      eventId: response.data.id
    }
  } catch (error) {
    console.error('Error creating Google Calendar event:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

async function updateGoogleCalendarEvent(calendar: any, profile: ProfileData, booking: any) {
  try {
    if (!booking.google_calendar_event_id) {
      return {
        success: false,
        error: 'No Google Calendar event ID found'
      }
    }

    const event = {
      summary: `${booking.event_types.title} - ${booking.booker_name}`,
      description: booking.booker_description || booking.event_types.description || '',
      start: {
        dateTime: booking.start_time,
        timeZone: 'UTC'
      },
      end: {
        dateTime: booking.end_time,
        timeZone: 'UTC'
      },
      attendees: [
        {
          email: booking.booker_email,
          displayName: booking.booker_name
        }
      ],
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 }, // 1 day before
          { method: 'popup', minutes: 60 } // 1 hour before
        ]
      }
    }

    const response = await calendar.events.update({
      calendarId: profile.google_calendar_id,
      eventId: booking.google_calendar_event_id,
      resource: event
    })

    return {
      success: true,
      eventId: response.data.id
    }
  } catch (error) {
    console.error('Error updating Google Calendar event:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

async function deleteGoogleCalendarEvent(calendar: any, profile: ProfileData, booking: any) {
  try {
    if (!booking.google_calendar_event_id) {
      return {
        success: false,
        error: 'No Google Calendar event ID found'
      }
    }

    await calendar.events.delete({
      calendarId: profile.google_calendar_id,
      eventId: booking.google_calendar_event_id
    })

    return {
      success: true
    }
  } catch (error) {
    console.error('Error deleting Google Calendar event:', error)
    return {
      success: false,
      error: error.message
    }
  }
}
