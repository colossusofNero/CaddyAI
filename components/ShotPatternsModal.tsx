'use client';

import { X, Target, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ShotPatternsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ShotPatternsModal({ isOpen, onClose }: ShotPatternsModalProps) {
  if (!isOpen) return null;

  const clubData = [
    { club: 'Driver', avgDistance: 245, dispersion: 28, tendency: 'Slight fade', accuracy: 68 },
    { club: '3-Wood', avgDistance: 220, dispersion: 22, tendency: 'Straight', accuracy: 74 },
    { club: '5-Iron', avgDistance: 185, dispersion: 18, tendency: 'Slight draw', accuracy: 81 },
    { club: '7-Iron', avgDistance: 160, dispersion: 15, tendency: 'Straight', accuracy: 85 },
    { club: '9-Iron', avgDistance: 135, dispersion: 12, tendency: 'Straight', accuracy: 88 },
    { club: 'PW', avgDistance: 115, dispersion: 10, tendency: 'Slight draw', accuracy: 91 },
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
            <Target className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Personalized Shot Patterns</h2>
            <p className="text-gray-600">Track your shot dispersion and tendencies for each club</p>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-blue-900">Total Shots Tracked</span>
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-blue-900">2,847</p>
            <p className="text-xs text-blue-700 mt-1">Across all clubs</p>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-green-900">Avg Accuracy</span>
              <Target className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-3xl font-bold text-green-900">81%</p>
            <p className="text-xs text-green-700 mt-1">+5% from last month</p>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-purple-900">Most Consistent</span>
              <Target className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-3xl font-bold text-purple-900">PW</p>
            <p className="text-xs text-purple-700 mt-1">91% accuracy</p>
          </div>
        </div>

        {/* Club Breakdown */}
        <div className="mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Club-by-Club Analysis</h3>
          <div className="space-y-3">
            {clubData.map((data) => (
              <div key={data.club} className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-primary transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="text-lg font-bold text-gray-900">{data.club}</h4>
                    <p className="text-sm text-gray-600">Avg: {data.avgDistance} yards · {data.tendency}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary">{data.accuracy}%</div>
                    <div className="text-xs text-gray-600">Accuracy</div>
                  </div>
                </div>

                {/* Dispersion Bar */}
                <div className="relative">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-gray-700">Dispersion</span>
                    <span className="text-xs text-gray-600">±{data.dispersion} yards</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-primary to-green-500 h-2 rounded-full transition-all"
                      style={{ width: `${data.accuracy}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-900">
            <strong className="font-semibold">How it works:</strong> CaddyAI tracks every shot you take and builds a personalized profile for each club.
            The AI learns your shot shape, dispersion patterns, and distance variations to provide more accurate club recommendations over time.
          </p>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button variant="primary">View Full Statistics</Button>
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
