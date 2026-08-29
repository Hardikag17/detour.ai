'use client';

import { Icon } from '@/lib/icons';
import { usePlanStore } from '@/store/planStore';
import { PlanTrace } from './PlanTrace';
import { StopCard } from './StopCard';

export function ResultsPanel({ onNewTrip }: { onNewTrip: () => void }) {
  const { stops, summary, status, error } = usePlanStore();
  const primary = stops.filter((s) => s.tier !== 'stretch');
  const stretch = stops.filter((s) => s.tier === 'stretch');

  return (
    <div className="mx-auto w-full max-w-[640px] px-4 pt-4 pb-36">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/logo.svg" alt="" className="h-[21px] w-[21px] rounded-md" />
          <span className="text-[13px] font-medium text-[#12141c]">detour.ai</span>
          {stops.length > 0 && (
            <span className="ml-1 text-xs text-[#8a8e9c]">
              · {stops.length} stop{stops.length === 1 ? '' : 's'} on your route
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={onNewTrip}
          className="cursor-pointer rounded-full border border-[#e6e8ef] bg-white px-3 py-1 text-[11px] text-[#565b6b] transition hover:border-[#9db4ff] hover:text-[#2b6bff]"
        >
          New trip
        </button>
      </div>

      <PlanTrace />

      {error && (
        <div className="mt-3 rounded-xl border border-[#f7c1c1] bg-[#fcebeb] px-3.5 py-3 text-xs text-[#a32d2d]">
          {error}
        </div>
      )}

      {stops.length > 0 && (
        <div className="mt-3 flex flex-col gap-2.5">
          {primary.map((stop) => (
            <StopCard key={stop.id} stop={stop} index={stops.indexOf(stop)} />
          ))}

          {stretch.length > 0 && (
            <>
              <div className="flex items-center gap-2 pt-1 text-[10.5px] text-[#a2a6b4]">
                <Icon name="sparkle" size={12} />
                <span>stretch picks · just past your detour limit — worth it?</span>
                <span className="h-px flex-1 border-t border-dashed border-[#e0e4ee]" />
              </div>
              {stretch.map((stop) => (
                <StopCard key={stop.id} stop={stop} index={stops.indexOf(stop)} />
              ))}
            </>
          )}
        </div>
      )}

      {summary && (
        <div className="fade-up mt-4 rounded-xl border border-[#dbe7ff] bg-[#f5f8ff] px-3.5 py-3 text-xs leading-relaxed text-[#33415e]">
          {summary.summary}
        </div>
      )}

      {status === 'ready' && (
        <p className="mt-3 text-center text-[10.5px] text-[#a2a6b4]">
          Refine it below — &quot;actually, make it vegetarian and avoid toll roads&quot;
        </p>
      )}
    </div>
  );
}
