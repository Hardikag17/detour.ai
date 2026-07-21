import {
  PlanEventPayload,
  PlanSummaryEvent,
  RouteEvent,
  StepEvent,
  StopEvent,
} from '../graphql/types/plan.types';
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

  const summary = new PlanSummaryEvent();
  summary.planId = planId;
  summary.summary = summaryText.trim() || 'Your plan is ready — every stop has its reasons below.';
  summary.stopCount = stopCount;
  yield summary;
}

export function step(id: string, label: string, status: 'active' | 'done'): StepEvent {
  const e = new StepEvent();
  e.id = id;
  e.label = label;
  e.status = status;
  return e;
}

export function routeEvent(ctx: RunContext): RouteEvent {
  const r = ctx.route!;
  const e = new RouteEvent();
  e.polyline = r.polyline;
  e.origin = r.origin;
  e.destination = r.destination;
  e.originName = r.originName;
  e.destinationName = r.destinationName;
  e.distanceKm = r.distanceKm;
  e.durationMin = r.durationMin;
  return e;
}

export function stopEvent(s: Record<string, unknown>, index: number): StopEvent {
  const e = new StopEvent();
  e.id = `stop-${index}-${s.placeId}`;
  e.placeId = String(s.placeId);
  e.name = String(s.name);
  e.category = String(s.category ?? 'other');
  e.rating = s.rating as number | undefined;
  e.reviewCount = s.reviewCount as number | undefined;
  e.priceLevel = s.priceLevel as number | undefined;
  e.location = s.location as { lat: number; lng: number };
  e.detourKm = Number(s.detourKm ?? 0);
  e.detourMin = s.detourMin as number | undefined;
  e.tier = String(s.tier ?? 'primary');
  e.legLabel = s.legLabel as string | undefined;
  e.why = (s.why as Array<{ icon: string; text: string }>) ?? [];
  return e;
}
