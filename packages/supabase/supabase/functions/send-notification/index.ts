import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NotificationData {
  title: string;
  body: string;
  data?: any;
  userId?: string;
  userEmail?: string;
  deviceId?: string;
  platform?: string;
  sound?: string;
  badge?: number;
  channelId?: string;
}

interface ExpoMessage {
  to: string;
  title: string;
  body: string;
  data?: any;
  sound?: string;
  badge?: number;
  channelId?: string;
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
    const body: NotificationData = await req.json()
    
    // Validate required fields
    if (!body.title || !body.body) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required fields: title, body' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Build query to get devices
    let query = supabaseClient
      .from('devices')
      .select('push_token, platform, user_id, user_email, device_id')
      .eq('is_active', true)

    // Filter by user if specified
    if (body.userId) {
      query = query.eq('user_id', body.userId)
    } else if (body.userEmail) {
      query = query.eq('user_email', body.userEmail)
    } else if (body.deviceId) {
      query = query.eq('device_id', body.deviceId)
    } else if (body.platform) {
      query = query.eq('platform', body.platform)
    }

    const { data: devices, error: fetchError } = await query

    if (fetchError) {
      console.error('Database error:', fetchError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to fetch devices',
          details: fetchError.message 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (!devices || devices.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'No active devices found for the specified criteria' 
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Prepare messages for Expo Push API
    const messages: ExpoMessage[] = devices.map(device => ({
      to: device.push_token,
      title: body.title,
      body: body.body,
      data: {
        ...body.data,
        userId: device.user_id,
        userEmail: device.user_email,
        deviceId: device.device_id,
        platform: device.platform,
      },
      sound: body.sound || 'default',
      badge: body.badge,
      channelId: body.channelId || 'pastor_agenda_notifications',
    }))

    // Send notifications via Expo Push API
    const expoPushUrl = 'https://exp.host/--/api/v2/push/send'
    const expoResponse = await fetch(expoPushUrl, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    })

    const expoResult = await expoResponse.json()

    // Log the notification attempt
    console.log(`Notification sent to ${devices.length} devices:`, {
      title: body.title,
      body: body.body,
      userId: body.userId,
      userEmail: body.userEmail,
      deviceCount: devices.length,
      expoResult
    })

    // Update last_seen for all devices
    const deviceIds = devices.map(d => d.device_id)
    await supabaseClient
      .from('devices')
      .update({ last_seen: new Date().toISOString() })
      .in('device_id', deviceIds)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Notification sent to ${devices.length} devices`,
        deviceCount: devices.length,
        expoResult
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
