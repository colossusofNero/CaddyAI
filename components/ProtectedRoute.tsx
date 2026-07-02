/**
 * Protected Route Component
 * Redirects unauthenticated users to login page
 * Shows loading state while checking authentication
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireOnboarding?: boolean;
  requireProfile?: boolean;
  requireClubs?: boolean;
  redirectTo?: string;
}

export function ProtectedRoute({
  children,
  requireOnboarding = false,
  requireProfile = false,
  requireClubs = false,
  redirectTo = '/login',
}: ProtectedRouteProps) {
  const { user, userMetadata, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      // Not authenticated - redirect to login
      if (!user) {
        const currentPath = window.location.pathname;
        router.push(`${redirectTo}?redirect=${encodeURIComponent(currentPath)}`);
        return;
      }

      // Check onboarding requirement
      if (requireOnboarding && !userMetadata?.onboardingComplete) {
        router.push('/onboarding');
        return;
      }

      // Check profile requirement. Onboarding is where profile setup lives —
      // there is no dedicated /profile/setup route (would 404).
      if (requireProfile && !userMetadata?.profileComplete) {
        router.push('/onboarding');
        return;
      }

      // Check clubs requirement. Same — no /clubs/setup route; onboarding
      // covers club setup.
      if (requireClubs && !userMetadata?.clubsComplete) {
        router.push('/onboarding');
        return;
      }
    }
  }, [user, userMetadata, loading, router, requireOnboarding, requireProfile, requireClubs, redirectTo]);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary mb-4"></div>
          <p className="text-text-secondary text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated - show nothing (will redirect)
  if (!user) {
    return null;
  }

  // Show protected content
  return <>{children}</>;
}
