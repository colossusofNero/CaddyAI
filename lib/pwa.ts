/**
 * PWA Utilities
 * Progressive Web App features including install prompt, share API, and notifications
 */

// Install prompt interface
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

// PWA install state
let deferredPrompt: BeforeInstallPromptEvent | null = null;

/**
 * Initialize PWA install prompt listener
 */
export const initPWAInstall = () => {
  if (typeof window === 'undefined') return;

  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault();
    // Stash the event so it can be triggered later
    deferredPrompt = e as BeforeInstallPromptEvent;

    // Dispatch custom event to notify app that install is available
    window.dispatchEvent(new Event('pwa-install-available'));
  });

  // Listen for app installed event
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    window.dispatchEvent(new Event('pwa-installed'));
  });
};

/**
 * Show PWA install prompt
 */
export const showPWAInstallPrompt = async (): Promise<boolean> => {
  if (!deferredPrompt) {
    return false;
  }

  // Show the install prompt
  await deferredPrompt.prompt();

  // Wait for the user to respond to the prompt
  const { outcome } = await deferredPrompt.userChoice;

  // Clear the deferred prompt
  deferredPrompt = null;

  return outcome === 'accepted';
};

/**
 * Check if PWA install is available
 */
export const isPWAInstallAvailable = (): boolean => {
  return deferredPrompt !== null;
};

/**
 * Check if app is installed (running in standalone mode)
 */
export const isPWAInstalled = (): boolean => {
  if (typeof window === 'undefined') return false;

  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true || // iOS
    document.referrer.includes('android-app://') // Android TWA
  );
};

/**
 * Native Share API
 */
export interface ShareData {
  title?: string;
  text?: string;
  url?: string;
  files?: File[];
}

/**
 * Check if native share is supported
 */
export const isShareSupported = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  return 'share' in navigator;
};

/**
 * Share content using native share API
 */
export const share = async (data: ShareData): Promise<boolean> => {
  if (!isShareSupported()) {
    return false;
  }

  try {
    await navigator.share(data);
    return true;
  } catch (error) {
    // User cancelled or error occurred
    if ((error as Error).name === 'AbortError') {
      return false; // User cancelled
    }
    console.error('Error sharing:', error);
    return false;
  }
};

/**
 * Check if file sharing is supported
 */
export const isFileShareSupported = (files: File[]): boolean => {
  if (!isShareSupported()) return false;
  if (typeof navigator.canShare === 'undefined') return false;

  return navigator.canShare({ files });
};

/**
 * Clipboard API helpers
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  if (typeof navigator === 'undefined' || !navigator.clipboard) {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      document.body.removeChild(textArea);
      return true;
    } catch (_error) {
      document.body.removeChild(textArea);
      return false;
    }
  }

  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Error copying to clipboard:', error);
    return false;
  }
};

/**
 * Push Notifications
 */

/**
 * Check if notifications are supported
 */
export const areNotificationsSupported = (): boolean => {
  return typeof window !== 'undefined' && 'Notification' in window;
};

/**
 * Check notification permission status
 */
export const getNotificationPermission = (): NotificationPermission => {
  if (!areNotificationsSupported()) return 'denied';
  return Notification.permission;
};

/**
 * Request notification permission
 */
export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if (!areNotificationsSupported()) return 'denied';

  const permission = await Notification.requestPermission();
  return permission;
};

/**
 * Show a notification
 */
export const showNotification = async (
  title: string,
  options?: NotificationOptions
): Promise<Notification | null> => {
  if (!areNotificationsSupported()) return null;

  const permission = getNotificationPermission();
  if (permission !== 'granted') {
    return null;
  }

  return new Notification(title, options);
};

/**
 * Geolocation API
 */

export interface GeolocationPosition {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude?: number;
  altitudeAccuracy?: number;
  heading?: number;
  speed?: number;
}

/**
 * Check if geolocation is supported
 */
export const isGeolocationSupported = (): boolean => {
  return typeof navigator !== 'undefined' && 'geolocation' in navigator;
};

/**
 * Get current position
 */
export const getCurrentPosition = async (): Promise<GeolocationPosition | null> => {
  if (!isGeolocationSupported()) return null;

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude ?? undefined,
          altitudeAccuracy: position.coords.altitudeAccuracy ?? undefined,
          heading: position.coords.heading ?? undefined,
          speed: position.coords.speed ?? undefined,
        });
      },
      (error) => {
        console.error('Geolocation error:', error);
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  });
};

/**
 * Watch position changes
 */
export const watchPosition = (
  callback: (position: GeolocationPosition) => void,
  errorCallback?: (error: GeolocationPositionError) => void
): number | null => {
  if (!isGeolocationSupported()) return null;

  return navigator.geolocation.watchPosition(
    (position) => {
      callback({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        altitude: position.coords.altitude ?? undefined,
        altitudeAccuracy: position.coords.altitudeAccuracy ?? undefined,
        heading: position.coords.heading ?? undefined,
        speed: position.coords.speed ?? undefined,
      });
    },
    errorCallback,
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 30000,
    }
  );
};

/**
 * Clear position watch
 */
export const clearWatch = (watchId: number): void => {
  if (!isGeolocationSupported()) return;
  navigator.geolocation.clearWatch(watchId);
};

/**
 * Device Orientation (for augmented reality features)
 */

export const isOrientationSupported = (): boolean => {
  return typeof window !== 'undefined' && 'DeviceOrientationEvent' in window;
};

/**
 * Vibration API (for haptic feedback)
 */

export const isVibrationSupported = (): boolean => {
  return typeof navigator !== 'undefined' && 'vibrate' in navigator;
};

/**
 * Vibrate device
 * @param pattern - Single duration or array of durations [vibrate, pause, vibrate, ...]
 */
export const vibrate = (pattern: number | number[] | readonly number[]): boolean => {
  if (!isVibrationSupported()) return false;

  return navigator.vibrate(pattern as number | number[]);
};

/**
 * Cancel vibration
 */
export const cancelVibration = (): void => {
  if (!isVibrationSupported()) return;
  navigator.vibrate(0);
};

/**
 * Common vibration patterns
 */
export const VIBRATION_PATTERNS = {
  tap: 10,
  click: 20,
  success: [50, 100, 50],
  error: [100, 50, 100, 50, 100],
  warning: [100, 100, 100],
} as const;

/**
 * Battery Status API
 */

export const isBatterySupported = (): boolean => {
  return typeof navigator !== 'undefined' && 'getBattery' in navigator;
};

export interface BatteryStatus {
  level: number; // 0-1
  charging: boolean;
  chargingTime: number; // seconds
  dischargingTime: number; // seconds
}

export const getBatteryStatus = async (): Promise<BatteryStatus | null> => {
  if (!isBatterySupported()) return null;

  try {
    const battery = await (navigator as Navigator & { getBattery: () => Promise<{ level: number; charging: boolean; chargingTime: number; dischargingTime: number }> }).getBattery();
    return {
      level: battery.level,
      charging: battery.charging,
      chargingTime: battery.chargingTime,
      dischargingTime: battery.dischargingTime,
    };
  } catch (error) {
    console.error('Battery status error:', error);
    return null;
  }
};

/**
 * Wake Lock API (keep screen on during rounds)
 */

export const isWakeLockSupported = (): boolean => {
  return typeof navigator !== 'undefined' && 'wakeLock' in navigator;
};

let wakeLock: { release: () => Promise<void> } | null = null;

export const requestWakeLock = async (): Promise<boolean> => {
  if (!isWakeLockSupported()) return false;

  try {
    wakeLock = await (navigator as Navigator & { wakeLock: { request: (type: string) => Promise<{ release: () => Promise<void> }> } }).wakeLock.request('screen');
    return true;
  } catch (error) {
    console.error('Wake lock error:', error);
    return false;
  }
};

export const releaseWakeLock = async (): Promise<void> => {
  if (wakeLock) {
    await wakeLock.release();
    wakeLock = null;
  }
};
