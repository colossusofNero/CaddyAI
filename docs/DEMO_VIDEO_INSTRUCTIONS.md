# CaddyAI Demo Video - Production Guide

**Purpose:** Create a compelling 30-60 second demo video showcasing CaddyAI's core features
**Target Audience:** Golfers looking for AI-powered club recommendations
**Platform:** Homepage hero section and marketing materials

---

## Video Specifications

### Technical Requirements
- **Duration:** 30-60 seconds
- **Resolution:** 1080p minimum (1920x1080)
- **Format:** MP4 (H.264 codec)
- **Aspect Ratio:** 16:9 (landscape) or 9:16 (vertical for mobile)
- **Frame Rate:** 30fps or 60fps
- **File Size:** Under 10MB for web optimization
- **Audio:** Optional background music (keep subtle)

### File Location
- Save final video as: `public/videos/demo.mp4`
- Placeholder currently at: `public/videos/golf-hero.mp4`

---

## Shot List & Storyboard

### Opening (0-5 seconds)
**Scene:** Golfer on course looking at phone
**Focus:** Show CaddyAI app opening on mobile device
**Text Overlay:** "CaddyAI - Your AI Caddy"

### Feature 1: Club Selection (5-15 seconds)
**Scene:** Close-up of phone screen showing club recommendation
**Highlight:**
- Hole information (Hole 7, Par 4, 385 yards)
- Wind indicator (↗ 15 mph)
- **Recommended club** displayed prominently (e.g., "7 Iron")
- Distance to pin (150 yds)

**Text Overlay:** "AI-Powered Club Recommendations"

### Feature 2: Real-Time Conditions (15-30 seconds)
**Scene:** Split screen or transition showing:
- Weather data integration
- Wind speed and direction
- Elevation changes
- Course conditions

**Text Overlay:** "Real-Time Weather & Wind Integration"

### Feature 3: Shot Tracking (30-45 seconds)
**Scene:** Golfer takes shot, app tracks it
**Highlight:**
- Shot distance recorded
- Ball flight path visualization
- Club used and result saved

**Text Overlay:** "Track Every Shot"

### Feature 4: Analytics Dashboard (45-55 seconds)
**Scene:** Show analytics screen
**Highlight:**
- Round statistics
- Club performance data
- Improvement trends
- Strokes gained/lost

**Text Overlay:** "Improve Your Game"

### Closing (55-60 seconds)
**Scene:** Golfer smiling, successful shot
**CTA:** "Start Your Free Trial"
**Logo:** CaddyAI logo with tagline

---

## Production Tips

### Filming Best Practices
1. **Golden Hour:** Film during morning or late afternoon for best lighting
2. **Stable Shots:** Use gimbal or tripod for phone screen recordings
3. **Screen Recording:** Use iOS Screen Recording or Android equivalent
4. **B-Roll:** Capture additional golf course footage for transitions
5. **Audio:** Record in quiet environment or use royalty-free music

### Screen Recording Setup
- **iOS:** Settings > Control Center > Screen Recording
- **Android:** Quick Settings > Screen Recorder
- **Pro Tip:** Enable "Show Touches" in developer settings for clarity

### App Demo Flow
1. Open CaddyAI app
2. Navigate to active round
3. Select Hole 7 (or current hole)
4. Show club recommendation card prominently
5. Demonstrate wind indicator interaction
6. Show course map if available
7. Display shot tracking after club selection
8. Show quick glimpse of analytics

---

## Post-Production Checklist

### Video Editing
- [ ] Trim to 30-60 seconds
- [ ] Add smooth transitions (1-2 seconds max)
- [ ] Include text overlays for each feature
- [ ] Color grade for consistency
- [ ] Add subtle background music (royalty-free)
- [ ] Export in H.264 format at 1080p

### Optimization
- [ ] Compress video to under 10MB
- [ ] Test video loads quickly on 3G/4G
- [ ] Create thumbnail image (1920x1080)
- [ ] Generate video poster frame

### Brand Consistency
- [ ] Use CaddyAI primary colors (green #10B981, blue accent)
- [ ] Include logo in opening and closing
- [ ] Match website typography and style
- [ ] Follow design system guidelines

---

## Software Recommendations

### Screen Recording
- **macOS:** QuickTime Player or ScreenFlow
- **Windows:** OBS Studio or Camtasia
- **Mobile:** iOS Screen Recording or AZ Screen Recorder (Android)

### Video Editing
- **Professional:** Adobe Premiere Pro, Final Cut Pro
- **User-Friendly:** iMovie, DaVinci Resolve (free)
- **Online:** Clipchamp, Kapwing

### Compression/Optimization
- HandBrake (free)
- Adobe Media Encoder
- FFmpeg (command-line)

---

## Content Guidelines

### Do's
✅ Show real golf course settings
✅ Display actual app functionality
✅ Keep focus on key features
✅ Use clear, readable text overlays
✅ Demonstrate smooth user experience
✅ Show happy, successful golfers

### Don'ts
❌ No lorem ipsum or placeholder content
❌ Avoid shaky or blurry footage
❌ Don't use copyrighted music
❌ No slow loading or app errors
❌ Avoid cluttered or busy scenes
❌ Don't exceed 60 seconds

---

## Quick Start Script

### Minimal Viable Demo (30 seconds)
```
[0-5s]   CaddyAI logo appears → Golfer opens app
[5-15s]  Close-up: Club recommendation card (7 Iron, 150 yds)
[15-25s] Shot tracking: Golfer takes shot, app records it
[25-30s] CTA: "Start Your Free Trial" + logo
```

### Full-Featured Demo (60 seconds)
```
[0-5s]   Opening: Golfer on course, opens CaddyAI
[5-15s]  Hole info: Par 4, 385 yards, wind indicator
[15-25s] Club recommendation: 7 Iron highlighted
[25-35s] Weather integration: Real-time wind data
[35-45s] Shot tracking: Ball flight visualization
[45-55s] Analytics: Round stats and improvement trends
[55-60s] CTA: "Get Started Free" + logo
```

---

## Testing & Deployment

### Pre-Launch Checklist
- [ ] Test video on desktop (Chrome, Safari, Firefox)
- [ ] Test video on mobile (iOS Safari, Chrome)
- [ ] Verify autoplay works (muted)
- [ ] Check video loop functionality
- [ ] Ensure fallback image displays
- [ ] Test page load speed impact
- [ ] Verify accessibility (captions if needed)

### File Placement
1. Save final video: `public/videos/demo.mp4`
2. Update Hero component to use new video path
3. Create poster image: `public/images/demo-poster.jpg`
4. Update video src in `components/Hero.tsx`

---

## Resources & Assets

### Stock Footage (if needed)
- Pexels: https://www.pexels.com/search/golf/
- Unsplash: https://unsplash.com/s/photos/golf
- Pixabay: https://pixabay.com/videos/search/golf/

### Royalty-Free Music
- YouTube Audio Library
- Epidemic Sound
- Artlist

### Color Reference
- Primary Green: `#10B981`
- Accent Blue: `#3B82F6`
- Secondary Dark: `#1F2937`
- Background: `#0A0F1E`

---

## Questions or Issues?

Contact the development team or refer to:
- Design System: `DESIGN_SYSTEM.md`
- Homepage Guide: `HOMEPAGE_IMPROVEMENTS.md`
- Component Docs: `components/README.md`

---

**Last Updated:** October 23, 2025
**Status:** Ready for production
