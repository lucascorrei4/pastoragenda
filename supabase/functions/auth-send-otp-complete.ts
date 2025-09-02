import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface SendOTPRequest {
  email: string
}

// Inline email service
async function sendOTPEmail({ to, otpCode, isNewUser }: { to: string; otpCode: string; isNewUser: boolean }): Promise<void> {
  // For now, just log the OTP - you can implement actual email sending later
  console.log(`OTP for ${to}: ${otpCode}`)
  
  // TODO: Implement actual email sending with Brevo SMTP
  // This is a placeholder that just logs the OTP
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

    // Generate OTP (simple 6-digit code)
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString()

    // Store OTP in database (you'll need to create this function)
    // For now, just log it
    console.log(`Generated OTP for ${email}: ${otpCode}`)

    // Send OTP email
    try {
      await sendOTPEmail({
        to: email,
        otpCode: otpCode,
        isNewUser: false
      })
    } catch (emailError) {
      console.error('Error sending OTP email:', emailError)
      // Don't fail the request if email fails - OTP is still generated
    }

    return new Response(
      JSON.stringify({ 
        message: 'OTP sent successfully',
        success: true,
        otp: otpCode // For development - remove in production
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
