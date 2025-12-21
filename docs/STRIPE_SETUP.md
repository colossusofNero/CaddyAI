# Stripe Production Setup Guide

## Overview
CaddyAI uses Stripe for web-based subscription payments. This guide covers production setup.

## Prerequisites
- Stripe account (create at https://stripe.com)
- Access to Stripe Dashboard
- Domain name configured (e.g., caddyai.com)

---

## Step 1: Get Stripe API Keys

### 1.1 Access Stripe Dashboard
1. Go to https://dashboard.stripe.com
2. Switch to **Live Mode** (top right toggle - ensure it says "LIVE")

### 1.2 Get API Keys
1. Click **Developers** → **API Keys**
2. Copy your keys:
   - **Publishable key**: `pk_live_...`
   - **Secret key**: `sk_live_...` (click "Reveal live key")

### 1.3 Add to Environment Variables
Update your production `.env.production`:
```bash
# Stripe Keys (LIVE MODE)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxx
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxx

# Webhook Secret (get this in Step 2)
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

⚠️ **IMPORTANT**: Never commit secret keys to git!

---

## Step 2: Create Subscription Products

### 2.1 Create Pro Monthly Plan
1. Dashboard → **Products** → **Add Product**
2. Configure:
   - **Name**: CaddyAI Pro Monthly
   - **Description**: AI-powered golf recommendations, unlimited rounds, performance analytics
   - **Pricing Model**: Recurring
   - **Price**: $9.95 USD
   - **Billing Period**: Monthly
   - **Currency**: USD
3. Click **Save Product**
4. **Copy the Price ID**: `price_xxxxxxxxxxxxx`

### 2.2 Create Pro Annual Plan
1. Click **Add another price** on the same product
2. Configure:
   - **Price**: $79.60 USD
   - **Billing Period**: Yearly
   - **Currency**: USD
3. Click **Add price**
4. **Copy the Price ID**: `price_xxxxxxxxxxxxx`

### 2.3 Create Tour Monthly Plan (Optional)
1. **Add Product** → CaddyAI Tour Monthly
2. **Price**: $19.95 USD
3. **Billing Period**: Monthly

### 2.4 Create Tour Annual Plan (Optional)
1. Add price to Tour product
2. **Price**: $159.60 USD
3. **Billing Period**: Yearly

### 2.5 Update Price IDs in Code
Edit `lib/stripe.ts`:
```typescript
export const STRIPE_PRICE_IDS = {
  pro_monthly: 'price_xxxxxxxxxxxxx', // Replace with your IDs
  pro_annual: 'price_xxxxxxxxxxxxx',
  tour_monthly: 'price_xxxxxxxxxxxxx',
  tour_annual: 'price_xxxxxxxxxxxxx',
} as const;
```

---

## Step 3: Configure Webhooks

### 3.1 Create Webhook Endpoint
1. Dashboard → **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Configure:
   - **Endpoint URL**: `https://caddyai.com/api/stripe/webhook`
   - **Description**: CaddyAI Production Webhooks
   - **Version**: Latest API version

### 3.2 Select Events to Listen To
Select these events:
- ✅ `checkout.session.completed`
- ✅ `customer.subscription.created`
- ✅ `customer.subscription.updated`
- ✅ `customer.subscription.deleted`
- ✅ `invoice.paid`
- ✅ `invoice.payment_failed`

### 3.3 Get Webhook Secret
1. After creating endpoint, click to view details
2. Click **Reveal** under "Signing secret"
3. Copy the secret: `whsec_xxxxxxxxxxxxx`
4. Add to `.env.production`:
   ```bash
   STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
   ```

---

## Step 4: Configure Customer Portal

### 4.1 Enable Customer Portal
1. Dashboard → **Settings** → **Billing** → **Customer Portal**
2. Click **Activate test link** (if in test mode) or configure directly

### 4.2 Configure Portal Settings
- ✅ **Allow customers to**:
  - Update payment methods
  - View invoices
  - Cancel subscriptions
  - Switch plans
- ✅ **Cancellation behavior**: Cancel at end of billing period
- ✅ **Invoice history**: Show all invoices

### 4.3 Customize Branding
- Upload CaddyAI logo
- Set brand color: `#0D47A1` (Navy Blue)
- Add support email
- Add terms of service URL

---

## Step 5: Test the Integration

### 5.1 Test Checkout Flow
1. Visit https://caddyai.com/pricing
2. Click "Start Pro Trial"
3. Use Stripe test card: `4242 4242 4242 4242`
4. Expiry: Any future date
5. CVC: Any 3 digits
6. Verify redirect to success page

### 5.2 Test Webhook Delivery
1. Dashboard → **Developers** → **Webhooks** → Your endpoint
2. Check **Recent events** tab
3. Verify all events show "Succeeded"
4. If failed, check logs: `stripe logs tail`

### 5.3 Test Customer Portal
1. Create a test subscription
2. Visit `/settings/subscription`
3. Click "Manage Subscription"
4. Verify you can:
   - Update payment method
   - View invoices
   - Cancel subscription

---

## Step 6: Enable Live Mode

### 6.1 Switch to Live Mode
1. Toggle **Test Mode** → **Live Mode** (top right)
2. Repeat Steps 1-4 with live keys

### 6.2 Deploy to Production
```bash
# Set environment variables in Vercel/hosting
vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
vercel env add STRIPE_SECRET_KEY
vercel env add STRIPE_WEBHOOK_SECRET

# Deploy
vercel --prod
```

### 6.3 Verify Production Webhooks
1. Make a real purchase (or use live test mode)
2. Check webhook logs in Stripe Dashboard
3. Verify subscription appears in Firebase

---

## Step 7: Tax and Compliance

### 7.1 Enable Stripe Tax (Recommended)
1. Dashboard → **Products** → **Tax**
2. Click **Enable Stripe Tax**
3. Configure tax collection for your jurisdictions
4. Stripe automatically calculates and collects sales tax

### 7.2 Configure Invoicing
1. Dashboard → **Settings** → **Invoices**
2. Enable:
   - ✅ Email invoices automatically
   - ✅ Include tax breakdown
   - ✅ Add business information

### 7.3 Set Up Billing Reminders
1. Dashboard → **Settings** → **Billing** → **Subscriptions**
2. Enable:
   - ✅ Payment retry schedule (3 attempts)
   - ✅ Email customer before renewal
   - ✅ Send receipt after successful payment

---

## Security Best Practices

### ✅ DO:
- Use environment variables for all secrets
- Enable Stripe's fraud detection (Radar)
- Set up 2FA on Stripe account
- Monitor webhook logs regularly
- Use HTTPS for all endpoints
- Validate webhook signatures

### ❌ DON'T:
- Commit API keys to git
- Share secret keys in Slack/email
- Use test keys in production
- Disable webhook signature verification
- Store card details yourself (let Stripe handle it)

---

## Monitoring and Alerts

### Set Up Email Alerts
1. Dashboard → **Settings** → **Notifications**
2. Enable alerts for:
   - ✅ Failed payments
   - ✅ Dispute opened
   - ✅ High refund rate
   - ✅ Webhook endpoint down

### Monitor Key Metrics
Track in Stripe Dashboard:
- Monthly Recurring Revenue (MRR)
- Churn rate
- Failed payment rate
- Customer lifetime value (LTV)

---

## Troubleshooting

### Webhook Not Receiving Events
1. Check endpoint URL is correct and accessible
2. Verify webhook secret matches `.env`
3. Check server logs for errors
4. Use Stripe CLI to test locally:
   ```bash
   stripe listen --forward-to localhost:3005/api/stripe/webhook
   ```

### Checkout Not Redirecting
1. Verify `successUrl` and `cancelUrl` are correct
2. Check browser console for errors
3. Ensure Stripe publishable key is set

### Subscription Not Syncing to Firebase
1. Check webhook logs in Stripe Dashboard
2. Verify Firebase credentials are correct
3. Check server logs: `vercel logs`
4. Manually trigger webhook resend in Stripe

---

## Support

- **Stripe Docs**: https://stripe.com/docs
- **Stripe Support**: https://support.stripe.com
- **CaddyAI Issues**: Create issue in GitHub repo

---

## Checklist

Before going live:
- [ ] Live API keys configured
- [ ] Products and prices created
- [ ] Webhooks configured and tested
- [ ] Customer portal enabled
- [ ] Tax collection enabled
- [ ] Email notifications configured
- [ ] Test complete checkout flow
- [ ] Monitor webhooks for 24 hours
- [ ] Set up billing alerts
- [ ] Document emergency procedures
