/**
 * useGPS Hook
 *
 * React hook for GPS tracking and distance calculations
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getCurrentPosition,
  watchPosition,
  clearWatch,
  calculateDistanceInfo,
  getAccuracyLevel,
} from '@/services/gpsService';
import { GPSPosition, DistanceInfo, CourseHoleExtended } from '@/types/courseExtended';

interface UseGPSOptions {
  enableTracking?: boolean;
  highAccuracy?: boolean;
  updateInterval?: number; // milliseconds
}

interface UseGPSReturn {
  position: GPSPosition | null;
  error: string | null;
  loading: boolean;
  accuracy: 'excellent' | 'good' | 'fair' | 'poor' | null;
  isTracking: boolean;
  distanceInfo: DistanceInfo | null;
  startTracking: () => void;
  stopTracking: () => void;
  refresh: () => Promise<void>;
  calculateDistances: (hole: CourseHoleExtended) => DistanceInfo | null;
}

export function useGPS(options: UseGPSOptions = {}): UseGPSReturn {
  const {
    enableTracking = false,
    highAccuracy = true,
    updateInterval = 5000,
  } = options;

  const [position, setPosition] = useState<GPSPosition | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const [distanceInfo, setDistanceInfo] = useState<DistanceInfo | null>(null);

  const watchIdRef = useRef<number | null>(null);
  const lastUpdateRef = useRef<number>(0);

  // Calculate accuracy level
  const accuracy = position
    ? getAccuracyLevel(position.accuracy)
    : null;

  // Get initial position
  useEffect(() => {
    if (enableTracking) {
      startTracking();
    }
  }, [enableTracking]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        clearWatch(watchIdRef.current);
      }
    };
  }, []);

  const handlePositionUpdate = useCallback(
    (newPosition: GPSPosition) => {
      const now = Date.now();

      // Throttle updates based on updateInterval
      if (now - lastUpdateRef.current < updateInterval) {
        return;
      }

      lastUpdateRef.current = now;
      setPosition(newPosition);
      setError(null);
      setLoading(false);
    },
    [updateInterval]
  );

  const handleError = useCallback((err: GeolocationPositionError) => {
    let errorMessage = 'Unable to get location';

    switch (err.code) {
      case err.PERMISSION_DENIED:
        errorMessage = 'Location permission denied. Please enable location access.';
        break;
      case err.POSITION_UNAVAILABLE:
        errorMessage = 'Location information unavailable.';
        break;
      case err.TIMEOUT:
        errorMessage = 'Location request timed out.';
        break;
    }

    setError(errorMessage);
    setLoading(false);
  }, []);

  const startTracking = useCallback(() => {
    if (isTracking) return;

    setLoading(true);
    setError(null);

    try {
      // Start watching position
      const watchId = watchPosition(handlePositionUpdate, handleError);
      watchIdRef.current = watchId;
      setIsTracking(true);
    } catch (err) {
      setError('Geolocation is not supported by your browser');
      setLoading(false);
    }
  }, [isTracking, handlePositionUpdate, handleError]);

  const stopTracking = useCallback(() => {
    if (!isTracking || watchIdRef.current === null) return;

    clearWatch(watchIdRef.current);
    watchIdRef.current = null;
    setIsTracking(false);
  }, [isTracking]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const newPosition = await getCurrentPosition();
      setPosition(newPosition);
    } catch (err) {
      if (err instanceof GeolocationPositionError) {
        handleError(err);
      } else {
        setError('Failed to get location');
      }
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const calculateDistances = useCallback(
    (hole: CourseHoleExtended): DistanceInfo | null => {
      if (!position || !hole.geometry) {
        return null;
      }

      const distances = calculateDistanceInfo(position, hole);
      setDistanceInfo(distances);
      return distances;
    },
    [position]
  );

  return {
    position,
    error,
    loading,
    accuracy,
    isTracking,
    distanceInfo,
    startTracking,
    stopTracking,
    refresh,
    calculateDistances,
  };
}
