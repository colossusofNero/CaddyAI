/**
 * Subscription Settings Page
 * Manage subscription, view plan details, and access Stripe Customer Portal
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { PLAN_FEATURES } from '@/types/subscription';
import { Check, CreditCard, Calendar, AlertCircle, Sparkles, Crown } from 'lucide-react';

export default function SubscriptionSettingsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { subscription, getSubscriptionStatus, openCustomerPortal, isLoading, error } = useSubscription();
  const [isLoadingPortal, setIsLoadingPortal] = useState(false);

  // Redirect unauthenticated users to login
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Fetch subscription status on mount
  useEffect(() => {
    if (user) {
      getSubscriptionStatus();
    }
  }, [user, getSubscriptionStatus]);

  // Handle opening customer portal
  const handleManageSubscription = async () => {
    try {
      setIsLoadingPortal(true);
      await openCustomerPortal(window.location.origin + '/settings/subscription');
    } catch (err) {
      console.error('Portal error:', err);
      setIsLoadingPortal(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const planName = subscription?.plan || 'free';
  const planFeatures = PLAN_FEATURES[planName];
  const isFreePlan = planName === 'free';
  const hasActiveSubscription = subscription?.hasActiveSubscription || false;
  const isTrialing = subscription?.status === 'trialing';
  const cancelAtPeriodEnd = subscription?.cancelAtPeriodEnd || false;

  // Format dates
  const currentPeriodEnd = subscription?.currentPeriodEnd
    ? new Date(subscription.currentPeriodEnd).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  const trialEnd = subscription?.trialEnd
    ? new Date(subscription.trialEnd).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-secondary-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg"></div>
              <span className="text-2xl font-bold text-primary">CaddyAI</span>
            </Link>
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text-primary mb-2">
            Subscription Settings
          </h1>
          <p className="text-text-secondary">
            Manage your subscription and billing details
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-500 font-medium">Error loading subscription</p>
              <p className="text-red-400 text-sm mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Current Plan Card */}
        <Card variant="elevated" padding="lg" className="mb-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                {planName === 'tour' && <Crown className="w-6 h-6 text-primary" />}
                {planName === 'pro' && <Sparkles className="w-6 h-6 text-primary" />}
                <h2 className="text-2xl font-bold text-text-primary">
                  {planName === 'free' && 'Free Plan'}
                  {planName === 'pro' && 'CaddyAI Pro'}
                  {planName === 'tour' && 'CaddyAI Tour'}
                </h2>
              </div>
              <div className="flex items-center gap-2 text-text-secondary">
                {isTrialing && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary/20 text-primary rounded-md text-sm font-medium">
                    <Calendar className="w-4 h-4" />
                    Trial Active
                  </span>
                )}
                {cancelAtPeriodEnd && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-warning/20 text-warning rounded-md text-sm font-medium">
                    <AlertCircle className="w-4 h-4" />
                    Cancels {currentPeriodEnd}
                  </span>
                )}
                {hasActiveSubscription && !cancelAtPeriodEnd && !isTrialing && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-success/20 text-success rounded-md text-sm font-medium">
                    <Check className="w-4 h-4" />
                    Active
                  </span>
                )}
              </div>
            </div>
            {!isFreePlan && hasActiveSubscription && (
              <Button
                variant="outline"
                size="md"
                onClick={handleManageSubscription}
                disabled={isLoadingPortal}
              >
                {isLoadingPortal ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Loading...
                  </span>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    Manage Billing
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Billing Info */}
          {hasActiveSubscription && !isFreePlan && (
            <div className="grid md:grid-cols-2 gap-4 mb-6 pb-6 border-b border-secondary-700">
              <div>
                <p className="text-sm text-text-muted mb-1">Billing Period</p>
                <p className="text-text-primary font-medium capitalize">
                  {subscription?.billingPeriod}
                </p>
              </div>
              <div>
                <p className="text-sm text-text-muted mb-1">
                  {isTrialing ? 'Trial Ends' : cancelAtPeriodEnd ? 'Subscription Ends' : 'Next Billing Date'}
                </p>
                <p className="text-text-primary font-medium">
                  {isTrialing ? trialEnd : currentPeriodEnd}
                </p>
              </div>
            </div>
          )}

          {/* Plan Features */}
          <div>
            <h3 className="text-lg font-bold text-text-primary mb-4">Plan Features</h3>
            <div className="grid md:grid-cols-2 gap-3">
              {planFeatures.maxClubs && (
                <div className="flex items-center gap-2 text-text-secondary">
                  <Check className="w-5 h-5 text-primary" />
                  <span>Up to {planFeatures.maxClubs} clubs</span>
                </div>
              )}
              {!planFeatures.maxClubs && (
                <div className="flex items-center gap-2 text-text-secondary">
                  <Check className="w-5 h-5 text-primary" />
                  <span>Unlimited clubs</span>
                </div>
              )}
              {planFeatures.maxRounds && (
                <div className="flex items-center gap-2 text-text-secondary">
                  <Check className="w-5 h-5 text-primary" />
                  <span>{planFeatures.maxRounds} rounds/month</span>
                </div>
              )}
              {!planFeatures.maxRounds && (
                <div className="flex items-center gap-2 text-text-secondary">
                  <Check className="w-5 h-5 text-primary" />
                  <span>Unlimited rounds</span>
                </div>
              )}
              {planFeatures.aiRecommendations && (
                <div className="flex items-center gap-2 text-text-secondary">
                  <Check className="w-5 h-5 text-primary" />
                  <span>AI-powered recommendations</span>
                </div>
              )}
              {planFeatures.shotDispersion && (
                <div className="flex items-center gap-2 text-text-secondary">
                  <Check className="w-5 h-5 text-primary" />
                  <span>Shot dispersion tracking</span>
                </div>
              )}
              {planFeatures.performanceAnalytics && (
                <div className="flex items-center gap-2 text-text-secondary">
                  <Check className="w-5 h-5 text-primary" />
                  <span>Performance analytics</span>
                </div>
              )}
              {planFeatures.advancedAnalytics && (
                <div className="flex items-center gap-2 text-text-secondary">
                  <Check className="w-5 h-5 text-primary" />
                  <span>Advanced analytics</span>
                </div>
              )}
              {planFeatures.strokesGained && (
                <div className="flex items-center gap-2 text-text-secondary">
                  <Check className="w-5 h-5 text-primary" />
                  <span>Strokes gained analysis</span>
                </div>
              )}
              {planFeatures.videoIntegration && (
                <div className="flex items-center gap-2 text-text-secondary">
                  <Check className="w-5 h-5 text-primary" />
                  <span>Video swing integration</span>
                </div>
              )}
              {planFeatures.tournamentMode && (
                <div className="flex items-center gap-2 text-text-secondary">
                  <Check className="w-5 h-5 text-primary" />
                  <span>Tournament mode</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-text-secondary">
                <Check className="w-5 h-5 text-primary" />
                <span className="capitalize">{planFeatures.supportLevel} support</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Upgrade CTA for Free Users */}
        {isFreePlan && (
          <Card variant="bordered" padding="lg" className="mb-6">
            <div className="text-center">
              <Sparkles className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-bold text-text-primary mb-2">
                Upgrade to Pro or Tour
              </h3>
              <p className="text-text-secondary mb-6">
                Unlock AI-powered recommendations, unlimited clubs, shot dispersion tracking, and more.
              </p>
              <Link href="/pricing">
                <Button variant="primary" size="lg">
                  View Plans
                </Button>
              </Link>
            </div>
          </Card>
        )}

        {/* Billing Portal Info */}
        {!isFreePlan && hasActiveSubscription && (
          <Card variant="default" padding="lg">
            <CardHeader
              title="Manage Your Subscription"
              description="Use the Stripe Customer Portal to manage your subscription"
            />
            <CardContent>
              <p className="text-text-secondary mb-4">
                Click "Manage Billing" above to access the Stripe Customer Portal where you can:
              </p>
              <ul className="space-y-2 text-text-secondary mb-6">
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span>Update your payment method</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span>View billing history and download invoices</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span>Change your subscription plan</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span>Cancel your subscription</span>
                </li>
              </ul>
              <p className="text-sm text-text-muted">
                All billing is securely processed by Stripe. Your subscription will remain active until the end of your current billing period if you cancel.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
