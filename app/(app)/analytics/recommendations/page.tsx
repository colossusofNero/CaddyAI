'use client';

/**
 * Recommendation Analytics Dashboard
 *
 * Shows insights into user's decision-making patterns:
 * - Do they follow AI/Optimizer recommendations?
 * - What happens when they deviate?
 * - Common club substitutions and their outcomes
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Target,
  Award,
  AlertCircle,
  CheckCircle2,
  XCircle,
  BarChart3,
  Lightbulb,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/charts/ProgressBar';
import { ComparisonChart } from '@/components/charts/ComparisonChart';
import {
  RecommendationAnalyticsApi,
  RecommendationAnalytics,
  DATE_RANGE_OPTIONS,
  getDateRangeLabel,
} from '@/lib/api/recommendationAnalytics';

export default function RecommendationAnalyticsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [analytics, setAnalytics] = useState<RecommendationAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<number | 'all'>(30);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Load analytics data
  useEffect(() => {
    if (user) {
      loadAnalytics();
    }
  }, [user, dateRange]);

  const loadAnalytics = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const api = new RecommendationAnalyticsApi(user.uid);
      const data = await api.getAnalytics(dateRange);
      setAnalytics(data);
    } catch (error) {
      console.error('[RecommendationAnalytics] Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  // Empty state
  if (!analytics || analytics.shotsWithRecommendations === 0) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <nav className="bg-card border-b border-border sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <Link href="/analytics">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </Link>
              <h1 className="text-xl font-bold">Recommendation Analytics</h1>
            </div>
          </div>
        </nav>

        {/* Empty state */}
        <div className="max-w-7xl mx-auto px-4 py-16">
          <Card variant="elevated">
            <CardContent className="text-center py-12">
              <BarChart3 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">No Data Yet</h2>
              <p className="text-muted-foreground mb-6">
                Start using AI recommendations or the Optimizer to build your analytics.
              </p>
              <Link href="/round/new">
                <Button variant="primary">Start a Round</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Get decision quality color
  const getQualityColor = (score: number): string => {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-warning';
    return 'text-error';
  };

  const getQualityLabel = (score: number): string => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Improvement';
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <nav className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/analytics">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </Link>
              <h1 className="text-xl font-bold">Recommendation Analytics</h1>
            </div>

            {/* Date range filter */}
            <div className="flex gap-2">
              {DATE_RANGE_OPTIONS.map((option) => (
                <Button
                  key={option.label}
                  variant={dateRange === option.days ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setDateRange(option.days)}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Decision Quality Score */}
          <Card variant="elevated">
            <CardContent className="pt-6 text-center">
              <Award className="w-8 h-8 mx-auto mb-2 text-copper" />
              <div className={`text-4xl font-bold mb-1 ${getQualityColor(analytics.decisionQualityScore)}`}>
                {analytics.decisionQualityScore}
              </div>
              <div className="text-sm text-muted-foreground">Decision Quality</div>
              <div className="text-xs text-muted-foreground mt-1">
                {getQualityLabel(analytics.decisionQualityScore)}
              </div>
            </CardContent>
          </Card>

          {/* Overall Adherence */}
          <Card variant="elevated">
            <CardContent className="pt-6 text-center">
              <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-success" />
              <div className="text-4xl font-bold mb-1">
                {(analytics.overallAdherenceRate * 100).toFixed(0)}%
              </div>
              <div className="text-sm text-muted-foreground">Follow Rate</div>
              <div className="text-xs text-muted-foreground mt-1">
                {analytics.shotsWithRecommendations} shots tracked
              </div>
            </CardContent>
          </Card>

          {/* Success Improvement */}
          <Card variant="elevated">
            <CardContent className="pt-6 text-center">
              <TrendingUp className="w-8 h-8 mx-auto mb-2 text-fairway" />
              <div className="text-4xl font-bold mb-1 text-success">
                +
                {(
                  analytics.outcomeWhenFollowed.excellentRate +
                  analytics.outcomeWhenFollowed.goodRate -
                  (analytics.outcomeWhenNotFollowed.excellentRate +
                    analytics.outcomeWhenNotFollowed.goodRate)
                ).toFixed(0)}
                %
              </div>
              <div className="text-sm text-muted-foreground">When Following</div>
              <div className="text-xs text-muted-foreground mt-1">Success boost</div>
            </CardContent>
          </Card>

          {/* Trouble Rate */}
          <Card variant="elevated">
            <CardContent className="pt-6 text-center">
              <AlertCircle className="w-8 h-8 mx-auto mb-2 text-error" />
              <div className="text-4xl font-bold mb-1 text-error">
                {analytics.outcomeWhenNotFollowed.troubleRate.toFixed(0)}%
              </div>
              <div className="text-sm text-muted-foreground">Trouble Rate</div>
              <div className="text-xs text-muted-foreground mt-1">When not following</div>
            </CardContent>
          </Card>
        </div>

        {/* Adherence Breakdown */}
        <Card variant="elevated">
          <CardHeader>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Target className="w-5 h-5 text-copper" />
              Adherence Patterns
            </h2>
          </CardHeader>
          <CardContent className="space-y-4">
            {analytics.adherencePatterns.map((pattern) => (
              <ProgressBar
                key={pattern.adherenceType}
                label={pattern.adherenceType.replace(/-/g, ' ').toUpperCase()}
                value={pattern.percentage}
                color={
                  pattern.adherenceType === 'both'
                    ? 'success'
                    : pattern.adherenceType === 'neither'
                    ? 'danger'
                    : 'warning'
                }
                showPercentage
              />
            ))}
          </CardContent>
        </Card>

        {/* Outcome Comparison */}
        <Card variant="elevated">
          <CardHeader>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-copper" />
              Outcome Comparison
            </h2>
            <p className="text-sm text-muted-foreground">
              Performance when following vs not following recommendations
            </p>
          </CardHeader>
          <CardContent>
            <ComparisonChart
              leftTitle="Following Recommendations"
              rightTitle="Not Following"
              metrics={[
                {
                  label: 'Excellent Shots',
                  leftValue: analytics.outcomeWhenFollowed.excellentRate,
                  rightValue: analytics.outcomeWhenNotFollowed.excellentRate,
                  format: 'percentage',
                  higherIsBetter: true,
                },
                {
                  label: 'Good Shots',
                  leftValue: analytics.outcomeWhenFollowed.goodRate,
                  rightValue: analytics.outcomeWhenNotFollowed.goodRate,
                  format: 'percentage',
                  higherIsBetter: true,
                },
                {
                  label: 'Trouble Shots',
                  leftValue: analytics.outcomeWhenFollowed.troubleRate,
                  rightValue: analytics.outcomeWhenNotFollowed.troubleRate,
                  format: 'percentage',
                  higherIsBetter: false,
                },
                {
                  label: 'Strokes Lost',
                  leftValue: analytics.outcomeWhenFollowed.averageStrokesLost,
                  rightValue: analytics.outcomeWhenNotFollowed.averageStrokesLost,
                  format: 'decimal',
                  higherIsBetter: false,
                },
              ]}
            />
          </CardContent>
        </Card>

        {/* Club Substitutions */}
        {analytics.topSubstitutions.length > 0 && (
          <Card variant="elevated">
            <CardHeader>
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <XCircle className="w-5 h-5 text-copper" />
                Common Substitutions
              </h2>
              <p className="text-sm text-muted-foreground">
                When you choose a different club than recommended
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.topSubstitutions.map((sub, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-lg bg-muted border border-border"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-semibold">
                        <span className="text-muted-foreground">{sub.recommendedClub}</span>
                        <span className="mx-2">→</span>
                        <span className="text-foreground">{sub.actualClub}</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {sub.count} times
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div>
                        Avg Outcome:{' '}
                        <span className="font-medium">{sub.averageOutcome.toFixed(1)}/4</span>
                      </div>
                      <div
                        className={
                          sub.troubleRate > 30
                            ? 'text-error'
                            : sub.troubleRate > 15
                            ? 'text-warning'
                            : 'text-success'
                        }
                      >
                        Trouble: {sub.troubleRate.toFixed(0)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Insights */}
        <Card variant="elevated">
          <CardHeader>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-copper" />
              Key Insights
            </h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.insights.map((insight, index) => (
                <div
                  key={index}
                  className="p-4 rounded-lg bg-info/10 border border-info/20 text-sm"
                >
                  <p className="text-foreground">{insight}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
