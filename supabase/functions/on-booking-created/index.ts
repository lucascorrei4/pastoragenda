import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { sendEventReminderEmail } from '../shared/email-service.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create a Supabase client with the Auth context of the function
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // Get the request body
    const { record, old_record } = await req.json()

    // Only process new bookings
    if (!record || old_record) {
      return new Response(
        JSON.stringify({ message: 'Only new bookings are processed' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    // Fetch additional data needed for the email
    const { data: eventType, error: eventTypeError } = await supabaseClient
      .from('event_types')
      .select('title, duration, description')
      .eq('id', record.event_type_id)
      .single()

    if (eventTypeError) {
      console.error('Error fetching event type:', eventTypeError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch event type' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('full_name, alias')
      .eq('id', record.user_id)
      .single()

    if (profileError) {
      console.error('Error fetching profile:', profileError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch profile' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // Format the appointment details
    const appointmentDate = new Date(record.start_time)
    const formattedDate = appointmentDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
    const formattedTime = appointmentDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })

    // Send confirmation email to the booker
    await sendEventReminderEmail({
      to: record.booker_email,
      bookerName: record.booker_name,
      pastorName: profile.full_name,
      eventTitle: eventType.title,
      date: formattedDate,
      time: formattedTime,
      duration: eventType.duration,
      pastorAlias: profile.alias
    })

    return new Response(
      JSON.stringify({ 
        message: 'Booking confirmation emails sent successfully',
        bookingId: record.id 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    console.error('Error processing booking:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})


