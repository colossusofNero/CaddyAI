import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';

if (admin.apps.length === 0) admin.initializeApp();
const db = () => admin.firestore();

interface LatLng {
  latitude: number;
  longitude: number;
}

interface TeeBox {
  color: string;
  position: LatLng;
}

interface Hazard {
  type: 'sand' | 'water';
  polygon: LatLng[];
  name?: string;
}

interface SaveHoleGeometryRequest {
  courseId: string;
  holeNumber: number;
  par: number;
  teeBoxes: TeeBox[];
  greenCenter: LatLng;
  greenPolygon: LatLng[];
  fairwayPolygon: LatLng[];
  hazards?: Hazard[];
  targetLine?: { tee: LatLng; aim: LatLng };
}

function isLatLng(v: unknown): v is LatLng {
  if (!v || typeof v !== 'object') return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.latitude === 'number' &&
    typeof o.longitude === 'number' &&
    Math.abs(o.latitude as number) <= 90 &&
    Math.abs(o.longitude as number) <= 180
  );
}

function isPolygon(v: unknown, minVertices = 3): v is LatLng[] {
  return Array.isArray(v) && v.length >= minVertices && v.every(isLatLng);
}

function validate(req: SaveHoleGeometryRequest): string | null {
  if (!req || typeof req !== 'object') return 'Body must be an object';
  if (!req.courseId || typeof req.courseId !== 'string') return 'courseId required';
  if (!/^[a-z0-9-]+$/.test(req.courseId)) return 'courseId must be lowercase alphanumeric + dashes';
  if (!Number.isInteger(req.holeNumber) || req.holeNumber < 1 || req.holeNumber > 18) {
    return 'holeNumber must be 1-18';
  }
  if (!Number.isInteger(req.par) || req.par < 3 || req.par > 6) {
    return 'par must be 3-6';
  }
  if (!Array.isArray(req.teeBoxes) || req.teeBoxes.length === 0) {
    return 'At least one tee box required';
  }
  for (const tb of req.teeBoxes) {
    if (!tb.color || typeof tb.color !== 'string') return 'Each tee box needs a color';
    if (!isLatLng(tb.position)) return `Invalid position for ${tb.color} tee`;
  }
  if (!isLatLng(req.greenCenter)) return 'greenCenter must be a valid LatLng';
  if (!isPolygon(req.greenPolygon)) return 'greenPolygon must have at least 3 vertices';
  if (!isPolygon(req.fairwayPolygon)) return 'fairwayPolygon must have at least 3 vertices';
  if (req.hazards && !Array.isArray(req.hazards)) return 'hazards must be an array';
  for (const h of req.hazards ?? []) {
    if (h.type !== 'sand' && h.type !== 'water') return `Unknown hazard type "${h.type}"`;
    if (!isPolygon(h.polygon)) return 'hazard.polygon needs at least 3 vertices';
  }
  return null;
}

export const saveHoleGeometryFn = functions.https.onCall(
  async (data: SaveHoleGeometryRequest, context): Promise<{ holeId: string }> => {
    if (!context.auth?.uid) {
      throw new functions.https.HttpsError('unauthenticated', 'Sign in required');
    }
    const err = validate(data);
    if (err) {
      throw new functions.https.HttpsError('invalid-argument', err);
    }

    const holeId = `${data.courseId}_h${data.holeNumber}`;
    const doc = {
      courseId: data.courseId,
      holeNumber: data.holeNumber,
      par: data.par,
      teeBoxes: data.teeBoxes,
      greenCenter: data.greenCenter,
      greenPolygon: data.greenPolygon,
      fairwayPolygon: data.fairwayPolygon,
      hazards: data.hazards ?? [],
      targetLine: data.targetLine ?? { tee: data.teeBoxes[0].position, aim: data.greenCenter },
      updatedAt: Date.now(),
      updatedBy: context.auth.uid,
    };

    await db().collection('courseHoles').doc(holeId).set(doc);
    console.log(`[saveHoleGeometry] ${context.auth.uid} wrote ${holeId}`);
    return { holeId };
  }
);
