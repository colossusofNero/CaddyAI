'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export interface GPSPosition {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
  altitude?: number;
  altitudeAccuracy?: number;
  heading?: number;
  speed?: number;
}

export interface GPSTrackingOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  minDistance?: number; // Minimum distance in meters to trigger update
}

export interface GPSTrackingState {
  currentPosition: GPSPosition | null;
  previousPosition: GPSPosition | null;
  isTracking: boolean;
  error: string | null;
  permissionStatus: 'granted' | 'denied' | 'prompt' | 'unknown';
}

/**
 * Hook for tracking GPS position with shot detection
 *
 * Automatically detects significant position changes that indicate a shot was taken
 * and provides callbacks for handling shot outcomes.
 *
 * Usage:
 * ```tsx
 * const { startTracking, stopTracking, currentPosition, onShotDetected } = useGPSTracking({
 *   minDistance: 10, // 10 meters = significant movement
 * });
 *
 * onShotDetected((from, to) => {
 *   console.log('Shot detected!', { from, to });
 *   // Track outcome
 * });
 * ```
 */
export function useGPSTracking(options: GPSTrackingOptions = {}) {
  const {
    enableHighAccuracy = true,
    timeout = 10000,
    maximumAge = 0,
    minDistance = 10, // meters
  } = options;

  const [state, setState] = useState<GPSTrackingState>({
    currentPosition: null,
    previousPosition: null,
    isTracking: false,
    error: null,
    permissionStatus: 'unknown',
  });

  const watchId = useRef<number | null>(null);
  const shotDetectedCallbacks = useRef<Array<(from: GPSPosition, to: GPSPosition) => void>>([]);

  // Check if geolocation is supported
  const isSupported = typeof window !== 'undefined' && 'geolocation' in navigator;

  // Request permission
  const requestPermission = useCallback(async () => {
    if (!isSupported) {
      setState(prev => ({
        ...prev,
        error: 'Geolocation is not supported by this browser',
        permissionStatus: 'denied',
      }));
      return false;
    }

    try {
      // Check permission API if available
      if ('permissions' in navigator) {
        const result = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
        setState(prev => ({ ...prev, permissionStatus: result.state as any }));
        return result.state === 'granted';
      }

      // Fallback: try to get position
      return new Promise<boolean>((resolve) => {
        navigator.geolocation.getCurrentPosition(
          () => {
            setState(prev => ({ ...prev, permissionStatus: 'granted' }));
            resolve(true);
          },
          () => {
            setState(prev => ({ ...prev, permissionStatus: 'denied' }));
            resolve(false);
          },
          { enableHighAccuracy, timeout, maximumAge }
        );
      });
    } catch (error) {
      console.error('[GPS] Permission error:', error);
      setState(prev => ({ ...prev, permissionStatus: 'denied' }));
      return false;
    }
  }, [isSupported, enableHighAccuracy, timeout, maximumAge]);

  // Calculate distance between two GPS points (Haversine formula)
  const calculateDistance = useCallback((pos1: GPSPosition, pos2: GPSPosition): number => {
    const R = 6371e3; // Earth radius in meters
    const φ1 = (pos1.latitude * Math.PI) / 180;
    const φ2 = (pos2.latitude * Math.PI) / 180;
    const Δφ = ((pos2.latitude - pos1.latitude) * Math.PI) / 180;
    const Δλ = ((pos2.longitude - pos1.longitude) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }, []);

  // Convert GeolocationPosition to GPSPosition
  const convertPosition = useCallback((position: GeolocationPosition): GPSPosition => {
    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      timestamp: position.timestamp,
      altitude: position.coords.altitude || undefined,
      altitudeAccuracy: position.coords.altitudeAccuracy || undefined,
      heading: position.coords.heading || undefined,
      speed: position.coords.speed || undefined,
    };
  }, []);

  // Start tracking
  const startTracking = useCallback(async () => {
    if (!isSupported) {
      setState(prev => ({ ...prev, error: 'Geolocation not supported' }));
      return false;
    }

    // Request permission first
    const hasPermission = await requestPermission();
    if (!hasPermission) {
      setState(prev => ({ ...prev, error: 'Location permission denied' }));
      return false;
    }

    setState(prev => ({ ...prev, isTracking: true, error: null }));

    watchId.current = navigator.geolocation.watchPosition(
      (position) => {
        const newPosition = convertPosition(position);

        setState(prev => {
          // Check if this is a significant movement (possible shot)
          if (prev.currentPosition && minDistance > 0) {
            const distance = calculateDistance(prev.currentPosition, newPosition);

            if (distance >= minDistance) {
              // Shot detected!
              console.log('[GPS] Shot detected! Distance:', distance, 'meters');
              shotDetectedCallbacks.current.forEach(callback => {
                callback(prev.currentPosition!, newPosition);
              });

              return {
                ...prev,
                previousPosition: prev.currentPosition,
                currentPosition: newPosition,
              };
            }
          }

          return {
            ...prev,
            currentPosition: newPosition,
            error: null,
          };
        });
      },
      (error) => {
        console.error('[GPS] Error:', error);
        setState(prev => ({
          ...prev,
          error: error.message,
          isTracking: false,
        }));
      },
      {
        enableHighAccuracy,
        timeout,
        maximumAge,
      }
    );

    return true;
  }, [isSupported, requestPermission, convertPosition, calculateDistance, minDistance, enableHighAccuracy, timeout, maximumAge]);

  // Stop tracking
  const stopTracking = useCallback(() => {
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }

    setState(prev => ({ ...prev, isTracking: false }));
  }, []);

  // Get current position once
  const getCurrentPosition = useCallback(async (): Promise<GPSPosition | null> => {
    if (!isSupported) {
      return null;
    }

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const gpsPosition = convertPosition(position);
          setState(prev => ({ ...prev, currentPosition: gpsPosition }));
          resolve(gpsPosition);
        },
        (error) => {
          setState(prev => ({ ...prev, error: error.message }));
          reject(error);
        },
        { enableHighAccuracy, timeout, maximumAge }
      );
    });
  }, [isSupported, convertPosition, enableHighAccuracy, timeout, maximumAge]);

  // Register callback for shot detection
  const onShotDetected = useCallback((callback: (from: GPSPosition, to: GPSPosition) => void) => {
    shotDetectedCallbacks.current.push(callback);

    // Return unsubscribe function
    return () => {
      shotDetectedCallbacks.current = shotDetectedCallbacks.current.filter(cb => cb !== callback);
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTracking();
    };
  }, [stopTracking]);

  return {
    ...state,
    startTracking,
    stopTracking,
    getCurrentPosition,
    onShotDetected,
    calculateDistance,
    isSupported,
  };
}
