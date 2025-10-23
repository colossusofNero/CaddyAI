#!/usr/bin/env node

/**
 * Firebase Configuration Validator
 *
 * This script validates that Firebase is properly configured for authentication.
 * It checks:
 * 1. Environment variables are present
 * 2. Firebase project is accessible
 * 3. Authentication providers are enabled
 * 4. Firestore database exists
 * 5. Authorized domains are configured
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

console.log('\n╔════════════════════════════════════════════════════════════╗');
console.log('║     🔥 Firebase Authentication Configuration Validator     ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

// Load environment variables from .env.local
const envPath = path.join(__dirname, '..', '.env.local');
let envVars = {};

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim();
      envVars[key] = value;
    }
  });
  console.log('✅ Found .env.local file\n');
} else {
  console.error('❌ CRITICAL: .env.local file not found!');
  console.error('   Location expected: ' + envPath);
  console.error('   Create this file with your Firebase credentials.\n');
  process.exit(1);
}

// Check required environment variables
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('1. Environment Variables Check');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

const requiredVars = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID'
];

let allVarsPresent = true;
requiredVars.forEach(varName => {
  const value = envVars[varName];
  if (value && value.length > 0) {
    console.log(`✅ ${varName}`);
    if (varName === 'NEXT_PUBLIC_FIREBASE_PROJECT_ID') {
      console.log(`   → Project ID: ${value}`);
    }
    if (varName === 'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN') {
      console.log(`   → Auth Domain: ${value}`);
    }
  } else {
    console.log(`❌ ${varName} - MISSING!`);
    allVarsPresent = false;
  }
});

if (!allVarsPresent) {
  console.error('\n❌ FAILURE: Required environment variables are missing!');
  console.error('   Fix: Add missing variables to .env.local\n');
  process.exit(1);
}

console.log('\n✅ All required environment variables are present\n');

// Extract Firebase config
const firebaseConfig = {
  apiKey: envVars.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: envVars.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: envVars.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: envVars.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: envVars.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: envVars.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Check Firebase Auth endpoint accessibility
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('2. Firebase Auth Endpoint Check');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

function checkAuthEndpoint() {
  return new Promise((resolve, reject) => {
    const url = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${firebaseConfig.apiKey}`;

    console.log('Testing Firebase Auth API accessibility...');

    const req = https.request(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, (res) => {
      let data = '';

      res.on('data', chunk => {
        data += chunk;
      });

      res.on('end', () => {
        // We expect a 400 error because we're not sending a valid request
        // But this confirms the endpoint is accessible
        if (res.statusCode === 400) {
          console.log('✅ Firebase Auth API is accessible');
          console.log(`   Status: ${res.statusCode} (Expected - endpoint is working)\n`);
          resolve(true);
        } else if (res.statusCode === 401 || res.statusCode === 403) {
          console.error('❌ Firebase Auth API Key is invalid!');
          console.error(`   Status: ${res.statusCode}`);
          console.error('   Fix: Check your NEXT_PUBLIC_FIREBASE_API_KEY in .env.local\n');
          resolve(false);
        } else {
          console.warn(`⚠️  Unexpected response: ${res.statusCode}`);
          console.warn('   This might still work, but verify in Firebase Console\n');
          resolve(true);
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Cannot reach Firebase Auth API!');
      console.error(`   Error: ${error.message}`);
      console.error('   Fix: Check your internet connection\n');
      resolve(false);
    });

    // Send empty request (we expect it to fail, but confirms endpoint is reachable)
    req.write(JSON.stringify({}));
    req.end();
  });
}

// Check Firestore endpoint
function checkFirestoreEndpoint() {
  return new Promise((resolve, reject) => {
    const url = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents`;

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('3. Firestore Database Check');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('Testing Firestore API accessibility...');

    const req = https.request(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    }, (res) => {
      let data = '';

      res.on('data', chunk => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log('✅ Firestore database is accessible');
          console.log(`   Status: ${res.statusCode}\n`);
          resolve(true);
        } else if (res.statusCode === 400) {
          console.error('❌ Firestore database is NOT created!');
          console.error(`   Status: ${res.statusCode}`);
          console.error('   Fix:');
          console.error('   1. Go to: https://console.firebase.google.com/project/' + firebaseConfig.projectId + '/firestore');
          console.error('   2. Click "Create Database"');
          console.error('   3. Choose "Start in test mode" (for development)');
          console.error('   4. Select location (us-central1 recommended)');
          console.error('   5. Click "Enable"\n');
          resolve(false);
        } else if (res.statusCode === 403) {
          console.error('❌ Firestore access denied!');
          console.error(`   Status: ${res.statusCode}`);
          console.error('   This might mean:');
          console.error('   - Firestore database not created');
          console.error('   - Firestore security rules are too restrictive');
          console.error('   - API key doesn\'t have Firestore access\n');
          resolve(false);
        } else {
          console.warn(`⚠️  Unexpected Firestore response: ${res.statusCode}`);
          console.warn('   Response:', data.substring(0, 200));
          console.warn('   Verify Firestore is set up in Firebase Console\n');
          resolve(false);
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Cannot reach Firestore API!');
      console.error(`   Error: ${error.message}`);
      console.error('   Fix: Check your internet connection\n');
      resolve(false);
    });

    req.end();
  });
}

// Print configuration summary
function printConfigSummary() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('4. Configuration Summary');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log('Firebase Project Details:');
  console.log(`  Project ID:     ${firebaseConfig.projectId}`);
  console.log(`  Auth Domain:    ${firebaseConfig.authDomain}`);
  console.log(`  Storage Bucket: ${firebaseConfig.storageBucket}\n`);

  console.log('Important Firebase Console Links:');
  console.log(`  📊 Project Overview:`);
  console.log(`     https://console.firebase.google.com/project/${firebaseConfig.projectId}/overview\n`);

  console.log(`  🔐 Authentication:`);
  console.log(`     https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication/users`);
  console.log(`     → Check sign-in methods are enabled\n`);

  console.log(`  🔥 Firestore Database:`);
  console.log(`     https://console.firebase.google.com/project/${firebaseConfig.projectId}/firestore`);
  console.log(`     → Ensure database is created\n`);

  console.log(`  ⚙️  Project Settings:`);
  console.log(`     https://console.firebase.google.com/project/${firebaseConfig.projectId}/settings/general\n`);
}

// Print authentication provider checklist
function printAuthProviderChecklist() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('5. Authentication Provider Checklist');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log('Verify these providers are enabled in Firebase Console:');
  console.log(`🔗 https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication/providers\n`);

  console.log('Required Providers:');
  console.log('  [ ] Email/Password');
  console.log('      - Enable "Email/Password" provider');
  console.log('      - Email verification is optional\n');

  console.log('  [ ] Google');
  console.log('      - Enable "Google" provider');
  console.log('      - No additional configuration needed\n');

  console.log('  [ ] Apple (Optional)');
  console.log('      - Enable "Apple" provider');
  console.log('      - Requires Apple Developer account');
  console.log('      - Need Service ID, Team ID, Key ID, Private Key\n');

  console.log('Authorized Domains:');
  console.log(`🔗 https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication/settings\n`);
  console.log('  [ ] localhost (for development)');
  console.log('  [ ] Your production domain');
  console.log(`  [ ] ${firebaseConfig.authDomain} (Firebase default)\n`);
}

// Print final recommendations
function printRecommendations(authAccessible, firestoreAccessible) {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('6. Validation Results & Next Steps');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const allGood = authAccessible && firestoreAccessible;

  if (allGood) {
    console.log('✅ ALL CHECKS PASSED!');
    console.log('\nYour Firebase configuration appears to be correct.\n');
    console.log('Next Steps:');
    console.log('  1. Start the dev server: npm run dev');
    console.log('  2. Navigate to: http://localhost:3000/login');
    console.log('  3. Open browser DevTools console (F12)');
    console.log('  4. Try logging in and watch for debug messages');
    console.log('  5. See AUTHENTICATION_DEBUG_GUIDE.md for detailed testing\n');

    console.log('⚠️  Important: Manual Checks Required');
    console.log('  This script cannot verify:');
    console.log('  - Authentication providers are enabled in Firebase Console');
    console.log('  - Authorized domains are configured');
    console.log('  - Apple Sign-In is properly configured');
    console.log('\n  Please verify these manually in Firebase Console.\n');
  } else {
    console.log('❌ VALIDATION FAILED!\n');
    console.log('Issues Found:');
    if (!authAccessible) {
      console.log('  ❌ Firebase Authentication is not accessible');
      console.log('     → Verify API key is correct');
      console.log('     → Check internet connection\n');
    }
    if (!firestoreAccessible) {
      console.log('  ❌ Firestore database is not accessible');
      console.log('     → Create Firestore database in Firebase Console');
      console.log('     → Verify project ID is correct\n');
    }

    console.log('Action Required:');
    console.log('  1. Fix the issues listed above');
    console.log('  2. Run this script again: node scripts/validate-firebase-config.js');
    console.log('  3. Once all checks pass, start testing authentication\n');
  }
}

// Run all checks
async function runValidation() {
  const authAccessible = await checkAuthEndpoint();
  const firestoreAccessible = await checkFirestoreEndpoint();

  printConfigSummary();
  printAuthProviderChecklist();
  printRecommendations(authAccessible, firestoreAccessible);

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Exit with appropriate code
  process.exit(authAccessible && firestoreAccessible ? 0 : 1);
}

// Execute validation
runValidation().catch(error => {
  console.error('❌ Validation script error:', error);
  process.exit(1);
});
