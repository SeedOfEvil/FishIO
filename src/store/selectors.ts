import { useGameStore } from "./useGameStore";
import type { FishEntity } from "@/domain/fish/fishTypes";

export function useSelectedFish(): FishEntity | null {
  return useGameStore((state) => {
    if (!state.selectedFishId) return null;
    return state.fish.find((f) => f.id === state.selectedFishId) ?? null;
  });
}

export function useTankCleanliness(): number {
  return useGameStore((state) => state.tank.cleanliness);
}

export function useIsNight(): boolean {
  return useGameStore((state) => state.tank.isNight);
}

export function useFishCount(): number {
  return useGameStore((state) => state.fish.length);
}

export function useAverageHappiness(): number {
  return useGameStore((state) => {
    if (state.fish.length === 0) return 0;
    return state.fish.reduce((sum, f) => sum + f.happiness, 0) / state.fish.length;
  });
}
