'use client';

import { X, BarChart3, TrendingUp, TrendingDown, Target, Award, Zap, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface PerformanceAnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PerformanceAnalyticsModal({ isOpen, onClose }: PerformanceAnalyticsModalProps) {
  if (!isOpen) return null;

  const stats = {
    avgScore: 86.4,
    bestScore: 79,
    handicap: 14.2,
    roundsPlayed: 47,
    fairwayAccuracy: 58,
    greensInRegulation: 44,
    avgPutts: 32.8,
    improvement: +12,
  };

  const recentTrends = [
    { metric: 'Driving Accuracy', current: 58, trend: 'up', change: '+8%', color: 'green' },
    { metric: 'Greens in Regulation', current: 44, trend: 'up', change: '+6%', color: 'green' },
    { metric: 'Average Putts', current: 32.8, trend: 'down', change: '-2.1', color: 'green' },
    { metric: 'Average Score', current: 86.4, trend: 'down', change: '-3.6', color: 'green' },
    { metric: 'Penalty Strokes', current: 2.1, trend: 'down', change: '-0.8', color: 'green' },
  ];

  const strengthsWeaknesses = {
    strengths: [
      { area: 'Short Game', score: 92, description: 'Excellent around the greens' },
      { area: 'Iron Play', score: 87, description: 'Consistent ball striking' },
      { area: 'Course Management', score: 85, description: 'Smart decision making' },
    ],
    weaknesses: [
      { area: 'Driving Distance', score: 58, description: 'Below average length' },
      { area: 'Long Putts', score: 62, description: 'Struggles with lag putting' },
      { area: 'Bunker Play', score: 64, description: 'Needs improvement' },
    ],
  };

  const scoringBreakdown = [
    { category: 'Eagles', count: 2, percent: 0.4 },
    { category: 'Birdies', count: 38, percent: 8.1 },
    { category: 'Pars', count: 267, percent: 56.9 },
    { category: 'Bogeys', count: 124, percent: 26.4 },
    { category: 'Double+', count: 38, percent: 8.1 },
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
            <BarChart3 className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Performance Analytics</h2>
            <p className="text-gray-600">Detailed insights into your golf game</p>
          </div>
        </div>

        {/* Key Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5 border border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-blue-900">Avg Score</span>
              <BarChart3 className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-blue-900">{stats.avgScore}</p>
            <p className="text-xs text-blue-700 mt-1">{stats.roundsPlayed} rounds</p>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-5 border border-purple-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-purple-900">Handicap</span>
              <Award className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-3xl font-bold text-purple-900">{stats.handicap}</p>
            <p className="text-xs text-purple-700 mt-1">Official USGA</p>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-5 border border-green-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-green-900">Best Score</span>
              <Trophy className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-3xl font-bold text-green-900">{stats.bestScore}</p>
            <p className="text-xs text-green-700 mt-1">Personal record</p>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-5 border border-orange-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-orange-900">Improvement</span>
              <TrendingUp className="w-5 h-5 text-orange-600" />
            </div>
            <p className="text-3xl font-bold text-orange-900">+{stats.improvement}%</p>
            <p className="text-xs text-orange-700 mt-1">Since using CaddyAI</p>
          </div>
        </div>

        {/* Recent Trends */}
        <div className="mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Recent Performance Trends</h3>
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
            <div className="space-y-4">
              {recentTrends.map((trend) => (
                <div key={trend.metric} className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      trend.color === 'green' ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      {trend.trend === 'up' ? (
                        <TrendingUp className={`w-5 h-5 ${trend.color === 'green' ? 'text-green-600' : 'text-red-600'}`} />
                      ) : (
                        <TrendingDown className={`w-5 h-5 ${trend.color === 'green' ? 'text-green-600' : 'text-red-600'}`} />
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900">{trend.metric}</h4>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                        <div
                          className={`h-2 rounded-full ${trend.color === 'green' ? 'bg-green-500' : 'bg-red-500'}`}
                          style={{ width: `${trend.current}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-2xl font-bold text-gray-900">{trend.current}{typeof trend.current === 'number' && trend.current < 10 ? '' : '%'}</p>
                    <p className={`text-sm font-bold ${trend.color === 'green' ? 'text-green-600' : 'text-red-600'}`}>
                      {trend.change}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Strengths & Weaknesses */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">💪 Strengths</h3>
            <div className="space-y-3">
              {strengthsWeaknesses.strengths.map((item) => (
                <div key={item.area} className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-green-900">{item.area}</h4>
                    <div className="px-3 py-1 bg-green-900 text-white rounded-full text-sm font-bold">
                      {item.score}
                    </div>
                  </div>
                  <p className="text-sm text-green-800">{item.description}</p>
                  <div className="mt-2 w-full bg-green-200 rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{ width: `${item.score}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">🎯 Areas to Improve</h3>
            <div className="space-y-3">
              {strengthsWeaknesses.weaknesses.map((item) => (
                <div key={item.area} className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-orange-900">{item.area}</h4>
                    <div className="px-3 py-1 bg-orange-900 text-white rounded-full text-sm font-bold">
                      {item.score}
                    </div>
                  </div>
                  <p className="text-sm text-orange-800">{item.description}</p>
                  <div className="mt-2 w-full bg-orange-200 rounded-full h-2">
                    <div className="bg-orange-600 h-2 rounded-full" style={{ width: `${item.score}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Scoring Breakdown */}
        <div className="mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Scoring Breakdown</h3>
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
            <div className="grid grid-cols-5 gap-3 mb-4">
              {scoringBreakdown.map((item, idx) => (
                <div key={item.category} className="text-center">
                  <div className={`w-full h-32 rounded-lg flex items-end justify-center p-2 ${
                    idx === 0 ? 'bg-yellow-100' :
                    idx === 1 ? 'bg-blue-100' :
                    idx === 2 ? 'bg-green-100' :
                    idx === 3 ? 'bg-orange-100' : 'bg-red-100'
                  }`}>
                    <div
                      className={`w-full rounded-t-lg ${
                        idx === 0 ? 'bg-yellow-500' :
                        idx === 1 ? 'bg-blue-500' :
                        idx === 2 ? 'bg-green-500' :
                        idx === 3 ? 'bg-orange-500' : 'bg-red-500'
                      }`}
                      style={{ height: `${item.percent * 1.2}%` }}
                    />
                  </div>
                  <p className="text-xs font-bold text-gray-900 mt-2">{item.category}</p>
                  <p className="text-lg font-bold text-primary">{item.count}</p>
                  <p className="text-xs text-gray-600">{item.percent}%</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* AI Insights */}
        <div className="bg-gradient-to-r from-primary/10 to-blue-50 border border-primary/20 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Zap className="w-6 h-6 text-primary mt-1" />
            <div>
              <h4 className="font-bold text-gray-900 mb-2">🤖 AI Insights</h4>
              <ul className="space-y-1 text-sm text-gray-700">
                <li>• Your short game has improved by 18% in the last 3 months</li>
                <li>• Focus on lag putting drills to reduce three-putts</li>
                <li>• You score 2.3 strokes better on par 5s than the average 14 handicap</li>
                <li>• Consider a fitting session for your driver to improve distance</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button variant="primary">View Full Report</Button>
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
