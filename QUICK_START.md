# CaddyAI Web App - Quick Start

## 🚀 Get Started in 5 Minutes

### 1. Install Dependencies
```bash
cd /c/Users/scott/Claude_Code/caddyai-web
npm install
```

### 2. Configure Firebase
Edit `.env.local` and add your Firebase credentials:
```bash
NEXT_PUBLIC_FIREBASE_API_KEY=your-actual-key-here
# ... (see .env.local for all required variables)
```

### 3. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📂 Project Structure

```
caddyai-web/
├── src/
│   ├── lib/firebase.ts           # ✅ Firebase setup
│   ├── types/                    # ✅ TypeScript definitions
│   │   ├── user.ts
│   │   ├── preferences.ts
│   │   └── course.ts
│   ├── services/                 # 🔄 Next: Firebase services
│   ├── components/               # 🔄 Next: React components
│   └── hooks/                    # 🔄 Next: Custom hooks
├── app/                          # Next.js App Router
│   ├── layout.tsx
│   └── page.tsx
└── .env.local                    # ✅ Environment variables
```

---

## 🎯 What's Implemented

### ✅ Complete
- Next.js 15 + TypeScript + Tailwind
- Firebase SDK installed
- Type definitions for:
  - Users & Profiles
  - Clubs (26 clubs structure)
  - Preferences (4 categories)
  - Courses & Rounds

### 🔄 In Progress
- Authentication service
- Firebase CRUD operations
- Mobile-web sync system

### 📋 Planned
- Preferences UI with tabs
- Course search & 3D viewer
- iGolf API integration
- Vercel deployment

---

## 🗺️ Implementation Order

Following your recommendation:

1. **Phase 1**: Mobile-Web Sync (Prompt 8) ⚡
   - Critical for data integrity
   - Real-time Firestore listeners
   - Conflict resolution

2. **Phase 2**: Preferences UI (Prompt 6) ⚙️
   - 4-category settings
   - Theme switcher
   - Real-time save

3. **Phase 3**: iGolf Integration (Prompt 7) 🏌️
   - Needs API keys first
   - 3D course viewer
   - Course search

4. **Phase 4**: Deployment (Prompt 9) 🚀
   - Vercel + GitHub Actions
   - Production environment

---

## 📝 Next Steps

### Immediate (Needed Now):
1. Get Firebase API keys from Firebase Console
2. Update `.env.local` with real credentials
3. Decide: Build Sync first or Preferences first?

### Soon:
1. Set up authentication
2. Create base layout with navigation
3. Implement first feature (Sync or Preferences)

### Later:
1. Get iGolf API keys
2. Integrate course viewer
3. Deploy to production

---

## 🔧 Development Commands

```bash
# Development server
npm run dev

# Build for production
npm run build

# Run production build locally
npm run start

# Linting
npm run lint

# Type checking
npx tsc --noEmit
```

---

## 🐛 Troubleshooting

### "Firebase not initialized"
- Check that `.env.local` has all required variables
- Restart dev server after changing `.env.local`

### "Module not found"
- Run `npm install` to ensure all dependencies are installed

### "Port 3000 already in use"
- Kill the process: `npx kill-port 3000`
- Or use different port: `npm run dev -- -p 3001`

---

## 📚 Resources

- **Next.js Docs**: https://nextjs.org/docs
- **Firebase Docs**: https://firebase.google.com/docs/web
- **Tailwind CSS**: https://tailwindcss.com/docs
- **TypeScript**: https://www.typescriptlang.org/docs

---

## 🤝 Related Projects

- **Mobile App**: `C:\Users\scott\Claude_Code\CaddyAI_rn`
- **Firebase Project**: caddyai-aaabd (shared)
- **GitHub** (planned): github.com/colossusofNero/caddyai-web

---

**Status**: Foundation complete ✅
**Next**: Implement services & authentication
**Blockers**: Need Firebase API keys
