/**
 * Quad Analysis Service
 *
 * Analyzes recommendation quality by comparing:
 * - User adherence (followed vs didn't follow)
 * - Shot outcome (good vs bad)
 *
 * Creates a 2x2 matrix (quad) to identify patterns:
 * 1. Followed + Good = Trust & Validate
 * 2. Followed + Bad = Questionable Recommendations
 * 3. Didn't Follow + Good = User Expertise
 * 4. Didn't Follow + Bad = Should Have Followed
 */

import { recommendationTrackingService, RecommendationEvent } from './recommendationTrackingService';

export interface QuadData {
  count: number;
  percentage: number;
  averageDistance: number;
  examples: Array<{
    eventId: string;
    holeNumber: number;
    recommendedClub: string;
    chosenClub: string;
    outcome: string;
    landingArea: string;
  }>;
}

export interface QuadAnalysis {
  // Quad 1: Followed + Good
  trustAndValidate: QuadData;

  // Quad 2: Followed + Bad
  questionableRecommendations: QuadData;

  // Quad 3: Didn't Follow + Good
  userExpertise: QuadData;

  // Quad 4: Didn't Follow + Bad
  shouldHaveFollowed: QuadData;

  // Overall metrics
  totalEvents: number;
  adherenceRate: number;
  successRate: number;

  // Insights
  dominantQuadrant: 'trust-validate' | 'questionable' | 'user-expertise' | 'should-follow';
  confidenceScore: number; // 0-100, how much to trust recommendations
  insights: string[];
  recommendations: string[];
}

export class QuadAnalysisService {
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  /**
   * Analyze recommendation quality using quad analysis
   */
  async analyzeQuadrants(dateRange: 'week' | 'month' | 'all' = 'all'): Promise<QuadAnalysis> {
    // Get events with decisions and outcomes
    const events = await recommendationTrackingService.getRecommendations(this.userId, {
      dateRange,
      requireDecision: true,
      requireOutcome: true,
    });

    if (events.length === 0) {
      return this.getEmptyAnalysis();
    }

    // Initialize quad data
    const quads = {
      trustAndValidate: this.createEmptyQuadData(),
      questionableRecommendations: this.createEmptyQuadData(),
      userExpertise: this.createEmptyQuadData(),
      shouldHaveFollowed: this.createEmptyQuadData(),
    };

    // Classify each event into a quadrant
    for (const event of events) {
      if (!event.userDecision || !event.outcome) continue;

      const followed = this.didFollowRecommendation(event);
      const goodOutcome = this.isGoodOutcome(event);

      const quad = this.getQuadrant(followed, goodOutcome);
      this.addToQuad(quads[quad], event);
    }

    // Calculate percentages
    const totalEvents = events.length;
    for (const quadKey of Object.keys(quads)) {
      const quad = quads[quadKey as keyof typeof quads];
      quad.percentage = (quad.count / totalEvents) * 100;
    }

    // Calculate metrics
    const adherenceRate =
      ((quads.trustAndValidate.count + quads.questionableRecommendations.count) / totalEvents) * 100;
    const successRate =
      ((quads.trustAndValidate.count + quads.userExpertise.count) / totalEvents) * 100;

    // Determine dominant quadrant
    const dominantQuadrant = this.getDominantQuadrant(quads);

    // Calculate confidence score
    const confidenceScore = this.calculateConfidenceScore(quads, totalEvents);

    // Generate insights
    const insights = this.generateInsights(quads, adherenceRate, successRate);

    // Generate recommendations
    const recommendations = this.generateRecommendations(quads, dominantQuadrant, confidenceScore);

    return {
      ...quads,
      totalEvents,
      adherenceRate,
      successRate,
      dominantQuadrant,
      confidenceScore,
      insights,
      recommendations,
    };
  }

  private createEmptyQuadData(): QuadData {
    return {
      count: 0,
      percentage: 0,
      averageDistance: 0,
      examples: [],
    };
  }

  private didFollowRecommendation(event: RecommendationEvent): boolean {
    if (!event.userDecision) return false;
    return (
      event.userDecision.decisionType === 'followed-primary' ||
      event.userDecision.decisionType === 'followed-secondary'
    );
  }

  private isGoodOutcome(event: RecommendationEvent): boolean {
    if (!event.outcome) return false;
    return event.outcome.outcome === 'excellent' || event.outcome.outcome === 'good';
  }

  private getQuadrant(
    followed: boolean,
    goodOutcome: boolean
  ): 'trustAndValidate' | 'questionableRecommendations' | 'userExpertise' | 'shouldHaveFollowed' {
    if (followed && goodOutcome) return 'trustAndValidate';
    if (followed && !goodOutcome) return 'questionableRecommendations';
    if (!followed && goodOutcome) return 'userExpertise';
    return 'shouldHaveFollowed';
  }

  private addToQuad(quad: QuadData, event: RecommendationEvent) {
    quad.count++;

    // Add to examples (keep max 5)
    if (quad.examples.length < 5) {
      quad.examples.push({
        eventId: event.id,
        holeNumber: event.holeNumber || 0,
        recommendedClub: event.recommendations[0]?.clubName || 'Unknown',
        chosenClub: event.userDecision?.chosenClubName || 'Unknown',
        outcome: event.outcome?.outcome || 'unknown',
        landingArea: event.outcome?.landingArea || 'unknown',
      });
    }

    // Calculate average distance
    if (event.outcome?.actualDistanceYards) {
      const prevTotal = quad.averageDistance * (quad.count - 1);
      quad.averageDistance = (prevTotal + event.outcome.actualDistanceYards) / quad.count;
    }
  }

  private getDominantQuadrant(quads: {
    trustAndValidate: QuadData;
    questionableRecommendations: QuadData;
    userExpertise: QuadData;
    shouldHaveFollowed: QuadData;
  }): 'trust-validate' | 'questionable' | 'user-expertise' | 'should-follow' {
    const counts = {
      'trust-validate': quads.trustAndValidate.count,
      questionable: quads.questionableRecommendations.count,
      'user-expertise': quads.userExpertise.count,
      'should-follow': quads.shouldHaveFollowed.count,
    };

    return (Object.keys(counts) as Array<keyof typeof counts>).reduce((a, b) =>
      counts[a] > counts[b] ? a : b
    );
  }

  private calculateConfidenceScore(
    quads: {
      trustAndValidate: QuadData;
      questionableRecommendations: QuadData;
      userExpertise: QuadData;
      shouldHaveFollowed: QuadData;
    },
    totalEvents: number
  ): number {
    // High score when:
    // - Many "Trust & Validate" outcomes
    // - Few "Questionable Recommendations"
    // - Many "Should Have Followed"

    const trustScore = (quads.trustAndValidate.count / totalEvents) * 40;
    const questionablePenalty = (quads.questionableRecommendations.count / totalEvents) * -30;
    const shouldFollowScore = (quads.shouldHaveFollowed.count / totalEvents) * 30;
    const userExpertiseNeutral = (quads.userExpertise.count / totalEvents) * 10;

    const rawScore = 50 + trustScore + questionablePenalty + shouldFollowScore + userExpertiseNeutral;

    return Math.max(0, Math.min(100, Math.round(rawScore)));
  }

  private generateInsights(
    quads: {
      trustAndValidate: QuadData;
      questionableRecommendations: QuadData;
      userExpertise: QuadData;
      shouldHaveFollowed: QuadData;
    },
    adherenceRate: number,
    successRate: number
  ): string[] {
    const insights: string[] = [];

    // Trust & Validate insights
    if (quads.trustAndValidate.percentage > 50) {
      insights.push(
        `Strong pattern: ${quads.trustAndValidate.percentage.toFixed(0)}% of shots are "Trust & Validate" (followed recommendation with good outcome). Keep trusting the AI!`
      );
    }

    // Questionable Recommendations insights
    if (quads.questionableRecommendations.percentage > 30) {
      insights.push(
        `Warning: ${quads.questionableRecommendations.percentage.toFixed(0)}% of shots are "Questionable" (followed recommendation with poor outcome). The AI may need recalibration.`
      );
    }

    // User Expertise insights
    if (quads.userExpertise.percentage > 30) {
      insights.push(
        `You have strong course knowledge: ${quads.userExpertise.percentage.toFixed(0)}% of shots show you got better results by ignoring recommendations.`
      );
    }

    // Should Have Followed insights
    if (quads.shouldHaveFollowed.percentage > 30) {
      insights.push(
        `Opportunity: ${quads.shouldHaveFollowed.percentage.toFixed(0)}% of shots suggest you should trust the AI more. Following recommendations could improve your game.`
      );
    }

    // Adherence insights
    if (adherenceRate < 40) {
      insights.push(
        `Low adherence rate (${adherenceRate.toFixed(0)}%). Consider following recommendations more often to see if it improves your results.`
      );
    } else if (adherenceRate > 70) {
      insights.push(
        `High adherence rate (${adherenceRate.toFixed(0)}%). You trust the AI recommendations.`
      );
    }

    // Success insights
    if (successRate > 70) {
      insights.push(`Excellent success rate (${successRate.toFixed(0)}%). Your decision-making is working well.`);
    } else if (successRate < 40) {
      insights.push(`Low success rate (${successRate.toFixed(0)}%). Consider adjusting your strategy.`);
    }

    return insights;
  }

  private generateRecommendations(
    quads: {
      trustAndValidate: QuadData;
      questionableRecommendations: QuadData;
      userExpertise: QuadData;
      shouldHaveFollowed: QuadData;
    },
    dominantQuadrant: string,
    confidenceScore: number
  ): string[] {
    const recommendations: string[] = [];

    if (dominantQuadrant === 'trust-validate') {
      recommendations.push('Your current approach is working well. Continue trusting the AI recommendations.');
      recommendations.push('Consider tracking more shots to build a larger data set for analysis.');
    } else if (dominantQuadrant === 'questionable') {
      recommendations.push('Review and update your club distances in settings - they may be inaccurate.');
      recommendations.push('Check weather and wind settings during rounds for more accurate recommendations.');
      recommendations.push('Consider practicing with recommended clubs to validate distances.');
    } else if (dominantQuadrant === 'user-expertise') {
      recommendations.push('You have strong course knowledge. The AI could learn from your decisions.');
      recommendations.push('Consider updating your shot distances based on your actual performance.');
    } else if (dominantQuadrant === 'should-follow') {
      recommendations.push('Try following AI recommendations more often to improve results.');
      recommendations.push('The data shows better outcomes when following recommendations.');
      recommendations.push('Build trust by starting with less critical shots.');
    }

    // Confidence-based recommendations
    if (confidenceScore < 40) {
      recommendations.push('Low confidence in recommendations. Update your club data and try again.');
    } else if (confidenceScore > 80) {
      recommendations.push('High confidence in AI recommendations. You can trust them for important shots.');
    }

    return recommendations;
  }

  private getEmptyAnalysis(): QuadAnalysis {
    return {
      trustAndValidate: this.createEmptyQuadData(),
      questionableRecommendations: this.createEmptyQuadData(),
      userExpertise: this.createEmptyQuadData(),
      shouldHaveFollowed: this.createEmptyQuadData(),
      totalEvents: 0,
      adherenceRate: 0,
      successRate: 0,
      dominantQuadrant: 'trust-validate',
      confidenceScore: 0,
      insights: ['No data available yet. Start tracking recommendations to see analysis.'],
      recommendations: ['Play some rounds and track recommendations to build your quad analysis.'],
    };
  }
}
