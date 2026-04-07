import { create } from "zustand";
import type { FishEntity, FoodPellet } from "@/domain/fish/fishTypes";
import type { TankState } from "@/domain/tank/tankTypes";
import type { Egg } from "@/domain/fish/fishBreeding";
import type { FishSpecies } from "@/domain/fish/fishSpecies";
import { SPECIES } from "@/domain/fish/fishSpecies";
import { createFish, createFoodPellet } from "@/domain/fish/fishFactory";
import { updateFishBehavior, moveFish, canEatFood, advanceBehaviorTick } from "@/domain/fish/fishBehavior";
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
  moveFrame: (dt: number) => void;
  dropFood: (x: number) => void;
  selectFish: (id: string | null) => void;
  cleanDirtySpot: (spotId: string) => void;
  setActivePanel: (panel: GameState["activePanel"]) => void;
  buyFish: (species: FishSpecies) => void;
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

  // SLOW TICK (1/sec): behavior decisions, needs, economy, food aging
  tick: () => {
    const state = get();
    const hour = getCurrentHour();
    const minute = getCurrentMinute();
    const isNight = isNightTime(hour);

    advanceBehaviorTick();

    let tank = tickTankState({ ...state.tank, isNight, currentHour: hour });

    // Age and sink food pellets
    let foodPellets = state.foodPellets
      .map((p) => ({
        ...p,
        y: Math.min(p.y + FOOD_SINK_SPEED, TANK_FLOOR_Y - 10),
        lifetime: p.lifetime - 1,
      }))
      .filter((p) => p.lifetime > 0);

    // Update fish behavior decisions (state machine, wander angles, timers)
    // Position/velocity is NOT updated here — that happens in moveFrame
    const updatedFish = state.fish.map((fish) => {
      let updated = updateFishBehavior(fish, {
        allFish: state.fish,
        foodPellets,
        isNight,
      });

      updated = tickFishNeeds(updated, tank.cleanliness);

      for (const pellet of foodPellets) {
        if (!pellet.claimed && canEatFood(updated, pellet)) {
          updated = feedFish(updated);
          pellet.claimed = true;
        }
      }

      return updated;
    });

    foodPellets = foodPellets.filter((p) => !p.claimed);

    set({
      fish: updatedFish,
      foodPellets,
      tank,
      currentHour: hour,
      currentMinute: minute,
    });
  },

  // FAST FRAME (~60fps): physics, steering, position updates
  moveFrame: (dt: number) => {
    const state = get();
    if (state.fish.length === 0) return;

    const isNight = state.tank.isNight;
    const movedFish = state.fish.map((fish) =>
      moveFish(fish, state.fish, state.foodPellets, isNight, dt),
    );

    set({ fish: movedFish });
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

  buyFish: (species: FishSpecies) => {
    const state = get();
    const price = SPECIES[species].price;
    if (state.gold < price) return;
    const newFish = createFish({ species });
    set({
      fish: [...state.fish, newFish],
      gold: state.gold - price,
    });
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
