/**
 * Create Stripe Products and Prices for CaddyAI
 * Creates Pro and Tour subscription plans with monthly and annual billing
 */

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const fs = require('fs');
const path = require('path');

async function createCaddyAIProducts() {
  console.log('\n🏗️  Creating CaddyAI Products and Prices...\n');

  const results = {
    products: {},
    prices: {}
  };

  try {
    // Check if products already exist
    console.log('Checking for existing CaddyAI products...');
    const existingProducts = await stripe.products.list({ limit: 100 });
    const caddyProducts = existingProducts.data.filter(p =>
      p.name.includes('CaddyAI')
    );

    if (caddyProducts.length > 0) {
      console.log(`\n⚠️  Found ${caddyProducts.length} existing CaddyAI products:`);
      caddyProducts.forEach(p => console.log(`   - ${p.name} (${p.id})`));
      console.log('\nWould you like to:');
      console.log('1. Use existing products (recommended)');
      console.log('2. Create new products anyway');
      console.log('\nTo use existing, run: node scripts/list-stripe-prices.js');
      console.log('Then manually add price IDs to .env.local\n');
      return;
    }

    // Create Pro Product
    console.log('\n1️⃣  Creating CaddyAI Pro product...');
    const proProduct = await stripe.products.create({
      name: 'CaddyAI Pro',
      description: 'Full-featured golf AI assistant with unlimited rounds, club recommendations, and performance analytics',
      metadata: {
        app: 'caddyai',
        tier: 'pro'
      }
    });
    console.log(`✅ Created: ${proProduct.name} (${proProduct.id})`);
    results.products.pro = proProduct;

    // Create Pro Monthly Price
    console.log('   Creating Pro Monthly price ($9.99/month)...');
    const proMonthly = await stripe.prices.create({
      product: proProduct.id,
      unit_amount: 999, // $9.99 in cents
      currency: 'usd',
      recurring: {
        interval: 'month',
        trial_period_days: 14
      },
      metadata: {
        plan: 'pro',
        billing: 'monthly'
      }
    });
    console.log(`   ✅ ${proMonthly.id}`);
    results.prices.proMonthly = proMonthly;

    // Create Pro Annual Price
    console.log('   Creating Pro Annual price ($95.88/year)...');
    const proAnnual = await stripe.prices.create({
      product: proProduct.id,
      unit_amount: 9588, // $95.88 in cents (20% discount)
      currency: 'usd',
      recurring: {
        interval: 'year',
        trial_period_days: 14
      },
      metadata: {
        plan: 'pro',
        billing: 'annual'
      }
    });
    console.log(`   ✅ ${proAnnual.id}`);
    results.prices.proAnnual = proAnnual;

    // Create Tour Product
    console.log('\n2️⃣  Creating CaddyAI Tour product...');
    const tourProduct = await stripe.products.create({
      name: 'CaddyAI Tour',
      description: 'Everything in Pro plus advanced analytics, strokes gained analysis, and API access for competitive golfers',
      metadata: {
        app: 'caddyai',
        tier: 'tour'
      }
    });
    console.log(`✅ Created: ${tourProduct.name} (${tourProduct.id})`);
    results.products.tour = tourProduct;

    // Create Tour Monthly Price
    console.log('   Creating Tour Monthly price ($19.99/month)...');
    const tourMonthly = await stripe.prices.create({
      product: tourProduct.id,
      unit_amount: 1999, // $19.99 in cents
      currency: 'usd',
      recurring: {
        interval: 'month',
        trial_period_days: 14
      },
      metadata: {
        plan: 'tour',
        billing: 'monthly'
      }
    });
    console.log(`   ✅ ${tourMonthly.id}`);
    results.prices.tourMonthly = tourMonthly;

    // Create Tour Annual Price
    console.log('   Creating Tour Annual price ($191.88/year)...');
    const tourAnnual = await stripe.prices.create({
      product: tourProduct.id,
      unit_amount: 19188, // $191.88 in cents (20% discount)
      currency: 'usd',
      recurring: {
        interval: 'year',
        trial_period_days: 14
      },
      metadata: {
        plan: 'tour',
        billing: 'annual'
      }
    });
    console.log(`   ✅ ${tourAnnual.id}`);
    results.prices.tourAnnual = tourAnnual;

    // Generate environment variable snippet
    console.log('\n\n✅ All products and prices created successfully!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 Add these to your .env.local file:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log(`STRIPE_PRICE_ID_PRO_MONTHLY=${proMonthly.id}`);
    console.log(`STRIPE_PRICE_ID_PRO_ANNUAL=${proAnnual.id}`);
    console.log(`STRIPE_PRICE_ID_TOUR_MONTHLY=${tourMonthly.id}`);
    console.log(`STRIPE_PRICE_ID_TOUR_ANNUAL=${tourAnnual.id}`);
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Save to file for reference
    const outputPath = path.join(__dirname, 'stripe-price-ids.txt');
    const output = `# CaddyAI Stripe Price IDs
# Generated: ${new Date().toISOString()}

STRIPE_PRICE_ID_PRO_MONTHLY=${proMonthly.id}
STRIPE_PRICE_ID_PRO_ANNUAL=${proAnnual.id}
STRIPE_PRICE_ID_TOUR_MONTHLY=${tourMonthly.id}
STRIPE_PRICE_ID_TOUR_ANNUAL=${tourAnnual.id}

# Product IDs (for reference)
# Pro Product: ${proProduct.id}
# Tour Product: ${tourProduct.id}

# View in Stripe Dashboard:
# https://dashboard.stripe.com/products
`;

    fs.writeFileSync(outputPath, output);
    console.log(`💾 Price IDs saved to: ${outputPath}\n`);

    // Show summary
    console.log('📊 Summary:\n');
    console.log('Products Created:');
    console.log(`   • CaddyAI Pro  - ${proProduct.id}`);
    console.log(`   • CaddyAI Tour - ${tourProduct.id}\n`);
    console.log('Prices Created:');
    console.log(`   • Pro Monthly  ($9.99/mo)  - ${proMonthly.id}`);
    console.log(`   • Pro Annual   ($95.88/yr) - ${proAnnual.id}`);
    console.log(`   • Tour Monthly ($19.99/mo) - ${tourMonthly.id}`);
    console.log(`   • Tour Annual  ($191.88/yr) - ${tourAnnual.id}\n`);
    console.log('All plans include a 14-day free trial.\n');

    console.log('🎯 Next Steps:');
    console.log('   1. Copy the price IDs above');
    console.log('   2. Add them to your .env.local file');
    console.log('   3. Restart your dev server');
    console.log('   4. Test checkout flow\n');

    return results;

  } catch (error) {
    console.error('\n❌ ERROR: Failed to create products');
    console.error(`   Message: ${error.message}`);

    if (error.type === 'StripeInvalidRequestError') {
      console.error('\n💡 This might be a validation error. Check:');
      console.error('   1. Your Stripe account is activated');
      console.error('   2. You have permission to create products');
      console.error('   3. The product details are valid');
    }

    console.error('\n');
    throw error;
  }
}

// Run product creation
createCaddyAIProducts()
  .then(() => {
    console.log('✅ Product creation complete!\n');
    process.exit(0);
  })
  .catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
