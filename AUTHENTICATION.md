# CaddyAI Web Authentication Guide

This document provides a comprehensive overview of the authentication system implemented in the CaddyAI web application.

## Overview

The CaddyAI web app uses **Firebase Authentication** to manage user accounts and sessions. It syncs user data with the React Native mobile app using the same Firebase project.

## Features

### Implemented ✅

- [x] Email/password authentication
- [x] Google OAuth sign-in
- [x] Apple OAuth sign-in
- [x] Password reset flow
- [x] Email verification
- [x] Session persistence
- [x] Protected routes
- [x] User profile sync
- [x] Error handling with user-friendly messages
- [x] Loading states
- [x] Auto-redirect after authentication

## Architecture

### Components

```
hooks/
  └── useAuth.tsx          # Authentication hook and context provider
services/
  └── authService.ts       # Firebase auth operations
  └── profileService.ts    # User profile management
components/
  └── auth/
      └── ProtectedRoute.tsx  # Route protection wrapper
app/
  ├── login/page.tsx       # Login page
  ├── signup/page.tsx      # Signup page
  └── layout.tsx           # Root layout with AuthProvider
```

## Usage

### 1. Using Authentication in Components

```typescript
'use client';

import { useAuth } from '@/hooks/useAuth';

export default function MyComponent() {
  const { user, loading, signOut } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <div>Please sign in</div>;
  }

  return (
    <div>
      <p>Welcome, {user.displayName || user.email}!</p>
      <button onClick={signOut}>Sign Out</button>
    </div>
  );
}
```

### 2. Protected Routes

```typescript
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function DashboardPage() {
  return (
    <ProtectedRoute requireOnboarding={true}>
      <div>
        <h1>Dashboard</h1>
        {/* Your protected content */}
      </div>
    </ProtectedRoute>
  );
}
```

### 3. Sign Up

```typescript
const { signUp } = useAuth();

await signUp('user@example.com', 'password123', 'John Doe');
```

### 4. Sign In

```typescript
const { signIn } = useAuth();

await signIn('user@example.com', 'password123');
```

### 5. Social Authentication

```typescript
const { signInWithGoogle, signInWithApple } = useAuth();

// Google Sign-In
await signInWithGoogle();

// Apple Sign-In
await signInWithApple();
```

### 6. Password Reset

```typescript
const { resetPassword } = useAuth();

await resetPassword('user@example.com');
```

## Authentication Flow

### Sign Up Flow

1. User fills in signup form (name, email, password)
2. Frontend validates input
3. `signUp()` creates Firebase auth account
4. User profile is created in Firestore (`/users/{userId}`)
5. Email verification is sent
6. User is redirected to dashboard

### Sign In Flow

1. User enters credentials
2. Frontend validates input
3. `signIn()` authenticates with Firebase
4. Last login timestamp is updated
5. User metadata is fetched
6. User is redirected to dashboard

### Social Auth Flow

1. User clicks "Sign in with Google/Apple"
2. OAuth popup opens
3. User authorizes in popup
4. Firebase creates/retrieves account
5. Profile is created if new user
6. User is redirected to dashboard

### Protected Route Flow

1. Component wrapped in `<ProtectedRoute>`
2. Auth state is checked
3. If not authenticated → redirect to `/login`
4. If onboarding incomplete → redirect to `/onboarding`
5. If authenticated → render children

## User Metadata

The app stores two types of user data:

### 1. Authentication Metadata (`/users/{userId}`)
Managed by `authService.ts`:
- Email, display name, photo URL
- Created/last login timestamps
- Onboarding/profile completion flags

### 2. Profile Data (`/profiles/{userId}`)
Managed by `profileService.ts`:
- Golf preferences (shot shape, handedness)
- Club set and individual clubs
- Skill level
- User preferences (units, voice, notifications)
- Onboarding completion data

## Firebase Configuration

### Environment Variables

Located in `.env.local`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyBEKOnyd9OxjJG2FYwCKljkTdYNirFnVfs
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=caddyai-aaabd.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=caddyai-aaabd
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=caddyai-aaabd.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=959257428579
NEXT_PUBLIC_FIREBASE_APP_ID=1:959257428579:web:9ae9cea97b63eae2606e56
```

### Firebase Project

- **Project ID**: `caddyai-aaabd`
- **Region**: Multi-region
- **Authentication Providers**:
  - Email/Password ✅
  - Google OAuth ✅
  - Apple OAuth ✅

## Error Handling

The authentication system provides user-friendly error messages for common scenarios:

| Error Code | User Message |
|------------|--------------|
| `auth/email-already-in-use` | "This email is already registered. Please sign in instead." |
| `auth/invalid-email` | "Invalid email address. Please check and try again." |
| `auth/weak-password` | "Password is too weak. Please use at least 6 characters." |
| `auth/user-not-found` | "No account found with this email. Please sign up first." |
| `auth/wrong-password` | "Incorrect password. Please try again." |
| `auth/too-many-requests` | "Too many failed attempts. Please try again later." |
| `auth/popup-closed-by-user` | "Sign-in was cancelled. Please try again." |

## Session Management

- Sessions persist across page refreshes using Firebase's built-in persistence
- Auth state changes are observed via `onAuthStateChanged`
- Users remain signed in until they explicitly sign out
- Token refresh is handled automatically by Firebase

## Security

### Client-Side
- Password validation (min 8 chars, uppercase, lowercase, number)
- Email validation
- HTTPS enforced
- No sensitive data in localStorage

### Server-Side (Firestore Rules)
See `FIRESTORE_SECURITY_RULES.md` for complete security rules.

Key points:
- Users can only access their own data
- Authentication required for all operations
- Proper userId validation on creation
- Deletion prevented to avoid data loss

## Cross-Platform Sync

The web app shares authentication and data with the React Native mobile app:

### Shared Resources
- ✅ Firebase project (`caddyai-aaabd`)
- ✅ Authentication state
- ✅ User profiles
- ✅ Club data
- ✅ Firestore database

### Differences
- Web uses Firebase Web SDK (v11)
- Mobile uses React Native Firebase SDK (v23)
- Both use modular API for consistency

## Enabling Apple Sign-In

To enable Apple Sign-In in production:

### 1. Firebase Console
1. Go to Authentication > Sign-in method
2. Enable Apple provider
3. Configure Service ID: `com.caddyai.web`
4. Add authorized domains: `caddyai-web.vercel.app`

### 2. Apple Developer
1. Create an App ID
2. Enable "Sign in with Apple"
3. Create a Service ID for the web app
4. Configure redirect URLs: `https://caddyai-aaabd.firebaseapp.com/__/auth/handler`

### 3. Vercel/Production
1. Ensure domain is added to Firebase authorized domains
2. Deploy with correct environment variables
3. Test OAuth flow in production

## Testing Checklist

### Email/Password
- [ ] Sign up with valid email
- [ ] Sign up with existing email (error)
- [ ] Sign in with valid credentials
- [ ] Sign in with wrong password (error)
- [ ] Password reset request
- [ ] Email verification sent

### Google OAuth
- [ ] Sign in with Google
- [ ] Sign up with Google
- [ ] Cancel Google sign-in
- [ ] Multiple Google accounts

### Apple OAuth
- [ ] Sign in with Apple (production only)
- [ ] Sign up with Apple
- [ ] Cancel Apple sign-in

### Session & Routes
- [ ] Session persists after refresh
- [ ] Protected routes redirect to login
- [ ] Auto-redirect after login
- [ ] Sign out clears session
- [ ] Multiple tabs sync auth state

### Error Handling
- [ ] Network error shows user-friendly message
- [ ] Invalid credentials show clear error
- [ ] Loading states display correctly
- [ ] Error messages clear on retry

## Troubleshooting

### "User not found" after signup
- Check Firebase console for user creation
- Verify email/password provider is enabled
- Check browser console for errors

### Google Sign-In popup blocked
- Check browser popup settings
- Ensure Firebase domain is authorized
- Try in incognito mode

### Apple Sign-In not working
- Apple OAuth only works in production with HTTPS
- Verify Service ID configuration in Apple Developer
- Check redirect URL matches exactly

### Session not persisting
- Check browser storage permissions
- Verify Firebase configuration is correct
- Clear browser cache and retry

## Development vs Production

### Development (localhost)
- Email/password ✅
- Google OAuth ✅
- Apple OAuth ❌ (requires HTTPS)

### Production (vercel.app)
- Email/password ✅
- Google OAuth ✅
- Apple OAuth ✅ (requires proper configuration)

## Next Steps

Future enhancements to consider:

- [ ] Phone number authentication
- [ ] Multi-factor authentication (MFA)
- [ ] Social account linking
- [ ] Anonymous authentication
- [ ] Custom email templates
- [ ] Account deletion flow
- [ ] Email change functionality
- [ ] Rate limiting for auth attempts

## Resources

- [Firebase Authentication Docs](https://firebase.google.com/docs/auth)
- [Next.js Authentication Guide](https://nextjs.org/docs/authentication)
- [Apple Sign In Guide](https://developer.apple.com/sign-in-with-apple/)
- [Google OAuth Guide](https://developers.google.com/identity/protocols/oauth2)

## Support

For authentication-related issues:
1. Check browser console for detailed errors
2. Review Firebase console for failed auth attempts
3. Verify environment variables are correct
4. Check Firestore security rules
5. Test in incognito mode to rule out cache issues
