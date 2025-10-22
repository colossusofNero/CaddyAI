/**
 * useFavorites Hook
 *
 * React hook for managing favorite courses
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  getFavoriteCourses,
  addFavoriteCourse,
  removeFavoriteCourse,
  isCourseInFavorites,
} from '@/services/courseService';
import { CourseFavoriteExtended, CourseExtended } from '@/src/types/courseExtended';
import { useAuth } from './useAuth';

interface UseFavoritesReturn {
  favorites: CourseFavoriteExtended[];
  loading: boolean;
  error: string | null;
  isFavorite: (courseId: string) => boolean;
  addToFavorites: (course: CourseExtended) => Promise<void>;
  removeFromFavorites: (courseId: string) => Promise<void>;
  toggleFavorite: (course: CourseExtended) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useFavorites(): UseFavoritesReturn {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<CourseFavoriteExtended[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load favorites
  const loadFavorites = useCallback(async () => {
    if (!user) {
      setFavorites([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await getFavoriteCourses(user.uid);
      setFavorites(data);
    } catch (err) {
      console.error('Error loading favorites:', err);
      setError('Failed to load favorite courses');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Load favorites on mount and when user changes
  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  // Check if course is in favorites
  const isFavorite = useCallback(
    (courseId: string): boolean => {
      return favorites.some((fav) => fav.courseId === courseId);
    },
    [favorites]
  );

  // Add course to favorites
  const addToFavorites = useCallback(
    async (course: CourseExtended): Promise<void> => {
      if (!user) {
        throw new Error('Must be logged in to add favorites');
      }

      try {
        await addFavoriteCourse(user.uid, course);

        // Update local state
        const newFavorite: CourseFavoriteExtended = {
          id: `${user.uid}_${course.id}`,
          userId: user.uid,
          courseId: course.id,
          courseName: course.name,
          location: `${course.location.city}, ${course.location.state}`,
          thumbnailUrl: course.thumbnailUrl,
          addedAt: Date.now(),
          timesPlayed: 0,
        };

        setFavorites((prev) => [newFavorite, ...prev]);
      } catch (err) {
        console.error('Error adding favorite:', err);
        throw err;
      }
    },
    [user]
  );

  // Remove course from favorites
  const removeFromFavorites = useCallback(
    async (courseId: string): Promise<void> => {
      if (!user) {
        throw new Error('Must be logged in to remove favorites');
      }

      try {
        await removeFavoriteCourse(user.uid, courseId);

        // Update local state
        setFavorites((prev) => prev.filter((fav) => fav.courseId !== courseId));
      } catch (err) {
        console.error('Error removing favorite:', err);
        throw err;
      }
    },
    [user]
  );

  // Toggle favorite status
  const toggleFavorite = useCallback(
    async (course: CourseExtended): Promise<void> => {
      if (isFavorite(course.id)) {
        await removeFromFavorites(course.id);
      } else {
        await addToFavorites(course);
      }
    },
    [isFavorite, addToFavorites, removeFromFavorites]
  );

  // Refresh favorites
  const refresh = useCallback(async (): Promise<void> => {
    await loadFavorites();
  }, [loadFavorites]);

  return {
    favorites,
    loading,
    error,
    isFavorite,
    addToFavorites,
    removeFromFavorites,
    toggleFavorite,
    refresh,
  };
}
