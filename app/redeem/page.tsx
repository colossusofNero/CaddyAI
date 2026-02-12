/**
 * Promo Code Redemption Page
 * Allows users to redeem poker chip promo codes for free subscriptions
 */

'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { app } from '@/lib/firebase';

// Types for Cloud Function responses
interface CheckPromoCodeResponse {
  valid: boolean;
  reason?: string;
  duration?: number;
  type?: string;
  message?: string;
}

interface RedeemPromoCodeResponse {
  success: boolean;
  subscriptionEnd: string;
  plan: string;
  message: string;
}

// Redemption states
type RedemptionState = 'initial' | 'validating' | 'ready' | 'redeeming' | 'success' | 'error';

function RedeemPageContent() {
  const searchParams = useSearchParams();
  const { user, loading: authLoading, signInWithGoogle, signInWithApple } = useAuth();

  const [code, setCode] = useState('');
  const [state, setState] = useState<RedemptionState>('initial');
  const [error, setError] = useState<string | null>(null);
  const [codeInfo, setCodeInfo] = useState<CheckPromoCodeResponse | null>(null);
  const [redemptionResult, setRedemptionResult] = useState<RedeemPromoCodeResponse | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);

  // Get code from URL on mount
  useEffect(() => {
    const urlCode = searchParams.get('code');
    if (urlCode) {
      setCode(urlCode.toUpperCase());
    }
  }, [searchParams]);

  // Validate code when user is authenticated and code is present
  useEffect(() => {
    if (user && code && state === 'initial') {
      validateCode();
    }
  }, [user, code, state]);

  // Validate the promo code
  const validateCode = async () => {
    if (!code || !app) return;

    setState('validating');
    setError(null);

    try {
      const functions = getFunctions(app);
      const checkPromoCode = httpsCallable<{ code: string }, CheckPromoCodeResponse>(
        functions,
        'checkPromoCode'
      );

      const result = await checkPromoCode({ code });

      if (result.data.valid) {
        setCodeInfo(result.data);
        setState('ready');
      } else {
        setError(result.data.reason || 'Invalid promo code');
        setState('error');
      }
    } catch (err: any) {
      console.error('Code validation error:', err);
      setError(err.message || 'Failed to validate code');
      setState('error');
    }
  };

  // Redeem the promo code
  const redeemCode = async () => {
    if (!code || !app) return;

    setState('redeeming');
    setError(null);

    try {
      const functions = getFunctions(app);
      const redeemPromoCode = httpsCallable<{ code: string }, RedeemPromoCodeResponse>(
        functions,
        'redeemPromoCode'
      );

      const result = await redeemPromoCode({ code });

      if (result.data.success) {
        setRedemptionResult(result.data);
        setState('success');
      } else {
        setError('Failed to redeem code');
        setState('error');
      }
    } catch (err: any) {
      console.error('Redemption error:', err);
      // Parse Firebase error messages
      const message = err.message || 'Failed to redeem code';
      setError(message);
      setState('error');
    }
  };

  // Handle Google Sign-In
  const handleGoogleSignIn = async () => {
    try {
      setGoogleLoading(true);
      setError(null);
      await signInWithGoogle();
    } catch (err: any) {
      setError(err.message || 'Google sign-in failed');
    } finally {
      setGoogleLoading(false);
    }
  };

  // Handle Apple Sign-In
  const handleAppleSignIn = async () => {
    try {
      setAppleLoading(true);
      setError(null);
      await signInWithApple();
    } catch (err: any) {
      setError(err.message || 'Apple sign-in failed');
    } finally {
      setAppleLoading(false);
    }
  };

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10">
      {/* Top Navigation */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="relative w-10 h-10">
                <Image
                  src="/logo.png"
                  alt="Copperline Golf Logo"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
              <span className="text-xl font-bold bg-gradient-copper bg-clip-text text-transparent group-hover:opacity-80 transition-opacity">
                Copperline Golf
              </span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-24 pb-12 px-4 flex items-center justify-center min-h-screen">
        <div className="w-full max-w-md">
          <Card variant="elevated" padding="lg" className="bg-white border-primary/20">

            {/* Success State */}
            {state === 'success' && redemptionResult && (
              <>
                <div className="text-center mb-6">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome to Copperline Golf!</h1>
                  <p className="text-gray-600">{redemptionResult.message}</p>
                </div>

                <CardContent>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                    <p className="text-sm text-green-800">
                      <strong>Subscription Active Until:</strong><br />
                      {new Date(redemptionResult.subscriptionEnd).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>

                  <p className="text-center text-gray-600 mb-6">
                    Download the app to start using your premium features:
                  </p>

                  <div className="space-y-3">
                    <a
                      href="https://apps.apple.com/app/copperline-golf"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-3 w-full py-3 px-4 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                    >
                      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                      </svg>
                      Download on the App Store
                    </a>

                    <a
                      href="https://play.google.com/store/apps/details?id=com.copperlinegolf"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-3 w-full py-3 px-4 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                    >
                      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M3.609 1.814L13.792 12 3.61 22.186a1.003 1.003 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 010 1.73l-2.808 1.626L15.206 12l2.492-2.491zM5.864 2.658L16.8 8.99l-2.302 2.302-8.634-8.634z"/>
                      </svg>
                      Get it on Google Play
                    </a>
                  </div>
                </CardContent>
              </>
            )}

            {/* Not Signed In - Show Auth Options */}
            {!user && state !== 'success' && (
              <>
                <CardHeader
                  title="Redeem Your Code"
                  description="Sign in to activate your free subscription"
                />
                <CardContent>
                  {/* Show code if present */}
                  {code && (
                    <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-6 text-center">
                      <p className="text-sm text-gray-600 mb-1">Your promo code:</p>
                      <p className="text-xl font-mono font-bold text-primary">{code}</p>
                    </div>
                  )}

                  {/* Error message */}
                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                      {error}
                    </div>
                  )}

                  <p className="text-gray-600 text-center mb-6">
                    Sign in with your account to redeem this code and unlock premium features.
                  </p>

                  {/* Social Sign-In Buttons */}
                  <div className="space-y-3">
                    <Button
                      type="button"
                      variant="outline"
                      fullWidth
                      loading={googleLoading}
                      disabled={googleLoading || appleLoading}
                      onClick={handleGoogleSignIn}
                      className="border-2 border-neutral-300 hover:border-primary hover:bg-primary/5"
                      icon={
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                          <path fill="#FBBC04" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                      }
                    >
                      Continue with Google
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      fullWidth
                      loading={appleLoading}
                      disabled={googleLoading || appleLoading}
                      onClick={handleAppleSignIn}
                      className="border-2 border-neutral-900 bg-neutral-900 !text-white hover:bg-neutral-800"
                      icon={
                        <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                        </svg>
                      }
                    >
                      Continue with Apple
                    </Button>
                  </div>
                </CardContent>
              </>
            )}

            {/* Signed In - Validating or Ready to Redeem */}
            {user && state !== 'success' && (
              <>
                <CardHeader
                  title="Redeem Your Code"
                  description={`Signed in as ${user.email}`}
                />
                <CardContent>
                  {/* Code input/display */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Promo Code
                    </label>
                    <input
                      type="text"
                      value={code}
                      onChange={(e) => {
                        setCode(e.target.value.toUpperCase());
                        setState('initial');
                        setError(null);
                      }}
                      placeholder="CADDY-PRO-XXXXXXXX"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-center font-mono text-lg uppercase focus:border-primary focus:outline-none"
                    />
                  </div>

                  {/* Error message */}
                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                      {error}
                    </div>
                  )}

                  {/* Code info (when validated) */}
                  {state === 'ready' && codeInfo && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                      <p className="text-sm text-green-800">
                        <strong>Valid Code!</strong><br />
                        {codeInfo.message}
                      </p>
                    </div>
                  )}

                  {/* Action buttons */}
                  {state === 'initial' && code && (
                    <Button
                      fullWidth
                      onClick={validateCode}
                      className="!bg-primary !text-white"
                    >
                      Validate Code
                    </Button>
                  )}

                  {state === 'validating' && (
                    <Button fullWidth disabled loading>
                      Validating...
                    </Button>
                  )}

                  {state === 'ready' && (
                    <Button
                      fullWidth
                      onClick={redeemCode}
                      className="!bg-primary !text-white"
                    >
                      Activate Subscription
                    </Button>
                  )}

                  {state === 'redeeming' && (
                    <Button fullWidth disabled loading>
                      Activating...
                    </Button>
                  )}

                  {state === 'error' && (
                    <Button
                      fullWidth
                      onClick={() => {
                        setState('initial');
                        setError(null);
                      }}
                      variant="outline"
                    >
                      Try Again
                    </Button>
                  )}
                </CardContent>
              </>
            )}
          </Card>

          {/* Footer */}
          <p className="text-center text-text-muted text-sm mt-8">
            Need help?{' '}
            <Link href="/contact" className="text-primary hover:underline">
              Contact Support
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

// Wrap with Suspense for useSearchParams
export default function RedeemPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    }>
      <RedeemPageContent />
    </Suspense>
  );
}
