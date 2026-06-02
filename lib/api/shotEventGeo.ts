import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  QueryConstraint,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export type ShotEventType = 'optimizer_run' | 'ellipse_target' | 'ai_conversation';

export interface LatLng {
  latitude: number;
  longitude: number;
}

export interface AgentDecision {
  kept: boolean;
  confidence: 'high' | 'medium' | 'low';
  reason: string;
  ruleId: string;
}

export interface ShotEventGeoPoint {
  eventId: string;
  eventType: ShotEventType;
  timestamp: number;
  roundId: string | null;
  holeNumber: number | null;
  latitude: number;
  longitude: number;
  predictedLanding: LatLng | null;
  actualLanding: LatLng | null;
  previousEventId: string | null;
  agentDecision: AgentDecision | null;
  payload: Record<string, unknown>;
}

export interface GetShotEventPointsOptions {
  userId: string;
  eventType?: ShotEventType;
  roundId?: string;
  since?: Date;
  max?: number;
  // When 'kept-only' (default): hide events the agent dropped (kept=false).
  // When 'all': return everything, including dropped events.
  // When 'dropped-only': return only the agent's discarded calls (for QA).
  agentFilter?: 'kept-only' | 'all' | 'dropped-only';
}

export async function getShotEventPoints(
  opts: GetShotEventPointsOptions
): Promise<ShotEventGeoPoint[]> {
  if (!db) {
    console.warn('[shotEventGeo] Firestore not initialized');
    return [];
  }

  const constraints: QueryConstraint[] = [where('userId', '==', opts.userId)];
  if (opts.eventType) constraints.push(where('eventType', '==', opts.eventType));
  if (opts.roundId) constraints.push(where('roundId', '==', opts.roundId));
  if (opts.since) constraints.push(where('timestamp', '>=', opts.since.getTime()));
  constraints.push(orderBy('timestamp', 'desc'));
  constraints.push(limit(opts.max ?? 500));

  const snap = await getDocs(query(collection(db, 'shotEvents'), ...constraints));

  const agentFilter = opts.agentFilter ?? 'kept-only';

  return snap.docs
    .map(d => d.data() as Record<string, any>)
    .filter(d => {
      if (
        !d.gpsPosition ||
        typeof d.gpsPosition.latitude !== 'number' ||
        typeof d.gpsPosition.longitude !== 'number' ||
        (d.gpsPosition.latitude === 0 && d.gpsPosition.longitude === 0)
      ) {
        return false;
      }
      if (agentFilter === 'all') return true;
      // Events without an agentDecision haven't been reconciled yet — treat
      // as kept by default so a freshly recorded round isn't invisible.
      const kept = d.agentDecision?.kept ?? true;
      return agentFilter === 'kept-only' ? kept : !kept;
    })
    .map(d => ({
      eventId: d.eventId,
      eventType: d.eventType,
      timestamp: d.timestamp,
      roundId: d.roundId ?? null,
      holeNumber: d.holeNumber ?? null,
      latitude: d.gpsPosition.latitude,
      longitude: d.gpsPosition.longitude,
      predictedLanding: d.predictedLanding && typeof d.predictedLanding.latitude === 'number'
        ? { latitude: d.predictedLanding.latitude, longitude: d.predictedLanding.longitude }
        : null,
      actualLanding: d.actualLanding && typeof d.actualLanding.latitude === 'number'
        ? { latitude: d.actualLanding.latitude, longitude: d.actualLanding.longitude }
        : null,
      previousEventId: d.previousEventId ?? null,
      agentDecision: d.agentDecision
        ? {
            kept: !!d.agentDecision.kept,
            confidence: d.agentDecision.confidence ?? 'medium',
            reason: d.agentDecision.reason ?? '',
            ruleId: d.agentDecision.ruleId ?? '',
          }
        : null,
      payload: d.payload ?? {},
    }));
}

export function toGeoJSON(points: ShotEventGeoPoint[]) {
  return {
    type: 'FeatureCollection' as const,
    features: points.map(p => ({
      type: 'Feature' as const,
      geometry: {
        type: 'Point' as const,
        coordinates: [p.longitude, p.latitude],
      },
      properties: {
        eventId: p.eventId,
        eventType: p.eventType,
        timestamp: p.timestamp,
        roundId: p.roundId,
        holeNumber: p.holeNumber,
      },
    })),
  };
}
