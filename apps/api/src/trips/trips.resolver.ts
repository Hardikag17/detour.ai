import { Args, Field, ID, Int, Float, ObjectType, Query, Resolver } from '@nestjs/graphql';
import { LatLng, StopEvent, WhyReason } from '../graphql/types/plan.types';
import { TripEntity } from './trip.entity';
import { TripsService } from './trips.service';

@ObjectType()
export class SavedTrip {
  @Field(() => ID)
  id!: string;

  @Field()
  prompt!: string;

  @Field(() => Float)
  detourKm!: number;

  @Field()
  originName!: string;

  @Field()
  destinationName!: string;

  @Field(() => Int)
  distanceKm!: number;

  @Field(() => Int)
  durationMin!: number;

  @Field({ nullable: true })
  summary?: string;

  @Field(() => [StopEvent])
  stops!: StopEvent[];

  @Field()
  createdAt!: string;
}

function toSavedTrip(t: TripEntity): SavedTrip {
  const saved = new SavedTrip();
  saved.id = t.id;
  saved.prompt = t.prompt;
  saved.detourKm = t.detourKm;
  saved.originName = t.originName;
  saved.destinationName = t.destinationName;
  saved.distanceKm = t.distanceKm;
  saved.durationMin = t.durationMin;
  saved.summary = t.summary ?? undefined;
  saved.createdAt = t.createdAt.toISOString();
  saved.stops = [...t.stops]
    .sort((a, b) => a.position - b.position)
    .map((s) => {
      const stop = new StopEvent();
      stop.id = s.id;
      stop.placeId = s.placeId;
      stop.name = s.name;
      stop.category = s.category;
      stop.rating = s.rating ?? undefined;
      stop.reviewCount = s.reviewCount ?? undefined;
      stop.detourKm = s.detourKm;
      stop.tier = s.tier;
      stop.legLabel = s.legLabel ?? undefined;
      stop.location = Object.assign(new LatLng(), { lat: s.lat, lng: s.lng });
      stop.why = s.reasons.map((r) => Object.assign(new WhyReason(), r));
      return stop;
    });
  return saved;
}

@Resolver()
export class TripsResolver {
  constructor(private readonly trips: TripsService) {}

  @Query(() => [SavedTrip], { description: 'Most recently planned trips' })
  async recentTrips(
    @Args('limit', { type: () => Int, nullable: true, defaultValue: 6 }) limit: number,
  ): Promise<SavedTrip[]> {
    const rows = await this.trips.recentTrips(limit);
    return rows.map(toSavedTrip);
  }

  @Query(() => SavedTrip, { nullable: true })
  async trip(@Args('id', { type: () => ID }) id: string): Promise<SavedTrip | null> {
    const row = await this.trips.trip(id);
    return row ? toSavedTrip(row) : null;
  }
}
