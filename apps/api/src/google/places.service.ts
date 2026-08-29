import { Injectable, Logger } from '@nestjs/common';
import { CACHE_TTL_S, PLACES } from '../config';
import { RedisCacheService } from '../cache/redis-cache.service';
import { Point } from './geo.util';
import { googleErrorDetail, googleFetch } from './google-fetch';
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
}

const PRICE_LEVELS: Record<string, number> = {
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

  constructor(private readonly cache: RedisCacheService) {}

  /** Search places near a point by free-text keyword (e.g. "pet-friendly cafe"). */
  async searchNear(
    point: Point,
    keyword: string,
    radiusM: number,
    sampleIndex = 0,
  ): Promise<PlaceCandidate[]> {
    if (!this.apiKey) return mockPlacesNear(point, keyword, sampleIndex);

    // ~110m grid rounding keeps nearby sample points from fragmenting the cache.
    const key = `places:${point.lat.toFixed(3)},${point.lng.toFixed(3)}:${Math.round(radiusM / 1000)}km:${keyword.trim().toLowerCase()}`;
    try {
      return await this.cache.wrap(key, CACHE_TTL_S.PLACES, async () => {
        const data = await googleFetch<SearchTextResponse>(
          'https://places.googleapis.com/v1/places:searchText',
          this.apiKey!,
          'places.id,places.displayName,places.rating,places.userRatingCount,places.priceLevel,places.location,places.types',
          {
            textQuery: keyword,
            locationBias: {
              circle: {
                center: { latitude: point.lat, longitude: point.lng },
                radius: Math.min(radiusM, PLACES.RADIUS_CAP_M),
              },
            },
            maxResultCount: PLACES.MAX_RESULTS,
          },
        );
        return (data.places ?? []).slice(0, PLACES.MAX_RESULTS).map((p, i) => ({
          placeId: p.id ?? `unknown-${sampleIndex}-${i}`,
          name: p.displayName?.text ?? 'Unknown place',
          category: inferCategory(keyword, p.types ?? []),
          rating: p.rating,
          reviewCount: p.userRatingCount,
          priceLevel: p.priceLevel ? PRICE_LEVELS[p.priceLevel] : undefined,
          location: {
            lat: p.location?.latitude ?? point.lat,
            lng: p.location?.longitude ?? point.lng,
          },
        }));
      });
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
