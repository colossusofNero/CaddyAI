/**
 * Weather Service - OpenWeatherMap API integration with caching
 */

import {
  WeatherData,
  WeatherForecastDay,
  HourlyForecast,
  LocationCoordinates,
  WeatherAlert,
  WeatherCache,
  ForecastCache,
  WeatherAnalysis,
  BestTimeToPlay,
} from '@/types/weather';

// Cache duration: 15 minutes
const CACHE_DURATION = 15 * 60 * 1000;

// In-memory cache (in production, use Redis or Vercel Edge Config)
const weatherCache = new Map<string, WeatherCache>();
const forecastCache = new Map<string, ForecastCache>();

/**
 * Get current weather data for a location
 */
export async function getCurrentWeather(
  lat: number,
  lon: number
): Promise<WeatherData | null> {
  const cacheKey = `weather_${lat}_${lon}`;

  // Check cache
  const cached = weatherCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  try {
    const apiKey = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;
    if (!apiKey) {
      console.error('OpenWeatherMap API key not configured');
      return null;
    }

    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=imperial`
    );

    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`);
    }

    const data = await response.json();

    const weatherData: WeatherData = {
      temperature: Math.round(data.main.temp),
      feelsLike: Math.round(data.main.feels_like),
      humidity: data.main.humidity,
      windSpeed: Math.round(data.wind.speed),
      windDirection: data.wind.deg,
      pressure: data.main.pressure,
      conditions: data.weather[0].description,
      icon: data.weather[0].icon,
      timestamp: new Date(data.dt * 1000),
    };

    // Cache the result
    weatherCache.set(cacheKey, {
      data: weatherData,
      expiresAt: Date.now() + CACHE_DURATION,
    });

    return weatherData;
  } catch (error) {
    console.error('Error fetching weather data:', error);
    return null;
  }
}

/**
 * Get 7-day weather forecast
 */
export async function getDailyForecast(
  lat: number,
  lon: number
): Promise<WeatherForecastDay[]> {
  const cacheKey = `forecast_${lat}_${lon}`;

  // Check cache
  const cached = forecastCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.daily;
  }

  try {
    const apiKey = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;
    if (!apiKey) {
      console.error('OpenWeatherMap API key not configured');
      return [];
    }

    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast/daily?lat=${lat}&lon=${lon}&cnt=7&appid=${apiKey}&units=imperial`
    );

    if (!response.ok) {
      throw new Error(`Forecast API error: ${response.status}`);
    }

    const data = await response.json();

    const forecast: WeatherForecastDay[] = data.list.map((day: any) => ({
      date: new Date(day.dt * 1000),
      tempHigh: Math.round(day.temp.max),
      tempLow: Math.round(day.temp.min),
      conditions: day.weather[0].description,
      icon: day.weather[0].icon,
      windSpeed: Math.round(day.speed),
      windDirection: day.deg,
      humidity: day.humidity,
      precipChance: Math.round((day.pop || 0) * 100),
    }));

    // Cache the result
    const hourlyData = await getHourlyForecast(lat, lon);
    forecastCache.set(cacheKey, {
      daily: forecast,
      hourly: hourlyData,
      expiresAt: Date.now() + CACHE_DURATION,
    });

    return forecast;
  } catch (error) {
    console.error('Error fetching forecast data:', error);
    return [];
  }
}

/**
 * Get hourly weather forecast (next 48 hours)
 */
export async function getHourlyForecast(
  lat: number,
  lon: number
): Promise<HourlyForecast[]> {
  try {
    const apiKey = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;
    if (!apiKey) {
      console.error('OpenWeatherMap API key not configured');
      return [];
    }

    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=imperial`
    );

    if (!response.ok) {
      throw new Error(`Hourly forecast API error: ${response.status}`);
    }

    const data = await response.json();

    const hourlyForecast: HourlyForecast[] = data.list.slice(0, 16).map((hour: any) => ({
      time: new Date(hour.dt * 1000),
      temperature: Math.round(hour.main.temp),
      feelsLike: Math.round(hour.main.feels_like),
      windSpeed: Math.round(hour.wind.speed),
      windDirection: hour.wind.deg,
      humidity: hour.main.humidity,
      conditions: hour.weather[0].description,
      icon: hour.weather[0].icon,
      precipChance: Math.round((hour.pop || 0) * 100),
    }));

    return hourlyForecast;
  } catch (error) {
    console.error('Error fetching hourly forecast:', error);
    return [];
  }
}

/**
 * Get weather alerts for a location
 */
export async function getWeatherAlerts(
  lat: number,
  lon: number
): Promise<WeatherAlert[]> {
  try {
    const apiKey = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;
    if (!apiKey) {
      return [];
    }

    // Use One Call API 3.0 for alerts (requires subscription)
    const response = await fetch(
      `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&appid=${apiKey}&units=imperial`
    );

    if (!response.ok) {
      // Alerts require a paid plan, return empty array if not available
      return [];
    }

    const data = await response.json();

    if (!data.alerts || data.alerts.length === 0) {
      return [];
    }

    const alerts: WeatherAlert[] = data.alerts.map((alert: any) => ({
      event: alert.event,
      severity: mapSeverity(alert.tags?.[0] || 'moderate'),
      description: alert.description,
      start: new Date(alert.start * 1000),
      end: new Date(alert.end * 1000),
    }));

    return alerts;
  } catch (error) {
    console.error('Error fetching weather alerts:', error);
    return [];
  }
}

/**
 * Analyze weather conditions and determine best times to play
 */
export async function analyzeWeatherConditions(
  lat: number,
  lon: number
): Promise<WeatherAnalysis | null> {
  try {
    const [current, hourly, alerts] = await Promise.all([
      getCurrentWeather(lat, lon),
      getHourlyForecast(lat, lon),
      getWeatherAlerts(lat, lon),
    ]);

    if (!current) {
      return null;
    }

    // Calculate best times to play based on hourly forecast
    const bestTimes = calculateBestTimesToPlay(hourly);

    // Determine 7-day outlook
    const daily = await getDailyForecast(lat, lon);
    const outlook = calculate7DayOutlook(daily);

    return {
      currentConditions: current,
      bestTimesToPlay: bestTimes,
      alerts,
      sevenDayOutlook: outlook,
    };
  } catch (error) {
    console.error('Error analyzing weather conditions:', error);
    return null;
  }
}

/**
 * Calculate best times to play based on weather conditions
 */
function calculateBestTimesToPlay(hourly: HourlyForecast[]): BestTimeToPlay[] {
  const scoredHours = hourly.map((hour) => {
    let score = 100;
    const reasons: string[] = [];

    // Temperature scoring (ideal: 65-75°F)
    if (hour.temperature < 50) {
      score -= 30;
      reasons.push('Cold');
    } else if (hour.temperature < 60) {
      score -= 15;
      reasons.push('Cool');
    } else if (hour.temperature > 90) {
      score -= 30;
      reasons.push('Very hot');
    } else if (hour.temperature > 80) {
      score -= 15;
      reasons.push('Hot');
    }

    // Wind scoring
    if (hour.windSpeed > 25) {
      score -= 40;
      reasons.push('Very windy');
    } else if (hour.windSpeed > 15) {
      score -= 20;
      reasons.push('Windy');
    } else if (hour.windSpeed > 10) {
      score -= 10;
      reasons.push('Breezy');
    }

    // Precipitation scoring
    if (hour.precipChance > 70) {
      score -= 50;
      reasons.push('High rain chance');
    } else if (hour.precipChance > 40) {
      score -= 25;
      reasons.push('Rain possible');
    }

    // Conditions scoring
    if (hour.conditions.toLowerCase().includes('rain')) {
      score -= 40;
    } else if (hour.conditions.toLowerCase().includes('storm')) {
      score -= 60;
    }

    return {
      hour: hour.time.getHours(),
      score: Math.max(0, score),
      reasoning: reasons.length > 0 ? reasons.join(', ') : 'Ideal conditions',
    };
  });

  // Return top 3 times
  return scoredHours
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

/**
 * Calculate 7-day outlook quality
 */
function calculate7DayOutlook(
  daily: WeatherForecastDay[]
): 'excellent' | 'good' | 'fair' | 'poor' {
  if (daily.length === 0) return 'fair';

  let totalScore = 0;

  for (const day of daily) {
    let dayScore = 100;

    // Temperature
    const avgTemp = (day.tempHigh + day.tempLow) / 2;
    if (avgTemp < 50 || avgTemp > 90) dayScore -= 30;
    else if (avgTemp < 60 || avgTemp > 80) dayScore -= 15;

    // Wind
    if (day.windSpeed > 20) dayScore -= 30;
    else if (day.windSpeed > 15) dayScore -= 15;

    // Precipitation
    if (day.precipChance > 70) dayScore -= 40;
    else if (day.precipChance > 40) dayScore -= 20;

    totalScore += dayScore;
  }

  const avgScore = totalScore / daily.length;

  if (avgScore >= 80) return 'excellent';
  if (avgScore >= 60) return 'good';
  if (avgScore >= 40) return 'fair';
  return 'poor';
}

/**
 * Map alert severity
 */
function mapSeverity(tag: string): 'minor' | 'moderate' | 'severe' | 'extreme' {
  const tagLower = tag.toLowerCase();
  if (tagLower.includes('extreme')) return 'extreme';
  if (tagLower.includes('severe')) return 'severe';
  if (tagLower.includes('moderate')) return 'moderate';
  return 'minor';
}

/**
 * Clear weather cache (useful for manual refresh)
 */
export function clearWeatherCache() {
  weatherCache.clear();
  forecastCache.clear();
}

/**
 * Get cache statistics (for debugging)
 */
export function getCacheStats() {
  return {
    weatherCacheSize: weatherCache.size,
    forecastCacheSize: forecastCache.size,
  };
}
