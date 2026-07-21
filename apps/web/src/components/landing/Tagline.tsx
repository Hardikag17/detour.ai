'use client';

import { useEffect, useRef, useState } from 'react';
import { Icon } from '@/lib/icons';

const ROTATING = [
  'hidden gems.',
  'local favorites.',
  'scenic detours.',
  'chai stops.',
  'roadside dhabas.',
  'chai-sutta breaks.',
  'worthwhile detours.',
  'unforgettable views.',
];

export function Tagline() {
  const [wordIdx, setWordIdx] = useState(0);
  const [out, setOut] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    timer.current = setInterval(() => {
      setOut(true);
      setTimeout(() => {
        setWordIdx((i) => (i + 1) % ROTATING.length);
        setOut(false);
      }, 340);
    }, 2200);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, []);

  return (
    <div className="relative z-[3] pt-8 text-center md:pt-10">
      <div className="mb-3.5 inline-flex items-center gap-1.5">
        <div className="flex h-[23px] w-[23px] items-center justify-center rounded-[7px] bg-gradient-to-br from-[#2b6bff] to-[#6a5cff] shadow-[0_3px_9px_rgba(43,107,255,0.35)]">
          <Icon name="route" size={13} className="text-white" />
        </div>
        <span className="text-sm font-medium text-[#12141c]">detour.ai</span>
      </div>

      <h1 className="mx-auto mb-2 text-[26px] leading-[1.2] font-medium tracking-[-0.4px] text-[#080a10] md:text-[30px]">
        Don&apos;t just get there.
        <br />
        Discover <span className="grad-text">everything in between.</span>
      </h1>
      <p className="mx-auto text-[13px] leading-normal whitespace-nowrap text-[#565b6b] md:text-sm">
        Tell us where you&apos;re going. We&apos;ll find{' '}
        <span className={`rot-word font-medium ${out ? 'out' : ''}`}>{ROTATING[wordIdx]}</span>
      </p>
    </div>
  );
}
