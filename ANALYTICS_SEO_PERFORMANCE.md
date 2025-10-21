# Analytics, SEO & Performance Implementation

## Overview

This document provides complete information about the analytics tracking, SEO optimization, and performance monitoring implemented in CaddyAI.

## Table of Contents

1. [Google Analytics 4](#google-analytics-4)
2. [Event Tracking](#event-tracking)
3. [SEO Optimization](#seo-optimization)
4. [Performance Monitoring](#performance-monitoring)
5. [Error Tracking](#error-tracking)
6. [Configuration](#configuration)
7. [Testing](#testing)

---

## Google Analytics 4

### Setup

1. **Get your GA4 Measurement ID:**
   - Visit [Google Analytics](https://analytics.google.com)
   - Create a new GA4 property
   - Copy your Measurement ID (format: `G-XXXXXXXXXX`)

2. **Add to environment variables:**
   ```bash
   NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
   ```

3. **Automatic tracking:**
   - Page views are tracked automatically via `components/GoogleAnalytics.tsx`
   - The component is included in the root layout
   - No additional setup needed

### Files

- `lib/analytics.ts` - Analytics utilities and event tracking functions
- `components/GoogleAnalytics.tsx` - GA4 script loader and page view tracking

---

## Event Tracking

### Available Events

All event tracking functions are available in `lib/analytics.ts`:

#### Authentication Events
```typescript
import { trackSignUp, trackLogin } from '@/lib/analytics';

// Track sign up
trackSignUp('email'); // 'email' | 'google' | 'apple'

// Track login
trackLogin('google');
```

#### Golf Activity
```typescript
import { trackStartRound, trackEndRound } from '@/lib/analytics';

// Track round start
trackStartRound('Pebble Beach Golf Links');

// Track round end
trackEndRound(18); // number of holes played
```

#### Club Recommendations
```typescript
import { trackClubRecommendation, trackClubSelection } from '@/lib/analytics';

// Track AI recommendation viewed
trackClubRecommendation('7 Iron', 150);

// Track club selected by user
trackClubSelection('7 Iron');
```

#### Course Search
```typescript
import { trackCourseSearch, trackCourseSelected } from '@/lib/analytics';

// Track search query
trackCourseSearch('pebble beach');

// Track course selection
trackCourseSelected('Pebble Beach Golf Links');
```

#### App Download
```typescript
import { trackDownloadClick } from '@/lib/analytics';

// Track download button click
trackDownloadClick('ios'); // 'ios' | 'android'
```

#### Pricing & Conversion
```typescript
import { trackPricingView, trackPlanSelect } from '@/lib/analytics';

// Track pricing page view
trackPricingView('Premium');

// Track plan selection
trackPlanSelect('Premium');
```

#### Form Events
```typescript
import { trackFormSubmit, trackFormError } from '@/lib/analytics';

// Track form submission
trackFormSubmit('contact-form');

// Track form error
trackFormError('signup-form', 'Invalid email');
```

#### Error Tracking
```typescript
import { trackError } from '@/lib/analytics';

// Track application errors
trackError('Failed to load courses', 'CourseList component');
```

#### User Identification
```typescript
import { identifyUser, setUserProperties } from '@/lib/analytics';

// Identify authenticated user
identifyUser('user123', {
  handicap: 12,
  membershipLevel: 'Premium',
  clubCount: 14,
});

// Set custom user properties
setUserProperties({
  favoriteClub: '7 Iron',
  averageScore: 85,
});
```

### Custom Event Tracking

Create custom events using the generic `event()` function:

```typescript
import { event } from '@/lib/analytics';

event({
  action: 'custom_action',
  category: 'Custom Category',
  label: 'Custom Label',
  value: 100,
});
```

---

## SEO Optimization

### Metadata Configuration

All pages automatically include comprehensive SEO metadata via `lib/seo.ts`.

#### Default Metadata (Root Layout)

The root layout (`app/layout.tsx`) includes:
- Title and description
- Open Graph tags
- Twitter Card tags
- Icons and manifest
- Structured data (Organization and MobileApp schemas)

#### Page-Specific Metadata

Use `generatePageMetadata()` in any page:

```typescript
// app/features/page.tsx
import { generatePageMetadata } from '@/lib/seo';

export const metadata = generatePageMetadata({
  title: 'Features',
  description: 'Discover CaddyAI powerful features...',
  keywords: ['golf features', 'AI caddy features'],
  path: '/features',
});
```

### Structured Data (Schema.org)

#### Available Schemas

1. **Organization Schema** - Included in root layout
2. **Mobile App Schema** - Included in root layout
3. **Breadcrumb Schema** - Use on nested pages
4. **FAQ Schema** - Use on help/FAQ pages
5. **Product Schema** - Use on pricing page

#### Examples

```typescript
import {
  StructuredData,
  generateBreadcrumbSchema,
  generateFAQSchema,
  generateProductSchema
} from '@/lib/seo';

// Breadcrumb example (app/features/page.tsx)
export default function FeaturesPage() {
  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Features', url: '/features' },
  ];

  return (
    <>
      <StructuredData data={generateBreadcrumbSchema(breadcrumbs)} />
      {/* Page content */}
    </>
  );
}

// FAQ example (app/help/page.tsx)
const faqs = [
  {
    question: 'How does CaddyAI work?',
    answer: 'CaddyAI uses artificial intelligence...',
  },
];

<StructuredData data={generateFAQSchema(faqs)} />

// Product example (app/pricing/page.tsx)
<StructuredData
  data={generateProductSchema({
    name: 'CaddyAI Premium',
    description: 'Premium golf caddy features',
    price: '9.99',
  })}
/>
```

### Sitemap & Robots.txt

#### Sitemap
- Auto-generated at `/sitemap.xml`
- Includes all public pages
- Update priorities in `app/sitemap.ts`

#### Robots.txt
- Auto-generated at `/robots.txt`
- Configured to allow all search engines except AI crawlers
- Disallows: `/api/`, `/dashboard/`, `/profile/`
- Update rules in `app/robots.ts`

---

## Performance Monitoring

### Core Web Vitals Tracking

Performance monitoring is automatic when implemented. Initialize on pages:

```typescript
'use client';

import { useEffect } from 'react';
import { initPerformanceTracking } from '@/lib/performance';

export default function HomePage() {
  useEffect(() => {
    const cleanup = initPerformanceTracking('Home');
    return cleanup;
  }, []);

  return (/* page content */);
}
```

### Tracked Metrics

1. **Core Web Vitals:**
   - LCP (Largest Contentful Paint) - Target: < 2.5s
   - FID (First Input Delay) - Target: < 100ms
   - CLS (Cumulative Layout Shift) - Target: < 0.1

2. **Loading Performance:**
   - FCP (First Contentful Paint) - Target: < 1.8s
   - TTFB (Time to First Byte) - Target: < 600ms

3. **User Engagement:**
   - Scroll depth (25%, 50%, 75%, 100%)
   - Time on page (10s, 30s, 60s, 2m, 5m)

4. **Resource Timing:**
   - Script loading time
   - Stylesheet loading time
   - Image loading time
   - Total page weight

### Performance Budget

Configured in `performance-budget.json`:

```json
{
  "budgets": [
    {
      "resourceSizes": [
        { "resourceType": "script", "budget": 300 },
        { "resourceType": "image", "budget": 500 },
        { "resourceType": "total", "budget": 1000 }
      ]
    }
  ]
}
```

### Next.js Optimizations

Configured in `next.config.ts`:

1. **Image Optimization:**
   - WebP and AVIF formats
   - Responsive images
   - Lazy loading by default
   - Blur placeholders

2. **Code Optimization:**
   - SWC minification
   - Tree shaking
   - Code splitting
   - Package import optimization

3. **Caching:**
   - Static assets: 1 year
   - Images: CDN caching
   - Compression: gzip/brotli

4. **Security Headers:**
   - X-Frame-Options
   - X-Content-Type-Options
   - Referrer-Policy
   - Permissions-Policy

### Optimized Image Component

Use `OptimizedImage` instead of `next/image` for best practices:

```typescript
import OptimizedImage from '@/components/OptimizedImage';

<OptimizedImage
  src="/hero.jpg"
  alt="Golf course"
  width={1200}
  height={630}
  priority // for above-fold images
/>
```

---

## Error Tracking

### Sentry Setup (Optional)

1. **Install Sentry:**
   ```bash
   npm install @sentry/nextjs
   ```

2. **Configure environment variable:**
   ```bash
   NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn_here
   ```

3. **Uncomment Sentry code in `lib/sentry.ts`**

### Error Boundary

Automatically catches React errors:

```typescript
// Included in root layout
import { ErrorBoundary } from '@/components/ErrorBoundary';

<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>
```

### Manual Error Tracking

```typescript
import { captureException, captureMessage } from '@/lib/sentry';

try {
  // Your code
} catch (error) {
  captureException(error as Error, {
    context: 'Additional context',
    userId: 'user123',
  });
}

// Log messages
captureMessage('Important event occurred', 'info');
```

---

## Configuration

### Environment Variables

Add to `.env.local`:

```bash
# Required
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX

# Optional
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn_here
NEXT_PUBLIC_ERROR_ENDPOINT=https://your-api.com/errors
```

### Vercel Analytics

Built-in with Vercel deployment:

1. Enable in Vercel dashboard
2. Provides real user monitoring
3. Core Web Vitals tracking
4. No additional setup needed

---

## Testing

### Test Checklist

#### Analytics
- [ ] Page views tracked correctly
- [ ] Sign up events fire
- [ ] Login events fire
- [ ] Club recommendation events fire
- [ ] Course search events fire
- [ ] Download button clicks tracked
- [ ] Form submissions tracked
- [ ] Error events fire

#### SEO
- [ ] All pages have unique titles
- [ ] Meta descriptions present
- [ ] Open Graph tags correct
- [ ] Twitter Cards validate
- [ ] Structured data validates (use [Schema.org validator](https://validator.schema.org/))
- [ ] Sitemap accessible at `/sitemap.xml`
- [ ] Robots.txt accessible at `/robots.txt`
- [ ] Canonical URLs correct

#### Performance
- [ ] LCP < 2.5s on 3G
- [ ] FID < 100ms
- [ ] CLS < 0.1
- [ ] Images lazy load
- [ ] WebP format served
- [ ] No console errors in production
- [ ] Mobile performance good (Lighthouse > 90)

### Testing Tools

1. **Google Analytics Debugger:**
   - Install [GA Debugger Chrome Extension](https://chrome.google.com/webstore/detail/google-analytics-debugger)
   - Check browser console for event logs

2. **SEO Testing:**
   - [Google Rich Results Test](https://search.google.com/test/rich-results)
   - [Schema.org Validator](https://validator.schema.org/)
   - [Open Graph Debugger](https://www.opengraph.xyz/)
   - [Twitter Card Validator](https://cards-dev.twitter.com/validator)

3. **Performance Testing:**
   - [Google PageSpeed Insights](https://pagespeed.web.dev/)
   - [WebPageTest](https://www.webpagetest.org/)
   - Chrome DevTools Lighthouse
   - Chrome DevTools Performance tab

4. **Vercel Testing:**
   ```bash
   # Test production build locally
   npm run build
   npm run start
   ```

### Manual Testing

1. **Analytics Events:**
   ```javascript
   // Open browser console
   // Check for gtag events
   window.dataLayer // Should show event data
   ```

2. **Performance:**
   ```javascript
   // Check Core Web Vitals
   new PerformanceObserver((list) => {
     for (const entry of list.getEntries()) {
       console.log(entry.name, entry.value);
     }
   }).observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] });
   ```

---

## Maintenance

### Regular Tasks

1. **Monthly:**
   - Review GA4 reports
   - Check Core Web Vitals in Search Console
   - Update sitemap if new pages added
   - Review error logs

2. **Quarterly:**
   - Audit SEO performance
   - Review and update keywords
   - Test all critical user flows
   - Update structured data if needed

3. **Yearly:**
   - Review and update meta descriptions
   - Audit and optimize images
   - Review privacy and analytics policies
   - Update Open Graph images

---

## Resources

- [Google Analytics 4 Documentation](https://support.google.com/analytics/answer/10089681)
- [Next.js Analytics](https://nextjs.org/docs/app/building-your-application/optimizing/analytics)
- [Core Web Vitals](https://web.dev/vitals/)
- [Schema.org Documentation](https://schema.org/)
- [Vercel Analytics](https://vercel.com/docs/concepts/analytics)

---

## Support

For issues or questions:
1. Check this documentation
2. Review [Next.js documentation](https://nextjs.org/docs)
3. Check browser console for errors
4. Review GA4 DebugView for analytics issues

---

**Last Updated:** 2025-10-21
**Version:** 1.0.0
