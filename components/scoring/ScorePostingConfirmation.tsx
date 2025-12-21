/**
 * Score Posting Confirmation Component
 * Shows round summary and confirms before posting to GHIN
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Check, X, TrendingUp, AlertCircle, Info } from 'lucide-react';
import { clsx } from 'clsx';
import type { Round } from '@/lib/api/types';

interface ScorePostingConfirmationProps {
  round: Round;
  playerHandicap: number;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

export function ScorePostingConfirmation({
  round,
  playerHandicap,
  onConfirm,
  onCancel,
}: ScorePostingConfirmationProps) {
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const par = round.holes.reduce((sum, hole) => sum + hole.par, 0);
  const scoreToPar = round.score - par;
  const hasAdjustment = round.adjustedGrossScore && round.adjustedGrossScore !== round.score;

  async function handleConfirm() {
    try {
      setPosting(true);
      setError(null);
      await onConfirm();
    } catch (err) {
      console.error('Error posting score:', err);
      setError(err instanceof Error ? err.message : 'Failed to post score');
    } finally {
      setPosting(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h3 className="text-xl font-bold text-text-primary mb-2">
          Post Score to GHIN
        </h3>
        <p className="text-sm text-text-secondary">
          Review your round details before posting to your handicap
        </p>
      </div>

      {/* Round Summary */}
      <Card variant="elevated" padding="lg">
        <div className="space-y-4">
          {/* Course Info */}
          <div>
            <h4 className="font-semibold text-text-primary mb-1">
              {round.courseName}
            </h4>
            <div className="text-sm text-text-secondary">
              {round.teeUsed && (
                <span>
                  {round.teeUsed} Tees •
                </span>
              )}
              {round.holes.length} holes • Par {par}
            </div>
            <div className="text-xs text-text-muted mt-1">
              {new Date(round.date).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </div>
          </div>

          {/* Score Display */}
          <div className="flex items-center gap-6">
            <div>
              <div className="text-sm text-text-secondary mb-1">Your Score</div>
              <div className="text-4xl font-bold text-text-primary">
                {round.score}
              </div>
              <div
                className={clsx(
                  'text-sm font-semibold mt-1',
                  scoreToPar > 0
                    ? 'text-red-600'
                    : scoreToPar < 0
                    ? 'text-green-600'
                    : 'text-gray-600'
                )}
              >
                {scoreToPar > 0 ? '+' : ''}
                {scoreToPar} to par
              </div>
            </div>

            {hasAdjustment && (
              <>
                <div className="text-2xl text-gray-400">→</div>
                <div>
                  <div className="text-sm text-text-secondary mb-1">
                    Adjusted (ESC)
                  </div>
                  <div className="text-4xl font-bold text-primary">
                    {round.adjustedGrossScore}
                  </div>
                  <div className="text-xs text-text-muted mt-1">
                    After Equitable Stroke Control
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Rating/Slope */}
          {round.courseRating && round.slopeRating && (
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
              <div>
                <div className="text-xs text-text-secondary mb-1">
                  Course Rating
                </div>
                <div className="text-lg font-semibold text-text-primary">
                  {round.courseRating.toFixed(1)}
                </div>
              </div>
              <div>
                <div className="text-xs text-text-secondary mb-1">
                  Slope Rating
                </div>
                <div className="text-lg font-semibold text-text-primary">
                  {round.slopeRating}
                </div>
              </div>
            </div>
          )}

          {/* Handicap Differential */}
          {round.handicapDifferential !== undefined && (
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-semibold text-blue-900">
                  Handicap Differential
                </span>
              </div>
              <div className="text-2xl font-bold text-blue-600">
                {round.handicapDifferential.toFixed(1)}
              </div>
              <div className="text-xs text-blue-700 mt-1">
                Used for handicap index calculation
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* ESC Info */}
      {hasAdjustment && (
        <Card variant="bordered" padding="md" className="bg-yellow-50 border-yellow-200">
          <div className="flex gap-3">
            <Info className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-yellow-900 mb-1">
                Score Adjusted for ESC
              </p>
              <p className="text-yellow-800">
                Your score was adjusted using Equitable Stroke Control based on
                your handicap index of {playerHandicap.toFixed(1)}. This ensures
                fair handicap calculations per USGA rules.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium text-red-900">Failed to Post Score</p>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <Button
          variant="ghost"
          size="lg"
          onClick={onCancel}
          disabled={posting}
          className="flex-1"
        >
          <X className="w-5 h-5 mr-2" />
          Cancel
        </Button>
        <Button
          variant="primary"
          size="lg"
          onClick={handleConfirm}
          disabled={posting}
          className="flex-1"
        >
          {posting ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2" />
              Posting...
            </>
          ) : (
            <>
              <Check className="w-5 h-5 mr-2" />
              Post to GHIN
            </>
          )}
        </Button>
      </div>

      {/* Footer Note */}
      <p className="text-xs text-text-muted text-center">
        This score will be posted to your USGA GHIN handicap record
      </p>
    </div>
  );
}
