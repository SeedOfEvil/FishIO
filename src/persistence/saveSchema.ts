import type { SaveableState } from "@/store/useGameStore";

export const SAVE_VERSION = 3;
export const SAVE_KEY = "fishio-save";

export interface SaveFile {
  version: number;
  timestamp: number;
  state: SaveableState;
}

export function createSaveFile(state: SaveableState): SaveFile {
  return {
    version: SAVE_VERSION,
    timestamp: Date.now(),
    state,
  };
}
