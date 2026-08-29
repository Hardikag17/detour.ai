/**
 * Typed mirror of the API's GraphQL PlanEvent union.
 * (GraphQL Codegen replaces this with generated types in a later phase;
 * the shape is kept 1:1 with apps/api/src/graphql/types/plan.types.ts.)
 */

export interface LatLng {
  lat: number;
  lng: number;
}

export interface StepEvent {
  __typename: 'StepEvent';
  id: string;
  label: string;
  status: 'pending' | 'active' | 'done';
}

export interface RouteEvent {
  __typename: 'RouteEvent';
  polyline: string;
  origin: LatLng;
  destination: LatLng;
  originName: string;
  destinationName: string;
  distanceKm: number;
  durationMin: number;
}

export type WhyIcon = 'detour' | 'star' | 'clock' | 'paw' | 'leaf' | 'users' | 'quote';

export interface WhyReason {
  icon: WhyIcon;
  text: string;
}

export interface StopEvent {
  __typename: 'StopEvent';
  id: string;
  placeId: string;
  name: string;
  category: 'cafe' | 'restaurant' | 'hotel' | 'sight' | 'waterfall' | 'fuel' | 'other' | string;
  rating?: number | null;
  reviewCount?: number | null;
  priceLevel?: number | null;
  location: LatLng;
  detourKm: number;
  detourMin?: number | null;
  tier: 'primary' | 'stretch' | string;
  legLabel?: string | null;
  why: WhyReason[];
}

export interface PlanSummaryEvent {
  __typename: 'PlanSummaryEvent';
  planId: string;
  summary: string;
  stopCount: number;
}

export interface PlanErrorEvent {
  __typename: 'PlanErrorEvent';
  message: string;
  code?: string | null;
}

export type PlanEvent =
  StepEvent | RouteEvent | StopEvent | PlanSummaryEvent | PlanErrorEvent;

export interface PlanTripInput {
  prompt: string;
  detourKm: number;
  sessionId?: string;
  planId?: string;
}
