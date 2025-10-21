'use client';

import { useState, useEffect } from 'react';
import { WeatherForecastDay, HourlyForecast, LocationCoordinates } from '@/types/weather';
import { getDailyForecast, getHourlyForecast } from '@/services/weatherService';
import { Cloud, Droplets, Wind } from 'lucide-react';

interface WeatherForecastProps {
  location: LocationCoordinates;
  days?: number;
  showHourly?: boolean;
  className?: string;
}

export function WeatherForecast({
  location,
  days = 7,
  showHourly = false,
  className = '',
}: WeatherForecastProps) {
  const [forecast, setForecast] = useState<WeatherForecastDay[]>([]);
  const [hourly, setHourly] = useState<HourlyForecast[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'daily' | 'hourly'>('daily');

  useEffect(() => {
    async function fetchForecast() {
      try {
        setLoading(true);
        setError(null);

        const dailyData = await getDailyForecast(location.latitude, location.longitude);
        setForecast(dailyData.slice(0, days));

        if (showHourly) {
          const hourlyData = await getHourlyForecast(location.latitude, location.longitude);
          setHourly(hourlyData);
        }
      } catch (err) {
        setError('Failed to load forecast');
        console.error('Forecast error:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchForecast();
  }, [location, days, showHourly]);

  const getWeatherIcon = (iconCode: string) => {
    if (iconCode.startsWith('01')) return '☀️';
    if (iconCode.startsWith('02')) return '⛅';
    if (iconCode.startsWith('03') || iconCode.startsWith('04')) return '☁️';
    if (iconCode.startsWith('09') || iconCode.startsWith('10')) return '🌧️';
    if (iconCode.startsWith('11')) return '⛈️';
    if (iconCode.startsWith('13')) return '❄️';
    if (iconCode.startsWith('50')) return '🌫️';
    return '🌤️';
  };

  const formatDay = (date: Date) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const formatHour = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
        <div className="text-center text-red-600">
          <Cloud className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-md ${className}`}>
      {/* Header with tabs */}
      {showHourly && (
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('daily')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'daily'
                ? 'text-green-600 border-b-2 border-green-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            7-Day Forecast
          </button>
          <button
            onClick={() => setActiveTab('hourly')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'hourly'
                ? 'text-green-600 border-b-2 border-green-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Hourly
          </button>
        </div>
      )}

      {/* Daily Forecast */}
      {activeTab === 'daily' && (
        <div className="p-4">
          <div className="space-y-3">
            {forecast.map((day, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1">
                  <span className="text-2xl">{getWeatherIcon(day.icon)}</span>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">
                      {formatDay(day.date)}
                    </div>
                    <div className="text-sm text-gray-600 capitalize">
                      {day.conditions}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <Droplets className="w-4 h-4" />
                    <span>{day.precipChance}%</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <Wind className="w-4 h-4" />
                    <span>{day.windSpeed} mph</span>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-900">
                      {day.tempHigh}°
                    </div>
                    <div className="text-sm text-gray-600">
                      {day.tempLow}°
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hourly Forecast */}
      {activeTab === 'hourly' && (
        <div className="p-4">
          <div className="overflow-x-auto">
            <div className="flex gap-4 pb-2">
              {hourly.map((hour, index) => (
                <div
                  key={index}
                  className="flex-shrink-0 w-24 text-center p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="text-sm font-semibold text-gray-900 mb-2">
                    {formatHour(hour.time)}
                  </div>
                  <div className="text-3xl mb-2">
                    {getWeatherIcon(hour.icon)}
                  </div>
                  <div className="text-lg font-bold text-gray-900 mb-2">
                    {hour.temperature}°
                  </div>
                  <div className="flex flex-col gap-1 text-xs text-gray-600">
                    <div className="flex items-center justify-center gap-1">
                      <Droplets className="w-3 h-3" />
                      <span>{hour.precipChance}%</span>
                    </div>
                    <div className="flex items-center justify-center gap-1">
                      <Wind className="w-3 h-3" />
                      <span>{hour.windSpeed}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
