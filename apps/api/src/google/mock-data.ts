import { encodePolyline, Point } from './geo.util';

/** Known city coordinates for offline/mock mode. */
export const MOCK_CITIES: Record<string, { name: string; point: Point }> = {
  bangalore: { name: 'Bengaluru, Karnataka', point: { lat: 12.9716, lng: 77.5946 } },
  bengaluru: { name: 'Bengaluru, Karnataka', point: { lat: 12.9716, lng: 77.5946 } },
  goa: { name: 'Goa', point: { lat: 15.2993, lng: 74.124 } },
  delhi: { name: 'Delhi', point: { lat: 28.7041, lng: 77.1025 } },
  jaipur: { name: 'Jaipur, Rajasthan', point: { lat: 26.9124, lng: 75.7873 } },
  mumbai: { name: 'Mumbai, Maharashtra', point: { lat: 19.076, lng: 72.8777 } },
  pune: { name: 'Pune, Maharashtra', point: { lat: 18.5204, lng: 73.8567 } },
  varkala: { name: 'Varkala, Kerala', point: { lat: 8.7379, lng: 76.7163 } },
  kochi: { name: 'Kochi, Kerala', point: { lat: 9.9312, lng: 76.2673 } },
  manali: { name: 'Manali, Himachal Pradesh', point: { lat: 32.2396, lng: 77.1887 } },
  chandigarh: { name: 'Chandigarh', point: { lat: 30.7333, lng: 76.7794 } },
  chennai: { name: 'Chennai, Tamil Nadu', point: { lat: 13.0827, lng: 80.2707 } },
  hyderabad: { name: 'Hyderabad, Telangana', point: { lat: 17.385, lng: 78.4867 } },
};

export function mockGeocode(query: string): { name: string; point: Point } | null {
  const q = query.toLowerCase();
  for (const key of Object.keys(MOCK_CITIES)) {
    if (q.includes(key)) return MOCK_CITIES[key];
  }
  return null;
}

/** Build a gently curved mock route between two points, encoded as a polyline. */
export function mockRoute(
  origin: Point,
  destination: Point,
): {
  polyline: string;
  distanceKm: number;
  durationMin: number;
} {
  const steps = 48;
  const points: Point[] = [];
  // Perpendicular bow so the route arcs like a real highway rather than a straight line.
  const dx = destination.lng - origin.lng;
  const dy = destination.lat - origin.lat;
  const bow = 0.18;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const arc = Math.sin(t * Math.PI) * bow;
    // Small deterministic wiggle so it reads as roads, not a bezier.
    const wiggle = Math.sin(t * Math.PI * 7) * 0.03 * Math.sin(t * Math.PI);
    points.push({
      lat: origin.lat + dy * t + -dx * (arc + wiggle) * 0.5,
      lng: origin.lng + dx * t + dy * (arc + wiggle) * 0.5,
    });
  }
  let distanceKm = 0;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    distanceKm += Math.hypot((b.lat - a.lat) * 111, (b.lng - a.lng) * 102);
  }
  distanceKm = Math.round(distanceKm * 1.15);
  return {
    polyline: encodePolyline(points),
    distanceKm,
    durationMin: Math.round((distanceKm / 55) * 60),
  };
}

interface MockPlaceTemplate {
  name: string;
  category: string;
  rating: number;
  reviewCount: number;
  priceLevel?: number;
}

const MOCK_PLACE_POOLS: Record<string, MockPlaceTemplate[]> = {
  cafe: [
    {
      name: 'Third Wave Roastery',
      category: 'cafe',
      rating: 4.7,
      reviewCount: 3210,
      priceLevel: 2,
    },
    { name: 'Highway Brew Co.', category: 'cafe', rating: 4.5, reviewCount: 1840, priceLevel: 2 },
    { name: 'The Filter House', category: 'cafe', rating: 4.6, reviewCount: 980, priceLevel: 1 },
    {
      name: 'Paws & Pour (pet-friendly)',
      category: 'cafe',
      rating: 4.8,
      reviewCount: 2150,
      priceLevel: 2,
    },
  ],
  restaurant: [
    {
      name: 'Green Leaf Dhaba',
      category: 'restaurant',
      rating: 4.8,
      reviewCount: 6200,
      priceLevel: 1,
    },
    {
      name: 'Rawat Mishthan Bhandar',
      category: 'restaurant',
      rating: 4.5,
      reviewCount: 5100,
      priceLevel: 1,
    },
    {
      name: 'Behror Midway',
      category: 'restaurant',
      rating: 4.2,
      reviewCount: 2400,
      priceLevel: 2,
    },
    {
      name: 'Annapurna Veg Thali',
      category: 'restaurant',
      rating: 4.6,
      reviewCount: 1900,
      priceLevel: 1,
    },
  ],
  hotel: [
    { name: 'Palm Grove Stay', category: 'hotel', rating: 4.4, reviewCount: 1320, priceLevel: 2 },
    {
      name: 'Sunset Dunes Resort',
      category: 'hotel',
      rating: 4.6,
      reviewCount: 890,
      priceLevel: 2,
    },
    { name: 'Highway Rest Inn', category: 'hotel', rating: 4.1, reviewCount: 640, priceLevel: 1 },
  ],
  waterfall: [
    { name: 'Hidden Falls side-trail', category: 'waterfall', rating: 4.6, reviewCount: 320 },
    { name: 'Dudhsagar Falls', category: 'waterfall', rating: 4.7, reviewCount: 18400 },
    { name: 'Sathodi Falls', category: 'waterfall', rating: 4.5, reviewCount: 2100 },
  ],
  sight: [
    { name: 'Neelkanth Fort', category: 'sight', rating: 4.7, reviewCount: 4100 },
    { name: 'Riverside Viewpoint', category: 'sight', rating: 4.5, reviewCount: 760 },
    { name: 'Old Temple Complex', category: 'sight', rating: 4.6, reviewCount: 2900 },
  ],
};

export function mockPlacesNear(
  point: Point,
  keyword: string,
  index: number,
): Array<MockPlaceTemplate & { placeId: string; location: Point }> {
  const k = keyword.toLowerCase();
  let pool = MOCK_PLACE_POOLS.sight;
  if (/(cafe|coffee|breakfast)/.test(k)) pool = MOCK_PLACE_POOLS.cafe;
  else if (/(restaurant|dhaba|lunch|dinner|thali|food|veg)/.test(k))
    pool = MOCK_PLACE_POOLS.restaurant;
  else if (/(hotel|stay|resort|lodge)/.test(k)) pool = MOCK_PLACE_POOLS.hotel;
  else if (/(waterfall|falls)/.test(k)) pool = MOCK_PLACE_POOLS.waterfall;

  // Deterministic pseudo-random offsets so mock results are stable per sample point.
  return pool.slice(0, 3).map((tpl, i) => {
    const angle = ((index * 7 + i * 13) % 12) * (Math.PI / 6);
    const distKm = 1.5 + ((index * 5 + i * 3) % 8);
    return {
      ...tpl,
      placeId: `mock-${tpl.name.toLowerCase().replace(/[^a-z]+/g, '-')}-${index}-${i}`,
      location: {
        lat: point.lat + (distKm / 111) * Math.sin(angle),
        lng: point.lng + (distKm / 102) * Math.cos(angle),
      },
    };
  });
}
