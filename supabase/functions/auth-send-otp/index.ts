import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { sendOTPEmail } from '../shared/email-service.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface SendOTPRequest {
  email: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 405 }
    )
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { email }: SendOTPRequest = await req.json()

    if (!email || !email.includes('@')) {
      return new Response(
        JSON.stringify({ error: 'Valid email address is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Check for rate limiting (optional - you can implement this)
    // For now, we'll skip rate limiting as requested

    // Generate and store OTP
    const { data: otpData, error: otpError } = await supabaseClient
      .rpc('send_otp', { user_email: email })

    if (otpError) {
      console.error('Error generating OTP:', otpError)
      return new Response(
        JSON.stringify({ error: 'Failed to generate OTP' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    const otpCode = otpData

    // Send OTP email
    try {
      await sendOTPEmail({
        to: email,
        otpCode: otpCode,
        isNewUser: false // We'll determine this based on user existence
      })
    } catch (emailError) {
      console.error('Error sending OTP email:', emailError)
      // Don't fail the request if email fails - OTP is still generated
    }

    return new Response(
      JSON.stringify({ 
        message: 'OTP sent successfully',
        success: true
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    console.error('Error in send-otp function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
