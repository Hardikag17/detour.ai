import { Args, ID, Query, Resolver } from '@nestjs/graphql';
import { GeocodingService } from '../google/geocoding.service';
import { PlaceDetails, PlaceSuggestion } from './types/places.types';

@Resolver()
export class PlacesResolver {
  constructor(private readonly geocoding: GeocodingService) {}

  @Query(() => [PlaceSuggestion])
  async autocomplete(@Args('input') input: string): Promise<PlaceSuggestion[]> {
    const result = await this.geocoding.geocode(input);
    if (!result) return [];
    return [
      { placeId: `geo-${input.toLowerCase().replace(/\s+/g, '-')}`, description: result.name },
    ];
  }

  @Query(() => PlaceDetails, { nullable: true })
  async placeDetails(
    @Args('placeId', { type: () => ID }) placeId: string,
  ): Promise<PlaceDetails | null> {
    // Phase 3: real Place Details lookup with review signals.
    return null;
  }
}
