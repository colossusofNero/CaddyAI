# Authentication Debugging Guide

## Current Status: ENHANCED LOGGING IMPLEMENTED

This guide will help you diagnose and fix authentication issues with the CaddyAI login system.

---

## Phase 1: Check Browser Console for Errors

### Step 1: Open the Application
1. Navigate to: `http://localhost:3003/login`
2. Open browser DevTools (F12 or Right-click > Inspect)
3. Go to the **Console** tab

### Step 2: Look for Firebase Initialization Messages
You should see these messages on page load:

```
[Firebase Debug] Starting Firebase initialization...
[Firebase Debug] Config present: {...}
[Firebase Debug] Firebase app initialized: [DEFAULT]
[Firebase Debug] Firebase Auth initialized: true
[Firebase Debug] Firestore initialized: true
[Firebase Debug] Storage initialized: true
[Firebase] Successfully initialized all services
```

**If you see errors instead:**
- `CRITICAL: Firebase configuration is missing or invalid!` - Check `.env.local` file
- Initialization errors - Firebase credentials may be incorrect

---

## Phase 2: Test Email/Password Login

### Step 1: Create Test Account (if needed)
1. Go to: `http://localhost:3003/signup`
2. Create account with:
   - Name: Test User
   - Email: test@example.com
   - Password: Test123!

### Step 2: Attempt Login
1. Go to: `http://localhost:3003/login`
2. Enter credentials
3. Click "Sign In"
4. Watch the console for debug messages:

```
[Login Debug] Form submitted
[Login Debug] Email: test@example.com
[Login Debug] Calling signIn...
[Auth Debug] Starting signIn...
[Auth Debug] Email: test@example.com
[Auth Debug] Auth initialized: true
[Auth Debug] Calling signInWithEmailAndPassword...
```

### Expected Outcomes

**SUCCESS:**
```
[Auth Debug] Sign in successful, user: [USER_UID]
[Auth Debug] Updating last login...
[Auth Debug] Last login updated
[Login Debug] signIn successful, redirecting to dashboard...
[Login Debug] Login attempt complete
```
- Browser should redirect to `/dashboard`

**FAILURE - Firebase Not Initialized:**
```
[Auth Debug] CRITICAL: Firebase Auth is not initialized!
```
**Fix:** Check Firebase configuration in `.env.local`

**FAILURE - Invalid Credentials:**
```
[Auth Debug] Sign in error details: {
  message: "Firebase: Error (auth/invalid-credential)",
  code: "auth/invalid-credential"
}
```
**Fix:** Verify email/password are correct

**FAILURE - User Not Found:**
```
[Auth Debug] Sign in error details: {
  code: "auth/user-not-found"
}
```
**Fix:** Create account first via signup page

**FAILURE - Network Error:**
```
[Auth Debug] Sign in error details: {
  code: "auth/network-request-failed"
}
```
**Fix:** Check internet connection and Firebase Auth endpoint accessibility

---

## Phase 3: Test Google Sign-In

### Step 1: Verify Firebase Console Configuration

1. Go to: https://console.firebase.google.com/project/caddyai-aaabd/authentication/providers
2. Verify **Google** provider is ENABLED
3. Check **Authorized domains** includes:
   - `localhost`
   - `caddyai-aaabd.firebaseapp.com`
   - Your production domain

### Step 2: Test Google Login
1. Go to: `http://localhost:3003/login`
2. Click "Sign in with Google"
3. Watch console for debug messages:

```
[Login Debug] Google sign-in button clicked
[Login Debug] Calling signInWithGoogle...
[Auth Debug] Starting Google sign in...
[Auth Debug] Auth initialized: true
[Auth Debug] Creating Google provider...
[Auth Debug] Opening Google sign-in popup...
```

### Expected Outcomes

**SUCCESS:**
```
[Auth Debug] Google sign in successful, user: [USER_UID]
[Auth Debug] Checking user metadata...
[Auth Debug] Creating new user metadata... (or) Updating last login...
[Auth Debug] Google sign in complete
[Login Debug] Google sign-in successful, redirecting to dashboard...
```

**FAILURE - Popup Blocked:**
```
[Auth Debug] Google sign in error details: {
  code: "auth/popup-blocked"
}
```
**Fix:** Allow popups in browser settings

**FAILURE - Popup Closed:**
```
[Auth Debug] Google sign in error details: {
  code: "auth/popup-closed-by-user"
}
```
**Fix:** Complete the Google sign-in flow without closing the popup

**FAILURE - Unauthorized Domain:**
```
[Auth Debug] Google sign in error details: {
  code: "auth/unauthorized-domain"
}
```
**Fix:** Add domain to authorized domains in Firebase Console

---

## Phase 4: Test Apple Sign-In

### Step 1: Verify Firebase Console Configuration

1. Go to: https://console.firebase.google.com/project/caddyai-aaabd/authentication/providers
2. Verify **Apple** provider is ENABLED
3. Configure Apple Sign-In:
   - Service ID
   - Team ID
   - Key ID
   - Private Key

**NOTE:** Apple Sign-In requires additional configuration in Apple Developer Portal.

### Step 2: Test Apple Login
1. Go to: `http://localhost:3003/login`
2. Click "Sign in with Apple"
3. Watch console for similar debug messages as Google Sign-In

### Common Issues

**Apple Sign-In Not Configured:**
```
[Auth Debug] Apple sign in error details: {
  code: "auth/operation-not-allowed"
}
```
**Fix:** Enable and configure Apple Sign-In provider in Firebase Console

---

## Phase 5: Common Root Causes and Fixes

### Issue 1: Firebase Not Initialized
**Symptom:** `CRITICAL: Firebase Auth is not initialized!`

**Diagnosis:**
1. Check `.env.local` exists in project root
2. Verify all required environment variables are present:
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=...
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
   NEXT_PUBLIC_FIREBASE_APP_ID=...
   ```

**Fix:**
1. Copy Firebase config from Firebase Console
2. Restart dev server: `npm run dev`

---

### Issue 2: Firestore Not Enabled
**Symptom:** `CRITICAL: Firestore is not initialized!` or 400 errors

**Diagnosis:**
- Firestore database hasn't been created in Firebase Console

**Fix:**
1. Go to: https://console.firebase.google.com/project/caddyai-aaabd/firestore
2. Click "Create Database"
3. Choose "Start in production mode" (or test mode for development)
4. Select location: `us-central1` (or nearest)
5. Click "Enable"
6. Wait ~30 seconds for provisioning

---

### Issue 3: OAuth Providers Not Enabled
**Symptom:** `auth/operation-not-allowed` error

**Diagnosis:**
- Google or Apple sign-in provider is not enabled in Firebase Console

**Fix:**
1. Go to: https://console.firebase.google.com/project/caddyai-aaabd/authentication/providers
2. Click on Google provider
3. Click "Enable"
4. Save
5. Repeat for Apple if needed

---

### Issue 4: Unauthorized Domain
**Symptom:** `auth/unauthorized-domain` error

**Diagnosis:**
- The domain you're accessing the app from is not authorized in Firebase

**Fix:**
1. Go to: https://console.firebase.google.com/project/caddyai-aaabd/authentication/settings
2. Scroll to "Authorized domains"
3. Add your domain (e.g., `localhost`, production domain)
4. Save

---

### Issue 5: CORS or Network Errors
**Symptom:** `auth/network-request-failed` or CORS errors

**Diagnosis:**
- Network connectivity issues
- Firewall blocking Firebase
- CORS misconfiguration

**Fix:**
1. Check internet connection
2. Try different network
3. Disable VPN/proxy
4. Check browser console for CORS errors
5. Verify Firebase Auth endpoint is accessible: https://identitytoolkit.googleapis.com/

---

## Phase 6: Testing Checklist

Use this checklist to verify all authentication methods work:

### Email/Password Login
- [ ] User can sign up with email/password
- [ ] User can sign in with email/password
- [ ] Invalid credentials show error message
- [ ] Successful login redirects to dashboard
- [ ] User stays logged in after page refresh

### Google Sign-In
- [ ] Google button is visible
- [ ] Clicking button opens Google popup
- [ ] Can select Google account
- [ ] Successful login redirects to dashboard
- [ ] User profile data is saved to Firestore

### Apple Sign-In
- [ ] Apple button is visible
- [ ] Clicking button opens Apple popup
- [ ] Can authenticate with Apple ID
- [ ] Successful login redirects to dashboard
- [ ] User profile data is saved to Firestore

### Error Handling
- [ ] Clear error messages shown to user
- [ ] Detailed error logs in console
- [ ] Network errors handled gracefully
- [ ] Popup blocked errors handled
- [ ] User cancellation handled

---

## Phase 7: Firebase Console Verification

### Check Authentication Users
1. Go to: https://console.firebase.google.com/project/caddyai-aaabd/authentication/users
2. Verify test users appear in list
3. Check user properties:
   - UID
   - Email
   - Display Name
   - Sign-in Provider (password, google.com, apple.com)
   - Created date
   - Last sign-in date

### Check Firestore Data
1. Go to: https://console.firebase.google.com/project/caddyai-aaabd/firestore/databases/-default-/data
2. Navigate to `users` collection
3. Find document with user UID
4. Verify fields exist:
   - `email`
   - `displayName`
   - `photoURL`
   - `createdAt`
   - `lastLoginAt`
   - `onboardingComplete`
   - `profileComplete`
   - `clubsComplete`

---

## Quick Reference: Error Code Meanings

| Error Code | Meaning | Common Fix |
|------------|---------|------------|
| `auth/invalid-email` | Email format is invalid | Check email format |
| `auth/user-disabled` | Account has been disabled | Contact support |
| `auth/user-not-found` | No account with this email | Sign up first |
| `auth/wrong-password` | Incorrect password | Verify password |
| `auth/invalid-credential` | Invalid email or password | Check credentials |
| `auth/too-many-requests` | Too many failed attempts | Wait before trying again |
| `auth/network-request-failed` | Network connectivity issue | Check internet |
| `auth/popup-closed-by-user` | User closed OAuth popup | Complete sign-in flow |
| `auth/popup-blocked` | Browser blocked popup | Allow popups |
| `auth/unauthorized-domain` | Domain not authorized | Add to Firebase Console |
| `auth/operation-not-allowed` | Provider not enabled | Enable in Firebase Console |

---

## Support Resources

- **Firebase Console:** https://console.firebase.google.com/project/caddyai-aaabd
- **Firebase Auth Docs:** https://firebase.google.com/docs/auth/web/start
- **Error Code Reference:** https://firebase.google.com/docs/auth/admin/errors

---

## Contact for Issues

If authentication still fails after following this guide:

1. Copy all console debug messages
2. Take screenshot of error
3. Note which authentication method (email/Google/Apple)
4. Note what step it fails on
5. Provide to development team
