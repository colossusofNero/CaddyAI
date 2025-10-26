/**
 * Dashboard Page
 * Main user dashboard after login
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { roundsApi } from '@/lib/api/rounds';
import type { Round, UserStatistics } from '@/lib/api/types';

export default function DashboardPage() {
  const router = useRouter();
  const { user, userMetadata, loading, signOut } = useAuth();
  const { subscription, getSubscriptionStatus } = useSubscription();

  // Dashboard data state
  const [stats, setStats] = useState<UserStatistics | null>(null);
  const [recentRounds, setRecentRounds] = useState<Round[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);

  // Redirect unauthenticated users to login
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Fetch subscription status when user is loaded
  useEffect(() => {
    if (user) {
      getSubscriptionStatus();
    }
  }, [user, getSubscriptionStatus]);

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;

      try {
        setDataLoading(true);
        setDataError(null);

        // Fetch user statistics
        const userStats = await roundsApi.calculateStatistics();
        setStats(userStats);

        // Fetch recent rounds (last 5)
        const rounds = await roundsApi.getRounds(5);
        setRecentRounds(rounds);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setDataError('Failed to load dashboard data');
      } finally {
        setDataLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-secondary-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg"></div>
              <span className="text-2xl font-bold text-primary">CaddyAI</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-text-secondary text-sm">
                {user.displayName || user.email}
              </span>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text-primary mb-2">
            Dashboard - Welcome back, {user.displayName || 'Golfer'}!
          </h1>
          <p className="text-text-secondary">
            Track your progress, view recent rounds, and manage your game.
          </p>
        </div>

        {/* Stats Overview Section */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-text-primary mb-4">Your Stats</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Rounds Card */}
            <Card variant="default" padding="lg">
              <div className="flex items-center justify-between mb-4">
                <span className="text-3xl">🏌️</span>
              </div>
              <div>
                <div className="text-3xl font-bold text-text-primary">
                  {dataLoading ? (
                    <div className="h-9 bg-secondary-700 rounded animate-pulse w-16"></div>
                  ) : (
                    stats?.totalRounds || 0
                  )}
                </div>
                <div className="text-sm text-text-secondary mt-1">rounds played</div>
              </div>
            </Card>

            {/* Current Handicap Card */}
            <Card variant="default" padding="lg">
              <div className="flex items-center justify-between mb-4">
                <span className="text-3xl">📊</span>
                {stats && stats.totalRounds > 0 && (
                  <span className="text-xs text-success">
                    {stats.currentHandicap < 15 ? '↓ Improving' : stats.currentHandicap < 20 ? '→ Stable' : '↑ Needs work'}
                  </span>
                )}
              </div>
              <div>
                <div className="text-3xl font-bold text-text-primary">
                  {dataLoading ? (
                    <div className="h-9 bg-secondary-700 rounded animate-pulse w-16"></div>
                  ) : (
                    stats?.currentHandicap.toFixed(1) || '0.0'
                  )}
                </div>
                <div className="text-sm text-text-secondary mt-1">handicap index</div>
              </div>
            </Card>

            {/* Average Score Card */}
            <Card variant="default" padding="lg">
              <div className="flex items-center justify-between mb-4">
                <span className="text-3xl">⛳</span>
                {stats && stats.averageScore > 0 && (
                  <span className="text-xs text-text-secondary">
                    +{stats.averageScore - 72}
                  </span>
                )}
              </div>
              <div>
                <div className="text-3xl font-bold text-text-primary">
                  {dataLoading ? (
                    <div className="h-9 bg-secondary-700 rounded animate-pulse w-16"></div>
                  ) : (
                    stats?.averageScore || 0
                  )}
                </div>
                <div className="text-sm text-text-secondary mt-1">average score</div>
              </div>
            </Card>

            {/* This Month Card */}
            <Card variant="default" padding="lg">
              <div className="flex items-center justify-between mb-4">
                <span className="text-3xl">📅</span>
              </div>
              <div>
                <div className="text-3xl font-bold text-text-primary">
                  {dataLoading ? (
                    <div className="h-9 bg-secondary-700 rounded animate-pulse w-16"></div>
                  ) : (
                    recentRounds.filter(r => {
                      const roundDate = new Date(r.date);
                      const now = new Date();
                      return roundDate.getMonth() === now.getMonth() && roundDate.getFullYear() === now.getFullYear();
                    }).length
                  )}
                </div>
                <div className="text-sm text-text-secondary mt-1">rounds this month</div>
              </div>
            </Card>
          </div>
        </div>

        {/* Recent Rounds Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-text-primary">Recent Rounds</h2>
            {recentRounds.length > 0 && (
              <Link href="/history" className="text-primary hover:text-primary-dark text-sm font-medium">
                View All →
              </Link>
            )}
          </div>

          {dataLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} variant="default" padding="lg">
                  <div className="animate-pulse">
                    <div className="h-6 bg-secondary-700 rounded w-1/3 mb-2"></div>
                    <div className="h-4 bg-secondary-700 rounded w-1/2"></div>
                  </div>
                </Card>
              ))}
            </div>
          ) : recentRounds.length === 0 ? (
            <Card variant="bordered" padding="lg">
              <div className="text-center py-8">
                <div className="text-5xl mb-4">🏌️</div>
                <h3 className="text-xl font-bold text-text-primary mb-2">No rounds yet</h3>
                <p className="text-text-secondary mb-6">
                  Start tracking your golf game and see your progress here
                </p>
                <Link href="/round/new">
                  <Button variant="primary" size="md">
                    Start Your First Round
                  </Button>
                </Link>
              </div>
            </Card>
          ) : (
            <div className="space-y-4">
              {recentRounds.map((round) => {
                const roundDate = new Date(round.date);
                const par = round.holes.reduce((sum, h) => sum + h.par, 0);
                const fairwaysHit = round.holes.filter(h => h.fairwayHit).length;
                const totalFairways = round.holes.filter(h => h.fairwayHit !== undefined).length;
                const gir = round.holes.filter(h => h.greenInRegulation).length;
                const totalPutts = round.holes.reduce((sum, h) => sum + (h.putts || 0), 0);

                return (
                  <Card key={round.id} variant="default" padding="lg" className="hover:bg-secondary-700 transition-colors">
                    <Link href={`/history/${round.id}`}>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">⛳</span>
                            <div>
                              <h3 className="text-lg font-bold text-text-primary">{round.courseName}</h3>
                              <p className="text-sm text-text-secondary">
                                {roundDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-text-primary">{round.score}</div>
                            <div className="text-sm text-text-secondary">
                              ({round.score - par > 0 ? '+' : ''}{round.score - par})
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-text-secondary">
                          {totalFairways > 0 && (
                            <span>🏌️ {fairwaysHit}/{totalFairways} FW</span>
                          )}
                          {gir > 0 && (
                            <span>🎯 {gir}/18 GIR</span>
                          )}
                          {totalPutts > 0 && (
                            <span>⛳ {totalPutts} Putts</span>
                          )}
                        </div>
                      </div>
                    </Link>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Actions Section */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-text-primary mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Link href="/round/new">
              <button className="w-full p-6 text-center bg-primary hover:bg-primary-dark rounded-lg transition-colors">
                <div className="text-3xl mb-2">🏌️</div>
                <h4 className="font-medium text-white">Start Round</h4>
              </button>
            </Link>

            <Link href="/analytics">
              <button className="w-full p-6 text-center bg-secondary-800 hover:bg-secondary-700 rounded-lg transition-colors border border-secondary-700">
                <div className="text-3xl mb-2">📊</div>
                <h4 className="font-medium text-text-primary">View Analytics</h4>
              </button>
            </Link>

            <Link href="/clubs">
              <button className="w-full p-6 text-center bg-secondary-800 hover:bg-secondary-700 rounded-lg transition-colors border border-secondary-700">
                <div className="text-3xl mb-2">⚙️</div>
                <h4 className="font-medium text-text-primary">Manage Clubs</h4>
              </button>
            </Link>

            <Link href="/history">
              <button className="w-full p-6 text-center bg-secondary-800 hover:bg-secondary-700 rounded-lg transition-colors border border-secondary-700">
                <div className="text-3xl mb-2">📜</div>
                <h4 className="font-medium text-text-primary">View History</h4>
              </button>
            </Link>

            <Link href="/courses">
              <button className="w-full p-6 text-center bg-secondary-800 hover:bg-secondary-700 rounded-lg transition-colors border border-secondary-700">
                <div className="text-3xl mb-2">⛳</div>
                <h4 className="font-medium text-text-primary">Find Courses</h4>
              </button>
            </Link>

            <Link href="/profile">
              <button className="w-full p-6 text-center bg-secondary-800 hover:bg-secondary-700 rounded-lg transition-colors border border-secondary-700">
                <div className="text-3xl mb-2">👤</div>
                <h4 className="font-medium text-text-primary">Edit Profile</h4>
              </button>
            </Link>
          </div>
        </div>

        {/* Status Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          {/* Subscription Card */}
          <Card
            variant={subscription?.hasActiveSubscription && subscription?.plan !== 'free' ? 'default' : 'bordered'}
            padding="lg"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-text-primary">Subscription</h3>
              {subscription?.hasActiveSubscription && subscription?.plan !== 'free' ? (
                <svg
                  className="w-6 h-6 text-success"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <svg
                  className="w-6 h-6 text-accent"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                  />
                </svg>
              )}
            </div>
            <p className="text-text-secondary text-sm mb-4 capitalize">
              {subscription?.plan === 'free' && 'Free Plan'}
              {subscription?.plan === 'pro' && 'CaddyAI Pro'}
              {subscription?.plan === 'tour' && 'CaddyAI Tour'}
              {!subscription && 'Loading...'}
            </p>
            <Link href={subscription?.hasActiveSubscription && subscription?.plan !== 'free' ? '/settings/subscription' : '/pricing'}>
              <Button variant="outline" size="sm" fullWidth>
                {subscription?.hasActiveSubscription && subscription?.plan !== 'free' ? 'Manage Subscription' : 'Upgrade Plan'}
              </Button>
            </Link>
          </Card>

          <Card
            variant={userMetadata?.profileComplete ? 'default' : 'bordered'}
            padding="lg"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-text-primary">Profile</h3>
              {userMetadata?.profileComplete ? (
                <svg
                  className="w-6 h-6 text-success"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <svg
                  className="w-6 h-6 text-warning"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </div>
            <p className="text-text-secondary text-sm mb-4">
              {userMetadata?.profileComplete
                ? 'Your profile is complete'
                : 'Complete your player profile'}
            </p>
            <Link href="/profile">
              <Button variant="outline" size="sm" fullWidth>
                {userMetadata?.profileComplete ? 'View Profile' : 'Set Up Profile'}
              </Button>
            </Link>
          </Card>

          <Card
            variant={userMetadata?.clubsComplete ? 'default' : 'bordered'}
            padding="lg"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-text-primary">Clubs</h3>
              {userMetadata?.clubsComplete ? (
                <svg
                  className="w-6 h-6 text-success"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <svg
                  className="w-6 h-6 text-warning"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </div>
            <p className="text-text-secondary text-sm mb-4">
              {userMetadata?.clubsComplete
                ? 'Your club bag is set up'
                : 'Add your clubs and distances'}
            </p>
            <Link href="/clubs">
              <Button variant="outline" size="sm" fullWidth>
                {userMetadata?.clubsComplete ? 'Manage Clubs' : 'Set Up Clubs'}
              </Button>
            </Link>
          </Card>

          <Card variant="default" padding="lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-text-primary">Mobile App</h3>
              <svg
                className="w-6 h-6 text-accent"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                />
              </svg>
            </div>
            <p className="text-text-secondary text-sm mb-4">
              Use CaddyAI on the course with our mobile app
            </p>
            <Link href="/download">
              <Button variant="outline" size="sm" fullWidth>
                Download App
              </Button>
            </Link>
          </Card>
        </div>

        {/* Setup Progress Section - Show only if setup incomplete */}
        {(!userMetadata?.profileComplete || !userMetadata?.clubsComplete) && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-text-primary mb-4">Setup Progress</h2>
            <Card variant="bordered" padding="lg">
              <CardHeader
                title="Getting Started"
                description="Complete these steps to get the most out of CaddyAI"
              />
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    {userMetadata?.profileComplete ? (
                      <svg
                        className="w-5 h-5 text-success flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      <div className="w-5 h-5 border-2 border-secondary-700 rounded-full flex-shrink-0"></div>
                    )}
                    <span
                      className={
                        userMetadata?.profileComplete
                          ? 'text-text-secondary line-through'
                          : 'text-text-primary'
                      }
                    >
                      Complete your player profile (5 questions)
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    {userMetadata?.clubsComplete ? (
                      <svg
                        className="w-5 h-5 text-success flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      <div className="w-5 h-5 border-2 border-secondary-700 rounded-full flex-shrink-0"></div>
                    )}
                    <span
                      className={
                        userMetadata?.clubsComplete
                          ? 'text-text-secondary line-through'
                          : 'text-text-primary'
                      }
                    >
                      Add your clubs and distances
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-secondary-700 rounded-full flex-shrink-0"></div>
                    <span className="text-text-primary">
                      Download the mobile app and start playing
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

      </div>
    </div>
  );
}
