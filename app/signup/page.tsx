/**
 * Signup Page
 * User registration with email/password and Google Sign-In
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
const signupSchema = z
  .object({
    displayName: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type SignupFormData = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const router = useRouter();
  const { signUp, signInWithGoogle, error: authError, clearError } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  });

  // Handle email/password signup
  const onSubmit = async (data: SignupFormData) => {
    try {
      setIsLoading(true);
      clearError();
      await signUp(data.email, data.password, data.displayName);
      setShowSuccess(true);
      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch {
      // Error is handled by useAuth
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Google Sign-In
  const handleGoogleSignIn = async () => {
    try {
      setGoogleLoading(true);
      clearError();
      await signInWithGoogle();
      router.push('/dashboard');
    } catch {
      // Error is handled by useAuth
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2">CaddyAI</h1>
          <p className="text-text-secondary">Your intelligent golf companion</p>
        </div>

        <Card variant="elevated" padding="lg">
          <CardHeader
            title="Create your account"
            description="Join CaddyAI and improve your golf game"
          />

          <CardContent>
            {/* Success message */}
            {showSuccess && (
              <div className="bg-success bg-opacity-10 border border-success text-success px-4 py-3 rounded-lg mb-4 flex items-start gap-2">
                <svg
                  className="w-5 h-5 mt-0.5 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <div className="text-sm">
                  <p className="font-medium">Account created successfully!</p>
                  <p className="text-success text-opacity-80">
                    Please check your email to verify your account.
                  </p>
                </div>
              </div>
            )}

            {/* Error message */}
            {authError && !showSuccess && (
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

            {/* Signup form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                label="Full Name"
                type="text"
                placeholder="John Doe"
                error={errors.displayName?.message}
                fullWidth
                {...register('displayName')}
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
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                }
              />

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
                helperText="At least 6 characters"
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

              <Input
                label="Confirm Password"
                type="password"
                placeholder="••••••••"
                error={errors.confirmPassword?.message}
                fullWidth
                {...register('confirmPassword')}
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
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                }
              />

              <Button
                type="submit"
                fullWidth
                loading={isLoading}
                disabled={isLoading || googleLoading || showSuccess}
              >
                Create Account
              </Button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-secondary-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-secondary text-text-secondary">
                  Or continue with
                </span>
              </div>
            </div>

            {/* Google Sign-In */}
            <Button
              type="button"
              variant="outline"
              fullWidth
              loading={googleLoading}
              disabled={isLoading || googleLoading || showSuccess}
              onClick={handleGoogleSignIn}
              icon={
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
              }
            >
              Sign up with Google
            </Button>
          </CardContent>

          <CardFooter className="justify-center">
            <p className="text-text-secondary text-sm">
              Already have an account?{' '}
              <Link
                href="/login"
                className="text-primary hover:text-primary-600 font-medium transition-colors"
              >
                Sign in
              </Link>
            </p>
          </CardFooter>
        </Card>

        {/* Footer */}
        <p className="text-center text-text-muted text-sm mt-8">
          By creating an account, you agree to our{' '}
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
