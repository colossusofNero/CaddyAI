# Analytics & SEO Quick Reference

Quick reference for implementing analytics, SEO, and performance features in CaddyAI.

---

## 🚀 Quick Start

### 1. Set Environment Variables

```bash
# .env.local
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

### 2. Everything Else is Auto-Configured! ✅

Analytics, SEO, and performance tracking are automatically enabled via the root layout.

---

## 📊 Track Events

### Import & Use

```typescript
import {
  trackSignUp,
  trackLogin,
  trackStartRound,
  trackClubRecommendation,
  trackDownloadClick,
} from '@/lib/analytics';

// Authentication
trackSignUp('email'); // or 'google', 'apple'
trackLogin('google');

// Golf Activity
trackStartRound('Pebble Beach');
trackEndRound(18);

// AI Features
trackClubRecommendation('7 Iron', 150);
trackClubSelection('7 Iron');

// Course Search
trackCourseSearch('pebble beach');
trackCourseSelected('Pebble Beach Golf Links');

// Conversions
trackDownloadClick('ios'); // or 'android'
trackPricingView('Premium');
trackPlanSelect('Premium');

// Forms
trackFormSubmit('contact-form');
trackFormError('signup-form', 'Invalid email');

// Errors
trackError('Failed to load', 'CourseList');
```

### User Identification

```typescript
import { identifyUser } from '@/lib/analytics';

identifyUser('user123', {
  handicap: 12,
  membershipLevel: 'Premium',
  clubCount: 14,
});
```

---

## 🎯 SEO for New Pages

### Add Metadata

```typescript
// app/your-page/page.tsx
import { generatePageMetadata } from '@/lib/seo';

export const metadata = generatePageMetadata({
  title: 'Your Page Title',
  description: 'Your page description...',
  keywords: ['keyword1', 'keyword2'],
  path: '/your-page',
});
```

### Add Structured Data

```typescript
import { StructuredData, generateBreadcrumbSchema } from '@/lib/seo';

export default function YourPage() {
  return (
    <>
      <StructuredData
        data={generateBreadcrumbSchema([
          { name: 'Home', url: '/' },
          { name: 'Your Page', url: '/your-page' },
        ])}
      />
      {/* Your content */}
    </>
  );
}
```

---

## ⚡ Performance Tracking

### Initialize on Pages

```typescript
'use client';

import { useEffect } from 'react';
import { initPerformanceTracking } from '@/lib/performance';

export default function YourPage() {
  useEffect(() => {
    const cleanup = initPerformanceTracking('YourPage');
    return cleanup;
  }, []);

  return (/* content */);
}
```

---

## 🖼️ Optimized Images

### Use OptimizedImage Component

```typescript
import OptimizedImage from '@/components/OptimizedImage';

// Above the fold (priority)
<OptimizedImage
  src="/hero.jpg"
  alt="Hero image"
  width={1200}
  height={630}
  priority
/>

// Below the fold (lazy load)
<OptimizedImage
  src="/feature.jpg"
  alt="Feature"
  width={800}
  height={600}
/>
```

---

## 🐛 Error Tracking

### Log Errors

```typescript
import { captureException, captureMessage } from '@/lib/sentry';

try {
  // Your code
} catch (error) {
  captureException(error as Error, {
    context: 'Additional info',
  });
}

// Log important events
captureMessage('User completed tutorial', 'info');
```

---

## 📋 Checklist for New Features

When adding a new feature, remember to:

- [ ] Add analytics events for key actions
- [ ] Add page metadata (if new page)
- [ ] Add structured data (if applicable)
- [ ] Use OptimizedImage for images
- [ ] Add error handling with captureException
- [ ] Update sitemap.ts (if new public page)
- [ ] Test analytics events in browser console
- [ ] Test SEO with Rich Results Test

---

## 🧪 Testing

### Test Analytics Events

```javascript
// Browser console
window.dataLayer // View all tracked events
```

### Test SEO

- [Rich Results Test](https://search.google.com/test/rich-results)
- [Schema Validator](https://validator.schema.org/)

### Test Performance

- Chrome DevTools > Lighthouse
- [PageSpeed Insights](https://pagespeed.web.dev/)

---

## 📚 Full Documentation

See `ANALYTICS_SEO_PERFORMANCE.md` for complete documentation.

---

## 🆘 Common Issues

### Analytics not tracking?
1. Check `NEXT_PUBLIC_GA_ID` is set
2. Open browser console for errors
3. Use GA Debugger Chrome extension

### SEO not working?
1. Verify metadata in page source
2. Test with Rich Results tool
3. Check robots.txt allows crawling

### Performance issues?
1. Check Lighthouse score
2. Review performance budgets
3. Verify images are optimized

---

**Last Updated:** 2025-10-21
