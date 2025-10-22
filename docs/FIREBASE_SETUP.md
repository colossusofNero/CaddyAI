# Firebase Setup Guide

This guide will help you configure Firebase for the CaddyAI application.

## Overview

CaddyAI uses Firebase for:
- **Authentication**: User sign-in with email, Google, and Apple
- **Firestore Database**: Course data, user profiles, favorites, and rounds
- **Storage**: Course images and user avatars

## Development Mode

**Good news!** If Firebase is not configured, the app will automatically use mock data for development. This allows you to:
- Test the UI without setting up Firebase
- See sample courses and data
- Develop frontend features independently

You'll see warnings in the browser console like:
```
[Firebase] Using mock data - Firebase not configured
```

This is normal and expected when Firebase credentials are not set up.

## Setting Up Firebase

### Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Add project" or select an existing project
3. Follow the setup wizard (you can disable Analytics if not needed)

### Step 2: Enable Authentication

1. In the Firebase Console, go to **Authentication**
2. Click "Get started"
3. Enable the following sign-in methods:
   - Email/Password
   - Google (optional but recommended)
   - Apple (optional)

### Step 3: Create Firestore Database

1. Go to **Firestore Database**
2. Click "Create database"
3. Choose production mode (we'll set rules later)
4. Select a location closest to your users

### Step 4: Set Up Security Rules

In Firestore Database, go to the **Rules** tab and update:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User profiles - users can only read/write their own
    match /profiles/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }

    // User clubs - users can only read/write their own
    match /clubs/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }

    // User preferences - users can only read/write their own
    match /preferences/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }

    // Courses - read-only for all authenticated users
    match /courses/{courseId} {
      allow read: if request.auth != null;
      allow write: if false; // Only admins can write (via backend)
    }

    // Course holes - read-only for all authenticated users
    match /courseHoles/{holeId} {
      allow read: if request.auth != null;
      allow write: if false; // Only admins can write (via backend)
    }

    // Favorite courses - users can manage their own
    match /courseFavorites/{favoriteId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null &&
        favoriteId.matches('^' + request.auth.uid + '_.*');
    }

    // Active rounds - users can manage their own
    match /activeRounds/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }

    // Course reviews - authenticated users can read all, write their own
    match /courseReviews/{reviewId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null &&
        resource.data.userId == request.auth.uid;
    }
  }
}
```

### Step 5: Get Your Configuration

1. In Firebase Console, click the gear icon ⚙️ > **Project settings**
2. Scroll down to "Your apps"
3. If you don't have a web app, click "Add app" and select Web (</>)
4. Register your app with a nickname (e.g., "CaddyAI Web")
5. Copy the configuration values

### Step 6: Configure Environment Variables

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Update `.env.local` with your Firebase credentials:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```

3. Restart your development server:
   ```bash
   npm run dev
   ```

## Verifying Your Setup

After configuring Firebase, you should see in the browser console:
```
[Firebase] Successfully initialized
```

Instead of:
```
[Firebase] Using mock data - Firebase not configured
```

## Populating Course Data

The app expects course data in the following Firestore collections:

### `courses` Collection

Each document should have:
```javascript
{
  name: "Course Name",
  description: "Course description",
  location: {
    address: "123 Main St",
    city: "City",
    state: "State",
    zipCode: "12345",
    country: "USA",
    latitude: 36.5682,
    longitude: -121.9478
  },
  courseType: "public|private|semi-private|resort",
  holes: 18,
  teeBoxes: [
    {
      name: "Championship",
      color: "Blue",
      rating: 75.5,
      slope: 145,
      par: 72,
      yardage: 7041
    }
  ],
  rating: {
    average: 4.5,
    count: 100,
    difficulty: 7.5
  },
  amenities: ["pro-shop", "restaurant", "practice-facilities"],
  thumbnailUrl: "https://...",
  images: [],
  website: "https://...",
  phone: "(123) 456-7890",
  createdAt: Date.now(),
  updatedAt: Date.now()
}
```

### `courseHoles` Collection

Each document should have:
```javascript
{
  courseId: "course_id",
  holeNumber: 1,
  par: 4,
  handicap: 5,
  description: "Hole description",
  teeBoxDistances: {
    blue: 420,
    white: 380,
    red: 320
  },
  imageUrl: "https://..."
}
```

## Troubleshooting

### "Firebase not configured" warnings

This is expected if you haven't set up Firebase yet. The app will use mock data automatically.

### Authentication errors

1. Check that Email/Password is enabled in Firebase Console > Authentication
2. Verify your API key and Auth Domain are correct
3. Make sure authorized domains include `localhost` (should be default)

### Firestore permission errors

Check your security rules in Firestore Database > Rules tab. Make sure they match the rules provided above.

### "Error getting popular courses"

This means:
1. Firebase is configured but connection failed, OR
2. The `courses` collection is empty

The app will automatically fall back to mock data.

## Security Notes

- The Firebase credentials in `.env.local` are PUBLIC and safe to use client-side
- Security is enforced through Firestore Security Rules, not by hiding credentials
- Never commit real user data or private keys to version control
- The `.env.local` file is in `.gitignore` to prevent accidental commits

## Need Help?

If you encounter issues:
1. Check the browser console for detailed error messages
2. Verify all environment variables are set correctly
3. Ensure your Firebase project is in the correct region
4. Check Firebase Console for any service outages or quota limits
