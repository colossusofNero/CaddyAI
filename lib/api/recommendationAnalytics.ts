/**
 * Recommendation Analytics API
 *
 * Fetches and analyzes recommendation tracking data from Firebase
 * Provides insights on user decision-making patterns and outcomes
 */

import { collection, query, where, orderBy, limit, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import type { Shot } from './types';

// ============================================================================
// TYPES
// ============================================================================

export interface RecommendationSnapshot {
  primary: ClubAimRecommendation;
  secondary: ClubAimRecommendation;
  source: 'ai' | 'optimizer' | 'both' | 'manual';
  timestamp: string;
  userDecision: UserDecision;
  adherence: AdherenceAnalysis;
  outcomeAnalysis?: OutcomeAnalysis;
}

export interface ClubAimRecommendation {
  clubName: string;
  clubType: string;
  aimAngleDegrees: number;
  aimPointYards: number;
  expectedValue: number;
  adjustedCarry: number;
  reasoning?: string;
}

export interface UserDecision {
  clubName: string;
  clubType: string;
  aimAngleDegrees?: number;
  aimPointYards?: number;
  declaredInConversation?: boolean;
  conversationExcerpt?: string;
}

export interface AdherenceAnalysis {
  type: 'both' | 'club-only' | 'aim-only' | 'neither' | 'not-applicable';
  followedPrimary: boolean;
  followedSecondary: boolean;
  clubMatched: 'primary' | 'secondary' | 'neither' | 'close';
  aimMatched: 'yes' | 'no' | 'close' | 'not-specified';
  deviationYards?: number;
}

export interface OutcomeAnalysis {
  shotOutcome: 'excellent' | 'good' | 'fair' | 'poor';
  shotResult: 'green' | 'fairway' | 'rough' | 'bunker' | 'water' | 'out-of-bounds';
  distanceFromTarget?: number;
  nextShotLie?: string;
  strokesLostVsRecommendation?: number;
}

export interface ShotWithRecommendation extends Shot {
  recommendationSnapshot?: RecommendationSnapshot;
}

// ============================================================================
// ANALYTICS RESULTS
// ============================================================================

export interface AdherencePattern {
  adherenceType: string;
  count: number;
  percentage: number;
  averageOutcome: number;
  averageStrokesLost: number;
}

export interface ClubSubstitution {
  recommendedClub: string;
  actualClub: string;
  count: number;
  averageOutcome: number;
  troubleRate: number;
}

export interface OutcomeCorrelation {
  followedRecommendation: boolean;
  excellentRate: number;
  goodRate: number;
  fairRate: number;
  poorRate: number;
  troubleRate: number;
  averageStrokesLost: number;
}

export interface RecommendationAnalytics {
  totalShots: number;
  shotsWithRecommendations: number;
  overallAdherenceRate: number;
  primaryFollowRate: number;
  secondaryFollowRate: number;
  adherencePatterns: AdherencePattern[];
  topSubstitutions: ClubSubstitution[];
  outcomeWhenFollowed: OutcomeCorrelation;
  outcomeWhenNotFollowed: OutcomeCorrelation;
  decisionQualityScore: number;
  insights: string[];
}

export interface DateRangeOption {
  days: number | 'all';
  label: string;
}

// ============================================================================
// API CLASS
// ============================================================================

export class RecommendationAnalyticsApi {
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  /**
   * Get shots with recommendations for a date range
   */
  async getShotsWithRecommendations(options?: {
    startDate?: Date;
    endDate?: Date;
    limitCount?: number;
  }): Promise<ShotWithRecommendation[]> {
    const { startDate, endDate, limitCount = 200 } = options || {};

    try {
      if (!db) {
        throw new Error('Firebase is not initialized');
      }

      const shotsRef = collection(db, 'shots', this.userId, 'shots');
      let q = query(
        shotsRef,
        where('recommendationSnapshot', '!=', null),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );

      if (startDate) {
        q = query(q, where('timestamp', '>=', Timestamp.fromDate(startDate)));
      }
      if (endDate) {
        q = query(q, where('timestamp', '<=', Timestamp.fromDate(endDate)));
      }

      const snapshot = await getDocs(q);
      const shots: ShotWithRecommendation[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        shots.push({
          id: doc.id,
          ...data,
        } as ShotWithRecommendation);
      });

      return shots;
    } catch (error) {
      console.error('[RecommendationAnalytics] Error fetching shots:', error);
      return [];
    }
  }

  /**
   * Calculate comprehensive analytics from shots
   */
  async getAnalytics(dateRange: number | 'all' = 30): Promise<RecommendationAnalytics> {
    const startDate = dateRange === 'all' ? undefined : new Date(Date.now() - dateRange * 24 * 60 * 60 * 1000);
    const shots = await this.getShotsWithRecommendations({ startDate });

    return this.calculateAnalytics(shots);
  }

  /**
   * Calculate analytics from shot data
   */
  private calculateAnalytics(shots: ShotWithRecommendation[]): RecommendationAnalytics {
    const shotsWithRecs = shots.filter((s) => s.recommendationSnapshot);
    const totalShots = shots.length;
    const shotsWithRecommendations = shotsWithRecs.length;

    if (shotsWithRecommendations === 0) {
      return this.emptyAnalytics(totalShots);
    }

    // Calculate adherence rates
    const primaryFollows = shotsWithRecs.filter(
      (s) => s.recommendationSnapshot?.adherence.followedPrimary
    ).length;
    const secondaryFollows = shotsWithRecs.filter(
      (s) => s.recommendationSnapshot?.adherence.followedSecondary
    ).length;
    const eitherFollow = shotsWithRecs.filter(
      (s) =>
        s.recommendationSnapshot?.adherence.followedPrimary ||
        s.recommendationSnapshot?.adherence.followedSecondary
    ).length;

    const primaryFollowRate = primaryFollows / shotsWithRecommendations;
    const secondaryFollowRate = secondaryFollows / shotsWithRecommendations;
    const overallAdherenceRate = eitherFollow / shotsWithRecommendations;

    // Adherence patterns
    const adherencePatterns = this.calculateAdherencePatterns(shotsWithRecs);

    // Club substitutions
    const topSubstitutions = this.calculateClubSubstitutions(shotsWithRecs);

    // Outcome correlations
    const followed = shotsWithRecs.filter(
      (s) =>
        s.recommendationSnapshot?.adherence.followedPrimary ||
        s.recommendationSnapshot?.adherence.followedSecondary
    );
    const notFollowed = shotsWithRecs.filter(
      (s) =>
        !s.recommendationSnapshot?.adherence.followedPrimary &&
        !s.recommendationSnapshot?.adherence.followedSecondary
    );

    const outcomeWhenFollowed = this.calculateOutcomeCorrelation(followed, true);
    const outcomeWhenNotFollowed = this.calculateOutcomeCorrelation(notFollowed, false);

    // Decision quality score
    const decisionQualityScore = this.calculateDecisionQuality(
      overallAdherenceRate,
      outcomeWhenFollowed,
      outcomeWhenNotFollowed
    );

    // Generate insights
    const insights = this.generateInsights(
      shotsWithRecs,
      overallAdherenceRate,
      primaryFollowRate,
      outcomeWhenFollowed,
      outcomeWhenNotFollowed,
      topSubstitutions
    );

    return {
      totalShots,
      shotsWithRecommendations,
      overallAdherenceRate,
      primaryFollowRate,
      secondaryFollowRate,
      adherencePatterns,
      topSubstitutions,
      outcomeWhenFollowed,
      outcomeWhenNotFollowed,
      decisionQualityScore,
      insights,
    };
  }

  /**
   * Calculate adherence patterns breakdown
   */
  private calculateAdherencePatterns(shots: ShotWithRecommendation[]): AdherencePattern[] {
    const patterns = new Map<
      string,
      { count: number; outcomes: number[]; strokesLost: number[] }
    >();

    for (const shot of shots) {
      const rec = shot.recommendationSnapshot;
      if (!rec) continue;

      const type = rec.adherence.type;
      if (!patterns.has(type)) {
        patterns.set(type, { count: 0, outcomes: [], strokesLost: [] });
      }

      const pattern = patterns.get(type)!;
      pattern.count++;

      // Convert outcome to numeric score
      if (rec.outcomeAnalysis?.shotOutcome) {
        const outcomeScore = this.outcomeToScore(rec.outcomeAnalysis.shotOutcome);
        pattern.outcomes.push(outcomeScore);
      }

      if (rec.outcomeAnalysis?.strokesLostVsRecommendation) {
        pattern.strokesLost.push(rec.outcomeAnalysis.strokesLostVsRecommendation);
      }
    }

    const result: AdherencePattern[] = [];
    for (const [type, data] of patterns.entries()) {
      result.push({
        adherenceType: type,
        count: data.count,
        percentage: (data.count / shots.length) * 100,
        averageOutcome:
          data.outcomes.reduce((a, b) => a + b, 0) / data.outcomes.length,
        averageStrokesLost:
          data.strokesLost.length > 0
            ? data.strokesLost.reduce((a, b) => a + b, 0) / data.strokesLost.length
            : 0,
      });
    }

    return result.sort((a, b) => b.count - a.count);
  }

  /**
   * Calculate club substitution patterns
   */
  private calculateClubSubstitutions(shots: ShotWithRecommendation[]): ClubSubstitution[] {
    const substitutions = new Map<
      string,
      {
        count: number;
        outcomes: number[];
        troubleCount: number;
      }
    >();

    for (const shot of shots) {
      const rec = shot.recommendationSnapshot;
      if (!rec) continue;

      // Only track when user didn't follow primary recommendation
      if (rec.adherence.followedPrimary) continue;

      const key = `${rec.primary.clubName} → ${rec.userDecision.clubName}`;
      if (!substitutions.has(key)) {
        substitutions.set(key, { count: 0, outcomes: [], troubleCount: 0 });
      }

      const sub = substitutions.get(key)!;
      sub.count++;
      if (rec.outcomeAnalysis?.shotOutcome) {
        sub.outcomes.push(this.outcomeToScore(rec.outcomeAnalysis.shotOutcome));
      }

      if (
        shot.result === 'bunker' ||
        shot.result === 'water' ||
        shot.result === 'OB'
      ) {
        sub.troubleCount++;
      }
    }

    const result: ClubSubstitution[] = [];
    for (const [key, data] of substitutions.entries()) {
      const [recommended, actual] = key.split(' → ');
      result.push({
        recommendedClub: recommended,
        actualClub: actual,
        count: data.count,
        averageOutcome:
          data.outcomes.reduce((a, b) => a + b, 0) / data.outcomes.length,
        troubleRate: (data.troubleCount / data.count) * 100,
      });
    }

    // Return top 10 most common substitutions
    return result.sort((a, b) => b.count - a.count).slice(0, 10);
  }

  /**
   * Calculate outcome correlation
   */
  private calculateOutcomeCorrelation(
    shots: ShotWithRecommendation[],
    followed: boolean
  ): OutcomeCorrelation {
    if (shots.length === 0) {
      return {
        followedRecommendation: followed,
        excellentRate: 0,
        goodRate: 0,
        fairRate: 0,
        poorRate: 0,
        troubleRate: 0,
        averageStrokesLost: 0,
      };
    }

    const excellent = shots.filter((s) => s.recommendationSnapshot?.outcomeAnalysis?.shotOutcome === 'excellent').length;
    const good = shots.filter((s) => s.recommendationSnapshot?.outcomeAnalysis?.shotOutcome === 'good').length;
    const fair = shots.filter((s) => s.recommendationSnapshot?.outcomeAnalysis?.shotOutcome === 'fair').length;
    const poor = shots.filter((s) => s.recommendationSnapshot?.outcomeAnalysis?.shotOutcome === 'poor').length;
    const trouble = shots.filter(
      (s) =>
        s.result === 'bunker' ||
        s.result === 'water' ||
        s.result === 'OB'
    ).length;

    const strokesLost = shots
      .filter(
        (s) =>
          s.recommendationSnapshot?.outcomeAnalysis?.strokesLostVsRecommendation
      )
      .map(
        (s) =>
          s.recommendationSnapshot!.outcomeAnalysis!.strokesLostVsRecommendation!
      );

    const avgStrokesLost =
      strokesLost.length > 0
        ? strokesLost.reduce((a, b) => a + b, 0) / strokesLost.length
        : 0;

    return {
      followedRecommendation: followed,
      excellentRate: (excellent / shots.length) * 100,
      goodRate: (good / shots.length) * 100,
      fairRate: (fair / shots.length) * 100,
      poorRate: (poor / shots.length) * 100,
      troubleRate: (trouble / shots.length) * 100,
      averageStrokesLost: avgStrokesLost,
    };
  }

  /**
   * Calculate decision quality score (0-100)
   */
  private calculateDecisionQuality(
    adherenceRate: number,
    followedOutcomes: OutcomeCorrelation,
    notFollowedOutcomes: OutcomeCorrelation
  ): number {
    // Base score from adherence rate
    let score = adherenceRate * 40; // Max 40 points

    // Bonus for good outcomes when following recommendations
    const followedSuccess = followedOutcomes.excellentRate + followedOutcomes.goodRate;
    score += (followedSuccess / 100) * 30; // Max 30 points

    // Penalty for trouble when not following recommendations
    const notFollowedTrouble = notFollowedOutcomes.troubleRate;
    score -= (notFollowedTrouble / 100) * 20; // Max -20 points

    // Bonus for low strokes lost
    const avgStrokesLost =
      followedOutcomes.averageStrokesLost * 0.5 +
      notFollowedOutcomes.averageStrokesLost * 0.5;
    score += Math.max(0, 30 - avgStrokesLost * 10); // Max 30 points

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  /**
   * Generate insights from analytics
   */
  private generateInsights(
    shots: ShotWithRecommendation[],
    adherenceRate: number,
    primaryFollowRate: number,
    followedOutcomes: OutcomeCorrelation,
    notFollowedOutcomes: OutcomeCorrelation,
    substitutions: ClubSubstitution[]
  ): string[] {
    const insights: string[] = [];

    // Adherence insight
    if (adherenceRate < 0.5) {
      insights.push(
        `You're following recommendations only ${(adherenceRate * 100).toFixed(0)}% of the time. Consider trusting the AI more - it's based on thousands of data points.`
      );
    } else if (adherenceRate > 0.8) {
      insights.push(
        `Great! You're following recommendations ${(adherenceRate * 100).toFixed(0)}% of the time. This shows strong trust in data-driven decisions.`
      );
    }

    // Outcome comparison
    const followedSuccess =
      followedOutcomes.excellentRate + followedOutcomes.goodRate;
    const notFollowedSuccess =
      notFollowedOutcomes.excellentRate + notFollowedOutcomes.goodRate;

    if (followedSuccess > notFollowedSuccess + 10) {
      const diff = (followedSuccess - notFollowedSuccess).toFixed(0);
      insights.push(
        `When you follow recommendations, your success rate is ${diff}% higher (${followedSuccess.toFixed(0)}% vs ${notFollowedSuccess.toFixed(0)}%).`
      );
    }

    // Trouble rate comparison
    if (notFollowedOutcomes.troubleRate > followedOutcomes.troubleRate + 10) {
      const diff = (
        notFollowedOutcomes.troubleRate - followedOutcomes.troubleRate
      ).toFixed(0);
      insights.push(
        `Going against recommendations leads to ${diff}% more trouble shots (bunkers, water, OB).`
      );
    }

    // Common substitutions
    if (substitutions.length > 0) {
      const worst = substitutions.sort((a, b) => b.troubleRate - a.troubleRate)[0];
      if (worst.troubleRate > 30) {
        insights.push(
          `Watch out: Choosing ${worst.actualClub} instead of ${worst.recommendedClub} leads to trouble ${worst.troubleRate.toFixed(0)}% of the time.`
        );
      }
    }

    // Strokes lost
    if (notFollowedOutcomes.averageStrokesLost > 0.5) {
      insights.push(
        `On average, you lose ${notFollowedOutcomes.averageStrokesLost.toFixed(1)} strokes per round by not following recommendations.`
      );
    }

    return insights;
  }

  /**
   * Convert outcome to numeric score
   */
  private outcomeToScore(outcome: 'excellent' | 'good' | 'fair' | 'poor'): number {
    switch (outcome) {
      case 'excellent':
        return 4;
      case 'good':
        return 3;
      case 'fair':
        return 2;
      case 'poor':
        return 1;
      default:
        return 0;
    }
  }

  /**
   * Empty analytics structure
   */
  private emptyAnalytics(totalShots: number): RecommendationAnalytics {
    return {
      totalShots,
      shotsWithRecommendations: 0,
      overallAdherenceRate: 0,
      primaryFollowRate: 0,
      secondaryFollowRate: 0,
      adherencePatterns: [],
      topSubstitutions: [],
      outcomeWhenFollowed: {
        followedRecommendation: true,
        excellentRate: 0,
        goodRate: 0,
        fairRate: 0,
        poorRate: 0,
        troubleRate: 0,
        averageStrokesLost: 0,
      },
      outcomeWhenNotFollowed: {
        followedRecommendation: false,
        excellentRate: 0,
        goodRate: 0,
        fairRate: 0,
        poorRate: 0,
        troubleRate: 0,
        averageStrokesLost: 0,
      },
      decisionQualityScore: 0,
      insights: ['Start using AI recommendations to build your analytics!'],
    };
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export const DATE_RANGE_OPTIONS: DateRangeOption[] = [
  { days: 7, label: 'Last 7 days' },
  { days: 30, label: 'Last 30 days' },
  { days: 90, label: 'Last 90 days' },
  { days: 'all', label: 'All time' },
];

export function getDateRangeLabel(days: number | 'all'): string {
  const option = DATE_RANGE_OPTIONS.find((o) => o.days === days);
  return option?.label || 'Custom';
}
