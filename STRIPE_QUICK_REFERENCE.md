# Stripe Integration Quick Reference

## How to Use the Subscription System

### For Developers

#### Using the useSubscription Hook

```typescript
import { useSubscription } from '@/hooks/useSubscription';

function MyComponent() {
  const {
    subscription,        // Current subscription status
    isLoading,          // Loading state
    error,              // Error message
    getSubscriptionStatus,  // Fetch subscription
    createCheckoutSession,  // Start checkout
    openCustomerPortal,     // Open Stripe portal
  } = useSubscription();

  // Fetch subscription on mount
  useEffect(() => {
    getSubscriptionStatus();
  }, [getSubscriptionStatus]);

  // Start checkout
  const handleUpgrade = async () => {
    await createCheckoutSession({
      plan: 'pro',
      billingPeriod: 'monthly',
      successUrl: window.location.origin + '/dashboard?success=true',
      cancelUrl: window.location.origin + '/pricing'
    });
  };

  // Open customer portal
  const handleManage = async () => {
    await openCustomerPortal(window.location.href);
  };

  return (
    <div>
      <p>Plan: {subscription?.plan}</p>
      <button onClick={handleUpgrade}>Upgrade</button>
      <button onClick={handleManage}>Manage</button>
    </div>
  );
}
```

#### Checking Subscription Status

```typescript
// Check if user has active paid subscription
const hasPaidPlan = subscription?.hasActiveSubscription && subscription?.plan !== 'free';

// Check specific plan
const isProUser = subscription?.plan === 'pro';
const isTourUser = subscription?.plan === 'tour';

// Check if in trial
const isTrialing = subscription?.status === 'trialing';

// Check if canceling at period end
const isCanceling = subscription?.cancelAtPeriodEnd;
```

#### Conditional Features Based on Plan

```typescript
import { PLAN_FEATURES } from '@/types/subscription';

function FeatureComponent() {
  const { subscription } = useSubscription();
  const plan = subscription?.plan || 'free';
  const features = PLAN_FEATURES[plan];

  if (!features.aiRecommendations) {
    return <UpgradePrompt feature="AI Recommendations" />;
  }

  return <AIRecommendationComponent />;
}
```

---

## Key Routes

### User-Facing Pages
- `/pricing` - View and select plans
- `/settings/subscription` - Manage subscription
- `/dashboard` - View subscription status

### API Endpoints
- `POST /api/stripe/checkout` - Create checkout session
- `POST /api/stripe/portal` - Access customer portal
- `GET /api/stripe/subscription?userId=xxx` - Get subscription status
- `POST /api/stripe/webhook` - Handle Stripe webhooks (configured in Stripe Dashboard)

---

## Plan Features Reference

### Free Plan
- ❌ AI-powered recommendations
- ❌ Shot dispersion tracking
- ✅ Basic club recommendations
- ✅ Up to 10 clubs in bag
- ✅ 5 rounds per month
- ✅ Community support

### Pro Plan ($9.99/month or $95.88/year)
- ✅ AI-powered recommendations
- ✅ Shot dispersion tracking
- ✅ Unlimited clubs
- ✅ Unlimited rounds
- ✅ Performance analytics
- ✅ Course database access
- ✅ Priority support
- ❌ Strokes gained analysis
- ❌ Video integration
- ❌ Tournament mode

### Tour Plan ($19.99/month or $191.88/year)
- ✅ Everything in Pro
- ✅ Advanced shot analytics
- ✅ Strokes gained analysis
- ✅ Video swing integration
- ✅ Tournament mode
- ✅ Custom club fitting data
- ✅ API access
- ✅ White-glove support

---

## Subscription States

### Status Types
- `active` - Subscription is active and in good standing
- `trialing` - In trial period (14 days)
- `past_due` - Payment failed, pending retry
- `canceled` - Subscription has been canceled
- `incomplete` - Initial payment failed
- `unpaid` - All payment attempts failed

### Handling Different States

```typescript
const { subscription } = useSubscription();

switch (subscription?.status) {
  case 'active':
    // Normal active subscription
    break;
  case 'trialing':
    // Show trial end date
    break;
  case 'past_due':
    // Show payment failure warning
    break;
  case 'canceled':
    // Show reactivation option
    break;
}
```

---

## Common Patterns

### Protect Features by Plan

```typescript
function ProtectedFeature({ requiredPlan = 'pro' }) {
  const { subscription } = useSubscription();
  const router = useRouter();

  if (subscription?.plan === 'free') {
    return (
      <div className="p-6 border rounded-lg">
        <h3>Upgrade Required</h3>
        <p>This feature requires {requiredPlan} plan.</p>
        <button onClick={() => router.push('/pricing')}>
          Upgrade Now
        </button>
      </div>
    );
  }

  return <ActualFeature />;
}
```

### Show Upgrade Prompts

```typescript
function UpgradePrompt({ feature, requiredPlan = 'pro' }) {
  const router = useRouter();

  return (
    <div className="bg-primary/10 p-4 rounded-lg">
      <h4>🚀 Unlock {feature}</h4>
      <p>Available with {requiredPlan} plan</p>
      <button onClick={() => router.push('/pricing')}>
        View Plans
      </button>
    </div>
  );
}
```

### Display Current Plan Badge

```typescript
function PlanBadge() {
  const { subscription } = useSubscription();

  const planColors = {
    free: 'bg-gray-500',
    pro: 'bg-primary',
    tour: 'bg-purple-500'
  };

  const plan = subscription?.plan || 'free';

  return (
    <span className={`px-3 py-1 rounded-full text-white text-sm ${planColors[plan]}`}>
      {plan === 'free' ? 'Free' : plan === 'pro' ? 'Pro' : 'Tour'}
    </span>
  );
}
```

---

## Testing with Stripe

### Test Card Numbers
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- Authentication Required: `4000 0025 0000 3155`

### Test Mode Setup
1. Use test API keys (sk_test_..., pk_test_...)
2. Configure webhook with test endpoint
3. Use Stripe CLI for local webhook testing:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```

---

## Troubleshooting

### User can't checkout
1. Check if user is authenticated
2. Verify plan and billingPeriod are valid
3. Check browser console for errors
4. Verify STRIPE_PRICE_ID_* env variables

### Subscription not updating
1. Check webhook is configured in Stripe Dashboard
2. Verify STRIPE_WEBHOOK_SECRET is correct
3. Check webhook logs in Stripe Dashboard
4. Verify Firestore write permissions

### Customer Portal not working
1. Activate Customer Portal in Stripe Dashboard
2. Configure allowed actions (cancel, update payment, etc.)
3. Verify user has stripeCustomerId in Firestore

---

## Security Notes

- Never expose secret keys in frontend code
- Use environment variables for all Stripe keys
- Webhook secret is critical for signature verification
- Always validate userId on backend
- Price IDs are safe to expose (they're public)

---

## Production Checklist

- [ ] Webhook endpoint configured in Stripe Dashboard
- [ ] Webhook secret added to environment variables
- [ ] Customer Portal activated and configured
- [ ] Price IDs match production products
- [ ] Using live mode keys (sk_live_, pk_live_)
- [ ] Test full checkout flow
- [ ] Test subscription cancellation
- [ ] Test plan switching
- [ ] Verify webhook events are processing
- [ ] Monitor for errors in production

---

## Support Resources

- Stripe Dashboard: https://dashboard.stripe.com
- Stripe Docs: https://stripe.com/docs
- Stripe CLI: https://stripe.com/docs/stripe-cli
- Customer Portal Config: https://dashboard.stripe.com/settings/billing/portal

---

**Quick Links:**
- [Full Integration Report](./STRIPE_FRONTEND_INTEGRATION_REPORT.md)
- [Subscription Types](./types/subscription.ts)
- [useSubscription Hook](./hooks/useSubscription.tsx)
- [Pricing Page](./app/pricing/page.tsx)
