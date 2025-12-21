# Google Play Billing Setup Guide

## Overview
Configure Google Play In-App Billing for CaddyAI Android app subscriptions.

**Pricing:**
- Monthly: $9.95/month
- Annual: $79.60/year (Best for seasonal golfers)

**Google's Cut:** 30% first year, 15% after subscriber's first year

---

## Prerequisites
- Google Play Console account ($25 one-time registration)
- Android app published or in testing
- Package name configured (e.g., com.caddyai.app)
- Google Cloud project linked

---

## Step 1: Google Play Console Setup

### 1.1 Create App in Play Console
1. Go to https://play.google.com/console
2. Click **Create app**
3. Fill in:
   - **App name**: CaddyAI - Golf AI Caddie
   - **Default language**: English (United States)
   - **App or game**: App
   - **Free or paid**: Free (with in-app purchases)
   - **Package name**: com.caddyai.app

### 1.2 Complete Store Listing
- **Category**: Sports
- **Short description**: AI-powered golf caddie with smart club recommendations
- **Full description**: [Your marketing copy]
- **App icon**: 512×512px
- **Screenshots**: At least 2 phone screenshots

---

## Step 2: Create Subscription Products

### 2.1 Navigate to Monetization
1. Play Console → Your App → **Monetize** → **Subscriptions**
2. Click **Create subscription**

### 2.2 Create Pro Monthly Subscription
**Product details:**
- **Product ID**: `pro_monthly`
- **Name**: CaddyAI Pro Monthly
- **Description**:
  ```
  AI-powered golf recommendations, unlimited rounds, performance analytics, and more. Cancel anytime.
  ```

**Pricing:**
1. Click **Set price**
2. Select pricing template or set custom:
   - **United States**: $9.95
3. Google automatically converts to other currencies
4. Save pricing

**Subscription benefits:**
- Add benefits that appear in Google Play
- Example: "AI club recommendations", "Unlimited rounds", "Performance analytics"

**Billing period:**
- Duration: **1 month**
- Renewal type: Auto-renewing

**Free trial:**
- Enable: ✅ Yes
- Duration: 14 days

**Grace period:**
- Enable: ✅ Yes (3 days recommended)
- Allows users to fix payment issues without losing access

**Account hold:**
- Enable: ✅ Yes (30 days recommended)
- Pause subscription on payment failure

### 2.3 Create Pro Annual Subscription
**Product details:**
- **Product ID**: `pro_annual`
- **Name**: CaddyAI Pro Annual
- **Description**:
  ```
  Best for seasonal golfers! Save 33% with annual billing. Includes:
  • AI-powered club recommendations
  • Unlimited rounds & clubs
  • Performance analytics
  • Real-time weather & elevation
  • Shot dispersion tracking
  • Priority support

  Perfect if you can only golf 8 months/year. Cancel anytime and reactivate next season.
  ```

**Pricing:**
- **United States**: $79.60
- Select "Yearly" price point or set custom

**Billing period:**
- Duration: **1 year**
- Renewal type: Auto-renewing

**Free trial:**
- Enable: ✅ Yes
- Duration: 14 days

### 2.4 Create Tour Plans (Optional)
Repeat for Tour tier:
- `tour_monthly`: $19.95/month
- `tour_annual`: $159.60/year

### 2.5 Base Plans and Offers
Google Play uses "Base Plans" with optional "Offers":

**Base Plan** = Default subscription (e.g., $9.95/month)
**Offers** = Promotional pricing (e.g., $4.99 first month)

Configure base plans as primary pricing, add offers later for promotions.

---

## Step 3: Configure Subscription Settings

### 3.1 Enable Upgrade/Downgrade
1. Subscriptions → **Subscription management**
2. Enable **User can upgrade or downgrade**
3. Set hierarchy:
   ```
   Pro Monthly ($9.95/mo) → Tour Monthly ($19.95/mo)
   Pro Annual ($79.60/yr) → Tour Annual ($159.60/yr)
   ```

### 3.2 Proration Settings
- **Upgrade**: Charge prorated amount immediately
- **Downgrade**: Apply at next billing cycle
- **Crossgrade** (monthly ↔ annual): No refund, switch at renewal

### 3.3 Cancellation Survey
- Enable cancellation survey
- Ask why users cancel
- Use feedback to improve retention

---

## Step 4: Test with Google Play Billing

### 4.1 Create License Testers
1. Play Console → **Setup** → **License testing**
2. Add test accounts:
   - Email: yourname+test1@gmail.com
   - Email: yourname+test2@gmail.com
3. Save changes

### 4.2 Configure Test Purchases
**License test response:**
- Select **RESPOND_NORMALLY** (process as real purchases but no charge)

**Test card:**
- Google provides automatic test cards for license testers
- Purchases complete instantly
- No actual charges

### 4.3 Internal Testing Track
1. Create **Internal testing** release
2. Add testers via email list
3. Upload APK/AAB with billing library integrated
4. Testers install from Play Store link

---

## Step 5: Implement in React Native

### 5.1 Install Dependencies
```bash
npm install react-native-iap
cd android && ./gradlew clean && cd ..
```

### 5.2 Configure Android Manifest
**File:** `android/app/src/main/AndroidManifest.xml`
```xml
<manifest>
  <uses-permission android:name="com.android.vending.BILLING" />

  <application>
    <!-- Your existing config -->
  </application>
</manifest>
```

### 5.3 Implement Billing Code

**Create Billing Service** (`services/googlePlayBilling.ts`):
```typescript
import {
  initConnection,
  getSubscriptions,
  requestSubscription,
  finishTransaction,
  purchaseErrorListener,
  purchaseUpdatedListener,
  flushFailedPurchasesCachedAsPendingAndroid,
  type Subscription,
  type Purchase,
  type PurchaseError,
} from 'react-native-iap';

const PRODUCT_IDS = {
  PRO_MONTHLY: 'pro_monthly',
  PRO_ANNUAL: 'pro_annual',
  TOUR_MONTHLY: 'tour_monthly',
  TOUR_ANNUAL: 'tour_annual',
};

export class GooglePlayBillingService {
  private purchaseUpdateSubscription: any;
  private purchaseErrorSubscription: any;

  async initialize() {
    try {
      await initConnection();
      console.log('[Billing] Connection initialized');

      // Clear any pending purchases from cache
      await flushFailedPurchasesCachedAsPendingAndroid();

      // Set up listeners
      this.purchaseUpdateSubscription = purchaseUpdatedListener(
        async (purchase: Purchase) => {
          const { purchaseToken, productId } = purchase;

          try {
            // Verify purchase with Google
            const isValid = await this.verifyPurchaseOnServer(purchase);

            if (isValid) {
              // Grant access to subscription
              await this.activateSubscription(purchase);

              // Acknowledge the purchase (required for subscriptions)
              await finishTransaction({ purchase, isConsumable: false });
              console.log('[Billing] Purchase acknowledged:', productId);
            } else {
              console.error('[Billing] Purchase verification failed');
            }
          } catch (error) {
            console.error('[Billing] Error processing purchase:', error);
          }
        }
      );

      this.purchaseErrorSubscription = purchaseErrorListener(
        (error: PurchaseError) => {
          console.warn('[Billing] Purchase error:', error);
        }
      );
    } catch (error) {
      console.error('[Billing] Initialization error:', error);
    }
  }

  async getAvailableSubscriptions(): Promise<Subscription[]> {
    try {
      const products = await getSubscriptions({
        skus: Object.values(PRODUCT_IDS),
      });
      return products;
    } catch (error) {
      console.error('[Billing] Error fetching products:', error);
      return [];
    }
  }

  async subscribe(productId: string) {
    try {
      await requestSubscription({
        sku: productId,
        // Optional: add obfuscated account ID for fraud prevention
        obfuscatedAccountIdAndroid: 'USER_ID_HERE',
      });
    } catch (error) {
      console.error('[Billing] Subscription error:', error);
      throw error;
    }
  }

  private async verifyPurchaseOnServer(purchase: Purchase): Promise<boolean> {
    // Send to your backend for verification
    const response = await fetch('/api/google/validate-purchase', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        purchaseToken: purchase.purchaseToken,
        productId: purchase.productId,
        userId: 'CURRENT_USER_ID', // Get from auth
      }),
    });

    if (!response.ok) {
      throw new Error('Purchase verification failed');
    }

    const result = await response.json();
    return result.valid === true;
  }

  private async activateSubscription(purchase: Purchase) {
    // Update Firebase with subscription status
    const firestore = getFirestore();
    const userId = 'CURRENT_USER_ID'; // Get from auth

    await setDoc(doc(firestore, 'subscriptions', userId), {
      platform: 'google',
      productId: purchase.productId,
      purchaseToken: purchase.purchaseToken,
      transactionId: purchase.transactionId,
      transactionDate: purchase.transactionDate,
      plan: purchase.productId.includes('tour') ? 'tour' : 'pro',
      billingPeriod: purchase.productId.includes('annual') ? 'annual' : 'monthly',
      status: 'active',
      googlePurchaseToken: purchase.purchaseToken,
      updatedAt: Date.now(),
    });
  }

  cleanup() {
    if (this.purchaseUpdateSubscription) {
      this.purchaseUpdateSubscription.remove();
    }
    if (this.purchaseErrorSubscription) {
      this.purchaseErrorSubscription.remove();
    }
  }
}

export const googlePlayBilling = new GooglePlayBillingService();
```

---

## Step 6: Server-Side Purchase Verification

### 6.1 Get Service Account Credentials
1. Google Cloud Console → Your Project
2. **IAM & Admin** → **Service Accounts**
3. Create service account:
   - Name: "CaddyAI Billing Verification"
   - Role: None needed (API access only)
4. Create JSON key → Download `service-account.json`
5. Store securely, never commit to git

### 6.2 Enable Google Play Developer API
1. Google Cloud Console → **APIs & Services**
2. Click **Enable APIs and Services**
3. Search "Google Play Developer API"
4. Click **Enable**

### 6.3 Grant API Access
1. Play Console → **Setup** → **API access**
2. Link Cloud project (if not linked)
3. Find your service account
4. Click **Grant access**
5. Permissions needed:
   - ✅ View financial data
   - ✅ Manage orders and subscriptions

### 6.4 Create Verification API Route
**File:** `app/api/google/validate-purchase/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

// Load service account credentials
const serviceAccount = JSON.parse(
  process.env.GOOGLE_SERVICE_ACCOUNT_JSON || '{}'
);

const auth = new google.auth.GoogleAuth({
  credentials: serviceAccount,
  scopes: ['https://www.googleapis.com/auth/androidpublisher'],
});

const androidPublisher = google.androidpublisher({
  version: 'v3',
  auth,
});

export async function POST(request: NextRequest) {
  try {
    const { purchaseToken, productId, userId } = await request.json();

    if (!purchaseToken || !productId || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const packageName = 'com.caddyai.app'; // Your package name

    // Verify subscription purchase with Google
    const result = await androidPublisher.purchases.subscriptions.get({
      packageName,
      subscriptionId: productId,
      token: purchaseToken,
    });

    const purchase = result.data;

    // Check if subscription is valid
    if (purchase.paymentState === 1 && purchase.expiryTimeMillis) {
      const expiryTime = parseInt(purchase.expiryTimeMillis);
      const isActive = expiryTime > Date.now();

      if (isActive) {
        // Store in Firebase (implement your logic)
        // ...

        return NextResponse.json({
          valid: true,
          expiryTime,
          autoRenewing: purchase.autoRenewing,
        });
      }
    }

    return NextResponse.json({ valid: false }, { status: 400 });
  } catch (error: any) {
    console.error('[Google Billing] Verification error:', error);
    return NextResponse.json(
      { error: 'Verification failed', details: error.message },
      { status: 500 }
    );
  }
}
```

### 6.5 Environment Variables
Add to `.env.local`:
```bash
# Google Play Billing
GOOGLE_SERVICE_ACCOUNT_JSON='{"type":"service_account","project_id":"...","private_key":"..."}'
GOOGLE_PACKAGE_NAME=com.caddyai.app
```

⚠️ **IMPORTANT**: Never commit service account JSON to git!

---

## Step 7: Real-Time Developer Notifications (RTDN)

### 7.1 Configure Cloud Pub/Sub
1. Google Cloud Console → **Pub/Sub**
2. Click **Create Topic**
3. Topic ID: `google-play-subscriptions`
4. Create topic

### 7.2 Grant Publishing Permission
1. Select your topic
2. Click **Permissions**
3. Add principal: `google-play-developer-notifications@system.gserviceaccount.com`
4. Role: **Pub/Sub Publisher**
5. Save

### 7.3 Configure in Play Console
1. Play Console → **Monetize** → **Monetization setup**
2. Scroll to **Real-time developer notifications**
3. Topic name: `projects/YOUR_PROJECT_ID/topics/google-play-subscriptions`
4. Save

### 7.4 Create Webhook Handler
**File:** `app/api/google/webhook/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Pub/Sub wraps the message
    const message = body.message;
    if (!message || !message.data) {
      return NextResponse.json({ received: false }, { status: 400 });
    }

    // Decode base64 message data
    const decodedData = Buffer.from(message.data, 'base64').toString('utf-8');
    const notification = JSON.parse(decodedData);

    console.log('[Google Webhook] Received:', notification);

    // Handle different notification types
    if (notification.subscriptionNotification) {
      const subNotification = notification.subscriptionNotification;
      const { notificationType, purchaseToken, subscriptionId } = subNotification;

      switch (notificationType) {
        case 1: // SUBSCRIPTION_RECOVERED
          await handleSubscriptionRecovered(purchaseToken, subscriptionId);
          break;
        case 2: // SUBSCRIPTION_RENEWED
          await handleSubscriptionRenewed(purchaseToken, subscriptionId);
          break;
        case 3: // SUBSCRIPTION_CANCELED
          await handleSubscriptionCanceled(purchaseToken, subscriptionId);
          break;
        case 4: // SUBSCRIPTION_PURCHASED
          await handleSubscriptionPurchased(purchaseToken, subscriptionId);
          break;
        case 5: // SUBSCRIPTION_ON_HOLD
          await handleSubscriptionOnHold(purchaseToken, subscriptionId);
          break;
        case 6: // SUBSCRIPTION_IN_GRACE_PERIOD
          await handleSubscriptionGracePeriod(purchaseToken, subscriptionId);
          break;
        case 7: // SUBSCRIPTION_RESTARTED
          await handleSubscriptionRestarted(purchaseToken, subscriptionId);
          break;
        case 10: // SUBSCRIPTION_EXPIRED
          await handleSubscriptionExpired(purchaseToken, subscriptionId);
          break;
        case 12: // SUBSCRIPTION_REVOKED
          await handleSubscriptionRevoked(purchaseToken, subscriptionId);
          break;
        case 13: // SUBSCRIPTION_PAUSED
          await handleSubscriptionPaused(purchaseToken, subscriptionId);
          break;
        default:
          console.warn('[Google Webhook] Unknown notification type:', notificationType);
      }
    }

    // Always acknowledge receipt
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[Google Webhook] Error:', error);
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }
}

async function handleSubscriptionRenewed(purchaseToken: string, subscriptionId: string) {
  // Update Firebase subscription status to 'active'
  console.log('[Webhook] Subscription renewed:', subscriptionId);
  // Implement Firebase update
}

async function handleSubscriptionCanceled(purchaseToken: string, subscriptionId: string) {
  // Update Firebase subscription status to 'canceled'
  console.log('[Webhook] Subscription canceled:', subscriptionId);
  // User still has access until expiry
}

async function handleSubscriptionExpired(purchaseToken: string, subscriptionId: string) {
  // Update Firebase subscription status to 'expired'
  console.log('[Webhook] Subscription expired:', subscriptionId);
  // Remove user access
}

async function handleSubscriptionPurchased(purchaseToken: string, subscriptionId: string) {
  // New subscription - verify and activate
  console.log('[Webhook] New subscription:', subscriptionId);
}

async function handleSubscriptionGracePeriod(purchaseToken: string, subscriptionId: string) {
  // Payment failed but user still has access
  console.log('[Webhook] Grace period:', subscriptionId);
  // Send email to update payment method
}

async function handleSubscriptionOnHold(purchaseToken: string, subscriptionId: string) {
  // Account on hold due to payment failure
  console.log('[Webhook] On hold:', subscriptionId);
  // User loses access, can still be recovered
}

async function handleSubscriptionRecovered(purchaseToken: string, subscriptionId: string) {
  // User fixed payment issue
  console.log('[Webhook] Recovered:', subscriptionId);
  // Restore access
}

async function handleSubscriptionRestarted(purchaseToken: string, subscriptionId: string) {
  // User resubscribed after cancellation
  console.log('[Webhook] Restarted:', subscriptionId);
}

async function handleSubscriptionPaused(purchaseToken: string, subscriptionId: string) {
  // User paused subscription (if enabled)
  console.log('[Webhook] Paused:', subscriptionId);
}

async function handleSubscriptionRevoked(purchaseToken: string, subscriptionId: string) {
  // Refunded by Google (fraud, etc.)
  console.log('[Webhook] Revoked:', subscriptionId);
  // Immediately remove access
}
```

### 7.5 Create Pub/Sub Pull Subscription (Alternative to Webhook)
If you prefer pull-based approach:

```typescript
import { PubSub } from '@google-cloud/pubsub';

const pubSubClient = new PubSub({
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
  credentials: serviceAccount,
});

async function listenForMessages() {
  const subscriptionName = 'google-play-notifications-sub';
  const subscription = pubSubClient.subscription(subscriptionName);

  const messageHandler = (message: any) => {
    const data = Buffer.from(message.data, 'base64').toString('utf-8');
    const notification = JSON.parse(data);

    // Process notification
    console.log('Received notification:', notification);

    // Acknowledge message
    message.ack();
  };

  subscription.on('message', messageHandler);
}
```

---

## Step 8: Testing Checklist

### 8.1 Test Subscription Purchase
1. Build and install app on test device
2. Sign in with license tester account
3. Navigate to subscription screen
4. Purchase Pro Monthly ($9.95)
5. Verify:
   - Purchase completes successfully
   - No actual charge
   - Subscription appears in Google Play account
   - App grants Pro access

### 8.2 Test Server Verification
1. After purchase, check server logs
2. Verify API call to Google Play Developer API
3. Confirm valid response with expiry time
4. Check Firebase subscription document created

### 8.3 Test Webhooks
1. Make test purchase
2. Check webhook endpoint logs
3. Verify SUBSCRIPTION_PURCHASED notification received
4. Wait 5 minutes, trigger subscription renewal (in test mode)
5. Verify SUBSCRIPTION_RENEWED notification

### 8.4 Test Cancellation
1. Open Google Play Store
2. Account → Subscriptions
3. Cancel CaddyAI subscription
4. Verify:
   - App still has access until expiry
   - Webhook receives SUBSCRIPTION_CANCELED
   - Firebase updated correctly

### 8.5 Test Grace Period
1. Purchase subscription with test card
2. Let it auto-renew
3. Remove payment method or let it fail
4. Verify:
   - Grace period notification received
   - User retains access during grace period
   - After grace period, account on hold

---

## Step 9: Submit for Review

### 9.1 Prepare App for Release
- Complete all required store listing sections
- Add privacy policy URL
- Add app screenshots showing subscription features
- Complete content rating questionnaire

### 9.2 Internal Testing
1. Create **Internal testing** release
2. Upload signed APK/AAB
3. Test with all license testers
4. Verify subscriptions work end-to-end

### 9.3 Closed Testing (Alpha)
1. Create **Closed testing** track
2. Add 20-50 testers via email list
3. Collect feedback on subscription flow
4. Fix any reported issues

### 9.4 Open Testing (Beta)
1. Create **Open testing** track
2. Make available to broader audience
3. Monitor crash reports and ANRs
4. Monitor subscription metrics

### 9.5 Production Release
1. Create **Production** release
2. Choose rollout percentage (start with 10%)
3. Gradually increase to 100%
4. Monitor subscription metrics

---

## Best Practices

### ✅ DO:
- Always verify purchases on your server
- Handle subscription lifecycle events via RTDN
- Implement grace period and account hold
- Test thoroughly with license testers
- Monitor subscription metrics in Play Console
- Provide clear cancellation instructions
- Handle pending purchases on app start
- Use obfuscated account IDs for fraud prevention

### ❌ DON'T:
- Trust client-side subscription status alone
- Store service account credentials in app
- Skip server-side purchase verification
- Ignore RTDN notifications
- Grant immediate access without verification
- Forget to acknowledge purchases (required for subscriptions)
- Use real payment methods for testing

---

## Monitoring and Analytics

### Play Console Metrics
1. **Monetize** → **Subscriptions**
2. View metrics:
   - New subscribers
   - Active subscribers
   - Canceled subscribers
   - Retention rate
   - Average revenue per user (ARPU)

### Key Metrics to Track
- Subscription starts (new purchases)
- Renewal rate
- Cancellation rate
- Churn rate
- Revenue (remember 30% → 15% after year 1)
- Grace period recovery rate
- Failed payment rate

### Custom Analytics
Track in Firebase Analytics:
```typescript
import analytics from '@react-native-firebase/analytics';

// Track subscription start
await analytics().logEvent('subscription_started', {
  product_id: 'pro_monthly',
  price: 9.95,
  currency: 'USD',
});

// Track cancellation
await analytics().logEvent('subscription_canceled', {
  product_id: 'pro_monthly',
  reason: 'user_cancelled',
});
```

---

## Troubleshooting

### Products Not Loading
**Problem**: `getSubscriptions()` returns empty array
**Solutions**:
- Verify product IDs match exactly in Play Console
- Ensure app is published to Internal/Closed/Open testing track
- Products must be "Active" in Play Console
- Clear Play Store cache on device
- Wait up to 24 hours after creating products

### Purchase Verification Failing
**Problem**: Server cannot verify purchase token
**Solutions**:
- Check service account JSON is valid
- Verify Google Play Developer API is enabled
- Ensure service account has proper permissions in Play Console
- Check package name matches exactly
- Verify purchase token is not expired

### Webhooks Not Receiving Events
**Problem**: RTDN notifications not arriving
**Solutions**:
- Verify Pub/Sub topic is correctly configured
- Check service account has Pub/Sub Publisher role
- Ensure topic name in Play Console is correct format
- Check webhook endpoint is publicly accessible
- Verify webhook returns 200 OK response
- Check Cloud Logging for Pub/Sub errors

### "Item Already Owned" Error
**Problem**: User tries to purchase but already owns subscription
**Solutions**:
- Check existing subscriptions on app start
- Call `flushFailedPurchasesCachedAsPendingAndroid()` on init
- Verify previous purchase was acknowledged
- Use Play Console to manually cancel test subscriptions

### Subscription Not Syncing
**Problem**: Purchase completes but app doesn't grant access
**Solutions**:
- Check `purchaseUpdatedListener` is registered
- Verify Firebase write permissions
- Check server verification endpoint is working
- Ensure `finishTransaction()` is called
- Check subscription document in Firebase

---

## Support Resources

- **Google Play Billing Docs**: https://developer.android.com/google/play/billing
- **react-native-iap**: https://github.com/dooboolab-community/react-native-iap
- **Google Play Developer API**: https://developers.google.com/android-publisher
- **Pub/Sub Docs**: https://cloud.google.com/pubsub/docs

---

## Production Checklist

Before launching subscriptions:
- [ ] Products created and active in Play Console
- [ ] Service account credentials configured
- [ ] Google Play Developer API enabled
- [ ] Server verification endpoint tested
- [ ] RTDN webhook configured and tested
- [ ] Grace period and account hold enabled
- [ ] Subscription benefits clearly displayed
- [ ] Cancellation instructions provided
- [ ] License testing completed successfully
- [ ] Internal testing completed
- [ ] Closed/open testing completed
- [ ] Analytics tracking implemented
- [ ] Error monitoring set up
- [ ] App published to production

---

## Seasonal Golfer Messaging

Make sure to highlight in your app:

**Marketing Copy:**
```
Perfect for Seasonal Golfers! ⛳

Can't golf 4 months a year? No problem!

• Subscribe monthly for $9.95/month
• Cancel when courses close (Oct/Nov)
• Reactivate when they open (Mar/Apr)
• Pay only for the months you golf
• All your data stays safe year-round

Golf 8 months? Pay $79.60 instead of $119.40
Save $39.80 per year! 💰
```

Display this on:
- Subscription selection screen
- Settings page
- Post-signup onboarding
- Seasonal email campaigns

---

**Next Steps**: After completing setup, test the complete subscription flow from purchase to renewal to cancellation. Monitor metrics in the first week to catch any issues early.
