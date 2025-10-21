/**
 * Club Recommendation Service - Adjusts club recommendations based on weather, elevation, and conditions
 */

import { WeatherData, WeatherImpact, LocationCoordinates } from '@/types/weather';
import { Club, ClubType } from '@/types/club';
import { getElevationChangeFeet } from './elevationService';

/**
 * Calculate weather impact on shot distance
 */
export function calculateWeatherImpact(
  baseDistance: number,
  weather: WeatherData,
  elevation: number = 0,
  shotDirection: number = 0 // Direction of shot in degrees (0=North)
): WeatherImpact {
  const recommendations: string[] = [];
  let windImpact = 0;
  let temperatureImpact = 0;
  let humidityImpact = 0;
  let elevationImpact = 0;

  // 1. Wind Impact
  windImpact = calculateWindEffect(
    weather.windSpeed,
    weather.windDirection,
    shotDirection
  );

  if (Math.abs(windImpact) > 0) {
    if (windImpact > 0) {
      recommendations.push(`Tailwind adds ${Math.round(windImpact)} yards`);
    } else {
      recommendations.push(`Headwind reduces ${Math.abs(Math.round(windImpact))} yards`);
    }
  }

  // 2. Temperature Impact (1 yard per 10°F from 70°F baseline)
  const tempDiff = weather.temperature - 70;
  temperatureImpact = tempDiff / 10;

  if (Math.abs(temperatureImpact) >= 1) {
    if (weather.temperature < 60) {
      recommendations.push(`Cold air: ball travels ${Math.abs(Math.round(temperatureImpact))} yards less`);
    } else if (weather.temperature > 80) {
      recommendations.push(`Hot air: ball travels ${Math.round(temperatureImpact)} yards more`);
    }
  }

  // 3. Humidity Impact (1% reduction per 10% humidity over 50%)
  if (weather.humidity > 50) {
    humidityImpact = -((weather.humidity - 50) / 10);
    if (Math.abs(humidityImpact) >= 1) {
      recommendations.push(`High humidity: ball travels ${Math.abs(Math.round(humidityImpact))} yards less`);
    }
  }

  // 4. Elevation Impact (1 yard per 100ft)
  elevationImpact = elevation / 100;

  if (Math.abs(elevationImpact) >= 1) {
    if (elevation > 0) {
      recommendations.push(`Uphill: add ${Math.round(elevationImpact)} yards`);
    } else {
      recommendations.push(`Downhill: subtract ${Math.abs(Math.round(elevationImpact))} yards`);
    }
  }

  // Total adjustment
  const totalAdjustment = windImpact + temperatureImpact + humidityImpact + elevationImpact;

  // Club recommendation
  const clubAdjustment = Math.abs(totalAdjustment);
  if (clubAdjustment >= 15) {
    const clubs = Math.round(clubAdjustment / 10);
    if (totalAdjustment > 0) {
      recommendations.push(`Consider using ${clubs} club${clubs > 1 ? 's' : ''} less`);
    } else {
      recommendations.push(`Consider using ${clubs} club${clubs > 1 ? 's' : ''} more`);
    }
  } else if (clubAdjustment >= 8) {
    if (totalAdjustment > 0) {
      recommendations.push('Consider using one club less');
    } else {
      recommendations.push('Consider using one club more');
    }
  }

  return {
    windImpactYards: Math.round(windImpact * 10) / 10,
    temperatureImpactYards: Math.round(temperatureImpact * 10) / 10,
    humidityImpactYards: Math.round(humidityImpact * 10) / 10,
    elevationImpactYards: Math.round(elevationImpact * 10) / 10,
    totalAdjustment: Math.round(totalAdjustment * 10) / 10,
    recommendations,
  };
}

/**
 * Calculate wind effect on shot distance
 * @param windSpeed - Wind speed in mph
 * @param windDirection - Wind direction in degrees (0=North, 90=East, 180=South, 270=West)
 * @param shotDirection - Direction of shot in degrees
 * @returns Impact in yards (positive = helps, negative = hurts)
 */
export function calculateWindEffect(
  windSpeed: number,
  windDirection: number,
  shotDirection: number
): number {
  // Calculate relative wind direction
  let relativeAngle = windDirection - shotDirection;

  // Normalize to -180 to 180
  while (relativeAngle > 180) relativeAngle -= 360;
  while (relativeAngle < -180) relativeAngle += 360;

  // Convert to radians
  const radians = (relativeAngle * Math.PI) / 180;

  // Tailwind (positive) vs Headwind (negative)
  // cos(0°) = 1 (full tailwind), cos(180°) = -1 (full headwind)
  // cos(90°) = 0 (crosswind, minimal effect)
  const headwindComponent = Math.cos(radians);

  // Wind impact: roughly 1 yard per mph of headwind/tailwind for average swing
  // Reduced for crosswinds (sine component affects accuracy more than distance)
  const impact = windSpeed * headwindComponent * 0.8;

  return impact;
}

/**
 * Adjust club distance for current conditions
 */
export function adjustDistanceForConditions(
  club: Club,
  weather: WeatherData,
  elevation: number = 0,
  shotDirection: number = 0
): number {
  const impact = calculateWeatherImpact(
    club.carryYards,
    weather,
    elevation,
    shotDirection
  );

  return Math.round(club.carryYards + impact.totalAdjustment);
}

/**
 * Recommend best club for target distance given conditions
 */
export function recommendClubForDistance(
  targetDistance: number,
  availableClubs: Club[],
  weather: WeatherData,
  elevation: number = 0,
  shotDirection: number = 0
): {
  club: Club;
  adjustedDistance: number;
  impact: WeatherImpact;
} | null {
  if (availableClubs.length === 0) return null;

  // Sort clubs by distance (longest first)
  const sortedClubs = [...availableClubs].sort((a, b) => b.carryYards - a.carryYards);

  // Find best club match
  let bestClub = sortedClubs[0];
  let bestDifference = Infinity;

  for (const club of sortedClubs) {
    const adjustedDistance = adjustDistanceForConditions(
      club,
      weather,
      elevation,
      shotDirection
    );

    const difference = Math.abs(targetDistance - adjustedDistance);

    if (difference < bestDifference) {
      bestDifference = difference;
      bestClub = club;
    }
  }

  const adjustedDistance = adjustDistanceForConditions(
    bestClub,
    weather,
    elevation,
    shotDirection
  );

  const impact = calculateWeatherImpact(
    bestClub.carryYards,
    weather,
    elevation,
    shotDirection
  );

  return {
    club: bestClub,
    adjustedDistance,
    impact,
  };
}

/**
 * Get shot recommendations for a hole
 */
export async function getHoleRecommendation(
  distanceToGreen: number,
  playerLocation: LocationCoordinates,
  greenLocation: LocationCoordinates,
  availableClubs: Club[],
  weather: WeatherData,
  shotDirection: number = 0
): Promise<{
  recommendedClub: Club;
  adjustedDistance: number;
  impact: WeatherImpact;
  elevationChange: number;
} | null> {
  // Get elevation change
  const { getElevationChangeFeet } = await import('./elevationService');
  const elevationChange = await getElevationChangeFeet(playerLocation, greenLocation) || 0;

  // Recommend club
  const recommendation = recommendClubForDistance(
    distanceToGreen,
    availableClubs,
    weather,
    elevationChange,
    shotDirection
  );

  if (!recommendation) return null;

  return {
    recommendedClub: recommendation.club,
    adjustedDistance: recommendation.adjustedDistance,
    impact: recommendation.impact,
    elevationChange,
  };
}

/**
 * Calculate shot difficulty based on conditions
 */
export function calculateShotDifficulty(
  weather: WeatherData,
  elevation: number,
  distance: number
): 'easy' | 'moderate' | 'difficult' | 'very-difficult' {
  let difficultyScore = 0;

  // Wind difficulty
  if (weather.windSpeed > 25) difficultyScore += 3;
  else if (weather.windSpeed > 15) difficultyScore += 2;
  else if (weather.windSpeed > 10) difficultyScore += 1;

  // Temperature difficulty
  if (weather.temperature < 40 || weather.temperature > 95) difficultyScore += 2;
  else if (weather.temperature < 50 || weather.temperature > 85) difficultyScore += 1;

  // Elevation difficulty
  const elevationFactor = Math.abs(elevation) / 30;
  if (elevationFactor > 2) difficultyScore += 2;
  else if (elevationFactor > 1) difficultyScore += 1;

  // Distance difficulty
  if (distance > 200) difficultyScore += 2;
  else if (distance > 150) difficultyScore += 1;

  // Weather conditions difficulty
  if (weather.conditions.toLowerCase().includes('rain')) difficultyScore += 2;
  if (weather.conditions.toLowerCase().includes('storm')) difficultyScore += 3;

  if (difficultyScore >= 7) return 'very-difficult';
  if (difficultyScore >= 4) return 'difficult';
  if (difficultyScore >= 2) return 'moderate';
  return 'easy';
}

/**
 * Get wind direction as compass text
 */
export function getWindDirectionText(degrees: number): string {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(((degrees % 360) / 22.5)) % 16;
  return directions[index];
}

/**
 * Get wind direction as arrow rotation
 */
export function getWindArrowRotation(degrees: number): number {
  return degrees % 360;
}
