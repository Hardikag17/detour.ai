'use client';

import { useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { PLAN_TRIP_SUBSCRIPTION, type PlanEvent, type PlanTripInput } from '@detour/shared';
import type { PlanTripSubscription } from '@detour/shared/generated/graphql';
import { gqlSubscribe } from '@/lib/api';
import { usePlanStore } from '@/store/planStore';
import { useUiStore } from '@/store/uiStore';

/** One SSE frame: generated subscription payload + GraphQL's standard errors array. */
interface PlanFrame {
  data?: PlanTripSubscription;
  errors?: Array<{ message?: string }>;
}

/** Streams the planTrip subscription and dispatches each event into the store. */
export function usePlanTrip() {
  const abortRef = useRef<AbortController | null>(null);
  const queryClient = useQueryClient();

  const planTrip = useCallback(async (promptOverride?: string, refine = false) => {
    const { prompt, detourKm, sessionId } = useUiStore.getState();
    const plan = usePlanStore.getState();
    const finalPrompt = promptOverride ?? prompt;
    if (!finalPrompt.trim()) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const input: PlanTripInput = {
      prompt: finalPrompt,
      detourKm,
      sessionId,
      ...(refine && plan.planId ? { planId: plan.planId } : {}),
    };

    plan.start();
    try {
      const frames = gqlSubscribe<PlanFrame>(
        PLAN_TRIP_SUBSCRIPTION,
        { input },
        controller.signal,
      );
      for await (const frame of frames) {
        const event = frame.data?.planTrip;
        // Store domain types are narrower than schema-wide generated ones (literal unions).
        if (event) usePlanStore.getState().dispatch(event as PlanEvent);
        if (frame.errors?.length) {
          usePlanStore.getState().fail(frame.errors[0]?.message ?? 'Planning failed');
        }
      }
      finishIfStreamEndedEarly();
      // The API saves the plan right after the stream closes — give it a beat,
      // then refresh the sidebar's recent-trips list.
      setTimeout(() => {
        void queryClient.invalidateQueries({ queryKey: ['recentTrips'] });
      }, 1000);
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        usePlanStore.getState().fail((err as Error).message);
      }
    }
  }, [queryClient]);

  const cancel = useCallback(() => abortRef.current?.abort(), []);
  return { planTrip, cancel };
}

/** Stream closed without a summary event → mark done if we got stops, else fail. */
function finishIfStreamEndedEarly() {
  const st = usePlanStore.getState();
  if (st.status !== 'streaming') return;
  if (st.stops.length === 0) {
    st.fail('The stream ended before a plan was produced.');
    return;
  }
  st.dispatch({
    __typename: 'PlanSummaryEvent',
    planId: st.planId ?? 'plan',
    summary: 'Plan ready.',
    stopCount: st.stops.length,
  });
}
