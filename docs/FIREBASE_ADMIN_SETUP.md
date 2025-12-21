# Firebase Admin SDK Setup

## Overview
Firebase Admin SDK is required for server-side operations that bypass Firestore security rules. This is used in API routes for subscription management and other admin operations.

---

## Quick Fix (You Need This Now!)

### Issue
You're seeing this error:
```
Error fetching subscription status: Failed to fetch subscription status
api/stripe/subscription?userId=xxx: 500
```

This means Firebase Admin SDK credentials are missing.

---

## Setup Instructions

### Method 1: Service Account JSON (Recommended)

#### Step 1: Generate Service Account Key
1. Go to [Firebase Console → Project Settings → Service Accounts](https://console.firebase.google.com/project/caddyai-aaabd/settings/serviceaccounts/adminsdk)
2. Click **Generate new private key**
3. Click **Generate key** in the confirmation dialog
4. A JSON file will download (e.g., `caddyai-aaabd-firebase-adminsdk-xxxxx.json`)

#### Step 2: Add to Local Environment
Open `.env.local` and add:

```bash
# Firebase Admin SDK - Service Account (for API routes)
FIREBASE_SERVICE_ACCOUNT='{"type":"service_account","project_id":"caddyai-aaabd","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"firebase-adminsdk-xxxxx@caddyai-aaabd.iam.gserviceaccount.com","client_id":"...","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"..."}'
```

**Important**:
- This must be a single-line JSON string wrapped in single quotes
- Keep the `\n` in the private key - they're required
- Never commit this to git!

#### Step 3: Restart Dev Server
```bash
# Stop the current dev server (Ctrl+C)
npm run dev
```

---

### Method 2: Individual Environment Variables

If you prefer not to use JSON:

#### Step 1: Get Service Account Details
1. Go to [Firebase Console → Service Accounts](https://console.firebase.google.com/project/caddyai-aaabd/settings/serviceaccounts/adminsdk)
2. Note down:
   - **Project ID**: `caddyai-aaabd`
   - **Client Email**: `firebase-adminsdk-xxxxx@caddyai-aaabd.iam.gserviceaccount.com`
3. Click **Generate new private key** and open the downloaded JSON file
4. Copy the `private_key` field

#### Step 2: Add to .env.local
```bash
# Firebase Admin SDK - Individual Variables
FIREBASE_ADMIN_PROJECT_ID=caddyai-aaabd
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxxxx@caddyai-aaabd.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQ...rest-of-key...\n-----END PRIVATE KEY-----\n"
```

**Important**:
- The private key MUST be wrapped in double quotes
- Keep all the `\n` characters - they're part of the key format
- Never commit this to git!

---

## Deployment (Vercel)

### Step 1: Add Environment Variables
```bash
# Add to Vercel project
vercel env add FIREBASE_SERVICE_ACCOUNT
# Paste the entire JSON as a single line when prompted
```

Or via Vercel Dashboard:
1. Go to your project → Settings → Environment Variables
2. Add `FIREBASE_SERVICE_ACCOUNT`
3. Paste the service account JSON
4. Select all environments (Production, Preview, Development)
5. Click **Save**

### Step 2: Redeploy
```bash
vercel --prod
```

---

## Security Best Practices

### ✅ DO:
- Store credentials in environment variables
- Use different service accounts for dev/prod
- Restrict service account permissions in Firebase Console
- Add `.env.local` to `.gitignore` (already done)
- Rotate keys periodically (every 90 days)

### ❌ DON'T:
- Commit service account JSON to git
- Share credentials via email/Slack
- Use production credentials in development
- Expose credentials in client-side code
- Store in plaintext files

---

## Troubleshooting

### Error: "Firebase Admin not configured"
**Solution**: Add service account credentials to `.env.local` and restart dev server

### Error: "Failed to initialize Firebase Admin SDK"
**Solution**: Check that:
1. JSON is valid (test with `JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)`)
2. Private key includes `\n` characters
3. Quotes are correct (single quotes around JSON, double quotes inside)

### Error: "Permission denied"
**Solution**:
1. Verify service account has proper roles in [IAM Console](https://console.cloud.google.com/iam-admin/iam?project=caddyai-aaabd)
2. Ensure service account has "Firebase Admin SDK Administrator Service Agent" role

### Error: "Private key is invalid"
**Solution**:
1. Re-download service account JSON from Firebase Console
2. Copy the `private_key` field exactly as-is
3. Ensure all `\n` characters are preserved

---

## Verification

### Test Locally
1. Start dev server: `npm run dev`
2. Check console for: `[Firebase Admin] Successfully initialized`
3. Visit `/api/stripe/subscription?userId=YOUR_USER_ID`
4. Should return subscription data or default free plan (not 500 error)

### Test API Route
Create `scripts/test-admin.js`:
```javascript
// Quick test script
import { getAdminDb } from '../services/firebaseAdmin.js';

async function test() {
  try {
    const db = getAdminDb();
    console.log('✅ Firebase Admin initialized successfully');

    // Test query
    const users = await db.collection('users').limit(1).get();
    console.log('✅ Database query successful');
    console.log(`Found ${users.size} user(s)`);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

test();
```

Run:
```bash
node scripts/test-admin.js
```

---

## What Firebase Admin SDK Does

Firebase Admin SDK is used in these API routes:
- `/api/stripe/webhook` - Validates Stripe webhooks and updates subscriptions
- `/api/stripe/subscription` - Fetches subscription status server-side
- `/api/apple/validate-receipt` - Validates Apple IAP receipts
- `/api/google/validate-purchase` - Validates Google Play purchases

**Why it's needed**: These operations must bypass Firestore security rules because:
- Webhooks have no user context (called by Stripe/Apple/Google servers)
- Server-side validation requires admin access
- Prevents client-side tampering with subscription data

---

## Next Steps After Setup

1. ✅ Create Firebase composite index for `rounds` collection
2. ✅ Configure Firebase Admin credentials
3. ✅ Test Excel upload
4. ✅ Verify subscription API works
5. ✅ Deploy to Vercel with environment variables

---

## Support

If you continue to have issues:
1. Check console for detailed error messages
2. Verify service account JSON is valid
3. Ensure environment variables are loaded (restart dev server)
4. Check Firebase Console for service account status
