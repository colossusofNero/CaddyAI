/**
 * Recommendation Dashboard
 *
 * Simple, actionable dashboard showing:
 * - Recent recommendations
 * - What you chose vs what was recommended
 * - Basic adherence stats
 *
 * Designed to help golfers without overwhelming them.
 */

'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, Target, CheckCircle, XCircle, Activity } from 'lucide-react';
import { useRecommendationTracking } from '@/hooks/useRecommendationTracking';
import type { RecommendationEvent, RecommendationStats } from '@/types/recommendationTracking';
import { Card } from '@/components/ui/Card';

export function RecommendationDashboard() {
  const { getRecommendations, getStats, loading } = useRecommendationTracking();
  const [recommendations, setRecommendations] = useState<RecommendationEvent[]>([]);
  const [stats, setStats] = useState<RecommendationStats | null>(null);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('week');

  useEffect(() => {
    loadData();
  }, [timeRange]);

  async function loadData() {
    const [recs, statsData] = await Promise.all([
      getRecommendations({ limit: 20 }),
      getStats(),
    ]);

    // Filter by time range
    const now = Date.now();
    const filtered = recs.filter((rec) => {
      const recTime = rec.timestamp.toMillis();
      if (timeRange === 'week') return now - recTime < 7 * 24 * 60 * 60 * 1000;
      if (timeRange === 'month') return now - recTime < 30 * 24 * 60 * 60 * 1000;
      return true;
    });

    setRecommendations(filtered);
    setStats(statsData);
  }

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-text-primary">Shot Recommendations</h2>
        <div className="flex gap-2">
          {['week', 'month', 'all'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                timeRange === range
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {range === 'week' ? 'Last 7 Days' : range === 'month' ? 'Last 30 Days' : 'All Time'}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Overview */}
      {stats && stats.totalRecommendations > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard
            icon={<Activity className="w-6 h-6 text-primary" />}
            label="Total Recommendations"
            value={stats.totalRecommendations}
            subtitle={`${stats.fromAIAgent} from AI, ${stats.fromButton} from button`}
          />
          <StatCard
            icon={<CheckCircle className="w-6 h-6 text-green-600" />}
            label="Followed AI"
            value={`${stats.adherenceRate.toFixed(0)}%`}
            subtitle={`${stats.followedPrimary + stats.followedSecondary} times`}
            trend={stats.adherenceRate >= 70 ? 'good' : stats.adherenceRate >= 50 ? 'medium' : 'low'}
          />
          <StatCard
            icon={<Target className="w-6 h-6 text-blue-600" />}
            label="Primary Choice"
            value={`${((stats.followedPrimary / Math.max(stats.totalRecommendations, 1)) * 100).toFixed(0)}%`}
            subtitle={`${stats.followedPrimary} times`}
          />
          <StatCard
            icon={<TrendingUp className="w-6 h-6 text-orange-600" />}
            label="Your Way"
            value={stats.choseDifferent}
            subtitle="Different shots chosen"
          />
        </div>
      )}

      {/* No data state */}
      {(!stats || stats.totalRecommendations === 0) && (
        <Card variant="bordered" padding="lg">
          <div className="text-center py-8">
            <div className="text-5xl mb-4">📊</div>
            <h3 className="text-xl font-bold text-text-primary mb-2">
              No Recommendations Yet
            </h3>
            <p className="text-text-secondary mb-4">
              Start using the shot optimizer or AI caddy to see your stats here
            </p>
          </div>
        </Card>
      )}

      {/* Recent Recommendations List */}
      {recommendations.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-text-primary mb-4">Recent Recommendations</h3>
          <div className="space-y-3">
            {recommendations.map((rec) => (
              <RecommendationCard key={rec.id} recommendation={rec} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Stat Card Component
function StatCard({
  icon,
  label,
  value,
  subtitle,
  trend,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subtitle?: string;
  trend?: 'good' | 'medium' | 'low';
}) {
  const trendColor =
    trend === 'good' ? 'text-green-600' : trend === 'medium' ? 'text-yellow-600' : 'text-red-600';

  return (
    <Card variant="default" padding="md">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-gray-50 rounded-lg">{icon}</div>
        <div className="flex-1">
          <p className="text-sm text-gray-600 mb-1">{label}</p>
          <p className={`text-2xl font-bold ${trend ? trendColor : 'text-text-primary'}`}>
            {value}
          </p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
      </div>
    </Card>
  );
}

// Individual Recommendation Card
function RecommendationCard({ recommendation }: { recommendation: RecommendationEvent }) {
  const primary = recommendation.recommendations[0];
  const decision = recommendation.userDecision;

  // Determine if they followed recommendation
  const followed =
    decision?.decisionType === 'followed-primary' ||
    decision?.decisionType === 'followed-secondary';

  return (
    <Card variant="bordered" padding="md" className="hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-4">
        {/* Left side: Recommendation details */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium text-gray-600">
              Hole {recommendation.holeNumber || '?'} • {recommendation.distanceToTarget} yds
            </span>
            <span
              className={`px-2 py-0.5 rounded text-xs font-medium ${
                recommendation.source === 'ai-agent'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-purple-100 text-purple-700'
              }`}
            >
              {recommendation.source === 'ai-agent' ? 'AI Caddy' : 'Optimizer'}
            </span>
          </div>

          <div className="flex items-center gap-3 mb-2">
            <div>
              <p className="text-sm text-gray-600">AI Recommended:</p>
              <p className="font-bold text-text-primary">
                {primary.clubName} - {primary.totalYards} yds
              </p>
              {primary.reasoning && (
                <p className="text-xs text-gray-500 mt-1">{primary.reasoning}</p>
              )}
            </div>
          </div>

          {decision && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="flex items-center gap-2">
                {followed ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <XCircle className="w-4 h-4 text-orange-600" />
                )}
                <p className="text-sm text-gray-600">
                  You chose:{' '}
                  <span className="font-semibold text-text-primary">
                    {decision.chosenClubName || 'Different shot'}
                  </span>
                </p>
              </div>
            </div>
          )}

          {!decision && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <p className="text-xs text-gray-500 italic">No decision recorded</p>
            </div>
          )}
        </div>

        {/* Right side: Outcome badge (if available) */}
        {recommendation.outcome && (
          <div className="text-right">
            <OutcomeBadge outcome={recommendation.outcome.outcome} />
            {recommendation.outcome.landingArea && (
              <p className="text-xs text-gray-600 mt-1">
                {recommendation.outcome.landingArea}
              </p>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

// Outcome Badge
function OutcomeBadge({ outcome }: { outcome?: 'excellent' | 'good' | 'fair' | 'poor' }) {
  if (!outcome) return null;

  const config = {
    excellent: { label: 'Excellent', color: 'bg-green-100 text-green-700' },
    good: { label: 'Good', color: 'bg-blue-100 text-blue-700' },
    fair: { label: 'Fair', color: 'bg-yellow-100 text-yellow-700' },
    poor: { label: 'Poor', color: 'bg-red-100 text-red-700' },
  };

  const { label, color } = config[outcome];

  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium ${color}`}>
      {label}
    </span>
  );
}
