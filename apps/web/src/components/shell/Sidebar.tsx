'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { RECENT_TRIPS_QUERY, SAVED_TRIP_QUERY } from '@detour/shared';
import type { RecentTrip, SavedTripDetail } from '@detour/shared/helpers/interfaces';
import { gqlRequest } from '@/lib/api';
import { Icon } from '@/lib/icons';
import { usePlanStore } from '@/store/planStore';
import { useUiStore } from '@/store/uiStore';

async function fetchRecentTrips(): Promise<RecentTrip[]> {
  const data = await gqlRequest<{ recentTrips?: RecentTrip[] }>(RECENT_TRIPS_QUERY, { limit: 8 });
  return data.recentTrips ?? [];
}

const shortName = (full: string) => full.split(',')[0].trim();

/** Fixed left rail: brand + recent trips. Click loads the saved plan from Postgres. */
export function Sidebar() {
  const setPrompt = useUiStore((s) => s.setPrompt);
  const activePlanId = usePlanStore((s) => s.planId);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const { data: trips } = useQuery({
    queryKey: ['recentTrips'],
    queryFn: fetchRecentTrips,
    staleTime: 30_000,
    retry: 0,
  });

  const openTrip = async (trip: RecentTrip) => {
    setPrompt(trip.prompt);
    // Trips saved before polylines were stored can't redraw the map — prefill only.
    if (!trip.polyline) return;
    setLoadingId(trip.id);
    try {
      const data = await gqlRequest<{ trip?: SavedTripDetail }>(SAVED_TRIP_QUERY, { id: trip.id });
      if (data.trip) usePlanStore.getState().hydrate(data.trip);
    } catch {
      /* leave the prefilled prompt as the fallback */
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <aside className="fixed top-0 left-0 z-50 hidden h-dvh w-[var(--sidebar-w)] flex-col border-r border-[#ececf1] bg-[#fbfbfd] px-3.5 py-4 md:flex xl:px-6 xl:py-7">
      <div className="mb-4 flex items-center gap-2.5 px-1 xl:mb-7">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/logo.svg" alt="" className="h-7 w-7 shadow-[0_3px_9px_rgba(43,107,255,0.35)] rounded-lg xl:h-10 xl:w-10" />
        <span className="text-[15px] font-medium text-[#12141c] xl:text-[19px]">detour.ai</span>
      </div>

      {trips && trips.length > 0 && (
        <>
          <div className="mx-1 mb-1.5 text-[10.5px] tracking-[0.1em] text-[#a2a6b4] xl:text-[13px]">
            RECENT
          </div>
          <div className="flex flex-col gap-px overflow-y-auto">
            {trips.map((trip) => (
              <button
                key={trip.id}
                type="button"
                onClick={() => void openTrip(trip)}
                className={`flex cursor-pointer flex-col gap-0.5 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-[#f2f4fa] xl:px-4 xl:py-3.5 ${
                  activePlanId === trip.id ? 'bg-[#eef2fc]' : ''
                }`}
              >
                <span className="flex items-center gap-1.5 truncate text-[13px] font-medium text-[#12141c] xl:text-[17px]">
                  {shortName(trip.originName)} → {shortName(trip.destinationName)}
                  {loadingId === trip.id && (
                    <Icon name="loader" size={12} className="spin shrink-0 text-[#2b6bff]" />
                  )}
                </span>
                <span className="text-[11px] text-[#9a9dab] xl:text-[14px]">
                  {trip.stops.length} {trip.stops.length === 1 ? 'stop' : 'stops'} ·{' '}
                  {trip.distanceKm} km
                </span>
              </button>
            ))}
          </div>
        </>
      )}
    </aside>
  );
}
