import type { SaveableState } from "@/store/useGameStore";
import { SAVE_KEY, createSaveFile, type SaveFile } from "./saveSchema";
import { migrateSave } from "./migrations";

export function saveGame(state: SaveableState): boolean {
  try {
    const saveFile = createSaveFile(state);
    localStorage.setItem(SAVE_KEY, JSON.stringify(saveFile));
    return true;
  } catch (e) {
    console.error("Failed to save game:", e);
    return false;
  }
}

export function loadGame(): SaveFile | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const parsed: SaveFile = JSON.parse(raw);
    return migrateSave(parsed);
  } catch (e) {
    console.error("Failed to load game:", e);
    return null;
  }
}

export function hasSavedGame(): boolean {
  return localStorage.getItem(SAVE_KEY) !== null;
}

export function deleteSave(): void {
  localStorage.removeItem(SAVE_KEY);
}

export function exportSave(state: SaveableState): string {
  return JSON.stringify(createSaveFile(state));
}

export function importSave(json: string): SaveFile | null {
  try {
    const parsed: SaveFile = JSON.parse(json);
    return migrateSave(parsed);
  } catch {
    return null;
  }
}
