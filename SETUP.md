# CaddyAI Web Setup Guide

## Prerequisites

- Node.js 20+ and npm
- Firebase account
- iGolf API account (optional, for 3D course visualization)

## 1. Install Dependencies

```bash
npm install
```

## 2. Environment Configuration

### Step 1: Copy Environment Template

```bash
cp .env.example .env.local
```

### Step 2: Configure Firebase

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: `caddyai-aaabd`
3. Go to Project Settings > General
4. Copy the configuration values to `.env.local`:
   - API Key
   - Auth Domain (should be: caddyai-aaabd.firebaseapp.com)
   - Project ID (should be: caddyai-aaabd)
   - Storage Bucket
   - Messaging Sender ID
   - App ID

### Step 3: Configure iGolf API (Optional)

1. Go to [iGolf API](https://igolfapi.com/)
2. Sign up for an account
3. Get your API keys
4. Add to `.env.local`:
   - `NEXT_PUBLIC_IGOLF_API_KEY`
   - `NEXT_PUBLIC_IGOLF_WEB_KEY`

**Note:** The app will work without iGolf API keys, but 3D course visualization will be disabled.

## 3. Firebase Setup

### Firestore Collections

Ensure these collections exist in Firestore:

- `users/{userId}` - User authentication data
- `profiles/{userId}` - Golf profiles (handicap, shot shape, etc.)
- `clubs/{userId}` - Club distances (26 clubs)
- `preferences/{userId}` - App settings
- `favoriteCourses/{userId}_{courseId}` - Saved courses
- `activeRounds/{userId}` - Current rounds in progress

### Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User can only read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }

    match /profiles/{userId} {
      allow read, write: if request.auth.uid == userId;
    }

    match /clubs/{userId} {
      allow read, write: if request.auth.uid == userId;
    }

    match /preferences/{userId} {
      allow read, write: if request.auth.uid == userId;
    }

    match /favoriteCourses/{docId} {
      allow read, write: if request.auth != null;
    }

    match /activeRounds/{userId} {
      allow read, write: if request.auth.uid == userId;
    }
  }
}
```

### Firebase Authentication

Enable these sign-in methods in Firebase Console > Authentication > Sign-in method:

- Email/Password
- Google

## 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## 5. Build for Production

```bash
npm run build
npm start
```

## Project Structure

```
caddyai-web/
├── app/                    # Next.js 15 App Router pages
│   ├── page.tsx           # Landing page
│   ├── login/             # Login page
│   ├── signup/            # Signup page
│   ├── dashboard/         # Dashboard page
│   ├── courses/           # Course search and details
│   └── layout.tsx         # Root layout with AuthProvider
├── components/            # Reusable React components
│   ├── ui/               # UI components (Button, Card, Input)
│   └── courses/          # Course-related components
├── hooks/                # Custom React hooks
│   └── useAuth.tsx       # Authentication hook
├── services/             # API services
│   ├── authService.ts    # Firebase Auth
│   ├── firebaseService.ts # Firestore operations
│   └── igolfService.ts   # iGolf API integration
├── src/
│   ├── lib/              # Libraries
│   │   └── firebase.ts   # Firebase initialization
│   └── types/            # TypeScript types
│       ├── user.ts       # User and profile types
│       ├── preferences.ts # Preferences types
│       └── course.ts     # Course and round types
└── .env.local            # Environment variables (not in git)
```

## Features

### Implemented ✅

- Landing page with features and CTAs
- User authentication (Email/Password, Google)
- Firebase integration
- Course search and 3D visualization
- Responsive design with Tailwind CSS
- TypeScript throughout
- ESLint and code quality checks

### Pending ⏳

- Profile management page
- Club management page
- Mobile app sync functionality
- Comprehensive testing (unit, integration, e2e)
- Settings page
- Profile completion flow

## Troubleshooting

### Build Errors

If you encounter build errors:

1. Delete `.next` folder: `rm -rf .next`
2. Clear node_modules: `rm -rf node_modules package-lock.json`
3. Reinstall: `npm install`
4. Rebuild: `npm run build`

### Firebase Connection Issues

- Verify all environment variables are set correctly
- Check Firebase project is active
- Ensure Firestore is in production mode (not test mode)
- Check browser console for specific error messages

### iGolf API Issues

- Verify API keys are correct
- Check API quota/limits
- The app will gracefully degrade if iGolf is unavailable

## Next Steps

1. **Complete Profile Management** - Build profile creation/editing
2. **Implement Club Management** - 26-club setup interface
3. **Add Mobile Sync** - Real-time sync with mobile app
4. **Testing** - Add Jest, React Testing Library, Playwright

## Support

For issues or questions, refer to:
- [Next.js Documentation](https://nextjs.org/docs)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
