/**
 * Server-side caddy-session reconstruction (Cloud Functions / Admin SDK).
 *
 * Mirrors lib/api/caddySessions.ts in the Next.js app, trimmed to what the
 * auto-close scheduler needs: group a user's optimizer activity into per-day
 * sessions, resolve the course, compute last-activity time + a highlight line
 * for the recap email.
 *
 * Functions deploy as their own Node project, so this is a deliberate copy
 * rather than a shared import (same pattern as loopsService.ts).
 */

import * as admin from 'firebase-admin';

if (admin.apps.length === 0) admin.initializeApp();

const YARDS_PER_METER = 1.09361;
const EARTH_RADIUS_METERS = 6371000;

export interface SessionMoment {
  timestamp: number;
  holeNumber: number;
  par?: number;
  holeYards?: number;
  distanceToGreen?: number;
  primaryClub?: string;
  primaryCarryYards?: number;
  targetType?: string;
  detail: 'full' | 'click';
}

export interface CaddySession {
  userId: string;
  date: string; // YYYY-MM-DD (UTC)
  courseId?: string;
  courseName?: string;
  moments: SessionMoment[];
  holesEngaged: number[];
  totalAsks: number;
  fullMoments: number;
  startTime: number;
  endTime: number; // last activity (epoch ms)
  hasScorecard: boolean;
}

interface LatLng {
  latitude: number;
  longitude: number;
}

function distanceYards(a: LatLng, b: LatLng): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(h)) * YARDS_PER_METER;
}

interface CourseHoleGeom {
  par?: number;
  distance?: number;
  tee?: LatLng;
  green?: LatLng;
}

const DEDUPE_WINDOW_MS = 5_000;

/**
 * Build all caddy sessions for one user. Caller decides which are stale.
 * Bounded by `sinceMs` — only events at/after this epoch are considered, so
 * the scheduler doesn't re-scan a user's entire history every run.
 */
export async function buildUserSessions(
  userId: string,
  sinceMs: number,
  geomCache: Map<string, { name?: string; holes: Record<number, CourseHoleGeom> } | null>
): Promise<CaddySession[]> {
  const fs = admin.firestore();

  // Query by userId only (single-field auto-index) and bound by `sinceMs` in
  // memory — per-user event volumes are small, so this avoids needing a second
  // composite index just for the range.
  const [shotSnap, uiSnap, scoresSnap] = await Promise.all([
    fs.collection('shotEvents').where('userId', '==', userId).get(),
    fs.collection('uiEvents').where('userId', '==', userId).get(),
    fs.collection('scores').where('userId', '==', userId).get(),
  ]);

  const runs = shotSnap.docs
    .map((d) => d.data())
    .filter((e) => e.eventType === 'optimizer_run' && typeof e.timestamp === 'number' && (e.timestamp as number) >= sinceMs);

  const clicks = uiSnap.docs
    .map((d) => d.data())
    .filter((e) => e.eventType === 'optimizer_clicked')
    .map((e) => ({ ...e, ms: uiEventMs(e) }))
    .filter((e) => typeof e.ms === 'number' && (e.ms as number) >= sinceMs) as Array<
    Record<string, unknown> & { ms: number }
  >;

  const scoreDates = new Set(
    scoresSnap.docs.map((d) => d.data().date).filter(Boolean) as string[]
  );

  const dayOf = (ms: number) => {
    const d = new Date(ms);
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(
      d.getUTCDate()
    ).padStart(2, '0')}`;
  };

  const byDay = new Map<string, { runs: Record<string, unknown>[]; clicks: Array<Record<string, unknown> & { ms: number }> }>();
  for (const r of runs) {
    const day = dayOf(r.timestamp as number);
    if (!byDay.has(day)) byDay.set(day, { runs: [], clicks: [] });
    byDay.get(day)!.runs.push(r);
  }
  for (const c of clicks) {
    const day = dayOf(c.ms);
    if (!byDay.has(day)) byDay.set(day, { runs: [], clicks: [] });
    byDay.get(day)!.clicks.push(c);
  }

  const sessions: CaddySession[] = [];
  for (const [date, group] of byDay.entries()) {
    const session = await buildSession(userId, date, group.runs, group.clicks, geomCache);
    if (!session) continue;
    session.hasScorecard = scoreDates.has(date);
    sessions.push(session);
  }
  return sessions;
}

async function buildSession(
  userId: string,
  date: string,
  runs: Record<string, unknown>[],
  clicks: Array<Record<string, unknown> & { ms: number }>,
  geomCache: Map<string, { name?: string; holes: Record<number, CourseHoleGeom> } | null>
): Promise<CaddySession | null> {
  if (runs.length === 0 && clicks.length === 0) return null;

  const candidateIds = new Set<string>();
  for (const e of [...runs, ...clicks]) {
    const suffix = (e.roundId as string | undefined)?.split('_')[2];
    if (suffix && suffix.length >= 8) candidateIds.add(suffix);
  }

  let courseId: string | undefined;
  let courseName: string | undefined;
  let holeGeom: Record<number, CourseHoleGeom> = {};
  const sampleGps = (runs.find((r) => r.gpsPosition)?.gpsPosition as LatLng | undefined) ?? null;

  for (const cid of candidateIds) {
    const course = await loadCourseGeometry(cid, geomCache);
    if (!course) continue;
    if (sampleGps) {
      const anyGreen = Object.values(course.holes).find((h) => h.green)?.green;
      if (anyGreen && distanceYards(sampleGps, anyGreen) > 6000) continue;
    }
    courseId = cid;
    courseName = course.name;
    holeGeom = course.holes;
    break;
  }

  const moments: SessionMoment[] = runs.map((r) => momentFromRun(r, holeGeom));
  for (const c of clicks) {
    const hole = (c.holeNumber as number | undefined) ?? (c.metadata as { holeNumber?: number } | undefined)?.holeNumber;
    if (hole == null) continue;
    const covered = runs.some(
      (r) => r.holeNumber === hole && Math.abs((r.timestamp as number) - c.ms) < DEDUPE_WINDOW_MS
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
  const holesEngaged = [...new Set(moments.map((m) => m.holeNumber))].sort((a, b) => a - b);

  return {
    userId,
    date,
    courseId,
    courseName,
    moments,
    holesEngaged,
    totalAsks: moments.length,
    fullMoments: moments.filter((m) => m.detail === 'full').length,
    startTime: moments[0].timestamp,
    endTime: moments[moments.length - 1].timestamp,
    hasScorecard: false,
  };
}

function momentFromRun(r: Record<string, unknown>, holeGeom: Record<number, CourseHoleGeom>): SessionMoment {
  const hole = (r.holeNumber as number | undefined) ?? 0;
  const g = holeGeom[hole];
  const p = (r.payload ?? {}) as Record<string, unknown>;
  const gps = (r.gpsPosition as LatLng | undefined) ?? undefined;

  let distanceToGreen: number | undefined;
  if (gps && g?.green) distanceToGreen = Math.round(distanceYards(gps, g.green));

  return {
    timestamp: r.timestamp as number,
    holeNumber: hole,
    par: g?.par,
    holeYards: g?.distance,
    distanceToGreen,
    primaryClub: asString(p.primaryClub) ?? asString(p.recommendedClub),
    primaryCarryYards: asNumber(p.primaryCarryYards) ?? asNumber(p.predictedCarryYards),
    targetType: asString(p.targetType),
    detail: 'full',
  };
}

async function loadCourseGeometry(
  courseId: string,
  cache: Map<string, { name?: string; holes: Record<number, CourseHoleGeom> } | null>
): Promise<{ name?: string; holes: Record<number, CourseHoleGeom> } | null> {
  if (cache.has(courseId)) return cache.get(courseId)!;
  let result: { name?: string; holes: Record<number, CourseHoleGeom> } | null = null;
  try {
    const snap = await admin.firestore().collection('courses').doc(courseId).get();
    if (snap.exists) {
      const v = snap.data() as {
        courseName?: string;
        name?: string;
        holes?: Array<{
          number?: number;
          par?: number;
          distance?: number;
          gpsData?: { teeBox?: LatLng; greenCenter?: LatLng };
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
  } catch (err) {
    console.warn('[autoClose] course lookup failed:', courseId, err);
  }
  cache.set(courseId, result);
  return result;
}

/**
 * A short, human highlight line for the recap email — leads with the most
 * concrete "we did the math for you" moment we have.
 */
export function sessionHighlight(session: CaddySession): string {
  const rich = session.moments.find(
    (m) => m.detail === 'full' && m.distanceToGreen && m.primaryClub
  );
  if (rich) {
    const holeLabel = rich.par ? `the par-${rich.par} ${ordinal(rich.holeNumber)}` : `hole ${rich.holeNumber}`;
    return `We measured ${rich.distanceToGreen}y to the green on ${holeLabel} and put ${aOrAn(rich.primaryClub!)} in your hands.`;
  }
  const anyClub = session.moments.find((m) => m.detail === 'full' && m.primaryClub);
  if (anyClub) {
    return `We lined you up with ${aOrAn(anyClub.primaryClub!)} on hole ${anyClub.holeNumber}.`;
  }
  return `You leaned on your caddy ${session.totalAsks}× across ${session.holesEngaged.length} hole${
    session.holesEngaged.length === 1 ? '' : 's'
  }.`;
}

function uiEventMs(e: Record<string, unknown>): number | null {
  const meta = e.metadata as { timestamp?: number } | undefined;
  if (typeof meta?.timestamp === 'number') return meta.timestamp;
  const ts = e.timestamp;
  if (typeof ts === 'number') return ts;
  const toDate = (ts as { toDate?: () => Date } | undefined)?.toDate;
  if (typeof toDate === 'function') return toDate.call(ts).getTime();
  return null;
}

function asString(v: unknown): string | undefined {
  return typeof v === 'string' && v.length > 0 ? v : undefined;
}
function asNumber(v: unknown): number | undefined {
  return typeof v === 'number' && Number.isFinite(v) ? v : undefined;
}
function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]);
}
function aOrAn(club: string): string {
  return /^[aeiou8]/i.test(club) ? `an ${club}` : `a ${club}`;
}
