import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface LatLng {
  latitude: number;
  longitude: number;
}

export interface TeeBox {
  color: string;
  position: LatLng;
}

export interface Hazard {
  type: 'sand' | 'water';
  polygon: LatLng[];
  name?: string;
}

export interface CourseHoleGeometry {
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

export async function loadHoleGeometry(
  courseId: string,
  holeNumber: number
): Promise<CourseHoleGeometry | null> {
  if (!db) return null;
  const holeId = `${courseId}_h${holeNumber}`;
  const snap = await getDoc(doc(db, 'courseHoles', holeId));
  if (!snap.exists()) return null;
  return snap.data() as CourseHoleGeometry;
}
