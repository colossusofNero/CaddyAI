# iGolf 3D Viewer Integration - CaddyAI Web

## Overview

This document describes the iGolf API and 3D viewer integration for the CaddyAI web application.

## Features

### 1. **3D Course Viewer**
- Interactive 3D course visualization powered by iGolf
- Hole-by-hole navigation with visual flyover
- Pin drop functionality for precise location marking
- Fullscreen mode for immersive viewing
- Quick hole selector (1-18)

### 2. **Course Search**
- Search courses by name
- Location-based "Near Me" search using geolocation
- Display course details (holes, par, rating, slope)
- Thumbnail images for visual identification
- Favorite course functionality

### 3. **Course Details Page**
- Comprehensive course information
- Contact details (phone, website)
- Course statistics and ratings
- 3D viewer integration
- Interactive scorecard

### 4. **Scorecard Widget**
- Multi-tee box support (Black, Blue, White, Gold, Red)
- Front nine / back nine / total breakdown
- Yardage per hole for selected tee
- Par and handicap information
- Click-to-navigate hole selection

## Project Structure

```
caddyai-web/
├── types/
│   └── course.ts                 # TypeScript type definitions
├── services/
│   ├── igolfService.ts           # iGolf API wrapper
│   └── firebaseService.ts        # Firebase operations
├── components/
│   └── courses/
│       ├── CourseSearch.tsx      # Search UI component
│       ├── CourseViewer3D.tsx    # 3D viewer component
│       └── ScorecardWidget.tsx   # Scorecard display
├── app/
│   └── courses/
│       ├── page.tsx              # Course search page
│       └── [id]/
│           └── page.tsx          # Course details page
└── .env.local                    # Environment variables
```

## Setup Instructions

### 1. Install Dependencies

```bash
npm install firebase lucide-react
```

### 2. Configure Environment Variables

Create `.env.local` file (copy from `.env.local.example`):

```bash
# iGolf API Credentials
NEXT_PUBLIC_IGOLF_API_KEY=your_igolf_api_key_here
IGOLF_SECRET_KEY=your_igolf_secret_key_here

# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=caddyai-aaabd.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=caddyai-aaabd
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=caddyai-aaabd.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id_here
NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id_here
```

### 3. Get iGolf API Credentials

1. Register at https://connectaccount.igolf.com/
2. Create a new application
3. Copy API Key and Secret Key
4. Add to `.env.local`

### 4. Configure Firebase

The integration uses Firebase for:
- Storing favorite courses
- Managing active rounds
- Syncing data with mobile app

**Firebase Collections:**

**`favoriteCourses`**
```typescript
{
  id: string;              // Format: {userId}_{courseId}
  userId: string;
  courseId: string;
  courseName: string;
  location: string;
  imageUrl?: string;
  addedAt: string;        // ISO timestamp
}
```

**`activeRounds`**
```typescript
{
  id: string;              // userId
  userId: string;
  courseId: string;
  courseName: string;
  currentHole: number;
  startedAt: string;       // ISO timestamp
  completedAt?: string;    // ISO timestamp
  holes: [{
    holeNumber: number;
    par: number;
    score?: number;
    putts?: number;
    fairwayHit?: boolean;
    greenInRegulation?: boolean;
  }];
}
```

### 5. Deploy Firestore Rules

```bash
firebase deploy --only firestore:rules
```

**Security Rules:**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Favorite Courses
    match /favoriteCourses/{docId} {
      allow read: if request.auth != null && resource.data.userId == request.auth.uid;
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
      allow update, delete: if request.auth != null && resource.data.userId == request.auth.uid;
    }

    // Active Rounds
    match /activeRounds/{userId} {
      allow read: if request.auth != null && userId == request.auth.uid;
      allow create, update: if request.auth != null && userId == request.auth.uid;
      allow delete: if request.auth != null && userId == request.auth.uid;
    }
  }
}
```

## API Usage

### iGolf Service

```typescript
import { igolfService } from '@/services/igolfService';

// Search for courses
const results = await igolfService.searchCourses({
  query: 'Pebble Beach',
  pageSize: 20
});

// Get course details
const course = await igolfService.getCourse(courseId);

// Get scorecard
const scorecard = await igolfService.getScorecard(courseId);

// Get specific hole
const hole = await igolfService.getHole(courseId, 1);

// Get nearby courses
const nearby = await igolfService.getNearbyCourses(
  latitude,
  longitude,
  25 // radius in miles
);
```

### Firebase Service

```typescript
import { firebaseService } from '@/services/firebaseService';

// Add favorite course
await firebaseService.addFavoriteCourse(
  userId,
  courseId,
  courseName,
  location,
  imageUrl
);

// Get favorite courses
const favorites = await firebaseService.getFavoriteCourses(userId);

// Start a round
const roundId = await firebaseService.startRound(
  userId,
  courseId,
  courseName,
  18 // holes
);

// Get active round
const round = await firebaseService.getActiveRound(userId);

// Update current hole
await firebaseService.updateCurrentHole(userId, 5);

// Complete round
await firebaseService.completeRound(userId);
```

## Component Usage

### CourseSearch

```tsx
import CourseSearch from '@/components/courses/CourseSearch';

<CourseSearch
  userId="user-123"
  onCourseSelect={(course) => {
    console.log('Selected:', course.name);
  }}
  showFavorites={true}
/>
```

### CourseViewer3D

```tsx
import CourseViewer3D from '@/components/courses/CourseViewer3D';

<CourseViewer3D
  courseId="course-123"
  initialHole={1}
  onHoleChange={(hole) => {
    console.log('Viewing hole:', hole);
  }}
  height="600px"
/>
```

### ScorecardWidget

```tsx
import ScorecardWidget from '@/components/courses/ScorecardWidget';

<ScorecardWidget
  scorecard={scorecardData}
  selectedTeeBox="blue"
  onTeeBoxChange={(teeBox) => {
    console.log('Selected tee:', teeBox);
  }}
  onHoleSelect={(hole) => {
    console.log('Selected hole:', hole);
  }}
/>
```

## Testing

### Test with Pebble Beach

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Navigate to http://localhost:3000/courses

3. Search for "Pebble Beach"

4. Click on "Pebble Beach Golf Links"

5. Verify:
   - ✅ 3D viewer loads
   - ✅ Can navigate between holes
   - ✅ Scorecard displays correctly
   - ✅ Can favorite the course
   - ✅ Can start a round

### Test Scenarios

**Course Search:**
- Search by name
- Search with location
- Add to favorites
- Navigate to details

**3D Viewer:**
- Load course
- Navigate holes (1-18)
- Fullscreen mode
- Quick hole selector

**Scorecard:**
- Switch tee boxes
- View yardages
- Click holes to navigate
- View totals

**Favorites:**
- Add course
- Remove course
- Persist across sessions

**Round Management:**
- Start round
- Save to Firebase
- Verify data structure
- Check mobile app sync

## Integration with Mobile App

The web app shares Firebase data with the mobile app:

**Shared Data:**
- Favorite courses
- Active rounds
- Course selections

**Workflow:**
1. User searches course on web
2. Selects course and starts round
3. Round data saved to Firebase (`activeRounds/{userId}`)
4. Mobile app reads active round
5. User plays round on mobile
6. Stats sync back to Firebase

## Troubleshooting

### 3D Viewer Not Loading

**Issue:** Black screen or loading spinner
**Solutions:**
- Check API key in `.env.local`
- Verify iGolf script loads (check Network tab)
- Check browser console for errors
- Ensure course ID is valid

### Search Returns No Results

**Issue:** Empty results or errors
**Solutions:**
- Check API key configuration
- Verify internet connection
- Check iGolf API status
- Try different search terms

### Firebase Errors

**Issue:** Permission denied or connection errors
**Solutions:**
- Check Firebase configuration in `.env.local`
- Verify user is authenticated
- Check Firestore rules are deployed
- Ensure Firebase project ID matches

## Resources

- **iGolf API Docs:** https://viewer.igolf.com/docs
- **iGolf Account:** https://connectaccount.igolf.com/
- **Firebase Console:** https://console.firebase.google.com/
- **Next.js Docs:** https://nextjs.org/docs
- **Tailwind CSS:** https://tailwindcss.com/docs

## Support

For issues or questions:
1. Check this documentation
2. Review browser console for errors
3. Check iGolf API status
4. Verify Firebase configuration
5. Create issue in GitHub repo

## License

This integration is part of the CaddyAI project.
