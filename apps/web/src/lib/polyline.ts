export interface Pt {
  lat: number;
  lng: number;
}

/** Decode a Google encoded polyline (no dependency needed client-side). */
export function decodePolyline(encoded: string): Pt[] {
  const points: Pt[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;
  while (index < encoded.length) {
    for (const which of [0, 1] as const) {
      let result = 0;
      let shift = 0;
      let byte: number;
      do {
        byte = encoded.charCodeAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);
      const delta = result & 1 ? ~(result >> 1) : result >> 1;
      if (which === 0) lat += delta;
      else lng += delta;
    }
    points.push({ lat: lat / 1e5, lng: lng / 1e5 });
  }
  return points;
}

export interface Projector {
  x: (p: Pt) => number;
  y: (p: Pt) => number;
}

/** Fit a set of lat/lng points into an SVG viewBox with padding. */
export function makeProjector(points: Pt[], width: number, height: number, pad = 40): Projector {
  const lats = points.map((p) => p.lat);
  const lngs = points.map((p) => p.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const spanLat = Math.max(maxLat - minLat, 1e-6);
  const spanLng = Math.max(maxLng - minLng, 1e-6);
  // Keep aspect ratio: use the larger normalized span.
  const scale = Math.min((width - pad * 2) / spanLng, (height - pad * 2) / spanLat);
  const cx = (minLng + maxLng) / 2;
  const cy = (minLat + maxLat) / 2;
  return {
    x: (p) => width / 2 + (p.lng - cx) * scale,
    y: (p) => height / 2 - (p.lat - cy) * scale,
  };
}
