'use client';

import { X, Mountain, TrendingUp, TrendingDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ElevationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ElevationModal({ isOpen, onClose }: ElevationModalProps) {
  if (!isOpen) return null;

  const currentShot = {
    distance: 165,
    elevation: 22,
    type: 'uphill',
    adjustedDistance: 183,
    recommendedClub: '7-Iron',
    confidence: 94,
  };

  const elevationScenarios = [
    {
      type: 'Severe Uphill',
      elevation: '+45 ft',
      distance: 150,
      adjusted: 172,
      club: '7-Iron → 6-Iron',
      icon: ArrowUp,
      color: 'red',
    },
    {
      type: 'Moderate Uphill',
      elevation: '+20 ft',
      distance: 150,
      adjusted: 162,
      club: '7-Iron',
      icon: TrendingUp,
      color: 'orange',
    },
    {
      type: 'Level',
      elevation: '±0 ft',
      distance: 150,
      adjusted: 150,
      club: '7-Iron',
      icon: Mountain,
      color: 'green',
    },
    {
      type: 'Moderate Downhill',
      elevation: '-20 ft',
      distance: 150,
      adjusted: 138,
      club: '8-Iron',
      icon: TrendingDown,
      color: 'blue',
    },
    {
      type: 'Severe Downhill',
      elevation: '-45 ft',
      distance: 150,
      adjusted: 128,
      club: '8-Iron → 9-Iron',
      icon: ArrowDown,
      color: 'purple',
    },
  ];

  const recentHoles = [
    { hole: 5, distance: 185, elevation: +32, adjusted: 207, result: 'Pin High' },
    { hole: 8, distance: 142, elevation: -18, adjusted: 131, result: 'Green' },
    { hole: 12, distance: 168, elevation: +15, adjusted: 178, result: 'Green' },
    { hole: 14, distance: 195, elevation: -25, adjusted: 178, result: 'Pin High' },
  ];

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative z-10 bg-white border-2 border-primary rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto p-8 animate-scale-in">
        {/* Close Button */}
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-900" aria-label="Close modal">
          <X className="w-6 h-6" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-primary bg-opacity-20 rounded-full flex items-center justify-center">
            <Mountain className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Elevation Adjustments</h2>
            <p className="text-gray-600">Precise calculations for uphill and downhill shots</p>
          </div>
        </div>

        {/* Current Shot */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 mb-6 border-2 border-green-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-green-900 mb-1">Current Shot Analysis</h3>
              <p className="text-sm text-green-700">Hole 7 - Par 3</p>
            </div>
            <div className="px-4 py-2 bg-green-900 text-white rounded-full text-sm font-bold">
              {currentShot.confidence}% Confidence
            </div>
          </div>

          <div className="grid md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-4">
              <p className="text-xs text-gray-600 mb-1">Actual Distance</p>
              <p className="text-3xl font-bold text-gray-900">{currentShot.distance}</p>
              <p className="text-xs text-gray-600">yards</p>
            </div>

            <div className="bg-white rounded-xl p-4">
              <p className="text-xs text-gray-600 mb-1">Elevation Change</p>
              <p className="text-3xl font-bold text-orange-600">+{currentShot.elevation}</p>
              <p className="text-xs text-gray-600">feet</p>
            </div>

            <div className="bg-white rounded-xl p-4">
              <p className="text-xs text-gray-600 mb-1">Play As</p>
              <p className="text-3xl font-bold text-primary">{currentShot.adjustedDistance}</p>
              <p className="text-xs text-gray-600">yards</p>
            </div>

            <div className="bg-white rounded-xl p-4">
              <p className="text-xs text-gray-600 mb-1">Recommended</p>
              <p className="text-xl font-bold text-green-900">{currentShot.recommendedClub}</p>
              <p className="text-xs text-green-700 mt-1">+18 yards</p>
            </div>
          </div>

          <div className="mt-4 p-4 bg-white/50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-green-700" />
              <span className="font-bold text-green-900">Uphill Shot</span>
            </div>
            <p className="text-sm text-green-800">
              The ball will travel approximately <strong>11% further</strong> due to the elevation gain.
              Factor in reduced roll and adjust club selection accordingly.
            </p>
          </div>
        </div>

        {/* Elevation Scenarios */}
        <div className="mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Elevation Impact Guide</h3>
          <p className="text-sm text-gray-600 mb-4">See how elevation affects the same 150-yard shot</p>

          <div className="space-y-3">
            {elevationScenarios.map((scenario) => {
              const Icon = scenario.icon;
              const diff = scenario.adjusted - scenario.distance;

              return (
                <div key={scenario.type} className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-primary transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center bg-${scenario.color}-100`}>
                        <Icon className={`w-6 h-6 text-${scenario.color}-600`} />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900">{scenario.type}</h4>
                        <p className="text-sm text-gray-600">{scenario.elevation} elevation</p>
                      </div>
                    </div>

                    <div className="text-right flex items-center gap-6">
                      <div>
                        <p className="text-xs text-gray-600">Actual → Adjusted</p>
                        <p className="font-bold text-gray-900">{scenario.distance} → {scenario.adjusted} yards</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Adjustment</p>
                        <p className={`text-xl font-bold ${diff > 0 ? 'text-orange-600' : diff < 0 ? 'text-blue-600' : 'text-green-600'}`}>
                          {diff > 0 ? '+' : ''}{diff}
                        </p>
                      </div>
                      <div className="min-w-[100px]">
                        <p className="text-xs text-gray-600 mb-1">Club</p>
                        <p className="text-sm font-bold text-primary">{scenario.club}</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Performance */}
        <div className="mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Today's Elevation Shots</h3>
          <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Hole</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700">Distance</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700">Elevation</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700">Adjusted</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {recentHoles.map((hole) => (
                  <tr key={hole.hole} className="hover:bg-white transition-colors">
                    <td className="px-4 py-3 font-bold text-gray-900">Hole {hole.hole}</td>
                    <td className="px-4 py-3 text-right text-gray-700">{hole.distance} yds</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`font-bold ${hole.elevation > 0 ? 'text-orange-600' : 'text-blue-600'}`}>
                        {hole.elevation > 0 ? '+' : ''}{hole.elevation} ft
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-primary">{hole.adjusted} yds</td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                        {hole.result}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Formula Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-900 mb-2">
            <strong className="font-semibold">Calculation Method:</strong> Copperline Golf uses GPS elevation data and applies the rule of thumb
            that every 10 feet of elevation change affects distance by approximately 7%.
          </p>
          <p className="text-xs text-blue-800">
            • <strong>Uphill:</strong> Add distance (ball fights gravity longer)<br />
            • <strong>Downhill:</strong> Subtract distance (ball aided by gravity)
          </p>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button variant="primary">View Course Elevation Map</Button>
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
