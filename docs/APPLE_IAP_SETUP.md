# Apple In-App Purchase (IAP) Setup Guide

## Overview
Configure Apple In-App Purchases for CaddyAI iOS app subscriptions.

**Pricing:**
- Monthly: $9.95/month
- Annual: $79.60/year (Best for seasonal golfers)

**Apple's Cut:** 30% first year, 15% after subscriber's first year

---

## Prerequisites
- Apple Developer Account ($99/year)
- App Store Connect access
- iOS app bundle ID configured
- Xcode project set up

---

## Step 1: Configure App Store Connect

### 1.1 Create App Record
1. Go to https://appstoreconnect.apple.com
2. Click **My Apps** → **+** → **New App**
3. Fill in:
   - **Platform**: iOS
   - **Name**: CaddyAI - Golf AI Caddie
   - **Bundle ID**: com.caddyai.app (your bundle ID)
   - **SKU**: CADDYAI-IOS
   - **User Access**: Full Access

### 1.2 Add App Information
- **Category**: Sports
- **Subcategory**: Golf
- **Age Rating**: 4+
- **App Icon**: 1024×1024px

---

## Step 2: Create In-App Purchase Products

### 2.1 Navigate to IAP Section
1. App Store Connect → Your App → **In-App Purchases**
2. Click **+** to create new IAP

### 2.2 Create Pro Monthly Subscription
1. **Type**: Auto-Renewable Subscription
2. **Product ID**: `com.caddyai.pro.monthly`
3. **Reference Name**: CaddyAI Pro Monthly
4. **Subscription Group**: Create new → "CaddyAI Pro Subscriptions"
5. Click **Create**

### 2.3 Configure Subscription Details
**Subscription Duration:**
- Duration: 1 month

**Subscription Prices:**
- United States: **$9.95** (select from price matrix)
- Canada: $12.95 CAD
- United Kingdom: £9.49
- Europe: €10.49
- (Apple handles currency conversion)

**Localizations:**
- **Display Name (English-US)**: CaddyAI Pro
- **Description**: AI-powered golf recommendations, unlimited rounds, performance analytics, and more. Cancel anytime.

**Review Screenshot:**
- Upload screenshot showing subscription benefits (1242×2208px)

### 2.4 Create Pro Annual Subscription
1. **Product ID**: `com.caddyai.pro.annual`
2. **Reference Name**: CaddyAI Pro Annual
3. **Subscription Group**: Same as monthly
4. **Duration**: 1 year
5. **Price**: **$79.60** (select custom price or closest tier)

**Description:**
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

### 2.5 Configure Subscription Features (iOS 15+)
- **Free Trial**: 14 days (optional)
- **Introductory Offer**: None (or add later)
- **Promotional Offers**: Configure win-back offers

---

## Step 3: Subscription Group Configuration

### 3.1 Set Subscription Hierarchy
```
CaddyAI Pro Subscriptions (Group)
├── Pro Monthly ($9.95/mo) - Level 1
└── Pro Annual ($79.60/yr) - Level 1
```

### 3.2 Enable Crossgrade
- Allow users to switch between monthly and annual
- No refund for remaining time (Apple standard)

---

## Step 4: Test with Sandbox

### 4.1 Create Sandbox Test Users
1. App Store Connect → **Users and Access** → **Sandbox Testers**
2. Click **+** to add tester
3. Create test accounts:
   - Email: test1@caddyai.com (use + addressing: yourname+test1@gmail.com)
   - Password: Strong password
   - Country: United States

### 4.2 Enable StoreKit Testing in Xcode
1. Product → Scheme → Edit Scheme
2. Run → Options → StoreKit Configuration
3. Select your StoreKit configuration file

### 4.3 Test Subscription Flow
1. Run app on simulator/device
2. Trigger subscription purchase
3. Sign in with sandbox test account
4. Verify purchase completes
5. Check subscription appears in app

---

## Step 5: Implement in React Native

### 5.1 Install Dependencies
```bash
npm install react-native-iap
cd ios && pod install && cd ..
```

### 5.2 Configure Xcode Capabilities
1. Open `ios/CaddyAI.xcworkspace` in Xcode
2. Select your target → **Signing & Capabilities**
3. Click **+ Capability** → **In-App Purchase**

### 5.3 Implement IAP Code

**Create IAP Service** (`services/appleIAP.ts`):
```typescript
import {
  initConnection,
  getProducts,
  requestSubscription,
  getSubscriptions,
  finishTransaction,
  purchaseErrorListener,
  purchaseUpdatedListener,
  type Subscription,
  type SubscriptionPurchase,
  type Purchase,
  type PurchaseError
} from 'react-native-iap';

const PRODUCT_IDS = {
  PRO_MONTHLY: 'com.caddyai.pro.monthly',
  PRO_ANNUAL: 'com.caddyai.pro.annual',
};

export class AppleIAPService {
  private purchaseUpdateSubscription: any;
  private purchaseErrorSubscription: any;

  async initialize() {
    try {
      await initConnection();
      console.log('[IAP] Connection initialized');

      // Set up listeners
      this.purchaseUpdateSubscription = purchaseUpdatedListener(
        async (purchase: Purchase) => {
          const receipt = purchase.transactionReceipt;
          if (receipt) {
            try {
              // Send receipt to your server for validation
              await this.validateReceiptOnServer(receipt, purchase);

              // Grant access to subscription
              await this.activateSubscription(purchase);

              // Finish transaction
              await finishTransaction({ purchase });
            } catch (error) {
              console.error('[IAP] Error processing purchase:', error);
            }
          }
        }
      );

      this.purchaseErrorSubscription = purchaseErrorListener(
        (error: PurchaseError) => {
          console.warn('[IAP] Purchase error:', error);
        }
      );
    } catch (error) {
      console.error('[IAP] Initialization error:', error);
    }
  }

  async getAvailableSubscriptions(): Promise<Subscription[]> {
    try {
      const products = await getSubscriptions({
        skus: [PRODUCT_IDS.PRO_MONTHLY, PRODUCT_IDS.PRO_ANNUAL],
      });
      return products;
    } catch (error) {
      console.error('[IAP] Error fetching products:', error);
      return [];
    }
  }

  async subscribe(productId: string) {
    try {
      await requestSubscription({ sku: productId });
    } catch (error) {
      console.error('[IAP] Subscription error:', error);
      throw error;
    }
  }

  private async validateReceiptOnServer(
    receipt: string,
    purchase: Purchase
  ) {
    // Send to your backend for verification
    const response = await fetch('/api/apple/validate-receipt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        receipt,
        productId: purchase.productId,
        userId: 'CURRENT_USER_ID', // Get from auth
      }),
    });

    if (!response.ok) {
      throw new Error('Receipt validation failed');
    }

    return response.json();
  }

  private async activateSubscription(purchase: Purchase) {
    // Update Firebase with subscription status
    const firestore = getFirestore();
    const userId = 'CURRENT_USER_ID'; // Get from auth

    await setDoc(doc(firestore, 'subscriptions', userId), {
      platform: 'apple',
      productId: purchase.productId,
      transactionId: purchase.transactionId,
      transactionDate: purchase.transactionDate,
      plan: purchase.productId.includes('annual') ? 'pro' : 'pro',
      billingPeriod: purchase.productId.includes('annual') ? 'annual' : 'monthly',
      status: 'active',
      appleReceiptData: purchase.transactionReceipt,
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

export const appleIAP = new AppleIAPService();
```

---

## Step 6: Server-Side Receipt Validation

### 6.1 Create Validation API Route
**File:** `app/api/apple/validate-receipt/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';

const APPLE_VERIFY_RECEIPT_URL_PRODUCTION = 'https://buy.itunes.apple.com/verifyReceipt';
const APPLE_VERIFY_RECEIPT_URL_SANDBOX = 'https://sandbox.itunes.apple.com/verifyReceipt';

export async function POST(request: NextRequest) {
  try {
    const { receipt, productId, userId } = await request.json();

    if (!receipt || !userId) {
      return NextResponse.json(
        { error: 'Missing receipt or userId' },
        { status: 400 }
      );
    }

    // Verify with Apple (try production first, then sandbox)
    const response = await verifyReceiptWithApple(receipt);

    if (response.status === 0) {
      // Receipt is valid - update subscription in Firebase
      const latestReceiptInfo = response.latest_receipt_info[0];

      // Store in Firebase
      // ... (implement Firebase update)

      return NextResponse.json({
        success: true,
        expiresDate: latestReceiptInfo.expires_date_ms
      });
    } else {
      return NextResponse.json(
        { error: 'Invalid receipt', status: response.status },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('[Apple IAP] Validation error:', error);
    return NextResponse.json(
      { error: 'Validation failed' },
      { status: 500 }
    );
  }
}

async function verifyReceiptWithApple(receiptData: string) {
  const requestBody = {
    'receipt-data': receiptData,
    password: process.env.APPLE_SHARED_SECRET, // From App Store Connect
  };

  // Try production first
  let response = await fetch(APPLE_VERIFY_RECEIPT_URL_PRODUCTION, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
  });

  let result = await response.json();

  // If sandbox receipt, try sandbox endpoint
  if (result.status === 21007) {
    response = await fetch(APPLE_VERIFY_RECEIPT_URL_SANDBOX, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });
    result = await response.json();
  }

  return result;
}
```

### 6.2 Get Shared Secret
1. App Store Connect → Your App → **In-App Purchases**
2. Click **App-Specific Shared Secret**
3. Click **Generate**
4. Copy secret and add to `.env`:
   ```bash
   APPLE_SHARED_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

---

## Step 7: Handle Subscription Events

### Server-Side Notifications (S2S)
Apple sends notifications for subscription events (renewal, cancellation, etc.)

**Configure in App Store Connect:**
1. App → **App Information**
2. Scroll to **App Store Server Notifications**
3. Add URL: `https://caddyai.com/api/apple/webhook`
4. Version: Version 2

**Create webhook handler:**
```typescript
// app/api/apple/webhook/route.ts
export async function POST(request: NextRequest) {
  const body = await request.json();

  // Verify signature (implement JWT verification)
  // Update subscription status in Firebase based on notification type

  switch (body.notificationType) {
    case 'DID_RENEW':
      // Subscription renewed
      break;
    case 'DID_FAIL_TO_RENEW':
      // Payment failed
      break;
    case 'DID_CHANGE_RENEWAL_STATUS':
      // User canceled or re-enabled auto-renew
      break;
    case 'EXPIRED':
      // Subscription expired
      break;
  }

  return NextResponse.json({ received: true });
}
```

---

## Step 8: Submit for Review

### 8.1 Prepare for Review
- Add screenshots showing subscription purchase flow
- Include test credentials (sandbox account)
- Provide subscription details and cancellation instructions

### 8.2 App Review Information
**Notes for Reviewer:**
```
To test subscription:
1. Use sandbox test account: test@caddyai.com / [password]
2. Navigate to Settings → Subscribe
3. Select Pro Monthly or Pro Annual
4. Complete purchase with test account

Subscriptions can be managed in iOS Settings → Apple ID → Subscriptions
```

### 8.3 Submit
- Complete all app metadata
- Upload build to TestFlight
- Submit for App Review

---

## Best Practices

### ✅ DO:
- Always validate receipts on your server
- Handle subscription renewals automatically
- Provide clear cancellation instructions
- Respect user's subscription status across devices
- Test thoroughly with sandbox before going live

### ❌ DON'T:
- Store receipts locally without encryption
- Trust client-side subscription status alone
- Forget to handle subscription expiration
- Make subscription features available without validation
- Skip server-side receipt verification

---

## Monitoring

### Track Key Metrics:
- Subscription starts
- Renewal rate
- Cancellation rate
- Revenue (remember 30% goes to Apple)
- Failed payment recovery rate

### Use App Store Connect Analytics:
- Sales and Trends
- App Analytics → Subscriptions
- Subscription Event Estimates

---

## Troubleshooting

**Products Not Loading:**
- Verify product IDs match exactly
- Check In-App Purchase capability is enabled
- Ensure products are "Ready to Submit" status
- Test with sandbox account signed in

**Receipt Validation Failing:**
- Check shared secret is correct
- Verify receipt format (base64 encoded)
- Try sandbox endpoint for test purchases
- Check server logs for detailed errors

**Subscription Not Syncing:**
- Verify Firebase permissions
- Check webhook is receiving notifications
- Ensure user ID matching is correct
- Test receipt validation endpoint manually

---

## Support Resources

- **Apple Documentation**: https://developer.apple.com/in-app-purchase/
- **react-native-iap**: https://github.com/dooboolab-community/react-native-iap
- **Receipt Validation**: https://developer.apple.com/documentation/appstorereceipts/verifyreceipt
