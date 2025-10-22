# Fix Vercel Root Directory Error

**Error**: "The specified Root Directory does not exist"

## Problem

Vercel has the wrong Root Directory setting. It's currently set to the GitHub URL (`https://github.com/colossusofNero/CaddyAI.git`) instead of the actual project directory.

## Solution

### Step 1: Update Root Directory in Vercel

1. **Go to Vercel Dashboard**: https://vercel.com/dashboard
2. **Select your project**: CaddyAI Web
3. **Click "Settings"**
4. **Navigate to "General"** tab
5. **Find "Root Directory"** section
6. **Change the setting**:

   **Current (WRONG)**:
   ```
   https://github.com/colossusofNero/CaddyAI.git
   ```

   **Should be (CORRECT)**:
   ```
   ./
   ```

   OR leave it **blank/empty** (which defaults to root directory)

7. **Click "Save"**

### Step 2: Trigger New Deployment

After fixing the Root Directory:

**Option A: Redeploy from Vercel**
1. Go to **Deployments** tab
2. Click on the failed deployment
3. Click **"..."** menu → **"Redeploy"**

**Option B: Push new commit**
```bash
git commit --allow-empty -m "Trigger deployment after fixing root directory"
git push origin main
```

---

## Project Structure

Your project structure is correct - all files are at the repository root:

```
CaddyAI/                    ← Root of repository
├── app/                    ← Next.js app directory
├── components/             ← React components
├── lib/                    ← Utilities
├── public/                 ← Static files
├── package.json           ← Dependencies
├── next.config.ts         ← Next.js config
├── tsconfig.json          ← TypeScript config
└── vercel.json            ← Vercel config
```

The Root Directory should point to `./` (current directory) or be left blank.

---

## Vercel Configuration Settings

### Correct Settings for Your Project

| Setting | Value |
|---------|-------|
| **Framework Preset** | Next.js |
| **Root Directory** | `./` or blank |
| **Build Command** | `npm run build` (auto-detected) |
| **Output Directory** | `.next` (auto-detected) |
| **Install Command** | `npm install` (auto-detected) |
| **Development Command** | `npm run dev` (auto-detected) |

### Environment Variables

Make sure these are set in Vercel:

```
NEXT_PUBLIC_FIREBASE_API_KEY=your_value
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_value
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_value
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_value
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_value
NEXT_PUBLIC_FIREBASE_APP_ID=your_value
```

---

## Common Root Directory Values

| Project Type | Root Directory |
|--------------|----------------|
| Monorepo with web in `/web` folder | `web` |
| Monorepo with app in `/frontend` | `frontend` |
| Single repo (like yours) | `./` or blank |
| Subdirectory `/packages/web` | `packages/web` |

**Your case**: Single repository → Use `./` or leave blank

---

## Troubleshooting

### Error Still Occurs After Fix?

1. **Clear Vercel cache**:
   - Settings → General → Scroll down
   - Click "Clear Cache"
   - Redeploy

2. **Check Git integration**:
   - Settings → Git
   - Verify correct repository is connected
   - Repository: `colossusofNero/CaddyAI`
   - Branch: `main`

3. **Verify package.json exists at root**:
   ```bash
   # Should show package.json at root
   ls -la package.json
   ```

### Other Common Issues

**Issue**: Build command not found
- **Fix**: Make sure `package.json` has `"build": "next build"` script

**Issue**: Module not found errors
- **Fix**: Delete `node_modules` and `.next` in Vercel:
  - Redeploy after clearing cache

**Issue**: Environment variables not working
- **Fix**: Check they're set for all environments (Production, Preview, Development)

---

## Step-by-Step Fix (Screenshots Guide)

### 1. Access Project Settings
- Go to: https://vercel.com/dashboard
- Click on your project: **CaddyAI Web**
- Click **Settings** button (top right)

### 2. Find Root Directory Setting
- In Settings, click **General** tab (left sidebar)
- Scroll to find **"Root Directory"** section
- You'll see a text input with the current value

### 3. Update Root Directory
- **Delete** the current incorrect value
- **Type**: `./` (dot slash)
- **OR** leave completely blank
- Click **Save** button

### 4. Trigger Deployment
- Click **Deployments** tab
- Click **Redeploy** on the latest deployment
- **OR** push a new commit to GitHub

### 5. Verify Success
- Watch the deployment logs
- Should see: "Building..."
- Should complete with "Ready"
- Check your live URL works

---

## Alternative: Recreate Vercel Project

If the above doesn't work, you can recreate the project:

### 1. Delete Current Project (Optional)
- Vercel Dashboard → Project → Settings
- Scroll to bottom → "Delete Project"
- Type project name to confirm

### 2. Create New Project
1. Click **"Add New..."** → **"Project"**
2. **Import Git Repository**
3. Select: `colossusofNero/CaddyAI`
4. **Configure Project**:
   - Framework Preset: **Next.js**
   - Root Directory: **Leave blank** or `./`
   - Build Command: (auto-detected)
   - Output Directory: (auto-detected)
5. Add environment variables
6. Click **Deploy**

---

## Verification Checklist

After fixing, verify these are correct:

- [ ] Root Directory is `./` or blank
- [ ] GitHub repository is `colossusofNero/CaddyAI`
- [ ] Production branch is `main`
- [ ] Framework is set to Next.js
- [ ] Environment variables are set
- [ ] Deployment succeeds
- [ ] Live site is accessible

---

## Quick Commands

```bash
# Check if package.json exists at root
ls package.json

# Verify you're in the right directory
pwd

# Check git repository
git remote -v

# Trigger new deployment
git commit --allow-empty -m "Fix: Trigger deployment after root directory fix"
git push origin main
```

---

## Need More Help?

If you're still having issues:

1. **Check Vercel Status**: https://vercel-status.com
2. **View Build Logs**: Deployments → Failed deployment → View logs
3. **Vercel Support**: https://vercel.com/support
4. **Community**: https://github.com/vercel/vercel/discussions

---

**Last Updated**: October 21, 2025
**Issue**: Root Directory misconfiguration
**Fix**: Set to `./` or leave blank
