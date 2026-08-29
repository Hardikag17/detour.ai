'use client';

import 'leaflet/dist/leaflet.css';
import { useEffect, useMemo } from 'react';
import L from 'leaflet';
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from 'react-leaflet';
import { CATEGORY_COLOR, MAP_TILE_ATTRIBUTION, MAP_TILE_URL } from '@detour/shared/helpers/constants';
import { decodePolyline } from '@/lib/polyline';
import { usePlanStore } from '@/store/planStore';
import { useUiStore } from '@/store/uiStore';

const endpointIcon = (kind: 'origin' | 'destination') =>
  L.divIcon({
    className: '',
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    html:
      kind === 'origin'
        ? '<div style="width:16px;height:16px;border-radius:50%;background:#18a06a;border:3px solid #fff;box-shadow:0 2px 8px rgba(20,30,60,.35)"></div>'
        : '<div style="width:16px;height:16px;border-radius:50%;background:#e2504a;border:3px solid #fff;box-shadow:0 2px 8px rgba(20,30,60,.35)"></div>',
  });

function stopIcon(index: number, category: string, tier: string, selected: boolean) {
  const color = CATEGORY_COLOR[category] ?? CATEGORY_COLOR.other;
  const dim = tier === 'stretch' && !selected;
  return L.divIcon({
    className: '',
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    html: `<div style="
      width:28px;height:28px;border-radius:50%;
      background:#fff;border:2.5px solid ${color};
      display:flex;align-items:center;justify-content:center;
      font:600 12px system-ui;color:${color};
      opacity:${dim ? 0.55 : 1};
      box-shadow:0 3px 10px rgba(20,30,60,${selected ? 0.4 : 0.18})${selected ? `,0 0 0 4px ${color}33` : ''};
    ">${index}</div>`,
  });
}

/** Pans to the selected stop when the user hovers/clicks a card in the results list. */
function PanToSelection({ positions }: { positions: Map<string, [number, number]> }) {
  const map = useMap();
  const selectedStopId = useUiStore((s) => s.selectedStopId);
  useEffect(() => {
    const pos = selectedStopId ? positions.get(selectedStopId) : undefined;
    if (pos) map.panTo(pos, { animate: true });
  }, [selectedStopId, positions, map]);
  return null;
}

/**
 * The live trip map: real street tiles (Leaflet + OSM/Carto, no API key)
 * with the route polyline and numbered stop markers overlaid.
 */
export default function RouteMap() {
  const route = usePlanStore((s) => s.route);
  const stops = usePlanStore((s) => s.stops);
  const { selectedStopId, selectStop } = useUiStore();

  const path = useMemo(
    () => (route ? decodePolyline(route.polyline).map((p): [number, number] => [p.lat, p.lng]) : []),
    [route],
  );

  const bounds = useMemo(() => {
    const pts: [number, number][] = [...path, ...stops.map((s): [number, number] => [s.location.lat, s.location.lng])];
    return pts.length >= 2 ? L.latLngBounds(pts) : null;
  }, [path, stops]);

  const stopPositions = useMemo(
    () => new Map(stops.map((s): [string, [number, number]] => [s.id, [s.location.lat, s.location.lng]])),
    [stops],
  );

  if (!route || path.length < 2 || !bounds) {
    return (
      <div className="flex h-full items-center justify-center bg-[#f7f9fd]">
        <div className="flex items-center gap-2 text-sm text-[#7a7f8f]">
          <span className="spin inline-block h-4 w-4 rounded-full border-2 border-[#c4d9ff] border-t-[#2b6bff]" />
          Mapping your route…
        </div>
      </div>
    );
  }

  return (
    <div className="isolate z-0 h-full w-full">
      <MapContainer
        bounds={bounds}
        boundsOptions={{ padding: [40, 40] }}
        scrollWheelZoom
        className="h-full w-full"
      >
        <TileLayer url={MAP_TILE_URL} attribution={MAP_TILE_ATTRIBUTION} />
        <PanToSelection positions={stopPositions} />

        {/* Route: soft casing under a solid line */}
        <Polyline positions={path} pathOptions={{ color: '#c4d9ff', weight: 9, opacity: 0.9 }} />
        <Polyline positions={path} pathOptions={{ color: '#2b6bff', weight: 4 }} />

        <Marker position={path[0]} icon={endpointIcon('origin')} />
        <Marker position={path[path.length - 1]} icon={endpointIcon('destination')} />

        {stops.map((stop, i) => (
          <Marker
            key={stop.id}
            position={[stop.location.lat, stop.location.lng]}
            icon={stopIcon(i + 1, stop.category, stop.tier, stop.id === selectedStopId)}
            eventHandlers={{ click: () => selectStop(stop.id) }}
          >
            <Popup>
              <strong>{stop.name}</strong>
              <br />
              {stop.rating ? `★ ${stop.rating} · ` : ''}
              {stop.detourKm} km off route
              {stop.legLabel ? ` · ${stop.legLabel}` : ''}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
