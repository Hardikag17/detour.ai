/** Internal type. DO NOT USE DIRECTLY. */
type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
/** Internal type. DO NOT USE DIRECTLY. */
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
export type PlanTripInput = {
  /** Detour tolerance in km; we search out to 2x this */
  detourKm: number;
  /** Set when refining an existing plan */
  planId?: string | number | null | undefined;
  prompt: string;
  sessionId?: string | number | null | undefined;
};

export type PlanTripSubscriptionVariables = Exact<{
  input: PlanTripInput;
}>;


export type PlanTripSubscription = { planTrip:
    | { __typename: 'PlanErrorEvent', message: string, code: string | null }
    | { __typename: 'PlanSummaryEvent', planId: string, summary: string, stopCount: number }
    | { __typename: 'RouteEvent', polyline: string, originName: string, destinationName: string, distanceKm: number, durationMin: number, origin: { lat: number, lng: number }, destination: { lat: number, lng: number } }
    | { __typename: 'StepEvent', id: string, label: string, status: string }
    | { __typename: 'StopEvent', id: string, placeId: string, name: string, category: string, rating: number | null, reviewCount: number | null, priceLevel: number | null, detourKm: number, detourMin: number | null, tier: string, legLabel: string | null, location: { lat: number, lng: number }, why: Array<{ icon: string, text: string }> }
   };

export type RecentTripsQueryVariables = Exact<{
  limit?: number | null | undefined;
}>;


export type RecentTripsQuery = { recentTrips: Array<{ id: string, prompt: string, originName: string, destinationName: string, distanceKm: number, polyline: string | null, isShareable: boolean, stops: Array<{ id: string }> }> };

export type SavedTripQueryVariables = Exact<{
  id: string | number;
}>;


export type SavedTripQuery = { trip: { id: string, prompt: string, originName: string, destinationName: string, distanceKm: number, durationMin: number, summary: string | null, polyline: string | null, isShareable: boolean, stops: Array<{ id: string, placeId: string, name: string, category: string, rating: number | null, reviewCount: number | null, priceLevel: number | null, detourKm: number, detourMin: number | null, tier: string, legLabel: string | null, location: { lat: number, lng: number }, why: Array<{ icon: string, text: string }> }> } | null };

export type ShareTripMutationVariables = Exact<{
  id: string | number;
}>;


export type ShareTripMutation = { shareTrip: boolean };
