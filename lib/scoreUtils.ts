/**
 * Score Utility Functions
 * Calculations and formatting for golf scores
 */

import type { FirebaseScore, ScoreDisplay, UserStatistics, CourseStatistics } from '@/types/scores';

/**
 * Get score color based on score relative to par
 */
export function getScoreColor(strokes: number, par: number): string {
  const diff = strokes - par;

  if (diff <= -2) return '#FFD700';  // Gold - Eagle or better
  if (diff === -1) return '#00C875'; // Green - Birdie
  if (diff === 0) return '#333333';  // Black - Par
  if (diff === 1) return '#FFA500';  // Orange - Bogey
  return '#FF4444';                  // Red - Double+
}

/**
 * Get score name (Eagle, Birdie, Par, etc.)
 */
export function getScoreName(strokes: number, par: number): string {
  const diff = strokes - par;

  if (diff <= -3) return 'Albatross';
  if (diff === -2) return 'Eagle';
  if (diff === -1) return 'Birdie';
  if (diff === 0) return 'Par';
  if (diff === 1) return 'Bogey';
  if (diff === 2) return 'Double';
  if (diff === 3) return 'Triple';
  return `+${diff}`;
}

/**
 * Get full score display info (color, name, diff)
 */
export function getScoreDisplay(strokes: number, par: number): ScoreDisplay {
  const diff = strokes - par;

  return {
    color: getScoreColor(strokes, par),
    name: getScoreName(strokes, par),
    diff,
  };
}

/**
 * Calculate score differential using WHS formula
 * Differential = (113 / Slope) * (Adjusted Gross Score - Course Rating)
 */
export function calculateDifferential(
  adjustedGrossScore: number,
  courseRating: number,
  slope: number
): number {
  const differential = (113 / slope) * (adjustedGrossScore - courseRating);
  return Math.round(differential * 10) / 10; // Round to 1 decimal
}

/**
 * Calculate max score for a hole (Net Double Bogey)
 */
export function calculateMaxScore(
  par: number,
  strokesReceived: number
): number {
  return par + 2 + strokesReceived;
}

/**
 * Calculate FIR percentage
 */
export function calculateFIRPercentage(
  fairwaysHit: number,
  fairwaysTotal: number
): number {
  if (fairwaysTotal === 0) return 0;
  return Math.round((fairwaysHit / fairwaysTotal) * 100);
}

/**
 * Calculate GIR percentage
 */
export function calculateGIRPercentage(
  greensInRegulation: number,
  greensTotal: number
): number {
  if (greensTotal === 0) return 0;
  return Math.round((greensInRegulation / greensTotal) * 100);
}

/**
 * Calculate estimated handicap from best differentials
 * WHS uses best 8 of last 20 differentials
 */
export function calculateEstimatedHandicap(differentials: number[]): number {
  if (differentials.length === 0) return 0;

  // Sort ascending
  const sorted = [...differentials].sort((a, b) => a - b);

  // Determine how many to use based on total rounds
  let countToUse = 1;
  if (sorted.length >= 20) countToUse = 8;
  else if (sorted.length >= 19) countToUse = 7;
  else if (sorted.length >= 17) countToUse = 6;
  else if (sorted.length >= 15) countToUse = 5;
  else if (sorted.length >= 13) countToUse = 4;
  else if (sorted.length >= 11) countToUse = 3;
  else if (sorted.length >= 9) countToUse = 2;
  else if (sorted.length >= 7) countToUse = 1;
  else if (sorted.length >= 5) countToUse = 1;
  else if (sorted.length >= 3) countToUse = 1;

  // Average the best differentials
  const bestDiffs = sorted.slice(0, countToUse);
  const average = bestDiffs.reduce((sum, diff) => sum + diff, 0) / bestDiffs.length;

  return Math.round(average * 10) / 10;
}

/**
 * Format date for display
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format score with sign (e.g., +5, -2, E)
 */
export function formatScoreToPar(scoreToPar: number): string {
  if (scoreToPar === 0) return 'E';
  if (scoreToPar > 0) return `+${scoreToPar}`;
  return `${scoreToPar}`;
}

/**
 * Calculate user statistics from scores
 */
export function calculateUserStatistics(scores: FirebaseScore[]): UserStatistics {
  if (scores.length === 0) {
    return {
      totalRounds: 0,
      averageScore: 0,
      lowestScore: 0,
      highestScore: 0,
      averageDifferential: 0,
      estimatedHandicap: 0,
      fairwayPercentage: 0,
      girPercentage: 0,
      averagePutts: 0,
      totalPenalties: 0,
      birdiesOrBetter: 0,
      pars: 0,
      bogeys: 0,
      doubleBogeyOrWorse: 0,
    };
  }

  const grossScores = scores.map(s => s.stats.grossScore);
  const differentials = scores.map(s => s.stats.scoreDifferential);

  // Score stats
  const totalRounds = scores.length;
  const averageScore = grossScores.reduce((sum, s) => sum + s, 0) / totalRounds;
  const lowestScore = Math.min(...grossScores);
  const highestScore = Math.max(...grossScores);
  const averageDifferential = differentials.reduce((sum, d) => sum + d, 0) / totalRounds;
  const estimatedHandicap = calculateEstimatedHandicap(differentials);

  // Counting stats
  let totalFairways = 0;
  let totalFairwaysHit = 0;
  let totalGreens = 0;
  let totalGreensHit = 0;
  let totalPutts = 0;
  let totalPenalties = 0;

  // Score distribution
  let birdiesOrBetter = 0;
  let pars = 0;
  let bogeys = 0;
  let doubleBogeyOrWorse = 0;

  scores.forEach(score => {
    totalFairways += score.stats.fairwaysTotal;
    totalFairwaysHit += score.stats.fairwaysHit;
    totalGreens += score.stats.greensTotal;
    totalGreensHit += score.stats.greensInRegulation;
    totalPutts += score.stats.totalPutts;
    totalPenalties += score.stats.penalties;

    // Count score types
    score.holes.forEach(hole => {
      const diff = hole.strokes - hole.par;
      if (diff <= -1) birdiesOrBetter++;
      else if (diff === 0) pars++;
      else if (diff === 1) bogeys++;
      else doubleBogeyOrWorse++;
    });
  });

  return {
    totalRounds,
    averageScore: Math.round(averageScore * 10) / 10,
    lowestScore,
    highestScore,
    averageDifferential: Math.round(averageDifferential * 10) / 10,
    estimatedHandicap,
    fairwayPercentage: calculateFIRPercentage(totalFairwaysHit, totalFairways),
    girPercentage: calculateGIRPercentage(totalGreensHit, totalGreens),
    averagePutts: Math.round((totalPutts / totalRounds) * 10) / 10,
    totalPenalties,
    birdiesOrBetter,
    pars,
    bogeys,
    doubleBogeyOrWorse,
  };
}

/**
 * Calculate course-specific statistics
 */
export function calculateCourseStatistics(
  scores: FirebaseScore[],
  courseId: string
): CourseStatistics | null {
  const courseScores = scores.filter(s => s.course.id === courseId);

  if (courseScores.length === 0) return null;

  const grossScores = courseScores.map(s => s.stats.grossScore);
  const dates = courseScores.map(s => s.date);

  return {
    courseId,
    courseName: courseScores[0].course.name,
    roundsPlayed: courseScores.length,
    averageScore: Math.round((grossScores.reduce((sum, s) => sum + s, 0) / courseScores.length) * 10) / 10,
    bestScore: Math.min(...grossScores),
    worstScore: Math.max(...grossScores),
    lastPlayed: Math.max(...dates),
  };
}

/**
 * Group scores by course
 */
export function groupScoresByCourse(scores: FirebaseScore[]): Record<string, FirebaseScore[]> {
  return scores.reduce((acc, score) => {
    const courseId = score.course.id;
    if (!acc[courseId]) {
      acc[courseId] = [];
    }
    acc[courseId].push(score);
    return acc;
  }, {} as Record<string, FirebaseScore[]>);
}
