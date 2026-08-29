import type { PlanEvent } from '../types';

/** A "Try" suggestion chip: label shown, prompt submitted, icon by name. */
export interface TripRecommendation {
  icon: string;
  label: string;
  prompt: string;
}

/** Lifecycle of a plan on the client. */
export type PlanStatus = 'idle' | 'streaming' | 'ready' | 'error';

/** One SSE frame of the planTrip subscription. */
export interface PlanFrame {
  data?: { planTrip?: PlanEvent };
  errors?: Array<{ message?: string }>;
}

/** Shape consumed by the Recent-trips chips (subset of the SavedTrip GraphQL type). */
export interface RecentTrip {
  id: string;
  prompt: string;
  originName: string;
  destinationName: string;
  distanceKm: number;
  polyline?: string | null;
  stops: { id: string }[];
}

/** Full saved plan as returned by the trip(id) query — enough to rebuild the results view. */
export interface SavedTripDetail {
  id: string;
  prompt: string;
  originName: string;
  destinationName: string;
  distanceKm: number;
  durationMin: number;
  summary?: string | null;
  polyline?: string | null;
  stops: Array<Omit<import('../types').StopEvent, '__typename'>>;
}
