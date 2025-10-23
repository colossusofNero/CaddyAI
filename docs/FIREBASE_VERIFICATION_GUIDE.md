# Firebase Console Verification Guide

## How to Verify All Authentication Methods Are Working

### Step 1: Access Firebase Console

1. **Go to Firebase Console:**
   - URL: https://console.firebase.google.com/project/caddyai-aaabd
   - Sign in with your Google account that has access to this project

---

### Step 2: Check Authentication (Email/Password, Google, Apple)

1. **Navigate to Authentication:**
   - In left sidebar, click **"Authentication"**
   - Click **"Users"** tab

2. **What You Should See:**
   - List of all registered users
   - For each user:
     - ✅ **User UID** (unique identifier like `AbC123XyZ...`)
     - ✅ **Sign-in provider** (Email, Google.com, or Apple.com)
     - ✅ **Identifier** (email address or provider ID)
     - ✅ **Created date**
     - ✅ **Last sign-in date**
     - ✅ **User UID** column showing the unique ID

3. **Authentication Methods to Check:**

   **Email/Password Users:**
   - Provider: `Password (Default)`
   - Identifier: Shows email address
   - Example: `user@example.com`

   **Google Sign-In Users:**
   - Provider: `google.com`
   - Identifier: Shows Google email
   - Example: `yourname@gmail.com`

   **Apple Sign-In Users:**
   - Provider: `apple.com`
   - Identifier: Shows Apple ID or private relay email
   - Example: `user@icloud.com` or `privaterelay@appleid.com`

4. **Click on Any User to See Details:**
   - User UID
   - Email address
   - Email verified status
   - Display name (if provided)
   - Photo URL (if from Google)
   - Creation timestamp
   - Last sign-in timestamp
   - Linked providers

---

### Step 3: Check Firestore Database (User Data)

1. **Navigate to Firestore:**
   - In left sidebar, click **"Firestore Database"**
   - Make sure you're on the **(default)** database

2. **Check `users` Collection:**
   - Click on **`users`** collection
   - You should see documents with **User UIDs as document IDs**
   - Each document represents one user

3. **What Each User Document Should Contain:**

   **Required Fields:**
   ```
   ├── userId: "AbC123XyZ..." (string)
   ├── email: "user@example.com" (string)
   ├── displayName: "John Doe" (string or null)
   ├── photoURL: "https://..." (string or null)
   ├── createdAt: Timestamp (October 22, 2025 at ...)
   ├── lastLoginAt: Timestamp (October 22, 2025 at ...)
   ├── onboardingComplete: false (boolean)
   ├── profileComplete: false (boolean)
   └── clubsComplete: false (boolean)
   ```

4. **Click on Any User Document:**
   - Review all fields
   - Verify timestamps are correct
   - Check boolean flags (should be `false` for new users)

---

### Step 4: Check for Profile Data (If User Completed Profile)

1. **Still in Firestore, navigate to subcollections:**
   - Click on a user document
   - Look for subcollection **`profile`**

2. **If Profile Exists, You'll See:**
   ```
   ├── userId: "AbC123XyZ..."
   ├── dominantHand: "right" or "left"
   ├── handicap: 18 (number 0-54)
   ├── typicalShotShape: "straight", "draw", or "fade"
   ├── height: 70 (number, inches)
   ├── curveTendency: 0 (number -10 to +10)
   ├── yearsPlaying: 5 (optional number)
   ├── playFrequency: "monthly" (optional)
   ├── driveDistance: 250 (optional number)
   ├── strengthLevel: "medium" (optional)
   ├── improvementGoal: "Lower my score" (optional string)
   ├── createdAt: Timestamp
   └── updatedAt: Timestamp
   ```

---

### Step 5: Check for Club Data (If User Added Clubs)

1. **In Firestore, check for `clubs` subcollection:**
   - Click on a user document
   - Look for subcollection **`clubs`**

2. **The `clubs` subcollection contains one document:**
   - Document ID: Same as user UID
   - Contains array of club objects

3. **Club Data Structure:**
   ```
   ├── userId: "AbC123XyZ..."
   ├── clubs: [
   │   {
   │     name: "Driver",
   │     takeback: "Full",
   │     face: "Square",
   │     carryYards: 250,
   │     updatedAt: 1729648123456
   │   },
   │   {
   │     name: "7 Iron",
   │     takeback: "Full",
   │     face: "Square",
   │     carryYards: 150,
   │     updatedAt: 1729648123456
   │   },
   │   ... (up to 26 clubs)
   │ ]
   ├── createdAt: Timestamp
   └── updatedAt: Timestamp
   ```

---

## Quick Verification Checklist

### ✅ Email/Password Authentication Working:
- [ ] User appears in Authentication > Users with "Password" provider
- [ ] User document exists in Firestore `users` collection
- [ ] User document has correct email and displayName
- [ ] createdAt and lastLoginAt timestamps are present

### ✅ Google Sign-In Working:
- [ ] User appears in Authentication > Users with "google.com" provider
- [ ] User document exists in Firestore `users` collection
- [ ] displayName matches Google account name
- [ ] photoURL contains Google profile picture URL

### ✅ Apple Sign-In Working:
- [ ] User appears in Authentication > Users with "apple.com" provider
- [ ] User document exists in Firestore `users` collection
- [ ] Email shows Apple ID or private relay address
- [ ] displayName present (if user shared name)

### ✅ Data Persistence Working:
- [ ] User can log out and log back in
- [ ] User data persists after logout/login
- [ ] Profile data saved when user completes profile
- [ ] Club data saved when user adds clubs
- [ ] Dashboard shows correct completion status

---

## Common Issues & Solutions

### Issue 1: No Users Showing Up
**Problem:** Authentication tab is empty
**Solution:**
- Make sure you're looking at the correct Firebase project
- Try creating a test account at the live site
- Check if Email/Password provider is enabled

### Issue 2: User in Auth but Not in Firestore
**Problem:** User exists in Authentication but no Firestore document
**Solution:**
- This shouldn't happen with current code
- Check browser console for errors during signup
- The `createUserMetadata()` function should run automatically

### Issue 3: Profile/Clubs Data Not Saving
**Problem:** User can fill forms but data doesn't persist
**Solution:**
- Check Firestore rules allow writing
- Check browser console for permission errors
- Verify user is authenticated before saving

---

## Testing Each Authentication Method

### Test Email/Password:
1. Go to: https://caddyai-2dc3o72xb-rcg-valuation.vercel.app/signup
2. Enter test credentials:
   - Name: Test User
   - Email: test@example.com
   - Password: TestPass123!
   - Confirm: TestPass123!
3. Click "Create Account"
4. Check Firebase Console → Authentication → Users
5. Should see new user with email provider

### Test Google Sign-In:
1. Go to: https://caddyai-2dc3o72xb-rcg-valuation.vercel.app/login
2. Click "Sign in with Google"
3. Select your Google account in popup
4. Should redirect to dashboard
5. Check Firebase Console → Authentication → Users
6. Should see user with google.com provider

### Test Apple Sign-In:
1. Go to: https://caddyai-2dc3o72xb-rcg-valuation.vercel.app/login
2. Click "Sign in with Apple"
3. Authenticate with Face ID/Touch ID/Password
4. Choose to share or hide email
5. Should redirect to dashboard
6. Check Firebase Console → Authentication → Users
7. Should see user with apple.com provider

---

## Direct Firebase Console Links

**Authentication Users:**
https://console.firebase.google.com/project/caddyai-aaabd/authentication/users

**Firestore Database:**
https://console.firebase.google.com/project/caddyai-aaabd/firestore/databases/-default-/data

**Firestore Rules:**
https://console.firebase.google.com/project/caddyai-aaabd/firestore/rules

**Project Settings:**
https://console.firebase.google.com/project/caddyai-aaabd/settings/general

---

## What Success Looks Like

### After Creating an Account:

1. **Authentication Tab:**
   ```
   User UID: abc123def456
   Provider: Password / google.com / apple.com
   Created: Just now
   Last sign-in: Just now
   ```

2. **Firestore `users` Collection:**
   ```
   Document ID: abc123def456
   Fields:
     ✅ email
     ✅ displayName
     ✅ photoURL (if applicable)
     ✅ createdAt
     ✅ lastLoginAt
     ✅ onboardingComplete: false
     ✅ profileComplete: false
     ✅ clubsComplete: false
   ```

3. **After Completing Profile:**
   ```
   users/{userId}/profile
     ✅ All 5 core questions answered
     ✅ Optional fields (if filled)
     ✅ Timestamps

   users/{userId} (updated):
     ✅ profileComplete: true
   ```

4. **After Adding Clubs:**
   ```
   users/{userId}/clubs
     ✅ clubs array with 1-26 clubs
     ✅ Each club has name, takeback, face, carryYards
     ✅ Timestamps

   users/{userId} (updated):
     ✅ clubsComplete: true
   ```

---

## Next Steps After Verification

Once you've verified authentication is working:

1. ✅ **Test complete user flow:**
   - Sign up → Complete profile → Add clubs → Dashboard

2. ✅ **Test data persistence:**
   - Log out → Log back in → Verify data still there

3. ✅ **Test cross-device sync:**
   - Make changes on web → Check if they appear in mobile app
   - Make changes on mobile → Check if they appear on web

4. ✅ **Continue with Phase 3:**
   - Course search and favorites implementation
   - See IMPLEMENTATION_PROGRESS_REPORT.md for details

---

**Last Updated:** October 22, 2025
**Firebase Project:** caddyai-aaabd
**Live Site:** https://caddyai-2dc3o72xb-rcg-valuation.vercel.app
