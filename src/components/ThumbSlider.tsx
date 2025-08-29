@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 221.2 83.2% 53.3%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96%;
    --secondary-foreground: 222.2 84% 4.9%;
    --muted: 210 40% 96%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96%;
    --accent-foreground: 222.2 84% 4.9%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 221.2 83.2% 53.3%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 217.2 91.2% 59.8%;
    --primary-foreground: 222.2 84% 4.9%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 224.3 76.3% 94.1%;
  }
}

@layer base {
  * { border-color: hsl(var(--border)); }
  body { @apply bg-background text-foreground; }
}

/* Custom scrollbar styles */
.scrollbar-thin { scrollbar-width: thin; }
.scrollbar-thin::-webkit-scrollbar { width: 6px; }
.scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
.scrollbar-thin::-webkit-scrollbar-thumb { background: hsl(var(--border)); border-radius: 3px; }
.scrollbar-thin::-webkit-scrollbar-thumb:hover { background: hsl(var(--muted-foreground)); }

/* Animation classes */
.animate-fade-in { animation: fadeIn 0.5s ease-in-out; }
.animate-slide-up { animation: slideUp 0.3s ease-out; }
.animate-pulse-subtle { animation: pulseSubtle 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }

@keyframes fadeIn { 0% { opacity: 0; } 100% { opacity: 1; } }
@keyframes slideUp { 0% { transform: translateY(10px); opacity: 0; } 100% { transform: translateY(0); opacity: 1; } }
@keyframes pulseSubtle { 0%, 100% { opacity: 1; } 50% { opacity: 0.8; } }

/* ============================ */
/* Big, thumb-friendly slider   */
/* Themed + shows filled track  */
/* ============================ */
.thumb-range {
  --track: hsl(var(--input));
  --fill: hsl(var(--primary));
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 16px;                 /* THICK track */
  border-radius: 9999px;        /* pill */
  outline: none;
  cursor: pointer;
  touch-action: pan-y;          /* play nice with vertical scrolling */
  padding-block: 14px;          /* bigger tap target */
  background-clip: content-box; /* keep visual track at 16px */
  accent-color: var(--fill);    /* fallback where supported */

  /* Filled portion via gradient */
  background:
    linear-gradient(var(--fill), var(--fill)) 0/var(--pct, 0%) 100% no-repeat,
    var(--track);
}

/* WebKit (iOS Safari, Chrome) */
.thumb-range::-webkit-slider-runnable-track {
  height: 16px;
  border-radius: 9999px;
  background:
    linear-gradient(var(--fill), var(--fill)) 0/var(--pct, 0%) 100% no-repeat,
    var(--track);
}
.thumb-range::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 40px; height: 40px;   /* BIG thumb for iPhone */
  border-radius: 9999px;
  background: var(--fill);
  border: 4px solid white;     /* nice ring */
  box-shadow: 0 1px 2px rgba(0,0,0,0.2);
  margin-top: -12px;           /* center thumb on 16px track */
  transition: transform 120ms ease;
}
.thumb-range:focus::-webkit-slider-thumb {
  outline: 3px solid hsl(var(--ring));
  outline-offset: 2px;
}
@media (hover: hover) {
  .thumb-range:hover::-webkit-slider-thumb { transform: scale(1.04); }
}

/* Firefox */
.thumb-range::-moz-range-track {
  height: 16px;
  border-radius: 9999px;
  background: var(--track);
}
.thumb-range::-moz-range-progress {
  height: 16px;
  border-radius: 9999px;
  background: var(--fill);      /* filled part */
}
.thumb-range::-moz-range-thumb {
  width: 40px; height: 40px;
  border: 4px solid white;
  border-radius: 9999px;
  background: var(--fill);
  box-shadow: 0 1px 2px rgba(0,0,0,0.2);
  transition: transform 120ms ease;
}
.thumb-range:focus::-moz-range-thumb {
  outline: 3px solid hsl(var(--ring));
  outline-offset: 2px;
}
```

---

# `src/components/ThumbSlider.tsx`

```tsx
import React from "react";

type Props = {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string; // e.g., "yds"
  ariaLabel?: string;
};

export default function ThumbSlider({
  label,
  value,
  onChange,
  min = 0,
  max = 400,
  step = 1,
  unit = "",
  ariaLabel,
}: Props) {
  const pct = Math.max(0, Math.min(100, ((value - min) / (max - min || 1)) * 100));

  return (
    <div className="w-full">
      <div className="mb-2 flex items-baseline justify-between">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
          {label}
        </label>
        <div className="text-sm tabular-nums text-gray-600 dark:text-gray-400">
          {value} {unit}
        </div>
      </div>

      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-label={ariaLabel || label}
        onChange={(e) => onChange(Number(e.target.value))}
        className="thumb-range w-full"
        style={{ ['--pct' as any]: `${pct}%` }}
      />
    </div>
  );
}
```
