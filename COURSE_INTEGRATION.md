# Course Integration & Maps - Implementation Guide

## Overview

This document describes the implementation of the Course Integration and 2D Maps feature for CaddyAI Web. Since iGolf doesn't provide a web API, this implementation uses an alternative approach with Leaflet maps and Firebase for course data storage.

## Architecture

### Data Storage

Course data is stored in Firebase Firestore with the following collections:

- **courses** - Main course information
- **courseHoles** - Individual hole data with geometry
- **courseFavorites** - User favorite courses
- **courseReviews** - Course reviews and ratings

### Technology Stack

- **Maps**: Leaflet with satellite imagery tiles
- **Offline Storage**: IndexedDB for offline course data
- **Service Worker**: Caching and offline support
- **GPS**: Web Geolocation API

## Features Implemented

### ✅ Course Search Page (`/courses`)

**Location**: `app/courses/page.tsx`

Features:
- Search by name or location
- Filter by course type, holes, rating
- Geolocation-based "Nearby" courses
- Sort by distance, rating, or name
- Responsive grid layout
- Real-time search

**Usage**:
```typescript
import { searchCourses, getNearbyCourses } from '@/services/courseService';

// Search with filters
const results = await searchCourses({
  query: 'Pebble Beach',
  location: { latitude: 36.5, longitude: -121.9, radius: 50 },
  courseType: ['public', 'resort'],
  sortBy: 'rating',
  limit: 20
});

// Get nearby courses
const nearby = await getNearbyCourses(latitude, longitude, 25, 20);
```

### ✅ Course Detail Page (`/courses/[id]`)

**Location**: `app/courses/[id]/page.tsx`

Features:
- Interactive 2D hole maps with satellite imagery
- Hole selector (1-18)
- Full scorecard with all tee boxes
- Course information (designer, year, amenities)
- Add to favorites
- GPS distance to green
- Reviews and ratings

**Components**:
- `CourseMap` - 2D interactive map with Leaflet
- Displays fairways, greens, bunkers, water hazards
- User position marker with distance calculation
- Legend and distance overlay

### ✅ 2D Course Maps

**Location**: `components/CourseMap.tsx`

Features:
- Satellite imagery base layer
- Colored overlays:
  - Green for fairways and greens
  - Yellow for bunkers
  - Blue for water hazards
  - Red for tee boxes
- User position tracking with GPS
- Distance calculations (yards)
- Interactive markers with popups
- Auto-fit bounds to show entire hole

**Customization**:
```typescript
<CourseMap
  hole={holeData}
  userPosition={{ lat: 36.5, lng: -121.9 }}
  className="h-[500px]"
/>
```

### ✅ GPS Integration

**Location**: `services/gpsService.ts` and `hooks/useGPS.tsx`

Features:
- Real-time GPS tracking
- Distance calculations (Haversine formula)
- Accuracy monitoring
- High-accuracy mode
- Position watching with throttling
- Distance to green, hazards
- Shot tracking
- Fairway/green detection

**Usage**:
```typescript
import { useGPS } from '@/hooks/useGPS';

function MyComponent() {
  const {
    position,
    accuracy,
    isTracking,
    distanceInfo,
    startTracking,
    calculateDistances
  } = useGPS({ enableTracking: true });

  // Calculate distances to hole
  const distances = calculateDistances(holeData);
  // distances.toGreen, distances.toFrontGreen, distances.toBackGreen
}
```

### ✅ Course Favorites

**Location**: `hooks/useFavorites.tsx`

Features:
- Add/remove courses from favorites
- Toggle favorite status
- View all favorites
- Sync with Firebase
- Optimistic updates

**Usage**:
```typescript
import { useFavorites } from '@/hooks/useFavorites';

function MyComponent() {
  const {
    favorites,
    isFavorite,
    addToFavorites,
    removeFromFavorites,
    toggleFavorite
  } = useFavorites();

  const handleFavorite = () => {
    toggleFavorite(course);
  };
}
```

### ✅ Offline Support

**Location**: `services/offlineService.ts`, `public/sw.js`

Features:
- Download courses for offline use
- IndexedDB storage
- 7-day cache expiration
- Service worker for asset caching
- Offline page with course list
- Automatic cleanup of expired data
- Network-first, fallback to cache strategy

**Usage**:
```typescript
import {
  downloadCourseForOffline,
  getOfflineCourse,
  isCourseAvailableOffline
} from '@/services/offlineService';

// Download course
await downloadCourseForOffline(course, holes);

// Check if available offline
const isOffline = await isCourseAvailableOffline(courseId);

// Get offline data
const offlineData = await getOfflineCourse(courseId);
```

### ✅ Firestore Security Rules

**Location**: `firestore.rules`

Implemented security rules:
- **courses** - Read-only for authenticated users
- **courseHoles** - Read-only for authenticated users
- **courseFavorites** - Users can only access their own favorites
- **courseReviews** - Users can create/edit/delete their own reviews

## Data Schema

### Course Interface

```typescript
interface CourseExtended {
  id: string;
  name: string;
  location: CourseLocation;
  contact: CourseContact;
  holes: number;
  designer?: string;
  yearBuilt?: number;
  courseType: 'public' | 'private' | 'semi-private' | 'resort';
  teeBoxes: TeeBox[];
  rating: CourseRating;
  pricing?: CoursePricing;
  amenities: CourseAmenities;
  images: string[];
  thumbnailUrl?: string;
  description?: string;
  features?: string[];
  createdAt: number;
  updatedAt: number;
}
```

### Hole Interface

```typescript
interface CourseHoleExtended {
  id: string;
  courseId: string;
  holeNumber: number;
  par: number;
  handicap: number;
  yardages: { [teeColor: string]: number };
  geometry?: HoleGeometry;
  dogleg?: 'left' | 'right' | 'none';
  waterHazards: number;
  bunkers: number;
  description?: string;
  tips?: string;
  createdAt: number;
  updatedAt: number;
}
```

## Adding Course Data

### Manual Entry

Sample course data is provided in `scripts/sampleCourseData.json`. To add courses to Firebase:

1. Install Firebase CLI: `npm install -g firebase-tools`
2. Login: `firebase login`
3. Import data:

```bash
# Using Firebase Console
# 1. Go to Firestore Database
# 2. Start Collection > "courses"
# 3. Add documents manually from JSON

# Or use Firebase Admin SDK (Node.js script)
```

### Sample Import Script

Create `scripts/importCourses.js`:

```javascript
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');
const courseData = require('./sampleCourseData.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function importCourses() {
  const batch = db.batch();

  // Import courses
  for (const course of courseData.courses) {
    const courseRef = db.collection('courses').doc(course.id);
    batch.set(courseRef, course);
  }

  // Import holes
  for (const hole of courseData.holes) {
    const holeRef = db.collection('courseHoles').doc(hole.id);
    batch.set(holeRef, hole);
  }

  await batch.commit();
  console.log('Courses imported successfully!');
}

importCourses().catch(console.error);
```

## Testing

### Test Course Search

1. Navigate to `/courses`
2. Grant location permission
3. Click "Nearby" to see courses sorted by distance
4. Use search bar to find courses by name
5. Apply filters (course type, holes, sort)

### Test Course Detail

1. Click on a course from search results
2. View 2D map with hole geometry
3. Select different holes using hole selector
4. View scorecard with all tee boxes
5. Add course to favorites
6. Check GPS distance (if on mobile/location enabled)

### Test Offline Mode

1. Visit a course detail page
2. Download course for offline use (implement download button)
3. Turn off network (DevTools > Network > Offline)
4. Navigate to `/courses`
5. Should see offline page with downloaded courses
6. Click on offline course to view

### Test GPS Tracking

1. Open course detail page on mobile device
2. Grant location permission
3. Navigate to course (physically or using GPS simulator)
4. Watch distance to green update in real-time
5. Verify accuracy indicator shows GPS quality

## Performance Optimization

### Implemented Optimizations

1. **Dynamic imports**: CourseMap loaded client-side only
2. **Lazy loading**: Images loaded on demand
3. **Indexed queries**: Firestore composite indexes for search
4. **Caching**: Service worker caches static assets
5. **Throttling**: GPS updates throttled to save battery
6. **Pagination**: Search results limited and paginated

### Recommended Indexes

Create these Firestore indexes:

```
Collection: courses
- rating.average (Descending), rating.count (Descending)
- courseType (Ascending), rating.average (Descending)
- holes (Ascending), rating.average (Descending)

Collection: courseHoles
- courseId (Ascending), holeNumber (Ascending)

Collection: courseFavorites
- userId (Ascending), addedAt (Descending)

Collection: courseReviews
- courseId (Ascending), createdAt (Descending)
```

## Future Enhancements

### Planned Features

1. **Course data sources**:
   - Integration with Golf Genius API
   - Web scraping with proper permissions
   - Community-contributed course data
   - Import from CSV/Excel

2. **Advanced maps**:
   - 3D terrain visualization
   - Elevation profiles
   - Flyover animations
   - Multiple viewing angles

3. **Enhanced GPS**:
   - Shot tracking with club selection
   - Automatic fairway/green detection
   - Strokes gained analysis
   - Heat maps

4. **Social features**:
   - Course photos from users
   - Tips and tricks
   - Hole-by-hole recommendations
   - Friend leaderboards

5. **Tee time booking**:
   - Integration with tee time APIs
   - Availability checking
   - Booking management
   - Weather integration

## Troubleshooting

### Maps not loading

- Check Leaflet CSS import in CourseMap component
- Verify tile server URLs are accessible
- Check browser console for CORS errors

### GPS accuracy issues

- Ensure HTTPS connection (required for geolocation)
- Check device location settings
- Use high accuracy mode for better precision
- Consider GPS signal strength outdoors

### Offline mode not working

- Register service worker in app/layout.tsx
- Check IndexedDB support in browser
- Verify service worker is active (DevTools > Application > Service Workers)
- Clear cache and re-register if needed

## API Reference

See individual files for detailed API documentation:

- `services/courseService.ts` - Course data operations
- `services/gpsService.ts` - GPS and distance calculations
- `services/offlineService.ts` - Offline data management
- `hooks/useGPS.tsx` - GPS React hook
- `hooks/useFavorites.tsx` - Favorites React hook

## Support

For issues or questions:

1. Check this documentation
2. Review code comments in source files
3. Check browser console for errors
4. Test in different browsers
5. Verify Firebase configuration

## License

MIT License - Part of CaddyAI project
