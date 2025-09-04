# React Native Integration Code Examples

This file contains the complete React Native integration code for the Pastor Agenda app. Copy these files to your React Native project.

## 1. Device Registration Service

Create `services/DeviceRegistrationService.ts`:

```typescript
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

interface DeviceRegistrationData {
  token: string;
  deviceId: string;
  platform: 'ios' | 'android' | 'web';
  appVersion?: string;
  deviceModel?: string;
  osVersion?: string;
}

interface UserAuthData {
  userId: string | null;
  userEmail: string | null;
  userToken: string | null;
}

class DeviceRegistrationService {
  private supabaseUrl: string;
  private supabaseAnonKey: string;
  private currentDeviceId: string | null = null;
  private currentPushToken: string | null = null;

  constructor(supabaseUrl: string, supabaseAnonKey: string) {
    this.supabaseUrl = supabaseUrl;
    this.supabaseAnonKey = supabaseAnonKey;
  }

  /**
   * Initialize device registration
   */
  async initialize(): Promise<void> {
    try {
      // Get device info
      const deviceId = await this.getDeviceId();
      const pushToken = await this.getPushToken();
      
      if (!deviceId || !pushToken) {
        console.log('Device ID or push token not available');
        return;
      }

      this.currentDeviceId = deviceId;
      this.currentPushToken = pushToken;

      // Register device anonymously first
      await this.registerDevice({
        token: pushToken,
        deviceId,
        platform: Platform.OS as 'ios' | 'android',
        appVersion: Device.osVersion || '1.0.0',
        deviceModel: Device.modelName || 'Unknown',
        osVersion: Device.osVersion || 'Unknown',
      });

      console.log('Device registered successfully');
    } catch (error) {
      console.error('Error initializing device registration:', error);
    }
  }

  /**
   * Get unique device ID
   */
  private async getDeviceId(): Promise<string | null> {
    try {
      if (Device.isDevice) {
        return Device.osInternalBuildId || Device.modelId || 'unknown-device';
      }
      return 'simulator-device';
    } catch (error) {
      console.error('Error getting device ID:', error);
      return null;
    }
  }

  /**
   * Get Expo push token
   */
  private async getPushToken(): Promise<string | null> {
    try {
      if (!Device.isDevice) {
        console.log('Must use physical device for push notifications');
        return null;
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return null;
      }

      const token = await Notifications.getExpoPushTokenAsync({
        projectId: 'your-expo-project-id', // Replace with your actual project ID
      });

      return token.data;
    } catch (error) {
      console.error('Error getting push token:', error);
      return null;
    }
  }

  /**
   * Register device with Supabase
   */
  async registerDevice(data: DeviceRegistrationData): Promise<void> {
    try {
      const response = await fetch(`${this.supabaseUrl}/functions/v1/register-device`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.supabaseAnonKey}`,
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to register device');
      }

      console.log('Device registered:', result);
    } catch (error) {
      console.error('Error registering device:', error);
      throw error;
    }
  }

  /**
   * Update device with user information
   */
  async updateUserAuth(authData: UserAuthData): Promise<void> {
    if (!this.currentDeviceId || !this.currentPushToken) {
      console.log('Device not registered yet');
      return;
    }

    try {
      const response = await fetch(`${this.supabaseUrl}/functions/v1/register-device`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.supabaseAnonKey}`,
        },
        body: JSON.stringify({
          token: this.currentPushToken,
          deviceId: this.currentDeviceId,
          platform: Platform.OS as 'ios' | 'android',
          userId: authData.userId,
          userEmail: authData.userEmail,
          appVersion: Device.osVersion || '1.0.0',
          deviceModel: Device.modelName || 'Unknown',
          osVersion: Device.osVersion || 'Unknown',
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update device with user info');
      }

      console.log('Device updated with user info:', result);
    } catch (error) {
      console.error('Error updating device with user info:', error);
    }
  }
}

export default DeviceRegistrationService;
```

## 2. Notification Service

Create `services/NotificationService.ts`:

```typescript
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

class NotificationService {
  private notificationListener: any = null;
  private responseListener: any = null;

  /**
   * Initialize notification service
   */
  initialize(): void {
    this.setupNotificationListeners();
  }

  /**
   * Setup notification listeners
   */
  private setupNotificationListeners(): void {
    // Handle notifications received while app is foregrounded
    this.notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
      this.handleNotificationReceived(notification);
    });

    // Handle notification taps
    this.responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification tapped:', response);
      this.handleNotificationTapped(response);
    });
  }

  /**
   * Handle notification received
   */
  private handleNotificationReceived(notification: any): void {
    const { title, body, data } = notification.request.content;
    
    console.log('Notification received:', { title, body, data });
    
    // You can add custom logic here to handle the notification
    // For example, update UI, show in-app notification, etc.
  }

  /**
   * Handle notification tapped
   */
  private handleNotificationTapped(response: any): void {
    const { title, body, data } = response.notification.request.content;
    
    console.log('Notification tapped:', { title, body, data });
    
    // You can add custom logic here to handle the tap
    // For example, navigate to a specific screen, open a modal, etc.
  }

  /**
   * Send test notification (for development)
   */
  async sendTestNotification(): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Test Notification",
          body: "This is a test notification from Pastor Agenda",
          data: { test: true },
        },
        trigger: { seconds: 1 },
      });
    } catch (error) {
      console.error('Error sending test notification:', error);
    }
  }

  /**
   * Cleanup listeners
   */
  cleanup(): void {
    if (this.notificationListener) {
      Notifications.removeNotificationSubscription(this.notificationListener);
    }
    if (this.responseListener) {
      Notifications.removeNotificationSubscription(this.responseListener);
    }
  }
}

export default NotificationService;
```

## 3. WebView Component with Bridge

Create `components/WebViewWithBridge.tsx`:

```typescript
import React, { useRef, useEffect } from 'react';
import { WebView } from 'react-native-webview';
import { Platform } from 'react-native';
import DeviceRegistrationService from '../services/DeviceRegistrationService';
import NotificationService from '../services/NotificationService';

interface WebViewWithBridgeProps {
  source: { uri: string };
  style?: any;
  onLoad?: () => void;
  onError?: (error: any) => void;
}

const WebViewWithBridge: React.FC<WebViewWithBridgeProps> = ({
  source,
  style,
  onLoad,
  onError,
}) => {
  const webViewRef = useRef<WebView>(null);
  const deviceService = useRef<DeviceRegistrationService | null>(null);
  const notificationService = useRef<NotificationService | null>(null);

  useEffect(() => {
    // Initialize services
    const supabaseUrl = 'https://qllicbvfcggtveuzvbqu.supabase.co'; // Replace with your Supabase URL
    const supabaseAnonKey = 'your-supabase-anon-key'; // Replace with your Supabase anon key

    deviceService.current = new DeviceRegistrationService(supabaseUrl, supabaseAnonKey);
    notificationService.current = new NotificationService();

    // Initialize device registration
    deviceService.current.initialize();
    notificationService.current.initialize();

    return () => {
      // Cleanup
      if (notificationService.current) {
        notificationService.current.cleanup();
      }
    };
  }, []);

  /**
   * Handle messages from WebView
   */
  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      console.log('Message from WebView:', data);

      switch (data.type) {
        case 'USER_AUTH_UPDATE':
          handleUserAuthUpdate(data.data);
          break;
        case 'DEVICE_REGISTRATION':
          handleDeviceRegistration(data.data);
          break;
        default:
          console.log('Unknown message type:', data.type);
      }
    } catch (error) {
      console.error('Error parsing message from WebView:', error);
    }
  };

  /**
   * Handle user authentication update
   */
  const handleUserAuthUpdate = async (authData: any) => {
    console.log('Updating user auth:', authData);
    
    if (deviceService.current) {
      await deviceService.current.updateUserAuth(authData);
    }
  };

  /**
   * Handle device registration
   */
  const handleDeviceRegistration = async (deviceData: any) => {
    console.log('Registering device:', deviceData);
    
    if (deviceService.current) {
      await deviceService.current.registerDevice(deviceData);
    }
  };

  /**
   * Inject JavaScript into WebView
   */
  const injectedJavaScript = `
    // Create React Native bridge object
    window.ReactNativeBridge = {
      updateUserAuth: function(userId, userEmail, userToken) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'USER_AUTH_UPDATE',
          data: {
            userId: userId,
            userEmail: userEmail,
            userToken: userToken
          }
        }));
      },
      
      registerDevice: function(data) {
        return new Promise((resolve, reject) => {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'DEVICE_REGISTRATION',
            data: data
          }));
          resolve();
        });
      },
      
      onNotificationReceived: function(callback) {
        // This will be handled by the notification service
        console.log('Notification callback registered');
      }
    };

    // Notify WebView that React Native bridge is ready
    window.dispatchEvent(new Event('ReactNativeBridgeReady'));
    
    true; // Required for injectedJavaScript
  `;

  return (
    <WebView
      ref={webViewRef}
      source={source}
      style={style}
      onLoad={onLoad}
      onError={onError}
      onMessage={handleMessage}
      injectedJavaScript={injectedJavaScript}
      javaScriptEnabled={true}
      domStorageEnabled={true}
      startInLoadingState={true}
      scalesPageToFit={true}
      allowsInlineMediaPlayback={true}
      mediaPlaybackRequiresUserAction={false}
      mixedContentMode="compatibility"
      thirdPartyCookiesEnabled={true}
      sharedCookiesEnabled={true}
      // iOS specific props
      {...(Platform.OS === 'ios' && {
        allowsLinkPreview: false,
        dataDetectorTypes: 'none',
      })}
    />
  );
};

export default WebViewWithBridge;
```

## 4. Custom Hook for WebView Bridge

Create `hooks/useWebViewBridge.ts`:

```typescript
import { useEffect, useRef } from 'react';
import { DeviceRegistrationService } from '../services/DeviceRegistrationService';
import { NotificationService } from '../services/NotificationService';

interface UseWebViewBridgeProps {
  supabaseUrl: string;
  supabaseAnonKey: string;
}

export const useWebViewBridge = ({ supabaseUrl, supabaseAnonKey }: UseWebViewBridgeProps) => {
  const deviceService = useRef<DeviceRegistrationService | null>(null);
  const notificationService = useRef<NotificationService | null>(null);

  useEffect(() => {
    // Initialize services
    deviceService.current = new DeviceRegistrationService(supabaseUrl, supabaseAnonKey);
    notificationService.current = new NotificationService();

    // Initialize device registration
    deviceService.current.initialize();
    notificationService.current.initialize();

    return () => {
      // Cleanup
      if (notificationService.current) {
        notificationService.current.cleanup();
      }
    };
  }, [supabaseUrl, supabaseAnonKey]);

  const updateUserAuth = async (userId: string | null, userEmail: string | null, userToken: string | null) => {
    if (deviceService.current) {
      await deviceService.current.updateUserAuth({ userId, userEmail, userToken });
    }
  };

  const registerDevice = async (deviceData: any) => {
    if (deviceService.current) {
      await deviceService.current.registerDevice(deviceData);
    }
  };

  const sendTestNotification = async () => {
    if (notificationService.current) {
      await notificationService.current.sendTestNotification();
    }
  };

  return {
    updateUserAuth,
    registerDevice,
    sendTestNotification,
  };
};
```

## 5. Main App Integration Example

Update your `App.tsx`:

```typescript
import React from 'react';
import { SafeAreaView, StyleSheet, Alert } from 'react-native';
import WebViewWithBridge from './components/WebViewWithBridge';

const App = () => {
  const handleWebViewLoad = () => {
    console.log('WebView loaded successfully');
  };

  const handleWebViewError = (error: any) => {
    console.error('WebView error:', error);
    Alert.alert('Error', 'Failed to load the web application');
  };

  return (
    <SafeAreaView style={styles.container}>
      <WebViewWithBridge
        source={{ uri: 'https://pastoragenda.com' }} // Replace with your web app URL
        style={styles.webview}
        onLoad={handleWebViewLoad}
        onError={handleWebViewError}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  webview: {
    flex: 1,
  },
});

export default App;
```

## 6. Package.json Dependencies

Add these dependencies to your `package.json`:

```json
{
  "dependencies": {
    "expo": "~49.0.0",
    "expo-device": "~5.4.0",
    "expo-notifications": "~0.20.1",
    "react": "18.2.0",
    "react-native": "0.72.6",
    "react-native-webview": "^13.6.4"
  }
}
```

## 7. App.json Configuration

Update your `app.json`:

```json
{
  "expo": {
    "name": "Pastor Agenda",
    "slug": "pastor-agenda",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "assetBundlePatterns": [
      "**/*"
    ],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.yourcompany.pastoragenda"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#FFFFFF"
      },
      "package": "com.yourcompany.pastoragenda",
      "permissions": [
        "android.permission.INTERNET",
        "android.permission.VIBRATE",
        "android.permission.RECEIVE_BOOT_COMPLETED"
      ]
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#ffffff"
        }
      ]
    ],
    "notification": {
      "icon": "./assets/notification-icon.png",
      "color": "#ffffff"
    }
  }
}
```

## Usage

1. Copy the code examples above to your React Native project
2. Install the required dependencies
3. Update the Supabase URL and keys in the services
4. Update the web app URL in the WebView component
5. Build and deploy your React Native app

The integration will automatically handle device registration and user authentication communication between your web app and React Native container.
