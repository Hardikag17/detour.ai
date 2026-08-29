import { create } from 'zustand';
import type { PlanEvent, PlanSummaryEvent, RouteEvent, StepEvent, StopEvent } from '@detour/shared';
import type { PlanStatus } from '@detour/shared/helpers/interfaces';
import type { SavedTripQuery } from '@detour/shared/generated/graphql';
import { decodePolyline } from '@/lib/polyline';

export type { PlanStatus };

/** The saved plan as the trip(id) query returns it — codegen keeps this in lockstep with the schema. */
type SavedTrip = NonNullable<SavedTripQuery['trip']>;

interface PlanState {
  status: PlanStatus;
  steps: StepEvent[];
  route: RouteEvent | null;
  stops: StopEvent[];
  summary: PlanSummaryEvent | null;
  error: string | null;
  planId: string | null;
  start: () => void;
  dispatch: (event: PlanEvent) => void;
  hydrate: (trip: SavedTrip) => void;
  fail: (message: string) => void;
  reset: () => void;
}

export const usePlanStore = create<PlanState>((set) => ({
  status: 'idle',
  steps: [],
  route: null,
  stops: [],
  summary: null,
  error: null,
  planId: null,

  start: () =>
    set({ status: 'streaming', steps: [], route: null, stops: [], summary: null, error: null }),

  dispatch: (event) =>
    set((state) => {
      switch (event.__typename) {
        case 'StepEvent': {
          const steps = [...state.steps];
          const idx = steps.findIndex((s) => s.id === event.id);
          if (idx >= 0) steps[idx] = event;
          else steps.push(event);
          return { steps };
        }
        case 'RouteEvent':
          return { route: event };
        case 'StopEvent':
          return { stops: [...state.stops, event] };
        case 'PlanSummaryEvent':
          return { summary: event, planId: event.planId, status: 'ready' };
        case 'PlanErrorEvent':
          return { error: event.message, status: 'error' };
        default:
          return {};
      }
    }),

  /** Restore a saved plan from Postgres — no agent run, straight to 'ready'. */
  hydrate: (trip) => {
    if (!trip.polyline) return;
    const path = decodePolyline(trip.polyline);
    if (path.length < 2) return;
    const route: RouteEvent = {
      __typename: 'RouteEvent',
      polyline: trip.polyline,
      origin: path[0],
      destination: path[path.length - 1],
      originName: trip.originName,
      destinationName: trip.destinationName,
      distanceKm: trip.distanceKm,
      durationMin: trip.durationMin,
    };
    set({
      status: 'ready',
      error: null,
      planId: trip.id,
      route,
      // Generated types are schema-wide (icon: string); the store's domain types are narrower.
      stops: trip.stops.map((s) => ({ ...s, __typename: 'StopEvent' as const })) as StopEvent[],
      steps: [
        { __typename: 'StepEvent', id: 'loaded', label: 'Loaded from your recent trips', status: 'done' },
      ],
      summary: {
        __typename: 'PlanSummaryEvent',
        planId: trip.id,
        summary: trip.summary ?? 'Your saved plan — every stop has its reasons below.',
        stopCount: trip.stops.length,
      },
    });
  },

  fail: (message) => set({ error: message, status: 'error' }),

  reset: () =>
    set({
      status: 'idle',
      steps: [],
      route: null,
      stops: [],
      summary: null,
      error: null,
      planId: null,
    }),
}));
