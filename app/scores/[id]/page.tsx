/**
 * Score Detail Page
 * Display full scorecard with hole-by-hole breakdown
 */

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { firebaseService } from '@/services/firebaseService';
import {
  formatDate,
  formatScoreToPar,
  getScoreColor,
  getScoreName,
  calculateFIRPercentage,
  calculateGIRPercentage,
} from '@/lib/scoreUtils';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Trophy,
  Target,
  Flag,
  CheckCircle,
  XCircle,
  TrendingUp,
  Activity,
} from 'lucide-react';

import type { FirebaseScore, FirebaseHoleScore } from '@/types/scores';

export default function ScoreDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [score, setScore] = useState<FirebaseScore | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const scoreId = params.id as string;

  useEffect(() => {
    if (user && scoreId) {
      loadScore();
    }
  }, [user, scoreId]);

  const loadScore = async () => {
    if (!user || !scoreId) return;

    setLoading(true);
    setError(null);

    try {
      const scoreData = await firebaseService.getScore(user.uid, scoreId);
      if (!scoreData) {
        setError('Score not found');
      } else {
        setScore(scoreData);
      }
    } catch (err: any) {
      console.error('Error loading score:', err);
      setError(err.message || 'Failed to load score. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const splitHoles = (holes: FirebaseHoleScore[]) => {
    const front9 = holes.filter(h => h.holeNumber <= 9);
    const back9 = holes.filter(h => h.holeNumber > 9);
    return { front9, back9 };
  };

  const calculateNineStats = (holes: FirebaseHoleScore[]) => {
    const totalStrokes = holes.reduce((sum, h) => sum + h.strokes, 0);
    const totalPar = holes.reduce((sum, h) => sum + h.par, 0);
    const totalPutts = holes.reduce((sum, h) => sum + h.putts, 0);
    return { totalStrokes, totalPar, totalPutts };
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </ProtectedRoute>
    );
  }

  if (error || !score) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-background">
          <Navigation />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32">
            <Card className="p-8 text-center">
              <Activity className="w-12 h-12 text-error mx-auto mb-4" />
              <p className="text-error text-lg mb-4">{error || 'Score not found'}</p>
              <Button onClick={() => router.push('/scores')}>
                Back to Scores
              </Button>
            </Card>
          </div>
          <Footer />
        </div>
      </ProtectedRoute>
    );
  }

  const { front9, back9 } = splitHoles(score.holes);
  const front9Stats = calculateNineStats(front9);
  const back9Stats = calculateNineStats(back9);
  const firPercentage = calculateFIRPercentage(score.stats.fairwaysHit, score.stats.fairwaysTotal);
  const girPercentage = calculateGIRPercentage(score.stats.greensInRegulation, score.stats.greensTotal);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Navigation />

        {/* Header */}
        <section className="pt-32 pb-8 bg-gradient-to-b from-primary/10 to-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Button
              variant="ghost"
              onClick={() => router.push('/scores')}
              className="mb-6"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Scores
            </Button>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Trophy className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h1 className="text-3xl md:text-4xl font-bold text-text-primary mb-2">
                    {score.course.name}
                  </h1>
                  <div className="flex flex-wrap gap-4 text-text-secondary">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(score.date)}</span>
                    </div>
                    {score.course.city && score.course.state && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span>{score.course.city}, {score.course.state}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Flag className="w-4 h-4" />
                      <span>{score.tee.name} Tees • {score.tee.yardage} yards</span>
                    </div>
                  </div>
                </div>
              </div>

              {score.ghinStatus.posted && (
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-success/20 border border-success rounded-lg text-success">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">Posted to GHIN</span>
                  {score.ghinStatus.postDate && (
                    <span className="text-sm">• {formatDate(score.ghinStatus.postDate)}</span>
                  )}
                </div>
              )}
            </motion.div>
          </div>
        </section>

        {/* Score Summary */}
        <section className="py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="p-6 text-center">
                <div className="text-sm text-text-muted uppercase tracking-wide mb-2">
                  Score
                </div>
                <div className="text-4xl font-bold text-text-primary mb-1">
                  {score.stats.grossScore}
                </div>
                <div
                  className="text-lg font-medium"
                  style={{ color: getScoreColor(score.stats.grossScore, score.tee.par) }}
                >
                  {formatScoreToPar(score.stats.scoreToPar)}
                </div>
              </Card>

              <Card className="p-6 text-center">
                <div className="text-sm text-text-muted uppercase tracking-wide mb-2">
                  Differential
                </div>
                <div className="text-4xl font-bold text-primary">
                  {score.stats.scoreDifferential.toFixed(1)}
                </div>
              </Card>

              <Card className="p-6 text-center">
                <div className="text-sm text-text-muted uppercase tracking-wide mb-2">
                  Total Putts
                </div>
                <div className="text-4xl font-bold text-text-primary">
                  {score.stats.totalPutts}
                </div>
                {score.stats.puttsPerHole && (
                  <div className="text-sm text-text-secondary">
                    {score.stats.puttsPerHole.toFixed(1)} per hole
                  </div>
                )}
              </Card>

              <Card className="p-6 text-center">
                <div className="text-sm text-text-muted uppercase tracking-wide mb-2">
                  Penalties
                </div>
                <div className="text-4xl font-bold text-text-primary">
                  {score.stats.penalties}
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* Statistics */}
        <section className="py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Card className="p-6">
              <h2 className="text-xl font-bold text-text-primary mb-6">Statistics</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* FIR */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-text-secondary">Fairways in Regulation</span>
                    <span className="font-bold text-text-primary">
                      {score.stats.fairwaysHit} / {score.stats.fairwaysTotal}
                    </span>
                  </div>
                  <div className="w-full bg-secondary-800 rounded-full h-3">
                    <div
                      className="bg-primary rounded-full h-3 transition-all"
                      style={{ width: `${firPercentage}%` }}
                    />
                  </div>
                  <div className="text-right text-sm text-text-muted mt-1">
                    {firPercentage}%
                  </div>
                </div>

                {/* GIR */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-text-secondary">Greens in Regulation</span>
                    <span className="font-bold text-text-primary">
                      {score.stats.greensInRegulation} / {score.stats.greensTotal}
                    </span>
                  </div>
                  <div className="w-full bg-secondary-800 rounded-full h-3">
                    <div
                      className="bg-success rounded-full h-3 transition-all"
                      style={{ width: `${girPercentage}%` }}
                    />
                  </div>
                  <div className="text-right text-sm text-text-muted mt-1">
                    {girPercentage}%
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </section>

        {/* Scorecard */}
        <section className="py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-text-primary mb-6">Scorecard</h2>

            {/* Front 9 */}
            {front9.length > 0 && (
              <Card className="mb-6 overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-secondary-700">
                      <th className="px-4 py-3 text-left text-sm font-medium text-text-muted">
                        Hole
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-text-muted">
                        Par
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-text-muted">
                        Yards
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-text-muted">
                        Score
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-text-muted">
                        Putts
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-text-muted">
                        FIR
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-text-muted">
                        GIR
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {front9.map((hole) => (
                      <tr key={hole.holeNumber} className="border-b border-secondary-800/50">
                        <td className="px-4 py-3 font-medium text-text-primary">
                          {hole.holeNumber}
                        </td>
                        <td className="px-4 py-3 text-center text-text-secondary">
                          {hole.par}
                        </td>
                        <td className="px-4 py-3 text-center text-text-secondary">
                          {hole.yardage}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className="inline-flex items-center justify-center w-10 h-10 rounded-full font-bold text-white"
                            style={{ backgroundColor: getScoreColor(hole.strokes, hole.par) }}
                            title={getScoreName(hole.strokes, hole.par)}
                          >
                            {hole.strokes}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center text-text-primary">
                          {hole.putts}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {hole.par >= 4 && (
                            hole.fairwayHit ? (
                              <CheckCircle className="w-5 h-5 text-success mx-auto" />
                            ) : (
                              <XCircle className="w-5 h-5 text-error mx-auto" />
                            )
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {hole.greenInRegulation ? (
                            <CheckCircle className="w-5 h-5 text-success mx-auto" />
                          ) : (
                            <XCircle className="w-5 h-5 text-error mx-auto" />
                          )}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-secondary-800/30 font-bold">
                      <td className="px-4 py-3 text-text-primary">Out</td>
                      <td className="px-4 py-3 text-center text-text-primary">
                        {front9Stats.totalPar}
                      </td>
                      <td className="px-4 py-3 text-center text-text-secondary">-</td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className="font-bold text-lg"
                          style={{ color: getScoreColor(front9Stats.totalStrokes, front9Stats.totalPar) }}
                        >
                          {front9Stats.totalStrokes}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-text-primary">
                        {front9Stats.totalPutts}
                      </td>
                      <td className="px-4 py-3"></td>
                      <td className="px-4 py-3"></td>
                    </tr>
                  </tbody>
                </table>
              </Card>
            )}

            {/* Back 9 */}
            {back9.length > 0 && (
              <Card className="mb-6 overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-secondary-700">
                      <th className="px-4 py-3 text-left text-sm font-medium text-text-muted">
                        Hole
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-text-muted">
                        Par
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-text-muted">
                        Yards
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-text-muted">
                        Score
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-text-muted">
                        Putts
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-text-muted">
                        FIR
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-text-muted">
                        GIR
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {back9.map((hole) => (
                      <tr key={hole.holeNumber} className="border-b border-secondary-800/50">
                        <td className="px-4 py-3 font-medium text-text-primary">
                          {hole.holeNumber}
                        </td>
                        <td className="px-4 py-3 text-center text-text-secondary">
                          {hole.par}
                        </td>
                        <td className="px-4 py-3 text-center text-text-secondary">
                          {hole.yardage}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className="inline-flex items-center justify-center w-10 h-10 rounded-full font-bold text-white"
                            style={{ backgroundColor: getScoreColor(hole.strokes, hole.par) }}
                            title={getScoreName(hole.strokes, hole.par)}
                          >
                            {hole.strokes}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center text-text-primary">
                          {hole.putts}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {hole.par >= 4 && (
                            hole.fairwayHit ? (
                              <CheckCircle className="w-5 h-5 text-success mx-auto" />
                            ) : (
                              <XCircle className="w-5 h-5 text-error mx-auto" />
                            )
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {hole.greenInRegulation ? (
                            <CheckCircle className="w-5 h-5 text-success mx-auto" />
                          ) : (
                            <XCircle className="w-5 h-5 text-error mx-auto" />
                          )}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-secondary-800/30 font-bold">
                      <td className="px-4 py-3 text-text-primary">In</td>
                      <td className="px-4 py-3 text-center text-text-primary">
                        {back9Stats.totalPar}
                      </td>
                      <td className="px-4 py-3 text-center text-text-secondary">-</td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className="font-bold text-lg"
                          style={{ color: getScoreColor(back9Stats.totalStrokes, back9Stats.totalPar) }}
                        >
                          {back9Stats.totalStrokes}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-text-primary">
                        {back9Stats.totalPutts}
                      </td>
                      <td className="px-4 py-3"></td>
                      <td className="px-4 py-3"></td>
                    </tr>
                  </tbody>
                </table>
              </Card>
            )}

            {/* Total */}
            <Card className="p-6 bg-primary/10 border-primary/30">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-text-muted uppercase tracking-wide mb-1">
                    Total
                  </div>
                  <div className="flex items-baseline gap-4">
                    <span className="text-4xl font-bold text-text-primary">
                      {score.stats.grossScore}
                    </span>
                    <span
                      className="text-2xl font-bold"
                      style={{ color: getScoreColor(score.stats.grossScore, score.tee.par) }}
                    >
                      {formatScoreToPar(score.stats.scoreToPar)}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-text-muted uppercase tracking-wide mb-1">
                    Par
                  </div>
                  <div className="text-3xl font-bold text-text-primary">
                    {score.tee.par}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </section>

        <Footer />
      </div>
    </ProtectedRoute>
  );
}
