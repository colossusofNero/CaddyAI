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
  const pctNum = Math.max(0, Math.min(100, ((value - min) / (max - min || 1)) * 100));
  const style: React.CSSProperties = {};
  // Set CSS var in a way that TS/Rollup are happy with
  (style as any)["--pct"] = `${pctNum}%`;

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
        style={style}
      />
    </div>
  );
}
