# CaddyAI Color System - Quick Reference

## 🎨 Quick Color Guide

### Primary Colors (Golf Course Green)

```
Light     bg-primary-50    oklch(0.97 0.02 145)   #F0F9F1
          bg-primary-100   oklch(0.93 0.04 145)   #D9F1DD
          bg-primary-200   oklch(0.85 0.06 145)   #B3E3C1
          bg-primary-300   oklch(0.75 0.08 145)   #8DD5A5
          bg-primary-400   oklch(0.65 0.10 145)   #67C789
Brand →   bg-primary-500   oklch(0.45 0.12 145)   #1B5E20 ⭐
          bg-primary-600   oklch(0.40 0.11 145)   #164E1A
          bg-primary-700   oklch(0.35 0.10 145)   #113E14
          bg-primary-800   oklch(0.28 0.08 145)   #0C2E0E
Dark      bg-primary-900   oklch(0.20 0.06 145)   #061F07
```

**Usage**: Buttons, links, brand elements, CTAs
**Contrast**: 7.2:1 on white (WCAG AAA ✓)

### Secondary Colors (Vibrant Tech Green)

```
Light     bg-secondary-50    oklch(0.97 0.02 130)   #F5FFF4
          bg-secondary-100   oklch(0.93 0.04 130)   #E6FFE0
          bg-secondary-200   oklch(0.88 0.08 130)   #CCFFBB
          bg-secondary-300   oklch(0.83 0.12 130)   #B3FF99
          bg-secondary-400   oklch(0.78 0.16 130)   #99FF77
Accent →  bg-secondary-500   oklch(0.85 0.25 130)   #76FF03 ⚡
          bg-secondary-600   oklch(0.75 0.22 130)   #64DD17
          bg-secondary-700   oklch(0.65 0.18 130)   #558B2F
          bg-secondary-800   oklch(0.55 0.14 130)   #33691E
Dark      bg-secondary-900   oklch(0.45 0.12 130)   #1B5E20
```

**Usage**: Highlights, badges, energy indicators
**⚠️ Warning**: Don't use 500 for body text (too bright)

### Accent Colors (Sky Blue)

```
Light     bg-accent-50     oklch(0.97 0.02 240)   #E3F2FD
          bg-accent-100    oklch(0.93 0.04 240)   #BBDEFB
          bg-accent-200    oklch(0.87 0.08 240)   #90CAF9
          bg-accent-300    oklch(0.80 0.12 240)   #64B5F6
          bg-accent-400    oklch(0.72 0.16 240)   #42A5F5
Main →    bg-accent-500    oklch(0.64 0.18 240)   #2196F3 💙
          bg-accent-600    oklch(0.58 0.17 240)   #1E88E5
          bg-accent-700    oklch(0.52 0.16 240)   #1976D2
          bg-accent-800    oklch(0.46 0.14 240)   #1565C0
Dark      bg-accent-900    oklch(0.38 0.12 240)   #0D47A1
```

**Usage**: Info messages, interactive elements, data viz
**Contrast**: 5.2:1 on white (WCAG AA ✓)

### Neutral Colors (Warm Gray)

```
          bg-neutral-50    oklch(0.99 0 0)        #FCFCFC
          bg-neutral-100   oklch(0.97 0 0)        #F5F5F5
          bg-neutral-200   oklch(0.94 0 0)        #EEEEEE
          bg-neutral-300   oklch(0.89 0 0)        #E0E0E0
          bg-neutral-400   oklch(0.78 0 0)        #BDBDBD
          bg-neutral-500   oklch(0.65 0 0)        #9E9E9E
          bg-neutral-600   oklch(0.52 0 0)        #757575
Body →    text-neutral-700 oklch(0.48 0.01 240)   #607D8B 📝
Heading → text-neutral-800 oklch(0.38 0.02 240)   #455A64 📖
Dark      text-neutral-900 oklch(0.25 0.02 240)   #263238
```

**Usage**: Text, borders, backgrounds
**Contrast**: 4.8:1 (body), 12.6:1 (headings) on white

### Gold Colors (Premium)

```
Light     bg-gold-50       oklch(0.97 0.02 80)    #FFFBF3
          bg-gold-100      oklch(0.93 0.04 80)    #FFF3D9
          bg-gold-200      oklch(0.88 0.08 80)    #FFE7B3
          bg-gold-300      oklch(0.83 0.12 80)    #FFDB8D
          bg-gold-400      oklch(0.78 0.14 80)    #FFD54F
Premium → bg-gold-500      oklch(0.73 0.15 80)    #FFC107 👑
          bg-gold-600      oklch(0.68 0.14 80)    #FFB300
          bg-gold-700      oklch(0.58 0.12 80)    #FFA000
          bg-gold-800      oklch(0.48 0.10 80)    #FF8F00
Dark      bg-gold-900      oklch(0.38 0.08 80)    #FF6F00
```

**Usage**: Premium badges, pro features, achievements
**Contrast**: 4.2:1 on white (WCAG AA ✓)

## 🎯 Semantic Colors

```
Success   bg-success    oklch(0.55 0.15 145)   #2E7D32  5.5:1 ✓
Warning   bg-warning    oklch(0.70 0.15 60)    #F57C00  3.8:1 ✓ (large text)
Error     bg-error      oklch(0.55 0.22 25)    #D32F2F  5.5:1 ✓
Info      bg-info       oklch(0.64 0.18 240)   #2196F3  5.2:1 ✓
```

## 🌈 Semantic Text Colors

```
text-foreground              (Main text - dark)
text-foreground-secondary    (Body text - gray)
text-foreground-muted        (Disabled text - light gray)

Legacy support:
text-primary    →  text-foreground
text-secondary  →  text-foreground-secondary
text-muted      →  text-foreground-muted
```

## 🎴 Background Colors

```
bg-background          (Main page background - off-white)
bg-background-alt      (Card background - white)
bg-background-elevated (Elevated surfaces - white)
bg-background-muted    (Subtle backgrounds - light gray)
```

## 🔲 Component Colors

```
bg-card / border-card-border     (Card styling)
bg-input / border-input-border   (Input fields)
border-input-focus               (Focused inputs)
border-border / border-border-muted  (Dividers)
```

## 🌓 Dark Mode

Toggle dark mode with the `useTheme` hook:

```tsx
import { useTheme } from '@/hooks/useTheme';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

function App() {
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();

  return (
    <div>
      <ThemeToggle />               {/* Pre-built toggle */}
      <button onClick={toggleTheme}>Toggle</button>
      <p>Current: {resolvedTheme}</p>

      {/* Manually set theme */}
      <button onClick={() => setTheme('dark')}>Dark</button>
      <button onClick={() => setTheme('light')}>Light</button>
      <button onClick={() => setTheme('system')}>System</button>
    </div>
  );
}
```

Dark mode automatically adjusts:
- Backgrounds become dark
- Text becomes light
- Colors get lighter/more vibrant
- Shadows become more subtle

## 🎨 Common Patterns

### Button Styles

```tsx
// Primary action
<button className="bg-primary hover:bg-primary-600 text-white">
  Primary
</button>

// Secondary action
<button className="bg-secondary-700 hover:bg-secondary-800 text-white">
  Secondary
</button>

// Outline style
<button className="border-2 border-primary text-primary hover:bg-primary hover:text-white">
  Outline
</button>

// Ghost style
<button className="text-primary hover:bg-primary/10">
  Ghost
</button>

// Danger
<button className="bg-error hover:bg-red-600 text-white">
  Delete
</button>
```

### Card Styles

```tsx
// Default card
<div className="bg-card border border-card-border rounded-xl p-6">
  Content
</div>

// Elevated card
<div className="bg-card shadow-card rounded-xl p-6">
  Content
</div>

// Interactive card
<div className="bg-card border border-card-border rounded-xl p-6 hover:shadow-lg transition-shadow cursor-pointer">
  Click me
</div>
```

### Form Inputs

```tsx
// Text input
<input
  className="bg-input border border-input-border focus:border-input-focus focus:ring-2 focus:ring-primary/20 rounded-lg px-4 py-2"
  type="text"
/>

// Error state
<input
  className="bg-input border-2 border-error focus:ring-2 focus:ring-error/20 rounded-lg px-4 py-2"
  type="text"
/>

// Disabled state
<input
  className="bg-background-muted border border-border-muted text-foreground-muted cursor-not-allowed"
  disabled
/>
```

### Status Badges

```tsx
// Success
<span className="bg-success/10 text-success border border-success/20 px-3 py-1 rounded-full text-sm font-medium">
  Success
</span>

// Warning
<span className="bg-warning/10 text-warning border border-warning/20 px-3 py-1 rounded-full text-sm font-medium">
  Warning
</span>

// Error
<span className="bg-error/10 text-error border border-error/20 px-3 py-1 rounded-full text-sm font-medium">
  Error
</span>
```

### Text Hierarchy

```tsx
<div className="space-y-4">
  <h1 className="text-4xl font-bold text-foreground">
    Main Heading
  </h1>

  <h2 className="text-2xl font-semibold text-foreground">
    Subheading
  </h2>

  <p className="text-base text-foreground-secondary">
    Body text that's easily readable
  </p>

  <p className="text-sm text-foreground-muted">
    Helper text or captions
  </p>
</div>
```

## ⚠️ Don'ts

```tsx
// ❌ Don't use hardcoded colors
<div style={{ backgroundColor: '#1B5E20' }}>Bad</div>

// ❌ Don't use arbitrary values
<div className="bg-[#1B5E20]">Bad</div>

// ❌ Don't use bright secondary for text
<p className="text-secondary-500">Too bright!</p>

// ✅ Do use semantic names
<div className="bg-primary">Good</div>

// ✅ Do use CSS variables
<div style={{ backgroundColor: 'var(--color-primary)' }}>Good</div>

// ✅ Do use darker shades for text
<p className="text-secondary-700">Good readability</p>
```

## 📏 Contrast Quick Reference

| Combination | Ratio | Status |
|-------------|-------|--------|
| Foreground / Background | 12.6:1 | ✅ AAA |
| Primary-500 / White | 7.2:1 | ✅ AAA |
| Accent-500 / White | 5.2:1 | ✅ AA |
| Secondary-700 / White | 4.8:1 | ✅ AA |
| Muted / White | 4.5:1 | ✅ AA |

## 🔗 Resources

- Full Documentation: `/docs/COLOR_SYSTEM.md`
- Accessibility Report: `/docs/ACCESSIBILITY_REPORT.md`
- [OKLCH Color Picker](https://oklch.com/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs/customizing-colors)

---

**Quick Tip**: Use semantic color names (`bg-primary`, `text-foreground`) for automatic dark mode support and better maintainability!
