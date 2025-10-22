# Firebase Quick Reference

## TL;DR

The app works with or without Firebase. If you see course data, you're good to go!

## Current Status Check

Open browser console and look for one of these messages:

### ✅ Working (with Firebase)
```
[Firebase] Successfully initialized
```

### ✅ Working (with mock data)
```
[Firebase] Running in offline mode - Firebase services unavailable
[CourseService] Using mock data - Firebase not configured
```

### ⚠️ Fallback Mode (Firebase error)
```
[Firebase] Initialization error: ...
[CourseService] Falling back to mock data
```

## Quick Fixes

### "I see mock data but want real data"

1. Check Firebase credentials in `.env.local`
2. Go to [Firebase Console](https://console.firebase.google.com)
3. Verify project `caddyai-aaabd` exists and you have access
4. Enable Firestore Database
5. Add course data to `courses` collection
6. Restart dev server: `npm run dev`

### "I want to keep using mock data"

You're already set! The app works perfectly with mock data for UI development.

### "I need to set up Firebase from scratch"

See `docs/FIREBASE_SETUP.md` for complete step-by-step guide.

## Environment Variables

Required in `.env.local`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

## Mock Data

The app includes 3 sample courses:
- Pebble Beach Golf Links (CA)
- Augusta National Golf Club (GA)
- St Andrews Links (Scotland)

These appear automatically when Firebase is not configured or fails.

## Common Issues

| Issue | Solution |
|-------|----------|
| "Error loading courses" | Normal - app falls back to mock data |
| "Firebase not configured" | Expected if you haven't set up Firebase |
| Courses not showing | Check browser console for specific error |
| Auth not working | Enable Email/Password in Firebase Console > Authentication |

## Need Help?

1. Check browser console (F12) for error messages
2. See `docs/FIREBASE_SETUP.md` for detailed setup
3. See `docs/FIREBASE_FIX_SUMMARY.md` for technical details
