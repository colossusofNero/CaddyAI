/**
 * Weather Integration Demo Page
 * Demonstrates all weather features and components
 */

'use client';

import { useState } from 'react';
import { useWeather } from '@/hooks/useWeather';
import {
  WeatherCard,
  WindIndicator,
  WeatherForecast,
  WeatherImpactDisplay,
} from '@/components/weather';
import { calculateWeatherImpact } from '@/services/recommendationService';
import { getElevationFeet } from '@/services/elevationService';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { RefreshCw, MapPin } from 'lucide-react';

// Demo locations
const DEMO_LOCATIONS = [
  { name: 'Pebble Beach, CA', lat: 36.5674, lon: -121.9500 },
  { name: 'Augusta National, GA', lat: 33.5020, lon: -82.0198 },
  { name: 'St Andrews, Scotland', lat: 56.3398, lon: -2.7967 },
  { name: 'Phoenix, AZ (Hot/Dry)', lat: 33.4484, lon: -112.0740 },
  { name: 'Seattle, WA (Cool/Wet)', lat: 47.6062, lon: -122.3321 },
  { name: 'Denver, CO (High Elevation)', lat: 39.7392, lon: -104.9903 },
];

export default function WeatherDemoPage() {
  const [selectedLocation, setSelectedLocation] = useState(DEMO_LOCATIONS[0]);
  const [baseDistance, setBaseDistance] = useState(150);
  const [shotDirection, setShotDirection] = useState(0);
  const [elevation, setElevation] = useState<number | null>(null);

  const { weather, loading, error, refresh, lastUpdated } = useWeather({
    location: { latitude: selectedLocation.lat, longitude: selectedLocation.lon },
    refreshInterval: 15 * 60 * 1000,
    autoRefresh: false, // Manual refresh for demo
  });

  // Fetch elevation for selected location
  const fetchElevation = async () => {
    const elev = await getElevationFeet(selectedLocation.lat, selectedLocation.lon);
    setElevation(elev);
  };

  // Calculate weather impact
  const impact = weather
    ? calculateWeatherImpact(baseDistance, weather, 0, shotDirection)
    : null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold mb-2">Weather Integration Demo</h1>
          <p className="text-green-100">
            Explore CaddyAI's weather and elevation features
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Location Selector */}
        <Card className="mb-8 p-6">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-bold text-text-primary">Select Location</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {DEMO_LOCATIONS.map((location) => (
              <button
                key={location.name}
                onClick={() => setSelectedLocation(location)}
                className={`p-3 rounded-lg border-2 transition-all text-left ${
                  selectedLocation.name === location.name
                    ? 'border-primary bg-primary bg-opacity-10 text-text-primary'
                    : 'border-secondary-700 bg-secondary-800 text-text-secondary hover:border-secondary-600'
                }`}
              >
                <div className="font-semibold text-sm">{location.name}</div>
                <div className="text-xs opacity-75">
                  {location.lat.toFixed(4)}, {location.lon.toFixed(4)}
                </div>
              </button>
            ))}
          </div>
          <div className="mt-4 flex gap-3">
            <Button onClick={refresh} size="sm" variant="primary">
              <RefreshCw className="w-4 h-4 mr-2" />
              Fetch Weather
            </Button>
            <Button onClick={fetchElevation} size="sm" variant="outline">
              Get Elevation
            </Button>
          </div>
          {lastUpdated && (
            <div className="mt-3 text-sm text-text-secondary">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </div>
          )}
          {elevation !== null && (
            <div className="mt-2 text-sm text-text-secondary">
              Elevation: <span className="font-bold">{elevation} feet</span>
            </div>
          )}
        </Card>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
            <p className="text-red-800 font-semibold">Error: {error}</p>
            <p className="text-red-600 text-sm mt-1">
              Make sure you have added NEXT_PUBLIC_OPENWEATHER_API_KEY to your .env.local file
            </p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        )}

        {/* Weather Display */}
        {weather && !loading && (
          <>
            {/* Current Conditions */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <WeatherCard weather={weather} showImpact={true} impactYards={impact?.totalAdjustment || 0} />
              <WindIndicator
                speed={weather.windSpeed}
                direction={weather.windDirection}
                impactYards={impact?.windImpactYards}
                shotDirection={shotDirection}
              />
            </div>

            {/* Shot Calculator */}
            <Card className="mb-8 p-6">
              <h2 className="text-xl font-bold text-text-primary mb-4">
                Shot Distance Calculator
              </h2>
              <div className="grid md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Base Distance (yards)
                  </label>
                  <input
                    type="number"
                    value={baseDistance}
                    onChange={(e) => setBaseDistance(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-secondary-800 border border-secondary-700 rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Shot Direction (degrees, 0=North)
                  </label>
                  <input
                    type="number"
                    value={shotDirection}
                    onChange={(e) => setShotDirection(Number(e.target.value))}
                    min="0"
                    max="360"
                    className="w-full px-3 py-2 bg-secondary-800 border border-secondary-700 rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Adjusted Distance
                  </label>
                  <div className="w-full px-3 py-2 bg-primary bg-opacity-10 border border-primary rounded-lg">
                    <span className="text-2xl font-bold text-primary">
                      {Math.round(baseDistance + (impact?.totalAdjustment || 0))} yds
                    </span>
                  </div>
                </div>
              </div>

              {impact && <WeatherImpactDisplay impact={impact} baseDistance={baseDistance} />}
            </Card>

            {/* Weather Forecast */}
            <Card className="mb-8 p-6">
              <h2 className="text-xl font-bold text-text-primary mb-4">Weather Forecast</h2>
              <WeatherForecast
                location={{ latitude: selectedLocation.lat, longitude: selectedLocation.lon }}
                days={7}
                showHourly={true}
              />
            </Card>

            {/* API Information */}
            <Card className="p-6 bg-secondary-800 border border-secondary-700">
              <h3 className="text-lg font-bold text-text-primary mb-3">
                API Information
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-text-secondary">Data Source:</span>
                  <span className="text-text-primary font-semibold">OpenWeatherMap API</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Cache Duration:</span>
                  <span className="text-text-primary font-semibold">15 minutes</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Elevation Source:</span>
                  <span className="text-text-primary font-semibold">Open-Elevation API</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Free Tier Limit:</span>
                  <span className="text-text-primary font-semibold">1,000 calls/day</span>
                </div>
              </div>
            </Card>

            {/* Setup Instructions */}
            <Card className="mt-6 p-6 bg-blue-50 border border-blue-200">
              <h3 className="text-lg font-bold text-blue-900 mb-3">
                Setup Instructions
              </h3>
              <ol className="space-y-2 text-sm text-blue-800">
                <li>1. Get a free API key from <a href="https://openweathermap.org/api" target="_blank" rel="noopener noreferrer" className="underline font-semibold">OpenWeatherMap</a></li>
                <li>2. Add to <code className="bg-blue-100 px-2 py-1 rounded">.env.local</code>: <code className="bg-blue-100 px-2 py-1 rounded">NEXT_PUBLIC_OPENWEATHER_API_KEY=your_key</code></li>
                <li>3. Restart your development server</li>
                <li>4. See <code className="bg-blue-100 px-2 py-1 rounded">WEATHER_INTEGRATION.md</code> for complete documentation</li>
              </ol>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
