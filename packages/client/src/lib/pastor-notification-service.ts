/**
 * Enhanced Pastor Notification Service
 * Handles all push notifications for pastors in the PastorAgenda system
 */

import { sendNotificationToUserByEmail } from './webview-integration';
import { supportsPushNotifications, getDeviceType } from './device-utils';

export interface NotificationPreferences {
  appointmentBooked: boolean;
  appointmentCancelled: boolean;
  appointmentReminders: boolean;
  dailySummary: boolean;
  weeklySummary: boolean;
  systemUpdates: boolean;
  urgentBookings: boolean;
  quietHoursStart?: string; // "22:00"
  quietHoursEnd?: string;   // "08:00"
  timezone?: string;
}

export interface WeeklyStats {
  totalAppointments: number;
  newBookings: number;
  cancelledBookings: number;
  completedAppointments: number;
  upcomingAppointments: number;
}

export interface SystemUpdate {
  version: string;
  features: string[];
  description: string;
  actionUrl?: string;
}

export interface Booking {
  id: string;
  bookerName: string;
  bookerEmail: string;
  eventTypeName: string;
  appointmentDate: string;
  appointmentTime: string;
  duration: number;
  description?: string;
  status: 'confirmed' | 'cancelled';
  isUrgent?: boolean;
}

class PastorNotificationService {
  private readonly API_BASE_URL = import.meta.env.VITE_SUPABASE_URL?.replace('/rest/v1', '') || '';

  /**
   * Send notification when a new appointment is booked
   */
  async sendAppointmentBooked(booking: Booking, pastorEmail: string, _pastorName: string): Promise<void> {
    try {
      const isUrgent = this.checkUrgentBooking(booking);
      const priority = isUrgent ? 'urgent' : 'high';
      
      const notification = {
        title: isUrgent ? '🚨 Urgent: Same-Day Booking!' : '📅 New Appointment Booked!',
        body: `${booking.bookerName} has booked a ${booking.eventTypeName} appointment for ${booking.appointmentDate} at ${booking.appointmentTime}`,
        data: {
          type: 'appointment_booked',
          priority,
          bookingId: booking.id,
          bookerName: booking.bookerName,
          bookerEmail: booking.bookerEmail,
          eventTypeName: booking.eventTypeName,
          appointmentDate: booking.appointmentDate,
          appointmentTime: booking.appointmentTime,
          duration: booking.duration,
          isUrgent,
          timestamp: new Date().toISOString()
        }
      };

      // Send push notification
      await this.sendPushNotification(pastorEmail, notification, priority);
      
      // Send email notification as backup
      await sendNotificationToUserByEmail(
        pastorEmail,
        notification.title,
        notification.body,
        notification.data
      );

      console.log(`Appointment booking notification sent to pastor: ${pastorEmail}`);
    } catch (error) {
      console.error('Error sending appointment booking notification:', error);
    }
  }

  /**
   * Send notification when an appointment is cancelled
   */
  async sendAppointmentCancelled(booking: Booking, pastorEmail: string, _pastorName: string): Promise<void> {
    try {
      const notification = {
        title: '❌ Appointment Cancelled',
        body: `${booking.bookerName} cancelled their ${booking.eventTypeName} appointment for ${booking.appointmentDate} at ${booking.appointmentTime}`,
        data: {
          type: 'appointment_cancelled',
          priority: 'high',
          bookingId: booking.id,
          bookerName: booking.bookerName,
          bookerEmail: booking.bookerEmail,
          eventTypeName: booking.eventTypeName,
          appointmentDate: booking.appointmentDate,
          appointmentTime: booking.appointmentTime,
          timestamp: new Date().toISOString()
        }
      };

      await this.sendPushNotification(pastorEmail, notification, 'high');
      
      console.log(`Appointment cancellation notification sent to pastor: ${pastorEmail}`);
    } catch (error) {
      console.error('Error sending appointment cancellation notification:', error);
    }
  }

  /**
   * Send appointment reminder notification
   */
  async sendAppointmentReminder(
    booking: Booking, 
    pastorEmail: string, 
    _pastorName: string, 
    reminderType: '24h' | '1h'
  ): Promise<void> {
    try {
      const timeText = reminderType === '24h' ? 'tomorrow' : 'in 1 hour';
      const emoji = reminderType === '24h' ? '⏰' : '🔔';
      
      const notification = {
        title: `${emoji} Appointment Reminder`,
        body: `You have a ${booking.eventTypeName} appointment with ${booking.bookerName} ${timeText} at ${booking.appointmentTime}`,
        data: {
          type: 'appointment_reminder',
          priority: 'medium',
          reminderType,
          bookingId: booking.id,
          bookerName: booking.bookerName,
          eventTypeName: booking.eventTypeName,
          appointmentDate: booking.appointmentDate,
          appointmentTime: booking.appointmentTime,
          timestamp: new Date().toISOString()
        }
      };

      await this.sendPushNotification(pastorEmail, notification, 'medium');
      
      console.log(`${reminderType} reminder sent to pastor: ${pastorEmail}`);
    } catch (error) {
      console.error(`Error sending ${reminderType} reminder:`, error);
    }
  }

  /**
   * Send daily summary notification
   */
  async sendDailySummary(pastorEmail: string, _pastorName: string, appointments: Booking[]): Promise<void> {
    try {
      const todayAppointments = appointments.filter(apt => 
        new Date(apt.appointmentDate).toDateString() === new Date().toDateString()
      );

      if (todayAppointments.length === 0) {
        return; // Don't send summary if no appointments
      }

      const firstAppointment = todayAppointments[0];
      const count = todayAppointments.length;
      
      const notification = {
        title: '📊 Today\'s Schedule',
        body: `You have ${count} appointment${count > 1 ? 's' : ''} today. First: ${firstAppointment.eventTypeName} at ${firstAppointment.appointmentTime}`,
        data: {
          type: 'daily_summary',
          priority: 'low',
          appointmentCount: count,
          appointments: todayAppointments,
          timestamp: new Date().toISOString()
        }
      };

      await this.sendPushNotification(pastorEmail, notification, 'low');
      
      console.log(`Daily summary sent to pastor: ${pastorEmail}`);
    } catch (error) {
      console.error('Error sending daily summary:', error);
    }
  }

  /**
   * Send weekly summary notification
   */
  async sendWeeklySummary(pastorEmail: string, _pastorName: string, stats: WeeklyStats): Promise<void> {
    try {
      const notification = {
        title: '📈 Weekly Overview',
        body: `This week: ${stats.totalAppointments} appointments, ${stats.newBookings} new bookings, ${stats.completedAppointments} completed`,
        data: {
          type: 'weekly_summary',
          priority: 'low',
          stats,
          timestamp: new Date().toISOString()
        }
      };

      await this.sendPushNotification(pastorEmail, notification, 'low');
      
      console.log(`Weekly summary sent to pastor: ${pastorEmail}`);
    } catch (error) {
      console.error('Error sending weekly summary:', error);
    }
  }

  /**
   * Send profile update notification
   */
  async sendProfileUpdated(pastorEmail: string, _pastorName: string): Promise<void> {
    try {
      const notification = {
        title: '✅ Profile Updated',
        body: 'Your profile has been successfully updated',
        data: {
          type: 'profile_updated',
          priority: 'low',
          timestamp: new Date().toISOString()
        }
      };

      await this.sendPushNotification(pastorEmail, notification, 'low');
      
      console.log(`Profile update notification sent to pastor: ${pastorEmail}`);
    } catch (error) {
      console.error('Error sending profile update notification:', error);
    }
  }

  /**
   * Send system update notification
   */
  async sendSystemUpdate(pastorEmail: string, _pastorName: string, update: SystemUpdate): Promise<void> {
    try {
      const notification = {
        title: '🎉 New Features Available!',
        body: `Check out the latest improvements to PastorAgenda: ${update.description}`,
        data: {
          type: 'system_update',
          priority: 'low',
          version: update.version,
          features: update.features,
          actionUrl: update.actionUrl,
          timestamp: new Date().toISOString()
        }
      };

      await this.sendPushNotification(pastorEmail, notification, 'low');
      
      console.log(`System update notification sent to pastor: ${pastorEmail}`);
    } catch (error) {
      console.error('Error sending system update notification:', error);
    }
  }

  /**
   * Check if a booking is urgent (same day or next day)
   */
  private checkUrgentBooking(booking: Booking): boolean {
    const appointmentDate = new Date(booking.appointmentDate);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const isToday = appointmentDate.toDateString() === today.toDateString();
    const isTomorrow = appointmentDate.toDateString() === tomorrow.toDateString();

    return isToday || isTomorrow;
  }

  /**
   * Send push notification via Supabase Edge Function (mobile devices only)
   */
  private async sendPushNotification(
    pastorEmail: string, 
    notification: any, 
    priority: 'low' | 'medium' | 'high' | 'urgent'
  ): Promise<void> {
    // Only send push notifications on mobile devices
    if (!supportsPushNotifications()) {
      console.log(`Push notifications not supported on ${getDeviceType()} device. Skipping push notification.`);
      return;
    }

    try {
      // Note: The send-notification edge function doesn't exist yet
      // For now, we'll just log that we would send a push notification
      console.log('Would send push notification:', {
        userEmail: pastorEmail,
        title: notification.title,
        body: notification.body,
        data: notification.data,
        priority,
        deviceType: getDeviceType()
      });

      // TODO: Implement actual push notification when edge function is created
      // const response = await fetch(`${this.API_BASE_URL}/functions/v1/send-notification`, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
      //   },
      //   body: JSON.stringify({
      //     userEmail: pastorEmail,
      //     title: notification.title,
      //     body: notification.body,
      //     data: notification.data,
      //     priority,
      //     sound: priority === 'urgent' ? 'urgent' : 'default',
      //     badge: 1
      //   })
      // });

      // if (!response.ok) {
      //   throw new Error(`Failed to send push notification: ${response.statusText}`);
      // }

      // const result = await response.json();
      // console.log('Push notification sent successfully:', result);
    } catch (error) {
      console.error('Error sending push notification:', error);
      // Don't throw error - push notifications are optional
    }
  }

  /**
   * Get notification preferences for a pastor
   */
  async getNotificationPreferences(pastorId: string): Promise<NotificationPreferences> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/functions/v1/get-notification-preferences`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({ pastorId })
      });

      if (!response.ok) {
        // Return default preferences if not found
        return this.getDefaultPreferences();
      }

      const result = await response.json();
      return result.preferences || this.getDefaultPreferences();
    } catch (error) {
      console.error('Error getting notification preferences:', error);
      return this.getDefaultPreferences();
    }
  }

  /**
   * Update notification preferences for a pastor
   */
  async updateNotificationPreferences(
    pastorId: string, 
    preferences: Partial<NotificationPreferences>
  ): Promise<void> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/functions/v1/update-notification-preferences`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({ pastorId, preferences })
      });

      if (!response.ok) {
        throw new Error(`Failed to update notification preferences: ${response.statusText}`);
      }

      console.log('Notification preferences updated successfully');
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      throw error;
    }
  }

  /**
   * Get default notification preferences
   */
  private getDefaultPreferences(): NotificationPreferences {
    return {
      appointmentBooked: true,
      appointmentCancelled: true,
      appointmentReminders: true,
      dailySummary: true,
      weeklySummary: false,
      systemUpdates: true,
      urgentBookings: true,
      quietHoursStart: '22:00',
      quietHoursEnd: '08:00',
      timezone: 'UTC'
    };
  }

  /**
   * Check if it's within quiet hours for a pastor
   */
  private isWithinQuietHours(preferences: NotificationPreferences): boolean {
    if (!preferences.quietHoursStart || !preferences.quietHoursEnd) {
      return false;
    }

    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
    
    const start = preferences.quietHoursStart;
    const end = preferences.quietHoursEnd;

    // Handle quiet hours that span midnight (e.g., 22:00 to 08:00)
    if (start > end) {
      return currentTime >= start || currentTime <= end;
    } else {
      return currentTime >= start && currentTime <= end;
    }
  }
}

// Export singleton instance
export const pastorNotificationService = new PastorNotificationService();
