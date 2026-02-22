/**
 * Recommendations Page
 *
 * Shows user's recommendation history and adherence stats
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { RecommendationDashboard } from '@/components/recommendations/RecommendationDashboard';

export default function RecommendationsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  // Redirect unauthenticated users
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login?redirect=/recommendations');
    }
  }, [user, loading, router]);

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
    <div className="min-h-screen bg-gradient-to-b from-background via-background-light to-background">
      {/* Header */}
      <div className="bg-white border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-text-secondary hover:text-primary transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Dashboard
          </button>

          <h1 className="text-4xl font-sans font-bold text-text-primary mb-3">
            Shot Recommendations
          </h1>
          <p className="text-text-secondary">
            Track your AI recommendations and see how they're helping your game
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <RecommendationDashboard />

        {/* Info Card */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="text-lg font-bold text-blue-900 mb-2">
            📱 Get More Insights with the Mobile App
          </h3>
          <p className="text-blue-800 mb-4">
            The Copperline Golf mobile app tracks recommendations in real-time during your rounds,
            with GPS tracking, AI caddy conversations, and detailed outcome analysis.
          </p>
          <Link href="/download">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
              Download Mobile App
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
