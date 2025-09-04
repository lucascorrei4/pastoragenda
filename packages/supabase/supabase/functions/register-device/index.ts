import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PushTokenData {
  token: string;
  type: 'expo' | 'fcm' | 'apns';
  deviceId: string;
  platform: string;
  userEmail?: string;
  userId?: string;
  appVersion?: string;
  deviceModel?: string;
  osVersion?: string;
}

interface DeviceRecord {
  id?: string;
  user_id?: string;
  user_email?: string;
  push_token: string;
  token_type: string;
  device_id: string;
  platform: string;
  app_version?: string;
  device_model?: string;
  os_version?: string;
  is_active: boolean;
  last_seen: string;
  created_at?: string;
  updated_at?: string;
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
    const body: PushTokenData = await req.json()
    
    // Validate required fields
    if (!body.token || !body.deviceId || !body.platform) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required fields: token, deviceId, platform' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get user from JWT token if available
    let userId: string | null = null
    let userEmail: string | null = null

    try {
      const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
      if (user && !userError) {
        userId = user.id
        userEmail = user.email || null
      }
    } catch (error) {
      console.log('No authenticated user:', error.message)
    }

    // Check if device already exists
    const { data: existingDevice, error: fetchError } = await supabaseClient
      .from('devices')
      .select('*')
      .eq('device_id', body.deviceId)
      .eq('platform', body.platform)
      .single()

    const now = new Date().toISOString()
    const deviceData: DeviceRecord = {
      user_id: userId || body.userId || null,
      user_email: userEmail || body.userEmail || null,
      push_token: body.token,
      token_type: body.type || 'expo',
      device_id: body.deviceId,
      platform: body.platform,
      app_version: body.appVersion || '1.0.0',
      device_model: body.deviceModel || null,
      os_version: body.osVersion || null,
      is_active: true,
      last_seen: now,
    }

    let result
    let error

    if (existingDevice) {
      // Update existing device
      const { data, error: updateError } = await supabaseClient
        .from('devices')
        .update({
          ...deviceData,
          updated_at: now,
        })
        .eq('id', existingDevice.id)
        .select()
        .single()

      result = data
      error = updateError
    } else {
      // Create new device
      const { data, error: insertError } = await supabaseClient
        .from('devices')
        .insert(deviceData)
        .select()
        .single()

      result = data
      error = insertError
    }

    if (error) {
      console.error('Database error:', error)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to register device',
          details: error.message 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Log successful registration
    console.log(`Device registered: ${body.deviceId} for user: ${userId || 'anonymous'}`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Device registered successfully',
        deviceId: result.id,
        userId: result.user_id,
        userEmail: result.user_email
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
