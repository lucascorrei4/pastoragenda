import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
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

    const [headerB64, payloadB64, signatureB64] = parts

    // Verify signature
    const expectedSignature = await createSignature(`${headerB64}.${payloadB64}`)
    if (signatureB64 !== expectedSignature) {
      console.error('Invalid JWT signature')
      return null
    }

    // Decode payload
    const payloadJson = new TextDecoder().decode(decode(payloadB64))
    const payload: JWTPayload = JSON.parse(payloadJson)

    // Check expiration
    const now = Math.floor(Date.now() / 1000)
    if (payload.exp < now) {
      console.error('JWT token expired')
      return null
    }

    return payload
  } catch (error) {
    console.error('Error verifying JWT:', error)
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
    // Create Supabase client with service role key
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { method } = req
    const url = new URL(req.url)
    const pathSegments = url.pathname.split('/').filter(Boolean)
    const action = pathSegments[pathSegments.length - 1]

    // Get user from custom JWT
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    
    // Verify the custom JWT token
    const payload = await verifyJWT(token)
    if (!payload) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get user profile to ensure user exists
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('id, email, full_name, alias')
      .eq('id', payload.userId)
      .single()

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: 'User profile not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const user = { id: profile.id, email: profile.email }

    switch (method) {
      case 'GET':
        return await handleGet(supabaseClient, user.id, action)
      
      case 'POST':
        return await handlePost(supabaseClient, user.id, req, action)
      
      case 'PUT':
        return await handlePut(supabaseClient, user.id, req, action)
      
      case 'DELETE':
        return await handleDelete(supabaseClient, user.id, action)
      
      default:
        return new Response(
          JSON.stringify({ error: 'Method not allowed' }),
          { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
  } catch (error) {
    console.error('Error in pastor-sharing-settings function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function handleGet(supabaseClient: any, userId: string, action: string) {
  try {
    switch (action) {
      case 'settings':
        // Get user's sharing settings
        const { data: settings, error: settingsError } = await supabaseClient
          .from('pastor_sharing_settings')
          .select('*')
          .eq('pastor_id', userId)
          .single()

        if (settingsError && settingsError.code !== 'PGRST116') {
          throw settingsError
        }

        return new Response(
          JSON.stringify({ data: settings }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

      case 'follows':
        // Get pastors that this user follows
        const { data: follows, error: followsError } = await supabaseClient
          .from('master_pastor_follows')
          .select(`
            *,
            followed_pastor:profiles!master_pastor_follows_followed_pastor_id_fkey (
              id,
              full_name,
              alias,
              avatar_url
            )
          `)
          .eq('master_pastor_id', userId)
          .eq('invitation_status', 'accepted')

        if (followsError) throw followsError

        return new Response(
          JSON.stringify({ data: follows }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

      case 'invitations':
        // Get invitations sent by this user
        const { data: invitations, error: invitationsError } = await supabaseClient
          .from('pastor_invitations')
          .select('*')
          .eq('from_pastor_id', userId)
          .order('created_at', { ascending: false })

        if (invitationsError) throw invitationsError

        return new Response(
          JSON.stringify({ data: invitations }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
  } catch (error) {
    console.error('Error in GET handler:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

async function handlePost(supabaseClient: any, userId: string, req: Request, action: string) {
  try {
    const body = await req.json()

    switch (action) {
      case 'settings':
        // Create or update sharing settings
        const { data: settings, error: settingsError } = await supabaseClient
          .from('pastor_sharing_settings')
          .upsert({
            pastor_id: userId,
            ...body
          })
          .select()
          .single()

        if (settingsError) throw settingsError

        return new Response(
          JSON.stringify({ data: settings }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

      case 'invite':
        // Send invitation to master pastor
        const { data: invitation, error: invitationError } = await supabaseClient
          .from('pastor_invitations')
          .insert({
            from_pastor_id: userId,
            to_email: body.email,
            invitation_type: body.type || 'master_pastor',
            permissions: body.permissions || {
              view_bookings: true,
              view_event_types: false,
              view_contact: false
            }
          })
          .select()
          .single()

        if (invitationError) throw invitationError

        // TODO: Send email notification here
        console.log('Invitation created:', invitation)

        return new Response(
          JSON.stringify({ data: invitation }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
  } catch (error) {
    console.error('Error in POST handler:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

async function handlePut(supabaseClient: any, userId: string, req: Request, action: string) {
  try {
    const body = await req.json()

    switch (action) {
      case 'settings':
        // Update sharing settings
        const { data: settings, error: settingsError } = await supabaseClient
          .from('pastor_sharing_settings')
          .update(body)
          .eq('pastor_id', userId)
          .select()
          .single()

        if (settingsError) throw settingsError

        return new Response(
          JSON.stringify({ data: settings }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

      case 'follow':
        // Accept or decline follow invitation
        const { data: follow, error: followError } = await supabaseClient
          .from('master_pastor_follows')
          .update({
            invitation_status: body.status,
            responded_at: new Date().toISOString()
          })
          .eq('id', body.follow_id)
          .eq('followed_pastor_id', userId)
          .select()
          .single()

        if (followError) throw followError

        return new Response(
          JSON.stringify({ data: follow }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
  } catch (error) {
    console.error('Error in PUT handler:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

async function handleDelete(supabaseClient: any, userId: string, action: string) {
  try {
    switch (action) {
      case 'follow':
        // Remove follow relationship
        const { error: followError } = await supabaseClient
          .from('master_pastor_follows')
          .delete()
          .eq('master_pastor_id', userId)
          .eq('followed_pastor_id', action)

        if (followError) throw followError

        return new Response(
          JSON.stringify({ success: true }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
  } catch (error) {
    console.error('Error in DELETE handler:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}
