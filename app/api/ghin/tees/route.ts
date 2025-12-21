/**
 * GHIN Tees API Route
 * Fetches tee options from GHIN for a course
 */

import { NextRequest, NextResponse } from 'next/server';
import { ghinScoreService } from '@/services/ghinScoreService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ghinCourseId, courseName } = body;

    if (!ghinCourseId) {
      return NextResponse.json(
        { error: 'GHIN course ID is required' },
        { status: 400 }
      );
    }

    if (!ghinScoreService.isGHINEnabled()) {
      return NextResponse.json(
        {
          error: 'GHIN integration not configured',
          tees: getDefaultTees(),
        },
        { status: 200 } // Return defaults instead of error
      );
    }

    // Fetch tee options from GHIN
    const tees = await ghinScoreService.getTeeOptions(ghinCourseId, courseName || 'Course');

    if (!tees || tees.length === 0) {
      return NextResponse.json({
        tees: getDefaultTees(),
        message: 'Using default tees',
      });
    }

    return NextResponse.json({ tees });
  } catch (error) {
    console.error('[GHIN Tees API] Error:', error);

    // Return default tees on error instead of failing
    return NextResponse.json({
      tees: getDefaultTees(),
      error: 'Failed to fetch tee options, using defaults',
    });
  }
}

function getDefaultTees() {
  return [
    { name: 'Championship', color: 'Black', rating: 74.0, slope: 135 },
    { name: 'Blue', color: 'Blue', rating: 72.0, slope: 130 },
    { name: 'White', color: 'White', rating: 70.0, slope: 125 },
    { name: 'Gold/Senior', color: 'Gold', rating: 68.5, slope: 120 },
    { name: 'Red', color: 'Red', rating: 71.0, slope: 125 },
  ];
}
