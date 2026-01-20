'use client';

/**
 * Debug Page - Firebase Data Diagnostic
 * Shows what data exists and helps identify connection issues
 */

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { roundsApi } from '@/lib/api/rounds';
import { firebaseService } from '@/services/firebaseService';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function DebugPage() {
  const { user, loading: authLoading } = useAuth();
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runDiagnostics = async () => {
    if (!user) return;

    setLoading(true);
    const info: any = {
      userId: user.uid,
      userEmail: user.email,
      userName: user.displayName,
      timestamp: new Date().toISOString(),
      collections: {},
      errors: [],
    };

    try {
      // Check rounds collection
      try {
        const rounds = await roundsApi.getRounds(100);
        info.collections.rounds = {
          count: rounds.length,
          sample: rounds.slice(0, 2),
        };
      } catch (error: any) {
        info.errors.push(`Rounds error: ${error.message}`);
        info.collections.rounds = { error: error.message };
      }

      // Check scores collection
      try {
        const scores = await firebaseService.getUserScores(user.uid, { limit: 100 });
        info.collections.scores = {
          count: scores.length,
          sample: scores.slice(0, 2),
        };
      } catch (error: any) {
        info.errors.push(`Scores error: ${error.message}`);
        info.collections.scores = { error: error.message };
      }

      // Check shots collection
      try {
        const shots = await firebaseService.getUserShots(user.uid);
        info.collections.shots = {
          count: shots?.shots?.length || 0,
          sample: shots?.shots?.slice(0, 2) || [],
        };
      } catch (error: any) {
        info.errors.push(`Shots error: ${error.message}`);
        info.collections.shots = { error: error.message };
      }

      // Check active round
      try {
        const activeRound = await firebaseService.getActiveRound(user.uid);
        info.collections.activeRound = activeRound ? { exists: true, data: activeRound } : { exists: false };
      } catch (error: any) {
        info.errors.push(`Active round error: ${error.message}`);
        info.collections.activeRound = { error: error.message };
      }

      // Check statistics
      try {
        const stats = await roundsApi.calculateStatistics();
        info.statistics = stats;
      } catch (error: any) {
        info.errors.push(`Statistics error: ${error.message}`);
        info.statistics = { error: error.message };
      }

    } catch (error: any) {
      info.errors.push(`General error: ${error.message}`);
    }

    setDebugInfo(info);
    setLoading(false);
  };

  useEffect(() => {
    if (user && !loading) {
      runDiagnostics();
    }
  }, [user]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-text-secondary">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card variant="bordered" padding="lg">
          <p className="text-text-primary mb-4">Please log in to view debug information</p>
          <Link href="/login">
            <Button variant="primary">Go to Login</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-secondary-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <h1 className="text-xl font-bold text-text-primary">Firebase Debug</h1>
            <Button variant="outline" size="sm" onClick={runDiagnostics} disabled={loading}>
              {loading ? 'Running...' : 'Refresh'}
            </Button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!debugInfo ? (
          <Card variant="elevated" padding="lg">
            <p className="text-center text-text-secondary">Running diagnostics...</p>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* User Info */}
            <Card variant="elevated" padding="lg">
              <CardHeader>
                <h2 className="text-lg font-bold text-text-primary">User Information</h2>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 font-mono text-sm">
                  <div><span className="text-text-secondary">User ID:</span> <span className="text-text-primary">{debugInfo.userId}</span></div>
                  <div><span className="text-text-secondary">Email:</span> <span className="text-text-primary">{debugInfo.userEmail}</span></div>
                  <div><span className="text-text-secondary">Name:</span> <span className="text-text-primary">{debugInfo.userName}</span></div>
                  <div><span className="text-text-secondary">Timestamp:</span> <span className="text-text-primary">{debugInfo.timestamp}</span></div>
                </div>
              </CardContent>
            </Card>

            {/* Errors */}
            {debugInfo.errors.length > 0 && (
              <Card variant="bordered" padding="lg">
                <CardHeader>
                  <h2 className="text-lg font-bold text-error">Errors ({debugInfo.errors.length})</h2>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {debugInfo.errors.map((error: string, index: number) => (
                      <div key={index} className="p-3 bg-error bg-opacity-10 rounded text-error text-sm font-mono">
                        {error}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Collections Data */}
            <Card variant="elevated" padding="lg">
              <CardHeader>
                <h2 className="text-lg font-bold text-text-primary">Collections Data</h2>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Rounds */}
                  <div>
                    <h3 className="font-semibold text-text-primary mb-2">Rounds Collection</h3>
                    <pre className="p-4 bg-secondary-800 rounded text-xs text-text-primary overflow-x-auto">
                      {JSON.stringify(debugInfo.collections.rounds, null, 2)}
                    </pre>
                  </div>

                  {/* Scores */}
                  <div>
                    <h3 className="font-semibold text-text-primary mb-2">Scores Collection</h3>
                    <pre className="p-4 bg-secondary-800 rounded text-xs text-text-primary overflow-x-auto">
                      {JSON.stringify(debugInfo.collections.scores, null, 2)}
                    </pre>
                  </div>

                  {/* Shots */}
                  <div>
                    <h3 className="font-semibold text-text-primary mb-2">Shots Collection</h3>
                    <pre className="p-4 bg-secondary-800 rounded text-xs text-text-primary overflow-x-auto">
                      {JSON.stringify(debugInfo.collections.shots, null, 2)}
                    </pre>
                  </div>

                  {/* Active Round */}
                  <div>
                    <h3 className="font-semibold text-text-primary mb-2">Active Round</h3>
                    <pre className="p-4 bg-secondary-800 rounded text-xs text-text-primary overflow-x-auto">
                      {JSON.stringify(debugInfo.collections.activeRound, null, 2)}
                    </pre>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Statistics */}
            <Card variant="elevated" padding="lg">
              <CardHeader>
                <h2 className="text-lg font-bold text-text-primary">Calculated Statistics</h2>
              </CardHeader>
              <CardContent>
                <pre className="p-4 bg-secondary-800 rounded text-xs text-text-primary overflow-x-auto">
                  {JSON.stringify(debugInfo.statistics, null, 2)}
                </pre>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
