# Stripe Payment Integration - Quick Start Guide

## Immediate Next Steps

This guide provides a quick reference for activating the Stripe payment infrastructure that has been built.

---

## Step 1: Update Your .env.local File (5 minutes)

1. Copy the placeholder keys from `.env.local.example`
2. Go to https://dashboard.stripe.com/test/apikeys
3. Add these to your `.env.local`:

```bash
# Stripe Payment Processing
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE
STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_KEY_HERE
```

**Note:** Get the webhook secret in Step 3

---

## Step 2: Create Products in Stripe (10 minutes)

### Create Pro Plan
1. Go to https://dashboard.stripe.com/test/products
2. Click "Add product"
3. Fill in:
   - Name: `CaddyAI Pro`
   - Description: `For serious golfers who want the full experience`
4. Add pricing:
   - Click "Add another price"
   - Price 1: $9.99 USD / month (recurring)
   - Price 2: $95.88 USD / year (recurring)
5. Click "Save product"
6. Copy both price IDs (they start with `price_`)

### Create Tour Plan
1. Click "Add product"
2. Fill in:
   - Name: `CaddyAI Tour`
   - Description: `Everything a competitive golfer needs`
3. Add pricing:
   - Price 1: $19.99 USD / month (recurring)
   - Price 2: $191.88 USD / year (recurring)
4. Click "Save product"
5. Copy both price IDs

### Update .env.local with Price IDs
```bash
# Add to .env.local
STRIPE_PRICE_ID_PRO_MONTHLY=price_xxxxx
STRIPE_PRICE_ID_PRO_ANNUAL=price_xxxxx
STRIPE_PRICE_ID_TOUR_MONTHLY=price_xxxxx
STRIPE_PRICE_ID_TOUR_ANNUAL=price_xxxxx
```

---

## Step 3: Set Up Webhooks (10 minutes)

### For Local Development

1. Install Stripe CLI:
   - Mac: `brew install stripe/stripe-cli/stripe`
   - Windows: Download from https://github.com/stripe/stripe-cli/releases
   - Linux: See https://stripe.com/docs/stripe-cli

2. Login to Stripe:
   ```bash
   stripe login
   ```

3. Forward webhooks to your local server:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```

4. Copy the webhook signing secret (starts with `whsec_`)
5. Add it to `.env.local`:
   ```bash
   STRIPE_WEBHOOK_SECRET=whsec_xxxxx
   ```

### For Production

1. Go to https://dashboard.stripe.com/test/webhooks
2. Click "Add endpoint"
3. Enter endpoint URL: `https://yourdomain.com/api/stripe/webhook`
4. Select events to listen to:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
5. Click "Add endpoint"
6. Copy the signing secret
7. Add to production environment variables

---

## Step 4: Test the Integration (15 minutes)

### Start Your Development Server
```bash
npm run dev
```

### Test Checkout Flow

1. Navigate to `/pricing`
2. Click "Start Pro Trial" or "Start Tour Trial"
3. You should see a checkout session being created

### Use Test Cards

**Successful Payment:**
- Card: 4242 4242 4242 4242
- Any future expiry date
- Any 3-digit CVC
- Any postal code

**Payment Decline:**
- Card: 4000 0000 0000 0002

**3D Secure Authentication:**
- Card: 4000 0025 0000 3155

### Verify in Stripe Dashboard

1. Go to https://dashboard.stripe.com/test/subscriptions
2. You should see test subscriptions appear
3. Go to https://dashboard.stripe.com/test/webhooks
4. Click on your webhook endpoint
5. You should see events being delivered

### Verify in Firestore

1. Open Firebase Console
2. Navigate to Firestore Database
3. Check `users/{userId}` collection
4. Verify `subscription` subcollection has data

---

## Step 5: Update Firestore Security Rules

Add these rules to your `firestore.rules`:

```javascript
match /users/{userId} {
  allow read: if request.auth.uid == userId;
  allow write: if request.auth.uid == userId;

  // Subscription data - read only for user, write only via server
  match /subscription/{document=**} {
    allow read: if request.auth.uid == userId;
    allow write: if false; // Only server-side operations
  }
}
```

---

## Complete Environment Variables Template

Here's the complete `.env.local` template with all Stripe variables:

```bash
# OpenWeatherMap API
NEXT_PUBLIC_OPENWEATHER_API_KEY=your_openweather_api_key_here

# iGolf API Credentials
NEXT_PUBLIC_IGOLF_API_KEY=your_igolf_api_key_here
IGOLF_SECRET_KEY=your_igolf_secret_key_here

# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=caddyai-aaabd.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=caddyai-aaabd
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=caddyai-aaabd.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id_here
NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id_here

# Google Analytics 4
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX

# Stripe Payment Processing
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51234567890abcdefg
STRIPE_SECRET_KEY=sk_test_51234567890abcdefg
STRIPE_WEBHOOK_SECRET=whsec_1234567890abcdefg

# Stripe Price IDs (from Dashboard)
STRIPE_PRICE_ID_PRO_MONTHLY=price_xxxxx
STRIPE_PRICE_ID_PRO_ANNUAL=price_xxxxx
STRIPE_PRICE_ID_TOUR_MONTHLY=price_xxxxx
STRIPE_PRICE_ID_TOUR_ANNUAL=price_xxxxx
```

---

## Infrastructure Files Summary

All files have been created at these locations:

### Configuration
- `C:\Users\scott\Claude_Code\caddyai\lib\stripe.ts`
- `C:\Users\scott\Claude_Code\caddyai\lib\stripe-client.ts`

### Types
- `C:\Users\scott\Claude_Code\caddyai\types\subscription.ts`

### API Routes
- `C:\Users\scott\Claude_Code\caddyai\app\api\stripe\checkout\route.ts`
- `C:\Users\scott\Claude_Code\caddyai\app\api\stripe\webhook\route.ts`
- `C:\Users\scott\Claude_Code\caddyai\app\api\stripe\portal\route.ts`
- `C:\Users\scott\Claude_Code\caddyai\app\api\stripe\subscription\route.ts`

### Services
- `C:\Users\scott\Claude_Code\caddyai\services\subscriptionService.ts`

### Documentation
- `C:\Users\scott\Claude_Code\caddyai\STRIPE_PAYMENT_INFRASTRUCTURE.md`
- `C:\Users\scott\Claude_Code\caddyai\STRIPE_QUICK_START.md` (this file)

---

## API Usage Examples

### Create Checkout Session (Client-side)
```typescript
const response = await fetch('/api/stripe/checkout', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: 'user_123',
    plan: 'pro',
    billingPeriod: 'monthly',
    successUrl: `${window.location.origin}/success`,
    cancelUrl: `${window.location.origin}/pricing`,
    customerEmail: 'user@example.com',
  }),
});

const { url } = await response.json();
window.location.href = url; // Redirect to Stripe Checkout
```

### Get Subscription Status (Client-side)
```typescript
const response = await fetch(`/api/stripe/subscription?userId=user_123`);
const status = await response.json();

console.log(status.plan); // 'free', 'pro', or 'tour'
console.log(status.hasActiveSubscription); // boolean
```

### Open Customer Portal (Client-side)
```typescript
const response = await fetch('/api/stripe/portal', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    customerId: 'cus_xxxxx',
    returnUrl: window.location.href,
  }),
});

const { url } = await response.json();
window.location.href = url; // Redirect to Customer Portal
```

---

## Troubleshooting

### Webhook Not Working
- Make sure Stripe CLI is running (`stripe listen --forward-to...`)
- Check webhook secret matches in `.env.local`
- Verify endpoint URL is correct in Stripe Dashboard

### Price Not Found Error
- Confirm you created the products in Stripe Dashboard
- Verify price IDs are added to `.env.local`
- Restart dev server after adding environment variables

### Firestore Not Updating
- Check webhook events in Stripe Dashboard
- Verify userId is being passed in metadata
- Check Firebase console for errors
- Ensure Firestore rules allow writes from server

---

## Next Phase: Frontend Integration

After completing this setup, the next agent should implement:

1. **Pricing Page Integration**
   - Connect buttons to checkout API
   - Add loading states
   - Handle errors

2. **Subscription Status Hook**
   - Create `useSubscription()` hook
   - Fetch and cache subscription status
   - Provide subscription data to components

3. **Feature Gating**
   - Create `useFeatureAccess()` hook
   - Check PLAN_FEATURES from types
   - Show upgrade prompts

4. **Settings Page**
   - Display current plan
   - Manage subscription button
   - Link to customer portal

---

## Support Resources

- **Stripe Dashboard:** https://dashboard.stripe.com
- **Stripe Docs:** https://stripe.com/docs
- **Stripe CLI:** https://stripe.com/docs/stripe-cli
- **Test Cards:** https://stripe.com/docs/testing
- **Webhooks Guide:** https://stripe.com/docs/webhooks

---

## Status Checklist

- [ ] Stripe account created
- [ ] API keys added to `.env.local`
- [ ] Products created in Stripe Dashboard
- [ ] Price IDs added to `.env.local`
- [ ] Webhook endpoint configured
- [ ] Webhook secret added to `.env.local`
- [ ] Test checkout completed successfully
- [ ] Webhook events verified in Dashboard
- [ ] Firestore data synced correctly
- [ ] Security rules updated

Once all items are checked, the payment infrastructure is fully operational!
