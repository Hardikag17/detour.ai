import { Point } from '../google/geo.util';
import { PlaceCandidate } from '../google/places.service';

export interface RouteInfo {
  polyline: string;
  path: Point[];
  origin: Point;
  destination: Point;
  originName: string;
  destinationName: string;
  distanceKm: number;
  durationMin: number;
}

export interface CandidateWithGeo extends PlaceCandidate {
  detourKm: number;
  detourMin: number;
  tier: 'primary' | 'stretch';
  /** 0..1 position along the route, used for ordering + timing labels */
  fraction: number;
}

/** Mutable state shared by all tools within a single agent run. */
export class RunContext {
  detourKm: number;
  route?: RouteInfo;
  candidates = new Map<string, CandidateWithGeo>();

  constructor(detourKm: number) {
    this.detourKm = Math.max(1, detourKm);
  }

  get maxDetourKm(): number {
    return this.detourKm * 2;
  }
}
