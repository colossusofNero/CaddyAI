# CaddyAI Responsive Design System

## Overview

CaddyAI follows a **mobile-first responsive design** approach with touch-optimized interfaces that meet WCAG 2.1 Level AAA accessibility standards.

## Breakpoints

We use Tailwind CSS default breakpoints:

```typescript
sm: 640px   // Mobile landscape
md: 768px   // Tablet
lg: 1024px  // Desktop
xl: 1280px  // Large desktop
2xl: 1536px // Extra large
```

## Touch Targets

All interactive elements meet minimum touch target sizes:

### Size Guidelines (WCAG 2.1 Level AAA)
- **Minimum**: 44px × 44px (primary interactive elements)
- **Comfortable**: 48px × 48px (recommended for better UX)
- **Spacious**: 56px × 56px (primary CTAs and important actions)

### Component Implementations

#### Buttons
```typescript
sm: 40px height  // Secondary actions
md: 44px → 48px  // Standard buttons (mobile → desktop)
lg: 48px → 56px  // Primary CTAs (mobile → desktop)
```

#### Inputs
```typescript
height: 44px → 48px  // Mobile → Desktop
font-size: 16px      // Minimum to prevent iOS zoom
```

#### Navigation Links
```typescript
Mobile menu: min 48px height
Desktop nav: standard height with proper padding
```

## Typography Scale

### Mobile-First Responsive Typography

#### Display (Hero Headlines)
```css
text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-[72px]
36px → 48px → 60px → 72px → 72px
```

#### H1 Headings
```css
text-3xl sm:text-4xl md:text-5xl lg:text-6xl
30px → 36px → 48px → 60px
```

#### H2 Headings
```css
text-2xl sm:text-3xl md:text-4xl lg:text-5xl
24px → 30px → 36px → 48px
```

#### H3 Headings
```css
text-xl sm:text-2xl md:text-3xl lg:text-4xl
20px → 24px → 30px → 36px
```

#### Body Text
```css
text-base md:text-lg lg:text-xl
16px → 18px → 20px
```

#### Small Text
```css
text-sm md:text-base
14px → 16px
```

## Spacing System

### Section Padding
```css
py-12 md:py-16 lg:py-24 xl:py-32
48px → 64px → 96px → 128px
```

### Container Padding
```css
px-4 sm:px-6 lg:px-8
16px → 24px → 32px
```

### Gap Spacing
```css
gap-4 md:gap-6 lg:gap-8
16px → 24px → 32px
```

## Grid Patterns

### Feature Cards (1 → 2 → 3 columns)
```css
grid-cols-1 md:grid-cols-2 lg:grid-cols-3
```

### Stats/Counters (2 → 3 → 4 columns)
```css
grid-cols-2 md:grid-cols-3 lg:grid-cols-4
```

### Two Column Layout
```css
grid-cols-1 lg:grid-cols-2
```

### Footer Columns (2 → 4 columns)
```css
grid-cols-2 lg:grid-cols-4
```

## Mobile Optimization

### iOS Specific
- **Minimum font size**: 16px on inputs (prevents auto-zoom)
- **Viewport meta**: `width=device-width, initial-scale=1, maximum-scale=5`
- **Safe area insets**: Support for notched devices

### Android Specific
- **Touch feedback**: Use `touch-manipulation` CSS for better response
- **Vibration API**: Haptic feedback for important actions

### Performance
- **Image optimization**: Use Next.js `<Image>` with responsive srcsets
- **Lazy loading**: Below-fold content loads on demand
- **Reduced animations**: Respect `prefers-reduced-motion`

## Component Examples

### Responsive Button
```tsx
<Button
  size="lg"
  className="w-full sm:w-auto touch-manipulation"
>
  Primary Action
</Button>
```

### Responsive Input
```tsx
<Input
  label="Email"
  type="email"
  className="h-11 sm:h-12 text-base"
  fullWidth
/>
```

### Responsive Navigation
```tsx
{/* Desktop */}
<div className="hidden lg:flex items-center gap-8">
  {navLinks.map(link => ...)}
</div>

{/* Mobile */}
<button
  className="lg:hidden"
  style={{ minWidth: '44px', minHeight: '44px' }}
>
  <Menu />
</button>
```

### Responsive Grid
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {items.map(item => ...)}
</div>
```

## PWA Features

### Manifest.json
- App name: "CaddyAI"
- Theme color: #1B5E20 (primary green)
- Display: standalone
- Orientation: portrait-primary
- Icons: 72px → 512px (multiple sizes)

### Install Prompt
```tsx
import { PWAInstallPrompt } from '@/components/ui/PWAInstallPrompt';

<PWAInstallPrompt delay={3000} position="bottom" />
```

### Share API
```tsx
import { ShareButton } from '@/components/ui/ShareButton';

<ShareButton
  title="CaddyAI"
  text="Check out this golf app!"
  url={currentUrl}
/>
```

## Testing Checklist

### Device Testing
- [ ] iPhone SE (375px width)
- [ ] iPhone 12/13/14 (390px width)
- [ ] iPhone 14 Pro Max (428px width)
- [ ] iPad (768px width)
- [ ] iPad Pro (1024px width)
- [ ] Android phones (360px - 428px)
- [ ] Landscape orientation
- [ ] Chrome DevTools device emulation

### Touch Testing
- [ ] All buttons have min 44px touch targets
- [ ] Adequate spacing between interactive elements (min 8px)
- [ ] Swipe gestures work on carousels
- [ ] Scroll performance is smooth
- [ ] No accidental taps from cramped layout

### Typography Testing
- [ ] Text remains readable at all sizes
- [ ] Line length optimal (45-75 characters)
- [ ] Contrast ratio meets WCAG AA (4.5:1 minimum)
- [ ] Font sizes scale appropriately

### Performance Testing
- [ ] Page load < 3s on 3G
- [ ] Images optimized and responsive
- [ ] No layout shift (CLS < 0.1)
- [ ] Smooth animations (no jank)

## Utility Helpers

### Responsive Utilities
```typescript
import { BREAKPOINTS, TOUCH_TARGET, TYPOGRAPHY, SPACING, GRID } from '@/lib/responsive';

// Use predefined responsive classes
<div className={TYPOGRAPHY.h1.full}>Heading</div>
<div className={SPACING.section.full}>Section</div>
<div className={`grid ${GRID.features} gap-6`}>...</div>
```

### Device Detection
```typescript
import { isMobile, isTablet, isDesktop, isTouchDevice } from '@/lib/responsive';

if (isMobile()) {
  // Mobile-specific logic
}

if (isTouchDevice()) {
  // Enable touch-specific features
}
```

## Best Practices

### 1. Mobile-First CSS
Write styles for mobile first, then enhance for larger screens:
```css
/* ✅ Good */
.button {
  @apply h-11;      /* Mobile: 44px */
  @apply sm:h-12;   /* Desktop: 48px */
}

/* ❌ Bad */
.button {
  @apply h-12;      /* Desktop first */
  @apply sm:h-11;   /* Then mobile */
}
```

### 2. Touch-Friendly Spacing
```css
/* ✅ Good - adequate spacing */
.nav-links {
  @apply space-y-3;  /* 12px between links */
}

/* ❌ Bad - cramped */
.nav-links {
  @apply space-y-1;  /* 4px too tight */
}
```

### 3. Responsive Images
```tsx
/* ✅ Good - Next.js Image with responsive sizing */
<Image
  src="/hero.jpg"
  alt="Golf course"
  width={1920}
  height={1080}
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
  priority
/>

/* ❌ Bad - fixed size image */
<img src="/hero.jpg" width="1920" height="1080" />
```

### 4. Avoid Horizontal Scroll
```css
/* ✅ Good - responsive container */
.container {
  @apply max-w-7xl mx-auto px-4;
}

/* ❌ Bad - fixed width */
.container {
  width: 1200px;
}
```

### 5. Test on Real Devices
- Emulators don't replicate touch behavior perfectly
- Test on actual iOS and Android devices
- Check in both portrait and landscape
- Verify touch targets are easy to tap

## Common Patterns

### Hero Section
```tsx
<section className="min-h-screen flex items-center py-12 lg:py-24">
  <div className="grid lg:grid-cols-2 gap-8 lg:gap-16">
    <div>
      <h1 className="text-4xl sm:text-5xl lg:text-7xl">
        {title}
      </h1>
      <p className="text-base sm:text-lg lg:text-xl mt-4">
        {subtitle}
      </p>
      <div className="flex flex-col sm:flex-row gap-4 mt-8">
        <Button size="lg">Primary CTA</Button>
        <Button size="lg" variant="outline">Secondary</Button>
      </div>
    </div>
    <div className="hidden lg:block">
      {/* Image/mockup */}
    </div>
  </div>
</section>
```

### Card Grid
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
  {items.map(item => (
    <Card key={item.id} padding="lg">
      <CardContent>
        {/* Card content */}
      </CardContent>
    </Card>
  ))}
</div>
```

### Form Layout
```tsx
<form className="max-w-md mx-auto px-4 space-y-4">
  <Input
    label="Email"
    type="email"
    fullWidth
    className="h-11 sm:h-12"
  />
  <Input
    label="Password"
    type="password"
    fullWidth
    className="h-11 sm:h-12"
  />
  <Button
    type="submit"
    size="lg"
    fullWidth
    className="touch-manipulation"
  >
    Submit
  </Button>
</form>
```

## Resources

- [WCAG 2.1 Touch Target Guidelines](https://www.w3.org/WAI/WCAG21/Understanding/target-size.html)
- [Tailwind CSS Responsive Design](https://tailwindcss.com/docs/responsive-design)
- [Next.js Image Optimization](https://nextjs.org/docs/basic-features/image-optimization)
- [PWA Best Practices](https://web.dev/pwa-checklist/)
- [Mobile UX Guidelines](https://developers.google.com/web/fundamentals/design-and-ux/principles)

## Maintenance

When adding new components:
1. Start with mobile design
2. Ensure all touch targets meet 44px minimum
3. Test typography scales across breakpoints
4. Verify spacing is adequate on small screens
5. Add responsive classes from `/lib/responsive.ts`
6. Test on real devices before deploying

## Support

For questions about the responsive design system:
- Check this documentation first
- Review `/lib/responsive.ts` for utilities
- Look at existing components for patterns
- Test changes across all breakpoints
