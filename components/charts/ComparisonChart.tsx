/**
 * Comparison Chart Component
 *
 * Side-by-side comparison of two sets of metrics
 * Used for comparing "Followed" vs "Not Followed" outcomes
 */

import React from 'react';
import { TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';

interface MetricComparison {
  label: string;
  leftValue: number;
  rightValue: number;
  format?: 'percentage' | 'number' | 'decimal';
  higherIsBetter?: boolean;
}

interface ComparisonChartProps {
  leftTitle: string;
  rightTitle: string;
  metrics: MetricComparison[];
  highlightBetter?: boolean;
}

export function ComparisonChart({
  leftTitle,
  rightTitle,
  metrics,
  highlightBetter = true,
}: ComparisonChartProps) {
  const formatValue = (value: number, format: string = 'number'): string => {
    switch (format) {
      case 'percentage':
        return `${value.toFixed(0)}%`;
      case 'decimal':
        return value.toFixed(1);
      default:
        return value.toFixed(0);
    }
  };

  const getBetterSide = (metric: MetricComparison): 'left' | 'right' | 'equal' => {
    if (!highlightBetter) return 'equal';

    const { leftValue, rightValue, higherIsBetter = true } = metric;

    if (Math.abs(leftValue - rightValue) < 0.5) return 'equal';

    if (higherIsBetter) {
      return leftValue > rightValue ? 'left' : 'right';
    } else {
      return leftValue < rightValue ? 'left' : 'right';
    }
  };

  const getDifferenceIcon = (metric: MetricComparison) => {
    const better = getBetterSide(metric);
    if (better === 'equal') return null;

    const diff = Math.abs(metric.leftValue - metric.rightValue);
    const Icon = metric.higherIsBetter
      ? (metric.leftValue > metric.rightValue ? TrendingUp : TrendingDown)
      : (metric.leftValue < metric.rightValue ? TrendingUp : TrendingDown);

    return (
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <Icon className="w-3 h-3" />
        <span>{formatValue(diff, metric.format)}</span>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Headers */}
      <div className="grid grid-cols-2 gap-4 pb-2 border-b border-border">
        <div className="text-center">
          <h3 className="font-semibold text-sm text-success">{leftTitle}</h3>
        </div>
        <div className="text-center">
          <h3 className="font-semibold text-sm text-error">{rightTitle}</h3>
        </div>
      </div>

      {/* Metrics */}
      <div className="space-y-3">
        {metrics.map((metric, index) => {
          const betterSide = getBetterSide(metric);

          return (
            <div key={index} className="space-y-1">
              {/* Label */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{metric.label}</span>
                {getDifferenceIcon(metric)}
              </div>

              {/* Values */}
              <div className="grid grid-cols-2 gap-4">
                <div
                  className={`
                    p-3 rounded-lg text-center transition-colors
                    ${betterSide === 'left' ? 'bg-success/10 border border-success/20' : 'bg-muted'}
                  `}
                >
                  <div className={`text-xl font-bold ${betterSide === 'left' ? 'text-success' : 'text-foreground'}`}>
                    {formatValue(metric.leftValue, metric.format)}
                  </div>
                </div>

                <div
                  className={`
                    p-3 rounded-lg text-center transition-colors
                    ${betterSide === 'right' ? 'bg-success/10 border border-success/20' : 'bg-muted'}
                  `}
                >
                  <div className={`text-xl font-bold ${betterSide === 'right' ? 'text-success' : 'text-foreground'}`}>
                    {formatValue(metric.rightValue, metric.format)}
                  </div>
                </div>
              </div>

              {/* Visual bar */}
              <div className="grid grid-cols-2 gap-4">
                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${
                      betterSide === 'left' ? 'bg-success' : 'bg-success/40'
                    }`}
                    style={{ width: `${Math.min(100, metric.leftValue)}%` }}
                  />
                </div>

                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${
                      betterSide === 'right' ? 'bg-error' : 'bg-error/40'
                    }`}
                    style={{ width: `${Math.min(100, metric.rightValue)}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
