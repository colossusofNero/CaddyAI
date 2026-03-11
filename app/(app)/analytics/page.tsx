/**
 * Analytics Dashboard Page
 * Comprehensive golf performance statistics and visualizations
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { roundsApi } from '@/lib/api/rounds';
import { clubsApi } from '@/lib/api/clubs';
import type { Round, UserStatistics, Club } from '@/lib/api/types';
import {
  TrendingUp,
  TrendingDown,
  Target,
  Trophy,
  Activity,
  Calendar,
  ChevronLeft,
  BarChart3,
  Clock,
} from 'lucide-react';

interface ClubStats {
  clubName: string;
  averageDistance: number;
  totalShots: number;
}

type DateRange = '7' | '30' | '90' | 'all';

export default function AnalyticsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState<UserStatistics | null>(null);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [dateRange, setDateRange] = useState<DateRange>('30');
  const [error, setError] = useState<string | null>(null);

  // Redirect unauthenticated users
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Fetch data
  useEffect(() => {
    if (user) {
      loadAnalytics();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, dateRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('[Analytics] Starting data fetch for user:', user?.uid);

      // Fetch each collection independently so one failure doesn't kill the rest
      const [statsResult, roundsResult, clubsResult] = await Promise.allSettled([
        roundsApi.calculateStatistics(),
        roundsApi.getRounds(100),
        clubsApi.getClubs(),
      ]);

      const statsData = statsResult.status === 'fulfilled' ? statsResult.value : null;
      const roundsData = roundsResult.status === 'fulfilled' ? roundsResult.value : [];
      const clubsData = clubsResult.status === 'fulfilled' ? clubsResult.value : [];

      if (statsResult.status === 'rejected')
        console.error('[Analytics] Stats fetch failed:', statsResult.reason);
      if (roundsResult.status === 'rejected')
        console.error('[Analytics] Rounds fetch failed:', roundsResult.reason);
      if (clubsResult.status === 'rejected')
        console.error('[Analytics] Clubs fetch failed:', clubsResult.reason);

      console.log('[Analytics] Data fetched:', {
        statsData,
        roundsCount: roundsData.length,
        clubsCount: clubsData.length,
      });

      setStatistics(statsData);
      setRounds(filterRoundsByDateRange(roundsData));
      setClubs(clubsData);

      // Only show error if rounds AND stats both failed (clubs failing alone is non-critical)
      if (statsResult.status === 'rejected' && roundsResult.status === 'rejected') {
        const err = roundsResult.reason;
        setError(err instanceof Error ? err.message : 'Failed to load analytics data');
      }
    } catch (err) {
      console.error('Error loading analytics:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load analytics data';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const filterRoundsByDateRange = (allRounds: Round[]): Round[] => {
    if (dateRange === 'all') return allRounds;

    const daysAgo = parseInt(dateRange);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysAgo);

    return allRounds.filter((round) => {
      const roundDate = new Date(round.date);
      return roundDate >= cutoffDate;
    });
  };

  const getScoreTrend = (): 'up' | 'down' | 'neutral' => {
    if (rounds.length < 2) return 'neutral';
    const recent = rounds.slice(0, 5);
    const older = rounds.slice(5, 10);

    if (older.length === 0) return 'neutral';

    const recentAvg = recent.reduce((sum, r) => sum + r.score, 0) / recent.length;
    const olderAvg = older.reduce((sum, r) => sum + r.score, 0) / older.length;

    if (recentAvg < olderAvg - 1) return 'down'; // Improving (lower score is better)
    if (recentAvg > olderAvg + 1) return 'up'; // Getting worse
    return 'neutral';
  };

  const getClubStatistics = (): ClubStats[] => {
    // This would ideally aggregate from shot data
    // For now, return club averages from club definitions
    return clubs.map((club) => ({
      clubName: club.name,
      averageDistance: club.carryYards,
      totalShots: 0, // Would be calculated from shots
    })).slice(0, 5); // Top 5 clubs
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-text-secondary">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <nav className="border-b border-secondary-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card variant="bordered" padding="lg">
            <div className="text-center py-8">
              <p className="text-error text-lg mb-4">{error}</p>
              <Button onClick={loadAnalytics}>Try Again</Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Empty state - no rounds
  if ((!statistics || statistics.totalRounds === 0) && rounds.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <nav className="border-b border-secondary-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                <span className="text-xl font-bold text-text-primary">Analytics</span>
              </div>
            </div>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Card variant="elevated" padding="lg">
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-primary bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <BarChart3 className="w-10 h-10 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-text-primary mb-4">
                No Analytics Data Yet
              </h2>
              <p className="text-text-secondary mb-8 max-w-md mx-auto">
                Start tracking your rounds to see detailed performance analytics, trends, and safeStats.
              </p>
              <div className="flex gap-4 justify-center">
                <Link href="/clubs">
                  <Button variant="outline">Set Up Clubs First</Button>
                </Link>
                <Link href="/dashboard">
                  <Button variant="primary">Start First Round</Button>
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  const scoreTrend = getScoreTrend();
  const clubStats = getClubStatistics();
  const lastTenRounds = rounds.slice(0, 10);

  // Safe fallback so JSX doesn't crash if statistics failed to load
  const safeStats = statistics ?? {
    totalRounds: rounds.length,
    currentHandicap: 0,
    averageScore: rounds.length > 0 ? Math.round(rounds.reduce((s, r) => s + (r.score ?? 0), 0) / rounds.length) : 0,
    bestScore: rounds.length > 0 ? Math.min(...rounds.map(r => r.score ?? 0).filter(s => s > 0)) : 0,
    fairwaysHit: 0, fairwaysHitPercentage: 0,
    greensInRegulation: 0, greensInRegulationPercentage: 0,
    averagePutts: 0,
    totalBirdies: 0, totalPars: 0, totalBogeys: 0, totalDoubleBogeys: 0,
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Header */}
      <nav className="border-b border-secondary-700 sticky top-0 bg-background z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                <ChevronLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              <span className="text-xl font-bold text-text-primary">Analytics</span>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/analytics/recommendations">
                <Button variant="outline" size="sm">
                  AI Recommendations
                </Button>
              </Link>
              <Link href="/analytics/shot-data">
                <Button variant="outline" size="sm">
                  Shot Data
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Date Range Filter */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setDateRange('7')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                dateRange === '7'
                  ? 'bg-primary text-white'
                  : 'bg-secondary-800 text-text-secondary hover:bg-secondary-700'
              }`}
            >
              Last 7 Days
            </button>
            <button
              onClick={() => setDateRange('30')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                dateRange === '30'
                  ? 'bg-primary text-white'
                  : 'bg-secondary-800 text-text-secondary hover:bg-secondary-700'
              }`}
            >
              Last 30 Days
            </button>
            <button
              onClick={() => setDateRange('90')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                dateRange === '90'
                  ? 'bg-primary text-white'
                  : 'bg-secondary-800 text-text-secondary hover:bg-secondary-700'
              }`}
            >
              Last 90 Days
            </button>
            <button
              onClick={() => setDateRange('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                dateRange === 'all'
                  ? 'bg-primary text-white'
                  : 'bg-secondary-800 text-text-secondary hover:bg-secondary-700'
              }`}
            >
              All Time
            </button>
          </div>
        </div>

        {/* Summary Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Total Rounds */}
          <Card variant="elevated" padding="lg">
            <div className="flex items-start justify-between mb-2">
              <div className="w-10 h-10 bg-primary bg-opacity-20 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
            </div>
            <p className="text-3xl font-bold text-text-primary mb-1">
              {safeStats.totalRounds}
            </p>
            <p className="text-sm text-text-secondary">Total Rounds</p>
          </Card>

          {/* Current Handicap */}
          <Card variant="elevated" padding="lg">
            <div className="flex items-start justify-between mb-2">
              <div className="w-10 h-10 bg-primary bg-opacity-20 rounded-lg flex items-center justify-center">
                <Target className="w-5 h-5 text-primary" />
              </div>
              {scoreTrend === 'down' && (
                <TrendingDown className="w-5 h-5 text-success" />
              )}
              {scoreTrend === 'up' && (
                <TrendingUp className="w-5 h-5 text-error" />
              )}
            </div>
            <p className="text-3xl font-bold text-text-primary mb-1">
              {safeStats.currentHandicap}
            </p>
            <p className="text-sm text-text-secondary">Handicap Index</p>
          </Card>

          {/* Average Score */}
          <Card variant="elevated" padding="lg">
            <div className="flex items-start justify-between mb-2">
              <div className="w-10 h-10 bg-primary bg-opacity-20 rounded-lg flex items-center justify-center">
                <Activity className="w-5 h-5 text-primary" />
              </div>
            </div>
            <p className="text-3xl font-bold text-text-primary mb-1">
              {safeStats.averageScore}
            </p>
            <p className="text-sm text-text-secondary">Average Score</p>
          </Card>

          {/* Best Score */}
          <Card variant="elevated" padding="lg">
            <div className="flex items-start justify-between mb-2">
              <div className="w-10 h-10 bg-primary bg-opacity-20 rounded-lg flex items-center justify-center">
                <Trophy className="w-5 h-5 text-primary" />
              </div>
            </div>
            <p className="text-3xl font-bold text-text-primary mb-1">
              {safeStats.bestScore}
            </p>
            <p className="text-sm text-text-secondary">Best Score</p>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Score Trend Chart */}
          <Card variant="elevated" padding="lg">
            <CardHeader
              title="Score Trend"
              description="Last 10 rounds performance"
            />
            <CardContent>
              {lastTenRounds.length > 0 ? (
                <div className="space-y-3">
                  {lastTenRounds.map((round, index) => {
                    const maxScore = Math.max(...lastTenRounds.map(r => r.score));
                    const minScore = Math.min(...lastTenRounds.map(r => r.score));
                    const range = maxScore - minScore || 1;
                    const percentage = ((round.score - minScore) / range) * 100;
                    const isBest = round.score === safeStats.bestScore;

                    return (
                      <div key={round.id} className="flex items-center gap-3">
                        <div className="flex-shrink-0 w-12 text-xs text-text-secondary">
                          Round {lastTenRounds.length - index}
                        </div>
                        <div className="flex-1 relative">
                          <div className="h-8 bg-secondary-800 rounded-lg overflow-hidden">
                            <div
                              className={`h-full ${
                                isBest ? 'bg-success' : 'bg-primary'
                              } transition-all`}
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                          <div className="absolute inset-0 flex items-center px-3">
                            <span className="text-sm font-medium text-white">
                              {round.score}
                            </span>
                          </div>
                        </div>
                        <div className="flex-shrink-0 w-32 text-xs text-text-secondary truncate">
                          {round.courseName}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-center text-text-secondary py-8">No rounds data</p>
              )}
            </CardContent>
          </Card>

          {/* Fairways & Greens */}
          <Card variant="elevated" padding="lg">
            <CardHeader
              title="Fairways & Greens"
              description="Accuracy statistics"
            />
            <CardContent>
              <div className="space-y-6">
                {/* Fairways Hit */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-text-primary">
                      Fairways Hit
                    </span>
                    <span className="text-sm font-bold text-primary">
                      {safeStats.fairwaysHitPercentage.toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-4 bg-secondary-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-success transition-all"
                      style={{ width: `${safeStats.fairwaysHitPercentage}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-text-secondary mt-1">
                    {safeStats.fairwaysHit} of {Math.round(safeStats.fairwaysHit / (safeStats.fairwaysHitPercentage / 100) || 0)} fairways
                  </p>
                </div>

                {/* Greens in Regulation */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-text-primary">
                      Greens in Regulation
                    </span>
                    <span className="text-sm font-bold text-primary">
                      {safeStats.greensInRegulationPercentage.toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-4 bg-secondary-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-accent transition-all"
                      style={{ width: `${safeStats.greensInRegulationPercentage}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-text-secondary mt-1">
                    {safeStats.greensInRegulation} of {Math.round(safeStats.greensInRegulation / (safeStats.greensInRegulationPercentage / 100) || 0)} greens
                  </p>
                </div>

                {/* Average Putts */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-text-primary">
                      Average Putts per Hole
                    </span>
                    <span className="text-sm font-bold text-primary">
                      {safeStats.averagePutts.toFixed(2)}
                    </span>
                  </div>
                  <div className="h-4 bg-secondary-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${(safeStats.averagePutts / 3) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Scoring Distribution & Club Performance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Scoring Distribution */}
          <Card variant="elevated" padding="lg">
            <CardHeader
              title="Scoring Distribution"
              description="How you score relative to par"
            />
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-success"></div>
                    <span className="text-sm text-text-primary">Birdies</span>
                  </div>
                  <span className="text-lg font-bold text-text-primary">
                    {safeStats.totalBirdies}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-primary"></div>
                    <span className="text-sm text-text-primary">Pars</span>
                  </div>
                  <span className="text-lg font-bold text-text-primary">
                    {safeStats.totalPars}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-warning"></div>
                    <span className="text-sm text-text-primary">Bogeys</span>
                  </div>
                  <span className="text-lg font-bold text-text-primary">
                    {safeStats.totalBogeys}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-error"></div>
                    <span className="text-sm text-text-primary">Double Bogeys+</span>
                  </div>
                  <span className="text-lg font-bold text-text-primary">
                    {safeStats.totalDoubleBogeys}
                  </span>
                </div>

                {/* Visual Distribution */}
                <div className="mt-6 pt-6 border-t border-secondary-700">
                  <div className="h-8 flex rounded-lg overflow-hidden">
                    {safeStats.totalBirdies > 0 && (
                      <div
                        className="bg-success"
                        style={{
                          width: `${(safeStats.totalBirdies / (safeStats.totalBirdies + safeStats.totalPars + safeStats.totalBogeys + safeStats.totalDoubleBogeys)) * 100}%`
                        }}
                      ></div>
                    )}
                    {safeStats.totalPars > 0 && (
                      <div
                        className="bg-primary"
                        style={{
                          width: `${(safeStats.totalPars / (safeStats.totalBirdies + safeStats.totalPars + safeStats.totalBogeys + safeStats.totalDoubleBogeys)) * 100}%`
                        }}
                      ></div>
                    )}
                    {safeStats.totalBogeys > 0 && (
                      <div
                        className="bg-warning"
                        style={{
                          width: `${(safeStats.totalBogeys / (safeStats.totalBirdies + safeStats.totalPars + safeStats.totalBogeys + safeStats.totalDoubleBogeys)) * 100}%`
                        }}
                      ></div>
                    )}
                    {safeStats.totalDoubleBogeys > 0 && (
                      <div
                        className="bg-error"
                        style={{
                          width: `${(safeStats.totalDoubleBogeys / (safeStats.totalBirdies + safeStats.totalPars + safeStats.totalBogeys + safeStats.totalDoubleBogeys)) * 100}%`
                        }}
                      ></div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Club Performance */}
          <Card variant="elevated" padding="lg">
            <CardHeader
              title="Club Distances"
              description="Your club setup"
            />
            <CardContent>
              {clubStats.length > 0 ? (
                <div className="space-y-3">
                  {clubStats.map((club) => (
                    <div key={club.clubName} className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-24 text-sm font-medium text-text-primary truncate">
                        {club.clubName}
                      </div>
                      <div className="flex-1 relative">
                        <div className="h-8 bg-secondary-800 rounded-lg overflow-hidden">
                          <div
                            className="h-full bg-primary transition-all"
                            style={{
                              width: `${(club.averageDistance / 250) * 100}%`
                            }}
                          ></div>
                        </div>
                        <div className="absolute inset-0 flex items-center px-3">
                          <span className="text-sm font-medium text-white">
                            {club.averageDistance} yds
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="pt-4 mt-4 border-t border-secondary-700">
                    <Link href="/clubs">
                      <Button variant="outline" size="sm" fullWidth>
                        View All Clubs
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-text-secondary mb-4">No clubs set up yet</p>
                  <Link href="/clubs">
                    <Button variant="outline" size="sm">
                      Add Clubs
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Rounds */}
        <Card variant="elevated" padding="lg">
          <CardHeader
            title="Recent Rounds"
            description={`Showing ${rounds.length} rounds`}
          />
          <div className="px-6 pb-2">
            <Link href="/scores">
              <Button variant="outline" size="sm">
                View All Scores
              </Button>
            </Link>
          </div>
          <CardContent>
            {rounds.length > 0 ? (
              <div className="space-y-3">
                {rounds.slice(0, 5).map((round) => (
                  <div
                    key={round.id}
                    className="flex items-center justify-between p-4 bg-secondary-800 rounded-lg hover:bg-secondary-700 transition-colors"
                  >
                    <div className="flex-1">
                      <h4 className="font-medium text-text-primary mb-1">
                        {round.courseName}
                      </h4>
                      <div className="flex items-center gap-4 text-xs text-text-secondary">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(round.date).toLocaleDateString()}
                        </span>
                        <span>{round.holes.length} holes</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary">{round.score}</p>
                      <p className="text-xs text-text-secondary">strokes</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-text-secondary py-8">
                No rounds in selected date range
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
