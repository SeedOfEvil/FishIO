import type { TankState, DirtySpot } from "./tankTypes";
import {
  CLEANLINESS_DECAY_PER_TICK,
  DIRTY_SPOT_SPAWN_CHANCE,
  MAX_DIRTY_SPOTS,
  CLEAN_SPOT_RESTORE,
} from "../constants/balance";
import { TANK_WIDTH, TANK_FLOOR_Y, TANK_PADDING } from "../constants/tuning";

export function tickTankState(tank: TankState): TankState {
  const updated = { ...tank, dirtySpots: [...tank.dirtySpots] };

  // Cleanliness degrades
  updated.cleanliness = Math.max(0, updated.cleanliness - CLEANLINESS_DECAY_PER_TICK);

  // Occasionally spawn dirty spots
  if (updated.dirtySpots.length < MAX_DIRTY_SPOTS && Math.random() < DIRTY_SPOT_SPAWN_CHANCE) {
    updated.dirtySpots.push(createDirtySpot());
  }

  // Dirty spots reduce cleanliness faster
  const dirtyPenalty = updated.dirtySpots.length * 0.0002;
  updated.cleanliness = Math.max(0, updated.cleanliness - dirtyPenalty);

  return updated;
}

export function cleanSpot(tank: TankState, spotId: string): TankState {
  return {
    ...tank,
    dirtySpots: tank.dirtySpots.filter((s) => s.id !== spotId),
    cleanliness: Math.min(100, tank.cleanliness + CLEAN_SPOT_RESTORE),
  };
}

function createDirtySpot(): DirtySpot {
  return {
    id: `dirt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    x: TANK_PADDING + 40 + Math.random() * (TANK_WIDTH - TANK_PADDING * 2 - 80),
    y: TANK_FLOOR_Y - 10 - Math.random() * 30,
  };
}

/** Reconcile tank state after elapsed real time */
export function reconcileTankState(tank: TankState, elapsedSeconds: number): TankState {
  const updated = { ...tank, dirtySpots: [...tank.dirtySpots] };

  updated.cleanliness = Math.max(0, updated.cleanliness - CLEANLINESS_DECAY_PER_TICK * elapsedSeconds);

  // Estimate dirty spots that would have spawned
  const expectedSpots = Math.floor(elapsedSeconds * DIRTY_SPOT_SPAWN_CHANCE);
  const spotsToAdd = Math.min(expectedSpots, MAX_DIRTY_SPOTS - updated.dirtySpots.length);
  for (let i = 0; i < spotsToAdd; i++) {
    updated.dirtySpots.push(createDirtySpot());
  }

  return updated;
}
