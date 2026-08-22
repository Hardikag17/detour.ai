import { Injectable, Logger } from '@nestjs/common';
import { RedisCacheService } from '../cache/redis-cache.service';
import { Point } from './geo.util';
import { googleErrorDetail } from './geocoding.service';
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
  error?: { message?: string };
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
    const cacheKey = `route:${origin.lat.toFixed(4)},${origin.lng.toFixed(4)}:${destination.lat.toFixed(4)},${destination.lng.toFixed(4)}:${opts.avoidTolls ? 'nt' : 't'}`;
    const cached = await this.cache.get<RouteResult>(cacheKey);
    if (cached) return cached;
    try {
      const res = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': this.apiKey,
          'X-Goog-FieldMask':
            'routes.distanceMeters,routes.duration,routes.polyline.encodedPolyline',
        },
        body: JSON.stringify({
          origin: { location: { latLng: { latitude: origin.lat, longitude: origin.lng } } },
          destination: {
            location: { latLng: { latitude: destination.lat, longitude: destination.lng } },
          },
          travelMode: 'DRIVE',
          ...(opts.avoidTolls ? { routeModifiers: { avoidTolls: true } } : {}),
        }),
        signal: AbortSignal.timeout(10_000),
      });
      const data = (await res.json()) as ComputeRoutesResponse;
      if (!res.ok) {
        throw new Error(`${res.status} ${data.error?.message ?? 'Routes API error'}`);
      }
      const route = data.routes?.[0];
      const polyline = route?.polyline?.encodedPolyline;
      if (!route || !polyline) return mockRoute(origin, destination);
      const durationSec = Number.parseInt(route.duration ?? '0', 10);
      const result: RouteResult = {
        polyline,
        distanceKm: Math.round((route.distanceMeters ?? 0) / 1000),
        durationMin: Math.round(durationSec / 60),
      };
      await this.cache.set(cacheKey, result, 24 * 3600); // traffic-free routes are stable for a day
      return result;
    } catch (err) {
      this.logger.warn(`Routes API failed: ${googleErrorDetail(err)} — using mock route`);
      return mockRoute(origin, destination);
    }
  }
}
