/** A "Try" suggestion chip: label shown, prompt submitted, icon by name. */
export interface TripRecommendation {
  icon: string;
  label: string;
  prompt: string;
}

/** Lifecycle of a plan on the client. */
export type PlanStatus = 'idle' | 'streaming' | 'ready' | 'error';

