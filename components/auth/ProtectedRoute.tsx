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
}

export function ProtectedRoute({ children, requireOnboarding = false }: ProtectedRouteProps) {
  const router = useRouter();
  const { user, userMetadata, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      // Not authenticated - redirect to login
      if (!user) {
        router.push('/login');
        return;
      }

      // Authenticated but need onboarding
      if (requireOnboarding && userMetadata && !userMetadata.onboardingComplete) {
        router.push('/onboarding');
        return;
      }
    }
  }, [user, userMetadata, loading, requireOnboarding, router]);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-text-secondary">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return null; // Will redirect via useEffect
  }

  // Authenticated but incomplete onboarding
  if (requireOnboarding && userMetadata && !userMetadata.onboardingComplete) {
    return null; // Will redirect via useEffect
  }

  // Authenticated and ready
  return <>{children}</>;
}
