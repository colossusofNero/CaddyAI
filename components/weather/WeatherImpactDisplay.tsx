'use client';

import { WeatherImpact } from '@/types/weather';
import { TrendingUp, TrendingDown, Wind, Thermometer, Droplets, Mountain } from 'lucide-react';

interface WeatherImpactDisplayProps {
  impact: WeatherImpact;
  baseDistance?: number;
  className?: string;
}

export function WeatherImpactDisplay({
  impact,
  baseDistance,
  className = '',
}: WeatherImpactDisplayProps) {
  const formatImpact = (yards: number) => {
    if (yards === 0) return '0';
    return yards > 0 ? `+${yards}` : `${yards}`;
  };

  const getImpactColor = (yards: number) => {
    if (yards === 0) return 'text-gray-600';
    return yards > 0 ? 'text-green-600' : 'text-red-600';
  };

  const totalColor = impact.totalAdjustment >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200';

  return (
    <div className={`bg-white rounded-lg shadow-md p-4 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Weather Impact</h3>

      {/* Base Distance */}
      {baseDistance && (
        <div className="mb-4 pb-4 border-b border-gray-200">
          <div className="text-sm text-gray-600">Base Distance</div>
          <div className="text-2xl font-bold text-gray-900">{baseDistance} yards</div>
        </div>
      )}

      {/* Impact Breakdown */}
      <div className="space-y-3 mb-4">
        {/* Wind Impact */}
        {impact.windImpactYards !== 0 && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wind className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-700">Wind</span>
            </div>
            <span className={`text-sm font-semibold ${getImpactColor(impact.windImpactYards)}`}>
              {formatImpact(impact.windImpactYards)} yds
            </span>
          </div>
        )}

        {/* Temperature Impact */}
        {impact.temperatureImpactYards !== 0 && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Thermometer className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-700">Temperature</span>
            </div>
            <span className={`text-sm font-semibold ${getImpactColor(impact.temperatureImpactYards)}`}>
              {formatImpact(impact.temperatureImpactYards)} yds
            </span>
          </div>
        )}

        {/* Humidity Impact */}
        {impact.humidityImpactYards !== 0 && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Droplets className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-700">Humidity</span>
            </div>
            <span className={`text-sm font-semibold ${getImpactColor(impact.humidityImpactYards)}`}>
              {formatImpact(impact.humidityImpactYards)} yds
            </span>
          </div>
        )}

        {/* Elevation Impact */}
        {impact.elevationImpactYards !== 0 && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mountain className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-700">Elevation</span>
            </div>
            <span className={`text-sm font-semibold ${getImpactColor(impact.elevationImpactYards)}`}>
              {formatImpact(impact.elevationImpactYards)} yds
            </span>
          </div>
        )}
      </div>

      {/* Total Adjustment */}
      <div className={`p-3 rounded-lg border-2 ${totalColor}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {impact.totalAdjustment >= 0 ? (
              <TrendingUp className="w-5 h-5 text-green-600" />
            ) : (
              <TrendingDown className="w-5 h-5 text-red-600" />
            )}
            <span className="font-semibold text-gray-900">Total Adjustment</span>
          </div>
          <span className={`text-xl font-bold ${getImpactColor(impact.totalAdjustment)}`}>
            {formatImpact(Math.round(impact.totalAdjustment))} yds
          </span>
        </div>
        {baseDistance && (
          <div className="mt-2 text-sm text-gray-700">
            Adjusted distance: <span className="font-bold">{Math.round(baseDistance + impact.totalAdjustment)} yards</span>
          </div>
        )}
      </div>

      {/* Recommendations */}
      {impact.recommendations.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h4 className="text-sm font-semibold text-gray-900 mb-2">Recommendations</h4>
          <ul className="space-y-1">
            {impact.recommendations.map((rec, index) => (
              <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                <span className="text-green-600 mt-0.5">•</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
