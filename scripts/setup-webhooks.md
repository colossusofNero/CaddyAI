# Stripe Webhook Setup Guide

This guide walks you through setting up Stripe webhooks for both local development and production.

---

## Option 1: Local Development (Stripe CLI) - RECOMMENDED FOR TESTING

### Step 1: Install Stripe CLI

**Windows (Using Scoop):**
```bash
scoop bucket add stripe https://github.com/stripe/scoop-stripe-cli.git
scoop install stripe
```

**Windows (Direct Download):**
1. Go to https://github.com/stripe/stripe-cli/releases/latest
2. Download `stripe_X.X.X_windows_x86_64.zip`
3. Extract and add to PATH

**Verify Installation:**
```bash
stripe --version
```

### Step 2: Login to Stripe
```bash
stripe login
```
- Opens browser to authenticate
- Confirms connection to your Stripe account

### Step 3: Start Webhook Forwarding
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

**Expected Output:**
```
> Ready! You are using Stripe API Version [2024-12-18]. Your webhook signing secret is whsec_xxxxxxxxxxxxxxxxxxxxx (^C to quit)
```

### Step 4: Copy Webhook Secret
Copy the `whsec_xxxxxxxxxxxxx` value and add to `.env.local`:
```bash
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

### Step 5: Restart Dev Server
```bash
npm run dev
```

### Step 6: Test Webhooks
In a new terminal, trigger a test event:
```bash
stripe trigger checkout.session.completed
```

You should see:
- Webhook received in dev server console
- Event processed successfully
- Firestore updated (check Firebase Console)

---

## Option 2: Production Webhooks (Deployed URL)

### Prerequisites
- Your site deployed to Vercel/production
- Production URL (e.g., https://caddyai.vercel.app)

### Step 1: Go to Stripe Dashboard
https://dashboard.stripe.com/webhooks

### Step 2: Click "Add Endpoint"

**Endpoint URL:**
```
https://your-production-domain.vercel.app/api/stripe/webhook
```

**Description:**
```
CaddyAI Production Webhook
```

### Step 3: Select Events to Listen For

Select these 6 critical events:
- ✅ `checkout.session.completed`
- ✅ `customer.subscription.created`
- ✅ `customer.subscription.updated`
- ✅ `customer.subscription.deleted`
- ✅ `invoice.paid`
- ✅ `invoice.payment_failed`

**OR** select all customer and checkout events (safer).

### Step 4: Save and Get Signing Secret

After creating, Stripe shows:
```
Signing secret: whsec_xxxxxxxxxxxxx
```

### Step 5: Add to Production Environment

**If using Vercel:**
```bash
vercel env add STRIPE_WEBHOOK_SECRET
# Paste: whsec_xxxxxxxxxxxxx
# Select: Production
```

**Or in Vercel Dashboard:**
1. Go to Project Settings > Environment Variables
2. Add `STRIPE_WEBHOOK_SECRET`
3. Value: `whsec_xxxxxxxxxxxxx`
4. Environment: Production
5. Redeploy

---

## Testing Your Webhook

### Test 1: Checkout Session Completed
1. Go to pricing page
2. Click "Start Pro Trial"
3. Complete test checkout
4. Check webhook was received

**Verify:**
- Check Stripe Dashboard > Webhooks > Events
- Check your server logs
- Check Firestore for subscription data

### Test 2: Subscription Events
```bash
# Using Stripe CLI
stripe trigger customer.subscription.created
stripe trigger customer.subscription.updated
stripe trigger customer.subscription.deleted
```

### Test 3: Invoice Events
```bash
stripe trigger invoice.paid
stripe trigger invoice.payment_failed
```

---

## Webhook Endpoint Details

**URL:** `/api/stripe/webhook`
**Method:** POST
**Content-Type:** application/json
**Signature Header:** `stripe-signature`

**Events Handled:**
1. `checkout.session.completed` → Create subscription in Firestore
2. `customer.subscription.created` → Initialize subscription
3. `customer.subscription.updated` → Sync changes
4. `customer.subscription.deleted` → Mark as canceled
5. `invoice.paid` → Confirm payment
6. `invoice.payment_failed` → Handle failed payment

---

## Troubleshooting

### Webhook Not Receiving Events

**Check 1: Signature Verification**
```
Error: No signatures found matching the expected signature for payload
```
→ STRIPE_WEBHOOK_SECRET is wrong or missing

**Check 2: URL Accessibility**
```
Error: Could not connect to endpoint
```
→ Server not running or URL incorrect

**Check 3: Event Types**
→ Make sure you selected the correct events in Stripe Dashboard

### Local Development Issues

**Issue: Stripe CLI not found**
```bash
# Reinstall or add to PATH
where stripe
```

**Issue: Login fails**
```bash
# Clear and re-login
stripe logout
stripe login
```

**Issue: Port conflict**
```bash
# Use different port
stripe listen --forward-to localhost:3001/api/stripe/webhook
```

---

## Production Checklist

- [ ] Webhook endpoint created in Stripe Dashboard
- [ ] Correct production URL configured
- [ ] All 6 events selected
- [ ] Signing secret added to environment variables
- [ ] Application redeployed after adding secret
- [ ] Test webhook with real checkout
- [ ] Verify events in Stripe Dashboard
- [ ] Check Firestore updates correctly

---

## Monitoring Webhooks

### Stripe Dashboard
https://dashboard.stripe.com/webhooks

View:
- Recent webhook attempts
- Success/failure rates
- Event payloads
- Retry attempts

### Your Application Logs
- Check server logs for webhook processing
- Verify Firestore updates
- Monitor error rates

---

## Security Notes

1. **Always verify webhook signatures** (already implemented)
2. **Use environment-specific secrets** (test vs live)
3. **Handle failed webhooks gracefully** (retry logic)
4. **Log webhook events** for debugging
5. **Don't expose webhook endpoint publicly** without signature verification

---

## Quick Start Command

For local development, just run:
```bash
stripe login && stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Then copy the `whsec_xxx` to `.env.local` and restart your dev server.

---

## Need Help?

- Stripe Webhooks Docs: https://stripe.com/docs/webhooks
- Stripe CLI Docs: https://stripe.com/docs/stripe-cli
- Test Events: https://stripe.com/docs/cli/trigger
