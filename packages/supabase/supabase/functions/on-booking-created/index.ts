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
    await sendConfirmationEmail({
      to: record.booker_email,
      bookerName: record.booker_name,
      pastorName: profile.full_name,
      eventTitle: eventType.title,
      date: formattedDate,
      time: formattedTime,
      duration: eventType.duration,
      pastorAlias: profile.alias
    })

    // Send notification email to the pastor
    await sendPastorNotification({
      to: record.booker_email, // This would ideally be the pastor's email
      pastorName: profile.full_name,
      bookerName: record.booker_name,
      bookerEmail: record.booker_email,
      eventTitle: eventType.title,
      date: formattedDate,
      time: formattedTime,
      duration: eventType.duration
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

async function sendConfirmationEmail({
  to,
  bookerName,
  pastorName,
  eventTitle,
  date,
  time,
  duration,
  pastorAlias
}: {
  to: string
  bookerName: string
  pastorName: string
  eventTitle: string
  date: string
  time: string
  duration: number
  pastorAlias: string
}) {
  const emailContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #0ea5e9;">Appointment Confirmed!</h2>
      
      <p>Dear ${bookerName},</p>
      
      <p>Your appointment with <strong>${pastorName}</strong> has been confirmed.</p>
      
      <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Appointment Details</h3>
        <p><strong>Event:</strong> ${eventTitle}</p>
        <p><strong>Date:</strong> ${date}</p>
        <p><strong>Time:</strong> ${time}</p>
        <p><strong>Duration:</strong> ${duration} minutes</p>
        <p><strong>Pastor:</strong> ${pastorName}</p>
      </div>
      
      <p>Please arrive on time for your appointment. If you need to cancel or reschedule, please contact ${pastorName} as soon as possible.</p>
      
      <p>You can view your pastor's profile at: <a href="https://pastoragenda.com/${pastorAlias}">pastoragenda.com/${pastorAlias}</a></p>
      
      <p>Thank you for using PastorAgenda!</p>
      
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #e2e8f0;">
      <p style="color: #64748b; font-size: 14px;">
        This is an automated confirmation email. Please do not reply to this message.
      </p>
    </div>
  `

  // In a real implementation, you would use an email service like Resend, SendGrid, or Supabase's built-in email
  // For now, we'll just log the email content
  console.log('Confirmation email would be sent to:', to)
  console.log('Email content:', emailContent)
}

async function sendPastorNotification({
  to,
  pastorName,
  bookerName,
  bookerEmail,
  eventTitle,
  date,
  time,
  duration
}: {
  to: string
  pastorName: string
  bookerName: string
  bookerEmail: string
  eventTitle: string
  date: string
  time: string
  duration: number
}) {
  const emailContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #0ea5e9;">New Appointment Booking</h2>
      
      <p>Dear ${pastorName},</p>
      
      <p>You have received a new appointment booking.</p>
      
      <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Booking Details</h3>
        <p><strong>Event:</strong> ${eventTitle}</p>
        <p><strong>Date:</strong> ${date}</p>
        <p><strong>Time:</strong> ${time}</p>
        <p><strong>Duration:</strong> ${duration} minutes</p>
        <p><strong>Booker Name:</strong> ${bookerName}</p>
        <p><strong>Booker Email:</strong> ${bookerEmail}</p>
      </div>
      
      <p>You can manage your bookings in your PastorAgenda dashboard.</p>
      
      <p>Thank you for using PastorAgenda!</p>
      
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #e2e8f0;">
      <p style="color: #64748b; font-size: 14px;">
        This is an automated notification email. Please do not reply to this message.
      </p>
    </div>
  `

  // In a real implementation, you would use an email service like Resend, SendGrid, or Supabase's built-in email
  // For now, we'll just log the email content
  console.log('Pastor notification email would be sent to:', to)
  console.log('Email content:', emailContent)
}
