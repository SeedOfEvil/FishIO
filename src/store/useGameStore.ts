import { create } from "zustand";
import type { FishEntity, FoodPellet } from "@/domain/fish/fishTypes";
import type { TankState } from "@/domain/tank/tankTypes";
import type { Egg } from "@/domain/fish/fishBreeding";
import { createFish, createFoodPellet } from "@/domain/fish/fishFactory";
import { updateFishBehavior, canEatFood, advanceBehaviorTick } from "@/domain/fish/fishBehavior";
import { tickFishNeeds, feedFish } from "@/domain/fish/fishNeeds";
import { tickTankState, cleanSpot } from "@/domain/tank/tankRules";
import { isNightTime } from "@/domain/tank/lighting";
import { getCurrentHour, getCurrentMinute } from "@/domain/time/realtimeClock";
import { STARTING_GOLD, STARTING_FISH_COUNT, FOOD_SINK_SPEED } from "@/domain/constants/balance";
import { TANK_FLOOR_Y } from "@/domain/constants/tuning";

export interface GameState {
  // Entities
  fish: FishEntity[];
  foodPellets: FoodPellet[];
  eggs: Egg[];

  // Tank
  tank: TankState;

  // Economy
  gold: number;

  // UI
  selectedFishId: string | null;
  activePanel: "none" | "shop" | "status";

  // Time
  currentHour: number;
  currentMinute: number;
  lastSaveTimestamp: number;

  // Actions
  tick: () => void;
  dropFood: (x: number) => void;
  selectFish: (id: string | null) => void;
  cleanDirtySpot: (spotId: string) => void;
  setActivePanel: (panel: GameState["activePanel"]) => void;
  initializeGame: () => void;
  loadState: (state: Partial<SaveableState>) => void;
  getSaveableState: () => SaveableState;
}

export interface SaveableState {
  fish: FishEntity[];
  eggs: Egg[];
  tank: TankState;
  gold: number;
  lastSaveTimestamp: number;
}

function createInitialTank(): TankState {
  const hour = getCurrentHour();
  return {
    cleanliness: 100,
    dirtySpots: [],
    isNight: isNightTime(hour),
    currentHour: hour,
  };
}

export const useGameStore = create<GameState>((set, get) => ({
  fish: [],
  foodPellets: [],
  eggs: [],
  tank: createInitialTank(),
  gold: STARTING_GOLD,
  selectedFishId: null,
  activePanel: "none",
  currentHour: getCurrentHour(),
  currentMinute: getCurrentMinute(),
  lastSaveTimestamp: Date.now(),

  initializeGame: () => {
    const initialFish: FishEntity[] = [];
    for (let i = 0; i < STARTING_FISH_COUNT; i++) {
      initialFish.push(createFish({ sex: i === 0 ? "male" : "female" }));
    }
    set({
      fish: initialFish,
      foodPellets: [],
      eggs: [],
      tank: createInitialTank(),
      gold: STARTING_GOLD,
      selectedFishId: null,
      lastSaveTimestamp: Date.now(),
    });
  },

  tick: () => {
    const state = get();
    const hour = getCurrentHour();
    const minute = getCurrentMinute();
    const isNight = isNightTime(hour);

    // Advance behavior tick for deterministic oscillations
    advanceBehaviorTick();

    // Update tank
    let tank = tickTankState({ ...state.tank, isNight, currentHour: hour });

    // Update food pellets (sink and age)
    let foodPellets = state.foodPellets
      .map((p) => ({
        ...p,
        y: Math.min(p.y + FOOD_SINK_SPEED, TANK_FLOOR_Y - 10),
        lifetime: p.lifetime - 1,
      }))
      .filter((p) => p.lifetime > 0);

    // Update fish
    const updatedFish = state.fish.map((fish) => {
      // Behavior (movement)
      let updated = updateFishBehavior(fish, {
        allFish: state.fish,
        foodPellets,
        isNight,
      });

      // Needs (hunger, health, happiness)
      updated = tickFishNeeds(updated, tank.cleanliness);

      // Check if fish can eat nearby food
      for (const pellet of foodPellets) {
        if (!pellet.claimed && canEatFood(updated, pellet)) {
          updated = feedFish(updated);
          pellet.claimed = true;
        }
      }

      return updated;
    });

    // Remove claimed food
    foodPellets = foodPellets.filter((p) => !p.claimed);

    set({
      fish: updatedFish,
      foodPellets,
      tank,
      currentHour: hour,
      currentMinute: minute,
    });
  },

  dropFood: (x: number) => {
    const pellet = createFoodPellet(x);
    set((state) => ({ foodPellets: [...state.foodPellets, pellet] }));
  },

  selectFish: (id: string | null) => {
    set({ selectedFishId: id });
  },

  cleanDirtySpot: (spotId: string) => {
    set((state) => ({ tank: cleanSpot(state.tank, spotId) }));
  },

  setActivePanel: (panel) => {
    set({ activePanel: panel });
  },

  loadState: (saved: Partial<SaveableState>) => {
    set({
      fish: saved.fish ?? get().fish,
      eggs: saved.eggs ?? get().eggs,
      tank: saved.tank ?? get().tank,
      gold: saved.gold ?? get().gold,
      lastSaveTimestamp: saved.lastSaveTimestamp ?? Date.now(),
    });
  },

  getSaveableState: (): SaveableState => {
    const state = get();
    return {
      fish: state.fish,
      eggs: state.eggs,
      tank: state.tank,
      gold: state.gold,
      lastSaveTimestamp: Date.now(),
    };
  },
}));
