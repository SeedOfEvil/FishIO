import type { FishEntity } from "./fishTypes";
import { FISH_EATING_PAUSE_TICKS } from "../constants/tuning";
import {
  HUNGER_RATE_PER_TICK,
  HUNGER_DANGER_THRESHOLD,
  HEALTH_DECLINE_RATE,
  HAPPINESS_DECAY_PER_TICK,
  HAPPINESS_RECOVERY_PER_TICK,
  FOOD_HUNGER_RESTORE,
  HAPPINESS_FEED_BOOST,
} from "../constants/balance";

/** Progress fish needs by one tick */
export function tickFishNeeds(fish: FishEntity, tankCleanliness: number): FishEntity {
  const updated = { ...fish };

  // Hunger increases over time (higher = hungrier)
  const hungerRate = HUNGER_RATE_PER_TICK * fish.personality.appetite;
  updated.hunger = Math.min(100, updated.hunger + hungerRate);

  // Health declines when hunger is too high
  if (updated.hunger > HUNGER_DANGER_THRESHOLD) {
    updated.health = Math.max(0, updated.health - HEALTH_DECLINE_RATE);
  } else {
    // Slow health recovery when fed
    updated.health = Math.min(100, updated.health + HEALTH_DECLINE_RATE * 0.5);
  }

  // Happiness is affected by hunger and cleanliness
  const isComfortable = updated.hunger < 50 && tankCleanliness > 40;
  if (isComfortable) {
    updated.happiness = Math.min(100, updated.happiness + HAPPINESS_RECOVERY_PER_TICK);
  } else {
    updated.happiness = Math.max(0, updated.happiness - HAPPINESS_DECAY_PER_TICK);
  }

  // Energy follows a simple cycle: lower when hungry, higher when fed
  const energyTarget = Math.max(20, 100 - updated.hunger);
  updated.energyLevel += (energyTarget - updated.energyLevel) * 0.001;

  return updated;
}

/** Apply feeding effect to a fish */
export function feedFish(fish: FishEntity): FishEntity {
  return {
    ...fish,
    hunger: Math.max(0, fish.hunger - FOOD_HUNGER_RESTORE),
    happiness: Math.min(100, fish.happiness + HAPPINESS_FEED_BOOST),
    state: "eating" as const,
    stateTimer: FISH_EATING_PAUSE_TICKS,
  };
}

/** Fast-forward fish needs by elapsed seconds (for reconciliation) */
export function reconcileFishNeeds(fish: FishEntity, elapsedSeconds: number, tankCleanliness: number): FishEntity {
  let updated = { ...fish };
  // Apply needs in bulk rather than tick-by-tick for performance
  const hungerGain = HUNGER_RATE_PER_TICK * fish.personality.appetite * elapsedSeconds;
  updated.hunger = Math.min(100, updated.hunger + hungerGain);

  // Health: estimate time spent in danger zone
  const wasAlreadyDangerous = fish.hunger > HUNGER_DANGER_THRESHOLD;
  if (wasAlreadyDangerous) {
    updated.health = Math.max(0, updated.health - HEALTH_DECLINE_RATE * elapsedSeconds);
  } else {
    // Estimate when hunger crossed the threshold
    const ticksUntilDanger = (HUNGER_DANGER_THRESHOLD - fish.hunger) / (HUNGER_RATE_PER_TICK * fish.personality.appetite);
    const dangerSeconds = Math.max(0, elapsedSeconds - ticksUntilDanger);
    const safeSeconds = elapsedSeconds - dangerSeconds;
    updated.health = Math.min(100, updated.health + HEALTH_DECLINE_RATE * 0.5 * safeSeconds);
    updated.health = Math.max(0, updated.health - HEALTH_DECLINE_RATE * dangerSeconds);
  }

  // Happiness: rough estimate based on average conditions
  const isComfortable = updated.hunger < 50 && tankCleanliness > 40;
  if (isComfortable) {
    updated.happiness = Math.min(100, updated.happiness + HAPPINESS_RECOVERY_PER_TICK * elapsedSeconds * 0.5);
  } else {
    updated.happiness = Math.max(0, updated.happiness - HAPPINESS_DECAY_PER_TICK * elapsedSeconds * 0.5);
  }

  return updated;
}
