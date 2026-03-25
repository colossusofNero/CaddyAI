/**
 * Delete User Script
 * Properly removes a user from both Stripe and Firebase.
 *
 * Usage:
 *   node scripts/delete-user.js <email>
 *
 * This uses Firebase Admin SDK directly (no API call needed).
 * Requires FIREBASE_SERVICE_ACCOUNT and STRIPE_SECRET_KEY env vars.
 */

const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');

// Load .env.local
try {
  const fs = require('fs');
  const path = require('path');
  const envPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match && !process.env[match[1]]) {
        let value = match[2].trim();
        if ((value.startsWith("'") && value.endsWith("'")) ||
            (value.startsWith('"') && value.endsWith('"'))) {
          value = value.slice(1, -1);
        }
        process.env[match[1].trim()] = value;
      }
    });
  }
} catch (e) { /* ignore */ }

const email = process.argv[2];
if (!email) {
  console.error('Usage: node scripts/delete-user.js <email>');
  process.exit(1);
}

if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
  console.error('ERROR: FIREBASE_SERVICE_ACCOUNT env var required');
  process.exit(1);
}

// Initialize Firebase Admin
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
const app = getApps().length === 0 ? initializeApp({ credential: cert(serviceAccount) }) : getApps()[0];
const db = getFirestore(app);
const auth = getAuth(app);

// Initialize Stripe
let stripe = null;
if (process.env.STRIPE_SECRET_KEY) {
  const Stripe = require('stripe');
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
}

async function deleteUser(email) {
  console.log(`\nDeleting user: ${email}\n`);

  // Find Firebase Auth user
  let userId;
  try {
    const userRecord = await auth.getUserByEmail(email);
    userId = userRecord.uid;
    console.log(`  Found Firebase Auth user: ${userId}`);
  } catch (e) {
    console.log(`  No Firebase Auth user found for ${email}`);
  }

  // Step 1: Cancel Stripe subscriptions and delete customer
  if (stripe) {
    try {
      const customers = await stripe.customers.list({ email, limit: 10 });
      for (const customer of customers.data) {
        const subs = await stripe.subscriptions.list({ customer: customer.id, limit: 10 });
        for (const sub of subs.data) {
          if (sub.status !== 'canceled') {
            await stripe.subscriptions.cancel(sub.id);
            console.log(`  Canceled Stripe subscription: ${sub.id}`);
          }
        }
        await stripe.customers.del(customer.id);
        console.log(`  Deleted Stripe customer: ${customer.id}`);
      }
      if (customers.data.length === 0) {
        console.log('  No Stripe customers found');
      }
    } catch (e) {
      console.log(`  Stripe cleanup error: ${e.message}`);
    }
  } else {
    console.log('  Skipping Stripe (no STRIPE_SECRET_KEY)');
  }

  // Step 2: Delete Firestore data
  if (userId) {
    try {
      await db.collection('users').doc(userId).delete();
      console.log('  Deleted Firestore users doc');
    } catch (e) {
      console.log(`  Firestore users: ${e.message}`);
    }

    try {
      await db.collection('subscriptions').doc(userId).delete();
      console.log('  Deleted Firestore subscriptions doc');
    } catch (e) {
      console.log(`  Firestore subscriptions: ${e.message}`);
    }
  }

  // Step 3: Delete Firebase Auth user
  if (userId) {
    try {
      await auth.deleteUser(userId);
      console.log('  Deleted Firebase Auth user');
    } catch (e) {
      console.log(`  Firebase Auth: ${e.message}`);
    }
  }

  console.log('\nDone.\n');
}

deleteUser(email).then(() => process.exit(0)).catch(e => {
  console.error('Failed:', e);
  process.exit(1);
});
