'use client';

import { MapCanvas } from '@/components/landing/MapCanvas';
import { SearchBar } from '@/components/landing/SearchBar';
import { Tagline } from '@/components/landing/Tagline';
import { ResultsPanel } from '@/components/results/ResultsPanel';
import { RouteCanvas } from '@/components/results/RouteCanvas';
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
      <main className="relative h-dvh overflow-hidden">
        <MapCanvas />
        <Tagline />
        <SearchBar onSubmit={handleSubmit} />
      </main>
    );
  }

  return (
    <main className="min-h-dvh bg-white">
      {/* Sticky map hero — results scroll up over it */}
      <div className="sticky top-0 z-0 h-[44dvh]">
        <RouteCanvas />
      </div>

      {/* Results panel slides over the pinned map */}
      <section className="relative z-10 -mt-5 min-h-[62dvh] rounded-t-3xl bg-white shadow-[0_-12px_40px_rgba(20,30,60,0.1)]">
        <div className="mx-auto mb-1 h-1 w-9 translate-y-2 rounded-full bg-[#dfe2ec]" />
        <ResultsPanel onNewTrip={handleNewTrip} />
      </section>

      <SearchBar onSubmit={handleSubmit} />
    </main>
  );
}
