/**
 * Tee Selector Component
 * Allows player to select which tee they're playing from
 * Fetches tee data from GHIN API if course has GHIN ID
 */

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Check, Info } from 'lucide-react';
import { clsx } from 'clsx';

interface TeeOption {
  name: string;
  color: string;
  rating: number;
  slope: number;
  yardage?: number;
}

interface TeeSelectorProps {
  courseName: string;
  ghinCourseId?: string;
  onTeeSelected: (tee: {
    name: string;
    color: string;
    rating: number;
    slope: number;
  }) => void;
  onSkip?: () => void;
  loading?: boolean;
}

export function TeeSelector({
  courseName,
  ghinCourseId,
  onTeeSelected,
  onSkip,
  loading = false,
}: TeeSelectorProps) {
  const [tees, setTees] = useState<TeeOption[]>([]);
  const [selectedTee, setSelectedTee] = useState<TeeOption | null>(null);
  const [fetchingTees, setFetchingTees] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (ghinCourseId) {
      fetchTeeOptions();
    } else {
      // Provide default tees if no GHIN ID
      setTees(getDefaultTees());
    }
  }, [ghinCourseId]);

  async function fetchTeeOptions() {
    if (!ghinCourseId) return;

    try {
      setFetchingTees(true);
      setError(null);

      const response = await fetch('/api/ghin/tees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ghinCourseId, courseName }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch tee options');
      }

      const data = await response.json();
      setTees(data.tees || getDefaultTees());
    } catch (err) {
      console.error('Error fetching tees:', err);
      setError('Could not load tee options. Using defaults.');
      setTees(getDefaultTees());
    } finally {
      setFetchingTees(false);
    }
  }

  function getDefaultTees(): TeeOption[] {
    return [
      { name: 'Championship', color: 'Black', rating: 74.0, slope: 135 },
      { name: 'Blue', color: 'Blue', rating: 72.0, slope: 130 },
      { name: 'White', color: 'White', rating: 70.0, slope: 125 },
      { name: 'Gold/Senior', color: 'Gold', rating: 68.5, slope: 120 },
      { name: 'Red', color: 'Red', rating: 71.0, slope: 125 },
    ];
  }

  function getTeeColorClass(color: string): string {
    const colorMap: Record<string, string> = {
      Black: 'bg-black text-white',
      Blue: 'bg-blue-600 text-white',
      White: 'bg-white text-gray-900 border border-gray-300',
      Gold: 'bg-yellow-500 text-gray-900',
      Red: 'bg-red-600 text-white',
      Green: 'bg-green-600 text-white',
    };
    return colorMap[color] || 'bg-gray-600 text-white';
  }

  function handleConfirm() {
    if (selectedTee) {
      onTeeSelected({
        name: selectedTee.name,
        color: selectedTee.color,
        rating: selectedTee.rating,
        slope: selectedTee.slope,
      });
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h3 className="text-xl font-bold text-text-primary mb-2">
          Select Your Tee
        </h3>
        <p className="text-sm text-text-secondary">
          Choose the tee box you'll be playing from at {courseName}
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
          <Info className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-yellow-800">{error}</p>
        </div>
      )}

      {/* Tee Options */}
      {fetchingTees ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {tees.map((tee) => {
            const isSelected = selectedTee?.name === tee.name;
            return (
              <button
                key={`${tee.name}-${tee.color}`}
                onClick={() => setSelectedTee(tee)}
                className={clsx(
                  'relative p-4 rounded-lg border-2 transition-all text-left',
                  'hover:shadow-md active:scale-98',
                  isSelected
                    ? 'border-primary bg-primary/5 shadow-lg'
                    : 'border-gray-300 hover:border-gray-400'
                )}
              >
                {/* Selection Indicator */}
                {isSelected && (
                  <div className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}

                {/* Tee Color Badge */}
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className={clsx(
                      'px-3 py-1 rounded-full text-xs font-bold',
                      getTeeColorClass(tee.color)
                    )}
                  >
                    {tee.color}
                  </div>
                  <span className="text-sm font-semibold text-text-primary">
                    {tee.name}
                  </span>
                </div>

                {/* Tee Stats */}
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-text-secondary">Rating: </span>
                    <span className="font-semibold text-text-primary">
                      {tee.rating.toFixed(1)}
                    </span>
                  </div>
                  <div>
                    <span className="text-text-secondary">Slope: </span>
                    <span className="font-semibold text-text-primary">
                      {tee.slope}
                    </span>
                  </div>
                </div>

                {tee.yardage && (
                  <div className="mt-2 text-xs text-text-secondary">
                    {tee.yardage.toLocaleString()} yards
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Info Box */}
      <Card variant="bordered" padding="md" className="bg-blue-50 border-blue-200">
        <div className="flex gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900">
            <p className="font-medium mb-1">Why select a tee?</p>
            <p className="text-blue-800">
              Your tee selection helps calculate your handicap differential accurately
              using the course rating and slope for GHIN score posting.
            </p>
          </div>
        </div>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-2">
        {onSkip && (
          <Button
            variant="ghost"
            size="lg"
            onClick={onSkip}
            disabled={loading}
            className="flex-1"
          >
            Skip for Now
          </Button>
        )}
        <Button
          variant="primary"
          size="lg"
          onClick={handleConfirm}
          disabled={!selectedTee || loading}
          className="flex-1"
        >
          {loading ? 'Starting Round...' : 'Confirm & Start Round'}
        </Button>
      </div>
    </div>
  );
}
