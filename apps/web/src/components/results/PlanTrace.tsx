'use client';

import { Icon } from '@/lib/icons';
import { usePlanStore } from '@/store/planStore';

/** "How I planned this" — the agent's streaming reasoning trace. */
export function PlanTrace() {
  const steps = usePlanStore((s) => s.steps);
  const status = usePlanStore((s) => s.status);
  if (steps.length === 0) return null;

  return (
    <div className="rounded-xl border border-[#e6e8ef] bg-white px-3.5 py-3">
      <div className="mb-2 text-[10.5px] font-medium tracking-wide text-[#8a8e9c] uppercase">
        How I planned this
      </div>
      <div className="flex flex-col gap-1.5">
        {steps.map((step) => (
          <div key={step.id} className="flex items-start gap-2 text-xs leading-relaxed">
            {step.status === 'done' ? (
              <Icon name="check" size={13} className="mt-0.5 shrink-0 text-[#1d9e75]" />
            ) : (
              <Icon name="loader" size={13} className="spin mt-0.5 shrink-0 text-[#2b6bff]" />
            )}
            <span
              className={step.status === 'done' ? 'text-[#42465a]' : 'font-medium text-[#2b6bff]'}
            >
              {step.label}
            </span>
          </div>
        ))}
        {status === 'streaming' && steps.every((s) => s.status === 'done') && (
          <div className="flex items-center gap-2 text-xs text-[#2b6bff]">
            <Icon name="loader" size={13} className="spin shrink-0" />
            <span className="font-medium">Thinking…</span>
          </div>
        )}
      </div>
    </div>
  );
}
