import type { FishEntity, FoodPellet } from "./fishTypes";
import {
  TANK_PADDING,
  TANK_WIDTH,
  WATER_SURFACE_Y,
  TANK_FLOOR_Y,
  FISH_BASE_SPEED,
  FISH_SPEED_VARIATION,
  FISH_TURN_SMOOTHING,
  FISH_WALL_AVOIDANCE_DISTANCE,
  FISH_WALL_AVOIDANCE_STRENGTH,
  FISH_SEPARATION_DISTANCE,
  FISH_SEPARATION_STRENGTH,
  FISH_FOOD_ATTRACTION_RANGE,
  FISH_FOOD_ATTRACTION_STRENGTH,
  FISH_NIGHT_SPEED_MULTIPLIER,
  FISH_IDLE_CHANCE,
  FISH_IDLE_DURATION_TICKS,
} from "../constants/tuning";

interface BehaviorContext {
  allFish: FishEntity[];
  foodPellets: FoodPellet[];
  isNight: boolean;
}

export function updateFishBehavior(
  fish: FishEntity,
  ctx: BehaviorContext,
): FishEntity {
  const updated = { ...fish };

  // Handle idle state
  if (updated.state === "idle") {
    updated.idleTimer -= 1;
    if (updated.idleTimer <= 0) {
      updated.state = "roaming";
    }
    // Slow down while idle
    updated.vx *= 0.95;
    updated.vy *= 0.95;
    applyPosition(updated);
    return updated;
  }

  // Handle resting at night
  if (updated.state === "resting") {
    updated.vx *= 0.97;
    updated.vy *= 0.97;
    // Gently drift toward lower tank
    if (updated.y < TANK_FLOOR_Y - 80) {
      updated.vy += 0.01;
    }
    if (!ctx.isNight) {
      updated.state = "roaming";
    }
    applyPosition(updated);
    return updated;
  }

  // Check for nearby food
  const nearestFood = findNearestFood(updated, ctx.foodPellets);
  if (nearestFood && updated.hunger > 30) {
    updated.state = "seeking_food";
    const dx = nearestFood.x - updated.x;
    const dy = nearestFood.y - updated.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > 0) {
      const attraction = FISH_FOOD_ATTRACTION_STRENGTH * updated.personality.boldness;
      updated.vx += (dx / dist) * attraction;
      updated.vy += (dy / dist) * attraction;
    }
  } else {
    updated.state = "roaming";
  }

  // Night behavior
  if (ctx.isNight && Math.random() < 0.01) {
    updated.state = "resting";
  }

  // Random idle chance
  if (updated.state === "roaming" && Math.random() < FISH_IDLE_CHANCE) {
    updated.state = "idle";
    updated.idleTimer = FISH_IDLE_DURATION_TICKS * (0.5 + Math.random());
  }

  // Wander force (gentle random nudge)
  const wanderStrength = 0.03 * updated.personality.energy;
  updated.vx += (Math.random() - 0.5) * wanderStrength;
  updated.vy += (Math.random() - 0.5) * wanderStrength * 0.5;

  // Wall avoidance
  applyWallAvoidance(updated);

  // Fish separation
  applySeparation(updated, ctx.allFish);

  // Speed limits
  const speedMultiplier = ctx.isNight ? FISH_NIGHT_SPEED_MULTIPLIER : 1;
  const maxSpeed = (FISH_BASE_SPEED + FISH_SPEED_VARIATION * updated.personality.energy) * speedMultiplier;
  const currentSpeed = Math.sqrt(updated.vx * updated.vx + updated.vy * updated.vy);
  if (currentSpeed > maxSpeed) {
    updated.vx = (updated.vx / currentSpeed) * maxSpeed;
    updated.vy = (updated.vy / currentSpeed) * maxSpeed;
  }

  // Smooth turning
  updated.vx = fish.vx + (updated.vx - fish.vx) * FISH_TURN_SMOOTHING;
  updated.vy = fish.vy + (updated.vy - fish.vy) * FISH_TURN_SMOOTHING;

  // Update facing direction
  if (Math.abs(updated.vx) > 0.01) {
    updated.facingDirection = updated.vx > 0 ? 1 : -1;
  }

  applyPosition(updated);
  return updated;
}

function applyPosition(fish: FishEntity): void {
  fish.x += fish.vx;
  fish.y += fish.vy;

  // Clamp to tank bounds
  const minX = TANK_PADDING + 20;
  const maxX = TANK_WIDTH - TANK_PADDING - 20;
  const minY = WATER_SURFACE_Y + 20;
  const maxY = TANK_FLOOR_Y - 20;

  if (fish.x < minX) { fish.x = minX; fish.vx = Math.abs(fish.vx) * 0.5; }
  if (fish.x > maxX) { fish.x = maxX; fish.vx = -Math.abs(fish.vx) * 0.5; }
  if (fish.y < minY) { fish.y = minY; fish.vy = Math.abs(fish.vy) * 0.5; }
  if (fish.y > maxY) { fish.y = maxY; fish.vy = -Math.abs(fish.vy) * 0.5; }
}

function applyWallAvoidance(fish: FishEntity): void {
  const minX = TANK_PADDING + FISH_WALL_AVOIDANCE_DISTANCE;
  const maxX = TANK_WIDTH - TANK_PADDING - FISH_WALL_AVOIDANCE_DISTANCE;
  const minY = WATER_SURFACE_Y + FISH_WALL_AVOIDANCE_DISTANCE;
  const maxY = TANK_FLOOR_Y - FISH_WALL_AVOIDANCE_DISTANCE;

  if (fish.x < minX) fish.vx += FISH_WALL_AVOIDANCE_STRENGTH * (1 - fish.x / minX);
  if (fish.x > maxX) fish.vx -= FISH_WALL_AVOIDANCE_STRENGTH * ((fish.x - maxX) / (TANK_WIDTH - maxX));
  if (fish.y < minY) fish.vy += FISH_WALL_AVOIDANCE_STRENGTH * (1 - fish.y / minY);
  if (fish.y > maxY) fish.vy -= FISH_WALL_AVOIDANCE_STRENGTH * ((fish.y - maxY) / (TANK_FLOOR_Y - maxY));
}

function applySeparation(fish: FishEntity, allFish: FishEntity[]): void {
  for (const other of allFish) {
    if (other.id === fish.id) continue;
    const dx = fish.x - other.x;
    const dy = fish.y - other.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < FISH_SEPARATION_DISTANCE && dist > 0) {
      const force = FISH_SEPARATION_STRENGTH * (1 - dist / FISH_SEPARATION_DISTANCE);
      fish.vx += (dx / dist) * force;
      fish.vy += (dy / dist) * force;
    }
  }
}

function findNearestFood(fish: FishEntity, pellets: FoodPellet[]): FoodPellet | null {
  let nearest: FoodPellet | null = null;
  let nearestDist = FISH_FOOD_ATTRACTION_RANGE;

  for (const pellet of pellets) {
    if (pellet.claimed) continue;
    const dx = pellet.x - fish.x;
    const dy = pellet.y - fish.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < nearestDist) {
      nearestDist = dist;
      nearest = pellet;
    }
  }
  return nearest;
}

/** Check if a fish is close enough to eat a food pellet */
export function canEatFood(fish: FishEntity, pellet: FoodPellet): boolean {
  const dx = fish.x - pellet.x;
  const dy = fish.y - pellet.y;
  return Math.sqrt(dx * dx + dy * dy) < 15;
}
