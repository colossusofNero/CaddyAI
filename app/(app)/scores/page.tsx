/**
 * Scores Page
 * Display user's score history from mobile app
 */

'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { firebaseService } from '@/services/firebaseService';
import { formatDate, formatScoreToPar, getScoreColor } from '@/lib/scoreUtils';
import { motion } from 'framer-motion';
import {
  Trophy,
  TrendingUp,
  Calendar,
  MapPin,
  Filter,
  ChevronRight,
  Activity,
} from 'lucide-react';

import type { FirebaseScore } from '@/types/scores';

export default function ScoresPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [scores, setScores] = useState<FirebaseScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterRoundType, setFilterRoundType] = useState<string>('all');
  const [filterPosted, setFilterPosted] = useState(false);

  useEffect(() => {
    if (user) {
      loadScores();
    }
  }, [user, filterRoundType, filterPosted]);

  const loadScores = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const options: any = {
        limit: 50,
      };

      if (filterRoundType !== 'all') {
        options.roundType = filterRoundType;
      }

      if (filterPosted) {
        options.postedOnly = true;
      }

      const userScores = await firebaseService.getUserScores(user.uid, options);
      setScores(userScores);
    } catch (err) {
      console.error('Error loading scores:', err);
      setError('Failed to load scores. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleScoreClick = (scoreId: string) => {
    router.push(`/scores/${scoreId}`);
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Navigation />

        {/* Header */}
        <section className="pt-32 pb-8 bg-gradient-to-b from-primary/10 to-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/20 rounded-2xl mb-4">
                <Trophy className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-text-primary mb-4">
                Score History
              </h1>
              <p className="text-xl text-text-secondary max-w-2xl mx-auto">
                View your rounds from the mobile app
              </p>
            </motion.div>
          </div>
        </section>

        {/* Filters */}
        <section className="py-6 border-b border-secondary-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-text-secondary" />
                <span className="text-sm font-medium text-text-secondary">Filters:</span>
              </div>

              <div className="flex flex-wrap gap-3">
                <select
                  value={filterRoundType}
                  onChange={(e) => setFilterRoundType(e.target.value)}
                  className="px-4 py-2 bg-secondary-800 border border-secondary-700 rounded-lg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="all">All Rounds</option>
                  <option value="18">18 Holes</option>
                  <option value="9-front">Front 9</option>
                  <option value="9-back">Back 9</option>
                </select>

                <label className="flex items-center gap-2 px-4 py-2 bg-secondary-800 border border-secondary-700 rounded-lg cursor-pointer hover:border-primary transition-colors">
                  <input
                    type="checkbox"
                    checked={filterPosted}
                    onChange={(e) => setFilterPosted(e.target.checked)}
                    className="w-4 h-4 text-primary border-secondary-600 rounded focus:ring-primary"
                  />
                  <span className="text-sm text-text-primary">Posted to GHIN</span>
                </label>
              </div>
            </div>
          </div>
        </section>

        {/* Scores List */}
        <section className="py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : error ? (
              <Card className="p-8 text-center">
                <Activity className="w-12 h-12 text-error mx-auto mb-4" />
                <p className="text-error text-lg mb-4">{error}</p>
                <Button onClick={loadScores}>Try Again</Button>
              </Card>
            ) : scores.length === 0 ? (
              <Card className="p-12 text-center">
                <Trophy className="w-16 h-16 text-text-muted mx-auto mb-4" />
                <h3 className="text-xl font-bold text-text-primary mb-2">
                  No Scores Yet
                </h3>
                <p className="text-text-secondary mb-6">
                  Your scores from the mobile app will appear here
                </p>
              </Card>
            ) : (
              <div className="space-y-4">
                {scores.map((score, index) => (
                  <motion.div
                    key={score.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card
                      className="p-6 hover:border-primary transition-colors cursor-pointer"
                      onClick={() => handleScoreClick(score.id)}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        {/* Left: Course Info */}
                        <div className="flex-1">
                          <div className="flex items-start gap-3">
                            <div className="mt-1">
                              <MapPin className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <h3 className="text-lg font-bold text-text-primary mb-1">
                                {score.course.name}
                              </h3>
                              <div className="flex items-center gap-2 text-sm text-text-secondary">
                                <Calendar className="w-4 h-4" />
                                <span>{formatDate(score.date)}</span>
                                <span>•</span>
                                <span>{score.roundType === '18' ? '18 Holes' : score.roundType === '9-front' ? 'Front 9' : 'Back 9'}</span>
                                {score.ghinStatus.posted && (
                                  <>
                                    <span>•</span>
                                    <span className="text-success font-medium">Posted to GHIN</span>
                                  </>
                                )}
                              </div>
                              {score.course.city && score.course.state && (
                                <p className="text-sm text-text-muted mt-1">
                                  {score.course.city}, {score.course.state}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Right: Score Stats */}
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <div className="text-3xl font-bold text-text-primary">
                              {score.stats.grossScore}
                            </div>
                            <div
                              className="text-sm font-medium"
                              style={{
                                color: getScoreColor(score.stats.grossScore, score.tee.par),
                              }}
                            >
                              {formatScoreToPar(score.stats.scoreToPar)}
                            </div>
                          </div>

                          <div className="text-right hidden sm:block">
                            <div className="text-xs text-text-muted uppercase tracking-wide mb-1">
                              Differential
                            </div>
                            <div className="text-xl font-bold text-primary">
                              {score.stats.scoreDifferential.toFixed(1)}
                            </div>
                          </div>

                          <ChevronRight className="w-6 h-6 text-text-muted" />
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </section>

        <Footer />
      </div>
    </ProtectedRoute>
  );
}
