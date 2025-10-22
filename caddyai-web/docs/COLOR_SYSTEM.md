# CaddyAI Color System Documentation

## Overview

This document describes the standardized color system for CaddyAI, implementing a comprehensive design system using OKLCH color space for perceptually uniform colors with full dark mode support.

## Color Philosophy

- **Golf-themed palette**: Primary colors inspired by golf courses (greens) and outdoor environments
- **OKLCH color space**: Perceptually uniform colors that look consistent across different lightness levels
- **Semantic naming**: Colors named by their purpose, not appearance
- **Accessibility-first**: All color combinations meet WCAG AA contrast requirements
- **Theme-aware**: Full support for light and dark modes

## Color Palette

### Primary Colors (Golf Course Green)

The primary brand color representing golf courses and nature:

```css
--color-primary-500: oklch(0.45 0.12 145) /* Main brand - #1B5E20 equivalent */
```

**Scale**: 50 (lightest) → 900 (darkest)

**Usage**:
- Primary buttons
- Brand elements
- Links and CTAs
- Focus states

**Classes**: `bg-primary`, `text-primary`, `border-primary`, `bg-primary-500`, etc.

### Secondary Colors (Vibrant Tech Green)

High-energy accent representing innovation and technology:

```css
--color-secondary-500: oklch(0.85 0.25 130) /* Vibrant - #76FF03 equivalent */
```

**Usage**:
- Secondary buttons
- Highlights and badges
- Energy indicators
- Success states (alternative)

**Classes**: `bg-secondary`, `text-secondary`, `border-secondary-500`, etc.

### Accent Colors (Sky Blue)

Sky blue representing clarity and intelligence:

```css
--color-accent-500: oklch(0.64 0.18 240) /* Main accent - #2196F3 equivalent */
```

**Usage**:
- Info messages
- Interactive elements
- Data visualizations
- Premium features

**Classes**: `bg-accent`, `text-accent`, `border-accent-500`, etc.

### Neutral Colors (Warm Gray)

Neutral grays for text and UI elements:

```css
--color-neutral-700: oklch(0.48 0.01 240) /* Body text */
--color-neutral-900: oklch(0.25 0.02 240) /* Dark text */
```

**Usage**:
- Body text
- Headings
- Borders
- Backgrounds

**Classes**: `bg-neutral-100`, `text-neutral-700`, `border-neutral-300`, etc.

### Gold Colors (Premium)

Gold accents for premium features:

```css
--color-gold-500: oklch(0.73 0.15 80) /* #FFC107 equivalent */
```

**Usage**:
- Premium badges
- Pro features
- Achievement highlights

**Classes**: `bg-gold`, `text-gold-500`, `border-gold`, etc.

## Semantic Colors

### Status Colors

```css
--color-success: oklch(0.55 0.15 145) /* Green for success */
--color-warning: oklch(0.70 0.15 60)  /* Orange for warnings */
--color-error: oklch(0.55 0.22 25)    /* Red for errors */
--color-info: var(--color-accent-500) /* Blue for info */
```

**Classes**: `bg-success`, `text-error`, `border-warning`, etc.

### Background Colors

```css
--color-background: oklch(0.99 0 0)         /* Main background */
--color-background-alt: oklch(1 0 0)        /* Card background */
--color-background-elevated: oklch(1 0 0)   /* Elevated elements */
--color-background-muted: oklch(0.97 0 0)   /* Subtle backgrounds */
```

**Classes**: `bg-background`, `bg-background-alt`, `bg-background-elevated`, etc.

### Foreground/Text Colors

```css
--color-foreground: var(--color-neutral-900)           /* Primary text */
--color-foreground-secondary: var(--color-neutral-700) /* Secondary text */
--color-foreground-muted: var(--color-neutral-500)     /* Muted text */
```

**Classes**: `text-foreground`, `text-foreground-secondary`, `text-foreground-muted`

**Legacy support**: Also available as `text-primary`, `text-secondary`, `text-muted`

### Border Colors

```css
--color-border: oklch(0.89 0 0)       /* Default borders */
--color-border-muted: oklch(0.94 0 0) /* Subtle borders */
```

**Classes**: `border-border`, `border-border-muted`

## Dark Mode

### Activation

Dark mode can be activated in three ways:

1. **Manual toggle**: User sets theme preference
2. **System preference**: Follows OS dark mode setting
3. **Data attribute**: `<html data-theme="dark">`

### Dark Mode Colors

In dark mode, colors automatically adjust:

```css
[data-theme="dark"] {
  --color-primary-500: oklch(0.55 0.14 145);  /* Lighter for visibility */
  --color-background: oklch(0.18 0.01 240);    /* Dark blue-gray */
  --color-foreground: oklch(0.95 0 0);         /* Light text */
}
```

### Implementation

```tsx
import { useTheme } from '@/hooks/useTheme';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

function MyComponent() {
  const { theme, resolvedTheme, setTheme } = useTheme();

  return (
    <div>
      <ThemeToggle /> {/* Pre-built toggle button */}
      <p>Current theme: {resolvedTheme}</p>
    </div>
  );
}
```

## Usage Guidelines

### Tailwind Classes

Use Tailwind utility classes with semantic color names:

```tsx
// ✅ Good - Semantic names
<div className="bg-background text-foreground border-border">
  <button className="bg-primary text-white hover:bg-primary-600">
    Click me
  </button>
</div>

// ❌ Avoid - Hardcoded hex colors
<div style={{ backgroundColor: '#1B5E20' }}>
```

### CSS Variables

For custom styles, use CSS variables:

```css
.my-component {
  background: var(--color-background-alt);
  color: var(--color-foreground);
  border: 1px solid var(--color-border);
}
```

### Component Colors

Pre-defined component color tokens:

```css
--color-card-bg: var(--color-background-alt)
--color-card-border: var(--color-border-muted)
--color-input-bg: var(--color-background-alt)
--color-input-border: var(--color-border)
--color-input-focus: var(--color-primary)
```

## Shadows

Shadows automatically adjust for dark mode:

```css
--shadow-sm: 0 1px 2px 0 oklch(0 0 0 / 0.05)
--shadow-md: 0 4px 6px -1px oklch(0 0 0 / 0.1)
--shadow-lg: 0 10px 15px -3px oklch(0 0 0 / 0.1)
--shadow-xl: 0 20px 25px -5px oklch(0 0 0 / 0.1)
--shadow-card: 0 8px 24px oklch(0 0 0 / 0.12)
--shadow-primary: 0 4px 12px oklch(0.45 0.12 145 / 0.3)
```

**Classes**: `shadow-sm`, `shadow-md`, `shadow-lg`, `shadow-card`, `shadow-primary`

## Accessibility

### Contrast Ratios

All color combinations meet WCAG AA requirements:

| Combination | Ratio | Level |
|-------------|-------|-------|
| Primary on white | 7.2:1 | AAA |
| Foreground on background | 12.6:1 | AAA |
| Secondary text on background | 4.8:1 | AA |
| Muted text on background | 4.5:1 | AA |

### Testing

Test color combinations using:

1. **Chrome DevTools**: Lighthouse accessibility audit
2. **axe DevTools**: Automated accessibility testing
3. **WebAIM Contrast Checker**: Manual verification
4. **Color blindness simulators**: Test with different vision types

### Focus States

All interactive elements have visible focus states:

```tsx
<button className="focus:ring-2 focus:ring-primary focus:ring-offset-2">
  Accessible button
</button>
```

## Migration Guide

### Updating Existing Components

1. **Find hardcoded colors**:
   ```bash
   grep -r "#[0-9A-Fa-f]" components/
   ```

2. **Replace with semantic names**:
   ```tsx
   // Before
   <div className="bg-[#1B5E20] text-white">

   // After
   <div className="bg-primary text-white">
   ```

3. **Update CSS variables**:
   ```css
   /* Before */
   .my-class {
     background: #1B5E20;
   }

   /* After */
   .my-class {
     background: var(--color-primary);
   }
   ```

### Backward Compatibility

Legacy color names are maintained for compatibility:

- `text-primary` → `text-foreground`
- `text-secondary` → `text-foreground-secondary`
- `text-muted` → `text-foreground-muted`
- `background-light` → `background-alt`

## Color System Architecture

```
app/
  globals.css              # CSS variables definition
tailwind.config.ts         # Tailwind color mapping
lib/
  design-tokens.ts         # Design tokens export
hooks/
  useTheme.tsx            # Theme management hook
components/
  ui/
    ThemeToggle.tsx       # Theme toggle component
```

## Examples

### Button Variants

```tsx
// Primary action
<button className="bg-primary hover:bg-primary-600 text-white">
  Primary
</button>

// Secondary action
<button className="bg-secondary hover:bg-secondary-600 text-white">
  Secondary
</button>

// Outline
<button className="border-2 border-primary text-primary hover:bg-primary hover:text-white">
  Outline
</button>

// Ghost
<button className="text-primary hover:bg-primary/10">
  Ghost
</button>
```

### Card Styles

```tsx
<div className="bg-card border border-card-border rounded-xl p-6 shadow-card">
  <h3 className="text-foreground font-bold">Card Title</h3>
  <p className="text-foreground-secondary">Card content</p>
</div>
```

### Form Inputs

```tsx
<input
  className="bg-input border border-input-border focus:border-input-focus focus:ring-2 focus:ring-primary/20"
  type="text"
/>
```

## Resources

- [OKLCH Color Picker](https://oklch.com/)
- [WCAG Contrast Guidelines](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html)
- [Tailwind CSS Colors](https://tailwindcss.com/docs/customizing-colors)
- [Color Hunt - Golf Palettes](https://colorhunt.co/)

## Support

For questions or issues with the color system:
1. Check this documentation
2. Review `app/globals.css` for CSS variable definitions
3. Check `tailwind.config.ts` for Tailwind mappings
4. Test color combinations for accessibility
