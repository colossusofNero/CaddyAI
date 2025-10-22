/**
 * Course Detail Page
 *
 * Detailed course information with 2D maps, hole-by-hole data, and reviews
 */

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  MapPin,
  Star,
  Phone,
  Globe,
  Heart,
  Navigation,
  Users,
  TrendingUp,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import {
  getCourseById,
  getCourseHoles,
  addFavoriteCourse,
  removeFavoriteCourse,
  isCourseInFavorites,
  getCourseReviews,
} from '@/services/courseService';
import {
  CourseExtended,
  CourseHoleExtended,
  CourseReview,
} from '@/src/types/courseExtended';
import { useAuth } from '@/hooks/useAuth';

// Dynamically import map component (client-side only)
const CourseMap = dynamic(() => import('@/components/CourseMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-xl">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <p className="text-sm text-gray-600">Loading map...</p>
      </div>
    </div>
  ),
});

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const courseId = params.id as string;

  const [course, setCourse] = useState<CourseExtended | null>(null);
  const [holes, setHoles] = useState<CourseHoleExtended[]>([]);
  const [reviews, setReviews] = useState<CourseReview[]>([]);
  const [selectedHole, setSelectedHole] = useState<number>(1);
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  }, []);

  // Load course data
  useEffect(() => {
    if (courseId) {
      loadCourseData();
    }
  }, [courseId, user]);

  async function loadCourseData() {
    try {
      setLoading(true);

      const [courseData, holesData, reviewsData] = await Promise.all([
        getCourseById(courseId),
        getCourseHoles(courseId),
        getCourseReviews(courseId),
      ]);

      if (!courseData) {
        router.push('/courses');
        return;
      }

      setCourse(courseData);
      setHoles(holesData);
      setReviews(reviewsData);

      if (user) {
        const favoriteStatus = await isCourseInFavorites(user.uid, courseId);
        setIsFavorite(favoriteStatus);
      }
    } catch (error) {
      console.error('Error loading course:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleFavorite() {
    if (!user || !course) return;

    try {
      if (isFavorite) {
        await removeFavoriteCourse(user.uid, courseId);
        setIsFavorite(false);
      } else {
        await addFavoriteCourse(user.uid, course);
        setIsFavorite(true);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-text-secondary">Loading course...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return null;
  }

  const selectedHoleData = holes.find((h) => h.holeNumber === selectedHole);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background-light to-background">
      {/* Header */}
      <div className="bg-white border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-text-secondary hover:text-primary transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to courses
          </button>

          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-4xl font-sans font-bold text-text-primary mb-3">
                {course.name}
              </h1>

              <div className="flex items-center gap-6 mb-4">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-gray-400" />
                  <span className="text-text-secondary">
                    {course.location.city}, {course.location.state}
                  </span>
                </div>

                {course.rating && (
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-gold fill-gold" />
                    <span className="font-semibold text-text-primary">
                      {course.rating.average.toFixed(1)}
                    </span>
                    <span className="text-text-secondary">
                      ({course.rating.count} reviews)
                    </span>
                  </div>
                )}

                <span className="px-3 py-1 bg-secondary/10 text-secondary rounded-full text-sm font-semibold capitalize">
                  {course.courseType}
                </span>
              </div>

              {course.description && (
                <p className="text-text-secondary max-w-3xl">{course.description}</p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              {user && (
                <button
                  onClick={handleToggleFavorite}
                  className={`p-4 rounded-xl transition-all ${
                    isFavorite
                      ? 'bg-red-50 text-red-600 hover:bg-red-100'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Heart
                    className={`w-6 h-6 ${isFavorite ? 'fill-current' : ''}`}
                  />
                </button>
              )}

              <button className="px-6 py-4 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors font-semibold flex items-center gap-2">
                <Navigation className="w-5 h-5" />
                Get Directions
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Course Map */}
            {selectedHoleData?.geometry && (
              <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="p-6 border-b border-border">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-sans font-bold text-text-primary">
                        Hole {selectedHole}
                      </h2>
                      <p className="text-text-secondary">
                        Par {selectedHoleData.par} •{' '}
                        {selectedHoleData.yardages.blue || selectedHoleData.yardages.white || 0} yards
                      </p>
                    </div>
                  </div>
                </div>

                <div className="h-[500px]">
                  <CourseMap
                    hole={selectedHoleData}
                    userPosition={userLocation}
                    className="h-full"
                  />
                </div>
              </div>
            )}

            {/* Hole Selector */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-semibold text-text-primary mb-4">
                Select Hole
              </h3>
              <div className="grid grid-cols-9 gap-2">
                {holes.map((hole) => (
                  <button
                    key={hole.holeNumber}
                    onClick={() => setSelectedHole(hole.holeNumber)}
                    className={`aspect-square rounded-lg font-semibold transition-all ${
                      selectedHole === hole.holeNumber
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {hole.holeNumber}
                  </button>
                ))}
              </div>
            </div>

            {/* Scorecard */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-semibold text-text-primary mb-4">
                Scorecard
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-3">Hole</th>
                      <th className="text-center py-2 px-3">Par</th>
                      <th className="text-center py-2 px-3">Handicap</th>
                      <th className="text-right py-2 px-3">Black</th>
                      <th className="text-right py-2 px-3">Blue</th>
                      <th className="text-right py-2 px-3">White</th>
                      <th className="text-right py-2 px-3">Red</th>
                    </tr>
                  </thead>
                  <tbody>
                    {holes.slice(0, 9).map((hole) => (
                      <tr
                        key={hole.holeNumber}
                        className="border-b border-gray-100 hover:bg-gray-50"
                      >
                        <td className="py-2 px-3 font-semibold">{hole.holeNumber}</td>
                        <td className="text-center py-2 px-3">{hole.par}</td>
                        <td className="text-center py-2 px-3">{hole.handicap}</td>
                        <td className="text-right py-2 px-3">{hole.yardages.black || '-'}</td>
                        <td className="text-right py-2 px-3">{hole.yardages.blue || '-'}</td>
                        <td className="text-right py-2 px-3">{hole.yardages.white || '-'}</td>
                        <td className="text-right py-2 px-3">{hole.yardages.red || '-'}</td>
                      </tr>
                    ))}
                    <tr className="font-semibold bg-gray-50">
                      <td className="py-2 px-3">OUT</td>
                      <td className="text-center py-2 px-3">
                        {holes.slice(0, 9).reduce((sum, h) => sum + h.par, 0)}
                      </td>
                      <td className="text-center py-2 px-3">-</td>
                      <td className="text-right py-2 px-3">
                        {holes.slice(0, 9).reduce((sum, h) => sum + (h.yardages.black || 0), 0)}
                      </td>
                      <td className="text-right py-2 px-3">
                        {holes.slice(0, 9).reduce((sum, h) => sum + (h.yardages.blue || 0), 0)}
                      </td>
                      <td className="text-right py-2 px-3">
                        {holes.slice(0, 9).reduce((sum, h) => sum + (h.yardages.white || 0), 0)}
                      </td>
                      <td className="text-right py-2 px-3">
                        {holes.slice(0, 9).reduce((sum, h) => sum + (h.yardages.red || 0), 0)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Course Info */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-semibold text-text-primary mb-4">
                Course Information
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-text-secondary mb-1">Holes</div>
                  <div className="text-lg font-semibold text-text-primary">
                    {course.holes}
                  </div>
                </div>

                <div>
                  <div className="text-sm text-text-secondary mb-1">Designer</div>
                  <div className="text-lg font-semibold text-text-primary">
                    {course.designer || 'Unknown'}
                  </div>
                </div>

                {course.yearBuilt && (
                  <div>
                    <div className="text-sm text-text-secondary mb-1">Year Built</div>
                    <div className="text-lg font-semibold text-text-primary">
                      {course.yearBuilt}
                    </div>
                  </div>
                )}

                {course.contact.phone && (
                  <div>
                    <div className="text-sm text-text-secondary mb-1">Phone</div>
                    <a
                      href={`tel:${course.contact.phone}`}
                      className="text-lg font-semibold text-primary hover:underline flex items-center gap-2"
                    >
                      <Phone className="w-4 h-4" />
                      {course.contact.phone}
                    </a>
                  </div>
                )}

                {course.contact.website && (
                  <div>
                    <div className="text-sm text-text-secondary mb-1">Website</div>
                    <a
                      href={course.contact.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-lg font-semibold text-primary hover:underline flex items-center gap-2"
                    >
                      <Globe className="w-4 h-4" />
                      Visit Website
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Amenities */}
            {course.amenities && (
              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-lg font-semibold text-text-primary mb-4">
                  Amenities
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {course.amenities.drivingRange && (
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      <span>Driving Range</span>
                    </div>
                  )}
                  {course.amenities.puttingGreen && (
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      <span>Putting Green</span>
                    </div>
                  )}
                  {course.amenities.proShop && (
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      <span>Pro Shop</span>
                    </div>
                  )}
                  {course.amenities.restaurant && (
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      <span>Restaurant</span>
                    </div>
                  )}
                  {course.amenities.cartRental && (
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      <span>Cart Rental</span>
                    </div>
                  )}
                  {course.amenities.clubRental && (
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      <span>Club Rental</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Reviews Summary */}
            {course.rating && (
              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-lg font-semibold text-text-primary mb-4">
                  Reviews
                </h3>
                <div className="text-center mb-6">
                  <div className="text-5xl font-bold text-text-primary mb-2">
                    {course.rating.average.toFixed(1)}
                  </div>
                  <div className="flex items-center justify-center gap-1 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-5 h-5 ${
                          i < Math.round(course.rating.average)
                            ? 'text-gold fill-gold'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="text-sm text-text-secondary">
                    Based on {course.rating.count || 0} reviews
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
