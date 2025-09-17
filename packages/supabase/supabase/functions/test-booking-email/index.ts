// Test booking email function to verify confirmation emails work
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get test parameters from request body
    const { bookerEmail, pastorId, eventTypeId } = await req.json()

    if (!bookerEmail || !pastorId || !eventTypeId) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required parameters: bookerEmail, pastorId, eventTypeId' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Fetch event type details
    const { data: eventType, error: eventTypeError } = await supabase
      .from('event_types')
      .select('title, duration, description')
      .eq('id', eventTypeId)
      .single()

    if (eventTypeError) {
      throw new Error(`Failed to fetch event type: ${eventTypeError.message}`)
    }

    // Fetch pastor profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('full_name, alias, email')
      .eq('id', pastorId)
      .single()

    if (profileError) {
      throw new Error(`Failed to fetch profile: ${profileError.message}`)
    }

    // Create a test booking record
    const testBooking = {
      id: 'test-booking-' + Date.now(),
      event_type_id: eventTypeId,
      user_id: pastorId,
      start_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
      end_time: new Date(Date.now() + 24 * 60 * 60 * 1000 + eventType.duration * 60000).toISOString(),
      booker_name: 'Test User',
      booker_email: bookerEmail,
      booker_phone: '+1234567890',
      booker_description: 'This is a test booking',
      custom_answers: { test: 'value' },
      status: 'confirmed',
      created_at: new Date().toISOString()
    }

    // Call the on-booking-created function
    const { data, error } = await supabase.functions.invoke('on-booking-created', {
      body: {
        record: testBooking,
        old_record: null
      }
    })

    if (error) {
      throw new Error(`Email function error: ${error.message}`)
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Test booking emails sent successfully',
        details: {
          bookerEmail,
          pastorEmail: profile.email,
          eventType: eventType.title,
          pastorName: profile.full_name
        }
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Test booking email error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Unknown error',
        success: false
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
