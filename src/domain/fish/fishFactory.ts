import type { FishEntity, PersonalityTraits, Sex } from "./fishTypes";
import type { FishSpecies } from "./fishSpecies";
import { SPECIES, DEFAULT_SPECIES } from "./fishSpecies";
import { TANK_WIDTH, WATER_SURFACE_Y, TANK_FLOOR_Y, TANK_PADDING } from "../constants/tuning";

let nextId = 1;

/** Bias a random value toward a target. mix=0 means fully random, mix=1 means fully biased. */
function biasedRandom(min: number, max: number, bias: number | undefined, mix = 0.6): number {
  const raw = min + Math.random() * (max - min);
  if (bias === undefined) return raw;
  return raw * (1 - mix) + bias * mix;
}

function randomPersonality(species: FishSpecies): PersonalityTraits {
  const bias = SPECIES[species].personalityBias;
  return {
    energy: biasedRandom(0.3, 0.8, bias.energy),
    sociability: biasedRandom(0.2, 0.8, bias.sociability),
    boldness: biasedRandom(0.2, 0.8, bias.boldness),
    appetite: biasedRandom(0.7, 1.0, bias.appetite),
    curiosity: biasedRandom(0.2, 0.8, bias.curiosity),
  };
}

function randomHue(species: FishSpecies): number {
  const [min, max] = SPECIES[species].hueRange;
  // Handle wrap-around (e.g., 340-370 means 340-360 + 0-10)
  if (max > 360) {
    const range = max - min;
    return (min + Math.random() * range) % 360;
  }
  return min + Math.random() * (max - min);
}

function randomName(species: FishSpecies): string {
  const names = SPECIES[species].names;
  return names[Math.floor(Math.random() * names.length)];
}

export function createFish(overrides?: Partial<FishEntity>): FishEntity {
  const species: FishSpecies = overrides?.species ?? DEFAULT_SPECIES;
  const id = `fish-${nextId++}`;
  const sex: Sex = Math.random() > 0.5 ? "male" : "female";
  const name = randomName(species);

  const minX = TANK_PADDING + 40;
  const maxX = TANK_WIDTH - TANK_PADDING - 40;
  const minY = WATER_SURFACE_Y + 40;
  const maxY = TANK_FLOOR_Y - 40;

  return {
    id,
    name,
    species,
    sex,
    ageStage: "adult",
    bornAt: Date.now(),
    hunger: 20,
    health: 100,
    happiness: 80,
    energyLevel: 80,
    personality: randomPersonality(species),
    x: minX + Math.random() * (maxX - minX),
    y: minY + Math.random() * (maxY - minY),
    vx: (Math.random() - 0.5) * 16,
    vy: (Math.random() - 0.5) * 6,
    facingDirection: Math.random() > 0.5 ? 1 : -1,
    state: "roaming",
    stateTimer: 0,
    wanderAngle: Math.random() * Math.PI * 2,
    phaseSeed: Math.random() * 1000,
    localTick: Math.floor(Math.random() * 500),
    colorHue: randomHue(species),
    breedCooldownUntil: 0,
    ...overrides,
  };
}

export function createFoodPellet(x: number): import("./fishTypes").FoodPellet {
  return {
    id: `food-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    x,
    y: WATER_SURFACE_Y + 5,
    lifetime: 600,
    claimed: false,
  };
}

/** Reset ID counter (for testing) */
export function resetFishIdCounter(): void {
  nextId = 1;
}
