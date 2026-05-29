/**
 * Next.js Middleware — Route Protection + i18n locale routing
 *
 * This middleware composes two responsibilities:
 *  1. Auth gating for the (app) route group and guest-only pages.
 *  2. Locale routing for marketing pages via next-intl.
 *
 * For now, only marketing routes are localized. The (app) group, /api,
 * /admin, /debug, /diagnostics still serve English-only until Phase 3.
 *
 * Edge runtime limitations: Firebase Admin SDK cannot run here, so full
 * token verification still happens in API route handlers and AppGate.
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

const intlMiddleware = createIntlMiddleware(routing);

// ─── Route groups (locale-prefix-agnostic) ──────────────────────────────────

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

const GUEST_ONLY_ROUTES = ['/login', '/signup'];

const PUBLIC_API_ROUTES = [
  '/api/stripe/webhook',
];

const NON_LOCALIZED_PREFIXES = [
  '/api',
  '/admin',
  '/debug',
  '/diagnostics',
];

// Match a leading locale segment (excluding 'en', which is the unprefixed
// default). Used to strip the prefix before route-class checks.
const LOCALE_PREFIX_PATTERN = /^\/(es|fr|de|ja|it|pt-BR|ko|zh|ru|hi)(?=\/|$)/;

function stripLocale(pathname: string): string {
  const stripped = pathname.replace(LOCALE_PREFIX_PATTERN, '');
  return stripped === '' ? '/' : stripped;
}

function hasSessionCookie(request: NextRequest): boolean {
  return request.cookies.has('__session') || request.cookies.has('auth-token');
}

function matchesRouteList(pathname: string, list: string[]): boolean {
  return list.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

function isAuthenticatedRoute(pathname: string): boolean {
  return matchesRouteList(stripLocale(pathname), AUTHENTICATED_ROUTES);
}

function isGuestOnlyRoute(pathname: string): boolean {
  return matchesRouteList(stripLocale(pathname), GUEST_ONLY_ROUTES);
}

function isNonLocalizedRoute(pathname: string): boolean {
  return NON_LOCALIZED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function isPublicApiRoute(pathname: string): boolean {
  return PUBLIC_API_ROUTES.some((route) => pathname.startsWith(route));
}

// ─── Security headers ───────────────────────────────────────────────────────

const CSP_HEADER = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://unpkg.com https://www.googletagmanager.com https://apis.google.com https://vercel.live",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
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
    'https://*.cloudfunctions.net',
    'wss://*.firebaseio.com',
  ].join(' '),
  "frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://accounts.google.com https://*.firebaseapp.com https://appleid.apple.com https://vercel.live https://appetize.io https://*.appetize.io",
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
  response.headers.set('Cross-Origin-Opener-Policy', 'unsafe-none');
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(self), geolocation=(self)');
  return response;
}

// ─── Middleware ─────────────────────────────────────────────────────────────

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

  // Stripe webhook is intentionally public — no locale, no auth gate.
  if (isPublicApiRoute(pathname)) {
    return addSecurityHeaders(NextResponse.next());
  }

  const sessionExists = hasSessionCookie(request);

  // Authenticated routes aren't localized yet — if a locale-prefixed URL
  // points to one (e.g. /de/dashboard) redirect to the unprefixed version.
  if (LOCALE_PREFIX_PATTERN.test(pathname)) {
    const stripped = stripLocale(pathname);
    if (matchesRouteList(stripped, AUTHENTICATED_ROUTES) || isNonLocalizedRoute(stripped)) {
      const url = new URL(stripped + request.nextUrl.search, request.url);
      return NextResponse.redirect(url);
    }
  }

  // Guest-only routes: redirect signed-in users to the app.
  if (isGuestOnlyRoute(pathname) && sessionExists) {
    const redirectParam = request.nextUrl.searchParams.get('redirect');
    const destination = redirectParam || '/dashboard';
    return NextResponse.redirect(new URL(destination, request.url));
  }

  // Authenticated routes: gate unauthenticated users.
  if (isAuthenticatedRoute(pathname) && !sessionExists) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Non-localized paths (api, admin, debug, diagnostics) and authenticated
  // routes: skip locale routing, just add headers.
  if (isNonLocalizedRoute(pathname) || isAuthenticatedRoute(pathname)) {
    return addSecurityHeaders(NextResponse.next());
  }

  // Marketing routes: hand off to next-intl for locale rewrite/redirect.
  const intlResponse = intlMiddleware(request);
  return addSecurityHeaders(intlResponse);
}

export const config = {
  matcher: [
    // Match everything except Next internals, favicon, and ANY file with
    // an extension (e.g. /logo.png, /screenshots/*.png, /videos/*.mp4).
    // Without the dot-pattern, next-intl tries to apply locale routing to
    // public-folder assets and breaks image serving.
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
};
