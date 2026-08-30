'use client';

import { useEffect, useRef, useState } from 'react';
import { ROTATING_WORDS as ROTATING } from '@detour/shared/helpers/constants';

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
    <div className="relative z-[3] pt-10 text-center md:pt-16 xl:pt-20">
      {/* Brand lives in the sidebar on desktop; keep it visible on mobile */}
      <div className="mb-3.5 inline-flex items-center gap-1.5 md:hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/logo.svg" alt="" className="h-[23px] w-[23px] rounded-[7px] shadow-[0_3px_9px_rgba(43,107,255,0.35)]" />
        <span className="text-sm font-medium text-[#12141c]">detour.ai</span>
      </div>
      <div className='flex px-16 flex-col text-left content-start'>
        <h1 className=" mb-3 font-bold text-[44px] leading-[1.16] tracking-[-0.6px] text-[#080a10] md:text-[48px] xl:mb-6 xl:text-[68px] xl:tracking-[-1.8px]">
          Don&apos;t just get there.
          <br />
          Discover <span className="grad-text">everything in between.</span>
        </h1>
        <p className="text-[14px] font-bold leading-normal whitespace-nowrap text-[#565b6b] md:text-xl xl:text-[18px]">
          Tell us where you&apos;re going. We&apos;ll find{' '}
          <span className={`rot-word font-medium ${out ? 'out' : ''}`}>{ROTATING?.[wordIdx]}</span>
        </p>
      </div>

    </div>
  );
}
