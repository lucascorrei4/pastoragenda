// on-booking-created Edge Function
// Sends confirmation emails when a booking is created
import { createClient } from "npm:@supabase/supabase-js@2.39.3";
// CORS headers for all responses
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json"
};
// Email service function using the Brevo (Sendinblue) REST API
async function sendEventReminderEmail({ to, bookerName, pastorName, eventTitle, date, time, duration, pastorAlias }) {
  console.log('Starting appointment confirmation email send process with Brevo API...');
  const brevoApiKey = Deno.env.get("BREVO_API_KEY");
  if (!brevoApiKey) {
    console.error("BREVO_API_KEY environment variable is not set.");
    throw new Error("Email service is not configured.");
  }
  const subject = `Appointment Confirmation: ${eventTitle} with ${pastorName}`;
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Appointment Confirmation</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Appointment Confirmed</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">
          Your appointment has been successfully booked
        </p>
      </div>
      
      <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #1e293b; margin-top: 0;">Hello ${bookerName}!</h2>
        
        <p style="font-size: 16px; margin-bottom: 25px;">
          Your appointment with <strong>${pastorName}</strong> has been confirmed. Here are the details:
        </p>
        
        <div style="background: white; border: 2px solid #e2e8f0; border-radius: 8px; padding: 25px; margin: 25px 0;">
          <h3 style="color: #0ea5e9; margin-top: 0;">Appointment Details</h3>
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
        
        <div style="background: #ecfdf5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <h3 style="color: #065f46; margin: 0 0 10px 0; font-size: 16px;">📅 Important Reminders:</h3>
          <ul style="color: #047857; margin: 0; padding-left: 20px;">
            <li>Please arrive on time for your appointment</li>
            <li>Bring any necessary documents or materials</li>
            <li>Contact ${pastorName} if you need to reschedule</li>
          </ul>
        </div>
        
        <p style="font-size: 14px; color: #64748b; margin-top: 30px;">
          You can view ${pastorName}'s profile at: 
          <a href="https://pastoragenda.com/${pastorAlias}" style="color: #0ea5e9;">pastoragenda.com/${pastorAlias}</a>
        </p>
      </div>
      
      <div style="text-align: center; margin-top: 20px; padding: 20px; border-top: 1px solid #e2e8f0;">
        <p style="color: #94a3b8; font-size: 12px; margin: 0;">
          © 2025 PastorAgenda. All rights reserved.<br>
          This is an automated confirmation. Please do not reply to this email.
        </p>
      </div>
    </body>
    </html>
  `.trim();
  const emailPayload = {
    sender: {
      name: "PastorAgenda",
      email: "confirmations@pastoragenda.com"
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
    console.log('Sending appointment confirmation email via Brevo API to:', to);
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
    console.log('Appointment confirmation email sent successfully via Brevo API:', data.messageId);
  } catch (apiError) {
    console.error('Error calling Brevo API for appointment confirmation:', apiError);
    throw apiError;
  }
}
// Pastor notification email function
async function sendPastorNotificationEmail({ to, pastorName, bookerName, bookerEmail, eventTitle, date, time, duration, description }) {
  console.log('Starting pastor notification email send process with Brevo API...');
  const brevoApiKey = Deno.env.get("BREVO_API_KEY");
  if (!brevoApiKey) {
    console.error("BREVO_API_KEY environment variable is not set.");
    throw new Error("Email service is not configured.");
  }
  const subject = `New Appointment: ${eventTitle} with ${bookerName}`;
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Appointment Booking</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px;">New Appointment Booking</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">
          Someone has booked an appointment with you
        </p>
      </div>
      
      <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #1e293b; margin-top: 0;">Hello ${pastorName}!</h2>
        
        <p style="font-size: 16px; margin-bottom: 25px;">
          <strong>${bookerName}</strong> has booked an appointment with you. Here are the details:
        </p>
        
        <div style="background: white; border: 2px solid #e2e8f0; border-radius: 8px; padding: 25px; margin: 25px 0;">
          <h3 style="color: #0ea5e9; margin-top: 0;">Appointment Details</h3>
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
        
        <div style="background: #ecfdf5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <h3 style="color: #065f46; margin: 0 0 10px 0; font-size: 16px;">📅 Next Steps:</h3>
          <ul style="color: #047857; margin: 0; padding-left: 20px;">
            <li>Prepare for your appointment with ${bookerName}</li>
            <li>Review any special requests or information provided</li>
            <li>Contact ${bookerName} if you need to reschedule</li>
          </ul>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://pastoragenda.com/dashboard" 
             style="background: #0ea5e9; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
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
      email: "notifications@pastoragenda.com"
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
    console.log('Sending pastor notification email via Brevo API to:', to);
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
      console.error("Brevo API error response for pastor notification:", errorBody);
      throw new Error(`Failed to send email. Status: ${response.status}, Response: ${errorBody}`);
    }
    const data = await response.json();
    console.log('Pastor notification email sent successfully via Brevo API:', data.messageId);
  } catch (apiError) {
    console.error('Error calling Brevo API for pastor notification:', apiError);
    throw apiError;
  }
}
Deno.serve(async (req)=>{
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
    const { record, old_record } = await req.json();
    // Only process new bookings
    if (!record || old_record) {
      return new Response(JSON.stringify({
        message: 'Only new bookings are processed'
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 200
      });
    }
    console.log('Processing new booking:', record.id);
    // Fetch additional data needed for the email
    const { data: eventType, error: eventTypeError } = await supabase.from('event_types').select('title, duration, description').eq('id', record.event_type_id).single();
    if (eventTypeError) {
      console.error('Error fetching event type:', eventTypeError);
      return new Response(JSON.stringify({
        error: 'Failed to fetch event type'
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 500
      });
    }
    const { data: profile, error: profileError } = await supabase.from('profiles').select('full_name, alias, email').eq('id', record.user_id).single();
    if (profileError) {
      console.error('Error fetching profile:', profileError);
      return new Response(JSON.stringify({
        error: 'Failed to fetch profile'
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 500
      });
    }
    // Format the appointment details
    const appointmentDate = new Date(record.start_time);
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
    // Send confirmation email to the booker
    try {
      await sendEventReminderEmail({
        to: record.booker_email,
        bookerName: record.booker_name,
        pastorName: profile.full_name,
        eventTitle: eventType.title,
        date: formattedDate,
        time: formattedTime,
        duration: eventType.duration,
        pastorAlias: profile.alias
      });
      console.log('Confirmation email sent to booker:', record.booker_email);
    } catch (emailError) {
      console.error('Error sending confirmation email to booker:', emailError);
    }
    // Send notification email to the pastor
    try {
      await sendPastorNotificationEmail({
        to: profile.email,
        pastorName: profile.full_name,
        bookerName: record.booker_name,
        bookerEmail: record.booker_email,
        eventTitle: eventType.title,
        date: formattedDate,
        time: formattedTime,
        duration: eventType.duration,
        description: record.description
      });
      console.log('Notification email sent to pastor:', profile.email);
    } catch (emailError) {
      console.error('Error sending notification email to pastor:', emailError);
    }
    return new Response(JSON.stringify({
      message: 'Booking confirmation emails sent successfully to both booker and pastor',
      bookingId: record.id
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 200
    });
  } catch (error) {
    console.error('Error processing booking:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error'
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 500
    });
  }
});
