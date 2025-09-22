/**
 * WebView Integration for React Native
 * Handles the communication between web app and React Native container
 */

import { webViewBridge } from './webview-bridge';

// Initialize WebView integration when the app loads
export function initializeWebViewIntegration() {
  // Check if we're running in a React Native WebView
  if (webViewBridge.isRunningInReactNative()) {
    // Set up notification handling
    setupWebNotificationHandling();
  }
}


/**
 * Set up web notification handling
 */
function setupWebNotificationHandling() {
  // Request notification permission
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission().then(permission => {
      console.log('Notification permission:', permission);
    });
  }
  
  // Set up service worker for push notifications (if available)
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('Service Worker registered:', registration);
      })
      .catch(error => {
        console.log('Service Worker registration failed:', error);
      });
  }
}

/**
 * Send notification to specific user
 */
export async function sendNotificationToUser(
  userId: string,
  title: string,
  body: string,
  data?: any
) {
  try {
    const response = await fetch('/api/send-notification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        title,
        body,
        data,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to send notification');
    }

    const result = await response.json();
    console.log('Notification sent:', result);
    return result;
  } catch (error) {
    console.error('Error sending notification:', error);
    throw error;
  }
}

/**
 * Send notification to user by email
 */
export async function sendNotificationToUserByEmail(
  userEmail: string,
  title: string,
  body: string,
  data?: any
) {
  try {
    // Check if we're in a mobile environment or PWA
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isPWA = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
    
    if (!isMobile && !isPWA) {
      console.log('Email notifications only supported on mobile devices or PWA. Skipping notification.');
      return { success: false, reason: 'Not supported on desktop' };
    }

    const response = await fetch('/api/send-notification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userEmail,
        title,
        body,
        data,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to send notification');
    }

    const result = await response.json();
    console.log('Notification sent:', result);
    return result;
  } catch (error) {
    console.error('Error sending notification:', error);
    // Don't throw error - notifications are optional
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Send notification to all users
 */
export async function sendNotificationToAllUsers(
  title: string,
  body: string,
  data?: any
) {
  try {
    const response = await fetch('/api/send-notification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title,
        body,
        data,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to send notification');
    }

    const result = await response.json();
    console.log('Notification sent to all users:', result);
    return result;
  } catch (error) {
    console.error('Error sending notification:', error);
    throw error;
  }
}

// Initialize when module is loaded
initializeWebViewIntegration();
