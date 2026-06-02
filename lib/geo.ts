const EARTH_RADIUS_METERS = 6371000;
const YARDS_PER_METER = 1.09361;
const METERS_PER_YARD = 1 / YARDS_PER_METER;

const toRad = (deg: number) => (deg * Math.PI) / 180;
const toDeg = (rad: number) => (rad * 180) / Math.PI;

export interface LatLng {
  latitude: number;
  longitude: number;
}

// Standard haversine destination-point. bearingDeg is a compass bearing
// (0 = North, 90 = East). distanceYards is over-ground distance.
export function destinationPoint(
  origin: LatLng,
  bearingDeg: number,
  distanceYards: number
): LatLng {
  const distMeters = distanceYards * METERS_PER_YARD;
  const angularDist = distMeters / EARTH_RADIUS_METERS;
  const bearing = toRad(bearingDeg);
  const lat1 = toRad(origin.latitude);
  const lng1 = toRad(origin.longitude);

  const sinLat2 =
    Math.sin(lat1) * Math.cos(angularDist) +
    Math.cos(lat1) * Math.sin(angularDist) * Math.cos(bearing);
  const lat2 = Math.asin(sinLat2);

  const y = Math.sin(bearing) * Math.sin(angularDist) * Math.cos(lat1);
  const x = Math.cos(angularDist) - Math.sin(lat1) * sinLat2;
  const lng2 = lng1 + Math.atan2(y, x);

  return {
    latitude: toDeg(lat2),
    // Normalize to [-180, 180]
    longitude: ((toDeg(lng2) + 540) % 360) - 180,
  };
}

// Bearing from a to b in compass degrees [0, 360).
export function bearingBetween(a: LatLng, b: LatLng): number {
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

export function distanceYards(a: LatLng, b: LatLng): number {
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  const meters = 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(h));
  return meters * YARDS_PER_METER;
}
