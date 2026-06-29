'use client';

import { useMemo, useRef, forwardRef, useImperativeHandle } from 'react';
import { DispersionShot, LIE_COLORS } from '@/lib/demo/kingRound';

// Human-readable labels for each lie, in the order shown in the chart legend.
// Keys must match LIE_COLORS in kingRound.ts.
const LIE_LEGEND: Array<{ lie: string; label: string }> = [
  { lie: 'fairway', label: 'Fairway / green / fringe' },
  { lie: 'rough', label: 'Rough' },
  { lie: 'deep-rough', label: 'Deep rough' },
  { lie: 'sand', label: 'Sand' },
  { lie: 'water', label: 'Water' },
  { lie: '', label: 'Unknown' },
];

const VIEW_W = 1200;
const VIEW_H = 880;
const CENTER_X = VIEW_W / 2;
const TARGET_CX = CENTER_X;
const TARGET_CY = 130;
const TARGET_R = 110;
const GRID_TOP = 230;
const GRID_BOTTOM = 850;
const GRID_LEFT = 50;
const GRID_RIGHT = 1150;
const GRID_HEIGHT = GRID_BOTTOM - GRID_TOP;
const Y_MAX_YDS = 300;
const X_HALF_YDS = 60;

function toSvg(distFromPin: number, lateral: number) {
  const clampedY = Math.max(-50, Math.min(Y_MAX_YDS, distFromPin));
  const y = GRID_TOP + (clampedY / Y_MAX_YDS) * GRID_HEIGHT;
  const halfWidth = (GRID_RIGHT - GRID_LEFT) / 2;
  const clampedX = Math.max(-X_HALF_YDS, Math.min(X_HALF_YDS, lateral));
  const x = CENTER_X + (clampedX / X_HALF_YDS) * halfWidth;
  return { x, y };
}

interface Box { x: number; y: number; w: number; h: number }
function overlaps(box: Box, placed: Box[]): boolean {
  return placed.some(p =>
    Math.abs(p.x - box.x) < (p.w + box.w) / 2 &&
    Math.abs(p.y - box.y) < (p.h + box.h) / 2
  );
}
function nudge(box: Box, placed: Box[]): Box {
  if (!overlaps(box, placed)) return box;
  const tries: Array<{ dx: number; dy: number }> = [];
  for (let d = 1; d <= 6; d++) {
    tries.push({ dx: 0, dy: -d * 6 }, { dx: 0, dy: +d * 6 });
    tries.push({ dx: -d * 10, dy: 0 }, { dx: +d * 10, dy: 0 });
    tries.push({ dx: -d * 8, dy: -d * 4 }, { dx: +d * 8, dy: +d * 4 });
  }
  for (const t of tries) {
    const b = { x: box.x + t.dx, y: box.y + t.dy, w: box.w, h: box.h };
    if (!overlaps(b, placed)) return b;
  }
  return box;
}

export interface DispersionChartHandle {
  /** Returns the rendered SVG element (for export to PNG). */
  getSvg(): SVGSVGElement | null;
}

interface Props {
  shots: DispersionShot[];
  className?: string;
}

export const DispersionChart = forwardRef<DispersionChartHandle, Props>(
  function DispersionChart({ shots, className }, ref) {
    const svgRef = useRef<SVGSVGElement>(null);
    useImperativeHandle(ref, () => ({ getSvg: () => svgRef.current }), []);

    const positioned = useMemo(() => {
      const sorted = [...shots].sort((a, b) => a.distFromPin - b.distFromPin);
      const placed: Box[] = [];
      return sorted.map(s => {
        const { x, y } = toSvg(s.distFromPin, s.lateral);
        const box = nudge({ x, y, w: 40, h: 16 }, placed);
        placed.push(box);
        return { ...s, x: box.x, y: box.y };
      });
    }, [shots]);

    const NUM_BANDS = 6;
    const bandLines = Array.from({ length: NUM_BANDS + 1 }, (_, i) => {
      const yds = i * 50;
      const y = GRID_TOP + (yds / Y_MAX_YDS) * GRID_HEIGHT;
      return { yds, y, edge: i === 0 || i === NUM_BANDS };
    });
    const COL1 = GRID_LEFT + (GRID_RIGHT - GRID_LEFT) * 0.32;
    const COL2 = GRID_LEFT + (GRID_RIGHT - GRID_LEFT) * 0.68;

    return (
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        preserveAspectRatio="xMidYMid meet"
        className={className}
        style={{ width: '100%', height: 'auto', display: 'block' }}
      >
        <rect x={0} y={0} width={VIEW_W} height={VIEW_H} fill="#fff" />

        {/* Horizontal band lines + yardage labels */}
        {bandLines.map(({ yds, y, edge }) => (
          <g key={yds}>
            <line
              x1={GRID_LEFT}
              x2={GRID_RIGHT}
              y1={y}
              y2={y}
              stroke="#222"
              strokeWidth={edge ? 2 : 1}
            />
            <text x={GRID_LEFT + 8} y={y + 22} fontSize={18} fontWeight={700} fill="#222">
              {yds} YRD
            </text>
          </g>
        ))}

        {/* Outer vertical edges */}
        {[GRID_LEFT, GRID_RIGHT].map(x => (
          <line key={x} x1={x} x2={x} y1={GRID_TOP} y2={GRID_BOTTOM} stroke="#222" strokeWidth={2} />
        ))}

        {/* Inner column dividers */}
        {[COL1, COL2].map(x => (
          <line key={x} x1={x} x2={x} y1={GRID_TOP} y2={GRID_BOTTOM} stroke="#222" strokeWidth={1} />
        ))}

        {/* Dashed center line through grid */}
        <line
          x1={CENTER_X}
          x2={CENTER_X}
          y1={GRID_TOP}
          y2={GRID_BOTTOM}
          stroke="#222"
          strokeWidth={1}
          strokeDasharray="6 6"
        />

        {/* Target rings + bullseye */}
        {[TARGET_R, TARGET_R * 0.72, TARGET_R * 0.46, TARGET_R * 0.22].map((r, i) => (
          <circle key={i} cx={TARGET_CX} cy={TARGET_CY} r={r} fill="none" stroke="#111" strokeWidth={3} />
        ))}
        <circle cx={TARGET_CX} cy={TARGET_CY} r={9} fill="#111" />

        {/* Continue dashed line through target down to grid */}
        <line
          x1={CENTER_X}
          x2={CENTER_X}
          y1={TARGET_CY}
          y2={GRID_TOP}
          stroke="#222"
          strokeWidth={1}
          strokeDasharray="6 6"
        />

        {/* Lie legend — keyed to LIE_COLORS so the dot/label colors are
            self-explanatory. Sits in the empty top-left corner above the grid,
            and is captured in the PNG export since it lives in the SVG. */}
        {LIE_LEGEND.map((item, i) => {
          const ly = 36 + i * 24;
          return (
            <g key={item.lie}>
              <circle cx={GRID_LEFT + 8} cy={ly} r={7} fill={LIE_COLORS[item.lie]} stroke="#222" strokeWidth={0.75} />
              <text x={GRID_LEFT + 24} y={ly + 5} fontSize={16} fontWeight={600} fill="#222">
                {item.label}
              </text>
            </g>
          );
        })}

        {/* Plot shots */}
        {positioned.map(s => {
          const color = LIE_COLORS[s.lie] || LIE_COLORS[''];
          return (
            <g key={`${s.holeNumber}-${s.shotNumber}`}>
              <circle cx={s.x} cy={s.y} r={3.5} fill={color} stroke="#222" strokeWidth={0.5} />
              <text
                x={s.x + 6}
                y={s.y - 4}
                fontSize={12}
                fontWeight={700}
                fill={color}
                style={{
                  paintOrder: 'stroke',
                  stroke: '#fff',
                  strokeWidth: 3,
                  strokeLinejoin: 'round',
                }}
              >
                {s.label}
              </text>
            </g>
          );
        })}
      </svg>
    );
  }
);

// Export geometry constants so the page can size containers consistently.
export const DISPERSION_VIEW = { width: VIEW_W, height: VIEW_H };
