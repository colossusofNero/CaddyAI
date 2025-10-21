# Download Page - CaddyAI

## Overview
Comprehensive mobile app download page with App Store and Google Play links, QR codes, features, screenshots, and FAQs.

## Features

### 1. Smart Platform Detection
- Automatically detects user's device (iOS/Android/Desktop)
- Shows appropriate download button prominently
- Displays device-specific messaging

### 2. Download Buttons
- Apple App Store button (Apple HIG compliant)
- Google Play button (compliant with Google Play badge guidelines)
- QR code functionality for desktop users
- Animated hover effects

### 3. Hero Section
- Large heading with CTA
- Phone mockup with app preview
- Social proof stats (ratings, downloads, rounds tracked)
- Floating animated elements

### 4. Features Section
- 6 key features with icons:
  - Smart Club Selection
  - Real-time Weather
  - GPS Course Maps
  - Performance Tracking
  - Progress Insights
  - Shot Tracking

### 5. Screenshot Carousel
- Interactive carousel with 8 app screenshots
- Swipe gestures support
- Auto-advance functionality
- Thumbnail navigation
- Indicator dots

### 6. How It Works
- 3-step process:
  1. Download & Install
  2. Set Up Your Profile
  3. Start Playing

### 7. System Requirements
- iOS requirements (iOS 14.0+, 50MB storage)
- Android requirements (Android 8.0+, 50MB storage)

### 8. FAQ Section
- 6 common questions with expandable answers
- Smooth animations

### 9. Final CTA
- Prominent call-to-action with both download buttons
- Primary color background

## Components

### DownloadButton Component
Located: `components/download/DownloadButton.tsx`

Props:
- `platform`: 'ios' | 'android'
- `variant`: 'primary' | 'secondary' (optional)
- `showQR`: boolean (optional) - Shows QR code button for desktop users
- `className`: string (optional)

Features:
- Platform-specific icons and styling
- QR code generation using `qrcode` library
- Opens in new tab with proper rel attributes

### ScreenshotCarousel Component
Located: `components/download/ScreenshotCarousel.tsx`

Features:
- 8 app screenshots with titles and descriptions
- Swipe gesture support
- Auto-advance every 5 seconds
- Thumbnail navigation
- Indicator dots
- Phone frame mockup

### Platform Detection
Function: `detectPlatform()`

Returns:
- 'ios' - for iPad/iPhone/iPod
- 'android' - for Android devices
- 'desktop' - for all other devices

## SEO Optimization

### Metadata (layout.tsx)
- Title: "Download CaddyAI - AI Golf Caddy App for iOS & Android"
- Description: Comprehensive app description
- Keywords: Golf app, AI caddy, GPS, etc.
- Open Graph tags for social sharing
- Twitter card metadata
- Canonical URL
- App store smart banners

### Schema.org JSON-LD
- MobileApplication schema
- Aggregate ratings
- Download URLs
- Screenshots
- Publisher information

## App Store Links

### Current Links (TODO: Update with actual IDs)
```typescript
const APP_LINKS = {
  ios: 'https://apps.apple.com/app/caddyai/id123456789', // TODO: Replace
  android: 'https://play.google.com/store/apps/details?id=com.caddyai.app'
};
```

### To Update:
1. Replace `id123456789` with actual App Store ID in:
   - `components/download/DownloadButton.tsx`
   - `app/download/layout.tsx`
2. Confirm Android package ID is correct

## Screenshots

### Required Screenshots (Add to /public/images/app/):
1. `screenshot-club-recommendation.jpg` - Club selection screen
2. `screenshot-course-map.jpg` - GPS course map
3. `screenshot-round-tracking.jpg` - Live scorecard
4. `screenshot-stats-dashboard.jpg` - Statistics
5. `screenshot-profile.jpg` - User profile
6. `screenshot-weather.jpg` - Weather overlay
7. `screenshot-shot-history.jpg` - Shot tracking
8. `screenshot-insights.jpg` - AI insights

### Screenshot Specifications:
- Format: JPG or PNG
- Dimensions: 1242x2688 (iPhone) or 1080x1920 (Android)
- Optimized for web (< 200KB each)

## Open Graph Images

### Required Images:
1. `/public/images/og-download.jpg` - 1200x630px
2. `/public/images/twitter-download.jpg` - 1200x600px

## Testing Checklist

- [ ] Download buttons open correct app store pages
- [ ] QR codes generate correctly
- [ ] QR codes scan properly on mobile devices
- [ ] Platform detection works on iOS devices
- [ ] Platform detection works on Android devices
- [ ] Platform detection works on desktop
- [ ] Screenshot carousel swipe gestures work
- [ ] Screenshot carousel auto-advance works
- [ ] FAQ accordion expands/collapses
- [ ] Page is responsive on mobile
- [ ] Page is responsive on tablet
- [ ] All animations work smoothly
- [ ] Page loads quickly (< 2s)
- [ ] Schema markup validates (Google Rich Results Test)
- [ ] Open Graph tags display correctly (Facebook Debugger)
- [ ] Twitter cards display correctly (Twitter Card Validator)

## Performance

- Target Lighthouse score: 90+
- Target First Contentful Paint: < 1.5s
- Target Largest Contentful Paint: < 2.5s
- Target Time to Interactive: < 3.5s

## Accessibility

- All buttons have proper aria-labels
- Keyboard navigation supported
- Color contrast meets WCAG AA standards
- Screen reader compatible

## Browser Support

- Chrome/Edge 90+
- Safari 14+
- Firefox 88+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Dependencies

- `qrcode`: ^1.5.3 - QR code generation
- `@types/qrcode`: ^1.5.0 - TypeScript types for qrcode
- `framer-motion`: For animations
- `lucide-react`: For icons

## Future Enhancements

- [ ] Apple Watch app section
- [ ] Video demo/trailer
- [ ] User testimonials carousel
- [ ] App screenshots from actual app (currently placeholders)
- [ ] Deep linking support
- [ ] App clip / Instant App integration
- [ ] Multi-language support
- [ ] A/B testing for CTA buttons
