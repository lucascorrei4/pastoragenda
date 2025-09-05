/**
 * WebView Bridge for React Native Communication
 * Handles communication between the web app and React Native container
 */

export interface UserAuthData {
  userId: string | null;
  userEmail: string | null;
  userToken: string | null;
}

export interface DeviceRegistrationData {
  token: string;
  deviceId: string;
  platform: 'ios' | 'android' | 'web';
  appVersion?: string;
  deviceModel?: string;
  osVersion?: string;
}

// Global interface for React Native bridge
declare global {
  interface Window {
    ReactNativeBridge?: {
      updateUserAuth: (userId: string | null, userEmail: string | null, userToken: string | null) => void;
      registerDevice: (data: DeviceRegistrationData) => Promise<void>;
      onNotificationReceived: (callback: (notification: any) => void) => void;
    };
  }
}

class WebViewBridge {
  private isReactNative: boolean = false;
  private deviceRegistered: boolean = false;

  constructor() {
    this.detectReactNative();
    this.setupMessageListener();
  }

  /**
   * Detect if running inside React Native WebView
   */
  private detectReactNative(): void {
    // Check for React Native WebView environment
    this.isReactNative = !!(window.ReactNativeBridge || 
      (window as any).webkit?.messageHandlers?.ReactNativeBridge ||
      (window as any).ReactNativeWebView);
  }

  /**
   * Setup message listener for React Native communication
   */
  private setupMessageListener(): void {
    if (!this.isReactNative) return;

    // Listen for messages from React Native
    window.addEventListener('message', (event) => {
      try {
        const data = JSON.parse(event.data);
        this.handleReactNativeMessage(data);
      } catch (error) {
        console.log('Non-JSON message from React Native:', event.data);
      }
    });

    // Listen for React Native WebView specific events
    document.addEventListener('message', (event: any) => {
      try {
        const data = JSON.parse(event.data);
        this.handleReactNativeMessage(data);
      } catch (error) {
        console.log('Non-JSON message from React Native:', event.data);
      }
    });
  }

  /**
   * Handle messages from React Native
   */
  private handleReactNativeMessage(data: any): void {
    console.log('Received message from React Native:', data);
    
    switch (data.type) {
      case 'DEVICE_REGISTERED':
        this.deviceRegistered = true;
        console.log('Device registration confirmed');
        break;
      case 'NOTIFICATION_RECEIVED':
        this.handleNotificationReceived(data.notification);
        break;
      case 'DEVICE_INFO':
        // Handle device info from React Native
        this.handleDeviceInfo(data.deviceInfo);
        break;
      case 'USER_INFO_UPDATE':
        // Handle user info update from React Native
        this.handleUserInfoUpdate(data.userInfo);
        break;
      default:
        console.log('Unknown message type:', data.type);
    }
  }

  /**
   * Handle device info from React Native
   */
  private async handleDeviceInfo(deviceInfo: any): Promise<void> {
    console.log('Received device info from React Native:', deviceInfo);
    
    // Register the device with the backend using the exact format from your PushNotificationService
    await this.registerDeviceWithBackend({
      token: deviceInfo.token || deviceInfo.pushToken || 'web-push-token',
      deviceId: deviceInfo.deviceId || `rn_${Date.now()}`,
      platform: deviceInfo.platform || 'web',
      appVersion: deviceInfo.appVersion || '1.0.0',
      deviceModel: deviceInfo.deviceModel || 'Unknown',
      osVersion: deviceInfo.osVersion || 'Unknown'
    });
  }

  /**
   * Handle user info update from React Native
   */
  private async handleUserInfoUpdate(userInfo: any): Promise<void> {
    console.log('Received user info update from React Native:', userInfo);
    
    // Update the device with user information
    if (userInfo.userId || userInfo.userEmail) {
      await this.updateDeviceUserInfo(userInfo);
    }
  }

  /**
   * Update device with user information
   */
  private async updateDeviceUserInfo(userInfo: any): Promise<void> {
    try {
      const API_BASE_URL = import.meta.env.VITE_SUPABASE_URL?.replace('/rest/v1', '') || '';
      const userToken = localStorage.getItem('auth_token');
      
      const response = await fetch(`${API_BASE_URL}/functions/v1/register-device`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken || import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          userId: userInfo.userId,
          userEmail: userInfo.userEmail,
          // Include device info if available
          deviceId: userInfo.deviceId,
          platform: userInfo.platform || 'web'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to update device user info:', errorData);
        return;
      }

      const result = await response.json();
      console.log('Device user info updated successfully:', result);
    } catch (error) {
      console.error('Error updating device user info:', error);
    }
  }

  /**
   * Handle notification received from React Native
   */
  private handleNotificationReceived(notification: any): void {
    console.log('Notification received:', notification);
    
    // You can add custom notification handling here
    // For example, show a toast, update UI, etc.
    if (notification.title && notification.body) {
      // Example: Show browser notification if permission granted
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.body,
          icon: '/favicon.ico'
        });
      }
    }
  }

  /**
   * Send user authentication data to React Native
   */
  public updateUserAuth(userId: string | null, userEmail: string | null, userToken: string | null): void {
    if (!this.isReactNative) {
      return;
    }

    const authData: UserAuthData = { userId, userEmail, userToken };
    
    console.log('Sending user auth data to React Native:', authData);

    // Send via React Native bridge
    if (window.ReactNativeBridge?.updateUserAuth) {
      window.ReactNativeBridge.updateUserAuth(userId, userEmail, userToken);
    } else {
      // Fallback: Send via postMessage
      this.sendMessageToReactNative({
        type: 'USER_AUTH_UPDATE',
        data: authData
      });
    }
  }

  /**
   * Register device with React Native
   */
  public async registerDevice(data: DeviceRegistrationData): Promise<void> {
    if (!this.isReactNative) {
      console.log('Not running in React Native, skipping device registration');
      return;
    }

    console.log('Registering device with React Native:', data);

    // Send via React Native bridge
    if (window.ReactNativeBridge?.registerDevice) {
      await window.ReactNativeBridge.registerDevice(data);
    } else {
      // Fallback: Send via postMessage
      this.sendMessageToReactNative({
        type: 'DEVICE_REGISTRATION',
        data
      });
    }

    // Also register with Supabase backend for push notifications
    await this.registerDeviceWithBackend(data);
  }

  /**
   * Register device with Supabase backend
   */
  private async registerDeviceWithBackend(data: DeviceRegistrationData): Promise<void> {
    try {
      const API_BASE_URL = import.meta.env.VITE_SUPABASE_URL?.replace('/rest/v1', '') || '';
      
      // Get the current user's JWT token
      const userToken = localStorage.getItem('auth_token');
      
      const response = await fetch(`${API_BASE_URL}/functions/v1/register-device`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken || import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          token: data.token,
          deviceId: data.deviceId,
          platform: data.platform,
          appVersion: data.appVersion,
          deviceModel: data.deviceModel,
          osVersion: data.osVersion,
          type: data.platform === 'ios' ? 'apns' : data.platform === 'android' ? 'fcm' : 'expo'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to register device with backend:', errorData);
        return;
      }

      const result = await response.json();
      console.log('Device registered with backend:', result);
    } catch (error) {
      console.error('Error registering device with backend:', error);
    }
  }

  /**
   * Send message to React Native
   */
  private sendMessageToReactNative(message: any): void {
    const messageString = JSON.stringify(message);
    
    // Try different methods to send message to React Native
    if ((window as any).ReactNativeWebView) {
      (window as any).ReactNativeWebView.postMessage(messageString);
    } else if ((window as any).webkit?.messageHandlers?.ReactNativeBridge) {
      (window as any).webkit.messageHandlers.ReactNativeBridge.postMessage(messageString);
    } else {
      console.log('No React Native bridge available');
    }
  }

  /**
   * Check if running in React Native
   */
  public isRunningInReactNative(): boolean {
    return this.isReactNative;
  }

  /**
   * Check if device is registered
   */
  public isDeviceRegistered(): boolean {
    return this.deviceRegistered;
  }
}

// Export singleton instance
export const webViewBridge = new WebViewBridge();
