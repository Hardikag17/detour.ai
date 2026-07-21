'use client';

import { useMemo } from 'react';
import { decodePolyline, makeProjector } from '@/lib/polyline';
import { usePlanStore } from '@/store/planStore';
import { useUiStore } from '@/store/uiStore';

const W = 800;
const H = 440;

export const CATEGORY_COLOR: Record<string, string> = {
  cafe: '#2b6bff',
  restaurant: '#d85a30',
  hotel: '#6a5cff',
  waterfall: '#1d9e75',
  sight: '#b7791f',
  other: '#2b6bff',
};

/**
 * The live trip map: projects the real route polyline + stops into an SVG.
 * Works with zero API keys; swaps to Google Maps tiles when a browser key is added.
 */
export function RouteCanvas() {
  const route = usePlanStore((s) => s.route);
  const stops = usePlanStore((s) => s.stops);
  const { selectedStopId, selectStop } = useUiStore();

  const geometry = useMemo(() => {
    if (!route) return null;
    const path = decodePolyline(route.polyline);
    if (path.length < 2) return null;
    const all = [...path, ...stops.map((s) => s.location)];
    const proj = makeProjector(all, W, H, 56);
    const d = path
      .map((p, i) => `${i === 0 ? 'M' : 'L'}${proj.x(p).toFixed(1)} ${proj.y(p).toFixed(1)}`)
      .join(' ');
    return { proj, d, start: path[0], end: path[path.length - 1] };
  }, [route, stops]);

  if (!route || !geometry) {
    return (
      <div className="flex h-full items-center justify-center bg-[#f7f9fd]">
        <div className="flex items-center gap-2 text-sm text-[#7a7f8f]">
          <span className="spin inline-block h-4 w-4 rounded-full border-2 border-[#c4d9ff] border-t-[#2b6bff]" />
          Mapping your route…
        </div>
      </div>
    );
  }

  const { proj, d, start, end } = geometry;

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#f7f9fd]">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-full w-full" preserveAspectRatio="xMidYMid meet">
        {/* Subtle grid so it reads as a map */}
        <g stroke="#eceff6" strokeWidth="1.5">
          {Array.from({ length: 9 }, (_, i) => (
            <path key={`v${i}`} d={`M${(i + 1) * (W / 10)} 0 V ${H}`} />
          ))}
          {Array.from({ length: 5 }, (_, i) => (
            <path key={`h${i}`} d={`M0 ${(i + 1) * (H / 6)} H ${W}`} />
          ))}
        </g>

        {/* Route */}
        <path
          d={d}
          fill="none"
          stroke="#c4d9ff"
          strokeWidth="9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d={d}
          fill="none"
          stroke="#2b6bff"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="2 13"
          className="route-dash"
        />

        {/* Origin / destination */}
        <circle
          cx={proj.x(start)}
          cy={proj.y(start)}
          r="8"
          fill="#18a06a"
          stroke="#fff"
          strokeWidth="2.5"
        />
        <g transform={`translate(${proj.x(end)},${proj.y(end)})`}>
          <path
            d="M0 -14 C 7.5 -14 12 -8.5 12 -2 C 12 5.5 0 15 0 15 C 0 15 -12 5.5 -12 -2 C -12 -8.5 -7.5 -14 0 -14 Z"
            fill="#e2504a"
            stroke="#fff"
            strokeWidth="2"
          />
          <circle cy="-2" r="3.8" fill="#fff" />
        </g>

        {/* Stops, numbered in route order */}
        {stops.map((stop, i) => {
          const x = proj.x(stop.location);
          const y = proj.y(stop.location);
          const isStretch = stop.tier === 'stretch';
          const selected = selectedStopId === stop.id;
          const color = isStretch ? '#b4b2a9' : (CATEGORY_COLOR[stop.category] ?? '#2b6bff');
          return (
            <g
              key={stop.id}
              transform={`translate(${x},${y})`}
              onClick={() => selectStop(selected ? null : stop.id)}
              className="cursor-pointer"
            >
              {selected && <circle r="16" fill={color} opacity="0.18" />}
              <circle
                r={selected ? 11 : 9}
                fill={color}
                stroke="#fff"
                strokeWidth="2.5"
                opacity={isStretch && !selected ? 0.75 : 1}
              />
              <text
                textAnchor="middle"
                dy="3.5"
                fontSize="10"
                fontWeight="600"
                fill="#fff"
                style={{ pointerEvents: 'none' }}
              >
                {i + 1}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Trip ribbon */}
      <div className="absolute top-3 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full border border-[#e0e4ee] bg-white/95 px-3.5 py-1.5 text-xs text-[#42465a] shadow-[0_4px_16px_rgba(20,30,60,0.1)] backdrop-blur">
        <span className="h-2 w-2 rounded-full bg-[#18a06a]" />
        <span className="max-w-32 truncate font-medium text-[#0c0e14]">
          {route.originName.split(',')[0]}
        </span>
        <span className="text-[#a2a6b4]">→</span>
        <span className="max-w-32 truncate font-medium text-[#0c0e14]">
          {route.destinationName.split(',')[0]}
        </span>
        <span className="text-[#a2a6b4]">·</span>
        <span>{route.distanceKm} km</span>
        <span className="text-[#a2a6b4]">·</span>
        <span>
          {Math.floor(route.durationMin / 60)}h {route.durationMin % 60}m
        </span>
      </div>
    </div>
  );
}
