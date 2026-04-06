import type { FishEntity, PersonalityTraits, Sex } from "./fishTypes";
import { TANK_WIDTH, WATER_SURFACE_Y, TANK_FLOOR_Y, TANK_PADDING } from "../constants/tuning";

let nextId = 1;

const FISH_NAMES = [
  "Goldie", "Bubbles", "Finn", "Splash", "Sunny",
  "Coral", "Nemo", "Amber", "Shimmer", "Tangerine",
  "Maple", "Honey", "Copper", "Blaze", "Marigold",
  "Peach", "Rusty", "Citrus", "Saffron", "Ginger",
];

function randomPersonality(): PersonalityTraits {
  return {
    energy: 0.3 + Math.random() * 0.5,
    sociability: 0.2 + Math.random() * 0.6,
    boldness: 0.2 + Math.random() * 0.6,
    appetite: 0.7 + Math.random() * 0.3,
    curiosity: 0.2 + Math.random() * 0.6,
  };
}

function randomGoldfishHue(): number {
  // Goldfish hues: orange (25-40) range
  return 25 + Math.random() * 15;
}

export function createFish(overrides?: Partial<FishEntity>): FishEntity {
  const id = `fish-${nextId++}`;
  const sex: Sex = Math.random() > 0.5 ? "male" : "female";
  const name = FISH_NAMES[Math.floor(Math.random() * FISH_NAMES.length)];

  const minX = TANK_PADDING + 40;
  const maxX = TANK_WIDTH - TANK_PADDING - 40;
  const minY = WATER_SURFACE_Y + 40;
  const maxY = TANK_FLOOR_Y - 40;

  return {
    id,
    name,
    sex,
    ageStage: "adult",
    bornAt: Date.now(),
    hunger: 20,
    health: 100,
    happiness: 80,
    energyLevel: 80,
    personality: randomPersonality(),
    x: minX + Math.random() * (maxX - minX),
    y: minY + Math.random() * (maxY - minY),
    vx: (Math.random() - 0.5) * 0.5,
    vy: (Math.random() - 0.5) * 0.2,
    facingDirection: Math.random() > 0.5 ? 1 : -1,
    state: "roaming",
    stateTimer: 0,
    wanderAngle: Math.random() * Math.PI * 2,
    colorHue: randomGoldfishHue(),
    breedCooldownUntil: 0,
    ...overrides,
  };
}

export function createFoodPellet(x: number): import("./fishTypes").FoodPellet {
  return {
    id: `food-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    x,
    y: WATER_SURFACE_Y + 5,
    lifetime: 30,
    claimed: false,
  };
}

/** Reset ID counter (for testing) */
export function resetFishIdCounter(): void {
  nextId = 1;
}
