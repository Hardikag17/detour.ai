'use client';

import { useState } from 'react';
import { Icon } from '@/lib/icons';
import { usePlanStore } from '@/store/planStore';
import { useUiStore } from '@/store/uiStore';

const TRY_CHIPS: Array<{ icon: string; label: string; prompt: string }> = [
  {
    icon: 'coffee',
    label: 'Cafés + stops en route to Varkala',
    prompt:
      'Driving Kochi to Varkala. Find famous cafés on the way and a couple of scenic stops worth pulling over for.',
  },
  {
    icon: 'tent',
    label: 'Where to break the Goa drive',
    prompt:
      'Driving Bangalore to Goa. I want a pet-friendly café for breakfast, one waterfall that is not crowded, and a hotel close to the destination under 4k.',
  },
];

const PLACEHOLDER = 'Famous cafés on the way to Varkala beach…';

interface SearchBarProps {
  onSubmit: (prompt: string, refine: boolean) => void;
}

export function SearchBar({ onSubmit }: SearchBarProps) {
  const { prompt, setPrompt, detourKm, setDetourKm } = useUiStore();
  const status = usePlanStore((s) => s.status);
  const planId = usePlanStore((s) => s.planId);
  const [detourOpen, setDetourOpen] = useState(false);
  const streaming = status === 'streaming';
  const canRefine = Boolean(planId) && status === 'ready';

  const submit = () => {
    if (!prompt.trim() || streaming) return;
    onSubmit(prompt, canRefine);
  };

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 bg-gradient-to-t from-white via-white/95 to-transparent px-5 pt-9 pb-4 text-center">
      {/* Try suggestions */}
      {status === 'idle' && (
        <div className="pointer-events-auto mb-2.5 flex flex-wrap items-center justify-center gap-1.5">
          <span className="text-[10.5px] text-[#a2a6b4]">Try</span>
          {TRY_CHIPS.map((chip) => (
            <button
              key={chip.label}
              type="button"
              onClick={() => {
                setPrompt(chip.prompt);
                onSubmit(chip.prompt, false);
              }}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-[14px] border border-[#e6e8ef] bg-white/90 px-2.5 py-1 text-[11px] text-[#585c6c] backdrop-blur-sm transition hover:border-[#9db4ff] hover:text-[#2b6bff]"
            >
              <Icon name={chip.icon} size={12} />
              {chip.label}
            </button>
          ))}
        </div>
      )}

      {/* The search bar */}
      <div className="pointer-events-auto relative mx-auto flex max-w-[560px] items-center gap-2 rounded-xl border border-[#e0e4ee] bg-white py-1.5 pr-1.5 pl-3.5 shadow-[0_10px_30px_rgba(43,107,255,0.14)]">
        {canRefine ? (
          <Icon name="message" size={15} className="shrink-0 text-[#a2a6b4]" />
        ) : (
          <Icon name="search" size={15} className="shrink-0 text-[#a2a6b4]" />
        )}
        <input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder={canRefine ? 'Refine it — "make it vegetarian, avoid tolls"…' : PLACEHOLDER}
          disabled={streaming}
          className="min-w-0 flex-1 bg-transparent text-left text-[13px] text-[#0c0e14] outline-none placeholder:text-[#9a9dab] disabled:opacity-60"
        />

        {/* Detour pill + popover slider */}
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setDetourOpen((v) => !v)}
            className="inline-flex cursor-pointer items-center gap-1 rounded-[20px] border border-[#e6e8ef] bg-[#f4f5f9] px-2 py-1 text-[11px] text-[#42465a] transition hover:border-[#9db4ff]"
          >
            <Icon name="detour" size={12} className="text-[#2b6bff]" />
            {detourKm}km
          </button>
          {detourOpen && (
            <div className="absolute right-0 bottom-10 w-56 rounded-xl border border-[#e0e4ee] bg-white p-3 text-left shadow-[0_10px_30px_rgba(20,30,60,0.15)]">
              <div className="mb-1 flex items-baseline justify-between">
                <span className="text-[11px] text-[#565b6b]">Willing to detour</span>
                <span className="text-xs font-medium text-[#0c0e14]">
                  {detourKm} km{' '}
                  <span className="font-normal text-[#9a9dab]">· shows up to {detourKm * 2}</span>
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={20}
                step={1}
                value={detourKm}
                onChange={(e) => setDetourKm(Number(e.target.value))}
                className="w-full accent-[#2b6bff]"
              />
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={submit}
          disabled={streaming || !prompt.trim()}
          aria-label="Plan my trip"
          className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-full bg-gradient-to-br from-[#2b6bff] to-[#6a5cff] shadow-[0_3px_10px_rgba(43,107,255,0.4)] transition hover:brightness-110 disabled:opacity-50"
        >
          {streaming ? (
            <Icon name="loader" size={14} className="spin text-white" />
          ) : (
            <Icon name="arrowUp" size={14} className="text-white" />
          )}
        </button>
      </div>
    </div>
  );
}
