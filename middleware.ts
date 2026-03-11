/**
 * Next.js Middleware — Route Protection (WEB-02)
 *
 * This middleware is the first layer of defence for premium and authenticated
 * routes. It runs before any page or API route is rendered.
 *
 * What it does:
 *  - Redirects completely unauthenticated visitors away from the (app) group
 *    (dashboard, analytics, recommendations, etc.) to /login.
 *  - Adds security headers (CSP, HSTS, etc.) to every response.
 *
 * Limitations of Edge runtime:
 *  Firebase Admin SDK cannot run in the Edge runtime, so full token
 *  verification is not possible here. The real server-side enforcement of
 *  subscription status happens in:
 *    1. /api/stripe/subscription  — verifies Firebase ID token + ownership
 *    2. /api/stripe/checkout      — verifies Firebase ID token + ownership
 *    3. /api/stripe/portal        — verifies Firebase ID token + ownership
 *    4. AppGate (app/(app)/layout.tsx) — client-side guard that redirects to
 *       /start-trial when the server-verified subscription status is "free".
 *
 * This middleware protects against casual/bot direct-URL access to premium
 * pages and hardens HTTP headers across the whole application.
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// ─── Route groups ────────────────────────────────────────────────────────────

/**
 * Routes that require the user to be authenticated.
 * These map to the Next.js (app) route group.
 */
const AUTHENTICATED_ROUTES = [
  '/dashboard',
  '/analytics',
  '/recommendations',
  '/clubs',
  '/shots',
  '/history',
  '/scores',
  '/round',
  '/profile',
  '/settings',
];

/**
 * Routes that should only be accessible to unauthenticated users.
 * Redirect to /dashboard if a session cookie is present.
 */
const GUEST_ONLY_ROUTES = ['/login', '/signup'];

/**
 * API routes that are public (no auth required).
 * Everything not in this list will pass through — API auth is enforced
 * inside each individual route handler with the Admin SDK.
 */
const PUBLIC_API_ROUTES = [
  '/api/stripe/webhook', // must be public for Stripe to call it
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Returns true when the request carries a Firebase auth session cookie.
 *
 * Firebase Auth (client SDK) stores tokens in IndexedDB, not cookies, so
 * this check looks for the presence of the `__session` cookie that
 * Firebase Hosting sets, OR a custom `auth-token` cookie that can be
 * written by the app on sign-in for middleware use.
 *
 * If neither cookie is present the middleware conservatively treats the
 * user as unauthenticated and redirects to /login — the client-side auth
 * state will hydrate immediately and redirect back if the user actually
 * has a valid Firebase session stored in IndexedDB.
 */
function hasSessionCookie(request: NextRequest): boolean {
  return (
    request.cookies.has('__session') ||
    request.cookies.has('auth-token')
  );
}

function isAuthenticatedRoute(pathname: string): boolean {
  return AUTHENTICATED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

function isGuestOnlyRoute(pathname: string): boolean {
  return GUEST_ONLY_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

function isPublicApiRoute(pathname: string): boolean {
  return PUBLIC_API_ROUTES.some((route) => pathname.startsWith(route));
}

// ─── Security headers ────────────────────────────────────────────────────────

/**
 * Content Security Policy.
 *
 * Tightened to limit what third-party scripts can do (WEB-05).
 *
 * Key decisions:
 *  - script-src: allows 'self', Next.js inline scripts (via nonce would be
 *    better but requires dynamic rendering — this is a pragmatic baseline).
 *    unpkg is allowed only for the pinned ElevenLabs widget version.
 *  - connect-src: Firebase, Stripe, RevenueCat, GA4.
 *  - frame-src: Stripe Checkout iframe.
 *  - object-src 'none': prevents Flash/plugin exploits.
 */
const CSP_HEADER = [
  "default-src 'self'",
  // Allow Next.js hydration inline scripts + Google Sign-In + ElevenLabs from pinned version
  "script-src 'self' 'unsafe-inline' https://unpkg.com https://www.googletagmanager.com https://apis.google.com https://vercel.live",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  // Firebase, Stripe, RevenueCat, ElevenLabs API, GA
  [
    "connect-src 'self'",
    'https://*.firebaseio.com',
    'https://*.googleapis.com',
    'https://*.firebaseapp.com',
    'https://firestore.googleapis.com',
    'https://identitytoolkit.googleapis.com',
    'https://securetoken.googleapis.com',
    'https://api.stripe.com',
    'https://api.revenuecat.com',
    'https://api.elevenlabs.io',
    'https://www.google-analytics.com',
    'https://region1.google-analytics.com',
    'wss://*.firebaseio.com',
  ].join(' '),
  // Stripe Checkout + Google Sign-In + Apple Sign-In + Firebase auth popups + Vercel
  "frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://accounts.google.com https://*.firebaseapp.com https://appleid.apple.com https://vercel.live",
  "img-src 'self' data: https: blob:",
  "media-src 'self' blob: https://api.elevenlabs.io",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  'upgrade-insecure-requests',
].join('; ');

function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('Content-Security-Policy', CSP_HEADER);
  // Allow Firebase signInWithPopup to communicate back from the popup window.
  // Without this, Chrome's COOP enforcement blocks window.closed checks.
  response.headers.set('Cross-Origin-Opener-Policy', 'unsafe-none');
  // HSTS — tell browsers to use HTTPS for 1 year
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains; preload'
  );
  // Already set in next.config.ts but reinforce here
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(self), geolocation=(self)'
  );
  return response;
}

// ─── Middleware ───────────────────────────────────────────────────────────────

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip Next.js internals and static assets
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/icons') ||
    pathname.startsWith('/manifest') ||
    pathname === '/favicon.ico' ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml'
  ) {
    return NextResponse.next();
  }

  // Stripe webhook is intentionally public
  if (isPublicApiRoute(pathname)) {
    return addSecurityHeaders(NextResponse.next());
  }

  const sessionExists = hasSessionCookie(request);

  // Redirect authenticated users away from guest-only pages
  if (isGuestOnlyRoute(pathname) && sessionExists) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Redirect unauthenticated users away from authenticated routes
  if (isAuthenticatedRoute(pathname) && !sessionExists) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // All other requests — pass through with security headers
  return addSecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static  (static files)
     * - _next/image   (image optimisation)
     * - favicon.ico
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
