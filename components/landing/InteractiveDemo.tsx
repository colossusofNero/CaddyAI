/**
 * Interactive Club Selection Demo
 * Let visitors try CaddyAI without signing up
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

interface DemoInputs {
  distance: number;
  wind: number;
  elevation: number;
}

interface ClubRecommendation {
  club: string;
  confidence: number;
  reason: string;
}

export function InteractiveDemo() {
  const [inputs, setInputs] = useState<DemoInputs>({
    distance: 150,
    wind: 0,
    elevation: 0,
  });
  const [showResult, setShowResult] = useState(false);

  // Simple club selection logic for demo
  const calculateRecommendation = (): ClubRecommendation => {
    let adjustedDistance = inputs.distance;

    // Adjust for wind (1 yard per mph)
    adjustedDistance += inputs.wind;

    // Adjust for elevation (1 yard per 10 feet)
    adjustedDistance += inputs.elevation / 10;

    // Simple club selection
    if (adjustedDistance < 100) return { club: 'Pitching Wedge', confidence: 95, reason: 'Perfect distance for a controlled wedge shot' };
    if (adjustedDistance < 120) return { club: '9 Iron', confidence: 92, reason: 'Ideal distance for a full 9 iron' };
    if (adjustedDistance < 140) return { club: '8 Iron', confidence: 94, reason: 'Comfortable 8 iron range' };
    if (adjustedDistance < 160) return { club: '7 Iron', confidence: 93, reason: 'Clean 7 iron with good control' };
    if (adjustedDistance < 180) return { club: '6 Iron', confidence: 91, reason: 'Solid 6 iron distance' };
    if (adjustedDistance < 200) return { club: '5 Iron', confidence: 89, reason: 'Good 5 iron range' };
    return { club: '4 Iron or Hybrid', confidence: 87, reason: 'Consider hybrid for easier launch' };
  };

  const handleCalculate = () => {
    setShowResult(true);
  };

  const recommendation = showResult ? calculateRecommendation() : null;

  return (
    <div className="max-w-4xl mx-auto">
      <Card variant="elevated" padding="lg">
        <div className="text-center mb-6">
          <h3 className="text-2xl font-bold text-text-primary mb-2">
            Try CaddyAI Now
          </h3>
          <p className="text-text-secondary">
            See how AI-powered recommendations work in real-time
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Input Side */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Distance to Pin (yards)
              </label>
              <div className="space-y-2">
                <input
                  type="range"
                  min="50"
                  max="250"
                  step="5"
                  value={inputs.distance}
                  onChange={(e) => setInputs({ ...inputs, distance: parseInt(e.target.value) })}
                  className="w-full h-2 bg-secondary-700 rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <div className="flex justify-between text-sm text-text-secondary">
                  <span>50</span>
                  <span className="font-bold text-primary text-lg">{inputs.distance} yards</span>
                  <span>250</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Wind Speed (mph)
              </label>
              <div className="space-y-2">
                <input
                  type="range"
                  min="-20"
                  max="20"
                  step="1"
                  value={inputs.wind}
                  onChange={(e) => setInputs({ ...inputs, wind: parseInt(e.target.value) })}
                  className="w-full h-2 bg-secondary-700 rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <div className="flex justify-between text-sm text-text-secondary">
                  <span>-20 (against)</span>
                  <span className="font-bold text-primary text-lg">
                    {inputs.wind > 0 ? '+' : ''}{inputs.wind} mph
                  </span>
                  <span>+20 (with)</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Elevation Change (feet)
              </label>
              <div className="space-y-2">
                <input
                  type="range"
                  min="-50"
                  max="50"
                  step="5"
                  value={inputs.elevation}
                  onChange={(e) => setInputs({ ...inputs, elevation: parseInt(e.target.value) })}
                  className="w-full h-2 bg-secondary-700 rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <div className="flex justify-between text-sm text-text-secondary">
                  <span>-50 (downhill)</span>
                  <span className="font-bold text-primary text-lg">
                    {inputs.elevation > 0 ? '+' : ''}{inputs.elevation} ft
                  </span>
                  <span>+50 (uphill)</span>
                </div>
              </div>
            </div>

            <Button fullWidth onClick={handleCalculate}>
              Get Recommendation
            </Button>
          </div>

          {/* Result Side */}
          <div className="flex items-center justify-center">
            {!showResult ? (
              <div className="text-center text-text-secondary">
                <svg className="w-24 h-24 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <p>Adjust the conditions and get your recommendation</p>
              </div>
            ) : (
              <div className="w-full">
                <div className="bg-gradient-to-br from-primary to-primary-600 rounded-xl p-6 text-white text-center">
                  <div className="mb-4">
                    <div className="text-5xl font-bold mb-2">{recommendation?.club}</div>
                    <div className="flex items-center justify-center gap-2 text-sm opacity-90">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      {recommendation?.confidence}% Confidence
                    </div>
                  </div>

                  <div className="bg-white bg-opacity-20 rounded-lg p-4 mb-4">
                    <p className="text-sm font-medium">{recommendation?.reason}</p>
                  </div>

                  <div className="text-xs opacity-75">
                    Accounting for {inputs.wind !== 0 && `${Math.abs(inputs.wind)}mph wind, `}
                    {inputs.elevation !== 0 && `${Math.abs(inputs.elevation)}ft elevation, `}
                    and your personal shot data
                  </div>
                </div>

                <div className="mt-6 text-center">
                  <p className="text-text-secondary text-sm mb-4">
                    This is just the beginning...
                  </p>
                  <Button fullWidth variant="outline" size="sm">
                    Sign Up for Full AI Analysis
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
