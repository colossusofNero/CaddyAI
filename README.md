# CaddyAI Web

> Your Intelligent Golf Companion - Web Edition

CaddyAI Web is the web-based interface for CaddyAI, featuring iGolf 3D course visualization, course search, profile management, and real-time mobile app sync. Built with Next.js 15, React 19, TypeScript, and Tailwind CSS v4.

**Build Status:** ✅ Passing | **Version:** 0.1.0 | **Completion:** ~85%

## ✨ Features

### 🔐 Authentication
- Email/password and Google sign-in
- Password reset functionality
- Protected routes with auth hooks
- Session management

### 👤 Profile Management (NEW)
- 5 core golf questions (hand, handicap, shot shape, height, curve)
- Experience tracking (years playing, frequency)
- Skills tracking (drive distance, strength, goals)
- Real-time sync with mobile app

### ⛳ Club Management (NEW)
- Manage up to 26 club configurations
- Customizable takeback and face settings
- Distance tracking per club
- Syncs automatically with mobile app

### 🏌️ Course Discovery
- Search courses by name or location
- 3D Course Visualization with iGolf API
- Detailed scorecards with hole-by-hole data
- Save favorite courses

### 📍 iGolf 3D Viewer Integration
- Real-time 3D course flyovers
- Hole-by-hole navigation (1-18)
- Fullscreen viewing mode
- Quick hole selector

### 🔄 Real-Time Mobile App Sync (NEW)
- Automatic synchronization via Firestore listeners
- Profile and club changes sync instantly
- Active round tracking
- Preferences sync
- `useSync` React hook for easy integration

## 🛠️ Tech Stack

- **Framework**: Next.js 15.5.6 (App Router)
- **Runtime**: React 19.1.0
- **Language**: TypeScript 5.9.3
- **Styling**: Tailwind CSS v4
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **Forms**: React Hook Form + Zod
- **Icons**: Lucide React
- **3D Viewer**: iGolf API

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env.local
```

Edit `.env.local` with your Firebase credentials:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=caddyai-aaabd.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=caddyai-aaabd
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=caddyai-aaabd.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Optional - for 3D course visualization
NEXT_PUBLIC_IGOLF_API_KEY=your_igolf_key
NEXT_PUBLIC_IGOLF_WEB_KEY=your_igolf_web_key
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 4. Build for Production

```bash
npm run build
npm start
```

## 📚 Documentation

- **Setup Guide**: [SETUP.md](./SETUP.md) - Detailed setup instructions
- **Project Status**: [PROJECT_STATUS.md](./PROJECT_STATUS.md) - Current status and roadmap
- **Type Definitions**: See `src/types/` for TypeScript interfaces

## 🏗️ Project Structure

```
caddyai-web/
├── app/                    # Next.js 15 App Router pages
│   ├── page.tsx           # Landing page
│   ├── login/             # Authentication
│   ├── signup/
│   ├── dashboard/         # Main dashboard
│   ├── profile/           # Profile management
│   ├── clubs/             # Club management
│   └── courses/           # Course search & 3D viewer
├── components/            # Reusable React components
│   ├── ui/               # UI primitives (Button, Card, Input)
│   └── courses/          # Course-specific components
├── hooks/                # Custom React hooks
│   ├── useAuth.tsx       # Authentication
│   └── useSync.tsx       # Real-time sync
├── services/             # Business logic & API calls
│   ├── authService.ts    # Firebase Auth
│   ├── firebaseService.ts # Firestore operations
│   ├── syncService.ts    # Real-time sync
│   └── igolfService.ts   # iGolf API
└── src/
    ├── lib/firebase.ts   # Firebase initialization
    └── types/            # TypeScript type definitions
```

## 🔄 Mobile App Synchronization

CaddyAI Web features real-time synchronization with the mobile app:

```typescript
import { useSync } from '@/hooks/useSync';

function Dashboard() {
  const { profile, clubs, syncStatus, forceSync } = useSync();

  // profile and clubs automatically update when changed on mobile
  // syncStatus.lastSync shows last sync timestamp
  // Call forceSync() for manual refresh
}
```

**Synced Data:**
- User profile (handicap, shot preferences, etc.)
- Club configurations (26 clubs with distances)
- Favorites and saved courses
- Active rounds and scores
- App preferences

## 🧪 Testing

Comprehensive testing suite with unit, integration, and E2E tests:

### Unit Tests
- Jest + React Testing Library
- 80%+ code coverage target
- Component tests for all UI elements
- Utility function tests

### End-to-End Tests
- Playwright for cross-browser testing
- Mobile and desktop viewports
- Critical user flows

```bash
# Run all unit tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Debug E2E tests
npm run test:e2e:debug
```

### Test Coverage
- UI Components: Button, Card, Input
- Authentication flows
- Course search and navigation
- Responsive design across devices
- Accessibility compliance (WCAG 2.1 AA)

## 📦 Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Manual Deployment

```bash
npm run build
npm start
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

MIT License - see LICENSE file for details

---

**Built with ❤️ for golfers everywhere**
