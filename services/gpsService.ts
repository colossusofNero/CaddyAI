/**
 * GPS Service
 *
 * Handles GPS tracking, distance calculations, and shot tracking
 */

import {
  GPSPosition,
  DistanceInfo,
  CourseHoleExtended,
  LatLng,
  Shot,
} from '@/src/types/courseExtended';

/**
 * Calculate distance between two points using Haversine formula
 * Returns distance in yards
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const meters = R * c;

  // Convert to yards
  return meters * 1.09361;
}

/**
 * Get current GPS position
 */
export function getCurrentPosition(): Promise<GPSPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude || undefined,
          heading: position.coords.heading || undefined,
          speed: position.coords.speed || undefined,
          timestamp: position.timestamp,
        });
      },
      (error) => {
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000,
      }
    );
  });
}

/**
 * Watch GPS position (for continuous tracking)
 */
export function watchPosition(
  onPosition: (position: GPSPosition) => void,
  onError?: (error: GeolocationPositionError) => void
): number {
  if (!navigator.geolocation) {
    throw new Error('Geolocation is not supported');
  }

  return navigator.geolocation.watchPosition(
    (position) => {
      onPosition({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        altitude: position.coords.altitude || undefined,
        heading: position.coords.heading || undefined,
        speed: position.coords.speed || undefined,
        timestamp: position.timestamp,
      });
    },
    onError,
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    }
  );
}

/**
 * Stop watching GPS position
 */
export function clearWatch(watchId: number): void {
  navigator.geolocation.clearWatch(watchId);
}

/**
 * Calculate distance to polygon center
 */
function getPolygonCenter(points: LatLng[]): LatLng {
  if (points.length === 0) {
    return { lat: 0, lng: 0 };
  }

  const sum = points.reduce(
    (acc, point) => ({
      lat: acc.lat + point.lat,
      lng: acc.lng + point.lng,
    }),
    { lat: 0, lng: 0 }
  );

  return {
    lat: sum.lat / points.length,
    lng: sum.lng / points.length,
  };
}

/**
 * Calculate distance information for current hole
 */
export function calculateDistanceInfo(
  userPosition: GPSPosition,
  hole: CourseHoleExtended
): DistanceInfo {
  if (!hole.geometry) {
    return {
      toGreen: 0,
      toFrontGreen: 0,
      toBackGreen: 0,
      toHazards: [],
    };
  }

  // Distance to green center
  const toGreen = calculateDistance(
    userPosition.latitude,
    userPosition.longitude,
    hole.geometry.greenCenter.lat,
    hole.geometry.greenCenter.lng
  );

  // Find front and back of green
  let toFrontGreen = toGreen;
  let toBackGreen = toGreen;

  if (hole.geometry.green.length > 0) {
    const distances = hole.geometry.green.map((point) =>
      calculateDistance(
        userPosition.latitude,
        userPosition.longitude,
        point.lat,
        point.lng
      )
    );
    toFrontGreen = Math.min(...distances);
    toBackGreen = Math.max(...distances);
  }

  // Distance to hazards
  const toHazards: Array<{ type: 'water' | 'bunker'; distance: number }> = [];

  // Water hazards
  if (hole.geometry.water) {
    hole.geometry.water.forEach((water) => {
      const center = getPolygonCenter(water);
      const distance = calculateDistance(
        userPosition.latitude,
        userPosition.longitude,
        center.lat,
        center.lng
      );
      toHazards.push({ type: 'water', distance });
    });
  }

  // Bunkers
  if (hole.geometry.bunkers) {
    hole.geometry.bunkers.forEach((bunker) => {
      const center = getPolygonCenter(bunker);
      const distance = calculateDistance(
        userPosition.latitude,
        userPosition.longitude,
        center.lat,
        center.lng
      );
      toHazards.push({ type: 'bunker', distance });
    });
  }

  // Sort hazards by distance
  toHazards.sort((a, b) => a.distance - b.distance);

  return {
    toGreen: Math.round(toGreen),
    toFrontGreen: Math.round(toFrontGreen),
    toBackGreen: Math.round(toBackGreen),
    toHazards,
  };
}

/**
 * Record a shot
 */
export function recordShot(
  holeNumber: number,
  shotNumber: number,
  position: GPSPosition,
  club?: string
): Shot {
  return {
    id: `${Date.now()}_${holeNumber}_${shotNumber}`,
    holeNumber,
    shotNumber,
    position: {
      lat: position.latitude,
      lng: position.longitude,
    },
    club,
    timestamp: Date.now(),
  };
}

/**
 * Calculate shot distance
 */
export function calculateShotDistance(shot1: Shot, shot2: Shot): number {
  return Math.round(
    calculateDistance(
      shot1.position.lat,
      shot1.position.lng,
      shot2.position.lat,
      shot2.position.lng
    )
  );
}

/**
 * Check if position is on the green
 */
export function isOnGreen(
  position: GPSPosition,
  hole: CourseHoleExtended
): boolean {
  if (!hole.geometry || hole.geometry.green.length === 0) {
    return false;
  }

  // Simple point-in-polygon check using ray casting
  let inside = false;
  const green = hole.geometry.green;

  for (let i = 0, j = green.length - 1; i < green.length; j = i++) {
    const xi = green[i].lat;
    const yi = green[i].lng;
    const xj = green[j].lat;
    const yj = green[j].lng;

    const intersect =
      yi > position.longitude !== yj > position.longitude &&
      position.latitude <
        ((xj - xi) * (position.longitude - yi)) / (yj - yi) + xi;

    if (intersect) inside = !inside;
  }

  return inside;
}

/**
 * Check if position is on the fairway
 */
export function isOnFairway(
  position: GPSPosition,
  hole: CourseHoleExtended
): boolean {
  if (!hole.geometry || hole.geometry.fairway.length === 0) {
    return false;
  }

  // Simple point-in-polygon check using ray casting
  let inside = false;
  const fairway = hole.geometry.fairway;

  for (let i = 0, j = fairway.length - 1; i < fairway.length; j = i++) {
    const xi = fairway[i].lat;
    const yi = fairway[i].lng;
    const xj = fairway[j].lat;
    const yj = fairway[j].lng;

    const intersect =
      yi > position.longitude !== yj > position.longitude &&
      position.latitude <
        ((xj - xi) * (position.longitude - yi)) / (yj - yi) + xi;

    if (intersect) inside = !inside;
  }

  return inside;
}

/**
 * Get GPS accuracy level
 */
export function getAccuracyLevel(
  accuracy: number
): 'excellent' | 'good' | 'fair' | 'poor' {
  if (accuracy <= 10) return 'excellent';
  if (accuracy <= 30) return 'good';
  if (accuracy <= 50) return 'fair';
  return 'poor';
}

/**
 * Request high accuracy GPS
 */
export async function requestHighAccuracyGPS(): Promise<GPSPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported'));
      return;
    }

    let attempts = 0;
    const maxAttempts = 3;

    const tryGetPosition = () => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const gpsPosition: GPSPosition = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            altitude: position.coords.altitude || undefined,
            heading: position.coords.heading || undefined,
            speed: position.coords.speed || undefined,
            timestamp: position.timestamp,
          };

          // If accuracy is good enough, resolve
          if (position.coords.accuracy <= 30 || attempts >= maxAttempts) {
            resolve(gpsPosition);
          } else {
            // Try again for better accuracy
            attempts++;
            setTimeout(tryGetPosition, 1000);
          }
        },
        (error) => {
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        }
      );
    };

    tryGetPosition();
  });
}
