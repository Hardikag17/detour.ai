'use client';

import { useCallback, useRef } from 'react';
import { PLAN_TRIP_SUBSCRIPTION, type PlanEvent, type PlanTripInput } from '@detour/shared';
import { usePlanStore } from '@/store/planStore';
import { useUiStore } from '@/store/uiStore';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/graphql';

/**
 * Opens the planTrip GraphQL subscription over SSE (POST + text/event-stream,
 * served natively by GraphQL Yoga) and dispatches each PlanEvent into the store.
 */
export function usePlanTrip() {
  const abortRef = useRef<AbortController | null>(null);

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
      const res = await fetch(API_URL, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream',
        },
        body: JSON.stringify({
          query: PLAN_TRIP_SUBSCRIPTION,
          variables: { input },
        }),
      });

      if (!res.ok || !res.body) {
        throw new Error(`API responded ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        // SSE frames are separated by a blank line.
        const frames = buffer.split('\n\n');
        buffer = frames.pop() ?? '';
        for (const frame of frames) {
          const dataLines = frame
            .split('\n')
            .filter((l) => l.startsWith('data:'))
            .map((l) => l.slice(5).trim())
            .filter(Boolean);
          if (dataLines.length === 0) continue;
          try {
            const payload = JSON.parse(dataLines.join('\n'));
            const event = payload?.data?.planTrip as PlanEvent | undefined;
            if (event) usePlanStore.getState().dispatch(event);
            if (payload?.errors?.length) {
              usePlanStore.getState().fail(payload.errors[0]?.message ?? 'Planning failed');
            }
          } catch {
            // Ignore non-JSON keepalive frames.
          }
        }
      }

      // Stream ended without a summary event → surface as ready anyway if we got stops.
      const st = usePlanStore.getState();
      if (st.status === 'streaming') {
        if (st.stops.length > 0) {
          st.dispatch({
            __typename: 'PlanSummaryEvent',
            planId: st.planId ?? 'plan',
            summary: 'Plan ready.',
            stopCount: st.stops.length,
          });
        } else {
          st.fail('The stream ended before a plan was produced.');
        }
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        usePlanStore.getState().fail((err as Error).message);
      }
    }
  }, []);

  const cancel = useCallback(() => abortRef.current?.abort(), []);

  return { planTrip, cancel };
}
