'use client';

import { useState, useEffect, useCallback } from 'react';
import { WeatherData, LocationCoordinates } from '@/types/weather';
import { getCurrentWeather, clearWeatherCache } from '@/services/weatherService';

interface UseWeatherOptions {
  location: LocationCoordinates | null;
  refreshInterval?: number; // milliseconds, default 15 minutes
  autoRefresh?: boolean;
}

interface UseWeatherReturn {
  weather: WeatherData | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  lastUpdated: Date | null;
}

export function useWeather({
  location,
  refreshInterval = 15 * 60 * 1000, // 15 minutes
  autoRefresh = true,
}: UseWeatherOptions): UseWeatherReturn {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchWeather = useCallback(async () => {
    if (!location) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const data = await getCurrentWeather(location.latitude, location.longitude);

      if (data) {
        setWeather(data);
        setLastUpdated(new Date());
      } else {
        setError('Failed to fetch weather data');
      }
    } catch (err) {
      setError('Error fetching weather');
      console.error('Weather fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [location]);

  const refresh = useCallback(async () => {
    if (!location) return;

    // Clear cache to force fresh data
    clearWeatherCache();
    await fetchWeather();
  }, [location, fetchWeather]);

  // Initial fetch
  useEffect(() => {
    fetchWeather();
  }, [fetchWeather]);

  // Auto-refresh interval
  useEffect(() => {
    if (!autoRefresh || !location) return;

    const interval = setInterval(() => {
      fetchWeather();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, location, refreshInterval, fetchWeather]);

  return {
    weather,
    loading,
    error,
    refresh,
    lastUpdated,
  };
}
