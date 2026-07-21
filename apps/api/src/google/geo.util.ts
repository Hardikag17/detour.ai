import polyline from '@mapbox/polyline';

export interface Point {
  lat: number;
  lng: number;
}

const EARTH_RADIUS_KM = 6371;

export function haversineKm(a: Point, b: Point): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h = sinLat * sinLat + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinLng * sinLng;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function decodePolyline(encoded: string): Point[] {
  return polyline.decode(encoded).map(([lat, lng]) => ({ lat, lng }));
}

export function encodePolyline(points: Point[]): string {
  return polyline.encode(points.map((p) => [p.lat, p.lng]));
}

/** Sample points along a path roughly every `stepKm`, always including both endpoints. */
export function samplePath(points: Point[], stepKm: number, maxSamples = 10): Point[] {
  if (points.length <= 2) return points;
  const samples: Point[] = [points[0]];
  let sinceLast = 0;
  for (let i = 1; i < points.length; i++) {
    sinceLast += haversineKm(points[i - 1], points[i]);
    if (sinceLast >= stepKm) {
      samples.push(points[i]);
      sinceLast = 0;
      if (samples.length >= maxSamples - 1) break;
    }
  }
  samples.push(points[points.length - 1]);
  return samples;
}

/** Minimum distance (km) from a point to the route path (approx: nearest vertex on a densified path). */
export function distanceToPathKm(point: Point, path: Point[]): number {
  let min = Infinity;
  for (const p of path) {
    const d = haversineKm(point, p);
    if (d < min) min = d;
  }
  return min;
}

export function pathLengthKm(points: Point[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i++) total += haversineKm(points[i - 1], points[i]);
  return total;
}

/** Fraction (0..1) along the path where the nearest vertex to `point` sits. */
export function fractionAlongPath(point: Point, path: Point[]): number {
  let minD = Infinity;
  let minIdx = 0;
  for (let i = 0; i < path.length; i++) {
    const d = haversineKm(point, path[i]);
    if (d < minD) {
      minD = d;
      minIdx = i;
    }
  }
  let upTo = 0;
  let total = 0;
  for (let i = 1; i < path.length; i++) {
    const seg = haversineKm(path[i - 1], path[i]);
    total += seg;
    if (i <= minIdx) upTo += seg;
  }
  return total === 0 ? 0 : upTo / total;
}
