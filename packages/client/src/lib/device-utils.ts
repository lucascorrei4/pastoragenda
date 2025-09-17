/**
 * Device detection utilities
 */

/**
 * Check if the current device is a mobile device
 */
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  
  const userAgent = window.navigator.userAgent.toLowerCase();
  const mobileKeywords = [
    'android',
    'iphone',
    'ipad',
    'ipod',
    'blackberry',
    'windows phone',
    'mobile',
    'webos',
    'palm'
  ];
  
  return mobileKeywords.some(keyword => userAgent.includes(keyword));
}

/**
 * Check if the current device supports push notifications
 */
export function supportsPushNotifications(): boolean {
  if (typeof window === 'undefined') return false;
  
  return (
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    isMobileDevice()
  );
}

/**
 * Check if the current environment is a PWA (Progressive Web App)
 */
export function isPWA(): boolean {
  if (typeof window === 'undefined') return false;
  
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes('android-app://')
  );
}

/**
 * Get device type for logging purposes
 */
export function getDeviceType(): string {
  if (typeof window === 'undefined') return 'unknown';
  
  if (isPWA()) return 'pwa';
  if (isMobileDevice()) return 'mobile';
  return 'desktop';
}
