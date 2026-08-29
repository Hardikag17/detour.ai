import { create } from 'zustand';
import { DETOUR } from '@detour/shared/helpers/constants';

interface UiState {
  prompt: string;
  detourKm: number;
  selectedStopId: string | null;
  sessionId: string;
  setPrompt: (v: string) => void;
  setDetourKm: (v: number) => void;
  selectStop: (id: string | null) => void;
}

export const useUiStore = create<UiState>((set) => ({
  prompt: '',
  detourKm: DETOUR.DEFAULT_KM,
  selectedStopId: null,
  sessionId:
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `s-${Math.random().toString(36).slice(2)}`,
  setPrompt: (prompt) => set({ prompt }),
  setDetourKm: (detourKm) => set({ detourKm }),
  selectStop: (selectedStopId) => set({ selectedStopId }),
}));
