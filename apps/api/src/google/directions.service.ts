import { Injectable, Logger } from '@nestjs/common';
import { CACHE_TTL_S } from '../config';
import { RedisCacheService } from '../cache/redis-cache.service';
import { Point } from './geo.util';
import { googleErrorDetail, googleFetch } from './google-fetch';
import { mockRoute } from './mock-data';

export interface RouteResult {
  polyline: string;
  distanceKm: number;
  durationMin: number;
}

interface ComputeRoutesResponse {
  routes?: Array<{
    distanceMeters?: number;
    duration?: string;
    polyline?: { encodedPolyline?: string };
  }>;
}

/**
 * Driving routes via the Routes API (the modern replacement for the legacy
 * Directions API, which new Google Cloud projects can no longer enable).
 */
@Injectable()
export class DirectionsService {
  private readonly logger = new Logger(DirectionsService.name);
  private readonly apiKey = process.env.GOOGLE_MAPS_API_KEY;

  constructor(private readonly cache: RedisCacheService) {}

  async route(
    origin: Point,
    destination: Point,
    opts: { avoidTolls?: boolean } = {},
  ): Promise<RouteResult> {
    if (!this.apiKey) return mockRoute(origin, destination);

    const key = `route:${pt(origin)}:${pt(destination)}:${opts.avoidTolls ? 'nt' : 't'}`;
    try {
      return await this.cache.wrap(key, CACHE_TTL_S.ROUTE, async () => {
        const data = await googleFetch<ComputeRoutesResponse>(
          'https://routes.googleapis.com/directions/v2:computeRoutes',
          this.apiKey!,
          'routes.distanceMeters,routes.duration,routes.polyline.encodedPolyline',
          {
            origin: latLng(origin),
            destination: latLng(destination),
            travelMode: 'DRIVE',
            ...(opts.avoidTolls ? { routeModifiers: { avoidTolls: true } } : {}),
          },
        );
        const route = data.routes?.[0];
        if (!route?.polyline?.encodedPolyline) return mockRoute(origin, destination);
        return {
          polyline: route.polyline.encodedPolyline,
          distanceKm: Math.round((route.distanceMeters ?? 0) / 1000),
          durationMin: Math.round(Number.parseInt(route.duration ?? '0', 10) / 60),
        };
      });
    } catch (err) {
      this.logger.warn(`Routes API failed: ${googleErrorDetail(err)} — using mock route`);
      return mockRoute(origin, destination);
    }
  }
}

const pt = (p: Point) => `${p.lat.toFixed(4)},${p.lng.toFixed(4)}`;
const latLng = (p: Point) => ({ location: { latLng: { latitude: p.lat, longitude: p.lng } } });
