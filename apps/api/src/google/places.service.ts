import { Injectable, Logger } from '@nestjs/common';
import { Point } from './geo.util';
import { googleErrorDetail } from './geocoding.service';
import { mockPlacesNear } from './mock-data';

export interface PlaceCandidate {
  placeId: string;
  name: string;
  category: string;
  rating?: number;
  reviewCount?: number;
  priceLevel?: number;
  location: Point;
}

interface SearchTextResponse {
  places?: Array<{
    id?: string;
    displayName?: { text?: string };
    rating?: number;
    userRatingCount?: number;
    priceLevel?: string;
    location?: { latitude?: number; longitude?: number };
    types?: string[];
  }>;
  error?: { message?: string };
}

const PRICE_LEVEL_MAP: Record<string, number> = {
  PRICE_LEVEL_FREE: 0,
  PRICE_LEVEL_INEXPENSIVE: 1,
  PRICE_LEVEL_MODERATE: 2,
  PRICE_LEVEL_EXPENSIVE: 3,
  PRICE_LEVEL_VERY_EXPENSIVE: 4,
};

/**
 * Place search via Places API (New) — the replacement for the legacy Places API,
 * which new Google Cloud projects can no longer enable.
 */
@Injectable()
export class PlacesService {
  private readonly logger = new Logger(PlacesService.name);
  private readonly apiKey = process.env.GOOGLE_MAPS_API_KEY;

  get isLive(): boolean {
    return Boolean(this.apiKey);
  }

  /** Search places near a point by free-text keyword (e.g. "pet-friendly cafe"). */
  async searchNear(
    point: Point,
    keyword: string,
    radiusM: number,
    sampleIndex = 0,
  ): Promise<PlaceCandidate[]> {
    if (!this.apiKey) {
      return mockPlacesNear(point, keyword, sampleIndex);
    }
    try {
      const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': this.apiKey,
          'X-Goog-FieldMask':
            'places.id,places.displayName,places.rating,places.userRatingCount,places.priceLevel,places.location,places.types',
        },
        body: JSON.stringify({
          textQuery: keyword,
          locationBias: {
            circle: {
              center: { latitude: point.lat, longitude: point.lng },
              radius: Math.min(radiusM, 50_000),
            },
          },
          maxResultCount: 8,
        }),
        signal: AbortSignal.timeout(10_000),
      });
      const data = (await res.json()) as SearchTextResponse;
      if (!res.ok) {
        throw new Error(`${res.status} ${data.error?.message ?? 'Places API error'}`);
      }
      return (data.places ?? []).slice(0, 8).map((p, i) => ({
        placeId: p.id ?? `unknown-${sampleIndex}-${i}`,
        name: p.displayName?.text ?? 'Unknown place',
        category: inferCategory(keyword, p.types ?? []),
        rating: p.rating,
        reviewCount: p.userRatingCount,
        priceLevel: p.priceLevel ? PRICE_LEVEL_MAP[p.priceLevel] : undefined,
        location: {
          lat: p.location?.latitude ?? point.lat,
          lng: p.location?.longitude ?? point.lng,
        },
      }));
    } catch (err) {
      this.logger.warn(`Places search failed: ${googleErrorDetail(err)} — using mock places`);
      return mockPlacesNear(point, keyword, sampleIndex);
    }
  }
}

function inferCategory(keyword: string, types: string[]): string {
  const k = keyword.toLowerCase();
  if (types.includes('cafe') || types.includes('coffee_shop') || /cafe|coffee/.test(k)) return 'cafe';
  if (types.includes('lodging') || types.includes('hotel') || /hotel|stay|resort/.test(k)) return 'hotel';
  if (types.includes('restaurant') || /restaurant|dhaba|food|lunch|dinner/.test(k))
    return 'restaurant';
  if (/waterfall|falls/.test(k)) return 'waterfall';
  if (types.includes('tourist_attraction') || types.includes('historical_landmark')) return 'sight';
  return 'other';
}
