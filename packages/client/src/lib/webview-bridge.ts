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
      default:
        console.log('Unknown message type:', data.type);
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
      console.log('Not running in React Native, skipping user auth update');
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
