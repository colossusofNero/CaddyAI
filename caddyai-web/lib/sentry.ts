// Sentry Error Tracking Configuration
// Note: Install @sentry/nextjs with: npm install @sentry/nextjs

// This file is a template. Uncomment and configure when Sentry is installed.

/*
import * as Sentry from '@sentry/nextjs';

export const initSentry = () => {
  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      environment: process.env.NODE_ENV,

      // Performance Monitoring
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

      // Session Replay
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,

      // Release tracking
      release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,

      // Error filtering
      ignoreErrors: [
        'ResizeObserver loop limit exceeded',
        'Non-Error promise rejection captured',
        'ChunkLoadError',
      ],

      beforeSend(event, hint) {
        // Filter out errors from browser extensions
        if (event.exception) {
          const error = hint.originalException as Error;
          if (error && error.message && error.message.includes('extension://')) {
            return null;
          }
        }
        return event;
      },
    });
  }
};

// Custom error tracking
export const captureException = (error: Error, context?: Record<string, any>) => {
  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    Sentry.captureException(error, {
      contexts: {
        custom: context,
      },
    });
  } else {
    console.error('Error:', error, context);
  }
};

export const captureMessage = (message: string, level: 'info' | 'warning' | 'error' = 'info') => {
  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    Sentry.captureMessage(message, level);
  } else {
    console.log(`[${level}]`, message);
  }
};

// Set user context
export const setUser = (user: { id: string; email?: string; username?: string }) => {
  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    Sentry.setUser(user);
  }
};

export const clearUser = () => {
  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    Sentry.setUser(null);
  }
};

// Add breadcrumb for debugging
export const addBreadcrumb = (message: string, category: string, data?: Record<string, any>) => {
  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    Sentry.addBreadcrumb({
      message,
      category,
      data,
      level: 'info',
    });
  }
};

// Performance monitoring
export const startTransaction = (name: string, op: string) => {
  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    return Sentry.startTransaction({
      name,
      op,
    });
  }
  return null;
};
*/

// Fallback error tracking without Sentry
export const captureException = (error: Error, context?: Record<string, any>) => {
  console.error('Error:', error, context);

  // You can also send to your own error logging endpoint
  if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_ERROR_ENDPOINT) {
    fetch(process.env.NEXT_PUBLIC_ERROR_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: {
          message: error.message,
          stack: error.stack,
          name: error.name,
        },
        context,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent,
      }),
    }).catch(console.error);
  }
};

export const captureMessage = (message: string, level: 'info' | 'warning' | 'error' = 'info') => {
  console.log(`[${level}]`, message);
};

export const setUser = (user: { id: string; email?: string; username?: string }) => {
  // Store user context for error reporting
  if (typeof window !== 'undefined') {
    (window as any).__user_context = user;
  }
};

export const clearUser = () => {
  if (typeof window !== 'undefined') {
    delete (window as any).__user_context;
  }
};

export const addBreadcrumb = (message: string, category: string, data?: Record<string, any>) => {
  // Log breadcrumbs for debugging
  console.log(`[Breadcrumb ${category}]`, message, data);
};
