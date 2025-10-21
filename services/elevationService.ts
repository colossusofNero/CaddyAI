/**
 * Elevation Service - Using Open-Elevation API (free, no API key required)
 */

import { ElevationData, LocationCoordinates } from '@/types/weather';

// Cache duration: 24 hours (elevation doesn't change)
const CACHE_DURATION = 24 * 60 * 60 * 1000;

interface ElevationCache {
  data: ElevationData;
  expiresAt: number;
}

// In-memory cache
const elevationCache = new Map<string, ElevationCache>();

/**
 * Get elevation for a location using Open-Elevation API
 * Returns elevation in meters
 */
export async function getElevation(
  lat: number,
  lon: number
): Promise<number | null> {
  const cacheKey = `elevation_${lat.toFixed(4)}_${lon.toFixed(4)}`;

  // Check cache
  const cached = elevationCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data.elevation;
  }

  try {
    // Using Open-Elevation API (free, no API key)
    const response = await fetch(
      `https://api.open-elevation.com/api/v1/lookup?locations=${lat},${lon}`
    );

    if (!response.ok) {
      throw new Error(`Elevation API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.results || data.results.length === 0) {
      throw new Error('No elevation data returned');
    }

    const elevationData: ElevationData = {
      elevation: data.results[0].elevation,
      location: { latitude: lat, longitude: lon },
    };

    // Cache the result
    elevationCache.set(cacheKey, {
      data: elevationData,
      expiresAt: Date.now() + CACHE_DURATION,
    });

    return elevationData.elevation;
  } catch (error) {
    console.error('Error fetching elevation data:', error);

    // Fallback: try USGS Elevation Point Query Service (US only)
    try {
      const usgsResponse = await fetch(
        `https://nationalmap.gov/epqs/pqs.php?x=${lon}&y=${lat}&units=Meters&output=json`
      );

      if (usgsResponse.ok) {
        const usgsData = await usgsResponse.json();
        const elevation = parseFloat(usgsData.USGS_Elevation_Point_Query_Service.Elevation_Query.Elevation);

        if (!isNaN(elevation)) {
          const elevationData: ElevationData = {
            elevation,
            location: { latitude: lat, longitude: lon },
          };

          elevationCache.set(cacheKey, {
            data: elevationData,
            expiresAt: Date.now() + CACHE_DURATION,
          });

          return elevation;
        }
      }
    } catch (usgsError) {
      console.error('USGS elevation fallback failed:', usgsError);
    }

    return null;
  }
}

/**
 * Get elevation in feet
 */
export async function getElevationFeet(
  lat: number,
  lon: number
): Promise<number | null> {
  const elevationMeters = await getElevation(lat, lon);
  if (elevationMeters === null) return null;
  return Math.round(elevationMeters * 3.28084); // Convert meters to feet
}

/**
 * Calculate elevation difference between two points
 */
export async function getElevationChange(
  from: LocationCoordinates,
  to: LocationCoordinates
): Promise<number | null> {
  try {
    const [fromElevation, toElevation] = await Promise.all([
      getElevation(from.latitude, from.longitude),
      getElevation(to.latitude, to.longitude),
    ]);

    if (fromElevation === null || toElevation === null) {
      return null;
    }

    return toElevation - fromElevation; // Positive = uphill, negative = downhill
  } catch (error) {
    console.error('Error calculating elevation change:', error);
    return null;
  }
}

/**
 * Get elevation change in feet
 */
export async function getElevationChangeFeet(
  from: LocationCoordinates,
  to: LocationCoordinates
): Promise<number | null> {
  const changeMeters = await getElevationChange(from, to);
  if (changeMeters === null) return null;
  return Math.round(changeMeters * 3.28084);
}

/**
 * Clear elevation cache
 */
export function clearElevationCache() {
  elevationCache.clear();
}

/**
 * Get cache statistics
 */
export function getElevationCacheStats() {
  return {
    cacheSize: elevationCache.size,
  };
}
