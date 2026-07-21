import { Injectable, Logger } from '@nestjs/common';
import { Client } from '@googlemaps/google-maps-services-js';
import { Point } from './geo.util';
import { mockGeocode } from './mock-data';

export interface GeocodeResult {
  name: string;
  point: Point;
}

@Injectable()
export class GeocodingService {
  private readonly logger = new Logger(GeocodingService.name);
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
      const res = await this.client.geocode({
        params: { address: query, key: this.apiKey },
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
    } catch (err) {
      this.logger.warn(`Geocode failed for "${query}": ${(err as Error).message}`);
      return mockGeocode(query);
    }
  }
}
