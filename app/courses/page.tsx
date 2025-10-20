'use client';

/**
 * Courses Page
 *
 * Main course search and selection page
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import CourseSearch from '@/components/courses/CourseSearch';
import type { Course } from '@/types/course';

export default function CoursesPage() {
  const router = useRouter();
  const [userId] = useState<string>('demo-user'); // TODO: Get from auth

  const handleCourseSelect = (course: Course) => {
    router.push(`/courses/${course.id}`);
  };

  return (
    <div className="min-h-screen bg-[#0B1220]">
      {/* Header */}
      <header className="bg-[#1E293B] border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-white">Golf Courses</h1>
          <p className="mt-2 text-gray-400">
            Search for courses and view detailed scorecards with 3D visualization
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <CourseSearch
          userId={userId}
          onCourseSelect={handleCourseSelect}
          showFavorites={true}
        />
      </main>
    </div>
  );
}
