'use client';

import dynamic from 'next/dynamic';
import { MapCanvas } from '@/components/landing/MapCanvas';
import { SearchBar } from '@/components/landing/SearchBar';
import { Tagline } from '@/components/landing/Tagline';
import { ResultsPanel } from '@/components/results/ResultsPanel';
import { Sidebar } from '@/components/shell/Sidebar';

// Leaflet touches `window`, so the real map must skip server rendering.
const RouteMap = dynamic(() => import('@/components/results/RouteMap'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-[#f7f9fd]">
      <div className="flex items-center gap-2 text-sm text-[#7a7f8f]">
        <span className="spin inline-block h-4 w-4 rounded-full border-2 border-[#c4d9ff] border-t-[#2b6bff]" />
        Loading the map…
      </div>
    </div>
  ),
});
import { usePlanTrip } from '@/hooks/usePlanTrip';
import { usePlanStore } from '@/store/planStore';

export default function Home() {
  const status = usePlanStore((s) => s.status);
  const reset = usePlanStore((s) => s.reset);
  const { planTrip, cancel } = usePlanTrip();

  const handleSubmit = (prompt: string, refine: boolean) => {
    void planTrip(prompt, refine);
  };

  const handleNewTrip = () => {
    cancel();
    reset();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (status === 'idle') {
    return (
      <>
        <Sidebar />
        <main className="relative h-dvh overflow-hidden pl-[var(--sidebar-w)]">
          <MapCanvas />
          <Tagline />
          <SearchBar onSubmit={handleSubmit} />
        </main>
      </>
    );
  }

  return (
    <>
      <Sidebar />
      <main className="min-h-dvh bg-white pl-[var(--sidebar-w)]">
        {/* Sticky map hero — results scroll up over it */}
        <div className="sticky top-0 z-0 h-[44dvh]">
          <RouteMap />
        </div>

        {/* Results panel slides over the pinned map */}
        <section className="relative z-10 -mt-5 min-h-[62dvh] rounded-t-3xl bg-white shadow-[0_-12px_40px_rgba(20,30,60,0.1)]">
          <div className="mx-auto mb-1 h-1 w-9 translate-y-2 rounded-full bg-[#dfe2ec]" />
          <ResultsPanel onNewTrip={handleNewTrip} />
        </section>

        <SearchBar onSubmit={handleSubmit} />
      </main>
    </>
  );
}
