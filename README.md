<p align="center">
  <img src="apps/web/public/assets/logo.svg" width="96" height="96" alt="detour.ai logo" />
</p>

<h1 align="center">detour.ai</h1>

<p align="center">
  An AI agent that finds everything worth stopping for along your driving route — within the detour you're willing to take.
</p>

<p align="center">
  <a href="#why-detourai">Why</a> ·
  <a href="#highlights">Highlights</a> ·
  <a href="#how-the-agent-works">How it works</a> ·
  <a href="#tech-stack">Tech stack</a> ·
  <a href="#quick-start">Quick start</a>
</p>

<p align="center">
  <i>Vibecoded over a weekend as a side project — for me, and for everyone learning agentic AI.</i>
</p>

![landing](./snips/landing.png)

## Why detour.ai?

Every road trip I've done — Bengaluru → Goa, Kochi → Varkala — the best parts were never the destination. They were the roadside dhaba, the waterfall 3 km off the highway, the viewpoint nobody mentions. Planning those stops today means juggling half a dozen map searches and comparing everything by hand.

detour.ai replaces that with one sentence:

> "Driving Bangalore to Goa. I want a pet-friendly café for breakfast, one waterfall that's not crowded, and a hotel near the destination under 4k."

An LLM agent parses the intent, splits the route into legs, searches real places along the actual highway polyline, weighs rating against detour cost, and returns a plan where every stop explains itself. It was also my excuse to learn agentic AI properly — tool orchestration, streamed reasoning, and conversational re-planning rather than a thin wrapper over a chat completion.

### Highlights

- Natural-language trip briefs — the agent infers stop types, no category filters.
- **Detour budget** — pick R km; the agent searches out to 2R and marks the far finds as muted "stretch" picks with their exact extra distance.
- Live reasoning — every tool call streams into a "How I planned this" trace as it happens.
- **"Why this stop?"** — each recommendation carries 2–3 concrete reasons: detour cost, rating and volume, and how it fits the request.
- Conversational refinement — "actually make it vegetarian, avoid tolls" re-plans in place, keeping earlier constraints.
- Saved trips — plans persist to Postgres; one click in the sidebar reloads a full plan instantly with no agent re-run.
- Real map — Leaflet over OpenStreetMap tiles with the route polyline and numbered, category-colored markers.
- Runs with zero API keys — a scripted demo agent drives the same tools against mock data on a fresh clone.

## How the agent works

The LLM is the planner, not a formatter. It receives four typed tools and sequences them itself:

```text
getRoute          geocode endpoints, fetch the driving polyline
splitIntoLegs     divide the drive; assign each need to a leg
searchAlongRoute  Places search at sample points along one leg (called in parallel per need)
finalizeStops     commit chosen stops with per-stop reasons
```

Tool events stream through a GraphQL subscription served over SSE, so the frontend renders each decision the moment it is made. Detour distance is computed geometrically against the decoded polyline; results within the chosen radius rank as primary and the rest up to 2× as stretch.

![results](./snips/results.png)

Every recommendation defends itself:

![why-this-stop](./snips/why-this-stop.png)

## Tech stack

| Layer | Technology |
| --- | --- |
| Agent | Vercel AI SDK with Gemini (Claude via one env var) |
| Maps data | Google Routes API, Places API (New), Geocoding API |
| Backend | NestJS, GraphQL Yoga (subscriptions over SSE), TypeORM |
| Contract | Code-first schema (Nest decorators → `schema.gql`) + GraphQL Codegen for frontend types |
| Frontend | Next.js 15, React Query, Zustand, Tailwind CSS |
| Map | Leaflet + OpenStreetMap tiles (no key required) |
| Storage | PostgreSQL for saved trips, Redis for API-response caching |
| Tooling | pnpm workspaces, Turborepo, Docker Compose |

## Quick start

### Prerequisites

- Node.js 20 or newer, pnpm 9
- Docker (for Postgres and Redis; optional — the app runs stateless without them)

```bash
git clone https://github.com/Hardikag17/detour.ai.git
cd detour.ai
pnpm install
docker compose up -d postgres redis
pnpm dev
```

Web starts on `http://localhost:3000`, API with GraphiQL on `http://localhost:4000/graphql`.

The FE/BE contract is fully generated — no hand-maintained type copies: the API writes `schema.gql` from its decorated classes on every boot, and `pnpm codegen` validates the query documents against it and emits the frontend types (a typo'd field fails the build, not the user). Run it after changing the schema or any query:

```bash
pnpm codegen
```

The app works with no keys at all (demo mode: same UI, scripted agent, mock places). For live data, create `apps/api/.env`:

```bash
GOOGLE_MAPS_API_KEY=...   # Routes API, Places API (New), Geocoding API enabled
GEMINI_API_KEY=...        # free tier at aistudio.google.com
DATABASE_URL=postgres://detour:detour@localhost:5432/detour
REDIS_URL=redis://localhost:6379
```

## Repository layout

```text
apps/web/          Next.js frontend — landing, sidebar, live map, results
apps/api/          NestJS backend — agent loop, tools, Google services, persistence
packages/shared/   Types, GraphQL documents, and constants shared by both apps
snips/             README screenshots
docker-compose.yml Postgres + Redis (dev)
```

## Project status

Working end to end; under active development. Next up: a public deployment, pgvector-based trip memory, place photos, and shareable plan links.
