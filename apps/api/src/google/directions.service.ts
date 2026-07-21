import { Injectable, Logger } from '@nestjs/common';
import { Client, TravelMode, TravelRestriction } from '@googlemaps/google-maps-services-js';
import { Point } from './geo.util';
import { mockRoute } from './mock-data';

export interface RouteResult {
  polyline: string;
  distanceKm: number;
  durationMin: number;
}

@Injectable()
export class DirectionsService {
  private readonly logger = new Logger(DirectionsService.name);
  private readonly client = new Client({});
  private readonly apiKey = process.env.GOOGLE_MAPS_API_KEY;

  get isLive(): boolean {
    return Boolean(this.apiKey);
  }

  async route(
    origin: Point,
    destination: Point,
    opts: { avoidTolls?: boolean } = {},
  ): Promise<RouteResult> {
    if (!this.apiKey) {
      return mockRoute(origin, destination);
    }
    try {
      const res = await this.client.directions({
        params: {
          origin: `${origin.lat},${origin.lng}`,
          destination: `${destination.lat},${destination.lng}`,
          mode: TravelMode.driving,
          ...(opts.avoidTolls ? { avoid: [TravelRestriction.tolls] } : {}),
          key: this.apiKey,
        },
      });
      const route = res.data.routes[0];
      if (!route) return mockRoute(origin, destination);
      const leg = route.legs[0];
      return {
        polyline: route.overview_polyline.points,
        distanceKm: Math.round((leg?.distance?.value ?? 0) / 1000),
        durationMin: Math.round((leg?.duration?.value ?? 0) / 60),
      };
    } catch (err) {
      this.logger.warn(`Directions failed: ${(err as Error).message} — using mock route`);
      return mockRoute(origin, destination);
    }
  }
}
