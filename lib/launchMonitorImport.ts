/**
 * Launch Monitor Import
 *
 * Parse a launch-monitor session export (Garmin Approach R10 / Garmin Golf,
 * Trackman, and similar shot-by-shot CSV/Excel files), aggregate the shots per
 * club with mishit/outlier rejection, and diff the result against the user's
 * current bag so each change can be approved individually.
 *
 * The sample format this was built against is a Garmin "DrivingRange" CSV:
 *   Row 1 = headers, Row 2 = units row (e.g. "[mph]", "[Yards]", "[ft]"),
 *   Row 3+ = one row per shot. The selected club lives in the "Club Type"
 *   column ("Club Name" / "Brand/Model" are often blank).
 */

import * as XLSX from 'xlsx';
import type { Club, ClubFace } from '@/src/types/clubs';
import { CLUB_LIST } from '@/src/types/clubs';

// ============================================================================
// TYPES
// ============================================================================

export type MeasuredSource = NonNullable<Club['measuredSource']>;

/** One parsed shot row, normalized to yards/feet/degrees. */
export interface RawShot {
  rowNum: number;        // 1-indexed source row (for error messages)
  clubLabel: string;     // raw label from the file, e.g. "9 Iron"
  carryYards: number;
  totalYards: number;
  apexFeet: number | null;
  launchDirectionDeg: number | null;   // initial start line (+ = right)
  carryDeviationAngleDeg: number | null; // angle to landing point (+ = right)
  lateralCarryYards: number | null;     // left/right offset at landing (+ = right)
  smashFactor: number | null;           // used for mishit detection
}

/** Per-club aggregated stats after outlier rejection. */
export interface AggregatedClub {
  sourceLabel: string;          // raw label from the file
  clubId: string | null;        // matched canonical id, or null if unmatched
  clubName: string | null;      // matched canonical display name
  shotsTotal: number;           // rows for this club before filtering
  shotsUsed: number;            // rows that survived outlier filtering
  carryYards: number;
  rollYards: number;
  totalYards: number;
  carryStdDevYards: number;
  lateralDispersionYards: number;
  curveYards: number;           // signed (+ right/fade, − left/draw)
  apexFeet: number | null;
  face: ClubFace;
}

export interface ParseResult {
  shots: RawShot[];
  errors: string[];
  source: MeasuredSource;
  distanceUnit: 'yards' | 'meters';
  rowsParsed: number;
}

export type ChangeField =
  | 'carryYards'
  | 'rollYards'
  | 'face'
  | 'carryStdDevYards'
  | 'lateralDispersionYards'
  | 'curveYards'
  | 'apexFeet';

export interface FieldChange {
  field: ChangeField;
  label: string;
  unit: string;
  oldValue: number | string | undefined; // undefined = field not previously set
  newValue: number | string;
  isNew: boolean;                          // true when there was no prior value
}

export interface ClubChangeSet {
  sourceLabel: string;
  clubId: string | null;        // canonical id (matched or chosen); null until mapped
  clubName: string | null;
  matched: boolean;             // a club with this id already exists in the bag
  existsInBag: boolean;         // alias clarity: matched club is in the current bag
  shotsUsed: number;
  shotsTotal: number;
  changes: FieldChange[];       // only fields that actually differ
}

// ============================================================================
// CONSTANTS
// ============================================================================

const YARDS_PER_METER = 1.09361;
const FEET_PER_METER = 3.28084;

// Mishit detection bounds. Garmin/Trackman smash factor for real full swings
// sits ~0.95–1.55; anything outside this is almost certainly a mishit or a bad
// read. We only apply it when a smash factor is present.
const MIN_SMASH = 0.85;
const MAX_SMASH = 1.7;

// Shape thresholds: average signed curve (yards) needed to call a club a
// Draw/Fade rather than Square.
const SHAPE_THRESHOLD_YARDS = 4;

// Header aliases → canonical key we use internally. Keys are "canonicalized"
// (lowercased, non-alphanumerics stripped) so that "Carry Distance", "Carry
// (yards)", and Trackman's "CarryDistance" all resolve identically.
const HEADER_ALIASES: Record<string, string> = {
  clubtype: 'club',
  clubname: 'clubName',
  club: 'club',
  carrydistance: 'carry',
  carryyards: 'carry',
  carry: 'carry',
  totaldistance: 'total',
  totalyards: 'total',
  total: 'total',
  apexheight: 'apex',
  apex: 'apex',
  height: 'apex',
  launchdirection: 'launchDir',
  carrydeviationangle: 'carryDevAngle',
  carrydeviationdistance: 'lateralCarry',
  side: 'lateralCarry',
  sidecarry: 'lateralCarry',
  smashfactor: 'smash',
  smash: 'smash',
};

/** Canonicalize a header for alias lookup: lowercase, strip non-alphanumerics. */
function canonHeader(h: string): string {
  return h.toLowerCase().replace(/[^a-z0-9]/g, '');
}

// ============================================================================
// CLUB LABEL NORMALIZATION
// ============================================================================

/**
 * Map a launch-monitor club label (e.g. "9 Iron", "3 Hybrid", "Pitching Wedge")
 * to a canonical CaddyAI club. Returns null when no confident match exists.
 */
export function normalizeClubLabel(
  rawLabel: string
): { clubId: string; clubName: string } | null {
  if (!rawLabel) return null;
  const label = rawLabel.trim();
  if (!label) return null;

  // 1. Exact match against canonical names ("9i", "3H", "56° (SW)", ...)
  const exact = CLUB_LIST.find(
    (c) => c.name.toLowerCase() === label.toLowerCase()
  );
  if (exact) return { clubId: exact.id, clubName: exact.name };

  const l = label
    .toLowerCase()
    .replace(/[°"']/g, '')
    .replace(/[-_/]/g, ' ') // "7-iron" → "7 iron", "3_hybrid" → "3 hybrid"
    .replace(/\s+/g, ' ')
    .trim();

  // 2. Driver / mini driver
  if (/\bmini[\s-]?driver\b/.test(l)) return byId('club_mini_driver');
  if (/\bdriver\b/.test(l) || l === '1w' || l === 'd') return byId('club_driver');

  // 3. Woods: "3 wood", "3w", "3-wood"
  const wood = l.match(/\b(\d{1,2})\s*(?:w|wood)\b/);
  if (wood) return byId(`club_${wood[1]}w`);

  // 4. Hybrids: "3 hybrid", "3h", "3 rescue", "3 utility"
  const hybrid = l.match(/\b(\d{1,2})\s*(?:h|hy|hybrid|rescue|utility)\b/);
  if (hybrid) return byId(`club_${hybrid[1]}h`);

  // 5. Wedges by name
  if (/\bpitching wedge\b/.test(l) || l === 'pw') return byId('club_pw');
  if (/\bgap wedge\b/.test(l) || /\bapproach wedge\b/.test(l) || l === 'gw' || l === 'aw')
    return byId('club_52');
  if (/\bsand wedge\b/.test(l) || l === 'sw') return byId('club_56');
  if (/\blob wedge\b/.test(l) || l === 'lw') return byId('club_60');

  // 6. Wedges by loft: "52 degree", "56", "60 deg"
  const loft = l.match(/\b(46|48|50|52|54|56|58|60)\s*(?:deg|degree|degrees)?\b/);
  if (loft) {
    const map: Record<string, string> = {
      '46': 'club_pw', '48': 'club_pw',
      '50': 'club_52', '52': 'club_52', '54': 'club_56',
      '56': 'club_56', '58': 'club_58', '60': 'club_60',
    };
    if (map[loft[1]]) return byId(map[loft[1]]);
  }

  // 7. Irons: "9 iron", "9i", "9-iron"
  const iron = l.match(/\b(\d)\s*(?:i|iron)\b/);
  if (iron) return byId(`club_${iron[1]}i`);

  return null;
}

function byId(clubId: string): { clubId: string; clubName: string } | null {
  const def = CLUB_LIST.find((c) => c.id === clubId);
  return def ? { clubId: def.id, clubName: def.name } : null;
}

// ============================================================================
// PARSING
// ============================================================================

/**
 * Parse a launch-monitor CSV/Excel file into normalized shots.
 * Handles the optional units row and yards/meters conversion.
 */
export function parseLaunchMonitorFile(file: File): Promise<ParseResult> {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows: unknown[][] = XLSX.utils.sheet_to_json(sheet, {
          header: 1,
          blankrows: false,
          raw: true,
        });

        resolve(parseRows(rows));
      } catch {
        resolve(emptyResult(['Could not read the file. Please upload a valid CSV or Excel export.']));
      }
    };

    reader.onerror = () =>
      resolve(emptyResult(['Failed to read the file. Please try again.']));

    reader.readAsArrayBuffer(file);
  });
}

/** Pure row parser, exported for testing without a File. */
export function parseRows(rows: unknown[][]): ParseResult {
  const errors: string[] = [];
  if (!rows.length) return emptyResult(['The file is empty.']);

  // --- Header row ---
  const headerRow = (rows[0] as unknown[]).map((c) => String(c ?? '').trim());
  const colIndex: Partial<Record<string, number>> = {};
  headerRow.forEach((h, i) => {
    const key = HEADER_ALIASES[canonHeader(h)];
    if (key && colIndex[key] === undefined) colIndex[key] = i;
  });

  // Prefer "Club Type" (where Garmin stores the selected club); fall back to
  // "Club Name" if that's the only club column present.
  const clubCol = colIndex['club'] ?? colIndex['clubName'];
  if (clubCol === undefined) {
    errors.push('Could not find a club column (expected "Club Type" or "Club Name").');
  }
  if (colIndex['carry'] === undefined) {
    errors.push('Could not find a "Carry Distance" column.');
  }
  if (errors.length) return { ...emptyResult(errors), source: detectSource(headerRow) };

  // --- Optional units row + unit detection ---
  let dataStart = 1;
  let distanceUnit: 'yards' | 'meters' = 'yards';
  let apexInMeters = false;
  if (rows.length > 1) {
    const second = (rows[1] as unknown[]).map((c) => String(c ?? '').trim());
    const bracketed = second.filter((c) => /^\[.*\]$/.test(c)).length;
    const looksLikeUnits = bracketed >= 2;
    if (looksLikeUnits) {
      dataStart = 2;
      const carryUnit = (second[colIndex['carry']!] || '').toLowerCase();
      if (/m\b|meter|metre/.test(carryUnit) && !/yard|yd/.test(carryUnit)) {
        distanceUnit = 'meters';
      }
      const apexUnit = colIndex['apex'] !== undefined ? (second[colIndex['apex']!] || '').toLowerCase() : '';
      if (/\[m\]|meter|metre/.test(apexUnit)) apexInMeters = true;
    }
  }

  const dyd = distanceUnit === 'meters' ? YARDS_PER_METER : 1;
  const apexFactor = apexInMeters ? FEET_PER_METER : 1;

  // --- Data rows ---
  const shots: RawShot[] = [];
  for (let r = dataStart; r < rows.length; r++) {
    const row = rows[r] as unknown[];
    const rowNum = r + 1;

    const clubLabel = String(row[clubCol!] ?? '').trim();
    const carry = num(row[colIndex['carry']!]);
    if (!clubLabel || carry === null) continue; // skip empty/incomplete rows silently

    const total = num(row[colIndex['total'] ?? -1]);
    const apex = colIndex['apex'] !== undefined ? num(row[colIndex['apex']!]) : null;
    const lateral = colIndex['lateralCarry'] !== undefined ? num(row[colIndex['lateralCarry']!]) : null;

    shots.push({
      rowNum,
      clubLabel,
      carryYards: carry * dyd,
      totalYards: total !== null ? total * dyd : carry * dyd,
      apexFeet: apex !== null ? apex * apexFactor : null,
      launchDirectionDeg: colIndex['launchDir'] !== undefined ? num(row[colIndex['launchDir']!]) : null,
      carryDeviationAngleDeg:
        colIndex['carryDevAngle'] !== undefined ? num(row[colIndex['carryDevAngle']!]) : null,
      lateralCarryYards: lateral !== null ? lateral * dyd : null,
      smashFactor: colIndex['smash'] !== undefined ? num(row[colIndex['smash']!]) : null,
    });
  }

  if (!shots.length) errors.push('No shot rows could be read from the file.');

  return {
    shots,
    errors,
    source: detectSource(headerRow),
    distanceUnit,
    rowsParsed: shots.length,
  };
}

// ============================================================================
// AGGREGATION (with outlier rejection)
// ============================================================================

/**
 * Group shots by club label and compute averaged stats, rejecting mishits.
 * Mishits are dropped via implausible smash factor and a carry-distance IQR
 * fence; the count of dropped shots is preserved so the UI can show
 * "used N of M shots".
 */
export function aggregateShots(shots: RawShot[]): AggregatedClub[] {
  const groups = new Map<string, RawShot[]>();
  for (const s of shots) {
    const arr = groups.get(s.clubLabel) ?? [];
    arr.push(s);
    groups.set(s.clubLabel, arr);
  }

  const result: AggregatedClub[] = [];

  for (const [label, groupShots] of groups) {
    const total = groupShots.length;
    const used = filterMishits(groupShots);
    if (!used.length) continue; // every shot was a mishit/unreadable; skip the club

    const carries = used.map((s) => s.carryYards);
    const totals = used.map((s) => s.totalYards);
    const carryMean = mean(carries);
    const totalMean = mean(totals);
    const roll = Math.max(0, totalMean - carryMean);

    // Lateral dispersion: std dev of landing offset (fallback to carry-deviation
    // angle × carry when an explicit side-carry column is absent).
    const laterals = used
      .map((s) =>
        s.lateralCarryYards !== null
          ? s.lateralCarryYards
          : s.carryDeviationAngleDeg !== null
          ? s.carryYards * Math.tan(deg2rad(s.carryDeviationAngleDeg))
          : null
      )
      .filter((v): v is number => v !== null);

    // Curve = landing angle − start-line angle, in yards. Positive = right/fade.
    const curves = used
      .map((s) => {
        if (s.carryDeviationAngleDeg === null) return null;
        const start = s.launchDirectionDeg ?? 0;
        const curveAngle = s.carryDeviationAngleDeg - start;
        return s.carryYards * Math.tan(deg2rad(curveAngle));
      })
      .filter((v): v is number => v !== null);

    const apexes = used.map((s) => s.apexFeet).filter((v): v is number => v !== null && v > 0);

    const curveYards = curves.length ? mean(curves) : 0;

    result.push({
      sourceLabel: label,
      ...matchOf(label),
      shotsTotal: total,
      shotsUsed: used.length,
      carryYards: Math.round(carryMean),
      rollYards: Math.round(roll),
      totalYards: Math.round(carryMean) + Math.round(roll),
      carryStdDevYards: round1(stdDev(carries)),
      lateralDispersionYards: laterals.length ? round1(stdDev(laterals)) : 0,
      curveYards: round1(curveYards),
      apexFeet: apexes.length ? Math.round(mean(apexes)) : null,
      face: faceFromCurve(curveYards),
    });
  }

  // Sort longest-carry first, matching how the bag is displayed.
  return result.sort((a, b) => b.carryYards - a.carryYards);
}

function matchOf(label: string): { clubId: string | null; clubName: string | null } {
  const m = normalizeClubLabel(label);
  return m ? { clubId: m.clubId, clubName: m.clubName } : { clubId: null, clubName: null };
}

/** Drop mishits: bad smash factor, then carry-distance IQR outliers. */
function filterMishits(shots: RawShot[]): RawShot[] {
  // Stage 1: implausible smash factor (only when present).
  let kept = shots.filter(
    (s) => s.smashFactor === null || (s.smashFactor >= MIN_SMASH && s.smashFactor <= MAX_SMASH)
  );
  if (kept.length < 4) kept = shots.slice(); // too few to fence; keep all, IQR below still helps

  // Stage 2: carry IQR fence (needs a handful of points to be meaningful).
  if (kept.length >= 4) {
    const carries = kept.map((s) => s.carryYards).sort((a, b) => a - b);
    const q1 = quantile(carries, 0.25);
    const q3 = quantile(carries, 0.75);
    const iqr = q3 - q1;
    const lo = q1 - 1.5 * iqr;
    const hi = q3 + 1.5 * iqr;
    kept = kept.filter((s) => s.carryYards >= lo && s.carryYards <= hi);
  }

  return kept;
}

// ============================================================================
// DIFF
// ============================================================================

/**
 * Build per-club change sets by diffing aggregated stats against the bag.
 * Only fields that actually differ are emitted. Total is intentionally not a
 * change (it's always derived from carry + roll on apply).
 */
export function buildChangeSets(
  aggregated: AggregatedClub[],
  currentClubs: Club[]
): ClubChangeSet[] {
  return aggregated.map((agg) => {
    const existing = agg.clubId
      ? currentClubs.find((c) => c.id === agg.clubId)
      : undefined;

    const changes: FieldChange[] = [];
    const push = (
      field: ChangeField,
      label: string,
      unit: string,
      oldValue: number | string | undefined,
      newValue: number | string
    ) => {
      const isNew = oldValue === undefined || oldValue === null;
      const differs =
        isNew ||
        (typeof oldValue === 'number' && typeof newValue === 'number'
          ? Math.abs(oldValue - newValue) >= (unit === 'ft' ? 1 : 1)
          : oldValue !== newValue);
      if (differs) changes.push({ field, label, unit, oldValue, newValue, isNew });
    };

    push('carryYards', 'Carry', 'yds', existing?.carryYards, agg.carryYards);
    push('rollYards', 'Roll', 'yds', existing?.rollYards, agg.rollYards);
    push('face', 'Shot shape', '', existing?.face, agg.face);
    push('carryStdDevYards', 'Carry dispersion', '± yds', existing?.carryStdDevYards, agg.carryStdDevYards);
    push('lateralDispersionYards', 'Lateral dispersion', '± yds', existing?.lateralDispersionYards, agg.lateralDispersionYards);
    push('curveYards', 'Curve', 'yds', existing?.curveYards, agg.curveYards);
    if (agg.apexFeet !== null) {
      push('apexFeet', 'Apex height', 'ft', existing?.apexFeet, agg.apexFeet);
    }

    return {
      sourceLabel: agg.sourceLabel,
      clubId: agg.clubId,
      clubName: agg.clubName,
      matched: !!existing,
      existsInBag: !!existing,
      shotsUsed: agg.shotsUsed,
      shotsTotal: agg.shotsTotal,
      changes,
    };
  });
}

// ============================================================================
// HELPERS
// ============================================================================

function faceFromCurve(curveYards: number): ClubFace {
  if (curveYards > SHAPE_THRESHOLD_YARDS) return 'Fade';
  if (curveYards < -SHAPE_THRESHOLD_YARDS) return 'Draw';
  return 'Square';
}

function detectSource(headerRow: string[]): MeasuredSource {
  // Garmin's R10 / Garmin Golf export is identified by "Club Type" + tempo
  // columns; treat everything else as a Trackman-style export.
  const canon = headerRow.map(canonHeader);
  if (canon.includes('clubtype') || canon.includes('swingtempo')) return 'garmin';
  return 'trackman';
}

function emptyResult(errors: string[]): ParseResult {
  return { shots: [], errors, source: 'garmin', distanceUnit: 'yards', rowsParsed: 0 };
}

function num(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null;
  const n = typeof v === 'number' ? v : Number(String(v).replace(/[^0-9.+-]/g, ''));
  return Number.isFinite(n) ? n : null;
}

function mean(xs: number[]): number {
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

function stdDev(xs: number[]): number {
  if (xs.length < 2) return 0;
  const m = mean(xs);
  const variance = xs.reduce((a, b) => a + (b - m) ** 2, 0) / (xs.length - 1);
  return Math.sqrt(variance);
}

function quantile(sorted: number[], q: number): number {
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  return sorted[base + 1] !== undefined
    ? sorted[base] + rest * (sorted[base + 1] - sorted[base])
    : sorted[base];
}

function deg2rad(d: number): number {
  return (d * Math.PI) / 180;
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
