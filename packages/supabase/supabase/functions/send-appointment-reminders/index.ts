// send-appointment-reminders Edge Function
// Sends appointment reminders (24h and 1h before appointments)
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
  console.log('Starting appointment reminder email send process with Brevo API...');
  const brevoApiKey = Deno.env.get("BREVO_API_KEY");
  if (!brevoApiKey) {
    console.error("BREVO_API_KEY environment variable is not set.");
    throw new Error("Email service is not configured.");
  }
  const subject = `Appointment Reminder: ${eventTitle} with ${pastorName}`;
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Appointment Reminder</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Appointment Reminder</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">
          Your appointment is coming up soon
        </p>
      </div>
      
      <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #1e293b; margin-top: 0;">Hello ${bookerName}!</h2>
        
        <p style="font-size: 16px; margin-bottom: 25px;">
          This is a friendly reminder about your upcoming appointment with <strong>${pastorName}</strong>.
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
          This is an automated reminder. Please do not reply to this email.
        </p>
      </div>
    </body>
    </html>
  `.trim();
  const emailPayload = {
    sender: {
      name: "PastorAgenda",
      email: "reminders@pastoragenda.com"
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
    console.log('Sending appointment reminder email via Brevo API to:', to);
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
    console.log('Appointment reminder email sent successfully via Brevo API:', data.messageId);
  } catch (apiError) {
    console.error('Error calling Brevo API for appointment reminder:', apiError);
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
    // Get current time and calculate reminder windows
    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now
    const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now
    console.log('Checking for appointments needing reminders...');
    console.log('Current time:', now.toISOString());
    console.log('1 hour window:', oneHourFromNow.toISOString());
    console.log('24 hour window:', twentyFourHoursFromNow.toISOString());
    // Find appointments that need 1-hour reminders
    const { data: oneHourAppointments, error: oneHourError } = await supabase.from('bookings').select(`
        id,
        start_time,
        booker_name,
        booker_email,
        description,
        event_types!inner(
          title,
          duration,
          user_id,
          profiles!inner(
            full_name,
            alias,
            email
          )
        )
      `).gte('start_time', now.toISOString()).lte('start_time', oneHourFromNow.toISOString()).eq('reminder_sent_1h', false);
    if (oneHourError) {
      console.error('Error fetching 1-hour reminder appointments:', oneHourError);
      return new Response(JSON.stringify({
        error: 'Failed to fetch 1-hour reminder appointments'
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 500
      });
    }
    // Find appointments that need 24-hour reminders
    const { data: twentyFourHourAppointments, error: twentyFourHourError } = await supabase.from('bookings').select(`
        id,
        start_time,
        booker_name,
        booker_email,
        description,
        event_types!inner(
          title,
          duration,
          user_id,
          profiles!inner(
            full_name,
            alias,
            email
          )
        )
      `).gte('start_time', oneHourFromNow.toISOString()).lte('start_time', twentyFourHoursFromNow.toISOString()).eq('reminder_sent_24h', false);
    if (twentyFourHourError) {
      console.error('Error fetching 24-hour reminder appointments:', twentyFourHourError);
      return new Response(JSON.stringify({
        error: 'Failed to fetch 24-hour reminder appointments'
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 500
      });
    }
    const allAppointments = [
      ...(oneHourAppointments || []).map((apt)=>({
          ...apt,
          reminderType: '1h'
        })),
      ...(twentyFourHourAppointments || []).map((apt)=>({
          ...apt,
          reminderType: '24h'
        }))
    ];
    console.log(`Found ${allAppointments.length} appointments needing reminders`);
    let remindersSent = 0;
    const errors = [];
    // Send reminders for each appointment
    for (const appointment of allAppointments){
      try {
        const appointmentDate = new Date(appointment.start_time);
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
        // Send reminder email to the booker
        await sendEventReminderEmail({
          to: appointment.booker_email,
          bookerName: appointment.booker_name,
          pastorName: appointment.event_types.profiles.full_name,
          eventTitle: appointment.event_types.title,
          date: formattedDate,
          time: formattedTime,
          duration: appointment.event_types.duration,
          pastorAlias: appointment.event_types.profiles.alias
        });
        // Mark reminder as sent
        const reminderField = appointment.reminderType === '1h' ? 'reminder_sent_1h' : 'reminder_sent_24h';
        const { error: updateError } = await supabase.from('bookings').update({
          [reminderField]: true
        }).eq('id', appointment.id);
        if (updateError) {
          console.error(`Error updating reminder status for appointment ${appointment.id}:`, updateError);
          errors.push(`Failed to update reminder status for appointment ${appointment.id}`);
        } else {
          remindersSent++;
          console.log(`Sent ${appointment.reminderType} reminder for appointment ${appointment.id}`);
        }
      } catch (error) {
        console.error(`Error sending reminder for appointment ${appointment.id}:`, error);
        errors.push(`Failed to send reminder for appointment ${appointment.id}: ${error.message}`);
      }
    }
    return new Response(JSON.stringify({
      message: `Reminder processing completed`,
      remindersSent,
      totalAppointments: allAppointments.length,
      errors: errors.length > 0 ? errors : undefined
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 200
    });
  } catch (error) {
    console.error('Error processing appointment reminders:', error);
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
