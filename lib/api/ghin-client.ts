/**
 * USGA GHIN API Client
 * Handles authentication and requests to GHIN Scorecard APIs
 */

import crypto from 'crypto';
import type {
  GHINTeeDetailsRequest,
  GHINTeeDetailsResponse,
  GHINScorecardDetailsRequest,
  GHINScorecardDetailsResponse,
  GHINScorecardListRequest,
  GHINScorecardListResponse,
  GHINCourseCache,
} from './ghin-types';

interface GHINClientConfig {
  apiKey: string;
  secretKey: string;
  baseUrl?: string;
}

export class GHINClient {
  private apiKey: string;
  private secretKey: string;
  private baseUrl: string;

  constructor(config: GHINClientConfig) {
    this.apiKey = config.apiKey;
    this.secretKey = config.secretKey;
    this.baseUrl = config.baseUrl || 'https://api.igolf.com';
  }

  /**
   * Generate HMAC-SHA256 signature for API authentication
   */
  private generateSignature(action: string, timestamp: string): string {
    const signatureString = `${action}${this.apiKey}${timestamp}${this.secretKey}`;
    return crypto
      .createHmac('sha256', this.secretKey)
      .update(signatureString)
      .digest('hex');
  }

  /**
   * Build authenticated API URL
   */
  private buildUrl(action: string): { url: string; timestamp: string } {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signature = this.generateSignature(action, timestamp);

    const url = `${this.baseUrl}/rest/action/${action}/${this.apiKey}/1.1/2.0/HmacSHA256/${signature}/${timestamp}/JSON`;

    return { url, timestamp };
  }

  /**
   * Make authenticated API request
   */
  private async request<T>(action: string, payload: any): Promise<T> {
    const { url } = this.buildUrl(action);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`GHIN API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json() as T;
      return data;
    } catch (error) {
      console.error(`[GHIN API] Request failed for ${action}:`, error);
      throw error;
    }
  }

  /**
   * Get tee details for a course
   * Returns slope, rating, name, color, yardage for teeboxes
   */
  async getCourseTeeDetails(
    courseId: string,
    detailLevel: '1' | '2' = '2'
  ): Promise<GHINTeeDetailsResponse> {
    const payload: GHINTeeDetailsRequest = {
      id_course: courseId,
      detailLevel,
    };

    return this.request<GHINTeeDetailsResponse>('CourseTeeDetails', payload);
  }

  /**
   * Get scorecard details for a course
   * Returns par and handicap information
   */
  async getCourseScorecardDetails(
    courseId: string
  ): Promise<GHINScorecardDetailsResponse> {
    const payload: GHINScorecardDetailsRequest = {
      id_course: courseId,
    };

    return this.request<GHINScorecardDetailsResponse>(
      'CourseScorecardDetails',
      payload
    );
  }

  /**
   * Get scorecard details for multiple courses (up to 20)
   */
  async getCourseScorecardList(
    courseIds: string[],
    includeCourseName: boolean = true
  ): Promise<GHINScorecardListResponse> {
    if (courseIds.length > 20) {
      throw new Error('Maximum 20 courses allowed per request');
    }

    const payload: GHINScorecardListRequest = {
      id_courseArray: courseIds,
      courseName: includeCourseName ? '1' : '0',
    };

    return this.request<GHINScorecardListResponse>(
      'CourseScorecardList',
      payload
    );
  }

  /**
   * Get complete course data (tees + scorecard) for caching
   */
  async getCompleteCourseData(
    courseId: string,
    courseName: string
  ): Promise<GHINCourseCache> {
    try {
      // Fetch tee details and scorecard in parallel
      const [teeData, scorecardData] = await Promise.all([
        this.getCourseTeeDetails(courseId, '2'),
        this.getCourseScorecardDetails(courseId),
      ]);

      if (teeData.Status !== 1) {
        throw new Error(teeData.ErrorMessage || 'Failed to fetch tee details');
      }

      if (scorecardData.Status !== 1) {
        throw new Error(scorecardData.ErrorMessage || 'Failed to fetch scorecard');
      }

      // Convert to cache format
      const tees = teeData.teesList.map((tee) => ({
        name: tee.teeName,
        color: tee.teeColorName,
        rating: tee.gender === 'men' ? tee.ratingMen : tee.ratingWomen,
        slope: tee.gender === 'men' ? tee.slopeMen : tee.slopeWomen,
        yardage: tee.ydsTotal,
        gender: tee.gender === 'men' ? ('men' as const) : ('women' as const),
      }));

      const menScorecard = scorecardData.menScorecardList[0] || {
        parHole: Array(18).fill(4),
        hcpHole: Array.from({ length: 18 }, (_, i) => i + 1),
      };

      const womenScorecard = scorecardData.wmnScorecardList[0] || menScorecard;

      const cache: GHINCourseCache = {
        ghinCourseId: courseId,
        courseName,
        tees,
        scorecard: {
          menPar: menScorecard.parHole,
          womenPar: womenScorecard.parHole,
          menHandicap: menScorecard.hcpHole,
          womenHandicap: womenScorecard.hcpHole,
        },
        lastFetched: Date.now(),
        expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
      };

      return cache;
    } catch (error) {
      console.error(`[GHIN API] Failed to fetch complete course data:`, error);
      throw error;
    }
  }

  /**
   * Calculate handicap differential
   * Formula: (113 / Slope Rating) × (Adjusted Gross Score − Course Rating)
   */
  calculateHandicapDifferential(
    adjustedGrossScore: number,
    courseRating: number,
    slopeRating: number
  ): number {
    return ((113 / slopeRating) * (adjustedGrossScore - courseRating));
  }

  /**
   * Apply ESC (Equitable Stroke Control) to gross score
   * Based on USGA rules for maximum score per hole
   */
  applyESC(grossScore: number, handicap: number, parValues: number[]): number {
    // ESC max scores by handicap
    const getMaxScore = (holeHandicap: number): number => {
      if (handicap <= 9) return 2; // Double bogey
      if (handicap <= 19) return 7; // 7
      if (handicap <= 29) return 8; // 8
      if (handicap <= 39) return 9; // 9
      return 10; // 10
    };

    // This is simplified - in production you'd adjust each hole individually
    // For now, just ensure reasonable max score
    const maxPerHole = Math.max(...parValues) + getMaxScore(handicap);
    return Math.min(grossScore, maxPerHole * parValues.length);
  }
}

/**
 * Server-side GHIN client instance
 * Uses credentials from environment variables
 */
export function createGHINClient(): GHINClient {
  const apiKey = process.env.GHIN_API_KEY || process.env.IGOLF_API_KEY;
  const secretKey = process.env.GHIN_SECRET_KEY || process.env.IGOLF_SECRET_KEY;

  if (!apiKey || !secretKey) {
    throw new Error(
      'GHIN API credentials not configured. Set GHIN_API_KEY and GHIN_SECRET_KEY environment variables.'
    );
  }

  return new GHINClient({
    apiKey,
    secretKey,
    baseUrl: process.env.GHIN_BASE_URL || 'https://api.igolf.com',
  });
}

export default GHINClient;
