import type { SVGProps } from 'react';

const PATHS: Record<string, React.ReactNode> = {
  route: (
    <>
      <circle cx="6" cy="19" r="2" />
      <circle cx="18" cy="5" r="2" />
      <path d="M12 19h4.5a3.5 3.5 0 0 0 0-7h-8a3.5 3.5 0 0 1 0-7H12" />
    </>
  ),
  search: (
    <>
      <circle cx="10" cy="10" r="7" />
      <path d="m21 21-6-6" />
    </>
  ),
  arrowUp: <path d="M12 19V5m0 0-6 6m6-6 6 6" />,
  detour: (
    <path d="M16 3h5v5m0-5L11 13m-3-9H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
  ),
  coffee: (
    <>
      <path d="M3 10h13v4a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5v-4Z" />
      <path d="M16 11h1.5a2.5 2.5 0 0 1 0 5H16M7 3.5c0 1-.5 1.5 0 2.5M11 3.5c0 1-.5 1.5 0 2.5" />
    </>
  ),
  kitchen: (
    <>
      <path d="M6 3v8m4-8v8M8 3v18M8 11c1.5 0 2-1 2-2M6 11c-1.5 0-2-1-2-2" />
      <path d="M17 3c-1.5 2-2 4-2 6 0 1.5.5 2 2 2v10" />
    </>
  ),
  mountain: <path d="m3 20 6.5-12 4 7 2.5-4 5 9H3Z" />,
  monument: (
    <>
      <path d="M5 21h14M7 21V10l5-6 5 6v11" />
      <path d="M10 21v-4a2 2 0 0 1 4 0v4" />
    </>
  ),
  droplet: <path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11Z" />,
  bed: (
    <>
      <path d="M3 7v11m0-4h18v4M3 11h18a0 0 0 0 1 0 0v3" />
      <circle cx="7" cy="9.5" r="1.5" />
    </>
  ),
  tent: <path d="m3 20 9-15 9 15h-6l-3-6-3 6H3Z" />,
  star: (
    <path d="m12 3 2.7 5.6 6.1.8-4.5 4.3 1.1 6.1L12 16.9l-5.4 2.9 1.1-6.1L3.2 9.4l6.1-.8L12 3Z" />
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  paw: (
    <>
      <circle cx="7" cy="8" r="1.6" />
      <circle cx="12" cy="6" r="1.6" />
      <circle cx="17" cy="8" r="1.6" />
      <path d="M8 15.5c0-2 1.8-3.5 4-3.5s4 1.5 4 3.5-1.4 4-4 4-4-2-4-4Z" />
    </>
  ),
  leaf: <path d="M5 19c0-8 4-14 14-14 0 10-6 14-11 14m-3 0c0-4 2-8 6-10" />,
  users: (
    <>
      <circle cx="9" cy="8" r="3" />
      <path d="M4 20c0-3 2.2-5 5-5s5 2 5 5M15 5.5a3 3 0 0 1 0 5M17.5 15.5c1.8.6 3 2.2 3 4.5" />
    </>
  ),
  quote: (
    <path d="M8 11c-1.5 0-2.5-1-2.5-2.5S6.5 6 8 6s2.5 1 2.5 2.5c0 3.5-1.5 5.5-4 6.5m9.5-4c-1.5 0-2.5-1-2.5-2.5S14.5 6 16 6s2.5 1 2.5 2.5c0 3.5-1.5 5.5-4 6.5" />
  ),
  check: <path d="m5 13 4 4L19 7" />,
  loader: (
    <path d="M12 3v3m6.4-.4-2.1 2.1M21 12h-3m.4 6.4-2.1-2.1M12 21v-3m-6.4.4 2.1-2.1M3 12h3m-.4-6.4 2.1 2.1" />
  ),
  mapPin: (
    <>
      <path d="M12 21s-7-5.8-7-11a7 7 0 0 1 14 0c0 5.2-7 11-7 11Z" />
      <circle cx="12" cy="10" r="2.5" />
    </>
  ),
  sparkle: (
    <path d="M12 4l1.8 4.6L18 10l-4.2 1.4L12 16l-1.8-4.6L6 10l4.2-1.4L12 4ZM19 16l.9 2.1L22 19l-2.1.9L19 22l-.9-2.1L16 19l2.1-.9L19 16Z" />
  ),
  message: <path d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H9l-5 4V6Z" />,
};

export type IconName = keyof typeof PATHS;

export function Icon({
  name,
  size = 16,
  strokeWidth = 1.8,
  ...props
}: { name: string; size?: number; strokeWidth?: number } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {PATHS[name] ?? PATHS.sparkle}
    </svg>
  );
}

export const CATEGORY_ICON: Record<string, string> = {
  cafe: 'coffee',
  restaurant: 'kitchen',
  hotel: 'bed',
  waterfall: 'droplet',
  sight: 'monument',
  other: 'mapPin',
};

export const WHY_ICON: Record<string, string> = {
  detour: 'detour',
  star: 'star',
  clock: 'clock',
  paw: 'paw',
  leaf: 'leaf',
  users: 'users',
  quote: 'quote',
};
