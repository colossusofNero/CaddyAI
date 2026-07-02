/**
 * Admin: update a hole's tee/green geometry.
 * POST /api/admin/course-geometry
 *
 * The browser can't write the shared `courses` collection (firestore.rules:
 * courses write = false), so tee/pin corrections from the round-summary map go
 * through here. Verifies a Firebase ID token whose email is in ADMIN_EMAILS,
 * then writes courses/{courseId}.holes[number==holeNumber].gpsData via the
 * Admin SDK (which bypasses rules).
 *
 * Body: { courseId, holeNumber, teeBox?: {latitude,longitude}, greenCenter?: {latitude,longitude} }
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { initializeFirebaseAdmin, getAdminDb } from '@/services/firebaseAdmin';

const ADMIN_EMAILS = [
  'scott.roelofs@rcgvaluation.com',
  'scottroelofs@icloud.com',
];

interface Coord { latitude: number; longitude: number }
function validCoord(c: unknown): c is Coord {
  const v = c as Coord | undefined;
  return !!v && typeof v.latitude === 'number' && typeof v.longitude === 'number'
    && Math.abs(v.latitude) <= 90 && Math.abs(v.longitude) <= 180;
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    initializeFirebaseAdmin();
    let decoded;
    try {
      decoded = await getAuth().verifyIdToken(token);
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    if (!ADMIN_EMAILS.includes(decoded.email || '')) {
      return NextResponse.json({ error: 'Forbidden — admin access required' }, { status: 403 });
    }

    const { courseId, holeNumber, teeBox, greenCenter } = await request.json();
    if (!courseId || typeof holeNumber !== 'number') {
      return NextResponse.json({ error: 'courseId and holeNumber are required' }, { status: 400 });
    }
    if (teeBox !== undefined && !validCoord(teeBox)) {
      return NextResponse.json({ error: 'invalid teeBox' }, { status: 400 });
    }
    if (greenCenter !== undefined && !validCoord(greenCenter)) {
      return NextResponse.json({ error: 'invalid greenCenter' }, { status: 400 });
    }
    if (!teeBox && !greenCenter) {
      return NextResponse.json({ error: 'teeBox or greenCenter required' }, { status: 400 });
    }

    const db = getAdminDb();
    const ref = db.collection('courses').doc(courseId);
    const snap = await ref.get();
    if (!snap.exists) return NextResponse.json({ error: 'course not found' }, { status: 404 });

    const data = snap.data() || {};
    const holes: Array<{ number?: number; gpsData?: Record<string, unknown> }> =
      Array.isArray(data.holes) ? [...data.holes] : [];
    const idx = holes.findIndex(h => h?.number === holeNumber);
    if (idx < 0) return NextResponse.json({ error: `hole ${holeNumber} not found in course` }, { status: 404 });

    const gpsData = { ...(holes[idx].gpsData || {}) };
    if (teeBox) gpsData.teeBox = { latitude: teeBox.latitude, longitude: teeBox.longitude };
    if (greenCenter) gpsData.greenCenter = { latitude: greenCenter.latitude, longitude: greenCenter.longitude };
    holes[idx] = { ...holes[idx], gpsData };

    await ref.set(
      { holes, geometryEditedAt: Date.now(), geometryEditedBy: decoded.email },
      { merge: true }
    );

    return NextResponse.json({ success: true, holeNumber });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'failed';
    console.error('[course-geometry] error:', e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
