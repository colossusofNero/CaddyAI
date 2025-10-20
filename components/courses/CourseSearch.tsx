'use client';

/**
 * Course Search Component
 *
 * Search for golf courses by name or location
 */

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Search, MapPin, Heart } from 'lucide-react';
import { igolfService } from '@/services/igolfService';
import { firebaseService } from '@/services/firebaseService';
import type { Course } from '@/types/course';

interface CourseSearchProps {
  userId?: string;
  onCourseSelect?: (course: Course) => void;
  showFavorites?: boolean;
}

export default function CourseSearch({
  userId,
  onCourseSelect,
  showFavorites = true,
}: CourseSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [courses, setCourses] = useState<Course[]>([]);
  const [favoriteCourseIds, setFavoriteCourseIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useLocation, setUseLocation] = useState(false);

  const loadFavorites = useCallback(async () => {
    if (!userId) return;

    try {
      const favorites = await firebaseService.getFavoriteCourses(userId);
      setFavoriteCourseIds(new Set(favorites.map(f => f.courseId)));
    } catch (error) {
      console.error('Failed to load favorites:', error);
    }
  }, [userId]);

  // Load favorite courses
  useEffect(() => {
    if (userId && showFavorites) {
      loadFavorites();
    }
  }, [userId, showFavorites, loadFavorites]);

  const handleSearch = async () => {
    if (!searchQuery.trim() && !useLocation) return;

    setIsLoading(true);
    setError(null);

    try {
      let result;

      if (useLocation) {
        // Get user's current location
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        });

        result = await igolfService.getNearbyCourses(
          position.coords.latitude,
          position.coords.longitude,
          25 // 25 mile radius
        );
      } else {
        const searchResult = await igolfService.searchCourses({
          query: searchQuery,
          pageSize: 20,
        });
        result = searchResult.courses;
      }

      setCourses(result);
    } catch (error: unknown) {
      console.error('Search failed:', error);
      setError(error instanceof Error ? error.message : 'Failed to search courses');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFavorite = async (course: Course) => {
    if (!userId) return;

    try {
      const isFavorite = favoriteCourseIds.has(course.id);

      if (isFavorite) {
        await firebaseService.removeFavoriteCourse(userId, course.id);
        setFavoriteCourseIds(prev => {
          const next = new Set(prev);
          next.delete(course.id);
          return next;
        });
      } else {
        await firebaseService.addFavoriteCourse(
          userId,
          course.id,
          course.name,
          `${course.location.city}, ${course.location.state}`,
          course.imageUrl
        );
        setFavoriteCourseIds(prev => new Set(prev).add(course.id));
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Search Bar */}
      <div className="bg-[#1E293B] rounded-lg p-4 shadow-lg">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search for golf courses..."
              disabled={useLocation}
              className="w-full pl-10 pr-4 py-3 bg-[#0B1220] border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#05A146] focus:border-transparent disabled:opacity-50"
            />
          </div>
          <button
            onClick={() => {
              setUseLocation(!useLocation);
              if (!useLocation) {
                setSearchQuery('');
                handleSearch();
              }
            }}
            className={`px-4 py-3 rounded-lg flex items-center gap-2 transition-colors ${
              useLocation
                ? 'bg-[#05A146] text-white'
                : 'bg-[#0B1220] text-gray-400 border border-gray-700 hover:border-[#05A146]'
            }`}
          >
            <MapPin className="w-5 h-5" />
            <span className="hidden sm:inline">Near Me</span>
          </button>
          <button
            onClick={handleSearch}
            disabled={isLoading || (!searchQuery.trim() && !useLocation)}
            className="px-6 py-3 bg-[#05A146] text-white rounded-lg font-semibold hover:bg-[#048A3A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Searching...' : 'Search'}
          </button>
        </div>

        {error && (
          <div className="mt-3 p-3 bg-red-900/20 border border-red-800 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}
      </div>

      {/* Results */}
      {courses.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xl font-bold text-white px-2">
            {courses.length} Course{courses.length !== 1 ? 's' : ''} Found
          </h3>

          <div className="grid gap-4">
            {courses.map((course) => (
              <div
                key={course.id}
                className="bg-[#1E293B] rounded-lg overflow-hidden hover:ring-2 hover:ring-[#05A146] transition-all cursor-pointer group"
                onClick={() => onCourseSelect?.(course)}
              >
                <div className="flex gap-4 p-4">
                  {/* Course Image */}
                  <div className="w-32 h-24 bg-[#0B1220] rounded-lg overflow-hidden flex-shrink-0 relative">
                    {course.thumbnailUrl ? (
                      <Image
                        src={course.thumbnailUrl}
                        alt={course.name}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-600">
                        <MapPin className="w-8 h-8" />
                      </div>
                    )}
                  </div>

                  {/* Course Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-lg font-bold text-white group-hover:text-[#05A146] transition-colors">
                          {course.name}
                        </h4>
                        <p className="text-sm text-gray-400 flex items-center gap-1 mt-1">
                          <MapPin className="w-4 h-4" />
                          {course.location.city}, {course.location.state}
                        </p>
                      </div>

                      {/* Favorite Button */}
                      {userId && showFavorites && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(course);
                          }}
                          className="p-2 hover:bg-[#0B1220] rounded-lg transition-colors"
                        >
                          <Heart
                            className={`w-5 h-5 ${
                              favoriteCourseIds.has(course.id)
                                ? 'fill-red-500 text-red-500'
                                : 'text-gray-400'
                            }`}
                          />
                        </button>
                      )}
                    </div>

                    {/* Course Stats */}
                    <div className="flex flex-wrap gap-4 mt-3 text-sm">
                      <div className="text-gray-300">
                        <span className="text-gray-500">Holes:</span> {course.holes}
                      </div>
                      <div className="text-gray-300">
                        <span className="text-gray-500">Par:</span> {course.par}
                      </div>
                      {course.rating && (
                        <div className="text-gray-300">
                          <span className="text-gray-500">Rating:</span> {course.rating}
                        </div>
                      )}
                      {course.slope && (
                        <div className="text-gray-300">
                          <span className="text-gray-500">Slope:</span> {course.slope}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && courses.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <Search className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg">Search for golf courses to get started</p>
          <p className="text-sm mt-2">Try searching by course name or use &quot;Near Me&quot;</p>
        </div>
      )}
    </div>
  );
}
