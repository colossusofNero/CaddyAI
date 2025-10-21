'use client';

import { WeatherData } from '@/types/weather';
import { Cloud, Droplets, Wind, Thermometer, Gauge } from 'lucide-react';
import { getWindDirectionText } from '@/services/recommendationService';

interface WeatherCardProps {
  weather: WeatherData;
  showImpact?: boolean;
  impactYards?: number;
  className?: string;
}

export function WeatherCard({
  weather,
  showImpact = false,
  impactYards = 0,
  className = '',
}: WeatherCardProps) {
  const getWeatherIcon = (iconCode: string) => {
    // OpenWeatherMap icon codes: 01d, 02d, 03d, 04d, 09d, 10d, 11d, 13d, 50d
    if (iconCode.startsWith('01')) return '☀️';
    if (iconCode.startsWith('02')) return '⛅';
    if (iconCode.startsWith('03') || iconCode.startsWith('04')) return '☁️';
    if (iconCode.startsWith('09') || iconCode.startsWith('10')) return '🌧️';
    if (iconCode.startsWith('11')) return '⛈️';
    if (iconCode.startsWith('13')) return '❄️';
    if (iconCode.startsWith('50')) return '🌫️';
    return '🌤️';
  };

  return (
    <div className={`bg-white rounded-lg shadow-md p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-4xl">{getWeatherIcon(weather.icon)}</span>
          <div>
            <div className="text-3xl font-bold text-gray-900">
              {weather.temperature}°F
            </div>
            <div className="text-sm text-gray-600 capitalize">
              {weather.conditions}
            </div>
          </div>
        </div>
        {showImpact && impactYards !== 0 && (
          <div className="text-right">
            <div className={`text-xl font-bold ${impactYards > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {impactYards > 0 ? '+' : ''}{Math.round(impactYards)} yds
            </div>
            <div className="text-xs text-gray-600">Total impact</div>
          </div>
        )}
      </div>

      {/* Weather Details Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Feels Like */}
        <div className="flex items-center gap-2">
          <Thermometer className="w-4 h-4 text-gray-500" />
          <div>
            <div className="text-xs text-gray-600">Feels like</div>
            <div className="text-sm font-semibold text-gray-900">
              {weather.feelsLike}°F
            </div>
          </div>
        </div>

        {/* Wind */}
        <div className="flex items-center gap-2">
          <Wind className="w-4 h-4 text-gray-500" />
          <div>
            <div className="text-xs text-gray-600">Wind</div>
            <div className="text-sm font-semibold text-gray-900">
              {weather.windSpeed} mph {getWindDirectionText(weather.windDirection)}
            </div>
          </div>
        </div>

        {/* Humidity */}
        <div className="flex items-center gap-2">
          <Droplets className="w-4 h-4 text-gray-500" />
          <div>
            <div className="text-xs text-gray-600">Humidity</div>
            <div className="text-sm font-semibold text-gray-900">
              {weather.humidity}%
            </div>
          </div>
        </div>

        {/* Pressure */}
        <div className="flex items-center gap-2">
          <Gauge className="w-4 h-4 text-gray-500" />
          <div>
            <div className="text-xs text-gray-600">Pressure</div>
            <div className="text-sm font-semibold text-gray-900">
              {weather.pressure} hPa
            </div>
          </div>
        </div>
      </div>

      {/* Last Updated */}
      <div className="mt-3 pt-3 border-t border-gray-200">
        <div className="text-xs text-gray-500 text-center">
          Updated {new Date(weather.timestamp).toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
}
