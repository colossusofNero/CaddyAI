/**
 * Progress Bar Component
 *
 * Reusable horizontal progress bar with label and percentage
 * Follows existing Copperline Golf design patterns
 */

import React from 'react';

interface ProgressBarProps {
  label: string;
  value: number; // 0-100
  maxValue?: number;
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'fairway' | 'copper';
  showPercentage?: boolean;
  height?: 'sm' | 'md' | 'lg';
}

const colorClasses = {
  primary: 'bg-primary',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-error',
  fairway: 'bg-fairway',
  copper: 'bg-copper',
};

const heightClasses = {
  sm: 'h-2',
  md: 'h-3',
  lg: 'h-4',
};

export function ProgressBar({
  label,
  value,
  maxValue = 100,
  color = 'primary',
  showPercentage = true,
  height = 'md',
}: ProgressBarProps) {
  const percentage = Math.min(100, (value / maxValue) * 100);

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center text-sm">
        <span className="text-foreground/70">{label}</span>
        {showPercentage && (
          <span className="text-foreground font-medium">
            {percentage.toFixed(0)}%
          </span>
        )}
      </div>
      <div className={`w-full bg-muted rounded-full overflow-hidden ${heightClasses[height]}`}>
        <div
          className={`${colorClasses[color]} ${heightClasses[height]} rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
