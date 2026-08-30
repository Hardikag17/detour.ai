/**
 * Server-side tuning knobs in one place. Cross-app contracts (event shapes,
 * UI constants) live in packages/shared; these are API internals only.
 */

/** Where GraphQL is served. Web's DEFAULT_API_URL (packages/shared) must match. */
export const API_PATH = '/api';

export const AGENT = {
  CLAUDE_MODEL: 'claude-sonnet-4-5',
  GEMINI_MODEL: 'gemini-3.6-flash',
  /** Max reason→tool→reason iterations per plan. */
  MAX_STEPS: 14,
  /** Candidates surfaced to the LLM per search (keeps its context focused). */
  MAX_CANDIDATES_PER_NEED: 8,
} as const;

export const ROUTE = {
  /** Distance between Places-search sample points along a leg. */
  SAMPLE_INTERVAL_KM: 20,
  /** Cap on sample points per leg (bounds Google API cost). */
  MAX_SAMPLES_PER_LEG: 6,
  /** Assumed off-highway speed for detour-minutes estimates. */
  DETOUR_SPEED_KMH: 40,
} as const;

export const PLACES = {
  MAX_RESULTS: 8,
  /** Places API (New) rejects locationBias radii above 50km. */
  RADIUS_CAP_M: 50_000,
} as const;

/** Cache TTLs (seconds), chosen by how fast each data source changes. */
export const CACHE_TTL_S = {
  GEOCODE: 30 * 24 * 3600,
  ROUTE: 24 * 3600,
  PLACES: 6 * 3600,
} as const;
