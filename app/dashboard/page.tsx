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
import {
  Circle,
  TrendingUp,
  Target,
  Calendar,
  BarChart3,
  Settings,
  History,
  MapPin,
  User,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Smartphone,
} from 'lucide-react';

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

      {/* Arizona Sunset Hero Banner */}
      <div className="relative h-72 md:h-80 lg:h-96 overflow-hidden">
        {/* Background Image - Arizona Desert Sunset */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1552083375-1447ce886485?w=1920&q=85')",
          }}
        >
          {/* Gradient Overlays for Better Text Readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent"></div>
        </div>

        {/* Hero Content */}
        <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
          <div className="max-w-2xl">
            <div className="inline-block px-4 py-1.5 bg-white/10 backdrop-blur-sm rounded-full mb-4">
              <span className="text-white/90 text-sm font-medium">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 drop-shadow-lg">
              Welcome back, {user.displayName?.split(' ')[0] || 'Golfer'}!
            </h1>
            <p className="text-xl md:text-2xl text-white/95 mb-6 drop-shadow-md">
              Perfect day for golf in the Southwest 🏌️
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/round/new">
                <Button
                  size="lg"
                  className="bg-white text-primary hover:bg-white/90 font-semibold shadow-xl"
                >
                  <Circle className="w-5 h-5 mr-2" />
                  Start New Round
                </Button>
              </Link>
              <Link href="/courses">
                <Button
                  variant="outline"
                  size="lg"
                  className="border-2 border-white text-white hover:bg-white/10 backdrop-blur-sm shadow-xl"
                >
                  <MapPin className="w-5 h-5 mr-2" />
                  Find Courses Near You
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Stats Overview Section */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-text-primary mb-4">Your Stats</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Rounds Card */}
            <Card variant="default" padding="lg">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-primary bg-opacity-10 rounded-lg flex items-center justify-center">
                  <Circle className="w-6 h-6 text-primary" />
                </div>
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
                <div className="w-10 h-10 bg-primary bg-opacity-10 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-primary" />
                </div>
                {stats && stats.totalRounds > 0 && (
                  <span className="text-xs text-success flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    {stats.currentHandicap < 15 ? 'Improving' : stats.currentHandicap < 20 ? 'Stable' : 'Needs work'}
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
                <div className="w-10 h-10 bg-success bg-opacity-10 rounded-lg flex items-center justify-center">
                  <Target className="w-6 h-6 text-success" />
                </div>
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
                <div className="w-10 h-10 bg-primary bg-opacity-10 rounded-lg flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-primary" />
                </div>
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
                <div className="w-20 h-20 bg-primary bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Circle className="w-10 h-10 text-primary" />
                </div>
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
                            <div className="w-10 h-10 bg-success bg-opacity-10 rounded-lg flex items-center justify-center flex-shrink-0">
                              <Target className="w-5 h-5 text-success" />
                            </div>
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
                            <span className="flex items-center gap-1">
                              <Circle className="w-3 h-3" />
                              {fairwaysHit}/{totalFairways} FW
                            </span>
                          )}
                          {gir > 0 && (
                            <span className="flex items-center gap-1">
                              <Target className="w-3 h-3" />
                              {gir}/18 GIR
                            </span>
                          )}
                          {totalPutts > 0 && (
                            <span className="flex items-center gap-1">
                              <Target className="w-3 h-3" />
                              {totalPutts} Putts
                            </span>
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
              <button className="w-full p-6 text-center bg-primary hover:bg-primary-600 rounded-lg transition-colors">
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Circle className="w-6 h-6 text-white" />
                </div>
                <h4 className="font-medium text-white">Start Round</h4>
              </button>
            </Link>

            <Link href="/analytics">
              <button className="w-full p-6 text-center bg-secondary-800 hover:bg-secondary-700 rounded-lg transition-colors border border-secondary-700">
                <div className="w-12 h-12 bg-primary bg-opacity-10 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <BarChart3 className="w-6 h-6 text-primary" />
                </div>
                <h4 className="font-medium text-text-primary">View Analytics</h4>
              </button>
            </Link>

            <Link href="/clubs">
              <button className="w-full p-6 text-center bg-secondary-800 hover:bg-secondary-700 rounded-lg transition-colors border border-secondary-700">
                <div className="w-12 h-12 bg-primary bg-opacity-10 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Settings className="w-6 h-6 text-primary" />
                </div>
                <h4 className="font-medium text-text-primary">Manage Clubs</h4>
              </button>
            </Link>

            <Link href="/history">
              <button className="w-full p-6 text-center bg-secondary-800 hover:bg-secondary-700 rounded-lg transition-colors border border-secondary-700">
                <div className="w-12 h-12 bg-primary bg-opacity-10 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <History className="w-6 h-6 text-primary" />
                </div>
                <h4 className="font-medium text-text-primary">View History</h4>
              </button>
            </Link>

            <Link href="/courses">
              <button className="w-full p-6 text-center bg-secondary-800 hover:bg-secondary-700 rounded-lg transition-colors border border-secondary-700">
                <div className="w-12 h-12 bg-success bg-opacity-10 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <MapPin className="w-6 h-6 text-success" />
                </div>
                <h4 className="font-medium text-text-primary">Find Courses</h4>
              </button>
            </Link>

            <Link href="/profile">
              <button className="w-full p-6 text-center bg-secondary-800 hover:bg-secondary-700 rounded-lg transition-colors border border-secondary-700">
                <div className="w-12 h-12 bg-primary bg-opacity-10 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <User className="w-6 h-6 text-primary" />
                </div>
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
                <CheckCircle className="w-6 h-6 text-success" />
              ) : (
                <Sparkles className="w-6 h-6 text-accent" />
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
                <CheckCircle className="w-6 h-6 text-success" />
              ) : (
                <AlertCircle className="w-6 h-6 text-warning" />
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
                <CheckCircle className="w-6 h-6 text-success" />
              ) : (
                <AlertCircle className="w-6 h-6 text-warning" />
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
              <Smartphone className="w-6 h-6 text-accent" />
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
                      <CheckCircle className="w-5 h-5 text-success flex-shrink-0" />
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
                      <CheckCircle className="w-5 h-5 text-success flex-shrink-0" />
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
