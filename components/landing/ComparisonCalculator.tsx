/**
 * Comparison Calculator
 * Show users potential improvement with interactive score projection
 */

'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';

export function ComparisonCalculator() {
  const [currentHandicap, setCurrentHandicap] = useState(15);
  const [timeframe, setTimeframe] = useState(6); // months

  // Calculate projected improvement based on handicap
  const calculateImprovement = () => {
    // Higher handicaps improve faster
    if (currentHandicap >= 20) return 6;
    if (currentHandicap >= 15) return 5;
    if (currentHandicap >= 10) return 4;
    if (currentHandicap >= 5) return 3;
    return 2;
  };

  const improvement = calculateImprovement();
  const projectedHandicap = Math.max(0, currentHandicap - improvement);
  const strokesSaved = improvement;
  const roundsPlayed = timeframe * 4; // Assume 4 rounds per month
  const totalStrokesSaved = roundsPlayed * strokesSaved;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 bg-gradient-to-br from-secondary to-secondary-800 rounded-2xl">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-text-primary mb-4">
          Calculate Your Potential Improvement
        </h2>
        <p className="text-xl text-text-secondary max-w-2xl mx-auto">
          See how Copperline Golf could transform your game
        </p>
      </div>

      <div className="max-w-4xl mx-auto">
        <Card variant="elevated" padding="lg">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Input Side */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-3">
                  Your Current Handicap
                </label>
                <input
                  type="range"
                  min="0"
                  max="36"
                  step="1"
                  value={currentHandicap}
                  onChange={(e) => setCurrentHandicap(parseInt(e.target.value))}
                  className="w-full h-3 bg-secondary-700 rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <div className="flex justify-center mt-3">
                  <div className="bg-primary text-white px-6 py-2 rounded-lg text-2xl font-bold">
                    {currentHandicap}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-3">
                  Timeframe (months)
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[3, 6, 9, 12].map((months) => (
                    <button
                      key={months}
                      onClick={() => setTimeframe(months)}
                      className={`py-2 rounded-lg font-medium transition-colors ${
                        timeframe === months
                          ? 'bg-primary text-white'
                          : 'bg-secondary-700 text-text-secondary hover:bg-secondary-600'
                      }`}
                    >
                      {months}m
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-secondary-700">
                <h4 className="font-medium text-text-primary mb-3">Based on:</h4>
                <ul className="space-y-2 text-sm text-text-secondary">
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    12,000+ verified user improvements
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    AI-powered club recommendations
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Real-time course conditions
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Personalized shot tracking
                  </li>
                </ul>
              </div>
            </div>

            {/* Results Side */}
            <div className="flex flex-col justify-center">
              <div className="space-y-6">
                {/* Projected Handicap */}
                <div className="bg-gradient-to-br from-primary to-primary-600 rounded-xl p-6 text-white">
                  <div className="text-sm opacity-90 mb-2">Your Projected Handicap</div>
                  <div className="flex items-center gap-4">
                    <div className="text-5xl font-bold">{projectedHandicap}</div>
                    <div className="flex items-center gap-2 text-2xl">
                      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                      <span className="font-bold">-{improvement}</span>
                    </div>
                  </div>
                  <div className="text-xs opacity-75 mt-2">in {timeframe} months</div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-secondary-700 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-primary mb-1">{strokesSaved}</div>
                    <div className="text-xs text-text-secondary">Strokes Saved<br/>Per Round</div>
                  </div>
                  <div className="bg-secondary-700 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-primary mb-1">{roundsPlayed}</div>
                    <div className="text-xs text-text-secondary">Rounds<br/>Played</div>
                  </div>
                  <div className="bg-success bg-opacity-10 border border-success rounded-lg p-4 text-center col-span-2">
                    <div className="text-4xl font-bold text-success mb-1">{totalStrokesSaved}</div>
                    <div className="text-sm text-success font-medium">Total Strokes Saved</div>
                  </div>
                </div>

                {/* Value Proposition */}
                <div className="bg-secondary-700 rounded-lg p-4">
                  <div className="text-sm text-text-secondary mb-2">Annual Membership Value</div>
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-2xl font-bold text-text-primary">$99</span>
                    <span className="text-sm text-text-secondary">/year</span>
                    <span className="bg-success text-white text-xs px-2 py-1 rounded">20% off</span>
                  </div>
                  <div className="text-xs text-text-secondary">
                    = ${(99 / totalStrokesSaved).toFixed(2)} per stroke saved
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center">
            <button className="bg-primary hover:bg-primary-600 text-white font-bold py-3 px-8 rounded-lg transition-colors text-lg">
              Start Your Improvement Journey
            </button>
            <p className="text-xs text-text-secondary mt-3">30-day free trial • No credit card required</p>
          </div>
        </Card>
      </div>
    </section>
  );
}
