/**
 * iGolf API Client
 *
 * Handles authentication, requests, and type transformations
 * for iGolf Course API integration.
 *
 * Authentication: HMAC-SHA256 via server-side signature endpoint
 * Base URL: https://api.igolf.com/rest/action/{Action}/{APIKey}/1.0/1.0/HMAC256/{Signature}/{Timestamp}/JSON
 */

import type {
  IGolfCourse,
  IGolfCourseDetails,
  CourseListParams,
  IGolfSignatureResponse,
  IGolfApiResponse,
} from './types';
import type { CourseExtended, TeeBox, CourseAmenities } from '@/src/types/courseExtended';
import { getStateCode } from '@/lib/constants/states';

const IGOLF_BASE_URL = process.env.IGOLF_BASE_URL || 'https://api.igolf.com';
const MAX_RESULTS_PER_PAGE = 100; // iGolf API limit

/**
 * Check if iGolf integration is enabled
 */
export function isIGolfEnabled(): boolean {
  return process.env.NEXT_PUBLIC_IGOLF_ENABLED === 'true';
}

/**
 * Get HMAC signature from server-side endpoint
 */
async function getSignature(action: string): Promise<IGolfSignatureResponse> {
  const response = await fetch('/api/igolf/signature', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to get signature');
  }

  return response.json();
}

/**
 * Build iGolf API URL with HMAC authentication
 */
function buildIGolfUrl(
  action: string,
  apiKey: string,
  signature: string,
  timestamp: number,
  params?: Record<string, any>
): string {
  const baseUrl = `${IGOLF_BASE_URL}/rest/action/${action}/${apiKey}/1.0/1.0/HMAC256/${signature}/${timestamp}/JSON`;

  if (!params || Object.keys(params).length === 0) {
    return baseUrl;
  }

  const queryParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      queryParams.append(key, String(value));
    }
  });

  const queryString = queryParams.toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
}

/**
 * Make authenticated request to iGolf API
 */
async function makeIGolfRequest<T>(
  action: string,
  params?: Record<string, any>
): Promise<IGolfApiResponse<T>> {
  try {
    // Get signature from server
    const { apiKey, signature, timestamp } = await getSignature(action);

    // Build URL
    const url = buildIGolfUrl(action, apiKey, signature, timestamp, params);

    // Make request
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`iGolf API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error(`iGolf API ${action} error:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Infer course type from iGolf class field
 */
function inferCourseType(classType?: string): CourseExtended['courseType'] {
  if (!classType) return 'public';

  const lower = classType.toLowerCase();
  if (lower.includes('private')) return 'private';
  if (lower.includes('semi')) return 'semi-private';
  if (lower.includes('resort')) return 'resort';
  return 'public';
}

/**
 * Calculate difficulty rating from slope
 */
function calculateDifficulty(slope?: number): number {
  if (!slope) return 3; // Default medium difficulty

  // Map slope (55-155) to difficulty (1-5)
  // 55-85: Easy (1-2)
  // 86-115: Medium (3)
  // 116-145: Hard (4)
  // 146+: Very Hard (5)
  if (slope < 86) return Math.max(1, Math.ceil((slope - 55) / 15));
  if (slope < 116) return 3;
  if (slope < 146) return 4;
  return 5;
}

/**
 * Map iGolf amenities to CourseAmenities
 */
function mapAmenities(course: IGolfCourse): CourseAmenities {
  return {
    drivingRange: course.drivingRange ?? false,
    puttingGreen: course.puttingGreen ?? false,
    chippingArea: course.chippingArea ?? false,
    proShop: course.proShop ?? false,
    restaurant: course.restaurant ?? false,
    cartRental: course.golfCarts ?? false,
    clubRental: course.clubRental ?? false,
    lockers: false, // Not in iGolf API
  };
}

/**
 * Create default tee boxes from iGolf data
 */
function createDefaultTeeBoxes(course: IGolfCourse): TeeBox[] {
  const teeBoxes: TeeBox[] = [];

  // Create a single tee box from available data
  if (course.yardage && course.par) {
    teeBoxes.push({
      color: 'blue',
      name: 'Men',
      rating: course.rating || 72,
      slope: course.slope || 113,
      yardage: course.yardage,
      par: course.par,
    });
  }

  // If no data, create a default 18-hole par 72 course
  if (teeBoxes.length === 0) {
    teeBoxes.push({
      color: 'blue',
      name: 'Men',
      rating: 72,
      slope: 113,
      yardage: 6500,
      par: 72,
    });
  }

  return teeBoxes;
}

/**
 * Transform IGolfCourse to CourseExtended
 */
export function transformIGolfCourse(igolf: IGolfCourse): CourseExtended {
  const stateCode = getStateCode(igolf.id_state) || '';
  const now = Date.now();

  return {
    id: `igolf-${igolf.id_course}`,
    name: igolf.courseName,

    location: {
      address: igolf.address1,
      city: igolf.city,
      state: stateCode,
      country: 'USA',
      postalCode: igolf.zipCode,
      latitude: igolf.latitude,
      longitude: igolf.longitude,
    },

    contact: {
      phone: igolf.phone || undefined,
      website: igolf.url || undefined,
    },

    holes: igolf.layoutHoles || 18,
    designer: igolf.architect,
    yearBuilt: igolf.yearBuilt,
    courseType: inferCourseType(igolf.class),

    teeBoxes: createDefaultTeeBoxes(igolf),

    rating: {
      average: igolf.recommendRating || 0,
      count: 0,
      difficulty: calculateDifficulty(igolf.slope),
    },

    pricing: igolf.weekday18 || igolf.weekend18 ? {
      weekday: igolf.weekday18,
      weekend: igolf.weekend18,
      twilight: igolf.twilight,
      currency: 'USD',
    } : undefined,

    amenities: mapAmenities(igolf),

    images: [],
    thumbnailUrl: undefined,

    description: undefined,
    features: [],

    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Search courses using iGolf CourseList API
 */
export async function searchCourses(params: CourseListParams): Promise<CourseExtended[]> {
  if (!isIGolfEnabled()) {
    console.warn('iGolf integration is not enabled');
    return [];
  }

  // Build API parameters
  const apiParams: Record<string, any> = {
    page: params.page || 1,
    limit: Math.min(params.limit || 50, MAX_RESULTS_PER_PAGE),
  };

  // Location-based search
  if (params.latitude && params.longitude) {
    apiParams.latitude = params.latitude;
    apiParams.longitude = params.longitude;
    apiParams.radius = params.radius || 25; // Default 25 miles
  }

  // Text search (minimum 4 characters per iGolf requirement)
  if (params.searchText && params.searchText.length >= 4) {
    apiParams.searchText = params.searchText;
  }

  // Location filters
  if (params.city) apiParams.city = params.city;
  if (params.stateId) apiParams.stateId = params.stateId;
  if (params.zipCode) apiParams.zipCode = params.zipCode;
  apiParams.countryId = params.countryId || 1; // Default to USA

  // Attribute filters
  if (params.holes) apiParams.holes = params.holes;
  if (params.classType) apiParams.class = params.classType;

  // Amenity filters
  if (params.drivingRange) apiParams.drivingRange = 1;
  if (params.puttingGreen) apiParams.puttingGreen = 1;
  if (params.restaurant) apiParams.restaurant = 1;
  if (params.lodging) apiParams.lodging = 1;

  try {
    const response = await makeIGolfRequest<IGolfCourse[]>('CourseList', apiParams);

    if (!response.success || !response.data) {
      console.error('iGolf CourseList failed:', response.error);
      return [];
    }

    // Transform iGolf courses to CourseExtended
    const courses = Array.isArray(response.data) ? response.data : [];
    return courses.map(transformIGolfCourse);
  } catch (error) {
    console.error('Error searching iGolf courses:', error);
    return [];
  }
}

/**
 * Get course details using iGolf CourseDetails API
 */
export async function getCourseDetails(igolfCourseId: number): Promise<CourseExtended | null> {
  if (!isIGolfEnabled()) {
    console.warn('iGolf integration is not enabled');
    return null;
  }

  try {
    const response = await makeIGolfRequest<IGolfCourseDetails>('CourseDetails', {
      courseId: igolfCourseId,
    });

    if (!response.success || !response.data) {
      console.error('iGolf CourseDetails failed:', response.error);
      return null;
    }

    // Transform and enhance with detail data
    const course = transformIGolfCourse(response.data);

    // Add description if available
    if (response.data.description) {
      course.description = response.data.description;
    }

    // Add tee boxes if available
    if (response.data.teeBoxes && response.data.teeBoxes.length > 0) {
      course.teeBoxes = response.data.teeBoxes.map(tee => ({
        color: tee.color.toLowerCase(),
        name: tee.name,
        rating: tee.rating,
        slope: tee.slope,
        yardage: tee.yardage,
        par: tee.par,
      }));
    }

    return course;
  } catch (error) {
    console.error('Error fetching iGolf course details:', error);
    return null;
  }
}

/**
 * Get list of US states from iGolf StateList API
 * (Useful for validating state mappings)
 */
export async function getStates(): Promise<Array<{ id: number; name: string }>> {
  if (!isIGolfEnabled()) {
    return [];
  }

  try {
    const response = await makeIGolfRequest<Array<{ id_state: number; stateName: string }>>(
      'StateList',
      { countryId: 1 } // USA
    );

    if (!response.success || !response.data) {
      return [];
    }

    return response.data.map(state => ({
      id: state.id_state,
      name: state.stateName,
    }));
  } catch (error) {
    console.error('Error fetching iGolf states:', error);
    return [];
  }
}

// Export a singleton instance
export const igolfApi = {
  isEnabled: isIGolfEnabled,
  searchCourses,
  getCourseDetails,
  getStates,
};
