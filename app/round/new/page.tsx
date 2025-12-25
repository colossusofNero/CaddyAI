/**
 * New Round Page
 * Allows users to start a new golf round
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, MapPin, Search } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { roundsApi } from '@/lib/api/rounds';
import { searchCourses } from '@/services/courseService';
import type { CourseSearchResult } from '@/src/types/courseExtended';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { TeeSelector } from '@/components/scoring/TeeSelector';

export default function NewRoundPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [courses, setCourses] = useState<CourseSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<CourseSearchResult | null>(null);
  const [startingRound, setStartingRound] = useState(false);
  const [showTeeSelector, setShowTeeSelector] = useState(false);
  const [selectedTeeData, setSelectedTeeData] = useState<{
    name: string;
    color: string;
    rating: number;
    slope: number;
  } | null>(null);

  // Redirect unauthenticated users
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login?redirect=/round/new');
    }
  }, [user, loading, router]);

  // Load popular courses on mount
  useEffect(() => {
    loadPopularCourses();
  }, []);

  async function loadPopularCourses() {
    try {
      setSearching(true);
      const results = await searchCourses({
        sortBy: 'rating',
        limit: 10,
      });
      setCourses(results);
    } catch (error) {
      console.error('Error loading courses:', error);
    } finally {
      setSearching(false);
    }
  }

  async function handleSearch(query: string) {
    setSearchQuery(query);

    if (query.trim() === '') {
      loadPopularCourses();
      return;
    }

    try {
      setSearching(true);
      const results = await searchCourses({
        query: query.trim(),
        sortBy: 'rating',
        limit: 20,
      });
      setCourses(results);
    } catch (error) {
      console.error('Error searching courses:', error);
    } finally {
      setSearching(false);
    }
  }

  function handleCourseSelect(course: CourseSearchResult) {
    setSelectedCourse(course);
    setShowTeeSelector(true);
  }

  async function handleTeeSelected(teeData: {
    name: string;
    color: string;
    rating: number;
    slope: number;
  }) {
    if (!user || !selectedCourse) return;

    try {
      setStartingRound(true);
      setSelectedTeeData(teeData);

      // Start an active round with tee information
      const activeRound = await roundsApi.startRound(
        selectedCourse.id,
        selectedCourse.name,
        selectedCourse.holes
      );

      // Update the active round with tee data
      await roundsApi.updateActiveRound({
        ...activeRound,
        // Store tee data for later use when completing the round
        metadata: {
          teeUsed: teeData.name,
          teeColor: teeData.color,
          courseRating: teeData.rating,
          slopeRating: teeData.slope,
        },
      } as any);

      setShowTeeSelector(false);

      // Redirect to the mobile app or show success message
      alert(
        `Round started on ${teeData.name} Tees!\n\n` +
        'To track your round hole-by-hole, please use the Copperline Golf mobile app. ' +
        'The mobile app provides GPS tracking, shot recording, and live scoring.\n\n' +
        'You can also complete your round manually from the History page later.'
      );

      // Redirect back to dashboard
      router.push('/dashboard');
    } catch (error) {
      console.error('Error starting round:', error);
      alert('Failed to start round. Please try again.');
    } finally {
      setStartingRound(false);
    }
  }

  function handleSkipTeeSelection() {
    if (!selectedCourse) return;
    setShowTeeSelector(false);
    // Start round without tee data
    handleTeeSelected({
      name: 'White',
      color: 'White',
      rating: 70.0,
      slope: 125,
    });
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

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
            Back to Dashboard
          </button>

          <h1 className="text-4xl font-sans font-bold text-text-primary mb-3">
            Start New Round
          </h1>
          <p className="text-text-secondary">
            Select a course to begin tracking your round
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search for a golf course..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-text-primary placeholder-text-secondary"
            />
          </div>
        </div>

        {/* Course List */}
        <div>
          <h2 className="text-xl font-bold text-text-primary mb-4">
            {searchQuery ? 'Search Results' : 'Popular Courses'}
          </h2>

          {searching ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} variant="default" padding="lg">
                  <div className="animate-pulse">
                    <div className="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </Card>
              ))}
            </div>
          ) : courses.length === 0 ? (
            <Card variant="bordered" padding="lg">
              <div className="text-center py-8">
                <div className="text-5xl mb-4">⛳</div>
                <h3 className="text-xl font-bold text-text-primary mb-2">
                  No courses found
                </h3>
                <p className="text-text-secondary mb-6">
                  Try a different search term or browse all courses
                </p>
                <Link href="/courses">
                  <Button variant="primary" size="md">
                    Browse All Courses
                  </Button>
                </Link>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {courses.map((course) => (
                <Card
                  key={course.id}
                  variant="default"
                  padding="lg"
                  className="hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-text-primary mb-2">
                        {course.name}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-text-secondary mb-2">
                        <MapPin className="w-4 h-4" />
                        <span>
                          {course.location.city}, {course.location.state}
                        </span>
                      </div>
                      {course.rating && (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-gold">★</span>
                          <span className="font-semibold text-text-primary">
                            {course.rating.average.toFixed(1)}
                          </span>
                          <span className="text-text-secondary">
                            ({course.rating.count} reviews)
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 mt-4">
                    <div className="text-sm text-text-secondary">
                      {course.holes} holes • Par {course.teeBoxes?.[0]?.par || '72'}
                    </div>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleCourseSelect(course)}
                      disabled={startingRound}
                    >
                      Start Round
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Info Card */}
        <Card variant="bordered" padding="lg" className="mt-8">
          <div className="flex items-start gap-4">
            <div className="text-3xl">📱</div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-text-primary mb-2">
                Track Your Round with the Mobile App
              </h3>
              <p className="text-text-secondary mb-4">
                For the best round tracking experience with GPS, shot recording, and live scoring,
                use the Copperline Golf mobile app on the course.
              </p>
              <Link href="/download">
                <Button variant="outline" size="sm">
                  Download Mobile App
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      </div>

      {/* Tee Selector Modal */}
      <Modal
        isOpen={showTeeSelector}
        onClose={() => setShowTeeSelector(false)}
        title="Select Tee Box"
        size="lg"
        closeOnBackdrop={!startingRound}
        closeOnEscape={!startingRound}
      >
        {selectedCourse && (
          <TeeSelector
            courseName={selectedCourse.name}
            ghinCourseId={selectedCourse.ghinCourseId}
            onTeeSelected={handleTeeSelected}
            onSkip={handleSkipTeeSelection}
            loading={startingRound}
          />
        )}
      </Modal>
    </div>
  );
}
