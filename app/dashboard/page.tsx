/**
 * Dashboard Page
 * Main user dashboard after login
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';

export default function DashboardPage() {
  const router = useRouter();
  const { user, userMetadata, loading, signOut } = useAuth();

  // Redirect unauthenticated users to login
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

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
            Manage your profile, clubs, and preferences from here.
          </p>
        </div>

        {/* Status Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
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

        {/* Quick Actions */}
        <Card variant="elevated" padding="lg">
          <CardHeader title="Quick Actions" />
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <Link href="/profile">
                <button className="w-full p-4 text-left bg-secondary-800 hover:bg-secondary-700 rounded-lg transition-colors border border-secondary-700">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary bg-opacity-20 rounded-lg flex items-center justify-center">
                      <svg
                        className="w-5 h-5 text-primary"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-medium text-text-primary">Edit Profile</h4>
                      <p className="text-sm text-text-secondary">
                        Update your player information
                      </p>
                    </div>
                  </div>
                </button>
              </Link>

              <Link href="/clubs">
                <button className="w-full p-4 text-left bg-secondary-800 hover:bg-secondary-700 rounded-lg transition-colors border border-secondary-700">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary bg-opacity-20 rounded-lg flex items-center justify-center">
                      <svg
                        className="w-5 h-5 text-primary"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                        />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-medium text-text-primary">Manage Clubs</h4>
                      <p className="text-sm text-text-secondary">
                        Add or edit your club distances
                      </p>
                    </div>
                  </div>
                </button>
              </Link>

              <Link href="/settings">
                <button className="w-full p-4 text-left bg-secondary-800 hover:bg-secondary-700 rounded-lg transition-colors border border-secondary-700">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary bg-opacity-20 rounded-lg flex items-center justify-center">
                      <svg
                        className="w-5 h-5 text-primary"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-medium text-text-primary">Settings</h4>
                      <p className="text-sm text-text-secondary">
                        Manage your account settings
                      </p>
                    </div>
                  </div>
                </button>
              </Link>

              <Link href="/download">
                <button className="w-full p-4 text-left bg-secondary-800 hover:bg-secondary-700 rounded-lg transition-colors border border-secondary-700">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary bg-opacity-20 rounded-lg flex items-center justify-center">
                      <svg
                        className="w-5 h-5 text-primary"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                        />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-medium text-text-primary">
                        Download Mobile App
                      </h4>
                      <p className="text-sm text-text-secondary">
                        Get CaddyAI for iOS or Android
                      </p>
                    </div>
                  </div>
                </button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Getting Started Guide */}
        {(!userMetadata?.profileComplete || !userMetadata?.clubsComplete) && (
          <Card variant="bordered" padding="lg" className="mt-8">
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
        )}
      </div>
    </div>
  );
}
