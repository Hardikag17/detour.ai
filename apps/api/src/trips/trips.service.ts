import { Injectable, Logger, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  PlanSummaryEvent,
  PlanTripInput,
  RouteEvent,
  StopEvent,
} from '../graphql/types/plan.types';
import { make } from '../util/make';
import { StopEntity, TripEntity } from './trip.entity';

/**
 * Persists completed plans. The repository is optional — when DATABASE_URL is
 * unset the module isn't registered and callers receive undefined via
 * @Optional() injection, so persistence silently no-ops.
 */
@Injectable()
export class TripsService {
  private readonly logger = new Logger(TripsService.name);

  constructor(
    @Optional() @InjectRepository(TripEntity) private readonly trips?: Repository<TripEntity>,
  ) {}

  get enabled(): boolean {
    return Boolean(this.trips);
  }

  async savePlan(
    planId: string,
    input: PlanTripInput,
    route: RouteEvent,
    stops: StopEvent[],
    summary?: PlanSummaryEvent,
  ): Promise<void> {
    if (!this.trips) return;
    try {
      const trip = this.trips.create({
        id: planId,
        prompt: input.prompt,
        detourKm: input.detourKm,
        originName: route.originName,
        destinationName: route.destinationName,
        distanceKm: route.distanceKm,
        durationMin: route.durationMin,
        summary: summary?.summary ?? null,
        polyline: route.polyline ?? null,
        // Entity ids are DB-generated; the event's synthetic id must not leak in.
        stops: stops.map(({ id: _id, ...s }, i) =>
          make(StopEntity, {
            ...s,
            position: i,
            rating: s.rating ?? null,
            reviewCount: s.reviewCount ?? null,
            legLabel: s.legLabel ?? null,
            reasons: s.why.map((w) => ({ icon: w.icon, text: w.text })),
            lat: s.location.lat,
            lng: s.location.lng,
          }),
        ),
      });
      // Refinements re-save under the same planId: replace stops wholesale.
      await this.trips.manager.transaction(async (em) => {
        await em.delete(StopEntity, { trip: { id: planId } });
        await em.save(trip);
      });
      this.logger.log(`Saved trip ${planId} (${stops.length} stops)`);
    } catch (err) {
      this.logger.warn(`Failed to save trip: ${(err as Error).message}`);
    }
  }

  async recentTrips(limit: number): Promise<TripEntity[]> {
    if (!this.trips) return [];
    return this.trips.find({
      order: { createdAt: 'DESC' },
      take: Math.min(limit, 25),
    });
  }

  async trip(id: string): Promise<TripEntity | null> {
    if (!this.trips) return null;
    return this.trips.findOne({ where: { id } });
  }
}
