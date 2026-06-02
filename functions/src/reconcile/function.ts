import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';
import {
  reconcileHole,
  ShotEventInput,
  ScorecardHole,
  CourseHoleGeometry,
  ReconcileInputs,
  ReconcileResult,
  LatLng,
} from './index';
import { runLlmJudge } from './llmJudge';

if (admin.apps.length === 0) admin.initializeApp();
const db = () => admin.firestore();

interface ReconcileHoleRequest {
  roundId: string;
  holeNumber: number;
  // Optional: caller may pre-supply these so we don't need to look them up.
  scorecard?: ScorecardHole;
  selectedTeeColor?: string;
  courseHole?: CourseHoleGeometry;
}

interface ReconcileHoleResponse extends ReconcileResult {
  eventsConsidered: number;
  decisionsWritten: number;
  llmJudgeInvoked: boolean;
}

interface InternalArgs {
  userId: string;
  roundId: string;
  holeNumber: number;
  scorecard?: ScorecardHole;
  selectedTeeColor?: string;
  courseHole?: CourseHoleGeometry;
}

// Core reconcile work. Pulls events, resolves scorecard/tee, runs rules,
// escalates to LLM judge if needed, writes decisions back. Returns the
// response shape; throws on missing scorecard. Shared by the HTTPS callable
// and the activeRounds Firestore trigger.
export async function reconcileHoleInternal(
  args: InternalArgs
): Promise<ReconcileHoleResponse> {
  const fs = db();

  // 1. Pull shotEvents for this user/round/hole.
  const eventsSnap = await fs
    .collection('shotEvents')
    .where('userId', '==', args.userId)
    .where('roundId', '==', args.roundId)
    .where('holeNumber', '==', args.holeNumber)
    .orderBy('timestamp', 'asc')
    .get();

  const events: ShotEventInput[] = eventsSnap.docs.map(d => {
    const v = d.data();
    return {
      eventId: v.eventId,
      timestamp: v.timestamp,
      gpsPosition: v.gpsPosition ?? null,
      predictedLanding: v.predictedLanding ?? null,
      actualLanding: v.actualLanding ?? null,
      payload: v.payload ?? {},
    };
  });

  if (events.length === 0) {
    return {
      decisions: [],
      expectedKept: 0,
      actualKept: 0,
      needsLlmJudge: false,
      eventsConsidered: 0,
      decisionsWritten: 0,
      llmJudgeInvoked: false,
    };
  }

  // 2. Resolve scorecard + selectedTee. Caller may pre-supply; otherwise we
  //    look in /activeRounds/{uid} and /scores/{roundId}.
  let scorecard = args.scorecard;
  let selectedTeeColor = args.selectedTeeColor;

  if (!scorecard || !selectedTeeColor) {
    const activeRoundDoc = await fs.collection('activeRounds').doc(args.userId).get();
    if (activeRoundDoc.exists) {
      const ar = activeRoundDoc.data() as Record<string, unknown>;
      if (!selectedTeeColor && typeof ar.tee === 'object' && ar.tee) {
        selectedTeeColor = (ar.tee as { color?: string }).color;
      }
      if (!scorecard && Array.isArray(ar.holes)) {
        const hole = (ar.holes as Array<{ holeNumber: number }>).find(
          h => h.holeNumber === args.holeNumber
        );
        if (hole) scorecard = hole as unknown as ScorecardHole;
      }
    }

    if (!scorecard || !selectedTeeColor) {
      const scoreDoc = await fs.collection('scores').doc(args.roundId).get();
      if (scoreDoc.exists) {
        const sc = scoreDoc.data() as Record<string, unknown>;
        if (!selectedTeeColor && typeof sc.tee === 'object' && sc.tee) {
          selectedTeeColor = (sc.tee as { color?: string }).color;
        }
        if (!scorecard && Array.isArray(sc.holes)) {
          const hole = (sc.holes as Array<{ holeNumber: number }>).find(
            h => h.holeNumber === args.holeNumber
          );
          if (hole) scorecard = hole as unknown as ScorecardHole;
        }
      }
    }
  }

  if (!scorecard) {
    throw new Error(
      `No scorecard found for hole ${args.holeNumber} in round ${args.roundId}`
    );
  }
  if (!selectedTeeColor) {
    selectedTeeColor = '__unknown__';
  }

  // 3. Run the rules.
  const inputs: ReconcileInputs = {
    events,
    scorecard,
    selectedTeeColor,
    courseHole: args.courseHole,
  };
  let result = reconcileHole(inputs);
  let llmJudgeInvoked = false;

  if (result.needsLlmJudge && process.env.ANTHROPIC_API_KEY) {
    console.log(
      `[reconcileHole] Rules engine produced ${result.actualKept} kept, expected ${result.expectedKept} — escalating to LLM judge`
    );
    result = await runLlmJudge(inputs, result, process.env.ANTHROPIC_API_KEY);
    llmJudgeInvoked = true;
  }

  // 4. Write decisions back to each event.
  const batch = fs.batch();
  const decidedAt = admin.firestore.FieldValue.serverTimestamp();
  const modelTag = llmJudgeInvoked ? 'rules-v1+llm-judge' : 'rules-v1';
  for (const dec of result.decisions) {
    const docRef = fs.collection('shotEvents').doc(dec.eventId);
    batch.update(docRef, {
      agentDecision: {
        kept: dec.kept,
        confidence: dec.confidence,
        reason: dec.reason,
        ruleId: dec.ruleId,
        decidedAt,
        model: modelTag,
      },
    });
  }
  await batch.commit();

  return {
    ...result,
    eventsConsidered: events.length,
    decisionsWritten: result.decisions.length,
    llmJudgeInvoked,
  };
}

// HTTPS callable wrapper — thin auth/validation layer around reconcileHoleInternal.
export const reconcileHoleFn = functions
  .runWith({ secrets: ['ANTHROPIC_API_KEY'] })
  .https.onCall(
  async (data: ReconcileHoleRequest, context): Promise<ReconcileHoleResponse> => {
    const uid = context.auth?.uid;
    if (!uid) {
      throw new functions.https.HttpsError('unauthenticated', 'Sign in required');
    }
    if (!data?.roundId || typeof data.holeNumber !== 'number') {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'roundId and holeNumber are required'
      );
    }

    try {
      return await reconcileHoleInternal({
        userId: uid,
        roundId: data.roundId,
        holeNumber: data.holeNumber,
        scorecard: data.scorecard,
        selectedTeeColor: data.selectedTeeColor,
        courseHole: data.courseHole,
      });
    } catch (err) {
      if (err instanceof Error && err.message.startsWith('No scorecard found')) {
        throw new functions.https.HttpsError('failed-precondition', err.message);
      }
      throw err;
    }
  }
);

// Firestore trigger: fires whenever /activeRounds/{userId} is written.
// For each hole whose `completed` flag flipped from false → true since the
// last write, runs reconcileHoleInternal. Idempotent — re-firing on the same
// hole just overwrites agentDecision on the events.
export const onActiveRoundUpdated = functions
  .runWith({ secrets: ['ANTHROPIC_API_KEY'] })
  .firestore.document('activeRounds/{userId}')
  .onWrite(async (change, context) => {
    const userId = context.params.userId as string;
    const before = change.before.exists ? change.before.data() : null;
    const after = change.after.exists ? change.after.data() : null;

    if (!after) return; // round was deleted

    type HoleEntry = { holeNumber: number; completed?: boolean };
    const beforeHoles: HoleEntry[] = Array.isArray(before?.holes) ? (before!.holes as HoleEntry[]) : [];
    const afterHoles: HoleEntry[] = Array.isArray(after.holes) ? (after.holes as HoleEntry[]) : [];

    const justCompleted = afterHoles.filter(ah => {
      if (!ah.completed) return false;
      const bh = beforeHoles.find(h => h.holeNumber === ah.holeNumber);
      return !bh?.completed;
    });

    if (justCompleted.length === 0) return;

    const roundId: string =
      typeof after.id === 'string' ? after.id : userId;
    const selectedTeeColor: string | undefined =
      typeof after.tee === 'object' && after.tee && typeof (after.tee as Record<string, unknown>).color === 'string'
        ? ((after.tee as Record<string, unknown>).color as string)
        : undefined;

    console.log(
      `[onActiveRoundUpdated] ${userId} round ${roundId}: ${justCompleted.length} hole(s) newly completed`
    );

    for (const hole of justCompleted) {
      try {
        const result = await reconcileHoleInternal({
          userId,
          roundId,
          holeNumber: hole.holeNumber,
          scorecard: hole as unknown as ScorecardHole,
          selectedTeeColor,
        });
        console.log(
          `[onActiveRoundUpdated] Hole ${hole.holeNumber} reconciled: kept ${result.actualKept}/${result.expectedKept}, ${result.llmJudgeInvoked ? 'judge fired' : 'rules only'}`
        );
      } catch (err) {
        console.warn(
          `[onActiveRoundUpdated] Reconcile failed for hole ${hole.holeNumber}:`,
          err instanceof Error ? err.message : err
        );
      }
    }
  });

// Demo reconciler — runs the user's example scenario inline and returns the
// decisions. No Firestore reads or writes. Lets you verify rule behavior
// without setting up test data.
export const reconcileHoleDemoFn = functions.https.onCall(async () => {
  // Starfire King #1 — par 4 (per the user's example), 440-yd dogleg-less hole.
  const WHITE_TEE: LatLng = { latitude: 33.59030, longitude: -111.90832 };
  const RED_TEE: LatLng  = { latitude: 33.59020, longitude: -111.90828 }; // ~12yd from white
  const FAIRWAY: LatLng  = { latitude: 33.59180, longitude: -111.90820 };
  const ROUGH:   LatLng  = { latitude: 33.59185, longitude: -111.90805 }; // ~15yd east of FAIRWAY
  const OFF_GREEN: LatLng = { latitude: 33.59370, longitude: -111.90808 }; // ~25yd short of green
  const GREEN: LatLng    = { latitude: 33.59391, longitude: -111.90806 };

  const t0 = Date.now() - 1000 * 60 * 20;
  const minute = 60_000;

  const events: ShotEventInput[] = [
    // Three white-tee calls within ~90s of each other (player deciding).
    mkEvent('e1', WHITE_TEE, t0 + 0,           { lie: 'tee', clubConsidered: '3-wood' }),
    mkEvent('e2', WHITE_TEE, t0 + 25_000,      { lie: 'tee', clubConsidered: 'Driver' }),
    mkEvent('e3', WHITE_TEE, t0 + 50_000,      { lie: 'tee', clubConsidered: 'Driver, committed' }),
    // One red-tee call (player walked over to peek).
    mkEvent('e4', RED_TEE,   t0 + 65_000,      { lie: 'tee', clubConsidered: 'Driver, alt angle' }),
    // Three fairway calls clustered (deciding club for approach).
    mkEvent('e5', FAIRWAY,   t0 + 5  * minute, { lie: 'fairway', clubConsidered: '6-iron' }),
    mkEvent('e6', FAIRWAY,   t0 + 5.4 * minute,{ lie: 'fairway', clubConsidered: '7-iron' }),
    mkEvent('e7', FAIRWAY,   t0 + 5.8 * minute,{ lie: 'fairway', clubConsidered: '7-iron, committed' }),
    // One rough call (player wandered into the rough to look at the angle).
    mkEvent('e8', ROUGH,     t0 + 6.5 * minute,{ lie: 'rough', clubConsidered: '8-iron, just looking' }),
    // One call 25yd off the green for the chip.
    mkEvent('e9', OFF_GREEN, t0 + 10 * minute, { lie: 'fairway-fringe', clubConsidered: 'LW' }),
  ];

  const scorecard: ScorecardHole = {
    holeNumber: 1,
    par: 4,
    strokes: 4,
    putts: 1,
    fairwayHit: true,
    greenInRegulation: false,
  };

  const courseHole: CourseHoleGeometry = {
    holeNumber: 1,
    teeBoxes: [
      { color: 'white', position: WHITE_TEE },
      { color: 'red',   position: RED_TEE },
    ],
    greenCenter: GREEN,
    // No fairway polygon — relies on the lie payload to flag the rough call.
  };

  const result = reconcileHole({
    events,
    scorecard,
    selectedTeeColor: 'white',
    courseHole,
  });

  return {
    summary: {
      eventsConsidered: events.length,
      expectedKept: result.expectedKept,
      actualKept: result.actualKept,
      needsLlmJudge: result.needsLlmJudge,
    },
    decisions: result.decisions.map(d => {
      const ev = events.find(e => e.eventId === d.eventId)!;
      return {
        ...d,
        gps: ev.gpsPosition,
        timestampOffsetSec: Math.round((ev.timestamp - t0) / 1000),
        lie: ev.payload?.lie ?? null,
        clubConsidered: ev.payload?.clubConsidered ?? null,
      };
    }),
  };
});

// Ambiguous demo — constructs a scenario the rules engine cannot resolve on
// its own. Forces the LLM judge to break the tie. Requires ANTHROPIC_API_KEY.
//
// Scenario: par-4, 4 strokes, FIR yes, GIR yes, 2 putts → expects 2 kept
// (tee shot + approach). The rules engine produces 4 kept because:
//   - Two tee calls 12 yards apart (outside the 8yd cluster radius)
//   - Two fairway calls 15 yards apart (outside the cluster radius)
//   - No `lie` payload, no fairway polygon → rule 4 can't fire
//   - Cluster-distance pairs (e5/e6) get dropped by rule 2 as expected
// The judge has to reason which pair member is the committed shot.
export const reconcileHoleAmbiguousDemoFn = functions
  .runWith({ secrets: ['ANTHROPIC_API_KEY'] })
  .https.onCall(async () => {
    // Two tee positions ~12 yards apart (player shifted on the tee box)
    const TEE_A: LatLng = { latitude: 33.59030, longitude: -111.90832 };
    const TEE_B: LatLng = { latitude: 33.59040, longitude: -111.90832 }; // ~12yd north
    const TEE_NEAR_B: LatLng = { latitude: 33.59044, longitude: -111.90832 }; // ~5yd from TEE_B
    // Two fairway positions ~15 yards apart (player walked closer to ball)
    const FW_A: LatLng = { latitude: 33.59180, longitude: -111.90820 };
    const FW_B: LatLng = { latitude: 33.59194, longitude: -111.90820 }; // ~15yd north
    const FW_NEAR_A: LatLng = { latitude: 33.59184, longitude: -111.90820 }; // ~5yd from FW_A
    const GREEN: LatLng = { latitude: 33.59391, longitude: -111.90806 };

    const t0 = Date.now() - 1000 * 60 * 20;

    // Six events: 2 tee, 2 fairway, 2 cluster-mates. No `lie` payloads so
    // rule 4 can't help. `clubConsidered` hints which call was committed —
    // signal the LLM should pick up on.
    const events: ShotEventInput[] = [
      mkEvent('e1', TEE_A,      t0 + 0,            { clubConsidered: '3-wood, conservative' }),
      mkEvent('e2', TEE_B,      t0 + 100_000,      { clubConsidered: 'Driver, committed' }), // 100s > 90s cluster
      mkEvent('e3', TEE_NEAR_B, t0 + 130_000,      { clubConsidered: 'Driver, second look' }), // clusters with e2
      mkEvent('e4', FW_A,       t0 + 300_000,      { clubConsidered: '7-iron' }),
      mkEvent('e5', FW_NEAR_A,  t0 + 330_000,      { clubConsidered: '7-iron, second look' }), // clusters with e4
      mkEvent('e6', FW_B,       t0 + 420_000,      { clubConsidered: '6-iron, paced off, more uphill' }),
    ];

    const scorecard: ScorecardHole = {
      holeNumber: 1,
      par: 4,
      strokes: 4,
      putts: 2,
      fairwayHit: true,
      greenInRegulation: true,
    };

    const courseHole: CourseHoleGeometry = {
      holeNumber: 1,
      teeBoxes: [{ color: 'white', position: TEE_A }],
      greenCenter: GREEN,
      // No fairway polygon, no `lie` payloads — rule 4 cannot fire
    };

    const inputs: ReconcileInputs = {
      events,
      scorecard,
      selectedTeeColor: 'white',
      courseHole,
    };

    const rulesResult = reconcileHole(inputs);
    let finalResult = rulesResult;
    let llmJudgeInvoked = false;

    if (rulesResult.needsLlmJudge && process.env.ANTHROPIC_API_KEY) {
      finalResult = await runLlmJudge(inputs, rulesResult, process.env.ANTHROPIC_API_KEY);
      llmJudgeInvoked = true;
    }

    return {
      summary: {
        eventsConsidered: events.length,
        expectedKept: finalResult.expectedKept,
        rulesEngineKept: rulesResult.actualKept,
        finalKept: finalResult.actualKept,
        llmJudgeInvoked,
        llmJudgeAvailable: !!process.env.ANTHROPIC_API_KEY,
      },
      rulesEngineDecisions: rulesResult.decisions.map(d => ({
        eventId: d.eventId,
        kept: d.kept,
        confidence: d.confidence,
        reason: d.reason,
        ruleId: d.ruleId,
      })),
      finalDecisions: finalResult.decisions.map(d => {
        const ev = events.find(e => e.eventId === d.eventId)!;
        return {
          eventId: d.eventId,
          kept: d.kept,
          confidence: d.confidence,
          reason: d.reason,
          ruleId: d.ruleId,
          gps: ev.gpsPosition,
          timestampOffsetSec: Math.round((ev.timestamp - t0) / 1000),
          clubConsidered: ev.payload?.clubConsidered ?? null,
        };
      }),
    };
  });

function mkEvent(id: string, gps: LatLng, ts: number, payload: Record<string, unknown>): ShotEventInput {
  return {
    eventId: id,
    timestamp: ts,
    gpsPosition: gps,
    predictedLanding: null,
    actualLanding: null,
    payload,
  };
}
