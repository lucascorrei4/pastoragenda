import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface UpdatePreferencesRequest {
  pastorId: string;
  preferences: {
    appointmentBooked?: boolean;
    appointmentCancelled?: boolean;
    appointmentReminders?: boolean;
    dailySummary?: boolean;
    weeklySummary?: boolean;
    systemUpdates?: boolean;
    urgentBookings?: boolean;
    quietHoursStart?: string;
    quietHoursEnd?: string;
    timezone?: string;
  };
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
    const body: UpdatePreferencesRequest = await req.json()
    
    // Validate required fields
    if (!body.pastorId || !body.preferences) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required fields: pastorId, preferences' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Convert camelCase to snake_case for database
    const updateData: any = {};
    if (body.preferences.appointmentBooked !== undefined) {
      updateData.appointment_booked = body.preferences.appointmentBooked;
    }
    if (body.preferences.appointmentCancelled !== undefined) {
      updateData.appointment_cancelled = body.preferences.appointmentCancelled;
    }
    if (body.preferences.appointmentReminders !== undefined) {
      updateData.appointment_reminders = body.preferences.appointmentReminders;
    }
    if (body.preferences.dailySummary !== undefined) {
      updateData.daily_summary = body.preferences.dailySummary;
    }
    if (body.preferences.weeklySummary !== undefined) {
      updateData.weekly_summary = body.preferences.weeklySummary;
    }
    if (body.preferences.systemUpdates !== undefined) {
      updateData.system_updates = body.preferences.systemUpdates;
    }
    if (body.preferences.urgentBookings !== undefined) {
      updateData.urgent_bookings = body.preferences.urgentBookings;
    }
    if (body.preferences.quietHoursStart !== undefined) {
      updateData.quiet_hours_start = body.preferences.quietHoursStart;
    }
    if (body.preferences.quietHoursEnd !== undefined) {
      updateData.quiet_hours_end = body.preferences.quietHoursEnd;
    }
    if (body.preferences.timezone !== undefined) {
      updateData.timezone = body.preferences.timezone;
    }

    // Add updated_at timestamp
    updateData.updated_at = new Date().toISOString();

    // Update notification preferences
    const { data, error: updateError } = await supabaseClient
      .from('notification_preferences')
      .update(updateData)
      .eq('user_id', body.pastorId)
      .select()
      .single()

    if (updateError) {
      console.error('Database error:', updateError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to update notification preferences',
          details: updateError.message 
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
        message: 'Notification preferences updated successfully',
        preferences: {
          appointmentBooked: data.appointment_booked,
          appointmentCancelled: data.appointment_cancelled,
          appointmentReminders: data.appointment_reminders,
          dailySummary: data.daily_summary,
          weeklySummary: data.weekly_summary,
          systemUpdates: data.system_updates,
          urgentBookings: data.urgent_bookings,
          quietHoursStart: data.quiet_hours_start,
          quietHoursEnd: data.quiet_hours_end,
          timezone: data.timezone
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
