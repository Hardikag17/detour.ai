'use client';

import type { StopEvent } from '@detour/shared';
import { CATEGORY_ICON, Icon, WHY_ICON } from '@/lib/icons';
import { useUiStore } from '@/store/uiStore';
import { CATEGORY_COLOR } from './RouteCanvas';

const CATEGORY_BG: Record<string, string> = {
  cafe: '#eef3fc',
  restaurant: '#fceeea',
  hotel: '#efedfc',
  waterfall: '#e7f3ea',
  sight: '#faf4e8',
  other: '#eef3fc',
};

export function StopCard({ stop, index }: { stop: StopEvent; index: number }) {
  const { selectedStopId, selectStop } = useUiStore();
  const isStretch = stop.tier === 'stretch';
  const selected = selectedStopId === stop.id;
  const color = CATEGORY_COLOR[stop.category] ?? '#2b6bff';
  const bg = CATEGORY_BG[stop.category] ?? '#eef3fc';

  return (
    <button
      type="button"
      onClick={() => selectStop(selected ? null : stop.id)}
      className={`fade-up w-full cursor-pointer rounded-xl border bg-white px-3.5 py-3 text-left transition ${
        isStretch ? 'border-dashed border-[#d5d8e2] opacity-80' : 'border-[#e6e8ef]'
      } ${selected ? 'border-[#9db4ff] shadow-[0_6px_20px_rgba(43,107,255,0.12)]' : 'hover:border-[#c9d4f5]'}`}
    >
      <div className="flex items-center gap-2.5">
        <span
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold"
          style={{ background: isStretch ? '#f1f1ee' : bg, color: isStretch ? '#8a8880' : color }}
        >
          {index + 1}
        </span>
        <span
          className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full"
          style={{ background: isStretch ? '#f1f1ee' : bg, color: isStretch ? '#8a8880' : color }}
        >
          <Icon name={CATEGORY_ICON[stop.category] ?? 'mapPin'} size={14} />
        </span>
        <span
          className={`min-w-0 truncate text-sm font-medium ${isStretch ? 'text-[#565b6b]' : 'text-[#0c0e14]'}`}
        >
          {stop.name}
        </span>
        {stop.rating != null && (
          <span className="flex shrink-0 items-center gap-0.5 text-[11px] text-[#42465a]">
            <Icon name="star" size={11} className="text-[#ef9f27]" fill="#ef9f27" />
            {stop.rating}
            {stop.reviewCount != null && (
              <span className="text-[#9a9dab]"> · {formatCount(stop.reviewCount)}</span>
            )}
          </span>
        )}
        <span
          className={`ml-auto shrink-0 rounded-full px-2 py-0.5 text-[10.5px] ${
            isStretch
              ? 'border border-[#f0e3c8] bg-[#faeeda] text-[#854f0b]'
              : 'bg-[#e1f5ee] text-[#0f6e56]'
          }`}
        >
          +{stop.detourKm} km{isStretch ? ' · stretch' : ''}
        </span>
      </div>

      {stop.legLabel && (
        <div className="mt-1 ml-[62px] text-[11px] text-[#8a8e9c]">{stop.legLabel}</div>
      )}

      <div className="mt-1.5 ml-[62px]">
        <div className="mb-1 text-[10.5px] font-medium text-[#2b6bff]">Why this stop?</div>
        <div className="flex flex-col gap-1">
          {stop.why.map((w, i) => (
            <div
              key={i}
              className="flex items-start gap-1.5 text-[11.5px] leading-snug text-[#3f6bd6]"
            >
              <Icon name={WHY_ICON[w.icon] ?? 'sparkle'} size={12} className="mt-0.5 shrink-0" />
              <span>{w.text}</span>
            </div>
          ))}
        </div>
      </div>
    </button>
  );
}

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}
