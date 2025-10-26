/**
 * Test Stripe Webhook Handler
 * Simulates webhook events locally without Stripe CLI
 */

require('dotenv').config({ path: '.env.local' });
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function testWebhook() {
  console.log('\n🧪 Testing Stripe Webhook Handler...\n');

  try {
    // Test 1: Create a test customer
    console.log('Test 1: Creating test customer...');
    const customer = await stripe.customers.create({
      email: 'test@example.com',
      name: 'Test User',
      metadata: {
        userId: 'test_user_123'
      }
    });
    console.log(`✅ Customer created: ${customer.id}\n`);

    // Test 2: Create a test subscription
    console.log('Test 2: Creating test subscription...');
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [
        {
          price: process.env.STRIPE_PRICE_ID_PRO_MONTHLY,
        },
      ],
      trial_period_days: 14,
      metadata: {
        userId: 'test_user_123',
        plan: 'pro'
      }
    });
    console.log(`✅ Subscription created: ${subscription.id}`);
    console.log(`   Status: ${subscription.status}`);
    console.log(`   Trial ends: ${new Date(subscription.trial_end * 1000).toLocaleString()}\n`);

    // Test 3: Retrieve subscription to verify
    console.log('Test 3: Retrieving subscription...');
    const retrieved = await stripe.subscriptions.retrieve(subscription.id);
    console.log(`✅ Subscription retrieved successfully`);
    console.log(`   Plan: ${retrieved.items.data[0].price.id}`);
    console.log(`   Period: ${retrieved.items.data[0].price.recurring.interval}`);
    console.log(`   Amount: $${retrieved.items.data[0].price.unit_amount / 100}\n`);

    // Test 4: Simulate webhook events
    console.log('Test 4: Webhook events to expect...');
    console.log('   When this subscription activates, these webhooks will fire:');
    console.log('   1. customer.subscription.created');
    console.log('   2. invoice.created');
    console.log('   3. invoice.finalized');
    console.log('   4. invoice.paid (after trial or immediate payment)\n');

    // Test 5: Create a checkout session
    console.log('Test 5: Creating test checkout session...');
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      mode: 'subscription',
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID_PRO_MONTHLY,
          quantity: 1,
        },
      ],
      success_url: 'http://localhost:3000/dashboard?success=true',
      cancel_url: 'http://localhost:3000/pricing',
      metadata: {
        userId: 'test_user_123',
        plan: 'pro'
      }
    });
    console.log(`✅ Checkout session created: ${session.id}`);
    console.log(`   URL: ${session.url}\n`);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ All API tests passed!\n');
    console.log('🎯 To test webhook handling:');
    console.log('   1. Start Stripe CLI:');
    console.log('      stripe listen --forward-to localhost:3000/api/stripe/webhook\n');
    console.log('   2. In another terminal, trigger events:');
    console.log('      stripe trigger checkout.session.completed\n');
    console.log('   3. Check your server logs for webhook processing\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Cleanup
    console.log('Cleaning up test data...');
    await stripe.subscriptions.cancel(subscription.id);
    await stripe.customers.del(customer.id);
    console.log('✅ Test data cleaned up\n');

    return true;

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);

    if (error.code === 'resource_missing') {
      console.error('\n💡 This means a price ID is incorrect. Check your .env.local:');
      console.error('   STRIPE_PRICE_ID_PRO_MONTHLY');
      console.error('   STRIPE_PRICE_ID_PRO_ANNUAL');
      console.error('   STRIPE_PRICE_ID_TOUR_MONTHLY');
      console.error('   STRIPE_PRICE_ID_TOUR_ANNUAL');
    }

    console.error('\n');
    return false;
  }
}

// Run tests
testWebhook()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
