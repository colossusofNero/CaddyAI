/**
 * Offline Service
 *
 * Handles offline course data caching and synchronization
 */

import { CourseExtended, CourseHoleExtended, OfflineCourseData } from '@/types/courseExtended';

const DB_NAME = 'CaddyAI_Offline';
const DB_VERSION = 1;
const COURSES_STORE = 'courses';
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

/**
 * Initialize IndexedDB
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create courses store if it doesn't exist
      if (!db.objectStoreNames.contains(COURSES_STORE)) {
        db.createObjectStore(COURSES_STORE, { keyPath: 'course.id' });
      }
    };
  });
}

/**
 * Calculate data size in bytes
 */
function calculateSize(data: any): number {
  return new Blob([JSON.stringify(data)]).size;
}

/**
 * Download course for offline use
 */
export async function downloadCourseForOffline(
  course: CourseExtended,
  holes: CourseHoleExtended[]
): Promise<void> {
  try {
    const db = await openDB();
    const transaction = db.transaction([COURSES_STORE], 'readwrite');
    const store = transaction.objectStore(COURSES_STORE);

    const offlineData: OfflineCourseData = {
      course,
      holes,
      downloadedAt: Date.now(),
      expiresAt: Date.now() + CACHE_DURATION,
      size: calculateSize({ course, holes }),
    };

    await new Promise<void>((resolve, reject) => {
      const request = store.put(offlineData);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    console.log(`Downloaded course ${course.name} for offline use`);
  } catch (error) {
    console.error('Error downloading course:', error);
    throw error;
  }
}

/**
 * Get offline course data
 */
export async function getOfflineCourse(
  courseId: string
): Promise<OfflineCourseData | null> {
  try {
    const db = await openDB();
    const transaction = db.transaction([COURSES_STORE], 'readonly');
    const store = transaction.objectStore(COURSES_STORE);

    return new Promise<OfflineCourseData | null>((resolve, reject) => {
      const request = store.get(courseId);

      request.onsuccess = () => {
        const data = request.result as OfflineCourseData | undefined;

        if (!data) {
          resolve(null);
          return;
        }

        // Check if data has expired
        if (Date.now() > data.expiresAt) {
          // Delete expired data
          deleteOfflineCourse(courseId);
          resolve(null);
          return;
        }

        resolve(data);
      };

      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error getting offline course:', error);
    return null;
  }
}

/**
 * Get all offline courses
 */
export async function getAllOfflineCourses(): Promise<OfflineCourseData[]> {
  try {
    const db = await openDB();
    const transaction = db.transaction([COURSES_STORE], 'readonly');
    const store = transaction.objectStore(COURSES_STORE);

    return new Promise<OfflineCourseData[]>((resolve, reject) => {
      const request = store.getAll();

      request.onsuccess = () => {
        const courses = request.result as OfflineCourseData[];

        // Filter out expired courses
        const validCourses = courses.filter((course) => {
          if (Date.now() > course.expiresAt) {
            deleteOfflineCourse(course.course.id);
            return false;
          }
          return true;
        });

        resolve(validCourses);
      };

      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error getting all offline courses:', error);
    return [];
  }
}

/**
 * Delete offline course
 */
export async function deleteOfflineCourse(courseId: string): Promise<void> {
  try {
    const db = await openDB();
    const transaction = db.transaction([COURSES_STORE], 'readwrite');
    const store = transaction.objectStore(COURSES_STORE);

    await new Promise<void>((resolve, reject) => {
      const request = store.delete(courseId);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    console.log(`Deleted offline course ${courseId}`);
  } catch (error) {
    console.error('Error deleting offline course:', error);
    throw error;
  }
}

/**
 * Check if course is available offline
 */
export async function isCourseAvailableOffline(
  courseId: string
): Promise<boolean> {
  const offlineData = await getOfflineCourse(courseId);
  return offlineData !== null;
}

/**
 * Get total offline storage size
 */
export async function getOfflineStorageSize(): Promise<number> {
  const courses = await getAllOfflineCourses();
  return courses.reduce((total, course) => total + course.size, 0);
}

/**
 * Clear all offline data
 */
export async function clearAllOfflineData(): Promise<void> {
  try {
    const db = await openDB();
    const transaction = db.transaction([COURSES_STORE], 'readwrite');
    const store = transaction.objectStore(COURSES_STORE);

    await new Promise<void>((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    console.log('Cleared all offline data');
  } catch (error) {
    console.error('Error clearing offline data:', error);
    throw error;
  }
}

/**
 * Clean up expired offline data
 */
export async function cleanupExpiredData(): Promise<void> {
  const courses = await getAllOfflineCourses();
  const now = Date.now();

  for (const courseData of courses) {
    if (now > courseData.expiresAt) {
      await deleteOfflineCourse(courseData.course.id);
    }
  }
}

/**
 * Check if online
 */
export function isOnline(): boolean {
  return navigator.onLine;
}

/**
 * Register online/offline listeners
 */
export function registerConnectivityListeners(
  onOnline: () => void,
  onOffline: () => void
): () => void {
  window.addEventListener('online', onOnline);
  window.addEventListener('offline', onOffline);

  // Return cleanup function
  return () => {
    window.removeEventListener('online', onOnline);
    window.removeEventListener('offline', onOffline);
  };
}

/**
 * Format storage size
 */
export function formatStorageSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  } else if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  } else if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  } else {
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  }
}
