'use client';

/**
 * ShotDispersionChart
 *
 * Visualises where approach shots landed relative to the pin — mirroring the
 * classic "Golf Stats for Dummies" whiteboard diagram:
 *
 *   ╭──────────────╮   ← green (oval)
 *   │  shot dots   │
 *   ╰──────────────╯
 *   ┌──────────────┐   ← fairway (rectangle)
 *   │ — 25y ————  │
 *   │ — 50y ————  │   shot dots at their distance from pin
 *   │ — 100y ———  │
 *   │ — 150y ———  │
 *   │ — 200y ———  │
 *   └──────────────┘
 *
 * Each dot is labelled with the hole number. Colour encodes AI compliance.
 */

import { useState } from 'react';

export interface ShotDot {
  holeNumber: number;
  /** yards from pin after the shot */
  distanceToPin: number;
  landedOnGreen: boolean;
  /** 0-1 normalised left-right position (0 = far left, 0.5 = centre, 1 = far right) */
  lateralPosition: number;
  compliance: 'followed' | 'overrode' | 'unknown';
  club?: string;
  source?: string;
  /** hover label */
  label?: string;
}

interface Props {
  shots: ShotDot[];
  /** max yardage shown in fairway section (default 225) */
  maxYards?: number;
}

// ── Layout constants (all in SVG user units = px at 1× scale) ─────────────────

const W = 340;           // total SVG width
const PAD = 20;          // outer padding

// Green oval
const G_CX = W / 2;
const G_CY = 100;
const G_RX = 110;
const G_RY = 80;

const GAP = 20;          // gap between green and fairway

// Fairway rectangle
const FW_X = (W - 220) / 2;
const FW_W = 220;
const FW_TOP = G_CY + G_RY + GAP;
const FW_H = 240;
const FW_BOT = FW_TOP + FW_H;

const YARDAGE_LINES = [25, 50, 100, 150, 200];

const SVG_H = FW_BOT + PAD + 10;

// ── Colour helpers ────────────────────────────────────────────────────────────

function dotColour(c: ShotDot['compliance']) {
  if (c === 'followed') return '#b87333';  // copper / primary
  if (c === 'overrode') return '#ef4444';  // red
  return '#6b7280';                         // grey
}

function dotTextColour(c: ShotDot['compliance']) {
  return '#fff';
}

// ── Position helpers ──────────────────────────────────────────────────────────

/** Map a distance (yards) to a y-coordinate inside the fairway rectangle.
 *  0y = top of fairway (nearest the green), maxYards = bottom */
function yardToY(yards: number, maxYards: number): number {
  const clamped = Math.min(yards, maxYards);
  return FW_TOP + (clamped / maxYards) * FW_H;
}

/** Map a normalised lateral position [0,1] to an x-coordinate inside the fairway */
function lateralToX(pos: number): number {
  const innerPad = 22;
  return FW_X + innerPad + pos * (FW_W - innerPad * 2);
}

/** Place a dot on the green. We scatter dots inside the oval using the
 *  lateral position and a distance-derived radial offset. */
function greenPosition(dot: ShotDot): { cx: number; cy: number } {
  // Use lateral [0,1] → angle spread across the oval
  const angle = (dot.lateralPosition - 0.5) * Math.PI * 1.1;
  // Radial depth: 0 = near edge of green, 1 = centre
  const depth = Math.min(1, dot.distanceToPin > 0 ? 0.2 : 0.7 + Math.random() * 0.2);
  const r = G_RY * 0.85 * (1 - depth);
  return {
    cx: G_CX + Math.sin(angle) * G_RX * 0.85 * (1 - depth * 0.3),
    cy: G_CY + Math.cos(angle) * r * 0.6 - r * 0.2,
  };
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ShotDispersionChart({ shots, maxYards = 225 }: Props) {
  const [hovered, setHovered] = useState<ShotDot | null>(null);

  const onGreen = shots.filter((s) => s.landedOnGreen);
  const offGreen = shots.filter((s) => !s.landedOnGreen);

  return (
    <div className="relative w-full" style={{ maxWidth: W }}>
      <svg
        viewBox={`0 0 ${W} ${SVG_H}`}
        width="100%"
        style={{ display: 'block' }}
        aria-label="Shot dispersion chart"
      >
        {/* ── Background ──────────────────────────────────────────────── */}
        <rect width={W} height={SVG_H} fill="transparent" />

        {/* ── Green oval ──────────────────────────────────────────────── */}
        <ellipse
          cx={G_CX} cy={G_CY}
          rx={G_RX} ry={G_RY}
          fill="#166534"
          fillOpacity={0.15}
          stroke="#166534"
          strokeWidth={2.5}
        />
        {/* "GREEN" label */}
        <text
          x={G_CX} y={G_CY - G_RY - 8}
          textAnchor="middle"
          fontSize={11}
          fill="#166534"
          fontWeight="600"
          letterSpacing="0.08em"
        >
          GREEN
        </text>
        {/* Pin flag */}
        <line x1={G_CX} y1={G_CY - 18} x2={G_CX} y2={G_CY + 18} stroke="#166534" strokeWidth={1.5} strokeDasharray="3 2" />
        <circle cx={G_CX} cy={G_CY} r={3} fill="#166534" />

        {/* ── Fairway rectangle ───────────────────────────────────────── */}
        {/* Bottom of fairway = tee end */}
        <rect
          x={FW_X} y={FW_TOP}
          width={FW_W} height={FW_H}
          rx={6}
          fill="#14532d"
          fillOpacity={0.08}
          stroke="#14532d"
          strokeWidth={2}
        />

        {/* Rough strips on either side */}
        <rect x={PAD} y={FW_TOP} width={FW_X - PAD} height={FW_H} rx={4} fill="#84cc16" fillOpacity={0.08} />
        <rect x={FW_X + FW_W} y={FW_TOP} width={PAD} height={FW_H} rx={4} fill="#84cc16" fillOpacity={0.08} />

        {/* Distance lines */}
        {YARDAGE_LINES.map((y) => {
          const lineY = yardToY(y, maxYards);
          return (
            <g key={y}>
              <line
                x1={FW_X + 8} y1={lineY}
                x2={FW_X + FW_W - 8} y2={lineY}
                stroke="#374151"
                strokeWidth={1}
                strokeOpacity={0.35}
                strokeDasharray="4 3"
              />
              <text
                x={FW_X + FW_W / 2} y={lineY - 4}
                textAnchor="middle"
                fontSize={10}
                fill="#6b7280"
                fontWeight="500"
              >
                {y}y
              </text>
            </g>
          );
        })}

        {/* ── Shots OFF the green ─────────────────────────────────────── */}
        {offGreen.map((dot, i) => {
          const cx = lateralToX(dot.lateralPosition);
          const cy = yardToY(dot.distanceToPin, maxYards);
          const fill = dotColour(dot.compliance);
          const isHovered = hovered === dot;
          return (
            <g
              key={i}
              style={{ cursor: 'pointer' }}
              onMouseEnter={() => setHovered(dot)}
              onMouseLeave={() => setHovered(null)}
            >
              <circle
                cx={cx} cy={cy} r={isHovered ? 15 : 13}
                fill={fill}
                fillOpacity={isHovered ? 1 : 0.85}
                stroke="#fff"
                strokeWidth={1.5}
                style={{ transition: 'r 0.1s' }}
              />
              <text
                x={cx} y={cy + 5}
                textAnchor="middle"
                fontSize={12}
                fontWeight="700"
                fill={dotTextColour(dot.compliance)}
                style={{ pointerEvents: 'none', userSelect: 'none' }}
              >
                {dot.holeNumber}
              </text>
            </g>
          );
        })}

        {/* ── Shots ON the green ──────────────────────────────────────── */}
        {onGreen.map((dot, i) => {
          const { cx, cy } = greenPosition(dot);
          const fill = dotColour(dot.compliance);
          const isHovered = hovered === dot;
          return (
            <g
              key={i}
              style={{ cursor: 'pointer' }}
              onMouseEnter={() => setHovered(dot)}
              onMouseLeave={() => setHovered(null)}
            >
              <circle
                cx={cx} cy={cy} r={isHovered ? 15 : 13}
                fill={fill}
                fillOpacity={isHovered ? 1 : 0.85}
                stroke="#fff"
                strokeWidth={1.5}
                style={{ transition: 'r 0.1s' }}
              />
              <text
                x={cx} y={cy + 5}
                textAnchor="middle"
                fontSize={12}
                fontWeight="700"
                fill={dotTextColour(dot.compliance)}
                style={{ pointerEvents: 'none', userSelect: 'none' }}
              >
                {dot.holeNumber}
              </text>
            </g>
          );
        })}

        {/* ── Connector: gap between green and fairway ─────────────────── */}
        <line
          x1={W / 2 - 12} y1={G_CY + G_RY + 2}
          x2={W / 2 - 12} y2={FW_TOP - 2}
          stroke="#166534" strokeWidth={2} strokeOpacity={0.4}
        />
        <line
          x1={W / 2 + 12} y1={G_CY + G_RY + 2}
          x2={W / 2 + 12} y2={FW_TOP - 2}
          stroke="#166534" strokeWidth={2} strokeOpacity={0.4}
        />

        {/* ── "FAIRWAY" label ──────────────────────────────────────────── */}
        <text
          x={G_CX} y={FW_BOT + 18}
          textAnchor="middle"
          fontSize={11}
          fill="#6b7280"
          fontWeight="600"
          letterSpacing="0.08em"
        >
          ← FAIRWAY →
        </text>
      </svg>

      {/* ── Tooltip ─────────────────────────────────────────────────────── */}
      {hovered && (
        <div className="absolute left-1/2 -translate-x-1/2 top-2 bg-surface border border-border rounded-lg px-3 py-2 shadow-lg text-sm pointer-events-none z-10 whitespace-nowrap">
          <p className="font-semibold text-foreground">Hole {hovered.holeNumber}</p>
          {hovered.club && <p className="text-foreground-secondary">{hovered.club}</p>}
          <p className="text-foreground-secondary">
            {hovered.landedOnGreen
              ? `On green — ${hovered.distanceToPin > 0 ? `${Math.round(hovered.distanceToPin)}ft from pin` : 'close'}`
              : `${Math.round(hovered.distanceToPin)}y from pin`}
          </p>
          <p className={`font-medium ${
            hovered.compliance === 'followed' ? 'text-primary' :
            hovered.compliance === 'overrode' ? 'text-error' : 'text-foreground-muted'
          }`}>
            {hovered.compliance === 'followed' ? 'Followed AI' :
             hovered.compliance === 'overrode' ? 'Overrode AI' : 'No recommendation'}
          </p>
        </div>
      )}

      {/* ── Legend ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-center gap-5 mt-3 text-xs text-foreground-secondary">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: '#b87333' }} />
          Followed AI
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: '#ef4444' }} />
          Overrode AI
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: '#6b7280' }} />
          No data
        </span>
      </div>
    </div>
  );
}
