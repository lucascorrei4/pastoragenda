import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { createJWT } from '../shared/jwt-service.ts'
import { sendWelcomeEmail } from '../shared/email-service.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface VerifyOTPRequest {
  email: string
  otp: string
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

    const { email, otp }: VerifyOTPRequest = await req.json()

    if (!email || !otp) {
      return new Response(
        JSON.stringify({ error: 'Email and OTP are required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Verify OTP
    const { data: isValid, error: verifyError } = await supabaseClient
      .rpc('verify_otp', { user_email: email, otp_code: otp })

    if (verifyError) {
      console.error('Error verifying OTP:', verifyError)
      return new Response(
        JSON.stringify({ error: 'Failed to verify OTP' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    if (!isValid) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired OTP' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('id, email, full_name, alias, email_verified, created_at')
      .eq('email', email)
      .single()

    if (profileError || !profile) {
      console.error('Error fetching profile:', profileError)
      return new Response(
        JSON.stringify({ error: 'User profile not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // Check if this is a new user (created within the last minute)
    const isNewUser = new Date(profile.created_at).getTime() > (Date.now() - 60000)

    // Create JWT token
    const token = await createJWT({
      userId: profile.id,
      email: profile.email,
      emailVerified: profile.email_verified
    })

    // Send welcome email for new users
    if (isNewUser) {
      try {
        await sendWelcomeEmail({
          to: profile.email,
          userName: profile.full_name || 'Pastor'
        })
      } catch (emailError) {
        console.error('Error sending welcome email:', emailError)
        // Don't fail the request if welcome email fails
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        token,
        user: {
          id: profile.id,
          email: profile.email,
          full_name: profile.full_name,
          alias: profile.alias,
          email_verified: profile.email_verified
        },
        isNewUser
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    console.error('Error in verify-otp function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
