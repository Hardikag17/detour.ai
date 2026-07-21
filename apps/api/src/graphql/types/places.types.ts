import { Field, Float, ID, Int, ObjectType } from '@nestjs/graphql';
import { LatLng } from './plan.types';

@ObjectType()
export class PlaceSuggestion {
  @Field(() => ID)
  placeId: string;

  @Field()
  description: string;
}

@ObjectType()
export class PlaceDetails {
  @Field(() => ID)
  placeId: string;

  @Field()
  name: string;

  @Field({ nullable: true })
  address?: string;

  @Field(() => Float, { nullable: true })
  rating?: number;

  @Field(() => Int, { nullable: true })
  reviewCount?: number;

  @Field(() => Int, { nullable: true })
  priceLevel?: number;

  @Field(() => LatLng, { nullable: true })
  location?: LatLng;

  @Field({ nullable: true })
  openNow?: boolean;
}
