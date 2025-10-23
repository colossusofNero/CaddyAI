/**
 * Firestore Diagnostic Script
 * Checks if Firestore is properly configured and accessible
 */

// Firebase configuration from .env.local
const projectId = 'caddyai-aaabd';
const apiKey = 'AIzaSyBEKOnyd9OxjJG2FYwCKljkTdYNirFnVfs';

console.log('\n=== Firebase Firestore Diagnostic ===\n');
console.log('Project ID:', projectId);
console.log('API Key:', apiKey ? '✓ Present' : '✗ Missing');

console.log('\n--- Checking Firestore Setup ---\n');

console.log('⚠️  The 400 errors you\'re seeing indicate one of these issues:\n');

console.log('1. Firestore Database Not Created');
console.log('   → Go to: https://console.firebase.google.com/project/caddyai-aaabd/firestore');
console.log('   → Click "Create Database"');
console.log('   → Choose "Start in test mode" (for development)');
console.log('   → Select a location (us-central1 recommended)');
console.log('   → Click "Enable"\n');

console.log('2. Firestore Not Enabled');
console.log('   → The database must be created before you can use it');
console.log('   → Without it, all Firestore connections will fail with 400 errors\n');

console.log('3. Security Rules Issue (less likely)');
console.log('   → After creating database, set rules to test mode:');
console.log('   → rules_version = \'2\';');
console.log('   → service cloud.firestore {');
console.log('   →   match /databases/{database}/documents {');
console.log('   →     match /{document=**} {');
console.log('   →       allow read, write: if request.auth != null;');
console.log('   →     }');
console.log('   →   }');
console.log('   → }\n');

console.log('--- Quick Fix Steps ---\n');
console.log('Step 1: Visit https://console.firebase.google.com/project/caddyai-aaabd/firestore');
console.log('Step 2: Click "Create Database" button');
console.log('Step 3: Select "Start in production mode" or "Start in test mode"');
console.log('        (Test mode allows all reads/writes for 30 days - good for development)');
console.log('Step 4: Choose location: us-central1 (or closest to your users)');
console.log('Step 5: Click "Enable" and wait for provisioning (~30 seconds)');
console.log('Step 6: Refresh your app - errors should be gone!\n');

console.log('--- After Creating Database ---\n');
console.log('• The Firestore 400 errors will stop');
console.log('• User signups will save to Firestore');
console.log('• Authentication will work properly');
console.log('• You can view user data in Firebase Console\n');

console.log('=== End Diagnostic ===\n');
