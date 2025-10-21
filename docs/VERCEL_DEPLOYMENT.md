# Vercel Deployment Guide

**Project**: CaddyAI Web Application
**Repository**: https://github.com/colossusofNero/CaddyAI.git
**Issue**: Vercel not auto-deploying when GitHub updates

---

## Problem

Your Vercel deployment is linked to GitHub but not automatically deploying when you push to GitHub. This is typically caused by:

1. Missing or incorrect Git integration settings in Vercel
2. Webhook not properly configured
3. Branch protection or deployment settings
4. Repository permissions

---

## Solution: Fix Vercel Auto-Deployment

### Step 1: Verify GitHub Integration

1. **Go to Vercel Dashboard**: https://vercel.com/dashboard
2. **Select your project**: CaddyAI Web
3. **Click Settings** → **Git**
4. **Verify the following**:
   - ✅ GitHub repository is connected: `colossusofNero/CaddyAI`
   - ✅ Production branch is set (usually `main` or `master`)
   - ✅ "Automatically deploy commits" is enabled

### Step 2: Check Repository Permissions

1. **Go to GitHub**: https://github.com/colossusofNero/CaddyAI
2. **Settings** → **Integrations** → **Applications**
3. **Find "Vercel"** in the list
4. **Click "Configure"**
5. **Verify permissions**:
   - ✅ Read access to code
   - ✅ Read and write access to webhooks
   - ✅ Read access to pull requests
   - ✅ Read and write access to commit statuses

### Step 3: Reconnect GitHub Integration (If Needed)

If webhooks are missing or broken:

1. **In Vercel Dashboard**:
   - Go to Project → **Settings** → **Git**
   - Click **"Disconnect"** (if connected)
   - Click **"Connect Git Repository"**
   - Select **GitHub**
   - Authorize Vercel
   - Select repository: `colossusofNero/CaddyAI`

2. **Set deployment settings**:
   - **Production Branch**: `main`
   - **Automatically deploy**: ✅ Enabled
   - **Deploy only on production branch**: Optional (uncheck to deploy all branches)

### Step 4: Verify Webhook Setup

1. **Go to GitHub Repository**: https://github.com/colossusofNero/CaddyAI
2. **Settings** → **Webhooks**
3. **You should see a webhook** for Vercel:
   - **Payload URL**: `https://api.vercel.com/v1/integrations/deploy/...`
   - **Content type**: `application/json`
   - **Events**: Push events, Pull request events
   - **Active**: ✅ Yes
   - **SSL verification**: ✅ Enable SSL verification

4. **If webhook is missing**:
   - Click **"Add webhook"**
   - Get webhook URL from Vercel:
     - Vercel Dashboard → Project → Settings → Git → Webhooks
   - Add the webhook URL from Vercel
   - Select trigger events: Push, Pull request
   - Click **"Add webhook"**

### Step 5: Configure Production Branch

Ensure your production branch is set correctly:

1. **Vercel Dashboard** → Project → **Settings** → **Git**
2. **Production Branch**: `main` (or whatever your main branch is)
3. **Branch Deploy Settings**:
   - ✅ **Automatically deploy commits** on production branch
   - ✅ **Deploy preview** for pull requests (optional)
   - ✅ **Deploy preview** for other branches (optional)

### Step 6: Test the Deployment

1. **Make a test commit**:
   ```bash
   # Make a small change
   echo "# Test Vercel Auto-Deploy" >> README.md

   # Commit and push
   git add README.md
   git commit -m "Test: Verify Vercel auto-deployment"
   git push origin main
   ```

2. **Check Vercel Dashboard**:
   - Go to Vercel Dashboard → Project
   - You should see a new deployment appear within seconds
   - Status should show: "Building..." → "Ready"

3. **Check GitHub**:
   - Go to your GitHub repository
   - Click on the commit
   - You should see Vercel deployment status checks

---

## Vercel Configuration Files

### vercel.json (Already Configured)

```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "outputDirectory": ".next"
}
```

This file is already properly configured in your project.

---

## Common Issues & Fixes

### Issue 1: "Deployment not triggering"

**Symptoms**: Push to GitHub, but no deployment appears in Vercel

**Fix**:
1. Check webhook in GitHub (Settings → Webhooks)
2. Click on the Vercel webhook
3. Check "Recent Deliveries" tab
4. If deliveries are failing, note the error
5. Common fixes:
   - Re-authorize Vercel in GitHub
   - Disconnect and reconnect Git integration in Vercel
   - Check repository permissions

### Issue 2: "Only seeing deployments from Vercel account"

**Symptoms**: Commits from other team members don't trigger deployments

**Fix**:
1. This is expected behavior - Vercel shows deployer as the Vercel account
2. The actual commit author is shown in deployment details:
   - Click on deployment
   - Look for "Git Commit" section
   - Shows actual commit author from GitHub

### Issue 3: "Build failing on Vercel but works locally"

**Symptoms**: Local builds succeed, Vercel builds fail

**Fix**:
1. Check environment variables in Vercel:
   - Settings → Environment Variables
   - Ensure all required variables are set
2. Check build logs in Vercel for specific errors
3. Common fixes:
   - Add missing environment variables
   - Fix TypeScript errors (strict checking on Vercel)
   - Update dependencies to match local versions

### Issue 4: "Deployments stuck in 'Queued' or 'Building'"

**Symptoms**: Deployments don't complete

**Fix**:
1. Check Vercel status: https://vercel-status.com
2. Check build logs for errors
3. Cancel stuck deployment and retry:
   - Click on deployment
   - Click "..." menu → "Cancel"
   - Push a new commit or trigger redeploy

---

## Environment Variables Setup

### Required Environment Variables

Make sure these are set in Vercel Dashboard → Settings → Environment Variables:

#### Firebase Configuration (Required)
```
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

#### Optional Environment Variables
```
NEXT_PUBLIC_GA_MEASUREMENT_ID=your_ga_id
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
```

**Important**: Environment variables must be set for all environments:
- ✅ Production
- ✅ Preview
- ✅ Development

---

## Deployment Workflow

### Automatic Deployments

Once properly configured, deployments happen automatically:

1. **Production Deployments** (main branch):
   ```bash
   git checkout main
   git pull origin main
   # Make changes
   git add .
   git commit -m "Your changes"
   git push origin main
   # → Triggers automatic production deployment
   ```

2. **Preview Deployments** (feature branches):
   ```bash
   git checkout -b feature/new-feature
   # Make changes
   git add .
   git commit -m "Add new feature"
   git push origin feature/new-feature
   # → Triggers automatic preview deployment
   ```

3. **Pull Request Deployments**:
   - Create PR on GitHub
   - Vercel automatically creates preview deployment
   - Comment on PR with deployment URL
   - Updates on every commit to PR branch

### Manual Deployments

If you need to manually trigger a deployment:

1. **Via Vercel Dashboard**:
   - Go to Project
   - Click "..." menu
   - Select "Redeploy"
   - Choose which deployment to redeploy

2. **Via Vercel CLI**:
   ```bash
   # Install Vercel CLI
   npm install -g vercel

   # Login
   vercel login

   # Deploy to production
   vercel --prod

   # Deploy preview
   vercel
   ```

---

## Vercel CLI Setup (Optional)

For easier deployments and debugging:

### Install Vercel CLI

```bash
npm install -g vercel
```

### Login to Vercel

```bash
vercel login
```

### Link Project

```bash
cd C:\Users\scott\Claude_Code\caddyai-web
vercel link
```

Follow prompts:
- Set up and deploy: `No` (already deployed)
- Link to existing project: `Yes`
- Select your project: `CaddyAI Web`

### Deploy Commands

```bash
# Deploy preview
vercel

# Deploy to production
vercel --prod

# Check deployment status
vercel ls

# View project info
vercel project info

# View environment variables
vercel env ls
```

---

## Git Workflow Best Practices

### 1. Always Pull Before Push

```bash
git pull origin main
# Make changes
git push origin main
```

### 2. Use Feature Branches

```bash
# Create feature branch
git checkout -b feature/user-authentication

# Make changes and commit
git add .
git commit -m "Add user authentication"

# Push to GitHub
git push origin feature/user-authentication

# Create PR on GitHub
# → Triggers preview deployment
```

### 3. Merge to Main

```bash
# After PR is approved
git checkout main
git pull origin main
git merge feature/user-authentication
git push origin main
# → Triggers production deployment
```

---

## Monitoring Deployments

### Vercel Dashboard

1. **View all deployments**: Dashboard → Project → Deployments
2. **Deployment details**: Click on any deployment to see:
   - Build logs
   - Runtime logs
   - Environment variables used
   - Git commit info
   - Performance metrics

### GitHub Checks

1. Go to GitHub repository
2. Click on any commit
3. See Vercel deployment status:
   - ✅ Green check: Deployment successful
   - ⏳ Yellow dot: Deployment in progress
   - ❌ Red X: Deployment failed

### Email Notifications

Enable email notifications in Vercel:
- Settings → Notifications
- ✅ Deployment succeeded
- ✅ Deployment failed
- ✅ Deployment ready

---

## Troubleshooting Checklist

Use this checklist if auto-deployment isn't working:

- [ ] GitHub repository is connected in Vercel
- [ ] Production branch is set correctly (main)
- [ ] "Automatically deploy commits" is enabled
- [ ] Vercel has proper GitHub permissions
- [ ] Webhook exists in GitHub repository settings
- [ ] Webhook is active and not failing
- [ ] Environment variables are set in Vercel
- [ ] No build errors in local environment
- [ ] Git remote is correctly set
- [ ] Pushing to correct branch

---

## Quick Fix Command

If webhook is working but you want to force a deployment:

```bash
# Make an empty commit and push
git commit --allow-empty -m "Trigger Vercel deployment"
git push origin main
```

This will trigger a new deployment without making any code changes.

---

## Support Resources

- **Vercel Documentation**: https://vercel.com/docs
- **Vercel Git Integration**: https://vercel.com/docs/concepts/git
- **Vercel Support**: https://vercel.com/support
- **GitHub Webhooks**: https://docs.github.com/en/webhooks

---

## Current Configuration

**Repository**: `colossusofNero/CaddyAI`
**Production Branch**: `main`
**Framework**: Next.js 15.5.6
**Build Command**: `npm run build`
**Output Directory**: `.next`

---

**Last Updated**: October 21, 2025
**Version**: 1.0.0
