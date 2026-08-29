import { tool } from 'ai';
import { z } from 'zod';
import {
  decodePolyline,
  distanceToPathKm,
  fractionAlongPath,
  samplePath,
} from '../google/geo.util';
import { DirectionsService } from '../google/directions.service';
import { GeocodingService } from '../google/geocoding.service';
import { PlacesService } from '../google/places.service';
import { AGENT, ROUTE } from '../config';
import { CandidateWithGeo, RunContext } from './run-context';

export interface AgentServices {
  directions: DirectionsService;
  geocoding: GeocodingService;
  places: PlacesService;
}

export function buildTools(services: AgentServices, ctx: RunContext) {
  return {
    getRoute: tool({
      description:
        'Geocode origin/destination and fetch the driving route. Call this first, exactly once (again only if avoidTolls changes).',
      inputSchema: z.object({
        origin: z.string().describe('Origin place name, e.g. "Bangalore"'),
        destination: z.string().describe('Destination place name, e.g. "Goa"'),
        avoidTolls: z.boolean().optional().default(false),
      }),
      execute: async ({ origin, destination, avoidTolls }) => {
        const [o, d] = await Promise.all([
          services.geocoding.geocode(origin),
          services.geocoding.geocode(destination),
        ]);
        if (!o || !d) {
          return {
            error: `Could not locate ${!o ? origin : destination}. Ask the user to clarify.`,
          };
        }
        const route = await services.directions.route(o.point, d.point, { avoidTolls });
        ctx.route = {
          polyline: route.polyline,
          path: decodePolyline(route.polyline),
          origin: o.point,
          destination: d.point,
          originName: o.name,
          destinationName: d.name,
          distanceKm: route.distanceKm,
          durationMin: route.durationMin,
        };
        return {
          originName: o.name,
          destinationName: d.name,
          distanceKm: route.distanceKm,
          durationMin: route.durationMin,
          avoidTolls: Boolean(avoidTolls),
        };
      },
    }),

    splitIntoLegs: tool({
      description:
        'Divide the route into named legs and assign each user need to a leg. Call after getRoute.',
      inputSchema: z.object({
        legs: z
          .array(
            z.object({
              label: z
                .string()
                .describe('e.g. "Breakfast stop", "Midday break", "Near destination"'),
              need: z.string().describe('What the user wants there, e.g. "pet-friendly cafe"'),
              startFraction: z.number().min(0).max(1),
              endFraction: z.number().min(0).max(1),
            }),
          )
          .min(1)
          .max(6),
      }),
      execute: async ({ legs }) => {
        if (!ctx.route) return { error: 'Call getRoute first.' };
        const totalMin = ctx.route.durationMin;
        return {
          legs: legs.map((leg) => ({
            ...leg,
            etaLabel: etaLabel(totalMin, (leg.startFraction + leg.endFraction) / 2),
          })),
        };
      },
    }),

    searchAlongRoute: tool({
      description:
        'Search places along a stretch of the route for one need. Returns candidates with detour distance and tier (primary = within tolerance, stretch = up to 2x).',
      inputSchema: z.object({
        need: z.string().describe('The user need this search serves, e.g. "uncrowded waterfall"'),
        keyword: z
          .string()
          .describe('Concise search keyword, e.g. "waterfall" or "pet friendly cafe"'),
        startFraction: z.number().min(0).max(1).default(0),
        endFraction: z.number().min(0).max(1).default(1),
      }),
      execute: async ({ need, keyword, startFraction, endFraction }) => {
        if (!ctx.route) return { error: 'Call getRoute first.' };
        const { path, durationMin } = ctx.route;
        const lo = Math.min(startFraction, endFraction);
        const hi = Math.max(startFraction, endFraction);
        const startIdx = Math.floor(lo * (path.length - 1));
        const endIdx = Math.ceil(hi * (path.length - 1));
        const segment = path.slice(startIdx, endIdx + 1);
        if (segment.length < 2) return { error: 'Leg segment too short.' };

        const samples = samplePath(segment, ROUTE.SAMPLE_INTERVAL_KM, ROUTE.MAX_SAMPLES_PER_LEG);
        const radiusM = ctx.maxDetourKm * 1000;
        const perSample = await Promise.all(
          samples.map((pt, i) => services.places.searchNear(pt, keyword, radiusM, startIdx + i)),
        );

        const seen = new Set<string>();
        const out: CandidateWithGeo[] = [];
        for (const batch of perSample) {
          for (const cand of batch) {
            if (seen.has(cand.placeId)) continue;
            seen.add(cand.placeId);
            const detourKm = round1(distanceToPathKm(cand.location, path));
            if (detourKm > ctx.maxDetourKm) continue;
            const fraction = fractionAlongPath(cand.location, path);
            const enriched: CandidateWithGeo = {
              ...cand,
              detourKm,
              detourMin: Math.max(1, Math.round((detourKm / ROUTE.DETOUR_SPEED_KMH) * 60 * 2)),
              tier: detourKm <= ctx.detourKm ? 'primary' : 'stretch',
              fraction: round3(fraction),
            };
            ctx.candidates.set(cand.placeId, enriched);
            out.push(enriched);
          }
        }
        out.sort((a, b) => a.detourKm - b.detourKm);
        return {
          need,
          keyword,
          // Strip `location` (noise for the LLM); everything else goes through as-is.
          candidates: out.slice(0, AGENT.MAX_CANDIDATES_PER_NEED).map(({ location: _location, ...c }) => ({
            ...c,
            etaLabel: etaLabel(durationMin, c.fraction),
          })),
        };
      },
    }),

    finalizeStops: tool({
      description:
        'Submit your final chosen stops with "why" reasons. Call ONCE, after all searches. Order does not matter; stops are sorted along the route automatically.',
      inputSchema: z.object({
        stops: z
          .array(
            z.object({
              placeId: z.string(),
              legLabel: z.string().describe('e.g. "Breakfast stop"'),
              why: z
                .array(
                  z.object({
                    icon: z.enum(['detour', 'star', 'clock', 'paw', 'leaf', 'users', 'quote']),
                    text: z.string().max(120),
                  }),
                )
                .min(2)
                .max(3),
            }),
          )
          .min(1)
          .max(6),
      }),
      execute: async ({ stops }) => {
        if (!ctx.route) return { error: 'Call getRoute first.' };
        const durationMin = ctx.route.durationMin;
        const resolved = stops
          .map((pick) => {
            const cand = ctx.candidates.get(pick.placeId);
            if (!cand) return null;
            return {
              ...cand,
              legLabel: `${pick.legLabel} · ${etaLabel(durationMin, cand.fraction)}`,
              why: pick.why,
            };
          })
          .filter((s) => s !== null)
          .sort((a, b) => a.fraction - b.fraction);
        return { stops: resolved, count: resolved.length };
      },
    }),
  };
}

function etaLabel(totalDurationMin: number, fraction: number): string {
  const min = Math.round(totalDurationMin * fraction);
  if (min < 60) return `~${min}m in`;
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return m > 0 ? `~${h}h ${m}m in` : `~${h}h in`;
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function round3(n: number): number {
  return Math.round(n * 1000) / 1000;
}
