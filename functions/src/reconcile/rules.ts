import { distanceYards, pointInPolygon } from './geo';
import {
  AgentDecision,
  ReconcileInputs,
  ReconcileResult,
  ShotEventInput,
} from './types';

// Tunable thresholds — kept here so they're easy to find and adjust.
export const TUNING = {
  TEE_BOX_RADIUS_YDS: 5,
  CLUSTER_RADIUS_YDS: 8,
  CLUSTER_TIME_MS: 90_000,
  UP_AND_DOWN_RADIUS_YDS: 30,
  CHAIN_DRIFT_TOLERANCE_YDS: 20,
};

export function reconcileHole(inputs: ReconcileInputs): ReconcileResult {
  const { events, scorecard, selectedTeeColor, courseHole } = inputs;

  // Chronological order is assumed elsewhere — sort defensively.
  const sorted = [...events].sort((a, b) => a.timestamp - b.timestamp);

  // Start with everything kept; rules flip events to kept:false.
  const decisions = new Map<string, AgentDecision>(
    sorted.map(e => [
      e.eventId,
      {
        eventId: e.eventId,
        kept: true,
        confidence: 'high' as const,
        reason: '',
        ruleId: '' as const,
      },
    ])
  );

  // ---- Rule 1: Wrong tee box ----
  if (courseHole && courseHole.teeBoxes.length > 0) {
    for (const event of sorted) {
      if (!event.gpsPosition) continue;
      for (const tb of courseHole.teeBoxes) {
        if (tb.color === selectedTeeColor) continue;
        const d = distanceYards(event.gpsPosition, tb.position);
        if (d <= TUNING.TEE_BOX_RADIUS_YDS) {
          const dec = decisions.get(event.eventId)!;
          dec.kept = false;
          dec.ruleId = 'rule1-wrong-tee';
          dec.reason = `Origin within ${TUNING.TEE_BOX_RADIUS_YDS}yd of unselected ${tb.color} tee`;
          dec.confidence = 'high';
          break;
        }
      }
    }
  }

  // ---- Rule 2: Dense cluster — keep only the latest call in a cluster ----
  // A cluster is a set of still-kept events within CLUSTER_RADIUS_YDS and
  // CLUSTER_TIME_MS of each other (transitive over time, not space).
  const stillKeptForCluster = sorted.filter(
    e => decisions.get(e.eventId)!.kept && e.gpsPosition
  );
  const visited = new Set<string>();
  for (let i = 0; i < stillKeptForCluster.length; i++) {
    const seed = stillKeptForCluster[i];
    if (visited.has(seed.eventId)) continue;
    const cluster: ShotEventInput[] = [seed];
    visited.add(seed.eventId);
    for (let j = i + 1; j < stillKeptForCluster.length; j++) {
      const candidate = stillKeptForCluster[j];
      if (visited.has(candidate.eventId)) continue;
      // Compare against the *latest* member of the cluster so a slow drift
      // (e.g. player walked 4 yards forward) still chains together.
      const last = cluster[cluster.length - 1];
      const dist = distanceYards(last.gpsPosition!, candidate.gpsPosition!);
      const dt = Math.abs(candidate.timestamp - last.timestamp);
      if (dist <= TUNING.CLUSTER_RADIUS_YDS && dt <= TUNING.CLUSTER_TIME_MS) {
        cluster.push(candidate);
        visited.add(candidate.eventId);
      }
    }
    if (cluster.length > 1) {
      // Keep latest, drop the rest.
      for (let k = 0; k < cluster.length - 1; k++) {
        const dec = decisions.get(cluster[k].eventId)!;
        dec.kept = false;
        dec.ruleId = 'rule2-cluster';
        dec.reason = `Superseded by a later call within ${TUNING.CLUSTER_RADIUS_YDS}yd and ${TUNING.CLUSTER_TIME_MS / 1000}s`;
        dec.confidence = 'high';
      }
    }
  }

  // ---- Rule 4: FIR consistency ----
  // Two passes:
  //   4a (lie-based) — scan ALL kept events for lie labels that contradict
  //   the scorecard. With FIR=yes, any kept call with lie=rough/sand/etc.
  //   is exploratory UNLESS it's near the green (legitimate recovery, e.g.
  //   chipping out of the rough after missing the green).
  //   4b (polygon-based) — when a fairway polygon is available, check
  //   shot 2's origin against it.
  const OFF_FAIRWAY = /rough|sand|trap|bunker|water|hazard/i;
  if (scorecard.fairwayHit) {
    for (const event of sorted) {
      if (!decisions.get(event.eventId)!.kept) continue;
      const lie = event.payload?.lie as string | undefined;
      if (!lie || !OFF_FAIRWAY.test(lie)) continue;
      // Exempt legitimate recovery shots near the green.
      if (
        event.gpsPosition &&
        courseHole?.greenCenter &&
        distanceYards(event.gpsPosition, courseHole.greenCenter) <=
          TUNING.UP_AND_DOWN_RADIUS_YDS
      ) {
        continue;
      }
      const dec = decisions.get(event.eventId)!;
      dec.kept = false;
      dec.ruleId = 'rule4-fir-mismatch';
      dec.reason = `Scorecard says FIR yes but lie="${lie}"`;
      dec.confidence = 'medium';
    }
  }

  // Polygon-based check on shot 2 (only when a fairway polygon is supplied)
  if (scorecard.fairwayHit !== undefined && courseHole?.fairwayPolygon) {
    const ordered = sorted.filter(e => decisions.get(e.eventId)!.kept);
    if (ordered.length >= 2) {
      const approach = ordered[1];
      if (approach.gpsPosition) {
        const inside = pointInPolygon(approach.gpsPosition, courseHole.fairwayPolygon);
        if (scorecard.fairwayHit && !inside) {
          const dec = decisions.get(approach.eventId)!;
          dec.kept = false;
          dec.ruleId = 'rule4-fir-mismatch';
          dec.reason = 'Scorecard says FIR yes but approach origin is outside fairway polygon';
          dec.confidence = 'medium';
        } else if (!scorecard.fairwayHit && inside) {
          const dec = decisions.get(approach.eventId)!;
          dec.kept = false;
          dec.ruleId = 'rule4-fir-mismatch';
          dec.reason = 'Scorecard says FIR no but approach origin is inside fairway polygon';
          dec.confidence = 'medium';
        }
      }
    }
  }

  // ---- Rule 5: Up-and-down match ----
  // GIR=false + a kept call within 30yd of green → confirm it's the recovery shot.
  // (Doesn't drop anything — just confirms and bumps confidence.)
  if (scorecard.greenInRegulation === false && courseHole?.greenCenter) {
    const stillKept = sorted.filter(
      e => decisions.get(e.eventId)!.kept && e.gpsPosition
    );
    for (const e of stillKept) {
      const d = distanceYards(e.gpsPosition!, courseHole.greenCenter);
      if (d <= TUNING.UP_AND_DOWN_RADIUS_YDS) {
        const dec = decisions.get(e.eventId)!;
        if (!dec.ruleId) {
          dec.ruleId = 'rule5-up-and-down';
          dec.reason = `Confirmed as recovery shot (within ${TUNING.UP_AND_DOWN_RADIUS_YDS}yd of green, GIR=no)`;
          dec.confidence = 'high';
        }
      }
    }
  }

  // ---- Rule 6: Chain continuity ----
  // For each consecutive pair of kept events, the previous event's actualLanding
  // (when set) should be close to the current event's origin. A big gap means an
  // orphan exploratory call slipped through or GPS was bad. Downgrade confidence.
  const orderedKept = sorted.filter(e => decisions.get(e.eventId)!.kept);
  for (let i = 1; i < orderedKept.length; i++) {
    const prev = orderedKept[i - 1];
    const cur = orderedKept[i];
    if (!prev.actualLanding || !cur.gpsPosition) continue;
    const drift = distanceYards(prev.actualLanding, cur.gpsPosition);
    if (drift > TUNING.CHAIN_DRIFT_TOLERANCE_YDS) {
      const dec = decisions.get(cur.eventId)!;
      dec.confidence = 'low';
      if (!dec.ruleId) {
        dec.ruleId = 'rule6-chain-orphan';
        dec.reason = `${Math.round(drift)}yd gap between previous shot's actualLanding and this call's origin`;
      }
    }
  }

  // ---- Rule 3: Stroke-count target ----
  // Putts aren't optimized, so expected = strokes - putts.
  const expectedKept = Math.max(0, scorecard.strokes - scorecard.putts);
  const actualKept = Array.from(decisions.values()).filter(d => d.kept).length;
  const needsLlmJudge = actualKept !== expectedKept;

  return {
    decisions: Array.from(decisions.values()),
    expectedKept,
    actualKept,
    needsLlmJudge,
  };
}
