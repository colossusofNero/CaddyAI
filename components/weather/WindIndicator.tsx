'use client';

import { ArrowUp } from 'lucide-react';
import { getWindDirectionText, getWindArrowRotation } from '@/services/recommendationService';

interface WindIndicatorProps {
  speed: number; // mph
  direction: number; // degrees (0=North)
  impactYards?: number;
  shotDirection?: number; // degrees (0=North)
  className?: string;
}

export function WindIndicator({
  speed,
  direction,
  impactYards,
  shotDirection,
  className = '',
}: WindIndicatorProps) {
  const rotation = getWindArrowRotation(direction);
  const directionText = getWindDirectionText(direction);

  // Determine wind strength category
  const getWindStrength = (speed: number) => {
    if (speed < 5) return { label: 'Calm', color: 'text-green-600' };
    if (speed < 10) return { label: 'Light', color: 'text-green-500' };
    if (speed < 15) return { label: 'Moderate', color: 'text-yellow-500' };
    if (speed < 20) return { label: 'Fresh', color: 'text-orange-500' };
    if (speed < 25) return { label: 'Strong', color: 'text-red-500' };
    return { label: 'Very Strong', color: 'text-red-700' };
  };

  const windStrength = getWindStrength(speed);

  // Calculate relative wind if shot direction provided
  let relativeWind = null;
  if (shotDirection !== undefined) {
    let relativeAngle = direction - shotDirection;
    while (relativeAngle > 180) relativeAngle -= 360;
    while (relativeAngle < -180) relativeAngle += 360;

    if (Math.abs(relativeAngle) < 45) {
      relativeWind = { type: 'Headwind', color: 'text-red-600' };
    } else if (Math.abs(relativeAngle) > 135) {
      relativeWind = { type: 'Tailwind', color: 'text-green-600' };
    } else {
      relativeWind = { type: 'Crosswind', color: 'text-yellow-600' };
    }
  }

  return (
    <div className={`bg-white rounded-lg shadow-md p-4 ${className}`}>
      <div className="flex items-center gap-4">
        {/* Wind Arrow */}
        <div className="relative w-16 h-16 flex items-center justify-center">
          {/* Compass circle */}
          <div className="absolute inset-0 rounded-full border-2 border-gray-300" />

          {/* Direction labels */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 text-xs font-semibold text-gray-600">
            N
          </div>
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 text-xs font-semibold text-gray-600">
            S
          </div>
          <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 text-xs font-semibold text-gray-600">
            W
          </div>
          <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 text-xs font-semibold text-gray-600">
            E
          </div>

          {/* Wind arrow */}
          <ArrowUp
            className={`w-8 h-8 ${windStrength.color} transition-transform duration-500`}
            style={{ transform: `rotate(${rotation}deg)` }}
            strokeWidth={2.5}
          />

          {/* Shot direction indicator (if provided) */}
          {shotDirection !== undefined && (
            <div
              className="absolute w-1 h-6 bg-blue-500 rounded"
              style={{
                transform: `rotate(${shotDirection}deg)`,
                transformOrigin: 'center 50%',
              }}
            />
          )}
        </div>

        {/* Wind Information */}
        <div className="flex-1">
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-2xl font-bold text-gray-900">{speed}</span>
            <span className="text-sm text-gray-600">mph</span>
            <span className="text-sm font-semibold text-gray-700">{directionText}</span>
          </div>

          <div className={`text-sm font-medium ${windStrength.color} mb-2`}>
            {windStrength.label}
          </div>

          {relativeWind && (
            <div className={`text-sm font-medium ${relativeWind.color}`}>
              {relativeWind.type}
            </div>
          )}

          {impactYards !== undefined && impactYards !== 0 && (
            <div className="mt-2 pt-2 border-t border-gray-200">
              <div className={`text-lg font-bold ${impactYards > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {impactYards > 0 ? '+' : ''}{Math.round(impactYards)} yards
              </div>
              <div className="text-xs text-gray-600">Wind impact</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
