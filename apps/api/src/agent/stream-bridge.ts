import {
  PlanEventPayload,
  PlanSummaryEvent,
  RouteEvent,
  StepEvent,
  StopEvent,
} from '../graphql/types/plan.types';
import { make } from '../util/make';
import { RunContext } from './run-context';

interface StreamPart {
  type: string;
  toolCallId?: string;
  toolName?: string;
  input?: unknown;
  args?: unknown;
  output?: unknown;
  result?: unknown;
  text?: string;
  textDelta?: string;
  error?: unknown;
}

const STEP_LABELS: Record<string, (input: Record<string, unknown>) => string> = {
  getRoute: (i) => `Mapping your route ${i.origin ?? ''} → ${i.destination ?? ''}`.trim(),
  splitIntoLegs: () => 'Splitting the drive into legs',
  searchAlongRoute: (i) => `Searching: ${i.need ?? i.keyword ?? 'places along the route'}`,
  finalizeStops: () => 'Weighing options & writing reasons',
};

/**
 * Translates the AI SDK fullStream into typed PlanEvents.
 * The frontend never parses raw LLM output — only these events.
 */
export async function* bridgeStream(
  fullStream: AsyncIterable<unknown>,
  ctx: RunContext,
  planId: string,
): AsyncGenerator<PlanEventPayload> {
  let summaryText = '';
  let stopCount = 0;
  let routeEmitted = false;

  for await (const raw of fullStream) {
    const part = raw as StreamPart;
    switch (part.type) {
      case 'tool-call': {
        const input = (part.input ?? part.args ?? {}) as Record<string, unknown>;
        const labelFn = STEP_LABELS[part.toolName ?? ''];
        if (labelFn) {
          yield step(part.toolCallId ?? part.toolName ?? 'step', labelFn(input), 'active');
        }
        break;
      }
      case 'tool-result': {
        const output = (part.output ?? part.result ?? {}) as Record<string, unknown>;
        const input = (part.input ?? part.args ?? {}) as Record<string, unknown>;
        const labelFn = STEP_LABELS[part.toolName ?? ''];
        if (labelFn) {
          let label = labelFn(input);
          if (part.toolName === 'searchAlongRoute' && Array.isArray(output.candidates)) {
            label = `${label} · ${output.candidates.length} candidates`;
          }
          yield step(part.toolCallId ?? part.toolName ?? 'step', label, 'done');
        }
        if (part.toolName === 'getRoute' && ctx.route && !routeEmitted) {
          routeEmitted = true;
          yield routeEvent(ctx);
        }
        if (part.toolName === 'finalizeStops' && Array.isArray(output.stops)) {
          for (const s of output.stops as Array<Record<string, unknown>>) {
            stopCount++;
            yield stopEvent(s, stopCount);
          }
        }
        break;
      }
      case 'text-delta': {
        summaryText += part.text ?? part.textDelta ?? '';
        break;
      }
      case 'error': {
        yield {
          message: part.error instanceof Error ? part.error.message : String(part.error),
          code: 'AGENT_ERROR',
        };
        break;
      }
      default:
        break;
    }
  }

  yield make(PlanSummaryEvent, {
    planId,
    summary: summaryText.trim() || 'Your plan is ready — every stop has its reasons below.',
    stopCount,
  });
}

export function step(id: string, label: string, status: 'active' | 'done'): StepEvent {
  return make(StepEvent, { id, label, status });
}

export function routeEvent(ctx: RunContext): RouteEvent {
  // RouteInfo carries everything RouteEvent needs (plus `path`, which GraphQL ignores).
  return make(RouteEvent, ctx.route!);
}

export function stopEvent(s: Record<string, unknown>, index: number): StopEvent {
  return make(StopEvent, {
    ...(s as Partial<StopEvent>),
    id: `stop-${index}-${s.placeId}`,
    category: String(s.category ?? 'other'),
    detourKm: Number(s.detourKm ?? 0),
    tier: String(s.tier ?? 'primary'),
    why: (s.why as StopEvent['why']) ?? [],
  });
}
