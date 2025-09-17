// on-booking-cancelled Edge Function
// Sends cancellation emails when a booking is cancelled
import { createClient } from "npm:@supabase/supabase-js@2.39.3";

// CORS headers for all responses
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json"
};

// Email service function for user cancellation notification
async function sendUserCancellationEmail({ to, bookerName, pastorName, eventTitle, date, time, duration, pastorAlias }) {
  console.log('Starting user cancellation email send process with Brevo API...');
  const brevoApiKey = Deno.env.get("BREVO_API_KEY");
  if (!brevoApiKey) {
    console.error("BREVO_API_KEY environment variable is not set.");
    throw new Error("Email service is not configured.");
  }

  const subject = `Appointment Cancelled: ${eventTitle} with ${pastorName}`;
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Appointment Cancelled</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Appointment Cancelled</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">
          Your appointment has been successfully cancelled
        </p>
      </div>
      
      <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #1e293b; margin-top: 0;">Hello ${bookerName}!</h2>
        
        <p style="font-size: 16px; margin-bottom: 25px;">
          Your appointment with <strong>${pastorName}</strong> has been cancelled. Here are the details of the cancelled appointment:
        </p>
        
        <div style="background: white; border: 2px solid #fecaca; border-radius: 8px; padding: 25px; margin: 25px 0;">
          <h3 style="color: #dc2626; margin-top: 0;">Cancelled Appointment Details</h3>
          <div style="display: grid; gap: 10px;">
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f1f5f9;">
              <span style="font-weight: bold; color: #64748b;">Event:</span>
              <span style="color: #1e293b;">${eventTitle}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f1f5f9;">
              <span style="font-weight: bold; color: #64748b;">Date:</span>
              <span style="color: #1e293b;">${date}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f1f5f9;">
              <span style="font-weight: bold; color: #64748b;">Time:</span>
              <span style="color: #1e293b;">${time}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 8px 0;">
              <span style="font-weight: bold; color: #64748b;">Duration:</span>
              <span style="color: #1e293b;">${duration} minutes</span>
            </div>
          </div>
        </div>
        
        <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <h3 style="color: #92400e; margin: 0 0 10px 0; font-size: 16px;">📅 What's Next?</h3>
          <ul style="color: #b45309; margin: 0; padding-left: 20px;">
            <li>You can book a new appointment anytime</li>
            <li>Contact ${pastorName} if you have any questions</li>
            <li>We hope to see you again soon!</li>
          </ul>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://pastoragenda.com/${pastorAlias}" 
             style="background: #0ea5e9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            Book Another Appointment
          </a>
        </div>
        
        <p style="font-size: 14px; color: #64748b; margin-top: 30px;">
          You can view ${pastorName}'s profile at: 
          <a href="https://pastoragenda.com/${pastorAlias}" style="color: #0ea5e9;">pastoragenda.com/${pastorAlias}</a>
        </p>
      </div>
      
      <div style="text-align: center; margin-top: 20px; padding: 20px; border-top: 1px solid #e2e8f0;">
        <p style="color: #94a3b8; font-size: 12px; margin: 0;">
          © 2025 PastorAgenda. All rights reserved.<br>
          This is an automated notification. Please do not reply to this email.
        </p>
      </div>
    </body>
    </html>
  `.trim();

  const emailPayload = {
    sender: {
      name: "PastorAgenda",
      email: "cancellations@pastoragenda.com"
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
    console.log('Sending user cancellation email via Brevo API to:', to);
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
      console.error("Brevo API error response for user cancellation:", errorBody);
      throw new Error(`Failed to send email. Status: ${response.status}, Response: ${errorBody}`);
    }

    const data = await response.json();
    console.log('User cancellation email sent successfully via Brevo API:', data.messageId);
  } catch (apiError) {
    console.error('Error calling Brevo API for user cancellation:', apiError);
    throw apiError;
  }
}

// Email service function for pastor cancellation notification
async function sendPastorCancellationEmail({ to, pastorName, bookerName, bookerEmail, eventTitle, date, time, duration, description }) {
  console.log('Starting pastor cancellation email send process with Brevo API...');
  const brevoApiKey = Deno.env.get("BREVO_API_KEY");
  if (!brevoApiKey) {
    console.error("BREVO_API_KEY environment variable is not set.");
    throw new Error("Email service is not configured.");
  }

  const subject = `Appointment Cancelled: ${eventTitle} with ${bookerName}`;
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Appointment Cancelled</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Appointment Cancelled</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">
          An appointment has been cancelled
        </p>
      </div>
      
      <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #1e293b; margin-top: 0;">Hello ${pastorName}!</h2>
        
        <p style="font-size: 16px; margin-bottom: 25px;">
          <strong>${bookerName}</strong> has cancelled their appointment with you. Here are the details of the cancelled appointment:
        </p>
        
        <div style="background: white; border: 2px solid #fecaca; border-radius: 8px; padding: 25px; margin: 25px 0;">
          <h3 style="color: #dc2626; margin-top: 0;">Cancelled Appointment Details</h3>
          <div style="display: grid; gap: 10px;">
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f1f5f9;">
              <span style="font-weight: bold; color: #64748b;">Event:</span>
              <span style="color: #1e293b;">${eventTitle}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f1f5f9;">
              <span style="font-weight: bold; color: #64748b;">Date:</span>
              <span style="color: #1e293b;">${date}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f1f5f9;">
              <span style="font-weight: bold; color: #64748b;">Time:</span>
              <span style="color: #1e293b;">${time}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f1f5f9;">
              <span style="font-weight: bold; color: #64748b;">Duration:</span>
              <span style="color: #1e293b;">${duration} minutes</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f1f5f9;">
              <span style="font-weight: bold; color: #64748b;">Booker:</span>
              <span style="color: #1e293b;">${bookerName}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 8px 0;">
              <span style="font-weight: bold; color: #64748b;">Email:</span>
              <span style="color: #1e293b;">${bookerEmail}</span>
            </div>
          </div>
          ${description ? `
          <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #f1f5f9;">
            <span style="font-weight: bold; color: #64748b;">Description:</span>
            <p style="color: #1e293b; margin: 5px 0 0 0;">${description}</p>
          </div>
          ` : ''}
        </div>
        
        <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <h3 style="color: #92400e; margin: 0 0 10px 0; font-size: 16px;">📅 Next Steps:</h3>
          <ul style="color: #b45309; margin: 0; padding-left: 20px;">
            <li>This time slot is now available for new bookings</li>
            <li>You can contact ${bookerName} if you have any questions</li>
            <li>Check your dashboard for other upcoming appointments</li>
          </ul>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://pastoragenda.com/dashboard/bookings" 
             style="background: #0ea5e9; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; margin-right: 10px;">
            View Bookings
          </a>
          <a href="https://pastoragenda.com/dashboard" 
             style="background: #6b7280; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            View Dashboard
          </a>
        </div>
      </div>
      
      <div style="text-align: center; margin-top: 20px; padding: 20px; border-top: 1px solid #e2e8f0;">
        <p style="color: #94a3b8; font-size: 12px; margin: 0;">
          © 2025 PastorAgenda. All rights reserved.<br>
          This is an automated notification. Please do not reply to this email.
        </p>
      </div>
    </body>
    </html>
  `.trim();

  const emailPayload = {
    sender: {
      name: "PastorAgenda",
      email: "cancellations@pastoragenda.com"
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
    console.log('Sending pastor cancellation email via Brevo API to:', to);
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
      console.error("Brevo API error response for pastor cancellation:", errorBody);
      throw new Error(`Failed to send email. Status: ${response.status}, Response: ${errorBody}`);
    }

    const data = await response.json();
    console.log('Pastor cancellation email sent successfully via Brevo API:', data.messageId);
  } catch (apiError) {
    console.error('Error calling Brevo API for pastor cancellation:', apiError);
    throw apiError;
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({
      error: "Method not allowed"
    }), {
      headers: corsHeaders,
      status: 405
    });
  }

  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");
    
    // Get the request body
    const { bookingId } = await req.json();
    
    if (!bookingId) {
      return new Response(JSON.stringify({
        error: "Booking ID is required"
      }), {
        headers: corsHeaders,
        status: 400
      });
    }

    console.log('Processing cancellation for booking:', bookingId);

    // Fetch booking details with related data
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        *,
        event_types (
          title,
          duration,
          user_id
        )
      `)
      .eq('id', bookingId)
      .single();

    if (bookingError) {
      console.error('Error fetching booking:', bookingError);
      return new Response(JSON.stringify({
        error: 'Failed to fetch booking details'
      }), {
        headers: corsHeaders,
        status: 500
      });
    }

    // Fetch pastor profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('full_name, alias, email')
      .eq('id', booking.event_types?.user_id)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      return new Response(JSON.stringify({
        error: 'Failed to fetch pastor profile'
      }), {
        headers: corsHeaders,
        status: 500
      });
    }

    // Format the appointment details
    const appointmentDate = new Date(booking.start_time);
    const formattedDate = appointmentDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const formattedTime = appointmentDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    // Send cancellation email to the booker
    try {
      await sendUserCancellationEmail({
        to: booking.booker_email,
        bookerName: booking.booker_name,
        pastorName: profile.full_name,
        eventTitle: booking.event_types?.title || 'Appointment',
        date: formattedDate,
        time: formattedTime,
        duration: booking.event_types?.duration || 0,
        pastorAlias: profile.alias
      });
      console.log('Cancellation email sent to booker:', booking.booker_email);
    } catch (emailError) {
      console.error('Error sending cancellation email to booker:', emailError);
    }

    // Send cancellation email to the pastor
    try {
      await sendPastorCancellationEmail({
        to: profile.email,
        pastorName: profile.full_name,
        bookerName: booking.booker_name,
        bookerEmail: booking.booker_email,
        eventTitle: booking.event_types?.title || 'Appointment',
        date: formattedDate,
        time: formattedTime,
        duration: booking.event_types?.duration || 0,
        description: booking.booker_description || ''
      });
      console.log('Cancellation email sent to pastor:', profile.email);
    } catch (emailError) {
      console.error('Error sending cancellation email to pastor:', emailError);
    }

    return new Response(JSON.stringify({
      message: 'Cancellation emails sent successfully to both booker and pastor',
      bookingId: bookingId
    }), {
      headers: corsHeaders,
      status: 200
    });

  } catch (error) {
    console.error('Error processing cancellation:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error'
    }), {
      headers: corsHeaders,
      status: 500
    });
  }
});
