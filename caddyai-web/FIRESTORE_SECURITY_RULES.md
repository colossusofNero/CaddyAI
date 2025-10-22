# Firestore Security Rules for CaddyAI

This document provides the Firestore security rules that should be applied to your Firebase project to secure the CaddyAI web and mobile applications.

## Security Rules

Apply these rules in the Firebase Console > Firestore Database > Rules:

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }

    // Users collection - stores user metadata
    match /users/{userId} {
      allow read: if isOwner(userId);
      allow create: if isAuthenticated() && request.auth.uid == userId;
      allow update: if isOwner(userId);
      allow delete: if false; // Prevent accidental deletion
    }

    // Profiles collection - stores user golf profiles
    match /profiles/{userId} {
      allow read: if isOwner(userId);
      allow create: if isAuthenticated() && request.auth.uid == userId;
      allow update: if isOwner(userId);
      allow delete: if false; // Prevent accidental deletion
    }

    // Clubs collection - stores user club data
    match /clubs/{clubId} {
      allow read: if isAuthenticated() && resource.data.userId == request.auth.uid;
      allow create: if isAuthenticated() && request.resource.data.userId == request.auth.uid;
      allow update: if isAuthenticated() && resource.data.userId == request.auth.uid;
      allow delete: if isAuthenticated() && resource.data.userId == request.auth.uid;
    }

    // Rounds collection - stores golf round data
    match /rounds/{roundId} {
      allow read: if isAuthenticated() && resource.data.userId == request.auth.uid;
      allow create: if isAuthenticated() && request.resource.data.userId == request.auth.uid;
      allow update: if isAuthenticated() && resource.data.userId == request.auth.uid;
      allow delete: if isAuthenticated() && resource.data.userId == request.auth.uid;
    }

    // Shots collection - stores shot data for analytics
    match /shots/{shotId} {
      allow read: if isAuthenticated() && resource.data.userId == request.auth.uid;
      allow create: if isAuthenticated() && request.resource.data.userId == request.auth.uid;
      allow update: if isAuthenticated() && resource.data.userId == request.auth.uid;
      allow delete: if isAuthenticated() && resource.data.userId == request.auth.uid;
    }

    // Default deny all other access
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

## Database Schema

### users collection
- **Path**: `/users/{userId}`
- **Fields**:
  - `userId`: string (same as auth UID)
  - `email`: string | null
  - `displayName`: string | null
  - `photoURL`: string | null
  - `createdAt`: timestamp
  - `lastLoginAt`: timestamp
  - `onboardingComplete`: boolean
  - `profileComplete`: boolean
  - `clubsComplete`: boolean

### profiles collection
- **Path**: `/profiles/{userId}`
- **Fields**:
  - `id`: string (same as userId)
  - `email`: string | null
  - `name`: string | null
  - `shotShape`: string ('draw' | 'fade' | 'straight' | 'variable')
  - `handedness`: string ('left' | 'right')
  - `clubSet`: string ('beginner' | 'intermediate' | 'advanced')
  - `clubs`: array of strings (club identifiers like 'DR', '3W', etc.)
  - `skillLevel`: string ('beginner' | 'intermediate' | 'advanced')
  - `preferences`: object
    - `units`: string ('metric' | 'imperial')
    - `voiceEnabled`: boolean
    - `notifications`: boolean
  - `onboardingCompletedAt`: string (ISO date) | null
  - `onboardingDuration`: number (milliseconds) | null
  - `createdAt`: timestamp
  - `updatedAt`: timestamp

### clubs collection
- **Path**: `/clubs/{clubId}`
- **Fields**:
  - `userId`: string (owner)
  - `clubName`: string
  - `averageDistance`: number
  - `createdAt`: timestamp
  - `updatedAt`: timestamp

## How to Apply

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (caddyai-aaabd)
3. Navigate to **Firestore Database** in the left sidebar
4. Click on the **Rules** tab
5. Copy and paste the rules from above
6. Click **Publish**

## Testing

After applying the rules, test them by:

1. Signing in to the web app
2. Creating a profile
3. Updating your profile
4. Verifying that you can only access your own data
5. Testing in the Firebase Console using the Rules Playground

## Security Best Practices

1. ✅ Users can only read/write their own data
2. ✅ Authentication is required for all operations
3. ✅ Deletion is prevented to avoid accidental data loss
4. ✅ Creation requires proper userId validation
5. ✅ All other paths are explicitly denied

## Sync with React Native App

These security rules work with both the web app and React Native app. Both apps use the same Firebase project and authenticate users using Firebase Authentication, ensuring seamless data sync across platforms.
