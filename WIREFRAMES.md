# CaddyAI Homepage Wireframes
## Detailed Section-by-Section Layouts

**Document:** Visual wireframes and layout specifications
**Date:** 2025-10-20
**Version:** 1.0

---

## 📐 Grid System

**Desktop Grid:**
- 12-column layout
- Max-width: 1280px
- Gutter: 24px
- Margin: 40px (left/right)

**Tablet Grid:**
- 8-column layout
- Max-width: 768px
- Gutter: 20px
- Margin: 24px

**Mobile Grid:**
- 4-column layout
- Max-width: 100%
- Gutter: 16px
- Margin: 16px

---

## 🖥️ Section 1: Hero Section

### Desktop Layout (1920×1080)

```
┌─────────────────────────────────────────────────────────────┐
│  HEADER [40px padding]                                       │
│  ┌────┐                                        ┌──────────┐ │
│  │Logo│  Features  How  Pricing  About         │ Sign In  │ │
│  └────┘                                        └──────────┘ │
│                                                 [Get Started]│
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  [FULL VIEWPORT VIDEO BACKGROUND - Looping golf course]     │
│  [Dark gradient overlay: 135deg, green-to-blue, 80% opacity]│
│                                                              │
│              ┌──────────────────────┐                       │
│              │                      │                       │
│              │   Your AI Caddy      │  72px, Montserrat    │
│              │   in Your Pocket     │  Bold, White         │
│              │                      │                       │
│              └──────────────────────┘                       │
│                                                              │
│        Make every shot count with real-time                 │
│        club recommendations powered by AI                   │
│        [18px, Open Sans, White with 50% opacity]            │
│                                                              │
│      ┌─────────────────┐  ┌──────────────────┐             │
│      │ Start Free Trial│  │  Watch Demo  ▶   │             │
│      │       →         │  │                  │             │
│      └─────────────────┘  └──────────────────┘             │
│      [Primary Button]      [Secondary Outline]              │
│                                                              │
│                                          ┌────────────────┐ │
│                                          │                │ │
│  Join 50,000+ golfers | 2M+ shots        │  [Phone Mock] │ │
│  [12px, stat ticker animation]           │  Floating 3D   │ │
│                                          │  with shadow   │ │
│                                          │  & glow effect │ │
│                                          └────────────────┘ │
│                         [Parallax scroll on phone mockup]   │
│                                                              │
│  [Scroll indicator: animated chevron down]                  │
└─────────────────────────────────────────────────────────────┘
```

**Element Specifications:**

**Header Navigation:**
- Height: 80px
- Background: Transparent (with blur on scroll)
- Logo: 40px height, left-aligned
- Nav links: 16px, 600 weight, 24px spacing
- CTA buttons: 40px height, 16px padding horizontal

**Hero Headline:**
- Font: Montserrat Bold, 72px
- Line height: 1.1
- Letter spacing: -0.02em
- Max-width: 800px, centered
- Margin-bottom: 24px

**Subheadline:**
- Font: Open Sans Regular, 18px
- Line height: 1.7
- Color: White with 50% opacity
- Max-width: 600px, centered
- Margin-bottom: 40px

**CTA Buttons:**
- Height: 56px
- Primary: 180px width, green background
- Secondary: 160px width, outline style
- Spacing between: 16px
- Border-radius: 12px

**Phone Mockup:**
- Position: Absolute, right: 10%, bottom: 20%
- Size: 300px × 600px
- Shadow: 0 20px 60px rgba(0,0,0,0.3)
- Glow: 0 0 40px rgba(118, 255, 3, 0.2)
- Animation: Float (translateY -10px to 10px, 3s ease-in-out infinite)

**Stat Ticker:**
- Position: Absolute, bottom: 40px, centered
- Font: 12px, 600 weight
- Separator: Vertical bar (|)
- Animation: Numbers count up on page load

---

### Mobile Layout (375×812)

```
┌───────────────────────┐
│ HEADER [60px height]  │
│ ┌────┐         ☰     │
│ │Logo│         Menu   │
│ └────┘                │
├───────────────────────┤
│                       │
│ [STATIC IMAGE BG]     │
│ [Gradient overlay]    │
│                       │
│     Your AI Caddy     │
│    in Your Pocket     │
│  [48px, Montserrat]   │
│                       │
│  Make every shot      │
│  count with AI        │
│  recommendations      │
│  [16px, Open Sans]    │
│                       │
│ ┌───────────────────┐ │
│ │ Start Free Trial  │ │
│ └───────────────────┘ │
│                       │
│ ┌───────────────────┐ │
│ │   Watch Demo  ▶   │ │
│ └───────────────────┘ │
│ [Full-width buttons]  │
│                       │
│  Join 50,000+ golfers │
│  [10px, centered]     │
│                       │
│    [Phone Mockup]     │
│   [200px × 400px]     │
│    [Centered]         │
│                       │
└───────────────────────┘
```

**Mobile Adjustments:**
- Remove video background (use static image)
- Headline: 48px (reduced from 72px)
- Buttons: Full-width, stacked vertically
- Phone mockup: Smaller, centered below CTAs
- Padding: 24px horizontal, 40px vertical

---

## 🏆 Section 2: Social Proof

### Desktop Layout (1920×1080)

```
┌─────────────────────────────────────────────────────────────┐
│  [Light gray background #FAFAFA]                             │
│  [80px padding top/bottom]                                   │
│                                                              │
│              Trusted by Thousands of Golfers                 │
│              [48px, Inter Semibold, centered]                │
│                                                              │
│  ┌──────────────────┐  ┌──────────────────┐  ┌───────────┐ │
│  │ ┌──────┐         │  │ ┌──────┐         │  │ ┌───────┐ │ │
│  │ │ [64px│ "This   │  │ │Avatar│ "Dropped│  │ │Avatar │ │ │
│  │ │Avatar│  changed│  │ │ [●]  │ 5 strokes│ │ │ [●]   │ │ │
│  │ │ [●]  │  my     │  │ └──────┘  in a   │  │ └───────┘ │ │
│  │ └──────┘  game!" │  │           month" │  │           │ │
│  │                  │  │                  │  │ "Best golf│ │
│  │ ⭐⭐⭐⭐⭐         │  │ ⭐⭐⭐⭐⭐         │  │ app I've  │ │
│  │                  │  │                  │  │ used hands│ │
│  │ Sarah Johnson    │  │ Mike Torres      │  │ down"     │ │
│  │ Amateur Golfer   │  │ Club Champion    │  │           │ │
│  │ California       │  │ Texas            │  │ ⭐⭐⭐⭐⭐  │ │
│  │ ✓ Verified User  │  │ ✓ Verified User  │  │           │ │
│  └──────────────────┘  └──────────────────┘  │ David Lee │ │
│                                               │ Golf Pro  │ │
│  [Carousel dots: ● ○ ○ ○]                    │ Florida   │ │
│  [Auto-rotate every 5 seconds]               │ ✓Verified │ │
│                                               └───────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                                                        │ │
│  │  ⭐ 4.8    📱 50K+     🏆 Featured by   🔒 Privacy    │ │
│  │  App Store  Downloads  Golf Digest     First         │ │
│  │                                                        │ │
│  └────────────────────────────────────────────────────────┘ │
│  [Trust badge row - centered, inline]                       │
│                                                              │
│              Golfers currently on the course:                │
│                      [25,482]                                │
│              [Animated counter - 36px bold, green]           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Element Specifications:**

**Testimonial Cards:**
- Width: 360px
- Height: Auto (minimum 400px)
- Background: White
- Border: 1px solid #E0E0E0
- Border-radius: 16px
- Padding: 32px
- Shadow: 0 2px 8px rgba(0,0,0,0.04)
- Gap between cards: 24px

**Avatar:**
- Size: 64px × 64px
- Border-radius: 50% (circular)
- Border: 2px solid #1B5E20 (for verified users)
- Margin-bottom: 16px

**Quote Text:**
- Font: Open Sans Regular, 18px
- Line-height: 1.6
- Color: #263238
- Margin-bottom: 16px
- Min-height: 120px (to keep cards aligned)

**Star Rating:**
- Size: 20px each
- Color: #FFC107 (gold)
- Margin-bottom: 16px

**Author Info:**
- Name: Inter Semibold, 16px, #263238
- Role: Open Sans Regular, 14px, #607D8B
- Location: Open Sans Regular, 14px, #607D8B
- Verified badge: 12px, #1B5E20

**Trust Badges:**
- Height: 60px
- Inline display with 32px spacing
- Icons: 24px, primary green
- Text: 14px, 600 weight

**Live Counter:**
- Font: Inter Bold, 36px
- Color: #1B5E20
- Animation: Count-up on scroll into view
- Duration: 2 seconds

---

### Mobile Layout (375×812)

```
┌───────────────────────┐
│ [Light gray bg]       │
│ [48px padding]        │
│                       │
│  Trusted by Thousands │
│     of Golfers        │
│  [32px, centered]     │
│                       │
│ ┌───────────────────┐ │
│ │  ┌─────┐          │ │
│ │  │ [●] │ "This    │ │
│ │  │48px │  changed │ │
│ │  └─────┘  my game"│ │
│ │                   │ │
│ │  ⭐⭐⭐⭐⭐        │ │
│ │                   │ │
│ │  Sarah Johnson    │ │
│ │  Amateur Golfer   │ │
│ │  ✓ Verified       │ │
│ └───────────────────┘ │
│                       │
│  [Swipe indicators]   │
│  ← ● ○ ○ →          │
│                       │
│  ⭐ 4.8 App Store    │
│  📱 50K+ Downloads   │
│  🏆 Featured         │
│                       │
│  Golfers on course:   │
│      [25,482]         │
│                       │
└───────────────────────┘
```

**Mobile Adjustments:**
- Single testimonial visible
- Swipeable carousel with left/right indicators
- Trust badges stacked vertically
- Smaller avatar (48px)
- Reduced padding and font sizes

---

## ⚡ Section 3: Features Showcase

### Desktop Layout (1920×1080)

```
┌─────────────────────────────────────────────────────────────┐
│  [White background]                                          │
│  [120px padding top/bottom]                                  │
│                                                              │
│              What Makes CaddyAI                              │
│              Your Perfect Partner                            │
│              [48px, Inter Semibold, centered]                │
│              [16px subtitle below in gray]                   │
│                                                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌────────────┐  │
│  │                 │  │                 │  │            │  │
│  │      🎯        │  │      👤        │  │    🌤️     │  │
│  │   [48px icon]   │  │   [48px icon]   │  │ [48px icon]│  │
│  │                 │  │                 │  │            │  │
│  │  Smart Club     │  │  Personal       │  │ Real-time  │  │
│  │  Selection      │  │  Profile        │  │ Conditions │  │
│  │  [24px, bold]   │  │  [24px, bold]   │  │[24px, bold]│  │
│  │                 │  │                 │  │            │  │
│  │  AI-powered     │  │  Track your     │  │ Live weather│ │
│  │  recommendations│  │  clubs and      │  │ wind, and  │  │
│  │  based on your  │  │  distances with │  │ elevation  │  │
│  │  unique swing   │  │  personalized   │  │ data for   │  │
│  │  profile and    │  │  insights for   │  │ every shot │  │
│  │  real-time      │  │  every club     │  │            │  │
│  │  conditions     │  │  in your bag    │  │            │  │
│  │  [18px, gray]   │  │  [18px, gray]   │  │[18px, gray]│  │
│  │                 │  │                 │  │            │  │
│  │  Learn more →   │  │  Learn more →   │  │ Learn more→│  │
│  │  [16px, green]  │  │  [16px, green]  │  │[16px,green]│  │
│  │                 │  │                 │  │            │  │
│  └─────────────────┘  └─────────────────┘  └────────────┘  │
│  [Card 1]             [Card 2]             [Card 3]         │
│  [360px width each, 24px gap]                                │
│  [Hover: scale 1.02, shadow increase, icon rotates 360°]    │
│                                                              │
│  [Below cards: subtle animated background pattern]          │
│  [Animated icons that pulse/glow on scroll into view]       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Element Specifications:**

**Feature Cards:**
- Width: 360px
- Height: 480px (fixed for alignment)
- Background: White
- Border: 1px solid #E0E0E0
- Border-radius: 16px
- Padding: 40px 32px
- Box-shadow: 0 2px 8px rgba(0,0,0,0.04)
- Gap: 24px horizontal

**Icon Container:**
- Size: 80px × 80px
- Background: Linear-gradient (#1B5E20 to #76FF03)
- Border-radius: 16px
- Display: Flex, center-aligned
- Icon: 48px, white color
- Margin-bottom: 24px
- Hover: Rotate 360°, 0.6s ease

**Card Title:**
- Font: Inter Semibold, 24px
- Color: #263238
- Line-height: 1.3
- Margin-bottom: 16px

**Card Description:**
- Font: Open Sans Regular, 18px
- Color: #607D8B
- Line-height: 1.7
- Max-height: 180px
- Margin-bottom: 24px

**Learn More Link:**
- Font: Inter Semibold, 16px
- Color: #1B5E20
- Text-decoration: none
- Arrow icon: →, 16px, inline
- Hover: Underline, arrow moves right 4px

**Animations:**
- Cards fade up on scroll with 100ms stagger
- Icons rotate 360° on card hover
- Link arrow slides right on hover

---

### Mobile Layout (375×812)

```
┌───────────────────────┐
│ [White background]    │
│ [60px padding]        │
│                       │
│   What Makes CaddyAI  │
│   Your Perfect Partner│
│   [28px, centered]    │
│                       │
│ ┌───────────────────┐ │
│ │                   │ │
│ │       🎯         │ │
│ │    [40px icon]    │ │
│ │                   │ │
│ │   Smart Club      │ │
│ │   Selection       │ │
│ │   [20px, bold]    │ │
│ │                   │ │
│ │   AI-powered      │ │
│ │   recommendations │ │
│ │   based on your   │ │
│ │   swing profile   │ │
│ │   [16px, gray]    │ │
│ │                   │ │
│ │   Learn more →    │ │
│ │                   │ │
│ └───────────────────┘ │
│                       │
│ [Card 1 - full width] │
│                       │
│ ┌───────────────────┐ │
│ │   👤  Personal    │ │
│ │       Profile     │ │
│ │   [...]           │ │
│ └───────────────────┘ │
│                       │
│ [Card 2 - full width] │
│                       │
│ ┌───────────────────┐ │
│ │   🌤️  Real-time  │ │
│ │      Conditions   │ │
│ │   [...]           │ │
│ └───────────────────┘ │
│                       │
│ [Card 3 - full width] │
│                       │
└───────────────────────┘
```

**Mobile Adjustments:**
- Single column layout
- Full-width cards
- Smaller icons (40px)
- Reduced padding (24px)
- Smaller typography (titles 20px, body 16px)
- Stack vertically with 16px gap

---

## 🚶 Section 4: How It Works

### Desktop Layout (1920×1080)

```
┌─────────────────────────────────────────────────────────────┐
│  [Light gradient background: green to blue, 5% opacity]      │
│  [120px padding top/bottom]                                  │
│                                                              │
│                  How CaddyAI Works                           │
│              Get Started in 3 Easy Steps                     │
│              [48px, Inter Semibold, centered]                │
│                                                              │
│                                                              │
│   ┌────────┐          ┌────────┐          ┌────────┐       │
│   │   ①   │══════════│   ②   │══════════│   ③   │       │
│   │  [●]  │  [Line]  │  [●]  │  [Line]  │  [●]  │       │
│   └────────┘          └────────┘          └────────┘       │
│   [48px circle]       [2px line, green]   [48px circle]    │
│   [Gradient bg]       [Animated draw]     [Gradient bg]    │
│       │                   │                   │             │
│       │                   │                   │             │
│   ┌───▼────────┐      ┌───▼────────┐      ┌───▼──────┐   │
│   │            │      │            │      │          │   │
│   │   📱      │      │   ⛳      │      │   📊    │   │
│   │  [40px]   │      │  [40px]   │      │  [40px]  │   │
│   │            │      │            │      │          │   │
│   │  Set Up    │      │  Get on    │      │  Play    │   │
│   │  Your      │      │  the       │      │  Smarter │   │
│   │  Profile   │      │  Course    │      │          │   │
│   │ [24px bold]│      │ [24px bold]│      │[24px bold│   │
│   │            │      │            │      │          │   │
│   │ Enter your │      │ Open the   │      │ Get club │   │
│   │ club       │      │ app, select│      │ recommen-│   │
│   │ distances  │      │ your course│      │ dations  │   │
│   │ and swing  │      │ and current│      │ in real  │   │
│   │ preferences│      │ hole to    │      │ time     │   │
│   │ in under   │      │ start      │      │ based on │   │
│   │ 2 minutes  │      │ tracking   │      │ distance │   │
│   │            │      │            │      │ & condit │   │
│   │ [18px gray]│      │ [18px gray]│      │[18px gray│   │
│   │            │      │            │      │          │   │
│   └────────────┘      └────────────┘      └──────────┘   │
│   [Card 1]            [Card 2]            [Card 3]        │
│   [360px width each]                                       │
│                                                              │
│   [Progress indicator at bottom: fills as user scrolls]     │
│   [━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━]                   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Element Specifications:**

**Timeline Connector:**
- Line width: 2px
- Color: #1B5E20 (primary green)
- Length: 200px between circles
- Animation: Draw from left to right on scroll

**Step Circles:**
- Size: 80px × 80px
- Background: Linear-gradient (#1B5E20 to #76FF03)
- Border: 4px solid white
- Number: 32px, white, bold (Montserrat)
- Box-shadow: 0 4px 12px rgba(27, 94, 32, 0.3)
- Z-index: 10 (above line)

**Step Cards:**
- Width: 360px
- Min-height: 420px
- Background: White
- Border: 1px solid rgba(27, 94, 32, 0.2)
- Border-radius: 16px
- Padding: 32px
- Box-shadow: 0 4px 16px rgba(0,0,0,0.06)
- Hover: Scale 1.03, shadow increase

**Step Icon:**
- Size: 64px × 64px
- Background: Light green (#E8F5E9)
- Border-radius: 12px
- Icon: 40px, primary green
- Margin-bottom: 24px

**Step Title:**
- Font: Inter Semibold, 24px
- Color: #263238
- Margin-bottom: 16px

**Step Description:**
- Font: Open Sans Regular, 18px
- Color: #607D8B
- Line-height: 1.7

**Progress Indicator:**
- Width: 600px, centered
- Height: 4px
- Background: rgba(27, 94, 32, 0.2)
- Fill: #1B5E20 (animates based on scroll position)

**Animations:**
- Timeline draws on scroll
- Cards fade in sequentially (200ms delay each)
- Active step pulses gently
- Icons rotate on card hover

---

### Mobile Layout (375×812)

```
┌───────────────────────┐
│ [Gradient background] │
│ [60px padding]        │
│                       │
│   How CaddyAI Works   │
│   Get Started in      │
│   3 Easy Steps        │
│   [28px, centered]    │
│                       │
│       ┌──┐            │
│       │①│            │
│       └──┘            │
│        │              │
│        │              │
│   ┌────▼──────────┐   │
│   │               │   │
│   │   📱         │   │
│   │   Set Up      │   │
│   │   Your Profile│   │
│   │               │   │
│   │   Enter your  │   │
│   │   club        │   │
│   │   distances...│   │
│   │               │   │
│   └───────────────┘   │
│        │              │
│        │              │
│       ┌──┐            │
│       │②│            │
│       └──┘            │
│        │              │
│        │              │
│   ┌────▼──────────┐   │
│   │   ⛳          │   │
│   │   Get on      │   │
│   │   the Course  │   │
│   │   [...]       │   │
│   └───────────────┘   │
│        │              │
│        │              │
│       ┌──┐            │
│       │③│            │
│       └──┘            │
│        │              │
│        │              │
│   ┌────▼──────────┐   │
│   │   📊         │   │
│   │   Play        │   │
│   │   Smarter     │   │
│   │   [...]       │   │
│   └───────────────┘   │
│                       │
└───────────────────────┘
```

**Mobile Adjustments:**
- Vertical timeline (left-aligned)
- Step circles: 48px (reduced from 80px)
- Cards: Full-width
- Vertical connector line on left side
- Reduced padding and font sizes
- Cards stack vertically with 24px gap

---

## 🔬 Section 5: Technology Deep-Dive

### Desktop Layout (1920×1080)

```
┌─────────────────────────────────────────────────────────────┐
│  [White background]                                          │
│  [120px padding top/bottom]                                  │
│                                                              │
│  ┌────────────────────────────────┬─────────────────────┐   │
│  │  LEFT COLUMN (50%)             │  RIGHT COLUMN (50%) │   │
│  │  [Content scrolls normally]    │  [Sticky position]  │   │
│  │                                │                     │   │
│  │  The CaddyAI Difference        │    ┌────────────┐  │   │
│  │  [36px, Inter Bold]            │    │            │  │   │
│  │                                │    │  [Phone    │  │   │
│  │  ✓ AI-Powered Intelligence    │    │   Mockup   │  │   │
│  │    [20px title, 600 weight]   │    │   showing  │  │   │
│  │                                │    │   animated │  │   │
│  │    Machine learning analyzes   │    │   UI]      │  │   │
│  │    millions of shots to give   │    │            │  │   │
│  │    you the perfect club        │    │   Screen   │  │   │
│  │    recommendation every time   │    │   cycles:  │  │   │
│  │    [16px, gray, 200px indent]  │    │   - Club   │  │   │
│  │                                │    │     select │  │   │
│  │  ✓ Real-Time Data Integration │    │   - Weather│  │   │
│  │    [20px title]                │    │   - Shot   │  │   │
│  │                                │    │     calc   │  │   │
│  │    Live weather, wind speed,   │    │            │  │   │
│  │    elevation, and course       │    │  [Floating │  │   │
│  │    conditions update every     │    │   with 3D  │  │   │
│  │    shot for maximum accuracy   │    │   shadow]  │  │   │
│  │    [16px, gray, 200px indent]  │    │            │  │   │
│  │                                │    └────────────┘  │   │
│  │  ✓ Personalized                │                     │   │
│  │    Recommendations             │    ┌────────────┐  │   │
│  │    [20px title]                │    │ [Toggle]   │  │   │
│  │                                │    │            │  │   │
│  │    Your unique swing profile,  │    │ With AI    │  │   │
│  │    club distances, and playing │    │  ⬤  ○     │  │   │
│  │    style are all factored into │    │ Without AI │  │   │
│  │    every recommendation        │    │            │  │   │
│  │    [16px, gray, 200px indent]  │    │ [Shows     │  │   │
│  │                                │    │  compari-  │  │   │
│  │  ✓ Proven Results              │    │  son of    │  │   │
│  │    [20px title]                │    │  golfer    │  │   │
│  │                                │    │  choices]  │  │   │
│  │    Average score improvement:  │    │            │  │   │
│  │    5.2 strokes in first month  │    └────────────┘  │   │
│  │    92% recommend to friends    │                     │   │
│  │    [16px, gray, 200px indent]  │                     │   │
│  │                                │                     │   │
│  └────────────────────────────────┴─────────────────────┘   │
│                                                              │
│  [Background: Subtle diagonal lines pattern, 2% opacity]     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Element Specifications:**

**Split Layout:**
- Left column: 50% width, normal scroll
- Right column: 50% width, position: sticky, top: 100px
- Gap: 80px horizontal
- Max-width: 1280px, centered

**Section Title:**
- Font: Inter Bold, 36px
- Color: #263238
- Margin-bottom: 48px

**Feature Bullet:**
- Check icon: 24px, primary green, in circle background
- Title: Inter Semibold, 20px, #263238
- Description: Open Sans Regular, 16px, #607D8B
- Indent: 40px (after check icon)
- Spacing: 40px between bullets

**Phone Mockup (Right):**
- Size: 320px × 640px
- Shadow: 0 20px 60px rgba(0,0,0,0.2)
- Background: White with app UI screenshots
- Animation: Screen content cycles every 4 seconds
- Transitions: Fade between screens (0.6s)

**Toggle Comparison:**
- Width: 300px
- Height: 400px
- Background: Light gray (#F5F5F5)
- Border-radius: 16px
- Padding: 24px
- Toggle switch: 60px × 32px, animated
- Comparison content: Changes based on toggle state

**Background Pattern:**
- Diagonal lines: 45deg angle
- Stroke: 1px, #1B5E20
- Opacity: 2%
- Spacing: 40px between lines

---

### Mobile Layout (375×812)

```
┌───────────────────────┐
│ [White background]    │
│ [60px padding]        │
│                       │
│  The CaddyAI          │
│  Difference           │
│  [28px, bold]         │
│                       │
│   [Phone Mockup]      │
│   [280px × 560px]     │
│   [Centered]          │
│   [Animated screens]  │
│                       │
│ ┌───────────────────┐ │
│ │ [Toggle]          │ │
│ │ With AI  ⬤  ○    │ │
│ │ Without AI        │ │
│ │ [Comparison view] │ │
│ └───────────────────┘ │
│                       │
│ ✓ AI-Powered          │
│   Intelligence        │
│   [18px title]        │
│                       │
│   Machine learning    │
│   analyzes millions   │
│   of shots...         │
│   [14px, gray]        │
│                       │
│ ✓ Real-Time Data      │
│   Integration         │
│   [...]               │
│                       │
│ ✓ Personalized        │
│   Recommendations     │
│   [...]               │
│                       │
│ ✓ Proven Results      │
│   [...]               │
│                       │
└───────────────────────┘
```

**Mobile Adjustments:**
- Single column, stacked layout
- Phone mockup shown first (above content)
- Toggle comparison below mockup
- Feature bullets: Full-width, smaller text
- Remove sticky behavior
- Reduced spacing between sections

---

## 💰 Section 6: Pricing

### Desktop Layout (1920×1080)

```
┌─────────────────────────────────────────────────────────────┐
│  [Light gray background #F5F5F5]                             │
│  [120px padding top/bottom]                                  │
│                                                              │
│                  Choose Your Plan                            │
│              Start Free, Upgrade Anytime                     │
│              [48px, Inter Semibold, centered]                │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │              │  │ ⭐ POPULAR   │  │              │      │
│  │              │  │ [Badge, gold]│  │              │      │
│  │    Free      │  │    Pro       │  │    Tour      │      │
│  │  [32px bold] │  │  [32px bold] │  │  [32px bold] │      │
│  │              │  │              │  │              │      │
│  │    $0        │  │   $9.99      │  │   $19.99     │      │
│  │   /month     │  │   /month     │  │   /month     │      │
│  │  [48px/16px] │  │  [48px/16px] │  │  [48px/16px] │      │
│  │              │  │              │  │              │      │
│  │  Perfect for │  │  For serious │  │  For         │      │
│  │  trying out  │  │  golfers     │  │  competitive │      │
│  │  [14px gray] │  │  [14px gray] │  │  [14px gray] │      │
│  │              │  │              │  │              │      │
│  │  ──────────  │  │  ──────────  │  │  ──────────  │      │
│  │              │  │              │  │              │      │
│  │  ✓ Basic club│  │  ✓ Everything│  │  ✓ All Pro   │      │
│  │    selection │  │    in Free   │  │    features  │      │
│  │  ✓ 10 rounds │  │  ✓ Real-time │  │  ✓ Advanced  │      │
│  │    per month │  │    weather   │  │    analytics │      │
│  │  ✓ Course    │  │  ✓ Wind &    │  │  ✓ Course    │      │
│  │    database  │  │    elevation │  │    management│      │
│  │              │  │  ✓ Unlimited │  │  ✓ AI Coach  │      │
│  │              │  │    rounds    │  │    (beta)    │      │
│  │              │  │  ✓ Shot      │  │  ✓ Priority  │      │
│  │              │  │    tracking  │  │    support   │      │
│  │              │  │  ✓ Stats     │  │  ✓ Custom    │      │
│  │              │  │    history   │  │    reports   │      │
│  │              │  │              │  │              │      │
│  │              │  │              │  │              │      │
│  │ [Get Started]│  │ [Start Trial]│  │ [Start Trial]│      │
│  │  [Outline]   │  │  [Primary,   │  │  [Outline]   │      │
│  │              │  │   elevated]  │  │              │      │
│  │              │  │              │  │              │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  [White bg]        [White bg,       [White bg]             │
│  [1px border]       2px green                               │
│                     border,                                 │
│                     elevated                                │
│                     shadow]                                 │
│                                                              │
│              [See Full Comparison ▼]                         │
│              [Link, expands table below]                     │
│                                                              │
│              💰 30-Day Money-Back Guarantee                  │
│              [18px, with shield icon]                        │
│                                                              │
│              🎉 Save 20% with annual billing                 │
│              [16px, with badge]                              │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Element Specifications:**

**Pricing Cards:**
- Width: 360px
- Min-height: 600px
- Background: White
- Border: 1px solid #E0E0E0
- Border-radius: 16px
- Padding: 40px 32px
- Gap: 24px horizontal

**Pro Card (Highlighted):**
- Border: 2px solid #1B5E20
- Box-shadow: 0 8px 24px rgba(27, 94, 32, 0.15)
- Transform: scale(1.05) translateY(-10px)
- Z-index: 10

**Popular Badge:**
- Position: Absolute, top: -12px
- Background: Linear-gradient (#FFC107 to #FFB300)
- Padding: 8px 24px
- Border-radius: 20px
- Font: Inter Bold, 12px, uppercase
- Color: #263238
- Box-shadow: 0 2px 8px rgba(255, 193, 7, 0.4)

**Plan Name:**
- Font: Inter Bold, 32px
- Color: #263238
- Margin-bottom: 8px
- Text-align: center

**Price:**
- Font: Montserrat Bold, 48px
- Color: #1B5E20
- Line-height: 1
- Margin-bottom: 4px

**Period:**
- Font: Open Sans Regular, 16px
- Color: #607D8B
- Margin-bottom: 16px

**Description:**
- Font: Open Sans Regular, 14px
- Color: #607D8B
- Text-align: center
- Margin-bottom: 24px

**Feature List:**
- Check icon: 16px, primary green
- Text: Open Sans Regular, 16px, #263238
- Line-height: 2.0 (generous spacing)
- Indent: 24px

**CTA Button:**
- Width: 100%
- Height: 48px
- Border-radius: 12px
- Font: Inter Semibold, 16px
- Margin-top: auto (pushes to bottom)

**Comparison Link:**
- Font: Inter Semibold, 16px
- Color: #1B5E20
- Text-decoration: none
- Hover: Underline
- Icon: Chevron down, animated rotation on expand

**Guarantee Badge:**
- Display: Inline-flex, center-aligned
- Icon: Shield, 24px, gold color
- Text: Open Sans Semibold, 18px
- Color: #263238

**Annual Discount Banner:**
- Background: Linear-gradient (#76FF03 to #64DD17)
- Padding: 12px 24px
- Border-radius: 8px
- Font: Inter Semibold, 16px
- Icon: Celebration emoji, 20px

---

### Mobile Layout (375×812)

```
┌───────────────────────┐
│ [Gray background]     │
│ [48px padding]        │
│                       │
│   Choose Your Plan    │
│   Start Free,         │
│   Upgrade Anytime     │
│   [28px, centered]    │
│                       │
│ ┌───────────────────┐ │
│ │                   │ │
│ │   Free            │ │
│ │   $0 /month       │ │
│ │   [...]           │ │
│ │   [Get Started]   │ │
│ │                   │ │
│ └───────────────────┘ │
│                       │
│ ┌───────────────────┐ │
│ │ ⭐ POPULAR        │ │
│ │                   │ │
│ │   Pro             │ │
│ │   $9.99 /month    │ │
│ │   [...]           │ │
│ │   [Start Trial]   │ │
│ │   [Primary btn]   │ │
│ │                   │ │
│ └───────────────────┘ │
│ [Elevated, green      │
│  border]              │
│                       │
│ ┌───────────────────┐ │
│ │                   │ │
│ │   Tour            │ │
│ │   $19.99 /month   │ │
│ │   [...]           │ │
│ │   [Start Trial]   │ │
│ │                   │ │
│ └───────────────────┘ │
│                       │
│ [See Comparison ▼]    │
│                       │
│ 💰 30-Day Money-Back  │
│                       │
│ 🎉 Save 20% annually  │
│                       │
└───────────────────────┘
```

**Mobile Adjustments:**
- Single column, stacked vertically
- Full-width cards
- Pro card maintains elevated styling
- Reduced padding and font sizes
- Buttons: Full-width
- Feature lists: Condensed spacing
- 16px gap between cards

---

## 🎯 Section 7: Final CTA

### Desktop Layout (1920×1080)

```
┌─────────────────────────────────────────────────────────────┐
│  [Full-width gradient background: 135deg, green to blue]     │
│  [Background image: Golfer celebrating on scenic course]     │
│  [Dark overlay: rgba(0,0,0,0.4) for text readability]        │
│  [120px padding top/bottom]                                  │
│                                                              │
│                                                              │
│              Ready to Lower Your Score?                      │
│              [60px, Montserrat Bold, white]                  │
│                                                              │
│          Join thousands of golfers already using             │
│              CaddyAI to play their best                      │
│          [20px, Open Sans, white with 80% opacity]           │
│                                                              │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                                                      │   │
│  │  [Email input - 400px width]      [Start Free] ➜   │   │
│  │  Enter your email...              [Button, 180px]  │   │
│  │  [56px height, white bg]          [56px, primary]  │   │
│  │                                                      │   │
│  └──────────────────────────────────────────────────────┘   │
│  [Inline form - 600px total width, centered]                │
│  [Pulse animation on button]                                 │
│                                                              │
│                                                              │
│              Or download the app:                            │
│              [16px, white with 60% opacity]                  │
│                                                              │
│      ┌───────────────┐        ┌───────────────┐             │
│      │  📱 App Store │        │  🤖 Play Store│             │
│      │  [Badge logo] │        │  [Badge logo] │             │
│      └───────────────┘        └───────────────┘             │
│      [Official badges, 160px width each, 16px gap]           │
│                                                              │
│                                                              │
│          ✓ No credit card required                           │
│          ✓ Cancel anytime                                    │
│          ✓ 30-day money-back guarantee                       │
│          [14px, white with 70% opacity, checkmarks]          │
│                                                              │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Element Specifications:**

**Background:**
- Gradient: Linear-gradient(135deg, #1B5E20 0%, #2196F3 100%)
- Background image: High-resolution photo (1920px min)
- Image treatment: Parallax scroll (50% speed)
- Overlay: rgba(0,0,0,0.4) for contrast

**Headline:**
- Font: Montserrat Bold, 60px
- Color: White
- Text-shadow: 0 2px 8px rgba(0,0,0,0.3)
- Margin-bottom: 16px
- Max-width: 800px, centered

**Subheadline:**
- Font: Open Sans Regular, 20px
- Color: White with 80% opacity
- Margin-bottom: 48px
- Max-width: 600px, centered

**Email Capture Form:**
- Display: Flex, inline, centered
- Total width: 600px
- Gap: 8px between input and button

**Email Input:**
- Width: 400px
- Height: 56px
- Background: White
- Border: 2px solid transparent
- Border-radius: 12px
- Padding: 0 20px
- Font: Open Sans Regular, 16px
- Placeholder: #9E9E9E
- Focus: Border-color #76FF03, shadow glow

**Submit Button:**
- Width: 180px
- Height: 56px
- Background: #1B5E20
- Color: White
- Font: Inter Semibold, 16px
- Border-radius: 12px
- Arrow icon: →, inline, 16px
- Shadow: 0 4px 12px rgba(27, 94, 32, 0.4)
- Hover: Background darken, lift effect
- Animation: Pulse (shadow expands/contracts)

**App Store Badges:**
- Width: 160px each
- Height: 48px
- Official Apple/Google badge designs
- Gap: 16px between badges
- Hover: Slight lift (translateY -2px)

**Trust Bullets:**
- Font: Open Sans Regular, 14px
- Color: White with 70% opacity
- Check icons: 16px, green (#76FF03)
- Spacing: 12px between bullets
- Display: Inline, centered

**Animations:**
- Background image: Parallax (scrolls slower than content)
- Submit button: Pulse animation (2s infinite)
- Form: Fade up on scroll into view
- Trust bullets: Stagger fade-in

---

### Mobile Layout (375×812)

```
┌───────────────────────┐
│ [Gradient background] │
│ [Background image]    │
│ [Dark overlay]        │
│ [60px padding]        │
│                       │
│   Ready to Lower      │
│   Your Score?         │
│   [36px, bold, white] │
│                       │
│   Join thousands      │
│   of golfers using    │
│   CaddyAI             │
│   [16px, white 80%]   │
│                       │
│ ┌───────────────────┐ │
│ │ Enter your email  │ │
│ │ [Input, full-     │ │
│ │  width, 48px]     │ │
│ └───────────────────┘ │
│                       │
│ ┌───────────────────┐ │
│ │ Start Free Trial→ │ │
│ │ [Button, full-    │ │
│ │  width, 48px]     │ │
│ └───────────────────┘ │
│ [Stacked vertically,  │
│  16px gap]            │
│                       │
│   Or download:        │
│   [14px, white 60%]   │
│                       │
│ ┌───────────────────┐ │
│ │  📱 App Store     │ │
│ └───────────────────┘ │
│                       │
│ ┌───────────────────┐ │
│ │  🤖 Google Play   │ │
│ └───────────────────┘ │
│ [Full-width badges,   │
│  12px gap]            │
│                       │
│   ✓ No credit card    │
│   ✓ Cancel anytime    │
│   [12px, white 70%]   │
│                       │
└───────────────────────┘
```

**Mobile Adjustments:**
- Stack email input and button vertically
- Full-width form elements
- Reduced headline size (36px)
- Smaller padding (24px)
- App store badges: Full-width, stacked
- Trust bullets: 2 most important ones only
- Reduced font sizes throughout

---

## 📱 Global Elements

### Navigation Header (Desktop)

```
┌─────────────────────────────────────────────────────────────┐
│  [80px height, fixed position, transparent initially]        │
│  [Backdrop blur + white background on scroll]                │
│                                                              │
│  ┌────┐                                        ┌──────────┐ │
│  │Logo│  Features  How  Pricing  About         │ Sign In  │ │
│  │40px│  [16px, 600 weight, 24px spacing]      │ [Outline]│ │
│  └────┘                                        └──────────┘ │
│                                                 ┌──────────┐ │
│                                                 │Get Started│ │
│                                                 │ [Primary]│ │
│                                                 └──────────┘ │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**On Scroll:**
- Background: White with backdrop-blur(10px)
- Shadow: 0 2px 8px rgba(0,0,0,0.08)
- Smooth transition: 0.3s ease

### Navigation Header (Mobile)

```
┌───────────────────────┐
│ [60px height]         │
│                       │
│ ┌────┐         ☰     │
│ │Logo│      [Menu]   │
│ │32px│      [24px]   │
│ └────┘               │
│                       │
└───────────────────────┘
```

**Mobile Menu (Expanded):**
```
┌───────────────────────┐
│ [Full screen overlay] │
│ [Dark bg, blur]       │
│                       │
│         ✕             │
│      [Close]          │
│                       │
│     Features          │
│     [56px tap area]   │
│                       │
│     How It Works      │
│     [56px tap area]   │
│                       │
│     Pricing           │
│     [56px tap area]   │
│                       │
│     About             │
│     [56px tap area]   │
│                       │
│     Sign In           │
│     [56px tap area]   │
│                       │
│  ┌─────────────────┐  │
│  │  Get Started    │  │
│  │  [Primary CTA]  │  │
│  └─────────────────┘  │
│                       │
└───────────────────────┘
```

### Footer (Desktop)

```
┌─────────────────────────────────────────────────────────────┐
│  [Dark background: #263238]                                  │
│  [80px padding top/bottom]                                   │
│                                                              │
│  ┌────────────┬────────────┬────────────┬─────────────┐    │
│  │ CaddyAI    │ Product    │ Company    │ Legal       │    │
│  │            │            │            │             │    │
│  │ Your AI    │ Features   │ About Us   │ Privacy     │    │
│  │ golf caddy │ Pricing    │ Blog       │ Terms       │    │
│  │ in your    │ Download   │ Careers    │ Cookies     │    │
│  │ pocket     │ Support    │ Press      │ GDPR        │    │
│  │            │            │ Contact    │             │    │
│  │ ┌─┐ ┌─┐ ┌─┐│           │            │             │    │
│  │ │f│ │t│ │i││            │            │             │    │
│  │ └─┘ └─┘ └─┘│           │            │             │    │
│  │ [Social]   │            │            │             │    │
│  │            │            │            │             │    │
│  └────────────┴────────────┴────────────┴─────────────┘    │
│                                                              │
│  ─────────────────────────────────────────────────────────  │
│                                                              │
│  © 2025 CaddyAI. All rights reserved.                       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## ✅ Wireframe Deliverables Checklist

- [x] Desktop wireframes for all 7 sections
- [x] Mobile wireframes for all 7 sections
- [x] Navigation header specifications
- [x] Footer specifications
- [x] Grid system documentation
- [x] Element sizing and spacing
- [x] Responsive breakpoint adjustments
- [x] Interaction states
- [x] Animation notes

---

## 📝 Implementation Notes for Level 2

### Critical Measurements:
1. **Section padding:** 120px desktop, 60px mobile
2. **Card spacing:** 24px gap on desktop, 16px mobile
3. **Button height:** 56px (desktop), 48px (mobile)
4. **Touch targets:** Minimum 44px × 44px
5. **Typography scale:** Follows defined scale in DESIGN_SYSTEM.md
6. **Max content width:** 1280px, centered

### Animation Triggers:
1. **Hero:** Load immediately
2. **Social Proof:** Fade in on scroll (20% threshold)
3. **Features:** Stagger cards (100ms delay each)
4. **How It Works:** Timeline draws on scroll
5. **Technology:** Sticky scroll with content sync
6. **Pricing:** Fade up on scroll
7. **Final CTA:** Parallax background + pulse CTA

### Performance Budget:
- First Contentful Paint: < 1.5s
- Largest Contentful Paint: < 2.5s
- Total Blocking Time: < 300ms
- Cumulative Layout Shift: < 0.1

---

**Status:** ✅ Ready for Development
**Next Step:** Implementation by Level 2 Developer
