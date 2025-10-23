/**
 * Login Page
 * User authentication with email/password and Google Sign-In
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/Card';

// Validation schema
const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { signIn, signInWithGoogle, signInWithApple, error: authError, clearError } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const [, setShowResetPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  // Handle email/password login
  const onSubmit = async (data: LoginFormData) => {
    try {
      console.log('[Login Debug] Form submitted');
      console.log('[Login Debug] Email:', data.email);
      setIsLoading(true);
      clearError();

      console.log('[Login Debug] Calling signIn...');
      await signIn(data.email, data.password);
      console.log('[Login Debug] signIn successful, redirecting to dashboard...');

      router.push('/dashboard');
    } catch (error: any) {
      console.error('[Login Debug] Login failed:', {
        message: error?.message,
        name: error?.name,
        stack: error?.stack,
        error
      });
      // Error is handled by useAuth
    } finally {
      setIsLoading(false);
      console.log('[Login Debug] Login attempt complete');
    }
  };

  // Handle Google Sign-In
  const handleGoogleSignIn = async () => {
    try {
      console.log('[Login Debug] Google sign-in button clicked');
      setGoogleLoading(true);
      clearError();

      console.log('[Login Debug] Calling signInWithGoogle...');
      await signInWithGoogle();
      console.log('[Login Debug] Google sign-in successful, redirecting to dashboard...');

      router.push('/dashboard');
    } catch (error: any) {
      console.error('[Login Debug] Google sign-in failed:', {
        message: error?.message,
        name: error?.name,
        code: error?.code,
        stack: error?.stack,
        error
      });
      // Error is handled by useAuth
    } finally {
      setGoogleLoading(false);
      console.log('[Login Debug] Google sign-in attempt complete');
    }
  };

  // Handle Apple Sign-In
  const handleAppleSignIn = async () => {
    try {
      console.log('[Login Debug] Apple sign-in button clicked');
      setAppleLoading(true);
      clearError();

      console.log('[Login Debug] Calling signInWithApple...');
      await signInWithApple();
      console.log('[Login Debug] Apple sign-in successful, redirecting to dashboard...');

      router.push('/dashboard');
    } catch (error: any) {
      console.error('[Login Debug] Apple sign-in failed:', {
        message: error?.message,
        name: error?.name,
        code: error?.code,
        stack: error?.stack,
        error
      });
      // Error is handled by useAuth
    } finally {
      setAppleLoading(false);
      console.log('[Login Debug] Apple sign-in attempt complete');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <div className="text-4xl font-bold text-primary mb-2">CaddyAI</div>
          <p className="text-text-secondary">Your intelligent golf companion</p>
        </div>

        <Card variant="elevated" padding="lg" className="bg-white border-primary/20">
          <h1 className="sr-only">Sign In to CaddyAI</h1>
          <CardHeader
            title="Welcome back"
            description="Sign in to your CaddyAI account"
          />

          <CardContent>
            {/* Error message */}
            {authError && (
              <div className="bg-error bg-opacity-10 border border-error text-error px-4 py-3 rounded-lg mb-4 flex items-start gap-2">
                <svg
                  className="w-5 h-5 mt-0.5 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-sm">{authError}</span>
              </div>
            )}

            {/* Login form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                label="Email"
                type="email"
                placeholder="you@example.com"
                error={errors.email?.message}
                fullWidth
                {...register('email')}
                icon={
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                    />
                  </svg>
                }
              />

              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                error={errors.password?.message}
                fullWidth
                {...register('password')}
                icon={
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                }
              />

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowResetPassword(true)}
                  className="text-sm text-primary hover:text-primary-600 transition-colors"
                >
                  Forgot password?
                </button>
              </div>

              <Button
                type="submit"
                fullWidth
                loading={isLoading}
                disabled={isLoading || googleLoading || appleLoading}
              >
                Sign In
              </Button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-neutral-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 bg-white text-text-secondary">
                  Or continue with
                </span>
              </div>
            </div>

            {/* Social Sign-In */}
            <div className="space-y-3">
              {/* Google Sign-In */}
              <Button
                type="button"
                variant="outline"
                fullWidth
                loading={googleLoading}
                disabled={isLoading || googleLoading || appleLoading}
                onClick={handleGoogleSignIn}
                className="border-2 border-neutral-300 hover:border-primary hover:bg-primary/5"
                icon={
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC04"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                }
              >
                Sign in with Google
              </Button>

              {/* Apple Sign-In */}
              <Button
                type="button"
                variant="outline"
                fullWidth
                loading={appleLoading}
                disabled={isLoading || googleLoading || appleLoading}
                onClick={handleAppleSignIn}
                className="border-2 border-neutral-900 bg-neutral-900 text-white hover:bg-neutral-800"
                icon={
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                  </svg>
                }
              >
                Sign in with Apple
              </Button>
            </div>
          </CardContent>

          <CardFooter className="justify-center">
            <p className="text-text-secondary text-sm">
              Don&apos;t have an account?{' '}
              <Link
                href="/signup"
                className="text-primary hover:text-primary-600 font-medium transition-colors"
              >
                Sign up
              </Link>
            </p>
          </CardFooter>
        </Card>

        {/* Footer */}
        <p className="text-center text-text-muted text-sm mt-8">
          By signing in, you agree to our{' '}
          <Link href="/terms" className="text-primary hover:underline">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link href="/privacy" className="text-primary hover:underline">
            Privacy Policy
          </Link>
        </p>
      </div>
    </div>
  );
}
