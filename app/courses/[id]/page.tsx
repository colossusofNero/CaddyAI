'use client';

/**
 * Course Details Page
 *
 * Displays course details, 3D viewer, and scorecard
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, MapPin, Phone, Globe, Heart, Play } from 'lucide-react';
import CourseViewer3D from '@/components/courses/CourseViewer3D';
import ScorecardWidget from '@/components/courses/ScorecardWidget';
import { igolfService } from '@/services/igolfService';
import { firebaseService } from '@/services/firebaseService';
import type { Course, Scorecard } from '@/types/course';

interface CourseDetailsPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function CourseDetailsPage({ params }: CourseDetailsPageProps) {
  const router = useRouter();
  const [courseId, setCourseId] = useState<string>('');
  const [course, setCourse] = useState<Course | null>(null);
  const [scorecard, setScorecard] = useState<Scorecard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [userId] = useState<string>('demo-user'); // TODO: Get from auth
  const [selectedHole, setSelectedHole] = useState<number>(1);

  // Unwrap params
  useEffect(() => {
    params.then((p) => setCourseId(p.id));
  }, [params]);

  // Load course data
  useEffect(() => {
    if (!courseId) return;

    const loadCourseData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Load course details and scorecard in parallel
        const [courseData, scorecardData, favoriteStatus] = await Promise.all([
          igolfService.getCourse(courseId),
          igolfService.getScorecard(courseId),
          firebaseService.isFavoriteCourse(userId, courseId),
        ]);

        setCourse(courseData);
        setScorecard(scorecardData);
        setIsFavorite(favoriteStatus);
      } catch (error: any) {
        console.error('Failed to load course:', error);
        setError(error.message || 'Failed to load course details');
      } finally {
        setIsLoading(false);
      }
    };

    loadCourseData();
  }, [courseId, userId]);

  const toggleFavorite = async () => {
    if (!course) return;

    try {
      if (isFavorite) {
        await firebaseService.removeFavoriteCourse(userId, courseId);
        setIsFavorite(false);
      } else {
        await firebaseService.addFavoriteCourse(
          userId,
          courseId,
          course.name,
          `${course.location.city}, ${course.location.state}`,
          course.imageUrl
        );
        setIsFavorite(true);
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  const startRound = async () => {
    if (!course) return;

    try {
      await firebaseService.startRound(userId, courseId, course.name, course.holes);
      // TODO: Navigate to round screen or mobile app
      alert('Round started! You can now use the CaddyAI mobile app to track your round.');
    } catch (error) {
      console.error('Failed to start round:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0B1220] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#05A146] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading course details...</p>
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-[#0B1220] flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-white mb-2">Course Not Found</h1>
          <p className="text-gray-400 mb-6">{error || 'The requested course could not be loaded.'}</p>
          <button
            onClick={() => router.push('/courses')}
            className="px-6 py-3 bg-[#05A146] text-white rounded-lg hover:bg-[#048A3A] transition-colors"
          >
            Back to Search
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B1220]">
      {/* Header */}
      <header className="bg-[#1E293B] border-b border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push('/courses')}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Search</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={toggleFavorite}
                className="p-2 hover:bg-[#0B1220] rounded-lg transition-colors"
              >
                <Heart
                  className={`w-6 h-6 ${
                    isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-400'
                  }`}
                />
              </button>

              <button
                onClick={startRound}
                className="flex items-center gap-2 px-6 py-3 bg-[#05A146] text-white rounded-lg hover:bg-[#048A3A] transition-colors font-semibold"
              >
                <Play className="w-5 h-5" />
                Start Round
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Course Hero */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-[#1E293B] rounded-lg overflow-hidden shadow-xl">
          {/* Course Image/3D Viewer */}
          <div className="relative">
            {course.imageUrl ? (
              <img
                src={course.imageUrl}
                alt={course.name}
                className="w-full h-64 object-cover"
              />
            ) : (
              <div className="w-full h-64 bg-gradient-to-br from-[#05A146] to-[#048A3A] flex items-center justify-center">
                <MapPin className="w-24 h-24 text-white/30" />
              </div>
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-[#1E293B] to-transparent"></div>

            <div className="absolute bottom-0 left-0 right-0 p-8">
              <h1 className="text-4xl font-bold text-white mb-2">{course.name}</h1>
              <p className="text-xl text-gray-300 flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                {course.location.city}, {course.location.state}
              </p>
            </div>
          </div>

          {/* Course Info */}
          <div className="p-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
              <div>
                <p className="text-sm text-gray-400 mb-1">Holes</p>
                <p className="text-2xl font-bold text-white">{course.holes}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">Par</p>
                <p className="text-2xl font-bold text-white">{course.par}</p>
              </div>
              {course.rating && (
                <div>
                  <p className="text-sm text-gray-400 mb-1">Rating</p>
                  <p className="text-2xl font-bold text-white">{course.rating}</p>
                </div>
              )}
              {course.slope && (
                <div>
                  <p className="text-sm text-gray-400 mb-1">Slope</p>
                  <p className="text-2xl font-bold text-white">{course.slope}</p>
                </div>
              )}
            </div>

            {/* Contact Info */}
            {(course.phoneNumber || course.website) && (
              <div className="flex flex-wrap gap-4">
                {course.phoneNumber && (
                  <a
                    href={`tel:${course.phoneNumber}`}
                    className="flex items-center gap-2 text-[#05A146] hover:text-[#048A3A] transition-colors"
                  >
                    <Phone className="w-5 h-5" />
                    <span>{course.phoneNumber}</span>
                  </a>
                )}
                {course.website && (
                  <a
                    href={course.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-[#05A146] hover:text-[#048A3A] transition-colors"
                  >
                    <Globe className="w-5 h-5" />
                    <span>Visit Website</span>
                  </a>
                )}
              </div>
            )}

            {course.description && (
              <div className="mt-6">
                <p className="text-gray-300 leading-relaxed">{course.description}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3D Viewer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-2xl font-bold text-white mb-4">3D Course Flyover</h2>
        <CourseViewer3D
          courseId={courseId}
          initialHole={selectedHole}
          onHoleChange={setSelectedHole}
          height="600px"
        />
      </div>

      {/* Scorecard */}
      {scorecard && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-16">
          <h2 className="text-2xl font-bold text-white mb-4">Scorecard</h2>
          <ScorecardWidget
            scorecard={scorecard}
            onHoleSelect={setSelectedHole}
          />
        </div>
      )}
    </div>
  );
}
