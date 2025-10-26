/**
 * Stripe API Connection Verification Script
 * Tests that Stripe API keys are configured correctly
 */

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function verifyStripeConnection() {
  console.log('\n🔍 Verifying Stripe API Connection...\n');

  try {
    // Test 1: Retrieve account information
    console.log('Test 1: Retrieving Stripe account info...');
    const account = await stripe.accounts.retrieve();

    console.log('✅ SUCCESS: Connected to Stripe account');
    console.log(`   Account ID: ${account.id}`);
    console.log(`   Email: ${account.email || 'Not set'}`);
    console.log(`   Country: ${account.country}`);
    console.log(`   Business Name: ${account.business_profile?.name || 'Not set'}`);
    console.log(`   Charges Enabled: ${account.charges_enabled ? '✅' : '❌'}`);
    console.log(`   Payouts Enabled: ${account.payouts_enabled ? '✅' : '❌'}`);

    // Check if using live or test mode
    const isLiveMode = process.env.STRIPE_SECRET_KEY.startsWith('sk_live_');
    console.log(`\n   Mode: ${isLiveMode ? '🔴 LIVE MODE (Real Money)' : '🟢 TEST MODE'}`);

    if (isLiveMode) {
      console.log('\n⚠️  WARNING: You are using LIVE keys!');
      console.log('   - Real payments will be processed');
      console.log('   - Real charges will be made to customers');
      console.log('   - Consider using TEST keys (sk_test_...) for development');
    }

    // Test 2: List existing products
    console.log('\n\nTest 2: Checking for existing products...');
    const products = await stripe.products.list({ limit: 10 });

    if (products.data.length === 0) {
      console.log('ℹ️  No products found (this is normal for new accounts)');
      console.log('   We will create CaddyAI products next.');
    } else {
      console.log(`✅ Found ${products.data.length} existing products:`);
      products.data.forEach(product => {
        console.log(`   - ${product.name} (${product.id})`);
      });
    }

    // Test 3: Check for CaddyAI products
    console.log('\n\nTest 3: Looking for CaddyAI products...');
    const caddyProducts = products.data.filter(p =>
      p.name.includes('CaddyAI') || p.name.includes('Pro') || p.name.includes('Tour')
    );

    if (caddyProducts.length === 0) {
      console.log('ℹ️  No CaddyAI products found');
      console.log('   Ready to create products!');
    } else {
      console.log(`✅ Found ${caddyProducts.length} CaddyAI products:`);
      caddyProducts.forEach(product => {
        console.log(`   - ${product.name} (${product.id})`);
      });
    }

    console.log('\n\n✅ All tests passed! Stripe integration is ready.\n');

    return {
      success: true,
      account,
      existingProducts: products.data
    };

  } catch (error) {
    console.error('\n❌ ERROR: Failed to connect to Stripe');
    console.error(`   Message: ${error.message}`);

    if (error.type === 'StripeAuthenticationError') {
      console.error('\n💡 This is an authentication error. Please check:');
      console.error('   1. Your STRIPE_SECRET_KEY in .env.local is correct');
      console.error('   2. The key starts with sk_test_ or sk_live_');
      console.error('   3. The key has not been deleted or revoked in Stripe Dashboard');
    }

    if (error.statusCode === 401) {
      console.error('\n💡 Invalid API key. Please verify:');
      console.error('   1. Copy the key directly from https://dashboard.stripe.com/apikeys');
      console.error('   2. Make sure there are no extra spaces or quotes');
      console.error('   3. Restart your dev server after updating .env.local');
    }

    console.error('\n');
    return {
      success: false,
      error: error.message
    };
  }
}

// Run verification
verifyStripeConnection()
  .then(result => {
    process.exit(result.success ? 0 : 1);
  })
  .catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
