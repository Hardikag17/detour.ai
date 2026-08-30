'use client';

import { useCallback } from 'react';
import { SAVED_TRIP_QUERY } from '@detour/shared';
import type { SavedTripQuery } from '@detour/shared/generated/graphql';
import { gqlRequest } from '@/lib/api';
import { usePlanStore } from '@/store/planStore';
import { useUiStore } from '@/store/uiStore';

/**
 * Loads a saved plan by id and hydrates the results view — no agent run.
 * Used by the sidebar (owner) and the ?planId= share-link loader (visitor).
 * TODO: once the gated `sharedTrip` resolver lands, the visitor path should
 * use SHARED_TRIP_QUERY so `isShareable` is actually enforced.
 */
export function useLoadTrip() {
  return useCallback(async (planId: string): Promise<boolean> => {
    const data = await gqlRequest<SavedTripQuery>(SAVED_TRIP_QUERY, { id: planId });
    const trip = data.trip;
    if (!trip?.polyline) return false; // unknown id, or a legacy trip without a stored route
    usePlanStore.getState().hydrate(trip);
    useUiStore.getState().setPrompt(trip.prompt);
    return true;
  }, []);
}
