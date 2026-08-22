import { Injectable, Logger, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  PlanSummaryEvent,
  PlanTripInput,
  RouteEvent,
  StopEvent,
} from '../graphql/types/plan.types';
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
        stops: stops.map((s, i) => {
          const stop = new StopEntity();
          stop.position = i;
          stop.placeId = s.placeId;
          stop.name = s.name;
          stop.category = s.category;
          stop.rating = s.rating ?? null;
          stop.reviewCount = s.reviewCount ?? null;
          stop.detourKm = s.detourKm;
          stop.tier = s.tier;
          stop.legLabel = s.legLabel ?? null;
          stop.reasons = s.why.map((w) => ({ icon: w.icon, text: w.text }));
          stop.lat = s.location.lat;
          stop.lng = s.location.lng;
          return stop;
        }),
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
