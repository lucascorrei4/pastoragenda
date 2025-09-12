import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from "npm:@supabase/supabase-js@2.39.3"
import { encode, decode } from "https://deno.land/std@0.168.0/encoding/base64url.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Content-Type': 'application/json'
}

interface JWTPayload {
  userId: string
  email: string
  emailVerified: boolean
  iat: number
  exp: number
}

// JWT verification function (embedded to match our creation method)
const JWT_SECRET = Deno.env.get('JWT_SECRET') || 'your-super-secret-jwt-key-change-this-in-production'

async function verifyJWT(token: string): Promise<JWTPayload | null> {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) {
      console.error('Invalid JWT format')
      return null
    }

    const [header, payload, signature] = parts
    
    // Decode header and payload
    const headerObj = JSON.parse(new TextDecoder().decode(decode(header)))
    const payloadObj = JSON.parse(new TextDecoder().decode(decode(payload)))
    
    // Check if token is expired
    const now = Math.floor(Date.now() / 1000)
    if (payloadObj.exp && payloadObj.exp < now) {
      console.error('Token expired')
      return null
    }
    
    // Verify signature using proper HMAC verification
    const expectedSignature = await createSignature(`${header}.${payload}`)
    const signatureBytes = decode(signature)
    const expectedBytes = decode(expectedSignature)
    
    if (signatureBytes.length !== expectedBytes.length) {
      console.error('Signature length mismatch')
      return null
    }
    
    let isValid = true
    for (let i = 0; i < signatureBytes.length; i++) {
      if (signatureBytes[i] !== expectedBytes[i]) {
        isValid = false
        break
      }
    }
    
    if (!isValid) {
      console.error('Invalid signature')
      return null
    }
    
    return payloadObj as JWTPayload
  } catch (error) {
    console.error('JWT verification error:', error)
    return null
  }
}

async function createSignature(data: string): Promise<string> {
  // Convert hex string to binary data if needed
  let keyData: Uint8Array;
  if (JWT_SECRET.length === 128 && /^[0-9a-fA-F]+$/.test(JWT_SECRET)) {
    // It's a hex string, convert to binary
    const hexBytes = JWT_SECRET.match(/.{2}/g) || [];
    keyData = new Uint8Array(hexBytes.map(byte => parseInt(byte, 16)));
  } else {
    // It's a regular string, encode as UTF-8
    keyData = new TextEncoder().encode(JWT_SECRET);
  }

  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )

  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data))
  return encode(new Uint8Array(signature))
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client with service role key to bypass RLS
    const serviceSupabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get the authorization token
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const user = await verifyJWT(token)
    
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Pastor sharing settings request for user:', user.userId)

    if (req.method === 'GET') {
      // Get sharing settings
      const { data: settings, error } = await serviceSupabase
        .from('pastor_sharing_settings')
        .select('*')
        .eq('pastor_id', user.userId)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching sharing settings:', error)
        return new Response(
          JSON.stringify({ error: 'Failed to fetch sharing settings' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // If no settings exist, return default settings
      if (!settings) {
        const defaultSettings = {
          id: '',
          pastor_id: user.userId,
          is_public_enabled: false,
          public_slug: await generateSlug(user.userId, serviceSupabase),
          allow_booking_view: true,
          allow_event_types_view: true,
          show_pastor_name: true,
          show_pastor_contact: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        
        return new Response(
          JSON.stringify({ data: defaultSettings }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ data: settings }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (req.method === 'POST') {
      // Create or update sharing settings
      const body = await req.json()
      const {
        is_public_enabled,
        allow_booking_view,
        allow_event_types_view,
        show_pastor_name,
        show_pastor_contact,
        public_slug,
        sharing_type,
        sharing_token,
        token_expires_at,
        anonymous_id
      } = body

      console.log('Updating sharing settings:', body)
      
      // Use the provided values for time-limited sharing (client generates them)
      const generatedAnonymousId = sharing_type === 'time_limited' ? anonymous_id : null
      const generatedToken = sharing_type === 'time_limited' ? sharing_token : null
      
      console.log('Generated values:', {
        sharing_type,
        generatedAnonymousId,
        generatedToken,
        token_expires_at
      })

      // Check if settings already exist
      const { data: existingSettings } = await serviceSupabase
        .from('pastor_sharing_settings')
        .select('id')
        .eq('pastor_id', user.userId)
        .single()

      let result
      if (existingSettings) {
        // Update existing settings
        result = await serviceSupabase
          .from('pastor_sharing_settings')
          .update({
            is_public_enabled,
            allow_booking_view,
            allow_event_types_view,
            show_pastor_name,
            show_pastor_contact,
            public_slug: public_slug || await generateSlug(user.userId, serviceSupabase),
            sharing_type: sharing_type || 'time_limited',
            sharing_token: generatedToken,
            token_expires_at: token_expires_at || null,
            anonymous_id: generatedAnonymousId,
            updated_at: new Date().toISOString()
          })
          .eq('pastor_id', user.userId)
          .select()
          .single()
      } else {
        // Create new settings
        result = await serviceSupabase
          .from('pastor_sharing_settings')
          .insert({
            pastor_id: user.userId,
            is_public_enabled,
            allow_booking_view,
            allow_event_types_view,
            show_pastor_name,
            show_pastor_contact,
            public_slug: public_slug || await generateSlug(user.userId, serviceSupabase),
            sharing_type: sharing_type || 'time_limited',
            sharing_token: generatedToken,
            token_expires_at: token_expires_at || null,
            anonymous_id: generatedAnonymousId
          })
          .select()
          .single()
      }

      if (result.error) {
        console.error('Error saving sharing settings:', result.error)
        return new Response(
          JSON.stringify({ error: 'Failed to save sharing settings' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log('Successfully saved sharing settings:', result.data)
      return new Response(
        JSON.stringify({ data: result.data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in pastor-sharing-settings function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function generateSlug(userId: string, supabase: any): Promise<string> {
  try {
    // Try to get user's profile to use alias
    const { data: profile } = await supabase
      .from('profiles')
      .select('alias')
      .eq('id', userId)
      .single()
    
    if (profile?.alias) {
      return `${profile.alias.toLowerCase().replace(/\s+/g, '-')}-agenda`
    }
  } catch (error) {
    console.warn('Could not fetch profile for slug generation:', error)
  }
  
  // Fallback to user ID
  return `pastor-${userId.slice(0, 8)}-agenda`
}