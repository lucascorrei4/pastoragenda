import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NotificationPreferences {
  appointment_booked: boolean;
  appointment_cancelled: boolean;
  appointment_reminders: boolean;
  daily_summary: boolean;
  weekly_summary: boolean;
  system_updates: boolean;
  urgent_bookings: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
  timezone: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client with service role key
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const now = new Date();
    const currentHour = now.getHours();
    const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.

    console.log(`Running scheduled notifications at ${now.toISOString()}, hour: ${currentHour}, day: ${currentDay}`);

    // Send daily summaries at 8 AM
    if (currentHour === 8) {
      await sendDailySummaries(supabase);
    }

    // Send weekly summaries on Monday at 9 AM
    if (currentDay === 1 && currentHour === 9) {
      await sendWeeklySummaries(supabase);
    }

    // Send appointment reminders every hour
    await sendAppointmentReminders(supabase);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Scheduled notifications processed successfully',
        timestamp: now.toISOString()
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in scheduled notifications:', error)
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

async function sendDailySummaries(supabase: any) {
  console.log('Sending daily summaries...');
  
  try {
    // Get all pastors who have daily summary enabled
    const { data: pastors, error: pastorsError } = await supabase
      .from('profiles')
      .select(`
        id,
        email,
        full_name,
        notification_preferences!inner(
          daily_summary,
          timezone
        )
      `)
      .eq('notification_preferences.daily_summary', true);

    if (pastorsError) {
      console.error('Error fetching pastors for daily summaries:', pastorsError);
      return;
    }

    for (const pastor of pastors || []) {
      try {
        // Get today's appointments for this pastor
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

        const { data: appointments, error: appointmentsError } = await supabase
          .from('bookings')
          .select(`
            id,
            booker_name,
            start_time,
            event_types!inner(
              title,
              duration,
              profiles!inner(
                id
              )
            )
          `)
          .eq('event_types.profiles.id', pastor.id)
          .eq('status', 'confirmed')
          .gte('start_time', startOfDay.toISOString())
          .lt('start_time', endOfDay.toISOString())
          .order('start_time');

        if (appointmentsError) {
          console.error(`Error fetching appointments for pastor ${pastor.id}:`, appointmentsError);
          continue;
        }

        if (!appointments || appointments.length === 0) {
          continue; // Skip if no appointments today
        }

        // Send daily summary notification
        await sendNotification(supabase, {
          userEmail: pastor.email,
          title: '📊 Today\'s Schedule',
          body: `You have ${appointments.length} appointment${appointments.length > 1 ? 's' : ''} today. First: ${appointments[0].event_types.title} at ${new Date(appointments[0].start_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`,
          data: {
            type: 'daily_summary',
            priority: 'low',
            appointmentCount: appointments.length,
            appointments: appointments.map(apt => ({
              id: apt.id,
              bookerName: apt.booker_name,
              eventType: apt.event_types.title,
              startTime: apt.start_time
            })),
            timestamp: new Date().toISOString()
          }
        });

        console.log(`Daily summary sent to pastor ${pastor.email}`);
      } catch (error) {
        console.error(`Error sending daily summary to pastor ${pastor.email}:`, error);
      }
    }
  } catch (error) {
    console.error('Error in sendDailySummaries:', error);
  }
}

async function sendWeeklySummaries(supabase: any) {
  console.log('Sending weekly summaries...');
  
  try {
    // Get all pastors who have weekly summary enabled
    const { data: pastors, error: pastorsError } = await supabase
      .from('profiles')
      .select(`
        id,
        email,
        full_name,
        notification_preferences!inner(
          weekly_summary,
          timezone
        )
      `)
      .eq('notification_preferences.weekly_summary', true);

    if (pastorsError) {
      console.error('Error fetching pastors for weekly summaries:', pastorsError);
      return;
    }

    for (const pastor of pastors || []) {
      try {
        // Get this week's statistics
        const now = new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay() + 1); // Monday
        startOfWeek.setHours(0, 0, 0, 0);
        
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 7);

        const { data: appointments, error: appointmentsError } = await supabase
          .from('bookings')
          .select(`
            id,
            status,
            created_at,
            event_types!inner(
              profiles!inner(
                id
              )
            )
          `)
          .eq('event_types.profiles.id', pastor.id)
          .gte('start_time', startOfWeek.toISOString())
          .lt('start_time', endOfWeek.toISOString());

        if (appointmentsError) {
          console.error(`Error fetching appointments for pastor ${pastor.id}:`, appointmentsError);
          continue;
        }

        const stats = {
          totalAppointments: appointments?.length || 0,
          newBookings: appointments?.filter(apt => apt.status === 'confirmed').length || 0,
          cancelledBookings: appointments?.filter(apt => apt.status === 'cancelled').length || 0,
          completedAppointments: 0, // Would need to track completion
          upcomingAppointments: appointments?.filter(apt => new Date(apt.start_time) > now).length || 0
        };

        // Send weekly summary notification
        await sendNotification(supabase, {
          userEmail: pastor.email,
          title: '📈 Weekly Overview',
          body: `This week: ${stats.totalAppointments} appointments, ${stats.newBookings} new bookings, ${stats.completedAppointments} completed`,
          data: {
            type: 'weekly_summary',
            priority: 'low',
            stats,
            timestamp: new Date().toISOString()
          }
        });

        console.log(`Weekly summary sent to pastor ${pastor.email}`);
      } catch (error) {
        console.error(`Error sending weekly summary to pastor ${pastor.email}:`, error);
      }
    }
  } catch (error) {
    console.error('Error in sendWeeklySummaries:', error);
  }
}

async function sendAppointmentReminders(supabase: any) {
  console.log('Sending appointment reminders...');
  
  try {
    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
    const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // Get appointments that need 24-hour reminders
    const { data: appointments24h, error: error24h } = await supabase
      .from('bookings')
      .select(`
        id,
        booker_name,
        start_time,
        reminder_sent_24h,
        event_types!inner(
          title,
          duration,
          profiles!inner(
            id,
            email,
            full_name,
            notification_preferences!inner(
              appointment_reminders,
              timezone
            )
          )
        )
      `)
      .eq('status', 'confirmed')
      .eq('reminder_sent_24h', false)
      .gte('start_time', twentyFourHoursFromNow.toISOString())
      .lt('start_time', new Date(twentyFourHoursFromNow.getTime() + 60 * 60 * 1000).toISOString())
      .eq('event_types.profiles.notification_preferences.appointment_reminders', true);

    if (error24h) {
      console.error('Error fetching 24h reminder appointments:', error24h);
    } else {
      for (const appointment of appointments24h || []) {
        try {
          await sendNotification(supabase, {
            userEmail: appointment.event_types.profiles.email,
            title: '⏰ Appointment Reminder',
            body: `You have a ${appointment.event_types.title} appointment with ${appointment.booker_name} tomorrow at ${new Date(appointment.start_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`,
            data: {
              type: 'appointment_reminder',
              priority: 'medium',
              reminderType: '24h',
              bookingId: appointment.id,
              bookerName: appointment.booker_name,
              eventTypeName: appointment.event_types.title,
              appointmentDate: new Date(appointment.start_time).toLocaleDateString('en-US'),
              appointmentTime: new Date(appointment.start_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
              timestamp: new Date().toISOString()
            }
          });

          // Mark reminder as sent
          await supabase
            .from('bookings')
            .update({ reminder_sent_24h: true })
            .eq('id', appointment.id);

          console.log(`24h reminder sent for appointment ${appointment.id}`);
        } catch (error) {
          console.error(`Error sending 24h reminder for appointment ${appointment.id}:`, error);
        }
      }
    }

    // Get appointments that need 1-hour reminders
    const { data: appointments1h, error: error1h } = await supabase
      .from('bookings')
      .select(`
        id,
        booker_name,
        start_time,
        reminder_sent_1h,
        event_types!inner(
          title,
          duration,
          profiles!inner(
            id,
            email,
            full_name,
            notification_preferences!inner(
              appointment_reminders,
              timezone
            )
          )
        )
      `)
      .eq('status', 'confirmed')
      .eq('reminder_sent_1h', false)
      .gte('start_time', oneHourFromNow.toISOString())
      .lt('start_time', new Date(oneHourFromNow.getTime() + 60 * 60 * 1000).toISOString())
      .eq('event_types.profiles.notification_preferences.appointment_reminders', true);

    if (error1h) {
      console.error('Error fetching 1h reminder appointments:', error1h);
    } else {
      for (const appointment of appointments1h || []) {
        try {
          await sendNotification(supabase, {
            userEmail: appointment.event_types.profiles.email,
            title: '🔔 Appointment Reminder',
            body: `You have a ${appointment.event_types.title} appointment with ${appointment.booker_name} in 1 hour at ${new Date(appointment.start_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`,
            data: {
              type: 'appointment_reminder',
              priority: 'high',
              reminderType: '1h',
              bookingId: appointment.id,
              bookerName: appointment.booker_name,
              eventTypeName: appointment.event_types.title,
              appointmentDate: new Date(appointment.start_time).toLocaleDateString('en-US'),
              appointmentTime: new Date(appointment.start_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
              timestamp: new Date().toISOString()
            }
          });

          // Mark reminder as sent
          await supabase
            .from('bookings')
            .update({ reminder_sent_1h: true })
            .eq('id', appointment.id);

          console.log(`1h reminder sent for appointment ${appointment.id}`);
        } catch (error) {
          console.error(`Error sending 1h reminder for appointment ${appointment.id}:`, error);
        }
      }
    }
  } catch (error) {
    console.error('Error in sendAppointmentReminders:', error);
  }
}

async function sendNotification(supabase: any, notification: {
  userEmail: string;
  title: string;
  body: string;
  data: any;
}) {
  try {
    // Send via the existing send-notification function
    const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-notification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`
      },
      body: JSON.stringify({
        userEmail: notification.userEmail,
        title: notification.title,
        body: notification.body,
        data: notification.data,
        priority: notification.data.priority || 'medium'
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to send notification: ${response.statusText}`);
    }

    // Log to notification history
    await supabase
      .from('notification_history')
      .insert({
        user_id: null, // We don't have user_id here, but we have email
        notification_type: notification.data.type,
        title: notification.title,
        body: notification.body,
        data: notification.data,
        priority: notification.data.priority || 'medium',
        status: 'sent'
      });

  } catch (error) {
    console.error('Error sending notification:', error);
    throw error;
  }
}
