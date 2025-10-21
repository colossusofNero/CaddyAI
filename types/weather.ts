/**
 * Weather data types and interfaces for CaddyAI weather integration
 */

export interface WeatherData {
  temperature: number; // Fahrenheit
  feelsLike: number; // Fahrenheit
  humidity: number; // Percentage (0-100)
  windSpeed: number; // mph
  windDirection: number; // Degrees (0-360, 0=North, 90=East, 180=South, 270=West)
  pressure: number; // hPa
  conditions: string; // Description (e.g., "Clear sky", "Light rain")
  icon: string; // Weather icon code
  timestamp: Date;
}

export interface WeatherForecastDay {
  date: Date;
  tempHigh: number;
  tempLow: number;
  conditions: string;
  icon: string;
  windSpeed: number;
  windDirection: number;
  humidity: number;
  precipChance: number; // Percentage (0-100)
}

export interface HourlyForecast {
  time: Date;
  temperature: number;
  feelsLike: number;
  windSpeed: number;
  windDirection: number;
  humidity: number;
  conditions: string;
  icon: string;
  precipChance: number;
}

export interface WeatherImpact {
  windImpactYards: number; // Positive = helps, negative = hurts
  temperatureImpactYards: number;
  humidityImpactYards: number;
  elevationImpactYards: number;
  totalAdjustment: number;
  recommendations: string[]; // e.g., ["Use one club more", "Account for 10 yard headwind"]
}

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
}

export interface ElevationData {
  elevation: number; // meters
  location: LocationCoordinates;
}

export interface WeatherAlert {
  event: string; // e.g., "Thunderstorm Warning"
  severity: 'minor' | 'moderate' | 'severe' | 'extreme';
  description: string;
  start: Date;
  end: Date;
}

export interface WeatherCache {
  data: WeatherData;
  expiresAt: number; // Timestamp
}

export interface ForecastCache {
  daily: WeatherForecastDay[];
  hourly: HourlyForecast[];
  expiresAt: number;
}

// Weather condition codes mapping for icons
export type WeatherCondition =
  | 'clear'
  | 'partly-cloudy'
  | 'cloudy'
  | 'rain'
  | 'snow'
  | 'thunderstorm'
  | 'fog'
  | 'wind';

// Best time to play indicator
export interface BestTimeToPlay {
  hour: number; // 0-23
  score: number; // 0-100, higher is better
  reasoning: string;
}

export interface WeatherAnalysis {
  currentConditions: WeatherData;
  bestTimesToPlay: BestTimeToPlay[];
  alerts: WeatherAlert[];
  sevenDayOutlook: 'excellent' | 'good' | 'fair' | 'poor';
}
