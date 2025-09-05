import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface GetPreferencesRequest {
  pastorId: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Parse request body
    const body: GetPreferencesRequest = await req.json()
    
    // Validate required fields
    if (!body.pastorId) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required field: pastorId' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get notification preferences for the pastor
    const { data: preferences, error: fetchError } = await supabaseClient
      .from('notification_preferences')
      .select('*')
      .eq('user_id', body.pastorId)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        // No preferences found, return default preferences
        const defaultPreferences = {
          appointment_booked: true,
          appointment_cancelled: true,
          appointment_reminders: true,
          daily_summary: true,
          weekly_summary: false,
          system_updates: true,
          urgent_bookings: true,
          quiet_hours_start: '22:00',
          quiet_hours_end: '08:00',
          timezone: 'UTC'
        };

        return new Response(
          JSON.stringify({ 
            success: true, 
            preferences: defaultPreferences 
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      console.error('Database error:', fetchError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to fetch notification preferences',
          details: fetchError.message 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        preferences: {
          appointmentBooked: preferences.appointment_booked,
          appointmentCancelled: preferences.appointment_cancelled,
          appointmentReminders: preferences.appointment_reminders,
          dailySummary: preferences.daily_summary,
          weeklySummary: preferences.weekly_summary,
          systemUpdates: preferences.system_updates,
          urgentBookings: preferences.urgent_bookings,
          quietHoursStart: preferences.quiet_hours_start,
          quietHoursEnd: preferences.quiet_hours_end,
          timezone: preferences.timezone
        }
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
