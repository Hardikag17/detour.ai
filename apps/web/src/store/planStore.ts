import { create } from 'zustand';
import type { PlanEvent, PlanSummaryEvent, RouteEvent, StepEvent, StopEvent } from '@detour/shared';

export type PlanStatus = 'idle' | 'streaming' | 'ready' | 'error';

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
        case 'StopUpdatedEvent': {
          if (event.change === 'removed') {
            return { stops: state.stops.filter((s) => s.id !== event.id) };
          }
          if (event.stop) {
            const stops = state.stops.filter((s) => s.id !== event.id);
            return { stops: [...stops, event.stop] };
          }
          return {};
        }
        case 'PlanSummaryEvent':
          return { summary: event, planId: event.planId, status: 'ready' };
        case 'PlanErrorEvent':
          return { error: event.message, status: 'error' };
        default:
          return {};
      }
    }),

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
