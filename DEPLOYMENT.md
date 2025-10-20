# CaddyAI Web - Deployment Guide

## Prerequisites

- Node.js 20+ installed
- Firebase CLI installed: `npm install -g firebase-tools`
- iGolf API credentials
- Firebase project: `caddyai-aaabd`

## Quick Start

### 1. Install Dependencies

```bash
cd caddyai-web
npm install
```

### 2. Configure Environment Variables

Copy `.env.local.example` to `.env.local`:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and add your credentials:

```env
# iGolf API
NEXT_PUBLIC_IGOLF_API_KEY=your_igolf_api_key_here
IGOLF_SECRET_KEY=your_igolf_secret_key_here

# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=caddyai-aaabd.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=caddyai-aaabd
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=caddyai-aaabd.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id_here
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id_here
```

### 3. Deploy Firebase Configuration

```bash
# Login to Firebase
firebase login

# Select project
firebase use caddyai-aaabd

# Deploy Firestore rules and indexes
firebase deploy --only firestore
```

### 4. Run Development Server

```bash
npm run dev
```

Navigate to http://localhost:3000

## Testing

### Test Course Search

1. Go to http://localhost:3000/courses
2. Search for "Pebble Beach"
3. Verify results display
4. Click on a course
5. Verify 3D viewer loads
6. Check scorecard displays

### Test Features

- ✅ Course search by name
- ✅ Course search by location ("Near Me")
- ✅ Add/remove favorites
- ✅ 3D viewer navigation
- ✅ Scorecard tee box selection
- ✅ Hole selection
- ✅ Start round
- ✅ Firebase data persistence

## Production Deployment

### Option 1: Vercel (Recommended)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Add environment variables in Vercel dashboard
# Settings → Environment Variables
```

### Option 2: Firebase Hosting

```bash
# Build the app
npm run build

# Initialize Firebase Hosting
firebase init hosting

# Deploy
firebase deploy --only hosting
```

### Option 3: Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Build and deploy
netlify deploy --prod
```

## Environment Variables for Production

Add these to your hosting platform:

### Required

- `NEXT_PUBLIC_IGOLF_API_KEY`
- `IGOLF_SECRET_KEY`
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

## Post-Deployment Checklist

- [ ] Environment variables configured
- [ ] Firebase rules deployed
- [ ] Firebase indexes created
- [ ] Course search works
- [ ] 3D viewer loads
- [ ] Scorecard displays correctly
- [ ] Favorites save to Firebase
- [ ] Round creation works
- [ ] Mobile app can access same data
- [ ] DNS configured (if custom domain)
- [ ] SSL certificate active

## Monitoring

### Check Firebase Usage

```bash
firebase projects:list
firebase projects:describe caddyai-aaabd
```

### Check Logs

**Vercel:**
- Dashboard → Deployments → Function Logs

**Firebase:**
```bash
firebase functions:log
```

### Check Firestore Data

1. Go to Firebase Console
2. Navigate to Firestore Database
3. Check collections:
   - `favoriteCourses`
   - `activeRounds`
   - `shots`
   - `rounds`

## Troubleshooting

### 3D Viewer Not Loading

**Issue:** Viewer shows error or blank screen

**Solutions:**
1. Check API key is correct
2. Verify iGolf script loads (Network tab)
3. Check browser console for errors
4. Ensure CORS is configured

### Firebase Permission Errors

**Issue:** "Permission denied" errors

**Solutions:**
1. Verify Firestore rules are deployed
2. Check user is authenticated
3. Verify document IDs match expected format
4. Check Firebase Console for security rule violations

### Course Search Not Working

**Issue:** No results or errors

**Solutions:**
1. Check iGolf API key
2. Verify internet connection
3. Check iGolf API status
4. Try different search terms
5. Check browser console for errors

### Build Errors

**Issue:** Build fails with TypeScript errors

**Solutions:**
1. Run `npm install` to ensure dependencies are installed
2. Check TypeScript version: `npx tsc --version`
3. Run type check: `npm run build`
4. Check for missing dependencies

## Security

### API Keys

- ✅ iGolf Secret Key: Server-side only (not exposed to client)
- ✅ iGolf API Key: Client-side (safe to expose with domain restrictions)
- ✅ Firebase credentials: Client-side (protected by Firestore rules)

### Firestore Rules

All data is protected by user authentication:
- Users can only read/write their own data
- Document ownership verified on all operations
- Required fields validated on creation

### Best Practices

1. Never commit `.env.local` to git
2. Use environment variables for all secrets
3. Enable Firebase App Check
4. Monitor Firebase usage for unusual activity
5. Keep dependencies updated

## Support

For deployment issues:

1. Check this guide
2. Review error logs
3. Check Firebase Console
4. Verify environment variables
5. Test locally first
6. Create issue in GitHub repo

## Resources

- **Next.js Deployment:** https://nextjs.org/docs/deployment
- **Vercel:** https://vercel.com/docs
- **Firebase Hosting:** https://firebase.google.com/docs/hosting
- **Netlify:** https://docs.netlify.com
