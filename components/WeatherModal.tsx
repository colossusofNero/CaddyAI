'use client';

import { X, Wind, Droplets, Thermometer, Eye, Compass, CloudRain } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface WeatherModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WeatherModal({ isOpen, onClose }: WeatherModalProps) {
  if (!isOpen) return null;

  const currentWeather = {
    temp: 72,
    feelsLike: 70,
    condition: 'Partly Cloudy',
    windSpeed: 12,
    windDirection: 'WSW',
    windDirectionDeg: 245,
    humidity: 58,
    visibility: 10,
    pressure: 30.12,
    uvIndex: 6,
  };

  const hourlyForecast = [
    { time: '2:00 PM', temp: 72, wind: 12, condition: 'Partly Cloudy' },
    { time: '3:00 PM', temp: 73, wind: 14, condition: 'Partly Cloudy' },
    { time: '4:00 PM', temp: 74, wind: 15, condition: 'Mostly Sunny' },
    { time: '5:00 PM', temp: 72, wind: 13, condition: 'Partly Cloudy' },
    { time: '6:00 PM', temp: 70, wind: 10, condition: 'Cloudy' },
  ];

  const clubAdjustments = [
    { club: 'Driver', adjustment: '+8 yards', reason: 'Slight tailwind' },
    { club: '7-Iron', adjustment: '-5 yards', reason: 'Headwind component' },
    { club: 'Wedges', adjustment: '+2 yards', reason: 'Light tailwind' },
  ];

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative z-10 bg-white border-2 border-primary rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto p-8 animate-scale-in">
        {/* Close Button */}
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-900" aria-label="Close modal">
          <X className="w-6 h-6" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-primary bg-opacity-20 rounded-full flex items-center justify-center">
            <Wind className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Real-Time Weather Integration</h2>
            <p className="text-gray-600">Live weather data for accurate club adjustments</p>
          </div>
        </div>

        {/* Current Conditions */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 mb-6 border border-blue-200">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-blue-900 mb-1">Current Conditions</h3>
              <p className="text-sm text-blue-700">Pebble Beach Golf Links · Updated 2 min ago</p>
            </div>
            <div className="text-right">
              <div className="text-5xl font-bold text-blue-900">{currentWeather.temp}°F</div>
              <div className="text-sm text-blue-700">Feels like {currentWeather.feelsLike}°F</div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Wind className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-medium text-blue-900">Wind</span>
              </div>
              <p className="text-lg font-bold text-blue-900">{currentWeather.windSpeed} mph</p>
              <p className="text-xs text-blue-700">{currentWeather.windDirection}</p>
            </div>

            <div className="bg-white/50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Droplets className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-medium text-blue-900">Humidity</span>
              </div>
              <p className="text-lg font-bold text-blue-900">{currentWeather.humidity}%</p>
              <p className="text-xs text-blue-700">Comfortable</p>
            </div>

            <div className="bg-white/50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Eye className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-medium text-blue-900">Visibility</span>
              </div>
              <p className="text-lg font-bold text-blue-900">{currentWeather.visibility} mi</p>
              <p className="text-xs text-blue-700">Excellent</p>
            </div>

            <div className="bg-white/50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Compass className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-medium text-blue-900">Pressure</span>
              </div>
              <p className="text-lg font-bold text-blue-900">{currentWeather.pressure}</p>
              <p className="text-xs text-blue-700">Rising</p>
            </div>
          </div>
        </div>

        {/* Wind Compass */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Wind Direction</h3>
            <div className="relative w-48 h-48 mx-auto">
              <div className="absolute inset-0 rounded-full border-4 border-gray-300 flex items-center justify-center">
                <div className="absolute inset-0 flex items-center justify-center">
                  <Wind
                    className="w-16 h-16 text-primary"
                    style={{ transform: `rotate(${currentWeather.windDirectionDeg}deg)` }}
                  />
                </div>
                <div className="absolute top-2 left-1/2 -translate-x-1/2 text-xs font-bold text-gray-600">N</div>
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs font-bold text-gray-600">S</div>
                <div className="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-600">W</div>
                <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-600">E</div>
              </div>
            </div>
            <p className="text-center mt-4 text-sm text-gray-600">
              <span className="font-bold text-primary">{currentWeather.windSpeed} mph</span> from the {currentWeather.windDirection}
            </p>
          </div>

          <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Club Adjustments</h3>
            <div className="space-y-3">
              {clubAdjustments.map((adj) => (
                <div key={adj.club} className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-gray-900">{adj.club}</span>
                    <span className={`font-bold ${adj.adjustment.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                      {adj.adjustment}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600">{adj.reason}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-900">
                <strong>Note:</strong> Adjustments are calculated based on wind speed, direction, and your shot trajectory.
              </p>
            </div>
          </div>
        </div>

        {/* Hourly Forecast */}
        <div className="mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Hourly Forecast</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {hourlyForecast.map((hour) => (
              <div key={hour.time} className="bg-gray-50 rounded-lg p-4 border border-gray-200 text-center">
                <p className="text-sm font-medium text-gray-900 mb-2">{hour.time}</p>
                <p className="text-2xl font-bold text-primary mb-1">{hour.temp}°</p>
                <div className="flex items-center justify-center gap-1 text-xs text-gray-600 mb-1">
                  <Wind className="w-3 h-3" />
                  <span>{hour.wind} mph</span>
                </div>
                <p className="text-xs text-gray-600">{hour.condition}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-900">
            <strong className="font-semibold">Perfect conditions:</strong> Low wind and excellent visibility make this an ideal time to play.
            CaddyAI will automatically adjust all distance recommendations based on current conditions.
          </p>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button variant="primary">View 7-Day Forecast</Button>
        </div>
      </div>

      <style jsx global>{`
        @keyframes scale-in {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
