import { PlanEventPayload, PlanSummaryEvent } from '../graphql/types/plan.types';
import { routeEvent, step, stopEvent } from './stream-bridge';
import { AgentServices, buildTools } from './tools';
import { RunContext } from './run-context';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

type WhyIcon = 'detour' | 'star' | 'clock' | 'paw' | 'leaf' | 'users' | 'quote';

interface ParsedNeed {
  need: string;
  keyword: string;
  legLabel: string;
  start: number;
  end: number;
}

/**
 * Keyless demo mode: drives the SAME tools the real agent uses, with a scripted
 * "reasoning" sequence — so the full UI works before any API keys exist.
 */
export async function* runMockAgent(
  prompt: string,
  ctx: RunContext,
  services: AgentServices,
  planId: string,
): AsyncGenerator<PlanEventPayload> {
  const tools = buildTools(services, ctx);
  const { origin, destination } = parseEndpoints(prompt);
  const needs = parseNeeds(prompt);

  yield step('route', `Mapping your route ${origin} → ${destination}`, 'active');
  await sleep(500);
  const routeRes = (await tools.getRoute.execute!(
    { origin, destination, avoidTolls: /avoid.*toll/i.test(prompt) },
    toolCallCtx(),
  )) as Record<string, unknown>;
  if (routeRes.error || !ctx.route) {
    yield { message: String(routeRes.error ?? 'Could not map that route.'), code: 'ROUTE_ERROR' };
    return;
  }
  yield step('route', `Mapped ${routeRes.originName} → ${routeRes.destinationName}`, 'done');
  yield routeEvent(ctx);
  await sleep(400);

  yield step('legs', 'Splitting the drive into legs', 'active');
  await sleep(500);
  yield step('legs', 'Splitting the drive into legs', 'done');

  const picks: Array<{
    placeId: string;
    legLabel: string;
    why: Array<{ icon: WhyIcon; text: string }>;
  }> = [];
  for (const need of needs) {
    yield step(`search-${need.keyword}`, `Searching: ${need.need}`, 'active');
    await sleep(600);
    const res = (await tools.searchAlongRoute.execute!(
      {
        need: need.need,
        keyword: need.keyword,
        startFraction: need.start,
        endFraction: need.end,
      },
      toolCallCtx(),
    )) as { candidates?: Array<Record<string, any>> };
    const candidates = res.candidates ?? [];
    yield step(
      `search-${need.keyword}`,
      `Searching: ${need.need} · ${candidates.length} candidates`,
      'done',
    );
    const chosen = chooseCandidates(candidates);
    for (const c of chosen) {
      picks.push({ placeId: c.placeId, legLabel: need.legLabel, why: mockWhy(c, need) });
    }
  }

  yield step('finalize', 'Weighing options & writing reasons', 'active');
  await sleep(700);
  const finalRes = (await tools.finalizeStops.execute!({ stops: picks }, toolCallCtx())) as {
    stops?: Array<Record<string, unknown>>;
  };
  yield step('finalize', 'Weighing options & writing reasons', 'done');

  let i = 0;
  for (const s of finalRes.stops ?? []) {
    i++;
    await sleep(350);
    yield stopEvent(s, i);
  }

  const summary = new PlanSummaryEvent();
  summary.planId = planId;
  summary.stopCount = i;
  summary.summary = `Planned ${i} stops between ${ctx.route.originName.split(',')[0]} and ${ctx.route.destinationName.split(',')[0]} — each within your detour budget, with the trade-offs explained. (Demo mode: add API keys for live data.)`;
  yield summary;
}

function toolCallCtx() {
  return { toolCallId: 'mock', messages: [] } as never;
}

function parseEndpoints(prompt: string): { origin: string; destination: string } {
  const m =
    prompt.match(
      /(?:from\s+)?([A-Za-z ]{3,}?)\s+(?:to|→|->)\s+([A-Za-z ]{3,}?)(?=[.,;!?]|\s+i\b|\s+we\b|\s+and\b|$)/i,
    ) ?? prompt.match(/driving\s+([A-Za-z ]{3,}?)\s+(?:to|→|->)\s+([A-Za-z ]{3,})/i);
  if (m) return { origin: m[1].trim(), destination: m[2].trim() };
  return { origin: 'Bangalore', destination: 'Goa' };
}

function parseNeeds(prompt: string): ParsedNeed[] {
  const p = prompt.toLowerCase();
  const needs: ParsedNeed[] = [];
  if (/(cafe|coffee|breakfast)/.test(p)) {
    needs.push({
      need: /pet/.test(p) ? 'pet-friendly breakfast café' : 'breakfast café',
      keyword: /pet/.test(p) ? 'pet friendly cafe' : 'cafe',
      legLabel: 'Breakfast stop',
      start: 0.05,
      end: 0.35,
    });
  }
  if (/(waterfall|falls)/.test(p)) {
    needs.push({
      need: /crowd/.test(p) ? 'uncrowded waterfall' : 'waterfall stop',
      keyword: 'waterfall',
      legLabel: 'Midday stop',
      start: 0.35,
      end: 0.7,
    });
  }
  if (/(dhaba|lunch|thali|restaurant|food|veg)/.test(p) && !/(cafe|coffee)/.test(p)) {
    needs.push({
      need: /veg/.test(p) ? 'vegetarian lunch spot' : 'lunch stop',
      keyword: /veg/.test(p) ? 'vegetarian dhaba' : 'dhaba restaurant',
      legLabel: 'Lunch stop',
      start: 0.35,
      end: 0.65,
    });
  }
  if (/(hotel|stay|resort|night)/.test(p)) {
    needs.push({
      need: /4k|budget|under/.test(p) ? 'budget hotel near destination' : 'hotel near destination',
      keyword: 'hotel',
      legLabel: 'Overnight stay',
      start: 0.8,
      end: 1,
    });
  }
  if (/(fort|temple|monument|scenic|view|sight)/.test(p)) {
    needs.push({
      need: 'scenic sight en route',
      keyword: /fort/.test(p) ? 'fort' : 'tourist attraction',
      legLabel: 'Sight stop',
      start: 0.3,
      end: 0.75,
    });
  }
  if (needs.length === 0) {
    needs.push(
      { need: 'great café stop', keyword: 'cafe', legLabel: 'Coffee break', start: 0.1, end: 0.4 },
      {
        need: 'scenic stop',
        keyword: 'tourist attraction',
        legLabel: 'Sight stop',
        start: 0.4,
        end: 0.8,
      },
    );
  }
  return needs.slice(0, 4);
}

function chooseCandidates(candidates: Array<Record<string, any>>): Array<Record<string, any>> {
  if (candidates.length === 0) return [];
  const primary = candidates.filter((c) => c.tier === 'primary');
  const stretch = candidates.filter((c) => c.tier === 'stretch');
  const byScore = (a: Record<string, any>, b: Record<string, any>) =>
    (b.rating ?? 0) - (a.rating ?? 0) || a.detourKm - b.detourKm;
  primary.sort(byScore);
  stretch.sort(byScore);
  const picks = primary.slice(0, 1);
  if (stretch.length > 0 && (stretch[0].rating ?? 0) >= 4.5) picks.push(stretch[0]);
  return picks;
}

function mockWhy(c: Record<string, any>, need: ParsedNeed): Array<{ icon: WhyIcon; text: string }> {
  const why: Array<{ icon: WhyIcon; text: string }> = [];
  why.push({
    icon: 'detour',
    text:
      c.tier === 'primary'
        ? `Only ${c.detourKm} km off your route — barely a detour`
        : `${c.detourKm} km off-route — a stretch, but worth it`,
  });
  if (c.rating) {
    why.push({
      icon: 'star',
      text: `${c.rating}★ from ${formatCount(c.reviewCount)} reviews`,
    });
  }
  why.push({
    icon: 'clock',
    text: `Lands ${c.etaLabel ?? 'mid-drive'} — right for a ${need.legLabel.toLowerCase()}`,
  });
  return why.slice(0, 3);
}

function formatCount(n?: number): string {
  if (!n) return 'few';
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}
