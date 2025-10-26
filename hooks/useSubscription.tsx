/**
 * useSubscription Hook
 * Custom React hook for subscription management and Stripe integration
 * Provides methods to create checkout sessions, access customer portal, and fetch subscription status
 */

'use client';

import { useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import type {
  SubscriptionData,
  SubscriptionStatusResponse,
  SubscriptionPlan,
  BillingPeriod,
  StripeCheckoutSession,
  StripePortalSession,
} from '@/types/subscription';

interface CreateCheckoutParams {
  plan: Exclude<SubscriptionPlan, 'free'>;
  billingPeriod: BillingPeriod;
  successUrl: string;
  cancelUrl: string;
}

interface UseSubscriptionReturn {
  // State
  subscription: SubscriptionStatusResponse | null;
  isLoading: boolean;
  error: string | null;

  // Methods
  getSubscriptionStatus: () => Promise<SubscriptionStatusResponse | null>;
  createCheckoutSession: (params: CreateCheckoutParams) => Promise<void>;
  openCustomerPortal: (returnUrl?: string) => Promise<void>;
  clearError: () => void;
}

/**
 * useSubscription Hook
 * Use this hook in any component to manage subscriptions
 *
 * @example
 * const { createCheckoutSession, isLoading, error } = useSubscription();
 *
 * const handleSubscribe = async () => {
 *   await createCheckoutSession({
 *     plan: 'pro',
 *     billingPeriod: 'monthly',
 *     successUrl: window.location.origin + '/dashboard?success=true',
 *     cancelUrl: window.location.origin + '/pricing'
 *   });
 * };
 */
export function useSubscription(): UseSubscriptionReturn {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionStatusResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch the current user's subscription status
   */
  const getSubscriptionStatus = useCallback(async (): Promise<SubscriptionStatusResponse | null> => {
    if (!user) {
      setError('User not authenticated');
      return null;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/stripe/subscription?userId=${user.uid}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch subscription status');
      }

      const data = await response.json();
      setSubscription(data);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Error fetching subscription status:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  /**
   * Create a Stripe checkout session and redirect to checkout
   */
  const createCheckoutSession = useCallback(
    async (params: CreateCheckoutParams): Promise<void> => {
      if (!user) {
        setError('User not authenticated');
        throw new Error('User not authenticated');
      }

      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch('/api/stripe/checkout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: user.uid,
            plan: params.plan,
            billingPeriod: params.billingPeriod,
            successUrl: params.successUrl,
            cancelUrl: params.cancelUrl,
            customerEmail: user.email,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to create checkout session');
        }

        const data: StripeCheckoutSession = await response.json();

        // Redirect to Stripe Checkout
        if (data.url) {
          window.location.href = data.url;
        } else {
          throw new Error('No checkout URL returned');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        console.error('Error creating checkout session:', err);
        setIsLoading(false);
        throw err;
      }
      // Note: setIsLoading(false) not called here because page will redirect
    },
    [user]
  );

  /**
   * Open Stripe Customer Portal to manage subscription
   */
  const openCustomerPortal = useCallback(
    async (returnUrl?: string): Promise<void> => {
      if (!user) {
        setError('User not authenticated');
        throw new Error('User not authenticated');
      }

      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch('/api/stripe/portal', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: user.uid,
            returnUrl: returnUrl || window.location.href,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to create portal session');
        }

        const data: StripePortalSession = await response.json();

        // Redirect to Stripe Customer Portal
        if (data.url) {
          window.location.href = data.url;
        } else {
          throw new Error('No portal URL returned');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        console.error('Error opening customer portal:', err);
        setIsLoading(false);
        throw err;
      }
      // Note: setIsLoading(false) not called here because page will redirect
    },
    [user]
  );

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    subscription,
    isLoading,
    error,
    getSubscriptionStatus,
    createCheckoutSession,
    openCustomerPortal,
    clearError,
  };
}
