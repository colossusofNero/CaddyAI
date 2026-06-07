/**
 * Auto-close abandoned rounds (scheduled).
 *
 * Runs hourly. Two jobs:
 *
 *  1. Abandoned caddy sessions — a user engaged the optimizer on-course but
 *     never logged a score. Once the session has been idle for >4h we mark it
 *     closed and (when 4h–24h fresh) email them the Caddy Recap to pull them
 *     back up the engagement ladder. Sessions older than the email window get
 *     a silent closure marker so a future run never emails about stale data —
 *     this also guards the very first deploy against blasting months of
 *     historical abandoned sessions.
 *
 *  2. Stale legacy /rounds docs — the mobile app writes a round-start record
 *     to /rounds and never flips `completed`. Any such doc untouched for >4h
 *     gets `completed: true`, `closedReason: 'auto-timeout'`. Non-destructive.
 *
 * Why 4h: a full round is ~4–4.5h, and the timer is measured from the LAST
 * activity, not round start. Only pros / tournament players pause-and-resume,
 * and they don't keep score in the app anyway.
 */

import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import { buildUserSessions, sessionHighlight, type CaddySession } from './caddySessions';
import { sendLoopsTransactional } from '../loopsService';

if (admin.apps.length === 0) admin.initializeApp();
const db = () => admin.firestore();

const HOUR_MS = 60 * 60 * 1000;
const IDLE_MS = 4 * HOUR_MS;          // must be quiet this long before we close
const EMAIL_MAX_AGE_MS = 24 * HOUR_MS; // only email if last activity < 24h ago
const SCAN_LOOKBACK_MS = 7 * 24 * HOUR_MS; // how far back a single run considers events

const CLOSURES = 'caddySessionClosures'; // dedupe markers (admin-only)

interface ClosureSummary {
  sessionsClosed: number;
  emailsSent: number;
  legacyRoundsClosed: number;
}

export async function autoCloseInternal(nowMs: number): Promise<ClosureSummary> {
  const summary: ClosureSummary = { sessionsClosed: 0, emailsSent: 0, legacyRoundsClosed: 0 };

  await closeAbandonedSessions(nowMs, summary);
  await closeStaleLegacyRounds(nowMs, summary);

  console.log(
    `[autoClose] done — sessions closed: ${summary.sessionsClosed}, emails: ${summary.emailsSent}, legacy rounds: ${summary.legacyRoundsClosed}`
  );
  return summary;
}

// ─── Job 1: abandoned caddy sessions ────────────────────────────────────────

async function closeAbandonedSessions(nowMs: number, summary: ClosureSummary): Promise<void> {
  const fs = db();
  const sinceMs = nowMs - SCAN_LOOKBACK_MS;

  // Find users with recent optimizer activity. shotEvents.timestamp is epoch
  // ms (number); uiEvents we filter by createdAt Timestamp.
  const activeUserIds = new Set<string>();

  const recentShots = await fs
    .collection('shotEvents')
    .where('timestamp', '>=', sinceMs)
    .get();
  for (const d of recentShots.docs) {
    const uid = d.data().userId;
    if (typeof uid === 'string') activeUserIds.add(uid);
  }

  const recentUi = await fs
    .collection('uiEvents')
    .where('createdAt', '>=', Timestamp.fromMillis(sinceMs))
    .get();
  for (const d of recentUi.docs) {
    const uid = d.data().userId;
    if (typeof uid === 'string') activeUserIds.add(uid);
  }

  if (activeUserIds.size === 0) return;
  console.log(`[autoClose] ${activeUserIds.size} user(s) with activity in the last 7 days`);

  const geomCache = new Map();
  for (const userId of activeUserIds) {
    let sessions: CaddySession[];
    try {
      sessions = await buildUserSessions(userId, sinceMs, geomCache);
    } catch (err) {
      console.warn(`[autoClose] session build failed for ${userId}:`, err);
      continue;
    }

    for (const session of sessions) {
      const idle = nowMs - session.endTime;
      if (idle < IDLE_MS) continue;          // still possibly in-progress
      if (session.hasScorecard) continue;    // they finished — nothing abandoned

      const closureId = `${session.userId}_${session.date}_${session.courseId ?? 'unknown'}`;
      const ref = fs.collection(CLOSURES).doc(closureId);

      // Idempotent claim: create-if-absent. If it already exists, we've handled
      // this session (closed and/or emailed) on a prior run.
      let alreadyHandled = false;
      try {
        await ref.create({
          userId: session.userId,
          date: session.date,
          courseId: session.courseId ?? null,
          courseName: session.courseName ?? null,
          totalAsks: session.totalAsks,
          holesEngaged: session.holesEngaged,
          fullMoments: session.fullMoments,
          lastActivity: Timestamp.fromMillis(session.endTime),
          closedReason: 'auto-timeout',
          closedAt: admin.firestore.FieldValue.serverTimestamp(),
          emailSent: false,
        });
      } catch (err: unknown) {
        // ALREADY_EXISTS — another run claimed it.
        if ((err as { code?: number }).code === 6) {
          alreadyHandled = true;
        } else {
          console.warn(`[autoClose] closure claim failed for ${closureId}:`, err);
          continue;
        }
      }
      if (alreadyHandled) continue;

      summary.sessionsClosed++;

      // Email only freshly-abandoned sessions; older ones just get the silent
      // marker above so they're never emailed retroactively.
      if (idle <= EMAIL_MAX_AGE_MS) {
        const sent = await emailRecap(session);
        if (sent) {
          summary.emailsSent++;
          await ref.update({ emailSent: true, emailSentAt: admin.firestore.FieldValue.serverTimestamp() });
        }
      }
    }
  }
}

async function emailRecap(session: CaddySession): Promise<boolean> {
  const transactionalId = process.env.LOOPS_CADDY_RECAP_TXN_ID;
  if (!transactionalId) {
    // Template not configured yet — we still closed the session. Email turns
    // on automatically once the Loops template + env var exist.
    console.log('[autoClose] LOOPS_CADDY_RECAP_TXN_ID not set — skipping recap email');
    return false;
  }

  let email: string | undefined;
  let firstName = '';
  try {
    const user = await admin.auth().getUser(session.userId);
    email = user.email ?? undefined;
    firstName = user.displayName?.split(/\s+/)[0] ?? '';
  } catch (err) {
    console.warn(`[autoClose] could not load auth user ${session.userId}:`, err);
    return false;
  }
  if (!email) return false;

  const recapUrl =
    'https://copperlinegolf.com/analytics/caddy-recap?utm_source=loops&utm_medium=email&utm_campaign=caddy-recap';

  const result = await sendLoopsTransactional(email, transactionalId, {
    firstName,
    courseName: session.courseName ?? 'the course',
    date: session.date,
    totalAsks: session.totalAsks,
    holesEngaged: session.holesEngaged.length,
    highlight: sessionHighlight(session),
    recapUrl,
  });

  if (!result.ok) {
    console.warn(`[autoClose] recap email failed for ${session.userId}: ${result.error}`);
    return false;
  }
  console.log(`[autoClose] recap emailed to ${email} (${session.date} · ${session.courseName ?? 'unknown'})`);
  return true;
}

// ─── Job 2: stale legacy /rounds docs ───────────────────────────────────────

async function closeStaleLegacyRounds(nowMs: number, summary: ClosureSummary): Promise<void> {
  const fs = db();
  const cutoff = nowMs - IDLE_MS;

  // /rounds.updatedAt is stored as a Timestamp. Close anything still
  // completed=false that hasn't been touched in >4h.
  const snap = await fs
    .collection('rounds')
    .where('completed', '==', false)
    .where('updatedAt', '<', Timestamp.fromMillis(cutoff))
    .get();

  if (snap.empty) return;

  // Batch in chunks of 400 (Firestore limit is 500 writes/batch).
  const docs = snap.docs;
  for (let i = 0; i < docs.length; i += 400) {
    const batch = fs.batch();
    for (const d of docs.slice(i, i + 400)) {
      batch.update(d.ref, {
        completed: true,
        closedReason: 'auto-timeout',
        autoClosedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
    await batch.commit();
  }
  summary.legacyRoundsClosed += docs.length;
}

// ─── Scheduled entry point ──────────────────────────────────────────────────

export const autoCloseRoundsFn = functions
  .runWith({ secrets: ['LOOPS_API_KEY', 'LOOPS_CADDY_RECAP_TXN_ID'], timeoutSeconds: 300, memory: '512MB' })
  .pubsub.schedule('every 60 minutes')
  .timeZone('America/Phoenix')
  .onRun(async () => {
    await autoCloseInternal(Date.now());
    return null;
  });
