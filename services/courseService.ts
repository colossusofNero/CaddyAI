/**
 * Course Service
 *
 * Handles all course-related operations including:
 * - Course search and discovery
 * - Course details and hole information
 * - Favorites management
 * - Reviews and ratings
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  Timestamp,
  GeoPoint,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  CourseExtended,
  CourseHoleExtended,
  CourseFavoriteExtended,
  CourseReview,
  CourseSearchFilters,
  CourseSearchResult,
} from '@/src/types/courseExtended';

/**
 * Calculate distance between two points using Haversine formula
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 3959; // Earth's radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Search courses with filters
 */
export async function searchCourses(
  filters: CourseSearchFilters
): Promise<CourseSearchResult[]> {
  try {
    const coursesRef = collection(db!, 'courses');
    let q = query(coursesRef);

    // Apply filters
    if (filters.courseType && filters.courseType.length > 0) {
      q = query(q, where('courseType', 'in', filters.courseType));
    }

    if (filters.holes) {
      q = query(q, where('holes', '==', filters.holes));
    }

    if (filters.minRating) {
      q = query(q, where('rating.average', '>=', filters.minRating));
    }

    // Apply sorting
    switch (filters.sortBy) {
      case 'rating':
        q = query(q, orderBy('rating.average', 'desc'));
        break;
      case 'name':
        q = query(q, orderBy('name', 'asc'));
        break;
      default:
        q = query(q, orderBy('createdAt', 'desc'));
    }

    // Apply limit
    if (filters.limit) {
      q = query(q, limit(filters.limit));
    }

    const snapshot = await getDocs(q);
    let courses: CourseSearchResult[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as CourseSearchResult[];

    // Filter by location if provided
    if (filters.location) {
      courses = courses.map((course) => {
        const distance = calculateDistance(
          filters.location!.latitude,
          filters.location!.longitude,
          course.location.latitude,
          course.location.longitude
        );
        return { ...course, distance };
      });

      // Filter by radius
      courses = courses.filter(
        (course) => course.distance! <= filters.location!.radius
      );

      // Sort by distance if that's the sort option
      if (filters.sortBy === 'distance') {
        courses.sort((a, b) => (a.distance || 0) - (b.distance || 0));
      }
    }

    // Filter by text query
    if (filters.query) {
      const queryLower = filters.query.toLowerCase();
      courses = courses.filter(
        (course) =>
          course.name.toLowerCase().includes(queryLower) ||
          course.location.city.toLowerCase().includes(queryLower) ||
          course.location.state.toLowerCase().includes(queryLower)
      );
    }

    return courses;
  } catch (error) {
    console.error('Error searching courses:', error);
    throw error;
  }
}

/**
 * Get course by ID
 */
export async function getCourseById(
  courseId: string
): Promise<CourseExtended | null> {
  try {
    const courseRef = doc(db!, 'courses', courseId);
    const courseSnap = await getDoc(courseRef);

    if (!courseSnap.exists()) {
      return null;
    }

    return {
      id: courseSnap.id,
      ...courseSnap.data(),
    } as CourseExtended;
  } catch (error) {
    console.error('Error getting course:', error);
    throw error;
  }
}

/**
 * Get all holes for a course
 */
export async function getCourseHoles(
  courseId: string
): Promise<CourseHoleExtended[]> {
  try {
    const holesRef = collection(db!, 'courseHoles');
    const q = query(
      holesRef,
      where('courseId', '==', courseId),
      orderBy('holeNumber', 'asc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as CourseHoleExtended[];
  } catch (error) {
    console.error('Error getting course holes:', error);
    throw error;
  }
}

/**
 * Get single hole by ID
 */
export async function getCourseHoleById(
  courseId: string,
  holeNumber: number
): Promise<CourseHoleExtended | null> {
  try {
    const holesRef = collection(db!, 'courseHoles');
    const q = query(
      holesRef,
      where('courseId', '==', courseId),
      where('holeNumber', '==', holeNumber),
      limit(1)
    );

    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data(),
    } as CourseHoleExtended;
  } catch (error) {
    console.error('Error getting course hole:', error);
    throw error;
  }
}

/**
 * Add course to favorites
 */
export async function addFavoriteCourse(
  userId: string,
  course: CourseExtended
): Promise<void> {
  try {
    const favoriteId = `${userId}_${course.id}`;
    const favoriteRef = doc(db!, 'courseFavorites', favoriteId);

    const favorite: CourseFavoriteExtended = {
      id: favoriteId,
      userId,
      courseId: course.id,
      courseName: course.name,
      location: `${course.location.city}, ${course.location.state}`,
      thumbnailUrl: course.thumbnailUrl,
      addedAt: Date.now(),
      timesPlayed: 0,
    };

    await setDoc(favoriteRef, favorite);
  } catch (error) {
    console.error('Error adding favorite course:', error);
    throw error;
  }
}

/**
 * Remove course from favorites
 */
export async function removeFavoriteCourse(
  userId: string,
  courseId: string
): Promise<void> {
  try {
    const favoriteId = `${userId}_${courseId}`;
    const favoriteRef = doc(db!, 'courseFavorites', favoriteId);
    await deleteDoc(favoriteRef);
  } catch (error) {
    console.error('Error removing favorite course:', error);
    throw error;
  }
}

/**
 * Get user's favorite courses
 */
export async function getFavoriteCourses(
  userId: string
): Promise<CourseFavoriteExtended[]> {
  try {
    const favoritesRef = collection(db!, 'courseFavorites');
    const q = query(
      favoritesRef,
      where('userId', '==', userId),
      orderBy('addedAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as CourseFavoriteExtended[];
  } catch (error) {
    console.error('Error getting favorite courses:', error);
    throw error;
  }
}

/**
 * Check if course is favorited
 */
export async function isCourseInFavorites(
  userId: string,
  courseId: string
): Promise<boolean> {
  try {
    const favoriteId = `${userId}_${courseId}`;
    const favoriteRef = doc(db!, 'courseFavorites', favoriteId);
    const favoriteSnap = await getDoc(favoriteRef);
    return favoriteSnap.exists();
  } catch (error) {
    console.error('Error checking favorite status:', error);
    throw error;
  }
}

/**
 * Add course review
 */
export async function addCourseReview(
  courseId: string,
  userId: string,
  userName: string,
  review: {
    rating: number;
    difficulty: number;
    condition: number;
    value: number;
    comment?: string;
    playedDate: number;
  }
): Promise<void> {
  try {
    const reviewsRef = collection(db!, 'courseReviews');
    const reviewDoc = doc(reviewsRef);

    const newReview: CourseReview = {
      id: reviewDoc.id,
      courseId,
      userId,
      userName,
      ...review,
      createdAt: Date.now(),
      helpful: 0,
    };

    await setDoc(reviewDoc, newReview);

    // Update course average rating
    await updateCourseRating(courseId);
  } catch (error) {
    console.error('Error adding course review:', error);
    throw error;
  }
}

/**
 * Get course reviews
 */
export async function getCourseReviews(
  courseId: string
): Promise<CourseReview[]> {
  try {
    const reviewsRef = collection(db!, 'courseReviews');
    const q = query(
      reviewsRef,
      where('courseId', '==', courseId),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as CourseReview[];
  } catch (error) {
    console.error('Error getting course reviews:', error);
    throw error;
  }
}

/**
 * Update course rating based on reviews
 */
async function updateCourseRating(courseId: string): Promise<void> {
  try {
    const reviews = await getCourseReviews(courseId);

    if (reviews.length === 0) return;

    const avgRating =
      reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    const avgDifficulty =
      reviews.reduce((sum, r) => sum + r.difficulty, 0) / reviews.length;

    const courseRef = doc(db!, 'courses', courseId);
    await updateDoc(courseRef, {
      'rating.average': avgRating,
      'rating.count': reviews.length,
      'rating.difficulty': avgDifficulty,
      updatedAt: Date.now(),
    });
  } catch (error) {
    console.error('Error updating course rating:', error);
    throw error;
  }
}

/**
 * Get nearby courses using geolocation
 */
export async function getNearbyCourses(
  latitude: number,
  longitude: number,
  radiusMiles: number = 25,
  limitResults: number = 20
): Promise<CourseSearchResult[]> {
  return searchCourses({
    location: {
      latitude,
      longitude,
      radius: radiusMiles,
    },
    sortBy: 'distance',
    limit: limitResults,
  });
}

/**
 * Get popular courses (by rating)
 */
export async function getPopularCourses(
  limitResults: number = 10
): Promise<CourseExtended[]> {
  try {
    const coursesRef = collection(db!, 'courses');
    const q = query(
      coursesRef,
      orderBy('rating.average', 'desc'),
      orderBy('rating.count', 'desc'),
      limit(limitResults)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as CourseExtended[];
  } catch (error) {
    console.error('Error getting popular courses:', error);
    throw error;
  }
}
