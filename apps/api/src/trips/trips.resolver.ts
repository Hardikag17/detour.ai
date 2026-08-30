import { Args, Field, ID, Int, Float, ObjectType, Query, Resolver, Mutation } from '@nestjs/graphql';
import { LatLng, StopEvent, WhyReason } from '../graphql/types/plan.types';
import { make } from '../util/make';
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

  @Field({ nullable: true, description: 'Encoded route polyline (null on trips saved before it was stored)' })
  polyline?: string;

  @Field(() => [StopEvent])
  stops!: StopEvent[];

  @Field({defaultValue: false})
  isShareable!: boolean

  @Field()
  createdAt!: string;
}

function toSavedTrip(t: TripEntity): SavedTrip {
  return make(SavedTrip, {
    ...t,
    summary: t.summary ?? undefined,
    polyline: t.polyline ?? undefined,
    createdAt: t.createdAt.toISOString(),
    stops: [...t.stops]
      .sort((a, b) => a.position - b.position)
      .map((s) =>
        make(StopEvent, {
          ...s,
          rating: s.rating ?? undefined,
          reviewCount: s.reviewCount ?? undefined,
          legLabel: s.legLabel ?? undefined,
          location: make(LatLng, { lat: s.lat, lng: s.lng }),
          why: s.reasons.map((r) => make(WhyReason, r)),
        }),
      ),
  });
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

  @Mutation(()=>Boolean, {description: 'Give trip shareable access'})
  async shareTrip(
    @Args('id', {type: ()=> ID}) tripId: string)
    : Promise<boolean> {
    return await this.trips.shareTrip(tripId);
  }
}
