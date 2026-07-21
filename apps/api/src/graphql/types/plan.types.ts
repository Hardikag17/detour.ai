import { createUnionType, Field, Float, ID, InputType, Int, ObjectType } from '@nestjs/graphql';

@InputType()
export class PlanTripInput {
  @Field()
  prompt: string;

  @Field(() => Int, { description: 'Detour tolerance in km; we search out to 2x this' })
  detourKm: number;

  @Field(() => ID, { nullable: true })
  sessionId?: string;

  @Field(() => ID, { nullable: true, description: 'Set when refining an existing plan' })
  planId?: string;
}

@ObjectType()
export class LatLng {
  @Field(() => Float)
  lat: number;

  @Field(() => Float)
  lng: number;
}

@ObjectType()
export class StepEvent {
  @Field(() => ID)
  id: string;

  @Field({ description: 'Human-readable step, e.g. "Mapping your route…"' })
  label: string;

  @Field({ description: 'pending | active | done' })
  status: string;
}

@ObjectType()
export class RouteEvent {
  @Field()
  polyline: string;

  @Field(() => LatLng)
  origin: LatLng;

  @Field(() => LatLng)
  destination: LatLng;

  @Field()
  originName: string;

  @Field()
  destinationName: string;

  @Field(() => Float)
  distanceKm: number;

  @Field(() => Int)
  durationMin: number;
}

@ObjectType()
export class WhyReason {
  @Field({ description: 'Icon hint: paw | clock | detour | star | leaf | users | quote' })
  icon: string;

  @Field()
  text: string;
}

@ObjectType()
export class StopEvent {
  @Field(() => ID)
  id: string;

  @Field()
  placeId: string;

  @Field()
  name: string;

  @Field({ description: 'cafe | restaurant | hotel | sight | waterfall | fuel | other' })
  category: string;

  @Field(() => Float, { nullable: true })
  rating?: number;

  @Field(() => Int, { nullable: true })
  reviewCount?: number;

  @Field(() => Int, { nullable: true, description: 'Price level 1-4' })
  priceLevel?: number;

  @Field(() => LatLng)
  location: LatLng;

  @Field(() => Float)
  detourKm: number;

  @Field(() => Int, { nullable: true })
  detourMin?: number;

  @Field({ description: 'primary | stretch (between R and 2R)' })
  tier: string;

  @Field({ nullable: true, description: 'e.g. "Breakfast stop · ~1h 20m in"' })
  legLabel?: string;

  @Field(() => [WhyReason])
  why: WhyReason[];
}

@ObjectType()
export class StopUpdatedEvent {
  @Field(() => ID)
  id: string;

  @Field({ description: 'replaced | removed | kept' })
  change: string;

  @Field(() => StopEvent, { nullable: true })
  stop?: StopEvent;

  @Field({ nullable: true })
  reason?: string;
}

@ObjectType()
export class PlanSummaryEvent {
  @Field(() => ID)
  planId: string;

  @Field()
  summary: string;

  @Field(() => Int)
  stopCount: number;
}

@ObjectType()
export class PlanErrorEvent {
  @Field()
  message: string;

  @Field({ nullable: true })
  code?: string;
}

export const PlanEvent = createUnionType({
  name: 'PlanEvent',
  types: () =>
    [StepEvent, RouteEvent, StopEvent, StopUpdatedEvent, PlanSummaryEvent, PlanErrorEvent] as const,
  resolveType(value: Record<string, unknown>) {
    if ('label' in value) return StepEvent;
    if ('polyline' in value) return RouteEvent;
    if ('change' in value) return StopUpdatedEvent;
    if ('why' in value) return StopEvent;
    if ('summary' in value) return PlanSummaryEvent;
    if ('message' in value) return PlanErrorEvent;
    return null;
  },
});

export type PlanEventPayload =
  StepEvent | RouteEvent | StopEvent | StopUpdatedEvent | PlanSummaryEvent | PlanErrorEvent;
