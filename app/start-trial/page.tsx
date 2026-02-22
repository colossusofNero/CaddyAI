/**
 * Start Trial Page
 * Collects payment info for 7-day free trial
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Check, Shield, CreditCard } from 'lucide-react';

type BillingPeriod = 'monthly' | 'annual';

const PRO_FEATURES = [
  'AI-powered club recommendations',
  'Real-time weather adjustments',
  'Unlimited course access',
  'Shot tracking & analytics',
  'Personalized distance calculations',
  'Wind & elevation adjustments',
];

const PRICING = {
  monthly: { price: 9.99, period: 'month' },
  annual: { price: 79.99, period: 'year', savings: '33%' },
};

export default function StartTrialPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('monthly');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect to login if not authenticated
  if (!authLoading && !user) {
    router.push('/signup');
    return null;
  }

  const handleStartTrial = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);

      // Call the checkout API to create a Stripe session with trial
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.uid,
          plan: 'pro',
          billingPeriod,
          customerEmail: user.email,
          successUrl: `${window.location.origin}/dashboard?trial_started=true`,
          cancelUrl: `${window.location.origin}/start-trial?canceled=true`,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        console.error('Checkout error details:', data);
        throw new Error(data.details || data.error || 'Failed to create checkout session');
      }

      const { url } = await response.json();

      // Redirect to Stripe Checkout
      window.location.href = url;
    } catch (err: any) {
      console.error('Error starting trial:', err);
      setError(err.message || 'Something went wrong. Please try again.');
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10">
      {/* Top Navigation */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="relative w-10 h-10">
                <Image
                  src="/logo.png"
                  alt="Copperline Golf Logo"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
              <span className="text-xl font-bold bg-gradient-copper bg-clip-text text-transparent">
                Copperline Golf
              </span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-24 pb-12 px-4 flex items-center justify-center min-h-screen">
        <div className="w-full max-w-lg">
          <Card variant="elevated" padding="lg" className="bg-white border-primary/20">
            <CardHeader
              title="Start Your Free Trial"
              description="7 days free, then choose your plan. Cancel anytime."
            />

            <CardContent>
              {/* Error Message */}
              {error && (
                <div className="bg-error/10 border border-error text-error px-4 py-3 rounded-lg mb-4 text-sm">
                  {error}
                </div>
              )}

              {/* Trial Benefits */}
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="w-5 h-5 text-primary" />
                  <span className="font-semibold text-primary">Pro Features Included</span>
                </div>
                <ul className="space-y-2">
                  {PRO_FEATURES.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm text-text-secondary">
                      <Check className="w-4 h-4 text-primary flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Billing Period Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-text-primary mb-3">
                  Choose your plan after trial
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setBillingPeriod('monthly')}
                    className={`p-4 rounded-lg border-2 text-left transition-all ${
                      billingPeriod === 'monthly'
                        ? 'border-primary bg-primary/5'
                        : 'border-neutral-200 hover:border-primary/50'
                    }`}
                  >
                    <div className="font-semibold text-text-primary">Monthly</div>
                    <div className="text-lg font-bold text-primary">${PRICING.monthly.price}</div>
                    <div className="text-xs text-text-muted">per month</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setBillingPeriod('annual')}
                    className={`p-4 rounded-lg border-2 text-left transition-all relative ${
                      billingPeriod === 'annual'
                        ? 'border-primary bg-primary/5'
                        : 'border-neutral-200 hover:border-primary/50'
                    }`}
                  >
                    <div className="absolute -top-2 -right-2 bg-primary text-white text-xs px-2 py-0.5 rounded-full">
                      Save {PRICING.annual.savings}
                    </div>
                    <div className="font-semibold text-text-primary">Annual</div>
                    <div className="text-lg font-bold text-primary">${PRICING.annual.price}</div>
                    <div className="text-xs text-text-muted">per year</div>
                  </button>
                </div>
              </div>

              {/* Payment Info Notice */}
              <div className="flex items-start gap-3 bg-neutral-50 rounded-lg p-3 mb-6">
                <CreditCard className="w-5 h-5 text-text-muted flex-shrink-0 mt-0.5" />
                <p className="text-sm text-text-secondary">
                  You won&apos;t be charged today. Your card will be charged ${billingPeriod === 'monthly' ? PRICING.monthly.price : PRICING.annual.price} after your 7-day free trial ends.
                </p>
              </div>

              {/* Start Trial Button */}
              <Button
                onClick={handleStartTrial}
                fullWidth
                loading={isLoading}
                disabled={isLoading}
                className="!bg-copper !text-white hover:!bg-copper-dark"
              >
                Start 7-Day Free Trial
              </Button>

              {/* Terms */}
              <p className="text-xs text-text-muted text-center mt-4">
                By starting your trial, you agree to our{' '}
                <Link href="/terms" className="text-primary hover:underline">Terms</Link>
                {' '}and{' '}
                <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
                Cancel anytime before trial ends to avoid charges.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
