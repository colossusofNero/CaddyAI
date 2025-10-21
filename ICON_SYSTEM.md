# Icon System Documentation

## Overview

CaddyAI uses a standardized icon system built on Lucide React with consistent sizes, colors, and usage patterns.

## Icon Component

The `Icon` component provides a unified interface for all icons in the application.

### Basic Usage

```tsx
import { Icon } from '@/components/ui/Icon';
import { Target, Brain, Wind } from 'lucide-react';

// Default icon (medium size, default color)
<Icon icon={Target} />

// Primary colored icon
<Icon icon={Brain} variant="primary" />

// Large icon with custom stroke
<Icon icon={Wind} size="lg" strokeWidth={1.5} />
```

## Size System

| Size | Pixels | Tailwind | Use Case |
|------|--------|----------|----------|
| `xs` | 16px | `w-4 h-4` | Inline text icons, badges |
| `sm` | 20px | `w-5 h-5` | Buttons, cards, inputs |
| `md` | 24px | `w-6 h-6` | Default size, general use |
| `lg` | 32px | `w-8 h-8` | Feature cards, stat displays |
| `xl` | 48px | `w-12 h-12` | Hero sections, large displays |

## Color Variants

| Variant | Color | Use Case |
|---------|-------|----------|
| `default` | Text Primary | General icons |
| `primary` | Forest Green | Brand-related icons |
| `secondary` | Vibrant Green | Accent/highlight icons |
| `accent` | Sky Blue | Secondary accents |
| `muted` | Gray | Subtle/disabled icons |
| `white` | White | Icons on dark backgrounds |

## Icon with Background

For icons that need a colored background (common in feature cards):

```tsx
import { IconWithBackground, IconWithGradient } from '@/components/ui/Icon';
import { Target } from 'lucide-react';

// Solid background
<IconWithBackground
  icon={Target}
  size="lg"
  backgroundVariant="primary"
  rounded={true}
/>

// Gradient background (premium feel)
<IconWithGradient
  icon={Target}
  size="lg"
  rounded={false}
/>
```

## Animated Icons

For interactive elements:

```tsx
import { AnimatedIcon } from '@/components/ui/Icon';
import { Sparkles } from 'lucide-react';

<AnimatedIcon
  icon={Sparkles}
  animation="pulse"
  variant="primary"
/>
```

Available animations:
- `pulse` - Gentle pulsing effect
- `bounce` - Bouncing animation
- `spin` - Continuous rotation
- `none` - No animation (default)

## Preset Configurations

Use `iconConfig` for consistent icon sizing across common use cases:

```tsx
import { Icon, iconConfig } from '@/components/ui/Icon';
import { Target } from 'lucide-react';

// Button icon
<Icon icon={Target} {...iconConfig.button} />

// Feature card icon
<Icon icon={Target} {...iconConfig.feature} />

// Navigation icon
<Icon icon={Target} {...iconConfig.nav} />

// Input/Form icon
<Icon icon={Target} {...iconConfig.input} />

// Badge/Chip icon
<Icon icon={Target} {...iconConfig.badge} />

// Hero section icon
<Icon icon={Target} {...iconConfig.hero} />
```

## Stroke Width Guidelines

The component automatically applies appropriate stroke widths based on size:

- `xs` - `sm`: 2px (default)
- `md` - `lg`: 2px (default)
- `xl`: 1.5px (thinner for large icons)

You can override with the `strokeWidth` prop if needed.

## Migration Guide

### Before (Inconsistent)
```tsx
// Various inconsistent approaches
<Target className="w-5 h-5 text-primary" />
<Brain className="w-6 h-6" />
<Wind className="w-8 h-8 text-accent" strokeWidth={1} />
```

### After (Standardized)
```tsx
import { Icon } from '@/components/ui/Icon';
import { Target, Brain, Wind } from 'lucide-react';

<Icon icon={Target} size="sm" variant="primary" />
<Icon icon={Brain} size="md" />
<Icon icon={Wind} size="lg" variant="accent" />
```

## Common Patterns

### Feature Card Icon
```tsx
<IconWithGradient
  icon={Brain}
  size="lg"
  rounded={false}
  className="mb-6"
/>
```

### Button with Icon
```tsx
<button className="...">
  <Icon icon={ArrowRight} {...iconConfig.button} />
  <span>Continue</span>
</button>
```

### Stat Display Icon
```tsx
<IconWithBackground
  icon={TrendingUp}
  size="md"
  backgroundVariant="accent"
  rounded={true}
/>
```

### Badge Icon
```tsx
<div className="badge">
  <Icon icon={Sparkles} {...iconConfig.badge} />
  <span>Featured</span>
</div>
```

## Best Practices

1. **Always use the Icon component** instead of importing Lucide icons directly
2. **Use preset configurations** (`iconConfig`) for consistency
3. **Choose appropriate sizes** based on context (see size system table)
4. **Use semantic variants** (primary for brand, muted for disabled, etc.)
5. **Use IconWithBackground** for feature cards and stat displays
6. **Use IconWithGradient** for premium/featured content
7. **Avoid custom className overrides** unless absolutely necessary

## All Available Icons

CaddyAI currently uses these Lucide icons:

### Navigation & UI
- Menu, X, ChevronDown, ChevronLeft, ChevronRight, ArrowRight, ArrowLeft

### Golf & Sports
- Target, TrendingUp, Trophy, Play

### Features & AI
- Brain, Sparkles, Zap, Cloud

### Environment
- Wind, Mountain, Sun, Cloud

### Data & Analytics
- BarChart3, LineChart, PieChart, Activity

### Social & Communication
- Users, Heart, Star, MessageCircle

### Actions
- Check, Plus, Minus, Edit, Trash, Download, Upload, Share

### Location & Maps
- MapPin, Map, Navigation

### Devices
- Smartphone, Monitor

### General
- Settings, Search, Filter, Globe, Phone, Mail, Calendar

## TypeScript Types

```typescript
type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
type IconVariant = 'default' | 'primary' | 'secondary' | 'accent' | 'muted' | 'white';

interface IconProps {
  icon: LucideIcon;
  size?: IconSize;
  variant?: IconVariant;
  className?: string;
  strokeWidth?: number;
}
```

## Examples in Context

### Hero Section
```tsx
<div className="hero">
  <Icon icon={Target} size="xl" variant="primary" />
  <h1>Your AI Caddy in Your Pocket</h1>
</div>
```

### Feature Grid
```tsx
<div className="feature-card">
  <IconWithGradient icon={Brain} size="lg" />
  <h3>AI-Powered Recommendations</h3>
  <p>Smart club selection...</p>
</div>
```

### Stats Section
```tsx
<div className="stat">
  <IconWithBackground
    icon={TrendingUp}
    size="md"
    backgroundVariant="accent"
    rounded={true}
  />
  <span className="stat-value">2M+</span>
  <span className="stat-label">Shots Analyzed</span>
</div>
```
