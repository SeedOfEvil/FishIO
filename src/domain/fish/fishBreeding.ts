import type { FishEntity } from "./fishTypes";
import { BREEDING_COOLDOWN_HOURS, EGG_HATCH_HOURS, FRY_GROWTH_HOURS } from "../constants/balance";
import { createFish } from "./fishFactory";

export interface Egg {
  id: string;
  parentIds: [string, string];
  createdAt: number;
  hatchAt: number;
}

export function canBreed(fish: FishEntity): boolean {
  return (
    fish.ageStage === "adult" &&
    fish.health > 60 &&
    fish.happiness > 50 &&
    fish.hunger < 60 &&
    Date.now() > fish.breedCooldownUntil
  );
}

export function findBreedingPair(fish: FishEntity[]): [FishEntity, FishEntity] | null {
  const eligible = fish.filter(canBreed);
  const males = eligible.filter((f) => f.sex === "male");
  const females = eligible.filter((f) => f.sex === "female");

  if (males.length === 0 || females.length === 0) return null;

  // Pick the healthiest pair
  const bestMale = males.sort((a, b) => b.health - a.health)[0];
  const bestFemale = females.sort((a, b) => b.health - a.health)[0];

  return [bestMale, bestFemale];
}

export function createEgg(parent1Id: string, parent2Id: string): Egg {
  const now = Date.now();
  return {
    id: `egg-${now}-${Math.random().toString(36).slice(2, 6)}`,
    parentIds: [parent1Id, parent2Id],
    createdAt: now,
    hatchAt: now + EGG_HATCH_HOURS * 60 * 60 * 1000,
  };
}

export function hatchEgg(egg: Egg): FishEntity | null {
  if (Date.now() < egg.hatchAt) return null;

  return createFish({
    ageStage: "fry",
    bornAt: egg.hatchAt,
    hunger: 30,
    health: 100,
    happiness: 90,
    energyLevel: 90,
  });
}

export function getBreedCooldownEnd(): number {
  return Date.now() + BREEDING_COOLDOWN_HOURS * 60 * 60 * 1000;
}

export function shouldGrowFry(fish: FishEntity): boolean {
  if (fish.ageStage !== "fry") return false;
  const ageMs = Date.now() - fish.bornAt;
  return ageMs >= FRY_GROWTH_HOURS * 60 * 60 * 1000;
}

export function shouldGrowJuvenile(fish: FishEntity): boolean {
  if (fish.ageStage !== "juvenile") return false;
  const ageMs = Date.now() - fish.bornAt;
  return ageMs >= FRY_GROWTH_HOURS * 2 * 60 * 60 * 1000;
}
