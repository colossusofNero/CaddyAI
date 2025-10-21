/**
 * Courses API
 * Course data management and search functionality
 */

import { ApiClient } from './client';
import type {
  Course,
  SearchCoursesRequest,
  CourseSearchResult,
  Hole,
} from './types';
import { query, where, orderBy, limit, startAt, endAt } from 'firebase/firestore';

class CoursesApi extends ApiClient {
  private readonly COLLECTION = 'courses';
  private readonly HOLES_COLLECTION = 'holes';
  private readonly FAVORITES_COLLECTION = 'favoriteCourses';

  /**
   * Get a single course by ID
   */
  async getCourse(courseId: string): Promise<Course | null> {
    try {
      const course = await this.getDocument<Course>(this.COLLECTION, courseId);
      return course;
    } catch (error) {
      throw this.handleFirebaseError(error);
    }
  }

  /**
   * Search courses by name or location
   */
  async searchCourses(request: SearchCoursesRequest = {}): Promise<CourseSearchResult> {
    try {
      const constraints = [];
      const limitCount = request.limit || 20;

      // Search by query (course name)
      if (request.query) {
        // Firestore doesn't support full-text search, so we use prefix matching
        const query = request.query.toLowerCase();
        constraints.push(
          orderBy('name'),
          startAt(query),
          endAt(query + '\uf8ff')
        );
      } else {
        // Default: order by name
        constraints.push(orderBy('name', 'asc'));
      }

      constraints.push(limit(limitCount + 1)); // Fetch one extra to check hasMore

      const courses = await this.getDocuments<Course>(this.COLLECTION, constraints);

      const hasMore = courses.length > limitCount;
      const results = hasMore ? courses.slice(0, limitCount) : courses;

      // If location is provided, filter by distance
      if (request.location && request.radius) {
        const filtered = this.filterByDistance(
          results,
          request.location.latitude,
          request.location.longitude,
          request.radius
        );

        return {
          courses: filtered,
          total: filtered.length,
          hasMore: false, // Can't determine hasMore after filtering
        };
      }

      console.log(`[CoursesAPI] Found ${results.length} courses`);

      return {
        courses: results,
        total: results.length,
        hasMore,
      };
    } catch (error) {
      throw this.handleFirebaseError(error);
    }
  }

  /**
   * Get courses near a location
   */
  async getCoursesNearby(
    latitude: number,
    longitude: number,
    radiusMiles: number = 25
  ): Promise<Course[]> {
    try {
      // Fetch all courses and filter by distance
      // In production, use a geohashing library or Firebase GeoFire
      const courses = await this.getDocuments<Course>(
        this.COLLECTION,
        [limit(100)]
      );

      const nearby = this.filterByDistance(courses, latitude, longitude, radiusMiles);

      console.log(`[CoursesAPI] Found ${nearby.length} courses within ${radiusMiles} miles`);
      return nearby;
    } catch (error) {
      throw this.handleFirebaseError(error);
    }
  }

  /**
   * Get hole information for a course
   */
  async getCourseHoles(courseId: string): Promise<Hole[]> {
    try {
      const holes = await this.getDocuments<Hole>(
        this.HOLES_COLLECTION,
        [
          this.where('courseId', '==', courseId),
          orderBy('holeNumber', 'asc')
        ]
      );

      return holes;
    } catch (error) {
      throw this.handleFirebaseError(error);
    }
  }

  /**
   * Add course to favorites
   */
  async addFavorite(courseId: string): Promise<void> {
    try {
      const userId = this.getCurrentUserId();
      const course = await this.getCourse(courseId);

      if (!course) {
        throw this.createError('not-found', 'Course not found');
      }

      const favoriteId = `${userId}_${courseId}`;
      const favorite = {
        id: favoriteId,
        userId,
        courseId,
        courseName: course.name,
        location: course.location,
        imageUrl: course.imageUrl,
        addedAt: new Date().toISOString(),
      };

      await this.createDocument(this.FAVORITES_COLLECTION, favorite, favoriteId);

      console.log(`[CoursesAPI] Added course ${courseId} to favorites`);
    } catch (error) {
      throw this.handleFirebaseError(error);
    }
  }

  /**
   * Remove course from favorites
   */
  async removeFavorite(courseId: string): Promise<void> {
    try {
      const userId = this.getCurrentUserId();
      const favoriteId = `${userId}_${courseId}`;

      await this.deleteDocument(this.FAVORITES_COLLECTION, favoriteId);

      console.log(`[CoursesAPI] Removed course ${courseId} from favorites`);
    } catch (error) {
      throw this.handleFirebaseError(error);
    }
  }

  /**
   * Get user's favorite courses
   */
  async getFavorites(): Promise<Course[]> {
    try {
      const userId = this.getCurrentUserId();

      const favorites = await this.getDocuments<any>(
        this.FAVORITES_COLLECTION,
        [
          this.where('userId', '==', userId),
          orderBy('addedAt', 'desc')
        ]
      );

      // Fetch full course details
      const courses = await this.batchOperation(
        favorites,
        async (fav) => {
          const course = await this.getCourse(fav.courseId);
          return course;
        }
      );

      return courses.filter((c): c is Course => c !== null);
    } catch (error) {
      throw this.handleFirebaseError(error);
    }
  }

  /**
   * Check if course is in favorites
   */
  async isFavorite(courseId: string): Promise<boolean> {
    try {
      const userId = this.getCurrentUserId();
      const favoriteId = `${userId}_${courseId}`;

      const favorite = await this.getDocument(this.FAVORITES_COLLECTION, favoriteId);
      return favorite !== null;
    } catch (error) {
      console.error('[CoursesAPI] Error checking favorite:', error);
      return false;
    }
  }

  /**
   * Get popular courses
   */
  async getPopularCourses(limitCount: number = 10): Promise<Course[]> {
    try {
      // In production, this would be based on play count or ratings
      // For now, just return recent courses
      const courses = await this.getDocuments<Course>(
        this.COLLECTION,
        [
          orderBy('createdAt', 'desc'),
          limit(limitCount)
        ]
      );

      return courses;
    } catch (error) {
      throw this.handleFirebaseError(error);
    }
  }

  /**
   * Create a new course (admin function)
   */
  async createCourse(course: Omit<Course, 'id' | 'createdAt' | 'updatedAt'>): Promise<Course> {
    try {
      const now = Date.now();

      const newCourse: Course = {
        ...course,
        id: '',
        createdAt: now,
        updatedAt: now,
      };

      const createdCourse = await this.createDocument<Course>(this.COLLECTION, newCourse);

      console.log(`[CoursesAPI] Created course: ${createdCourse.name}`);
      return createdCourse;
    } catch (error) {
      throw this.handleFirebaseError(error);
    }
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   */
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 3959; // Earth's radius in miles
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Convert degrees to radians
   */
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Filter courses by distance from a location
   */
  private filterByDistance(
    courses: Course[],
    latitude: number,
    longitude: number,
    radiusMiles: number
  ): Course[] {
    return courses
      .map(course => ({
        course,
        distance: this.calculateDistance(
          latitude,
          longitude,
          course.latitude,
          course.longitude
        ),
      }))
      .filter(item => item.distance <= radiusMiles)
      .sort((a, b) => a.distance - b.distance)
      .map(item => item.course);
  }

  /**
   * Get course statistics (times played, average score, etc.)
   */
  async getCourseStatistics(courseId: string): Promise<{
    timesPlayed: number;
    averageScore: number;
    bestScore: number;
    lastPlayed: string | null;
  }> {
    try {
      const userId = this.getCurrentUserId();

      const rounds = await this.getDocuments<any>(
        'rounds',
        [
          this.where('userId', '==', userId),
          this.where('courseId', '==', courseId),
          orderBy('date', 'desc')
        ]
      );

      if (rounds.length === 0) {
        return {
          timesPlayed: 0,
          averageScore: 0,
          bestScore: 0,
          lastPlayed: null,
        };
      }

      const scores = rounds.map((r: any) => r.score);
      const totalScore = scores.reduce((sum: number, score: number) => sum + score, 0);

      return {
        timesPlayed: rounds.length,
        averageScore: Math.round(totalScore / rounds.length),
        bestScore: Math.min(...scores),
        lastPlayed: rounds[0].date,
      };
    } catch (error) {
      throw this.handleFirebaseError(error);
    }
  }
}

// Export singleton instance
export const coursesApi = new CoursesApi();
export default coursesApi;
