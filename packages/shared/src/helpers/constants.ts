import type { TripRecommendation } from './interfaces';

/** Default GraphQL endpoint when NEXT_PUBLIC_API_URL is not set. */
export const DEFAULT_API_URL = 'http://localhost:4000/graphql';

/** Detour tolerance: the user picks R km; we search out to R × STRETCH_MULTIPLIER. */
export const DETOUR = {
  MIN_KM: 1,
  MAX_KM: 20,
  DEFAULT_KM: 5,
  STRETCH_MULTIPLIER: 2,
} as const;

export const SEARCHBAR_PLACEHOLDER = 'Famous cafés on the way to Varkala beach…';
export const REFINE_PLACEHOLDER = 'Refine it — "make it vegetarian, avoid tolls"…';

/** "Try" suggestion chips shown under the idle search bar. */
export const DEFAULT_RECOMMENDATIONS: TripRecommendation[] = [
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

/** Free, no-key map tiles straight from OpenStreetMap (attribution required). */
export const MAP_TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
export const MAP_TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

/** Map marker + card accent color per stop category. */
export const CATEGORY_COLOR: Record<string, string> = {
  cafe: '#2b6bff',
  restaurant: '#d85a30',
  hotel: '#6a5cff',
  waterfall: '#1d9e75',
  sight: '#b7791f',
  other: '#2b6bff',
};

/** Rotating phrases in the tagline: "We'll find ___". */
export const ROTATING_WORDS = [
  'hidden gems.',
  'local favorites.',
  'scenic detours.',
  'chai stops.',
  'roadside dhabas.',
  'chai-sutta breaks.',
  'worthwhile detours.',
  'unforgettable views.',
];
