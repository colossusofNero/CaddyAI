/**
 * Signup Page
 * User registration with email/password and Google/Apple Sign-In — localized.
 */

'use client';

import { useState, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/Card';

type SignupFormData = {
  displayName: string;
  email: string;
  password: string;
  confirmPassword: string;
};

function SignupPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/start-trial';
  const t = useTranslations('marketing.signup');
  const tAuth = useTranslations('marketing.auth');
  const { signUp, signInWithGoogle, signInWithApple, error: authError, clearError } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [promoLoading, setPromoLoading] = useState(false);

  // Extract promo code from redirect URL if present
  const promoCode = (() => {
    try {
      const url = new URL(redirectTo, 'http://localhost');
      return url.searchParams.get('code') || null;
    } catch {
      return null;
    }
  })();

  // Locale-aware validation schema. Memoized to keep stable identity for RHF.
  const signupSchema = useMemo(
    () =>
      z
        .object({
          displayName: z.string().min(2, t('validation.nameTooShort')),
          email: z.string().email(t('validation.emailInvalid')),
          password: z
            .string()
            .min(8, t('validation.passwordTooShort'))
            .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, t('validation.passwordComplexity')),
          confirmPassword: z.string(),
        })
        .refine((data) => data.password === data.confirmPassword, {
          message: t('validation.passwordsMismatch'),
          path: ['confirmPassword'],
        }),
    [t]
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupFormData) => {
    try {
      setIsLoading(true);
      clearError();
      await signUp(data.email, data.password, data.displayName);
      setShowSuccess(true);
    } catch {
      // Error handled by useAuth
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setGoogleLoading(true);
      clearError();
      await signInWithGoogle();
      router.push(redirectTo);
    } catch {
      // Error handled by useAuth
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    try {
      setAppleLoading(true);
      clearError();
      await signInWithApple();
      router.push(redirectTo);
    } catch {
      // Error handled by useAuth
    } finally {
      setAppleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10">
      {/* Top Navigation Menu */}
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

            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="text-sm font-medium text-foreground-secondary hover:text-primary transition-colors"
              >
                {tAuth('home')}
              </Link>
              <Link
                href="/login"
                className="text-sm font-medium text-primary hover:text-primary-600 transition-colors"
              >
                {tAuth('signIn')}
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-24 pb-12 px-4 flex items-center justify-center min-h-screen">
        <div className="w-full max-w-md">
          <Card variant="elevated" padding="lg" className="bg-white border-primary/20">
            <h1 className="sr-only">{t('srTitle')}</h1>
            <CardHeader title={t('title')} description={t('description')} />

            {/* Free Trial Banner */}
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-primary">{t('trialBannerTitle')}</p>
                  <p className="text-sm text-text-secondary">{t('trialBannerBody')}</p>
                </div>
              </div>
            </div>

            <CardContent>
              {showSuccess && (
                <div className="text-center py-6">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold mb-2" style={{ color: '#111827' }}>
                    {t('success.title')}
                  </h3>
                  <p className="text-gray-600 mb-6">
                    {promoCode ? t('success.bodyPromo') : t('success.bodyDefault')}
                  </p>
                  {authError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
                      {authError}
                    </div>
                  )}
                  <button
                    onClick={async () => {
                      if (promoCode) {
                        try {
                          setPromoLoading(true);
                          const { auth } = await import('@/lib/firebase');
                          const idToken = await auth?.currentUser?.getIdToken();
                          if (!idToken) {
                            window.location.href = `/redeem?code=${promoCode}`;
                            return;
                          }
                          const response = await fetch('/api/promo/redeem', {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                              Authorization: `Bearer ${idToken}`,
                            },
                            body: JSON.stringify({
                              code: promoCode,
                              billingPeriod: 'annual',
                              customerEmail: auth?.currentUser?.email,
                              successUrl: `${window.location.origin}/dashboard?promo_redeemed=true`,
                              cancelUrl: `${window.location.origin}/redeem?code=${promoCode}&canceled=true`,
                            }),
                          });
                          const result = await response.json();
                          if (result.success && result.url) {
                            window.location.href = result.url;
                          } else {
                            window.location.href = `/redeem?code=${promoCode}`;
                          }
                        } catch {
                          window.location.href = `/redeem?code=${promoCode}`;
                        } finally {
                          setPromoLoading(false);
                        }
                      } else {
                        window.location.href = redirectTo;
                      }
                    }}
                    disabled={promoLoading}
                    className="w-full py-3 px-6 rounded-lg text-center font-medium text-white"
                    style={{ backgroundColor: '#B87333' }}
                  >
                    {promoLoading
                      ? t('success.buttonSettingUp')
                      : promoCode
                      ? t('success.buttonPromo')
                      : t('success.buttonDefault')}
                  </button>
                </div>
              )}

              {authError && !showSuccess && (
                <div className="bg-error bg-opacity-10 border border-error text-error px-4 py-3 rounded-lg mb-4 flex items-start gap-2">
                  <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm">{authError}</span>
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Input
                  label={t('nameLabel')}
                  type="text"
                  placeholder={t('namePlaceholder')}
                  error={errors.displayName?.message}
                  fullWidth
                  {...register('displayName')}
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  }
                />

                <Input
                  label={t('emailLabel')}
                  type="email"
                  placeholder={t('emailPlaceholder')}
                  error={errors.email?.message}
                  fullWidth
                  {...register('email')}
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                  }
                />

                <Input
                  label={t('passwordLabel')}
                  type="password"
                  placeholder={t('passwordPlaceholder')}
                  error={errors.password?.message}
                  helperText={t('passwordHelper')}
                  fullWidth
                  {...register('password')}
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  }
                />

                <Input
                  label={t('confirmPasswordLabel')}
                  type="password"
                  placeholder={t('confirmPasswordPlaceholder')}
                  error={errors.confirmPassword?.message}
                  fullWidth
                  {...register('confirmPassword')}
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  }
                />

                <Button
                  type="submit"
                  fullWidth
                  loading={isLoading}
                  disabled={isLoading || googleLoading || appleLoading || showSuccess}
                  className="!bg-[#B87333] !text-white !border-2 !border-[#B87333] hover:!bg-[#8B4513] hover:!border-[#8B4513]"
                >
                  {t('submit')}
                </Button>
              </form>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-neutral-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-3 bg-white text-text-secondary">
                    {tAuth('divider')}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <Button
                  type="button"
                  variant="outline"
                  fullWidth
                  loading={googleLoading}
                  disabled={isLoading || googleLoading || appleLoading || showSuccess}
                  onClick={handleGoogleSignIn}
                  className="!border-2 !border-[#d1d5db] !text-[#374151] !bg-white hover:!border-[#B87333] hover:!bg-[#B87333]/5"
                  icon={
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC04" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                  }
                >
                  {tAuth('googleSignUp')}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  fullWidth
                  loading={appleLoading}
                  disabled={isLoading || googleLoading || appleLoading || showSuccess}
                  onClick={handleAppleSignIn}
                  className="!border-2 !border-[#1a1a1a] !bg-[#1a1a1a] !text-white hover:!bg-[#333] hover:!border-[#333]"
                  icon={
                    <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                    </svg>
                  }
                >
                  {tAuth('appleSignUp')}
                </Button>
              </div>
            </CardContent>

            <CardFooter className="justify-center">
              <p className="text-text-secondary text-sm">
                {t('footerPrompt')}{' '}
                <Link
                  href="/login"
                  className="text-primary hover:text-primary-600 font-medium transition-colors"
                >
                  {t('footerLink')}
                </Link>
              </p>
            </CardFooter>
          </Card>

          <p className="text-center text-text-muted text-sm mt-8">
            {tAuth('legalSignupPrefix')}{' '}
            <Link href="/terms" className="text-primary hover:underline">
              {tAuth('termsLabel')}
            </Link>{' '}
            {tAuth('legalJoin')}{' '}
            <Link href="/privacy" className="text-primary hover:underline">
              {tAuth('privacyLabel')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      }
    >
      <SignupPageContent />
    </Suspense>
  );
}
