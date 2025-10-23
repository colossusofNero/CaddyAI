/**
 * Authentication Test Script
 *
 * Tests all three authentication methods:
 * 1. Email/Password signup
 * 2. Google Sign-In (requires browser interaction)
 * 3. Apple Sign-In (requires browser interaction)
 *
 * This script uses Puppeteer to simulate real user interactions
 */

const puppeteer = require('puppeteer');

const SITE_URL = process.env.SITE_URL || 'https://caddyai-2dc3o72xb-rcg-valuation.vercel.app';

// Generate random test user
const generateTestUser = () => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return {
    name: `Test User ${random}`,
    email: `testuser${timestamp}@caddyai-test.com`,
    password: 'TestPass123!',
  };
};

class AuthTester {
  constructor() {
    this.browser = null;
    this.page = null;
    this.testUser = generateTestUser();
    this.results = {
      emailSignup: { success: false, error: null, userId: null },
      emailLogin: { success: false, error: null },
      googleSignIn: { success: false, error: null, note: 'Requires manual interaction' },
      appleSignIn: { success: false, error: null, note: 'Requires manual interaction' },
      firestoreData: { success: false, error: null, data: null },
    };
  }

  async init() {
    console.log('🚀 Starting Authentication Tests...\n');
    console.log('Test User Credentials:');
    console.log(`  Name: ${this.testUser.name}`);
    console.log(`  Email: ${this.testUser.email}`);
    console.log(`  Password: ${this.testUser.password}\n`);

    this.browser = await puppeteer.launch({
      headless: false, // Show browser for visual confirmation
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      defaultViewport: { width: 1280, height: 800 },
    });
    this.page = await this.browser.newPage();

    // Listen for console messages from the page
    this.page.on('console', msg => {
      const text = msg.text();
      if (text.includes('[Firebase]') || text.includes('[Auth]')) {
        console.log(`  📝 Browser Console: ${text}`);
      }
    });
  }

  async testEmailSignup() {
    console.log('📧 Test 1: Email/Password Signup');
    console.log('  → Navigating to signup page...');

    try {
      await this.page.goto(`${SITE_URL}/signup`, {
        waitUntil: 'networkidle0',
        timeout: 30000,
      });

      console.log('  → Filling signup form...');

      // Fill in the form
      await this.page.type('input[name="displayName"]', this.testUser.name);
      await this.page.type('input[name="email"]', this.testUser.email);
      await this.page.type('input[name="password"]', this.testUser.password);
      await this.page.type('input[name="confirmPassword"]', this.testUser.password);

      console.log('  → Submitting form...');

      // Click submit button
      await this.page.click('button[type="submit"]');

      // Wait for either success message or error
      await Promise.race([
        this.page.waitForSelector('.bg-green-500', { timeout: 10000 }).then(() => 'success'),
        this.page.waitForSelector('.bg-red-500', { timeout: 10000 }).then(() => 'error'),
      ]).then(async (result) => {
        if (result === 'success') {
          console.log('  ✅ SUCCESS: Account created!');

          // Try to extract success message
          const successText = await this.page.$eval('.bg-green-500', el => el.textContent);
          console.log(`  📨 Message: ${successText.trim()}`);

          this.results.emailSignup.success = true;

          // Wait a bit to see if we get redirected to dashboard
          await this.page.waitForTimeout(3000);
          const url = this.page.url();
          if (url.includes('/dashboard')) {
            console.log('  ✅ Redirected to dashboard successfully');

            // Try to get user info from the page
            const userName = await this.page.$eval('body', (body) => {
              const match = body.textContent.match(/Welcome back,\s*([^!]+)/);
              return match ? match[1] : null;
            }).catch(() => null);

            if (userName) {
              console.log(`  👤 Logged in as: ${userName}`);
            }
          }
        } else {
          const errorText = await this.page.$eval('.bg-red-500', el => el.textContent);
          console.log(`  ❌ ERROR: ${errorText.trim()}`);
          this.results.emailSignup.error = errorText.trim();
        }
      });

    } catch (error) {
      console.log(`  ❌ FAILED: ${error.message}`);
      this.results.emailSignup.error = error.message;
    }

    console.log('');
  }

  async testEmailLogin() {
    console.log('🔐 Test 2: Email/Password Login (with same credentials)');

    try {
      // First sign out if we're signed in
      const currentUrl = this.page.url();
      if (currentUrl.includes('/dashboard')) {
        console.log('  → Signing out first...');
        await this.page.click('button::-p-text(Sign Out)').catch(() => {});
        await this.page.waitForTimeout(2000);
      }

      console.log('  → Navigating to login page...');
      await this.page.goto(`${SITE_URL}/login`, {
        waitUntil: 'networkidle0',
        timeout: 30000,
      });

      console.log('  → Filling login form...');
      await this.page.type('input[type="email"]', this.testUser.email);
      await this.page.type('input[type="password"]', this.testUser.password);

      console.log('  → Submitting form...');
      await this.page.click('button[type="submit"]');

      // Wait for redirect to dashboard
      await this.page.waitForNavigation({ timeout: 10000 }).catch(() => {});

      const url = this.page.url();
      if (url.includes('/dashboard')) {
        console.log('  ✅ SUCCESS: Logged in successfully!');
        this.results.emailLogin.success = true;
      } else {
        console.log('  ❌ FAILED: Did not redirect to dashboard');
        this.results.emailLogin.error = 'No redirect to dashboard';
      }

    } catch (error) {
      console.log(`  ❌ FAILED: ${error.message}`);
      this.results.emailLogin.error = error.message;
    }

    console.log('');
  }

  async testGoogleSignIn() {
    console.log('🔵 Test 3: Google Sign-In');
    console.log('  ⚠️  This requires manual interaction in the browser');
    console.log('  → Navigating to login page...');

    try {
      await this.page.goto(`${SITE_URL}/login`, {
        waitUntil: 'networkidle0',
        timeout: 30000,
      });

      console.log('  → Looking for Google Sign-In button...');

      const googleButton = await this.page.$('button::-p-text(Sign in with Google)');

      if (googleButton) {
        console.log('  ✅ Google Sign-In button found!');
        console.log('  📝 To test Google Sign-In:');
        console.log('     1. Click the "Sign in with Google" button in the browser');
        console.log('     2. Select your Google account in the popup');
        console.log('     3. The script will continue automatically...\n');
        console.log('  ⏳ Waiting 30 seconds for manual interaction...');

        // Wait for 30 seconds to allow manual interaction
        await this.page.waitForTimeout(30000);

        // Check if we're on dashboard
        const url = this.page.url();
        if (url.includes('/dashboard')) {
          console.log('  ✅ Google Sign-In appeared to work (on dashboard)');
          this.results.googleSignIn.success = true;
        } else {
          console.log('  ⚠️  Google Sign-In not completed (not on dashboard)');
        }
      } else {
        console.log('  ❌ Google Sign-In button not found');
        this.results.googleSignIn.error = 'Button not found';
      }

    } catch (error) {
      console.log(`  ❌ FAILED: ${error.message}`);
      this.results.googleSignIn.error = error.message;
    }

    console.log('');
  }

  async testAppleSignIn() {
    console.log('🍎 Test 4: Apple Sign-In');
    console.log('  ⚠️  This requires manual interaction in the browser');
    console.log('  → Navigating to login page...');

    try {
      await this.page.goto(`${SITE_URL}/login`, {
        waitUntil: 'networkidle0',
        timeout: 30000,
      });

      console.log('  → Looking for Apple Sign-In button...');

      const appleButton = await this.page.$('button::-p-text(Sign in with Apple)');

      if (appleButton) {
        console.log('  ✅ Apple Sign-In button found!');
        console.log('  📝 To test Apple Sign-In:');
        console.log('     1. Click the "Sign in with Apple" button in the browser');
        console.log('     2. Authenticate with your Apple ID');
        console.log('     3. The script will continue automatically...\n');
        console.log('  ⏳ Waiting 30 seconds for manual interaction...');

        // Wait for 30 seconds to allow manual interaction
        await this.page.waitForTimeout(30000);

        // Check if we're on dashboard
        const url = this.page.url();
        if (url.includes('/dashboard')) {
          console.log('  ✅ Apple Sign-In appeared to work (on dashboard)');
          this.results.appleSignIn.success = true;
        } else {
          console.log('  ⚠️  Apple Sign-In not completed (not on dashboard)');
        }
      } else {
        console.log('  ❌ Apple Sign-In button not found');
        this.results.appleSignIn.error = 'Button not found';
      }

    } catch (error) {
      console.log(`  ❌ FAILED: ${error.message}`);
      this.results.appleSignIn.error = error.message;
    }

    console.log('');
  }

  async checkFirestoreData() {
    console.log('🔥 Test 5: Check Firestore Data');
    console.log('  📝 Note: This test checks if Firebase console shows data');
    console.log('  → You need to manually verify in Firebase Console:');
    console.log('');
    console.log('  🔗 Firebase Console URLs:');
    console.log('     Authentication: https://console.firebase.google.com/project/caddyai-aaabd/authentication/users');
    console.log('     Firestore: https://console.firebase.google.com/project/caddyai-aaabd/firestore/databases/-default-/data');
    console.log('');
    console.log('  📧 Look for test user:');
    console.log(`     Email: ${this.testUser.email}`);
    console.log(`     Name: ${this.testUser.name}`);
    console.log('');
    console.log('  ✅ In Authentication → Users tab, you should see:');
    console.log('     - User UID');
    console.log('     - Email address');
    console.log('     - Display name');
    console.log('     - Created date');
    console.log('');
    console.log('  ✅ In Firestore → users collection, you should see:');
    console.log('     - Document with UID as ID');
    console.log('     - Fields: email, displayName, createdAt, lastLoginAt');
    console.log('     - Fields: onboardingComplete, profileComplete, clubsComplete (all false)');
    console.log('');

    this.results.firestoreData.note = 'Manual verification required';
  }

  generateReport() {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📊 AUTHENTICATION TEST REPORT');
    console.log('═══════════════════════════════════════════════════════════\n');

    console.log('Test User Credentials:');
    console.log(`  Name: ${this.testUser.name}`);
    console.log(`  Email: ${this.testUser.email}`);
    console.log(`  Password: ${this.testUser.password}\n`);

    console.log('Test Results:\n');

    // Email Signup
    console.log(`1. Email/Password Signup: ${this.results.emailSignup.success ? '✅ PASSED' : '❌ FAILED'}`);
    if (this.results.emailSignup.error) {
      console.log(`   Error: ${this.results.emailSignup.error}`);
    }
    console.log('');

    // Email Login
    console.log(`2. Email/Password Login: ${this.results.emailLogin.success ? '✅ PASSED' : '❌ FAILED'}`);
    if (this.results.emailLogin.error) {
      console.log(`   Error: ${this.results.emailLogin.error}`);
    }
    console.log('');

    // Google Sign-In
    console.log(`3. Google Sign-In: ${this.results.googleSignIn.success ? '✅ PASSED' : '⚠️  NEEDS MANUAL TEST'}`);
    if (this.results.googleSignIn.note) {
      console.log(`   Note: ${this.results.googleSignIn.note}`);
    }
    console.log('');

    // Apple Sign-In
    console.log(`4. Apple Sign-In: ${this.results.appleSignIn.success ? '✅ PASSED' : '⚠️  NEEDS MANUAL TEST'}`);
    if (this.results.appleSignIn.note) {
      console.log(`   Note: ${this.results.appleSignIn.note}`);
    }
    console.log('');

    // Firestore Data
    console.log('5. Firestore Data: ⚠️  NEEDS MANUAL VERIFICATION');
    console.log('   Check Firebase Console to verify data was saved');
    console.log('');

    console.log('═══════════════════════════════════════════════════════════');
    console.log('🔗 NEXT STEPS');
    console.log('═══════════════════════════════════════════════════════════\n');

    console.log('1. Verify in Firebase Console:');
    console.log('   🔗 https://console.firebase.google.com/project/caddyai-aaabd/authentication/users\n');

    console.log('2. Check Firestore database:');
    console.log('   🔗 https://console.firebase.google.com/project/caddyai-aaabd/firestore\n');

    console.log('3. To manually test Google/Apple sign-in:');
    console.log('   - Run this script again');
    console.log('   - When prompted, click the sign-in buttons');
    console.log('   - Complete the authentication flow\n');

    const passedTests = Object.values(this.results).filter(r => r.success).length;
    const totalTests = 2; // Only email signup and login are fully automated

    console.log(`📈 Automated Tests: ${passedTests}/${totalTests} passed\n`);
  }

  async run() {
    try {
      await this.init();

      // Test 1: Email/Password Signup
      await this.testEmailSignup();
      await this.page.waitForTimeout(2000);

      // Test 2: Email/Password Login
      await this.testEmailLogin();
      await this.page.waitForTimeout(2000);

      // Test 3: Google Sign-In (manual)
      // Uncomment if you want to test this:
      // await this.testGoogleSignIn();

      // Test 4: Apple Sign-In (manual)
      // Uncomment if you want to test this:
      // await this.testAppleSignIn();

      // Test 5: Firestore verification instructions
      await this.checkFirestoreData();

      // Generate report
      this.generateReport();

      console.log('✅ Testing complete! Browser will remain open for manual verification.');
      console.log('   Close the browser when you\'re done.\n');

      // Keep browser open for manual inspection
      // await this.browser.close();

    } catch (error) {
      console.error('❌ Test suite failed:', error);
      throw error;
    }
  }
}

// Run the tests
if (require.main === module) {
  const tester = new AuthTester();
  tester.run().catch(console.error);
}

module.exports = AuthTester;
