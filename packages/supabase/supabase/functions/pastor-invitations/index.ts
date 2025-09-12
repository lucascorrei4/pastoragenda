import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from "npm:@supabase/supabase-js@2.39.3";
import { encode, decode } from "https://deno.land/std@0.168.0/encoding/base64url.ts";

// --- Configuration ---
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Content-Type': 'application/json'
};

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

// Email service function using the Brevo (Sendinblue) REST API
async function sendInvitationEmail({ to, fromPastorName, fromPastorAlias, invitationToken, permissions, invitationType }) {
  console.log('Starting invitation email send process with Brevo API...');
  const brevoApiKey = Deno.env.get("BREVO_API_KEY");
  if (!brevoApiKey) {
    console.error("BREVO_API_KEY environment variable is not set.");
    throw new Error("Email service is not configured.");
  }

  const invitationTypeText = invitationType === 'master_pastor' ? 'Master Pastor' : 'Viewer';
  const permissionsText = permissions ? Object.keys(permissions).filter(key => permissions[key]).join(', ') : 'No specific permissions';
  
  const subject = `You're Invited to Follow ${fromPastorName}'s Agenda!`;
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px;">PastorAgenda</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">
          You're invited to follow a pastor's agenda!
        </p>
      </div>
      
      <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #1e293b; margin-top: 0;">You're Invited!</h2>
        
        <p style="font-size: 16px; margin-bottom: 25px;">
          <strong>${fromPastorName}</strong> has invited you to follow their pastoral agenda and stay updated on their appointments and schedule.
        </p>
        
        <div style="background: white; border: 2px solid #e2e8f0; border-radius: 8px; padding: 25px; text-align: center; margin: 25px 0;">
          <p style="margin: 0 0 15px 0; color: #64748b; font-size: 14px;">Invitation from:</p>
          <div style="background: #0ea5e9; color: white; font-size: 24px; font-weight: bold; padding: 15px; border-radius: 6px; display: inline-block;">
            ${fromPastorName}
          </div>
        </div>
        
        <div style="background: white; border: 2px solid #e2e8f0; border-radius: 8px; padding: 25px; margin: 25px 0;">
          <h3 style="color: #0ea5e9; margin: 0 0 15px 0;">What You'll Get Access To:</h3>
          <ul style="color: #64748b; margin: 0; padding-left: 20px; text-align: left;">
            <li>View ${fromPastorName}'s upcoming appointments</li>
            <li>See their availability schedule</li>
            <li>Get notifications about new bookings</li>
            <li>Stay updated on their pastoral activities</li>
          </ul>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://pastoragenda.com/invitation/${invitationToken}" 
             style="background: #0ea5e9; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            Accept Invitation
          </a>
        </div>
        
        <div style="background: #ecfdf5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <h3 style="color: #065f46; margin: 0 0 10px 0; font-size: 16px;">What's Next?</h3>
          <ul style="color: #047857; margin: 0; padding-left: 20px;">
            <li>Click the "Accept Invitation" button above</li>
            <li>Create your PastorAgenda account if you don't have one</li>
            <li>Start following ${fromPastorName}'s agenda</li>
            <li>Stay connected with their pastoral schedule</li>
          </ul>
        </div>
        
        <p style="font-size: 14px; color: #64748b; margin-top: 30px;">
          You can also view ${fromPastorName}'s profile at: 
          <a href="https://pastoragenda.com/${fromPastorAlias}" style="color: #0ea5e9;">pastoragenda.com/${fromPastorAlias}</a>
        </p>
      </div>
      
      <div style="text-align: center; margin-top: 20px; padding: 20px; border-top: 1px solid #e2e8f0;">
        <p style="color: #94a3b8; font-size: 12px; margin: 0;">
          © 2025 PastorAgenda. All rights reserved.<br>
          This is an automated message. Please do not reply to this email.
        </p>
      </div>
    </body>
    </html>
  `.trim();

  const emailPayload = {
    sender: {
      name: "PastorAgenda",
      email: "invitations@pastoragenda.com"
    },
    to: [
      {
        email: to
      }
    ],
    subject: subject,
    htmlContent: htmlContent
  };

  try {
    console.log('Sending invitation email via Brevo API to:', to);
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "api-key": brevoApiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(emailPayload)
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("Brevo API error response:", errorBody);
      throw new Error(`Failed to send email. Status: ${response.status}, Response: ${errorBody}`);
    }

    const data = await response.json();
    console.log('Invitation email sent successfully via Brevo API:', data.messageId);
  } catch (apiError) {
    console.error('Error calling Brevo API for invitation email:', apiError);
    throw apiError;
  }
}

// Send push notification for invitation
async function sendInvitationNotification({ userEmail, fromPastorName, invitationType }) {
  console.log('Sending invitation push notification...');
  
  const notificationData = {
    title: "New PastorAgenda Invitation",
    body: `${fromPastorName} has invited you to follow their agenda`,
    userEmail: userEmail,
    data: {
      type: 'invitation',
      fromPastor: fromPastorName,
      invitationType: invitationType
    }
  };

  try {
    const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-notification`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(notificationData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error sending push notification:', errorText);
      throw new Error(`Failed to send notification: ${response.status}`);
    }

    const result = await response.json();
    console.log('Push notification sent successfully:', result);
  } catch (error) {
    console.error('Error sending push notification:', error);
    throw error;
  }
}

// --- Main Server Logic ---
serve(async (req) => {
  console.log('=== PASTOR-INVITATIONS REQUEST ===');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Create Supabase client with service role key
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '', 
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get the Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    // Extract the JWT token
    const token = authHeader.replace('Bearer ', '');
    
    // Use custom JWT verification
    console.log('Verifying custom JWT token...');
    const payload = await verifyJWT(token);
    
    if (!payload) {
      console.error('Invalid or expired custom JWT token');
      return new Response(JSON.stringify({ error: 'Invalid or expired token' }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    console.log(`User ${payload.userId} authenticated successfully via custom JWT.`);

    // Get user profile from database
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, full_name, alias, email_verified, last_login_at')
      .eq('id', payload.userId)
      .single();

    if (profileError || !profile) {
      console.error('Error fetching profile:', profileError);
      return new Response(JSON.stringify({ error: 'User profile not found' }), {
        status: 404,
        headers: corsHeaders,
      });
    }

    const user = {
      id: profile.id,
      email: profile.email,
      full_name: profile.full_name,
      alias: profile.alias,
      email_verified: profile.email_verified,
      last_login_at: profile.last_login_at
    };

    // --- Routing ---
    const url = new URL(req.url);
    const path = url.pathname.split('/').pop();

    // GET requests
    if (req.method === 'GET' && path === 'followed-pastors') {
      // Fetch followed pastors for the master pastor
      const { data: follows, error: followsError } = await supabase
        .from('master_pastor_follows')
        .select(`
          *,
          followed_pastor:profiles!master_pastor_follows_followed_pastor_id_fkey(
            id,
            alias,
            full_name,
            email,
            avatar_url
          )
        `)
        .eq('master_pastor_id', user.id)
        .order('created_at', { ascending: false });

      if (followsError) {
        console.error('Error fetching followed pastors:', followsError);
        throw followsError;
      }

      console.log('Raw follows data:', JSON.stringify(follows, null, 2));

      // Filter out the master pastor from the followed pastors list
      const filteredFollows = (follows || []).filter(follow => follow.followed_pastor_id !== user.id);
      console.log('Filtered follows (excluding master pastor):', JSON.stringify(filteredFollows, null, 2));

      // Fetch sharing settings for each followed pastor
      const followsWithSettings = await Promise.all(
        filteredFollows.map(async (follow) => {
          const { data: settings } = await supabase
            .from('pastor_sharing_settings')
            .select('*')
            .eq('pastor_id', follow.followed_pastor_id)
            .single();

          return {
            ...follow,
            sharing_settings: settings
          };
        })
      );

      console.log('Follows with settings:', JSON.stringify(followsWithSettings, null, 2));
      
      return new Response(JSON.stringify({ data: followsWithSettings }), { headers: corsHeaders });
    }

    if (req.method === 'GET' && path === 'received') {
      // Fetch only pending invitations
      const { data: invitations, error: invitationsError } = await supabase
        .from('pastor_invitations')
        .select('*')
        .eq('to_email', user.email)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (invitationsError) {
        console.error('Error fetching invitations:', invitationsError);
        throw invitationsError;
      }

      console.log('Raw invitations data:', JSON.stringify(invitations, null, 2));

      // Now fetch the pastor details for each invitation
      const invitationsWithPastors = await Promise.all(
        invitations.map(async (invitation) => {
          const { data: pastor, error: pastorError } = await supabase
            .from('profiles')
            .select('id, alias, full_name, email')
            .eq('id', invitation.from_pastor_id)
            .single();

          if (pastorError) {
            console.error('Error fetching pastor for invitation:', invitation.id, pastorError);
            return {
              ...invitation,
              from_pastor: null
            };
          }

          return {
            ...invitation,
            from_pastor: pastor
          };
        })
      );

      console.log('Invitations with pastors:', JSON.stringify(invitationsWithPastors, null, 2));
      
      // Additional debugging
      console.log('=== FINAL RESPONSE DEBUG ===');
      console.log('Number of invitations:', invitationsWithPastors.length);
      invitationsWithPastors.forEach((inv, index) => {
        console.log(`Invitation ${index}:`, {
          id: inv.id,
          from_pastor_id: inv.from_pastor_id,
          from_pastor: inv.from_pastor,
          to_email: inv.to_email
        });
      });
      console.log('===========================');
      
      return new Response(JSON.stringify({ data: invitationsWithPastors }), { headers: corsHeaders });
    }

    // POST requests
    if (req.method === 'POST') {
      const body = await req.json();

      if (path === 'bookings') {
        console.log('=== FETCHING BOOKINGS ===');
        console.log('Master pastor ID:', user.id);
        console.log('Request body:', body);
        
        // First get the followed pastors
        const { data: follows, error: followsError } = await supabase
          .from('master_pastor_follows')
          .select('followed_pastor_id')
          .eq('master_pastor_id', user.id)
          .eq('invitation_status', 'accepted');

        if (followsError) {
          console.error('Error fetching followed pastors:', followsError);
          throw followsError;
        }

        console.log('Followed pastors:', follows);

        const followedPastorIds = follows?.map(f => f.followed_pastor_id) || [];
        
        // Explicitly exclude the master pastor's own ID to prevent self-following
        const filteredPastorIds = followedPastorIds.filter(id => id !== user.id);
        
        console.log('All followed pastor IDs:', followedPastorIds);
        console.log('Master pastor ID (to exclude):', user.id);
        console.log('Filtered pastor IDs (excluding master):', filteredPastorIds);
        console.log('Is master pastor following themselves?', followedPastorIds.includes(user.id));
        
        if (filteredPastorIds.length === 0) {
          console.log('No followed pastors found (excluding master pastor)');
          return new Response(JSON.stringify({ data: [] }), { headers: corsHeaders });
        }

        // Fetch bookings for followed pastors using service role
        const pastorId = body.pastor_id;
        
        // Use service role to bypass RLS
        const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.38.4');
        const serviceSupabase = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );
        
        let bookingsQuery = serviceSupabase
          .from('bookings')
          .select(`
            *,
            event_type:event_types!bookings_event_type_id_fkey(
              id,
              title,
              duration,
              user_id,
              pastor:profiles!event_types_user_id_fkey(
                id,
                full_name,
                alias
              )
            )
          `)
          .in('event_type.user_id', filteredPastorIds)
          .order('start_time', { ascending: false });

        // Filter by specific pastor if requested
        if (pastorId && pastorId !== 'all') {
          console.log('Filtering by pastor ID:', pastorId);
          bookingsQuery = bookingsQuery.eq('event_type.user_id', pastorId);
        }

        const { data: bookings, error: bookingsError } = await bookingsQuery;

        if (bookingsError) {
          console.error('Error fetching bookings:', bookingsError);
          throw bookingsError;
        }

        console.log('Raw bookings data:', JSON.stringify(bookings, null, 2));

        // Transform the data to include pastor name and filter out invalid bookings
        const transformedBookings = (bookings || [])
          .filter(booking => {
            // Only include bookings that have a valid event_type with a pastor
            const hasValidEventType = booking.event_type && 
                                    booking.event_type.pastor && 
                                    booking.event_type.pastor.id;
            console.log(`Booking ${booking.id}: hasValidEventType=${hasValidEventType}, event_type=${JSON.stringify(booking.event_type)}`);
            return hasValidEventType;
          })
          .map(booking => ({
            ...booking,
            pastor_name: booking.event_type?.pastor?.full_name || booking.event_type?.pastor?.alias || 'Unknown Pastor'
          }));

        console.log('Transformed bookings data:', JSON.stringify(transformedBookings, null, 2));
        console.log('Bookings count by pastor:');
        const pastorCounts = transformedBookings.reduce((acc, booking) => {
          const pastor = booking.pastor_name;
          acc[pastor] = (acc[pastor] || 0) + 1;
          return acc;
        }, {});
        console.log(pastorCounts);
        
        return new Response(JSON.stringify({ data: transformedBookings }), { headers: corsHeaders });
      }

      if (path === 'pastor-agenda') {
        // Fetch pastor agenda data for master pastor
        const pastorAlias = body.pastor_alias;
        
        console.log('=== FETCHING PASTOR AGENDA ===');
        console.log('Master pastor ID:', user.id);
        console.log('Pastor alias (followed pastor):', pastorAlias);
        console.log('Master pastor email:', user.email);
        
        // First, look up the pastor by alias to get their ID
        const { data: pastorProfile, error: pastorLookupError } = await supabase
          .from('profiles')
          .select('id, alias, full_name, email')
          .eq('alias', pastorAlias)
          .single();

        if (pastorLookupError || !pastorProfile) {
          console.error('Error looking up pastor by alias:', pastorLookupError);
          return new Response(JSON.stringify({ error: 'Pastor not found' }), { 
            status: 404, 
            headers: corsHeaders 
          });
        }

        const pastorId = pastorProfile.id;
        console.log('Found pastor ID:', pastorId, 'for alias:', pastorAlias);
        console.log('Are IDs the same?', user.id === pastorId);
        
        // First verify that the master pastor is following this pastor
        const { data: followData, error: followError } = await supabase
          .from('master_pastor_follows')
          .select('*')
          .eq('master_pastor_id', user.id)
          .eq('followed_pastor_id', pastorId)
          .eq('invitation_status', 'accepted');

        if (followError) {
          console.error('Error checking follow relationship:', followError);
          throw followError;
        }

        if (!followData || followData.length === 0) {
          console.log('No follow relationship found');
          return new Response(JSON.stringify({ error: 'You are not authorized to view this pastor\'s agenda' }), { 
            status: 403, 
            headers: corsHeaders 
          });
        }

        console.log('Follow relationship verified:', followData[0]);

        // Use service role to fetch pastor data
        const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.38.4');
        const serviceSupabase = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        // Fetch pastor profile
        const { data: pastorData, error: pastorError } = await serviceSupabase
          .from('profiles')
          .select('*')
          .eq('id', pastorId)
          .single();

        if (pastorError || !pastorData) {
          console.error('Error fetching pastor profile:', pastorError);
          return new Response(JSON.stringify({ error: 'Pastor not found' }), { 
            status: 404, 
            headers: corsHeaders 
          });
        }

        // Fetch event types
        const { data: eventTypesData, error: eventTypesError } = await serviceSupabase
          .from('event_types')
          .select('*')
          .eq('user_id', pastorId);

        if (eventTypesError) {
          console.error('Error fetching event types:', eventTypesError);
        }

        // Fetch recent bookings
        console.log('Fetching bookings for pastor ID:', pastorId);
        
        // First get the event type IDs for this pastor
        const { data: pastorEventTypes, error: eventTypesError2 } = await serviceSupabase
          .from('event_types')
          .select('id')
          .eq('user_id', pastorId);

        if (eventTypesError2) {
          console.error('Error fetching pastor event types:', eventTypesError2);
        }

        const pastorEventTypeIds = pastorEventTypes?.map(et => et.id) || [];
        console.log('Pastor event type IDs:', pastorEventTypeIds);

        if (pastorEventTypeIds.length === 0) {
          console.log('No event types found for pastor, returning empty bookings');
          const responseData = {
            pastor: pastorData,
            eventTypes: eventTypesData || [],
            bookings: []
          };
          return new Response(JSON.stringify({ data: responseData }), { headers: corsHeaders });
        }

        // Now fetch bookings for these event types
        const { data: bookingsData, error: bookingsError } = await serviceSupabase
          .from('bookings')
          .select(`
            *,
            event_type:event_types!bookings_event_type_id_fkey(
              id,
              title,
              duration,
              user_id
            )
          `)
          .in('event_type_id', pastorEventTypeIds)
          .order('start_time', { ascending: false })
          .limit(10);

        console.log('Bookings query result:', { bookingsData, bookingsError });

        if (bookingsError) {
          console.error('Error fetching bookings:', bookingsError);
        }

        const responseData = {
          pastor: pastorData,
          eventTypes: eventTypesData || [],
          bookings: bookingsData || []
        };

        console.log('Pastor agenda data:', JSON.stringify(responseData, null, 2));
        console.log('Bookings count:', bookingsData?.length || 0);
        if (bookingsData && bookingsData.length > 0) {
          console.log('All bookings details:');
          bookingsData.forEach((booking, index) => {
            console.log(`Booking ${index + 1}:`, {
              id: booking.id,
              event_type_user_id: booking.event_type?.user_id,
              expected_pastor_id: pastorId,
              booker_name: booking.booker_name,
              start_time: booking.start_time,
              is_correct_pastor: booking.event_type?.user_id === pastorId
            });
          });
        }
        
        return new Response(JSON.stringify({ data: responseData }), { headers: corsHeaders });
      }

      if (path === 'invite') {
        // Generate a unique invitation token
        const invitationToken = crypto.randomUUID();
        
        const { data, error } = await supabase
          .from('pastor_invitations')
          .insert({ 
            from_pastor_id: user.id, 
            to_email: body.to_email, 
            invitation_token: invitationToken,
            invitation_type: body.invitation_type || 'master_pastor',
            permissions: body.permissions,
            status: 'pending'
          })
          .select().single();

        if (error) throw error;

        // Send invitation email
        try {
          await sendInvitationEmail({
            to: body.to_email,
            fromPastorName: user.full_name,
            fromPastorAlias: user.alias,
            invitationToken: invitationToken,
            permissions: body.permissions,
            invitationType: body.invitation_type || 'master_pastor'
          });
          console.log('Invitation email sent to:', body.to_email);
        } catch (emailError) {
          console.error('Error sending invitation email:', emailError);
          // Don't fail the request if email fails
        }

        // Send push notification if user has devices registered
        try {
          await sendInvitationNotification({
            userEmail: body.to_email,
            fromPastorName: user.full_name,
            invitationType: body.invitation_type || 'master_pastor'
          });
          console.log('Invitation notification sent to:', body.to_email);
        } catch (notificationError) {
          console.error('Error sending invitation notification:', notificationError);
          // Don't fail the request if notification fails
        }

        return new Response(JSON.stringify({ data }), { status: 201, headers: corsHeaders });
      }

      if (path === 'respond') {
        console.log('=== PROCESSING INVITATION RESPONSE ===');
        console.log('User ID:', user.id);
        console.log('User email:', user.email);
        console.log('Invitation ID:', body.invitation_id);
        console.log('Response:', body.response);

        // First, get the invitation details
        const { data: invitation, error: invitationError } = await supabase
          .from('pastor_invitations')
          .select('*')
          .eq('id', body.invitation_id)
          .eq('to_email', user.email)
          .single();

        console.log('Invitation query result:', { invitation, invitationError });

        if (invitationError || !invitation) {
          console.error('Invitation not found:', invitationError);
          throw new Error('Invitation not found');
        }

        console.log('Found invitation:', invitation);

        // Update the invitation status
        const { data: updatedInvitation, error: updateError } = await supabase
          .from('pastor_invitations')
          .update({ 
            status: body.response, 
            accepted_by: body.response === 'accepted' ? user.id : null,
            responded_at: new Date().toISOString()
          })
          .eq('id', body.invitation_id)
          .eq('to_email', user.email)
          .select().single();

        console.log('Invitation update result:', { updatedInvitation, updateError });

        if (updateError) {
          console.error('Error updating invitation:', updateError);
          throw updateError;
        }

        // If accepted, create the follow relationship in master_pastor_follows
        if (body.response === 'accepted') {
          console.log('Creating follow relationship...');
          console.log('Master pastor ID:', user.id);
          console.log('Followed pastor ID:', invitation.from_pastor_id);
          
          const followData = {
            master_pastor_id: user.id,
            followed_pastor_id: invitation.from_pastor_id,
            invitation_status: 'accepted',
            invited_by: invitation.from_pastor_id,
            invitation_token: invitation.invitation_token,
            responded_at: new Date().toISOString()
          };
          
          console.log('Follow data to insert:', followData);

          const { data: followResult, error: followError } = await supabase
            .from('master_pastor_follows')
            .insert(followData)
            .select();

          console.log('Follow creation result:', { followResult, followError });

          if (followError) {
            console.error('Error creating follow relationship:', followError);
            // Don't fail the request if follow creation fails, but log it
          } else {
            console.log('Follow relationship created successfully:', followResult);
          }
        }

        return new Response(JSON.stringify({ data: updatedInvitation }), { headers: corsHeaders });
      }
    }

    // Fallback for unmatched routes
    return new Response(JSON.stringify({ error: 'Route not found' }), { status: 404, headers: corsHeaders });

  } catch (error) {
    console.error('Internal Server Error:', error.message);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500, headers: corsHeaders });
  }
});
