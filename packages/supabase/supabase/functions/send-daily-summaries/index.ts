// send-daily-summaries Edge Function
// Sends daily appointment summaries to pastors
import { createClient } from "npm:@supabase/supabase-js@2.39.3";
// CORS headers for all responses
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json"
};
// Email service function using the Brevo (Sendinblue) REST API
async function sendDailySummaryEmail({ to, pastorName, appointments, date }) {
  console.log('Starting daily summary email send process with Brevo API...');
  const brevoApiKey = Deno.env.get("BREVO_API_KEY");
  if (!brevoApiKey) {
    console.error("BREVO_API_KEY environment variable is not set.");
    throw new Error("Email service is not configured.");
  }
  const appointmentsList = appointments.map((appointment)=>`
    <div style="background: white; border: 1px solid #e2e8f0; border-radius: 6px; padding: 15px; margin: 10px 0;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
        <h4 style="color: #0ea5e9; margin: 0; font-size: 16px;">${appointment.eventTitle}</h4>
        <span style="color: #64748b; font-size: 14px;">${appointment.time}</span>
      </div>
      <div style="color: #374151; font-size: 14px;">
        <p style="margin: 4px 0;"><strong>With:</strong> ${appointment.bookerName}</p>
        <p style="margin: 4px 0;"><strong>Duration:</strong> ${appointment.duration} minutes</p>
        ${appointment.description ? `<p style="margin: 4px 0;"><strong>Notes:</strong> ${appointment.description}</p>` : ''}
      </div>
    </div>
  `).join('');
  const subject = `Daily Summary - ${appointments.length} appointment${appointments.length !== 1 ? 's' : ''} for ${date}`;
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Daily Appointment Summary</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Daily Summary</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">
          Your appointments for ${date}
        </p>
      </div>
      
      <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #1e293b; margin-top: 0;">Hello ${pastorName}!</h2>
        
        <p style="font-size: 16px; margin-bottom: 25px;">
          Here's your schedule for today. You have <strong>${appointments.length} appointment${appointments.length !== 1 ? 's' : ''}</strong> scheduled.
        </p>
        
        <div style="background: white; border: 2px solid #e2e8f0; border-radius: 8px; padding: 25px; margin: 25px 0;">
          <h3 style="color: #0ea5e9; margin-top: 0;">Today's Appointments</h3>
          ${appointments.length > 0 ? appointmentsList : `
            <div style="text-align: center; padding: 20px; color: #64748b;">
              <p style="margin: 0;">No appointments scheduled for today.</p>
            </div>
          `}
        </div>
        
        ${appointments.length > 0 ? `
        <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <h3 style="color: #92400e; margin: 0 0 10px 0; font-size: 16px;">💡 Today's Tips:</h3>
          <ul style="color: #b45309; margin: 0; padding-left: 20px;">
            <li>Review your appointments and prepare accordingly</li>
            <li>Check for any special requests or notes from your congregation</li>
            <li>Take breaks between appointments to stay refreshed</li>
          </ul>
        </div>
        ` : ''}
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://pastoragenda.com/dashboard" 
             style="background: #0ea5e9; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            View Full Schedule
          </a>
        </div>
      </div>
      
      <div style="text-align: center; margin-top: 20px; padding: 20px; border-top: 1px solid #e2e8f0;">
        <p style="color: #94a3b8; font-size: 12px; margin: 0;">
          © 2025 PastorAgenda. All rights reserved.<br>
          This is an automated daily summary. Please do not reply to this email.
        </p>
      </div>
    </body>
    </html>
  `.trim();
  const emailPayload = {
    sender: {
      name: "PastorAgenda",
      email: "daily@pastoragenda.com"
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
    console.log('Sending daily summary email via Brevo API to:', to);
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
    console.log('Daily summary email sent successfully via Brevo API:', data.messageId);
  } catch (apiError) {
    console.error('Error calling Brevo API for daily summary:', apiError);
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
    // Get today's date range
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    console.log('Sending daily summaries for:', startOfDay.toISOString());
    console.log('Date range:', startOfDay.toISOString(), 'to', endOfDay.toISOString());
    // Get all pastors who have appointments today
    const { data: pastorsWithAppointments, error: pastorsError } = await supabase.from('profiles').select(`
        id,
        full_name,
        email,
        bookings!inner(
          id,
          start_time,
          booker_name,
          booker_email,
          description,
          event_types!inner(
            title,
            duration
          )
        )
      `).gte('bookings.start_time', startOfDay.toISOString()).lt('bookings.start_time', endOfDay.toISOString());
    if (pastorsError) {
      console.error('Error fetching pastors with appointments:', pastorsError);
      return new Response(JSON.stringify({
        error: 'Failed to fetch pastors with appointments'
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 500
      });
    }
    console.log(`Found ${pastorsWithAppointments?.length || 0} pastors with appointments today`);
    let summariesSent = 0;
    const errors = [];
    // Send daily summary to each pastor
    for (const pastor of pastorsWithAppointments || []){
      try {
        // Format appointments for the email
        const appointments = pastor.bookings.map((booking)=>{
          const appointmentTime = new Date(booking.start_time);
          return {
            bookerName: booking.booker_name,
            bookerEmail: booking.booker_email,
            eventTitle: booking.event_types.title,
            time: appointmentTime.toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true
            }),
            duration: booking.event_types.duration,
            description: booking.description
          };
        });
        // Sort appointments by time
        appointments.sort((a, b)=>{
          const timeA = new Date(`2000-01-01 ${a.time}`);
          const timeB = new Date(`2000-01-01 ${b.time}`);
          return timeA.getTime() - timeB.getTime();
        });
        const formattedDate = today.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
        // Send daily summary email
        await sendDailySummaryEmail({
          to: pastor.email,
          pastorName: pastor.full_name,
          appointments,
          date: formattedDate
        });
        summariesSent++;
        console.log(`Sent daily summary to ${pastor.full_name} (${appointments.length} appointments)`);
      } catch (error) {
        console.error(`Error sending daily summary to ${pastor.full_name}:`, error);
        errors.push(`Failed to send daily summary to ${pastor.full_name}: ${error.message}`);
      }
    }
    return new Response(JSON.stringify({
      message: `Daily summary processing completed`,
      summariesSent,
      totalPastors: pastorsWithAppointments?.length || 0,
      errors: errors.length > 0 ? errors : undefined
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 200
    });
  } catch (error) {
    console.error('Error processing daily summaries:', error);
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
