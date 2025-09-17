/**
 * Notification Service
 * Handles sending notifications for various events in the app
 */

import { sendNotificationToUser, sendNotificationToUserByEmail } from './webview-integration';
import { supportsPushNotifications, getDeviceType } from './device-utils';

export interface NotificationData {
  title: string;
  body: string;
  data?: any;
}

export interface WelcomeNotificationData extends NotificationData {
  userName: string;
  userEmail: string;
}

export interface AppointmentNotificationData extends NotificationData {
  bookerName: string;
  bookerEmail: string;
  eventTypeName: string;
  appointmentDate: string;
  appointmentTime: string;
  pastorName: string;
  pastorEmail: string;
}

class NotificationService {
  /**
   * Send welcome notification to a new user
   */
  async sendWelcomeNotification(data: WelcomeNotificationData): Promise<void> {
    try {
      const notification = {
        title: `Welcome to Pastor Agenda, ${data.userName}!`,
        body: 'Thank you for joining us. You can now start managing your appointments and schedule.',
        data: {
          type: 'welcome',
          userId: data.userName,
          userEmail: data.userEmail,
          timestamp: new Date().toISOString()
        }
      };

      // Send to user by email
      await sendNotificationToUserByEmail(data.userEmail, notification.title, notification.body, notification.data);
      
      console.log('Welcome notification sent to:', data.userEmail);
    } catch (error) {
      console.error('Error sending welcome notification:', error);
    }
  }

  /**
   * Send appointment creation notification to pastor
   */
  async sendAppointmentCreatedNotification(data: AppointmentNotificationData): Promise<void> {
    try {
      const notification = {
        title: 'New Appointment Booked!',
        body: `${data.bookerName} has booked a ${data.eventTypeName} appointment for ${data.appointmentDate} at ${data.appointmentTime}`,
        data: {
          type: 'appointment_created',
          bookerName: data.bookerName,
          bookerEmail: data.bookerEmail,
          eventTypeName: data.eventTypeName,
          appointmentDate: data.appointmentDate,
          appointmentTime: data.appointmentTime,
          pastorEmail: data.pastorEmail,
          timestamp: new Date().toISOString()
        }
      };

      // Send to pastor by email
      await sendNotificationToUserByEmail(data.pastorEmail, notification.title, notification.body, notification.data);
      
      console.log('Appointment creation notification sent to pastor:', data.pastorEmail);
    } catch (error) {
      console.error('Error sending appointment creation notification:', error);
    }
  }

  /**
   * Send appointment confirmation notification to booker
   */
  async sendAppointmentConfirmationNotification(data: AppointmentNotificationData): Promise<void> {
    try {
      const notification = {
        title: 'Appointment Confirmed!',
        body: `Your ${data.eventTypeName} appointment with ${data.pastorName} is confirmed for ${data.appointmentDate} at ${data.appointmentTime}`,
        data: {
          type: 'appointment_confirmation',
          bookerName: data.bookerName,
          bookerEmail: data.bookerEmail,
          eventTypeName: data.eventTypeName,
          appointmentDate: data.appointmentDate,
          appointmentTime: data.appointmentTime,
          pastorName: data.pastorName,
          timestamp: new Date().toISOString()
        }
      };

      // Send to booker by email (only on mobile devices or when supported)
      if (supportsPushNotifications()) {
        try {
          await sendNotificationToUserByEmail(data.bookerEmail, notification.title, notification.body, notification.data);
          console.log('Appointment confirmation notification sent to booker:', data.bookerEmail);
        } catch (emailError) {
          console.log(`Email notification not available on ${getDeviceType()} device. Skipping email notification.`);
          // Don't throw error - email notifications are optional
        }
      } else {
        console.log(`Push notifications not supported on ${getDeviceType()} device. Skipping notification.`);
      }
    } catch (error) {
      console.error('Error sending appointment confirmation notification:', error);
    }
  }

  /**
   * Send appointment reminder notification
   */
  async sendAppointmentReminderNotification(data: AppointmentNotificationData): Promise<void> {
    try {
      const notification = {
        title: 'Appointment Reminder',
        body: `Don't forget! You have a ${data.eventTypeName} appointment with ${data.pastorName} tomorrow at ${data.appointmentTime}`,
        data: {
          type: 'appointment_reminder',
          bookerName: data.bookerName,
          bookerEmail: data.bookerEmail,
          eventTypeName: data.eventTypeName,
          appointmentDate: data.appointmentDate,
          appointmentTime: data.appointmentTime,
          pastorName: data.pastorName,
          timestamp: new Date().toISOString()
        }
      };

      // Send to booker by email (only on mobile devices or when supported)
      if (supportsPushNotifications()) {
        try {
          await sendNotificationToUserByEmail(data.bookerEmail, notification.title, notification.body, notification.data);
          console.log('Appointment reminder notification sent to booker:', data.bookerEmail);
        } catch (emailError) {
          console.log(`Email notification not available on ${getDeviceType()} device. Skipping email notification.`);
          // Don't throw error - email notifications are optional
        }
      } else {
        console.log(`Push notifications not supported on ${getDeviceType()} device. Skipping notification.`);
      }
    } catch (error) {
      console.error('Error sending appointment reminder notification:', error);
    }
  }

  /**
   * Send appointment cancellation notification
   */
  async sendAppointmentCancellationNotification(data: AppointmentNotificationData): Promise<void> {
    try {
      const notification = {
        title: 'Appointment Cancelled',
        body: `Your ${data.eventTypeName} appointment with ${data.pastorName} on ${data.appointmentDate} at ${data.appointmentTime} has been cancelled`,
        data: {
          type: 'appointment_cancellation',
          bookerName: data.bookerName,
          bookerEmail: data.bookerEmail,
          eventTypeName: data.eventTypeName,
          appointmentDate: data.appointmentDate,
          appointmentTime: data.appointmentTime,
          pastorName: data.pastorName,
          timestamp: new Date().toISOString()
        }
      };

      // Send to booker by email (only on mobile devices or when supported)
      if (supportsPushNotifications()) {
        try {
          await sendNotificationToUserByEmail(data.bookerEmail, notification.title, notification.body, notification.data);
          console.log('Appointment cancellation notification sent to booker:', data.bookerEmail);
        } catch (emailError) {
          console.log(`Email notification not available on ${getDeviceType()} device. Skipping email notification.`);
          // Don't throw error - email notifications are optional
        }
      } else {
        console.log(`Push notifications not supported on ${getDeviceType()} device. Skipping notification.`);
      }
    } catch (error) {
      console.error('Error sending appointment cancellation notification:', error);
    }
  }

  /**
   * Send appointment cancellation email to booker
   */
  async sendAppointmentCancelled(
    bookerEmail: string,
    bookerName: string,
    eventTypeName: string,
    appointmentDate: string,
    appointmentTime: string
  ): Promise<void> {
    try {
      const notification = {
        title: `❌ Appointment Cancelled - ${eventTypeName}`,
        body: `Your appointment for ${appointmentDate} at ${appointmentTime} has been cancelled.`,
        data: {
          type: 'appointment_cancelled',
          bookerName,
          bookerEmail,
          eventTypeName,
          appointmentDate,
          appointmentTime,
          timestamp: new Date().toISOString()
        }
      };

      // Send to booker by email (only on mobile devices or when supported)
      if (supportsPushNotifications()) {
        try {
          await sendNotificationToUserByEmail(bookerEmail, notification.title, notification.body, notification.data);
          console.log('Appointment cancellation email sent to:', bookerEmail);
        } catch (emailError) {
          console.log(`Email notification not available on ${getDeviceType()} device. Skipping email notification.`);
          // Don't throw error - email notifications are optional
        }
      } else {
        console.log(`Push notifications not supported on ${getDeviceType()} device. Skipping notification.`);
      }
    } catch (error) {
      console.error('Error sending appointment cancellation email:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
