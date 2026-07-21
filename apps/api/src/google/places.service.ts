import { Injectable, Logger } from '@nestjs/common';
import { Client } from '@googlemaps/google-maps-services-js';
import { Point } from './geo.util';
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

@Injectable()
export class PlacesService {
  private readonly logger = new Logger(PlacesService.name);
  private readonly client = new Client({});
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
      const res = await this.client.placesNearby({
        params: {
          location: `${point.lat},${point.lng}`,
          radius: radiusM,
          keyword,
          key: this.apiKey,
        },
      });
      return (res.data.results ?? []).slice(0, 6).map((p) => ({
        placeId: p.place_id ?? `unknown-${p.name}`,
        name: p.name ?? 'Unknown place',
        category: inferCategory(keyword, p.types ?? []),
        rating: p.rating,
        reviewCount: p.user_ratings_total,
        priceLevel: p.price_level,
        location: {
          lat: p.geometry?.location.lat ?? point.lat,
          lng: p.geometry?.location.lng ?? point.lng,
        },
      }));
    } catch (err) {
      this.logger.warn(`Places search failed: ${(err as Error).message} — using mock places`);
      return mockPlacesNear(point, keyword, sampleIndex);
    }
  }
}

function inferCategory(keyword: string, types: string[]): string {
  const k = keyword.toLowerCase();
  if (types.includes('cafe') || /cafe|coffee/.test(k)) return 'cafe';
  if (types.includes('lodging') || /hotel|stay|resort/.test(k)) return 'hotel';
  if (types.includes('restaurant') || /restaurant|dhaba|food|lunch|dinner/.test(k))
    return 'restaurant';
  if (/waterfall|falls/.test(k)) return 'waterfall';
  if (types.includes('tourist_attraction')) return 'sight';
  return 'other';
}
