/**
 * iGolf API Service
 *
 * Wrapper for iGolf API endpoints
 * Documentation: https://viewer.igolf.com/docs
 */

import type {
  Course,
  CourseSearchResult,
  IGolfSearchParams,
  IGolfCourseDetail,
  IGolfScorecardData,
  IGolfHoleData,
  Scorecard,
  Hole,
  HoleYardage,
} from '@/types/course';

const IGOLF_API_BASE = 'https://api.igolf.com/v1';
const IGOLF_VIEWER_BASE = 'https://viewer.igolf.com';

class IGolfService {
  private apiKey: string;
  private secretKey: string;

  constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_IGOLF_API_KEY || '';
    this.secretKey = process.env.IGOLF_SECRET_KEY || '';

    if (!this.apiKey) {
      console.warn('[iGolf Service] API key not configured');
    }
  }

  /**
   * Get authorization headers
   */
  private getHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`,
      'X-iGolf-Secret': this.secretKey,
    };
  }

  /**
   * Make API request to iGolf
   */
  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    try {
      const url = `${IGOLF_API_BASE}${endpoint}`;
      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.getHeaders(),
          ...options?.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`iGolf API Error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('[iGolf Service] Request failed:', error);
      throw error;
    }
  }

  /**
   * Search for golf courses
   */
  async searchCourses(params: IGolfSearchParams): Promise<CourseSearchResult> {
    const queryParams = new URLSearchParams();

    if (params.query) queryParams.append('query', params.query);
    if (params.latitude) queryParams.append('lat', params.latitude.toString());
    if (params.longitude) queryParams.append('lng', params.longitude.toString());
    if (params.radius) queryParams.append('radius', params.radius.toString());
    if (params.holes) queryParams.append('holes', params.holes.toString());
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());

    try {
      const data = await this.request<{
        courses: IGolfCourseDetail[];
        total: number;
        page: number;
        pageSize: number;
      }>(`/courses/search?${queryParams.toString()}`);

      return {
        courses: data.courses.map(this.transformCourse),
        total: data.total,
        page: data.page,
        pageSize: data.pageSize,
      };
    } catch (error) {
      console.error('[iGolf Service] Search failed:', error);
      throw error;
    }
  }

  /**
   * Get course details by ID
   */
  async getCourse(courseId: string): Promise<Course> {
    try {
      const data = await this.request<IGolfCourseDetail>(`/courses/${courseId}`);
      return this.transformCourse(data);
    } catch (error) {
      console.error('[iGolf Service] Get course failed:', error);
      throw error;
    }
  }

  /**
   * Get course scorecard
   */
  async getScorecard(courseId: string): Promise<Scorecard> {
    try {
      const data = await this.request<IGolfScorecardData>(`/courses/${courseId}/scorecard`);
      return this.transformScorecard(data);
    } catch (error) {
      console.error('[iGolf Service] Get scorecard failed:', error);
      throw error;
    }
  }

  /**
   * Get specific hole details
   */
  async getHole(courseId: string, holeNumber: number): Promise<Hole> {
    try {
      const data = await this.request<IGolfHoleData>(
        `/courses/${courseId}/holes/${holeNumber}`
      );
      return this.transformHole(data);
    } catch (error) {
      console.error('[iGolf Service] Get hole failed:', error);
      throw error;
    }
  }

  /**
   * Get nearby courses
   */
  async getNearbyCourses(
    latitude: number,
    longitude: number,
    radiusMiles: number = 25
  ): Promise<Course[]> {
    try {
      const result = await this.searchCourses({
        latitude,
        longitude,
        radius: radiusMiles,
        pageSize: 20,
      });
      return result.courses;
    } catch (error) {
      console.error('[iGolf Service] Get nearby courses failed:', error);
      throw error;
    }
  }

  /**
   * Transform iGolf course data to internal format
   */
  private transformCourse(igolfCourse: IGolfCourseDetail): Course {
    return {
      id: igolfCourse.id,
      name: igolfCourse.name,
      description: igolfCourse.description,
      location: {
        address: igolfCourse.address,
        city: igolfCourse.city,
        state: igolfCourse.state,
        zipCode: '',
        country: igolfCourse.country,
        coordinates: {
          latitude: igolfCourse.latitude,
          longitude: igolfCourse.longitude,
        },
      },
      holes: igolfCourse.holes,
      par: igolfCourse.par,
      rating: igolfCourse.rating,
      slope: igolfCourse.slope,
      phoneNumber: igolfCourse.phoneNumber,
      website: igolfCourse.website,
      imageUrl: `${IGOLF_VIEWER_BASE}/courses/${igolfCourse.id}/thumbnail`,
      thumbnailUrl: `${IGOLF_VIEWER_BASE}/courses/${igolfCourse.id}/thumbnail-sm`,
    };
  }

  /**
   * Transform iGolf scorecard data
   */
  private transformScorecard(igolfScorecard: IGolfScorecardData): Scorecard {
    const holes = igolfScorecard.holes.map(this.transformHole);

    return {
      courseId: igolfScorecard.courseId,
      courseName: igolfScorecard.courseName,
      teeBoxes: igolfScorecard.teeBoxes.map(tb => ({
        name: tb.name,
        color: tb.name.toLowerCase(),
        rating: tb.rating,
        slope: tb.slope,
        totalYardage: tb.totalYardage,
      })),
      holes,
      totalPar: holes.reduce((sum, hole) => sum + hole.par, 0),
    };
  }

  /**
   * Transform iGolf hole data
   */
  private transformHole(igolfHole: IGolfHoleData): Hole {
    const yardages: HoleYardage[] = Object.entries(igolfHole.yardages).map(
      ([teeBox, yardage]) => ({
        teeBox,
        yardage,
        par: igolfHole.par,
        handicap: igolfHole.handicap,
      })
    );

    return {
      id: `hole-${igolfHole.holeNumber}`,
      holeNumber: igolfHole.holeNumber,
      par: igolfHole.par,
      handicap: igolfHole.handicap,
      yardages,
      gpsCoordinates: {
        tee: {
          latitude: igolfHole.gps.teeLatitude,
          longitude: igolfHole.gps.teeLongitude,
        },
        green: {
          latitude: igolfHole.gps.greenLatitude,
          longitude: igolfHole.gps.greenLongitude,
        },
      },
    };
  }

  /**
   * Get 3D viewer script URL
   */
  get3DViewerScriptUrl(): string {
    return `${IGOLF_VIEWER_BASE}/igolf-3d-viewer.js?apiKey=${this.apiKey}`;
  }

  /**
   * Get 3D viewer embed URL for a course
   */
  get3DViewerEmbedUrl(courseId: string, holeNumber?: number): string {
    const params = new URLSearchParams({
      apiKey: this.apiKey,
      courseId,
    });

    if (holeNumber) {
      params.append('hole', holeNumber.toString());
    }

    return `${IGOLF_VIEWER_BASE}/embed?${params.toString()}`;
  }
}

// Export singleton instance
export const igolfService = new IGolfService();
export default igolfService;
