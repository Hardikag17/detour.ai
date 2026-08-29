import { Injectable, Logger } from '@nestjs/common';
import { Client } from '@googlemaps/google-maps-services-js';
import { CACHE_TTL_S } from '../config';
import { RedisCacheService } from '../cache/redis-cache.service';
import { Point } from './geo.util';
import { googleErrorDetail } from './google-fetch';
import { mockGeocode } from './mock-data';

export interface GeocodeResult {
  name: string;
  point: Point;
}

@Injectable()
export class GeocodingService {
  private readonly logger = new Logger(GeocodingService.name);

  constructor(private readonly cache: RedisCacheService) {}
  private readonly client = new Client({});
  private readonly apiKey = process.env.GOOGLE_MAPS_API_KEY;

  get isLive(): boolean {
    return Boolean(this.apiKey);
  }

  async geocode(query: string): Promise<GeocodeResult | null> {
    if (!this.apiKey) {
      return mockGeocode(query);
    }
    try {
      // Geocodes are effectively immutable — cache for 30 days.
      return await this.cache.wrap(
        `geo:${query.trim().toLowerCase()}`,
        CACHE_TTL_S.GEOCODE,
        async () => {
          const res = await this.client.geocode({
            params: { address: query, key: this.apiKey! },
          });
          const first = res.data.results[0];
          if (!first) return null;
          return {
            name: first.formatted_address,
            point: {
              lat: first.geometry.location.lat,
              lng: first.geometry.location.lng,
            },
          };
        },
      );
    } catch (err) {
      this.logger.warn(`Geocode failed for "${query}": ${googleErrorDetail(err)}`);
      return mockGeocode(query);
    }
  }
}
