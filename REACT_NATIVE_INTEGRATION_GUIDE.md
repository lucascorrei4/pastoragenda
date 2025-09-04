# React Native WebView Integration Guide

This guide explains how to integrate the Pastor Agenda web app with a React Native app using WebView container for user-device matching and push notifications.

## 🎯 Overview

The integration enables:
- **Automatic Device Registration**: Devices register when the app launches
- **User Association**: Web app sends user info to React Native when users log in/out
- **Targeted Notifications**: Send notifications to specific users or all users
- **Cross-platform Support**: Works on iOS, Android, and web

## 📱 React Native Setup

### 1. Install Dependencies

```bash
npm install expo expo-device expo-notifications react-native-webview
```

### 2. Create Device Registration Service

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

  async initialize(): Promise<void> {
    try {
      const deviceId = await this.getDeviceId();
      const pushToken = await this.getPushToken();
      
      if (!deviceId || !pushToken) {
        console.log('Device ID or push token not available');
        return;
      }

      this.currentDeviceId = deviceId;
      this.currentPushToken = pushToken;

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

### 3. Create Notification Service

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

  initialize(): void {
    this.setupNotificationListeners();
  }

  private setupNotificationListeners(): void {
    this.notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
      this.handleNotificationReceived(notification);
    });

    this.responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification tapped:', response);
      this.handleNotificationTapped(response);
    });
  }

  private handleNotificationReceived(notification: any): void {
    const { title, body, data } = notification.request.content;
    console.log('Notification received:', { title, body, data });
  }

  private handleNotificationTapped(response: any): void {
    const { title, body, data } = response.notification.request.content;
    console.log('Notification tapped:', { title, body, data });
  }

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

### 4. Create WebView Component with Bridge

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
    const supabaseUrl = 'https://qllicbvfcggtveuzvbqu.supabase.co'; // Replace with your Supabase URL
    const supabaseAnonKey = 'your-supabase-anon-key'; // Replace with your Supabase anon key

    deviceService.current = new DeviceRegistrationService(supabaseUrl, supabaseAnonKey);
    notificationService.current = new NotificationService();

    deviceService.current.initialize();
    notificationService.current.initialize();

    return () => {
      if (notificationService.current) {
        notificationService.current.cleanup();
      }
    };
  }, []);

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

  const handleUserAuthUpdate = async (authData: any) => {
    console.log('Updating user auth:', authData);
    
    if (deviceService.current) {
      await deviceService.current.updateUserAuth(authData);
    }
  };

  const handleDeviceRegistration = async (deviceData: any) => {
    console.log('Registering device:', deviceData);
    
    if (deviceService.current) {
      await deviceService.current.registerDevice(deviceData);
    }
  };

  const injectedJavaScript = `
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
        console.log('Notification callback registered');
      }
    };

    window.dispatchEvent(new Event('ReactNativeBridgeReady'));
    true;
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
      {...(Platform.OS === 'ios' && {
        allowsLinkPreview: false,
        dataDetectorTypes: 'none',
      })}
    />
  );
};

export default WebViewWithBridge;
```

### 5. Update App.tsx

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

### 6. Update app.json

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

## 🌐 Web App Integration

The web app has been updated to automatically communicate with React Native when running in a WebView container. The integration includes:

### 1. WebView Bridge (`lib/webview-bridge.ts`)
- Detects React Native WebView environment
- Handles communication with React Native
- Manages user authentication updates

### 2. AuthContext Integration
- Automatically notifies React Native when users log in/out
- Updates device registration with user information
- Handles all authentication state changes

### 3. WebView Integration (`lib/webview-integration.ts`)
- Initializes WebView integration on app load
- Sets up device registration for web platform
- Provides notification sending functions

## 🚀 Usage

### Sending Notifications

#### Send to specific user by ID:
```typescript
import { sendNotificationToUser } from './lib/webview-integration';

await sendNotificationToUser(
  'user-uuid-here',
  'Personal Message',
  'You have a new message',
  { type: 'message', id: '123' }
);
```

#### Send to user by email:
```typescript
import { sendNotificationToUserByEmail } from './lib/webview-integration';

await sendNotificationToUserByEmail(
  'user@example.com',
  'Account Update',
  'Your account has been updated',
  { type: 'account', action: 'updated' }
);
```

#### Send to all users:
```typescript
import { sendNotificationToAllUsers } from './lib/webview-integration';

await sendNotificationToAllUsers(
  'App Update',
  'New features are now available!',
  { type: 'update', version: '1.1.0' }
);
```

### Using Supabase Edge Functions Directly

You can also use the Supabase Edge Functions directly:

```typescript
// Send to specific user
await fetch('https://qllicbvfcggtveuzvbqu.supabase.co/functions/v1/send-notification', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'Personal Message',
    body: 'You have a new message',
    userId: 'user-uuid-here'
  })
});

// Send to user by email
await fetch('https://qllicbvfcggtveuzvbqu.supabase.co/functions/v1/send-notification', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'Account Update',
    body: 'Your account has been updated',
    userEmail: 'user@example.com'
  })
});
```

## 🔧 Configuration

### Environment Variables

Make sure to set these environment variables in your React Native app:

```typescript
const SUPABASE_URL = 'https://qllicbvfcggtveuzvbqu.supabase.co';
const SUPABASE_ANON_KEY = 'your-supabase-anon-key';
const EXPO_PROJECT_ID = 'your-expo-project-id';
```

### Supabase Configuration

1. Deploy the Edge Functions to your Supabase project
2. Run the database migration to create the devices table
3. Update the Supabase URL and keys in your React Native app

## 📊 Database Schema

The `devices` table stores:
- `user_id`: Links to authenticated user
- `user_email`: User's email address
- `push_token`: Expo push token
- `device_id`: Unique device identifier
- `platform`: ios, android, or web
- `is_active`: Whether device is active
- `last_seen`: Last activity timestamp

## 🧪 Testing

1. **Test Device Registration**: Check that devices register when the app launches
2. **Test User Association**: Verify that user info is sent to React Native when users log in
3. **Test Notifications**: Send test notifications to verify the complete flow
4. **Test Cross-platform**: Test on iOS, Android, and web

## 🔍 Troubleshooting

### Common Issues:

1. **Device not registering**: Check Expo project ID and push token permissions
2. **User not associated**: Verify WebView bridge is working and messages are being sent
3. **Notifications not received**: Check device registration and push token validity
4. **WebView not loading**: Verify URL and network connectivity

### Debug Logs:

Enable debug logging by checking the console for:
- "Running in React Native WebView" - WebView detection
- "Device registered successfully" - Device registration
- "Updating user auth" - User authentication updates
- "Notification sent" - Notification delivery

## 🎉 Ready to Use!

Your Pastor Agenda app is now fully integrated with React Native WebView container for user-device matching and push notifications. Users can seamlessly use the app on mobile devices while maintaining their authentication state and receiving targeted notifications.
