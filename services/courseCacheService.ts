/**
 * Course Cache Service
 *
 * Intelligent caching layer for iGolf courses with TTL management
 * Stores iGolf course data in Firebase to reduce API calls and improve performance
 */

import { getFirestore, doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { getApps } from 'firebase/app';
import type { CourseExtended } from '@/src/types/courseExtended';
import type { CourseCacheMetadata } from '@/lib/api/types';

// Get Firestore instance
const db = getApps().length > 0 ? getFirestore(getApps()[0]) : null;

// Cache configuration
const DEFAULT_TTL_DAYS = parseInt(process.env.IGOLF_CACHE_TTL_DAYS || '7', 10);
const TTL_MS = DEFAULT_TTL_DAYS * 24 * 60 * 60 * 1000;

/**
 * Check if iGolf integration is enabled
 */
export function shouldUseIGolf(): boolean {
  return process.env.NEXT_PUBLIC_IGOLF_ENABLED === 'true';
}

/**
 * Get cached course from Firebase
 * Returns null if not cached or cache is stale
 */
export async function getCachedCourse(courseId: string): Promise<{
  course: CourseExtended | null;
  metadata: CourseCacheMetadata | null;
  isStale: boolean;
}> {
  if (!db) {
    console.warn('[CourseCache] Firestore not initialized');
    return { course: null, metadata: null, isStale: false };
  }

  try {
    // Get course data
    const courseRef = doc(db, 'courses', courseId);
    const courseSnap = await getDoc(courseRef);

    if (!courseSnap.exists()) {
      return { course: null, metadata: null, isStale: false };
    }

    // Get cache metadata
    const metadataRef = doc(db, 'courseCacheMetadata', courseId);
    const metadataSnap = await getDoc(metadataRef);

    if (!metadataSnap.exists()) {
      return { course: courseSnap.data() as CourseExtended, metadata: null, isStale: false };
    }

    const metadata = metadataSnap.data() as CourseCacheMetadata;
    const now = Date.now();
    const isStale = now > metadata.expiresAt;

    return {
      course: courseSnap.data() as CourseExtended,
      metadata,
      isStale,
    };
  } catch (error) {
    console.error('[CourseCache] Error getting cached course:', error);
    return { course: null, metadata: null, isStale: false };
  }
}

/**
 * Cache a course in Firebase with metadata
 */
export async function cacheCourse(
  course: CourseExtended,
  source: 'igolf' | 'manual' = 'igolf',
  igolfCourseId?: number
): Promise<void> {
  if (!db) {
    console.warn('[CourseCache] Firestore not initialized');
    return;
  }

  try {
    const now = Date.now();

    // Store course data
    const courseRef = doc(db, 'courses', course.id);
    await setDoc(courseRef, {
      ...course,
      updatedAt: now,
    });

    // Store cache metadata
    const metadata: CourseCacheMetadata = {
      courseId: course.id,
      source,
      cachedAt: now,
      expiresAt: now + TTL_MS,
      lastRefreshed: now,
      refreshInProgress: false,
      igolfCourseId,
      version: 1,
    };

    const metadataRef = doc(db, 'courseCacheMetadata', course.id);
    await setDoc(metadataRef, metadata);

    console.log(`[CourseCache] Cached course: ${course.name} (${course.id})`);
  } catch (error) {
    console.error('[CourseCache] Error caching course:', error);
    throw error;
  }
}

/**
 * Cache multiple courses in batch
 */
export async function cacheCourses(
  courses: CourseExtended[],
  source: 'igolf' | 'manual' = 'igolf'
): Promise<void> {
  if (!db) {
    console.warn('[CourseCache] Firestore not initialized');
    return;
  }

  try {
    const now = Date.now();

    // Batch write courses (Firestore has limit of 500 per batch, so we'll do them one by one)
    const cachePromises = courses.map(async (course) => {
      // Extract iGolf course ID from ID if it's an iGolf course
      const igolfCourseId = course.id.startsWith('igolf-')
        ? parseInt(course.id.replace('igolf-', ''), 10)
        : undefined;

      // Store course data
      const courseRef = doc(db, 'courses', course.id);
      await setDoc(courseRef, {
        ...course,
        updatedAt: now,
      });

      // Store cache metadata
      const metadata: CourseCacheMetadata = {
        courseId: course.id,
        source,
        cachedAt: now,
        expiresAt: now + TTL_MS,
        lastRefreshed: now,
        refreshInProgress: false,
        igolfCourseId,
        version: 1,
      };

      const metadataRef = doc(db, 'courseCacheMetadata', course.id);
      await setDoc(metadataRef, metadata);
    });

    await Promise.all(cachePromises);
    console.log(`[CourseCache] Cached ${courses.length} courses`);
  } catch (error) {
    console.error('[CourseCache] Error caching courses:', error);
    throw error;
  }
}

/**
 * Get all stale courses from cache
 * Returns courses that need refreshing
 */
export async function getStaleCourses(): Promise<CourseCacheMetadata[]> {
  if (!db) {
    console.warn('[CourseCache] Firestore not initialized');
    return [];
  }

  try {
    const now = Date.now();
    const metadataRef = collection(db, 'courseCacheMetadata');

    // Query for stale iGolf courses
    const q = query(
      metadataRef,
      where('source', '==', 'igolf'),
      where('expiresAt', '<', now),
      where('refreshInProgress', '==', false)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as CourseCacheMetadata);
  } catch (error) {
    console.error('[CourseCache] Error getting stale courses:', error);
    return [];
  }
}

/**
 * Mark a course refresh as in progress
 */
export async function markRefreshInProgress(courseId: string, inProgress: boolean): Promise<void> {
  if (!db) {
    console.warn('[CourseCache] Firestore not initialized');
    return;
  }

  try {
    const metadataRef = doc(db, 'courseCacheMetadata', courseId);
    await setDoc(metadataRef, { refreshInProgress: inProgress }, { merge: true });
  } catch (error) {
    console.error('[CourseCache] Error marking refresh status:', error);
  }
}

/**
 * Background refresh of stale courses
 * This should be called periodically (e.g., from a cron job or server action)
 */
export async function refreshStaleCourses(): Promise<number> {
  if (!shouldUseIGolf()) {
    return 0;
  }

  try {
    const staleCourses = await getStaleCourses();

    if (staleCourses.length === 0) {
      return 0;
    }

    console.log(`[CourseCache] Found ${staleCourses.length} stale courses to refresh`);

    // Refresh courses (implement actual refresh logic in courseService)
    // This is a placeholder - actual implementation will be in courseService
    let refreshedCount = 0;

    for (const metadata of staleCourses) {
      try {
        await markRefreshInProgress(metadata.courseId, true);

        // Refresh logic will be implemented in courseService
        // For now, just extend the expiry
        const now = Date.now();
        const metadataRef = doc(db!, 'courseCacheMetadata', metadata.courseId);
        await setDoc(
          metadataRef,
          {
            expiresAt: now + TTL_MS,
            lastRefreshed: now,
            refreshInProgress: false,
          },
          { merge: true }
        );

        refreshedCount++;
      } catch (error) {
        console.error(`[CourseCache] Error refreshing course ${metadata.courseId}:`, error);
        await markRefreshInProgress(metadata.courseId, false);
      }
    }

    console.log(`[CourseCache] Refreshed ${refreshedCount} courses`);
    return refreshedCount;
  } catch (error) {
    console.error('[CourseCache] Error refreshing stale courses:', error);
    return 0;
  }
}

/**
 * Check if a course is cached and fresh
 */
export async function isCourseChached(courseId: string): Promise<boolean> {
  const { course, isStale } = await getCachedCourse(courseId);
  return course !== null && !isStale;
}

/**
 * Delete a course from cache
 */
export async function deleteCachedCourse(courseId: string): Promise<void> {
  if (!db) {
    console.warn('[CourseCache] Firestore not initialized');
    return;
  }

  try {
    // Delete course data
    const courseRef = doc(db, 'courses', courseId);
    await setDoc(courseRef, { deletedAt: Date.now() }, { merge: true });

    // Delete cache metadata
    const metadataRef = doc(db, 'courseCacheMetadata', courseId);
    await setDoc(metadataRef, { deletedAt: Date.now() }, { merge: true });

    console.log(`[CourseCache] Deleted cached course: ${courseId}`);
  } catch (error) {
    console.error('[CourseCache] Error deleting cached course:', error);
    throw error;
  }
}

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<{
  totalCached: number;
  igolfCached: number;
  staleCourses: number;
  cacheHitRate?: number;
}> {
  if (!db) {
    return { totalCached: 0, igolfCached: 0, staleCourses: 0 };
  }

  try {
    const metadataRef = collection(db, 'courseCacheMetadata');

    // Get all cached courses
    const allSnapshot = await getDocs(metadataRef);
    const totalCached = allSnapshot.size;

    // Get iGolf courses
    const igolfQuery = query(metadataRef, where('source', '==', 'igolf'));
    const igolfSnapshot = await getDocs(igolfQuery);
    const igolfCached = igolfSnapshot.size;

    // Get stale courses
    const now = Date.now();
    const staleQuery = query(metadataRef, where('expiresAt', '<', now));
    const staleSnapshot = await getDocs(staleQuery);
    const staleCourses = staleSnapshot.size;

    return {
      totalCached,
      igolfCached,
      staleCourses,
    };
  } catch (error) {
    console.error('[CourseCache] Error getting cache stats:', error);
    return { totalCached: 0, igolfCached: 0, staleCourses: 0 };
  }
}

// Export a singleton instance
export const courseCacheService = {
  shouldUseIGolf,
  getCachedCourse,
  cacheCourse,
  cacheCourses,
  getStaleCourses,
  markRefreshInProgress,
  refreshStaleCourses,
  isCourseChached,
  deleteCachedCourse,
  getCacheStats,
};
