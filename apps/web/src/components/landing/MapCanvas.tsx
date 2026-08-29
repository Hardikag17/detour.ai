'use client';

import { Icon } from '@/lib/icons';

const ROUTE_D =
  'M70 470 L236 470 Q250 470 250 456 L250 384 Q250 370 264 370 L376 370 Q390 370 390 356 L390 264 Q390 250 404 250 L516 250 Q530 250 530 236 L530 144 Q530 130 544 130 L606 130 Q620 130 620 116 L620 70';

const POIS: Array<{
  left: string;
  top: string;
  color: string;
  icon: string;
  label?: string;
  delay: string;
}> = [
  { left: '26.8%', top: '84%', color: '#d85a30', icon: 'kitchen', label: 'Dhaba', delay: '0s' },
  { left: '39.4%', top: '76.5%', color: '#2b6bff', icon: 'coffee', label: 'Café', delay: '0.5s' },
  { left: '47.8%', top: '64%', color: '#1d9e75', icon: 'mountain', delay: '1s' },
  { left: '63%', top: '60%', color: '#6a5cff', icon: 'monument', label: 'Fort', delay: '1.5s' },
  { left: '80%', top: '32%', color: '#2b6bff', icon: 'droplet', label: 'River view', delay: '2s' },
  { left: '86.5%', top: '20.5%', color: '#d85a30', icon: 'bed', delay: '2.4s' },
];

/**
 * The living street-map hero. Static scenery (blocks/park/river/roads) is a
 * cached asset — public/assets/map-grid.svg — stretched behind the animated
 * layer (route, driving marker, POI pins), which stays inline for CSS control
 * and React interactivity.
 */
export function MapCanvas() {
  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      {/* Faded drifting layer: static grid asset + animated route on top */}
      <div className="map-drift absolute inset-0 opacity-60">
        {/* Small screens: one stretched scene. Large screens: tile at natural
            street scale so the map doesn't look zoomed in. */}
        <div className="absolute inset-0 bg-[url(/assets/map-grid.svg)] bg-[length:100%_100%] lg:bg-[length:830px_650px] lg:bg-repeat" />
        <svg
          viewBox="0 0 690 540"
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full"
        >
          {/* The route: base + flowing dash layers, following the grid with 90° turns */}
          <path
            id="hero-route"
            d={ROUTE_D}
            fill="none"
            stroke="#c4d9ff"
            strokeWidth="11"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="route-casing"
          />
          <path
            d={ROUTE_D}
            fill="none"
            stroke="#2b6bff"
            strokeWidth="4.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="2 15"
            className="route-dash"
          />
          <path
            d={ROUTE_D}
            fill="none"
            stroke="#6a5cff"
            strokeWidth="4.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="15 28"
            strokeDashoffset="22"
            className="route-dash-2"
            opacity="0.5"
          />

          {/* Marker driving the route */}
          <circle r="15" fill="#2b6bff" opacity="0.2" className="traveler-halo">
            <animateMotion dur="6s" repeatCount="indefinite" rotate="auto">
              <mpath href="#hero-route" />
            </animateMotion>
          </circle>
          <circle r="7" fill="#2b6bff" stroke="#fff" strokeWidth="2.5" className="traveler-dot">
            <animateMotion dur="6s" repeatCount="indefinite" rotate="auto">
              <mpath href="#hero-route" />
            </animateMotion>
          </circle>

          {/* Origin + destination */}
          <circle cx="70" cy="470" r="8.5" fill="#18a06a" strokeWidth="2.5" className="origin-dot" stroke="#fff" />
          <g transform="translate(620,70)" className="dest-pin">
            <path
              d="M0 -15 C 8 -15 13 -9 13 -2 C 13 6 0 16 0 16 C 0 16 -13 6 -13 -2 C -13 -9 -8 -15 0 -15 Z"
              fill="#e2504a"
              stroke="#fff"
              strokeWidth="2"
            />
            <circle cy="-2" r="4" fill="#fff" />
          </g>
        </svg>
      </div>

      {/* POI pins — full opacity layer so they pop against the faded map */}
      <div className="map-drift pointer-events-none absolute inset-0">
        {POIS.map((poi) => (
          <div
            key={`${poi.left}-${poi.icon}`}
            className="poi-pin absolute z-[2] flex h-[26px] w-[26px] items-center justify-center rounded-full border border-[#e3e6ef] bg-white shadow-[0_3px_11px_rgba(20,30,60,0.12)]"
            style={{ left: poi.left, top: poi.top, color: poi.color }}
          >
            <span
              className="poi-ring absolute -inset-1 rounded-full border-2 border-current opacity-0"
              style={{ animationDelay: poi.delay }}
            />
            <Icon name={poi.icon} size={13} />
            {poi.label && (
              <span className="absolute top-[29px] left-1/2 -translate-x-1/2 rounded-md border border-[#ecedf3] bg-white/90 px-1.5 py-px text-[10px] whitespace-nowrap text-[#4a4e60] shadow-[0_2px_6px_rgba(20,30,60,0.08)]">
                {poi.label}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Ambient glows */}
      <div className="glow-a pointer-events-none absolute -top-[70px] left-1/2 h-[300px] w-[460px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(43,107,255,0.12),rgba(43,107,255,0)_68%)] blur-[10px]" />
      <div className="glow-b pointer-events-none absolute -right-10 -bottom-[60px] h-[320px] w-[320px] rounded-full bg-[radial-gradient(circle_at_center,rgba(120,90,255,0.09),rgba(120,90,255,0)_68%)] blur-[8px]" />
    </div>
  );
}
