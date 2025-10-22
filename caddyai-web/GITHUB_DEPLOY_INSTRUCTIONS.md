# GitHub and Vercel Deployment Instructions

## Step 1: Create GitHub Repository

### Option A: Using GitHub Web Interface

1. Go to [github.com/new](https://github.com/new)
2. Repository name: `caddyai-web`
3. Description: `CaddyAI Web - Golf course management with 3D visualization and real-time mobile sync`
4. Choose **Public** or **Private**
5. **Do NOT** initialize with README, .gitignore, or license (we already have these)
6. Click **Create repository**

### Option B: Using GitHub CLI (gh)

```bash
gh repo create caddyai-web --public --description "CaddyAI Web - Golf course management with 3D visualization"
```

## Step 2: Push to GitHub

Once you have the repository URL, run these commands:

```bash
# Add remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/caddyai-web.git

# Push to GitHub
git push -u origin master
```

**Example:**
```bash
git remote add origin https://github.com/colossusofNero/caddyai-web.git
git push -u origin master
```

## Step 3: Deploy to Vercel

### Option A: Using Vercel Web Interface (Recommended)

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **Import Git Repository**
3. Select your GitHub account
4. Find and import `caddyai-web`
5. Vercel will auto-detect Next.js settings
6. Click **Environment Variables** and add:

```
NEXT_PUBLIC_FIREBASE_API_KEY=<your_firebase_api_key>
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=caddyai-aaabd.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=caddyai-aaabd
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=caddyai-aaabd.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=<your_sender_id>
NEXT_PUBLIC_FIREBASE_APP_ID=<your_app_id>
NEXT_PUBLIC_APP_NAME=CaddyAI
```

Optional (for 3D visualization):
```
NEXT_PUBLIC_IGOLF_API_KEY=<your_igolf_key>
NEXT_PUBLIC_IGOLF_WEB_KEY=<your_igolf_web_key>
```

7. Click **Deploy**

### Option B: Using Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

Follow the prompts to:
- Link to existing project or create new
- Set environment variables (it will prompt you)

## Step 4: Verify Deployment

After deployment completes:

1. Visit your deployment URL (e.g., `https://caddyai-web.vercel.app`)
2. Test the following:
   - ✅ Landing page loads
   - ✅ Login/Signup pages work
   - ✅ Firebase authentication works
   - ✅ Can create profile
   - ✅ Can add clubs
   - ✅ Dashboard displays

## Post-Deployment Checklist

- [ ] GitHub repository created and pushed
- [ ] Vercel deployment successful
- [ ] Environment variables configured
- [ ] Firebase Auth domain added to Firebase Console:
  - Go to Firebase Console > Authentication > Settings
  - Add your Vercel domain to **Authorized domains**
- [ ] Test authentication flow
- [ ] Test profile creation
- [ ] Test club management
- [ ] Verify mobile sync (if mobile app is deployed)

## Troubleshooting

### Build Fails on Vercel

If build fails, check:
1. Environment variables are set correctly
2. All dependencies are in package.json
3. Check Vercel build logs for specific errors

### Authentication Not Working

1. Ensure Firebase Auth domain includes your Vercel domain
2. Verify environment variables in Vercel dashboard
3. Check Firebase Console for errors

### 3D Viewer Not Working

- iGolf API keys are optional
- If not configured, 3D viewer will gracefully degrade
- Check iGolf API quota if configured

## Useful Commands

```bash
# View deployment status
vercel ls

# View deployment logs
vercel logs <deployment-url>

# Set environment variable
vercel env add NEXT_PUBLIC_FIREBASE_API_KEY

# Redeploy
git push origin master  # Auto-deploys if connected to Vercel
```

## Next Steps After Deployment

1. **Test thoroughly** - Create test accounts, profiles, clubs
2. **Monitor performance** - Check Vercel analytics
3. **Update Firebase security rules** - See firestore.rules
4. **Enable Firebase indexes** - See firestore.indexes.json
5. **Set up custom domain** (optional) - Configure in Vercel settings

---

## Quick Reference

**Local Development:**
```bash
npm run dev          # Start dev server (http://localhost:3000)
npm run build        # Build for production
npm start            # Start production server
```

**Git Commands:**
```bash
git status           # Check status
git add .            # Stage changes
git commit -m "msg"  # Commit changes
git push             # Push to GitHub
```

**Vercel Commands:**
```bash
vercel               # Deploy to preview
vercel --prod        # Deploy to production
vercel logs          # View logs
```

---

**Repository Status:** ✅ Ready to push
**Build Status:** ✅ Verified and passing
**Deployment Ready:** ✅ Yes

Push to GitHub and deploy to Vercel to go live! 🚀
