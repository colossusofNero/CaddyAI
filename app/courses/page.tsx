/**
 * Course Search Page
 *
 * Search and discover golf courses with filters, geolocation, and map view
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, MapPin, Filter, Star, Map, List } from 'lucide-react';
import {
  searchCourses,
  getNearbyCourses,
  getPopularCourses,
} from '@/services/courseService';
import { CourseSearchResult, CourseSearchFilters } from '@/src/types/courseExtended';
import { useAuth } from '@/hooks/useAuth';
import { US_STATES } from '@/lib/constants/states';

export default function CoursesPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [courses, setCourses] = useState<CourseSearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  // Additional filters
  const [cityFilter, setCityFilter] = useState('');
  const [stateFilter, setStateFilter] = useState('');

  // Filters
  const [filters, setFilters] = useState<CourseSearchFilters>({
    sortBy: 'rating',
    limit: 20,
  });

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  }, []);

  // Load initial courses
  useEffect(() => {
    loadCourses();
  }, [filters, userLocation]);

  async function loadCourses() {
    try {
      setLoading(true);

      let results: CourseSearchResult[];

      if (searchQuery) {
        // Search with query
        results = await searchCourses({
          ...filters,
          query: searchQuery,
          location: userLocation
            ? { ...userLocation, radius: 50 }
            : undefined,
        });
      } else if (userLocation) {
        // Show nearby courses
        results = await getNearbyCourses(
          userLocation.latitude,
          userLocation.longitude,
          50,
          20
        );
      } else {
        // Show popular courses
        results = await getPopularCourses(20);
      }

      setCourses(results);
    } catch (error) {
      console.error('Error loading courses:', error);
    } finally {
      setLoading(false);
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    loadCourses();
  }

  function handleCourseClick(courseId: string) {
    router.push(`/courses/${courseId}`);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background-light to-background">
      {/* Header */}
      <div className="bg-white border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-sans font-bold text-text-primary mb-2">
                Discover Golf Courses
              </h1>
              <p className="text-text-secondary">
                Search thousands of courses worldwide
              </p>
            </div>

            {/* View Toggle */}
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('list')}
                className={`p-3 rounded-lg transition-colors ${
                  viewMode === 'list'
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <List className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={`p-3 rounded-lg transition-colors ${
                  viewMode === 'map'
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Map className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search courses by name or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {userLocation && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setFilters({ ...filters, sortBy: 'distance' });
                }}
                className="px-6 py-4 bg-secondary text-white rounded-xl hover:bg-secondary/90 transition-colors flex items-center gap-2"
              >
                <MapPin className="w-5 h-5" />
                Nearby
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className="px-6 py-4 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors flex items-center gap-2"
            >
              <Filter className="w-5 h-5" />
              Filters
            </button>

            <button
              type="submit"
              className="px-8 py-4 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors font-semibold"
            >
              Search
            </button>
          </form>

          {/* Filters Panel */}
          {showFilters && (
            <div className="mt-6 p-6 bg-gray-50 rounded-xl">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                {/* City */}
                <div>
                  <label className="block text-sm font-semibold text-text-primary mb-2">
                    City
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Pebble Beach"
                    value={cityFilter}
                    onChange={(e) => setCityFilter(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                {/* State */}
                <div>
                  <label className="block text-sm font-semibold text-text-primary mb-2">
                    State
                  </label>
                  <select
                    value={stateFilter}
                    onChange={(e) => setStateFilter(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">All States</option>
                    {US_STATES.map((state) => (
                      <option key={state.code} value={state.code}>
                        {state.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Course Type */}
                <div>
                  <label className="block text-sm font-semibold text-text-primary mb-2">
                    Course Type
                  </label>
                  <select
                    className="w-full px-4 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        courseType: e.target.value
                          ? [e.target.value as any]
                          : undefined,
                      })
                    }
                  >
                    <option value="">All Types</option>
                    <option value="public">Public</option>
                    <option value="private">Private</option>
                    <option value="semi-private">Semi-Private</option>
                    <option value="resort">Resort</option>
                  </select>
                </div>

                {/* Holes */}
                <div>
                  <label className="block text-sm font-semibold text-text-primary mb-2">
                    Holes
                  </label>
                  <select
                    className="w-full px-4 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        holes: e.target.value ? parseInt(e.target.value) : undefined,
                      })
                    }
                  >
                    <option value="">Any</option>
                    <option value="9">9 Holes</option>
                    <option value="18">18 Holes</option>
                  </select>
                </div>

                {/* Sort By */}
                <div>
                  <label className="block text-sm font-semibold text-text-primary mb-2">
                    Sort By
                  </label>
                  <select
                    className="w-full px-4 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                    value={filters.sortBy}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        sortBy: e.target.value as any,
                      })
                    }
                  >
                    <option value="rating">Highest Rated</option>
                    <option value="name">Name (A-Z)</option>
                    {userLocation && <option value="distance">Distance</option>}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-text-secondary">Loading courses...</p>
            </div>
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center py-20">
            <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-text-primary mb-2">
              No courses found
            </h3>
            <p className="text-text-secondary">
              Try adjusting your search or filters
            </p>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <p className="text-text-secondary">
                Found <span className="font-semibold text-text-primary">{courses.length}</span> courses
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => (
                <div
                  key={course.id}
                  onClick={() => handleCourseClick(course.id)}
                  className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer group"
                >
                  {/* Course Image */}
                  <div className="relative h-48 bg-gradient-to-br from-green-100 to-green-200">
                    {course.thumbnailUrl && (
                      <img
                        src={course.thumbnailUrl}
                        alt={course.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    )}
                    <div className="absolute top-4 right-4 flex flex-col gap-2 items-end">
                      {/* Rating Badge */}
                      <div className="px-3 py-1.5 bg-white/95 backdrop-blur-sm rounded-full flex items-center gap-1.5 shadow-md">
                        <Star className="w-4 h-4 text-gold fill-gold" />
                        <span className="text-sm font-bold text-text-primary">
                          {course.rating.average.toFixed(1)}
                        </span>
                      </div>
                      {/* iGolf Source Badge */}
                      {course.source === 'igolf' && (
                        <div className="px-3 py-1 bg-blue-500 text-white rounded-full flex items-center gap-1.5 shadow-md">
                          <span className="text-xs font-semibold">iGolf</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Course Info */}
                  <div className="p-6">
                    <h3 className="text-xl font-sans font-bold text-text-primary mb-2 group-hover:text-primary transition-colors">
                      {course.name}
                    </h3>

                    <div className="flex items-center gap-2 text-sm text-text-secondary mb-4">
                      <MapPin className="w-4 h-4" />
                      <span>
                        {course.location.city}, {course.location.state}
                      </span>
                      {course.distance && (
                        <span className="ml-auto font-semibold text-primary">
                          {course.distance.toFixed(1)} mi
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-4">
                        <span className="text-text-secondary">
                          <span className="font-semibold text-text-primary">
                            {course.holes}
                          </span>{' '}
                          holes
                        </span>
                        <span className="text-text-secondary">
                          Par{' '}
                          <span className="font-semibold text-text-primary">
                            {course.teeBoxes[0]?.par || '-'}
                          </span>
                        </span>
                      </div>
                      <span className="text-xs px-2 py-1 bg-secondary/10 text-secondary rounded-full font-semibold capitalize">
                        {course.courseType}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
