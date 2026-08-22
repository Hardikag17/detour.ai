'use client';

import { useQuery } from '@tanstack/react-query';
import { useUiStore } from '@/store/uiStore';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/graphql';

const RECENT_TRIPS_QUERY = /* GraphQL */ `
  query RecentTrips($limit: Int) {
    recentTrips(limit: $limit) {
      id
      prompt
      originName
      destinationName
      distanceKm
      stops {
        id
      }
    }
  }
`;

interface RecentTrip {
  id: string;
  prompt: string;
  originName: string;
  destinationName: string;
  distanceKm: number;
  stops: { id: string }[];
}

async function fetchRecentTrips(): Promise<RecentTrip[]> {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: RECENT_TRIPS_QUERY, variables: { limit: 4 } }),
  });
  if (!res.ok) throw new Error(`recentTrips failed: ${res.status}`);
  const json = (await res.json()) as { data?: { recentTrips?: RecentTrip[] } };
  return json.data?.recentTrips ?? [];
}

function shortName(full: string): string {
  return full.split(',')[0].trim();
}

/** Chips of recently planned trips (Postgres-backed); hidden when there are none. */
export function RecentTrips() {
  const setPrompt = useUiStore((s) => s.setPrompt);
  const { data } = useQuery({
    queryKey: ['recentTrips'],
    queryFn: fetchRecentTrips,
    staleTime: 30_000,
    retry: 0,
  });

  if (!data?.length) return null;

  return (
    <div className="mb-2.5 flex flex-wrap items-center justify-center gap-1.5">
      <span className="text-[10.5px] text-[#a2a6b4]">Recent</span>
      {data.map((trip) => (
        <button
          key={trip.id}
          type="button"
          onClick={() => setPrompt(trip.prompt)}
          className="flex items-center gap-1.5 rounded-full border border-[#e6e8ef] bg-white/80 px-2.5 py-1 text-[11px] text-[#585c6c] backdrop-blur-sm transition-colors hover:border-[#9db4ff] hover:text-[#2b6bff]"
        >
          {shortName(trip.originName)} → {shortName(trip.destinationName)}
          <span className="text-[#a2a6b4]">· {trip.stops.length} stops</span>
        </button>
      ))}
    </div>
  );
}
