export interface LatLng {
  latitude: number;
  longitude: number;
}

export interface CourseTeeBox {
  color: string; // 'white' | 'red' | 'blue' | 'gold' | etc.
  position: LatLng;
}

// One named hazard polygon. `type` drives both classification and rendering.
export interface HazardPolygon {
  type: 'water' | 'sand';
  polygon: LatLng[];
  name?: string; // optional label e.g. "front-left bunker"
}

// Geometry for a single hole. Lives in /courseHoles/{holeId} where
// holeId conventionally is `${courseId}_h${holeNumber}` (e.g. starfire-king_h1).
// Polygon vertices are stored in order; the last point is auto-connected to
// the first (no need to duplicate).
export interface CourseHoleGeometry {
  courseId: string;
  holeNumber: number;
  par: number;
  teeBoxes: CourseTeeBox[];
  greenCenter: LatLng;
  greenPolygon: LatLng[];
  fairwayPolygon: LatLng[];
  hazards?: HazardPolygon[];
  // Tee → aim point line, used for left/right and long/short relative to target.
  targetLine?: { tee: LatLng; aim: LatLng };
  // Tunable parameters used when this doc was generated, so a re-seed produces
  // a comparable polygon. Editing these and re-running the seed script is the
  // intended way to refine the geometry without hand-editing vertex arrays.
  generatedFrom?: {
    bearingDeg: number;
    holeLengthYards: number;
    fairwayWidthYards: number;
    fairwayStartYards: number; // distance from tee where fairway begins
    fairwayEndYards: number;   // distance from tee where fairway ends
    greenRadiusYards: number;
    greenVertices: number;
  };
  createdAt?: number;
  updatedAt?: number;
}

// Possible landing-area classifications for an interior chain point.
// `unknown` is the fallback when geometry doesn't exist for the hole.
export type LandingArea =
  | 'tee'
  | 'fairway'
  | 'rough'
  | 'green'
  | 'sand'
  | 'water'
  | 'unknown';
