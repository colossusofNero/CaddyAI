/**
 * Caddy Sessions — sparse-data reconstruction of on-course optimizer usage.
 *
 * Users often engage the optimizer mid-round but never finalize the round,
 * so nothing lands in /roundSummaries. This module rebuilds what we CAN show
 * from the exhaust they already produced:
 *
 *   shotEvents/  — optimizer_run rows (GPS + club recs + carry yards)
 *   uiEvents/    — optimizer_clicked rows (hole + timestamp only)
 *   courses/     — hole geometry (par, distance, tee + green coords)
 *   scores/      — used to detect whether a finished round already covers a day
 *
 * Known mobile-client quirk this module works around: a single physical round
 * can emit uiEvents and shotEvents under DIFFERENT roundIds (generated ms
 * apart), so we group by calendar day rather than roundId, and resolve the
 * course from any roundId suffix that matches a /courses doc id.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { distanceYards, type LatLng } from '@/lib/geo';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CaddyMoment {
  timestamp: number;          // epoch ms
  holeNumber: number;
  // Hole context (from course geometry when available)
  par?: number;
  holeYards?: number;
  // Position (from GPS when the full optimizer_run persisted)
  distanceToGreen?: number;   // yds, GPS position → green center
  fromTee?: boolean;
  gpsPosition?: LatLng;
  // The recommendation itself (only on persisted optimizer_run events)
  primaryClub?: string;
  primaryCarryYards?: number;
  secondaryClub?: string;
  secondaryCarryYards?: number;
  targetType?: string;        // 'pin' | 'centerline'
  // How rich this moment is: 'full' has GPS + rec; 'click' is timestamp + hole
  detail: 'full' | 'click';
}

export interface CaddySession {
  /** YYYY-MM-DD local date the session happened */
  date: string;
  courseId?: string;
  courseName?: string;
  moments: CaddyMoment[];
  holesEngaged: number[];
  totalAsks: number;
  fullMoments: number;        // asks where the complete recommendation persisted
  startTime: number;
  endTime: number;
  /** True when a finished /scores round already exists for this day */
  hasScorecard: boolean;
}

interface RawShotEvent {
  eventType: string;
  userId: string;
  roundId?: string | null;
  holeNumber?: number | null;
  timestamp: number;
  gpsPosition?: { latitude: number; longitude: number } | null;
  payload?: Record<string, unknown>;
}

interface RawUiEvent {
  eventType: string;
  userId: string;
  roundId?: string | null;
  holeNumber?: number | null;
  timestamp?: { toDate?: () => Date } | number;
  metadata?: { timestamp?: number };
}

interface CourseHoleGeom {
  par?: number;
  distance?: number;
  tee?: LatLng;
  green?: LatLng;
}

// If a uiEvent click and a shotEvent run land within this window on the same
// hole, they're the same physical ask — keep the richer one.
const DEDUPE_WINDOW_MS = 5_000;

// ─── Loading ──────────────────────────────────────────────────────────────────

export async function loadCaddySessions(userId: string): Promise<CaddySession[]> {
  if (!db) return [];

  const [shotSnap, uiSnap, scoresSnap] = await Promise.all([
    getDocs(query(collection(db, 'shotEvents'), where('userId', '==', userId))),
    getDocs(query(collection(db, 'uiEvents'), where('userId', '==', userId))),
    getDocs(query(collection(db, 'scores'), where('userId', '==', userId))),
  ]);

  const runs = shotSnap.docs
    .map(d => d.data() as RawShotEvent)
    .filter(e => e.eventType === 'optimizer_run' && typeof e.timestamp === 'number');

  const clicks = uiSnap.docs
    .map(d => d.data() as RawUiEvent)
    .filter(e => e.eventType === 'optimizer_clicked')
    .map(e => ({ ...e, ms: uiEventMs(e) }))
    .filter(e => e.ms !== null) as Array<RawUiEvent & { ms: number }>;

  const scoreDates = new Set(
    scoresSnap.docs
      .map(d => (d.data() as { date?: string }).date)
      .filter(Boolean) as string[]
  );

  // Group everything by local calendar day
  const byDay = new Map<string, { runs: RawShotEvent[]; clicks: Array<RawUiEvent & { ms: number }> }>();
  const dayOf = (ms: number) => {
    const d = new Date(ms);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };
  for (const r of runs) {
    const day = dayOf(r.timestamp);
    if (!byDay.has(day)) byDay.set(day, { runs: [], clicks: [] });
    byDay.get(day)!.runs.push(r);
  }
  for (const c of clicks) {
    const day = dayOf(c.ms);
    if (!byDay.has(day)) byDay.set(day, { runs: [], clicks: [] });
    byDay.get(day)!.clicks.push(c);
  }

  // Resolve course geometry once per unique candidate courseId
  const geomCache = new Map<string, { name?: string; holes: Record<number, CourseHoleGeom> } | null>();

  const sessions: CaddySession[] = [];
  for (const [date, group] of byDay.entries()) {
    const session = await buildSession(date, group.runs, group.clicks, geomCache);
    if (!session) continue;
    session.hasScorecard = scoreDates.has(date);
    sessions.push(session);
  }

  return sessions.sort((a, b) => b.startTime - a.startTime);
}

// ─── Session assembly ─────────────────────────────────────────────────────────

async function buildSession(
  date: string,
  runs: RawShotEvent[],
  clicks: Array<RawUiEvent & { ms: number }>,
  geomCache: Map<string, { name?: string; holes: Record<number, CourseHoleGeom> } | null>
): Promise<CaddySession | null> {
  if (runs.length === 0 && clicks.length === 0) return null;

  // Candidate course ids: any roundId suffix from either stream that looks
  // like a Firestore doc id (round_<ts>_<suffix>).
  const candidateIds = new Set<string>();
  for (const e of [...runs, ...clicks]) {
    const suffix = e.roundId?.split('_')[2];
    if (suffix && suffix.length >= 8) candidateIds.add(suffix);
  }

  // Resolve the first candidate that's a real course; verify with GPS when we
  // have any (a run's position should be within ~3 miles of the course's holes).
  let courseId: string | undefined;
  let courseName: string | undefined;
  let holeGeom: Record<number, CourseHoleGeom> = {};
  const sampleGps = runs.find(r => r.gpsPosition)?.gpsPosition ?? null;

  for (const cid of candidateIds) {
    const course = await loadCourseGeometry(cid, geomCache);
    if (!course) continue;
    if (sampleGps) {
      const anyGreen = Object.values(course.holes).find(h => h.green)?.green;
      if (anyGreen && distanceYards(sampleGps, anyGreen) > 6000) continue; // wrong course
    }
    courseId = cid;
    courseName = course.name;
    holeGeom = course.holes;
    break;
  }

  // Build moments: full ones from runs, click-only ones from uiEvents not
  // already represented by a run on the same hole within the dedupe window.
  const moments: CaddyMoment[] = runs.map(r => momentFromRun(r, holeGeom));
  for (const c of clicks) {
    const hole = c.holeNumber ?? (c.metadata as { holeNumber?: number } | undefined)?.holeNumber;
    if (hole == null) continue;
    const covered = runs.some(
      r => r.holeNumber === hole && Math.abs(r.timestamp - c.ms) < DEDUPE_WINDOW_MS
    );
    if (covered) continue;
    const g = holeGeom[hole];
    moments.push({
      timestamp: c.ms,
      holeNumber: hole,
      par: g?.par,
      holeYards: g?.distance,
      detail: 'click',
    });
  }

  moments.sort((a, b) => a.timestamp - b.timestamp);
  const holesEngaged = [...new Set(moments.map(m => m.holeNumber))].sort((a, b) => a - b);

  return {
    date,
    courseId,
    courseName,
    moments,
    holesEngaged,
    totalAsks: moments.length,
    fullMoments: moments.filter(m => m.detail === 'full').length,
    startTime: moments[0].timestamp,
    endTime: moments[moments.length - 1].timestamp,
    hasScorecard: false, // overwritten by caller
  };
}

function momentFromRun(r: RawShotEvent, holeGeom: Record<number, CourseHoleGeom>): CaddyMoment {
  const hole = r.holeNumber ?? 0;
  const g = holeGeom[hole];
  const p = (r.payload ?? {}) as Record<string, unknown>;
  const gps = r.gpsPosition ?? undefined;

  let distanceToGreen: number | undefined;
  let fromTee: boolean | undefined;
  if (gps && g?.green) distanceToGreen = Math.round(distanceYards(gps, g.green));
  if (typeof p.primaryFromTee === 'boolean') {
    fromTee = p.primaryFromTee;
  } else if (gps && g?.tee) {
    fromTee = distanceYards(gps, g.tee) < 40;
  }

  return {
    timestamp: r.timestamp,
    holeNumber: hole,
    par: g?.par,
    holeYards: g?.distance,
    distanceToGreen,
    fromTee,
    gpsPosition: gps,
    primaryClub: asString(p.primaryClub) ?? asString(p.recommendedClub),
    primaryCarryYards: asNumber(p.primaryCarryYards) ?? asNumber(p.predictedCarryYards),
    secondaryClub: asString(p.secondaryClub),
    secondaryCarryYards: asNumber(p.secondaryCarryYards),
    targetType: asString(p.targetType),
    detail: 'full',
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function loadCourseGeometry(
  courseId: string,
  cache: Map<string, { name?: string; holes: Record<number, CourseHoleGeom> } | null>
): Promise<{ name?: string; holes: Record<number, CourseHoleGeom> } | null> {
  if (cache.has(courseId)) return cache.get(courseId)!;
  let result: { name?: string; holes: Record<number, CourseHoleGeom> } | null = null;
  try {
    if (db) {
      const snap = await getDoc(doc(db, 'courses', courseId));
      if (snap.exists()) {
        const v = snap.data() as {
          courseName?: string;
          name?: string;
          holes?: Array<{
            number?: number;
            par?: number;
            distance?: number;
            gpsData?: {
              teeBox?: { latitude: number; longitude: number };
              greenCenter?: { latitude: number; longitude: number };
            };
          }>;
        };
        const holes: Record<number, CourseHoleGeom> = {};
        for (const h of v.holes ?? []) {
          if (!h.number) continue;
          holes[h.number] = {
            par: h.par,
            distance: h.distance,
            tee: h.gpsData?.teeBox,
            green: h.gpsData?.greenCenter,
          };
        }
        result = { name: v.courseName ?? v.name, holes };
      }
    }
  } catch (err) {
    console.warn('[caddySessions] course lookup failed:', courseId, err);
  }
  cache.set(courseId, result);
  return result;
}

function uiEventMs(e: RawUiEvent): number | null {
  if (typeof e.metadata?.timestamp === 'number') return e.metadata.timestamp;
  if (typeof e.timestamp === 'number') return e.timestamp;
  const d = (e.timestamp as { toDate?: () => Date } | undefined)?.toDate?.();
  return d ? d.getTime() : null;
}

function asString(v: unknown): string | undefined {
  return typeof v === 'string' && v.length > 0 ? v : undefined;
}
function asNumber(v: unknown): number | undefined {
  return typeof v === 'number' && Number.isFinite(v) ? v : undefined;
}
