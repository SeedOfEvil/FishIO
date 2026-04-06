import type { FishEntity, FishState, FoodPellet } from "./fishTypes";
import {
  TANK_PADDING,
  TANK_WIDTH,
  WATER_SURFACE_Y,
  TANK_FLOOR_Y,
  FISH_BASE_SPEED,
  FISH_SPEED_VARIATION,
  FISH_TURN_SMOOTHING,
  FISH_MIN_SPEED,
  FISH_WALL_AVOIDANCE_DISTANCE,
  FISH_WALL_AVOIDANCE_STRENGTH,
  FISH_WALL_HARD_REPULSION,
  FISH_WALL_APPROACH_MULTIPLIER,
  FISH_SEPARATION_DISTANCE,
  FISH_SEPARATION_STRENGTH,
  FISH_SOCIABILITY_SEPARATION_FACTOR,
  FISH_FOOD_ATTRACTION_RANGE,
  FISH_FOOD_ATTRACTION_STRENGTH,
  FISH_FOOD_NOTICE_HUNGER,
  FISH_EATING_PAUSE_TICKS,
  FISH_WANDER_STRENGTH,
  FISH_WANDER_ANGLE_DRIFT,
  FISH_WANDER_RETARGET_CHANCE,
  FISH_CRUISE_CHANCE,
  FISH_CRUISE_DURATION,
  FISH_VERTICAL_DRIFT_STRENGTH,
  FISH_VERTICAL_DRIFT_SPEED,
  FISH_HOVER_CHANCE,
  FISH_HOVER_DURATION,
  FISH_HOVER_DAMPING,
  FISH_INVESTIGATE_CHANCE,
  FISH_INVESTIGATE_DURATION,
  FISH_IDLE_CHANCE,
  FISH_IDLE_DURATION_TICKS,
  FISH_IDLE_DRIFT_STRENGTH,
  FISH_IDLE_DRIFT_CHANCE,
  FISH_NIGHT_SPEED_MULTIPLIER,
  FISH_NIGHT_SINK_FORCE,
  FISH_NIGHT_SINK_FLOOR_OFFSET,
  FISH_NIGHT_REST_CHANCE,
  FISH_NIGHT_HOVER_CHANCE,
  FISH_REST_DAMPING,
} from "../constants/tuning";

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface BehaviorContext {
  allFish: FishEntity[];
  foodPellets: FoodPellet[];
  isNight: boolean;
}

// ---------------------------------------------------------------------------
// Internal tick counter for deterministic oscillations
// ---------------------------------------------------------------------------

let _behaviorTick = 0;

/** Advance the global behavior tick. Called once per game tick. */
export function advanceBehaviorTick(): void {
  _behaviorTick++;
}

/** Get current behavior tick (for testing). */
export function getBehaviorTick(): number {
  return _behaviorTick;
}

/** Reset tick counter (for testing). */
export function resetBehaviorTick(): void {
  _behaviorTick = 0;
}

// ---------------------------------------------------------------------------
// Main update
// ---------------------------------------------------------------------------

export function updateFishBehavior(
  fish: FishEntity,
  ctx: BehaviorContext,
): FishEntity {
  const f = { ...fish };

  // --- timed-state ticking (eating, idle, hovering, investigating, resting) ---
  if (isTimedState(f.state)) {
    f.stateTimer -= 1;
    if (f.stateTimer <= 0) {
      f.state = "roaming";
    } else {
      applyTimedStateBehavior(f, ctx);
      // Speed limit still applies during timed states
      applySpeedLimit(f, ctx.isNight);
      applyPosition(f);
      return f;
    }
  }

  // --- decide next state / steering ---
  decideState(f, ctx);
  applySteeringForces(f, ctx);

  // --- speed limit ---
  applySpeedLimit(f, ctx.isNight);

  // --- smooth turning (blend from old velocity) ---
  f.vx = fish.vx + (f.vx - fish.vx) * FISH_TURN_SMOOTHING;
  f.vy = fish.vy + (f.vy - fish.vy) * FISH_TURN_SMOOTHING;

  // --- minimum speed enforcement (always gently alive) ---
  applyMinimumDrift(f);

  // --- facing direction ---
  if (Math.abs(f.vx) > 0.01) {
    f.facingDirection = f.vx > 0 ? 1 : -1;
  }

  applyPosition(f);
  return f;
}

// ---------------------------------------------------------------------------
// Timed-state helpers
// ---------------------------------------------------------------------------

function isTimedState(state: FishState): boolean {
  return (
    state === "idle" ||
    state === "eating" ||
    state === "hovering" ||
    state === "investigating" ||
    state === "resting"
  );
}

function applyTimedStateBehavior(f: FishEntity, ctx: BehaviorContext): void {
  // Use a per-fish phase offset based on position hash for organic variation
  const phase = (f.x * 7.3 + f.y * 13.1) % (Math.PI * 2);

  switch (f.state) {
    case "idle": {
      f.vx *= 0.96;
      f.vy *= 0.96;
      // Inject micro-drift so idle fish still look alive
      applyIdleDrift(f, phase);
      // Gentle vertical bob
      f.vy += Math.sin(_behaviorTick * FISH_VERTICAL_DRIFT_SPEED + phase) * 0.002;
      break;
    }

    case "eating": {
      // Slow drift while munching — but not frozen
      f.vx *= 0.93;
      f.vy *= 0.93;
      // Subtle nibble bob
      f.vy += Math.sin(_behaviorTick * 0.2 + phase) * 0.004;
      applyIdleDrift(f, phase);
      break;
    }

    case "hovering": {
      f.vx *= FISH_HOVER_DAMPING;
      f.vy *= FISH_HOVER_DAMPING;
      // More pronounced vertical bob during hover
      f.vy += Math.sin(_behaviorTick * 0.08 + phase) * 0.008;
      // Slight horizontal sway
      f.vx += Math.sin(_behaviorTick * 0.05 + phase * 1.7) * 0.003;
      break;
    }

    case "investigating": {
      // Drift gently in current wander direction
      const strength = 0.02 * f.personality.curiosity;
      f.vx += Math.cos(f.wanderAngle) * strength;
      f.vy += Math.sin(f.wanderAngle) * strength;
      f.vx *= 0.95;
      f.vy *= 0.95;
      // Slowly rotate wander angle for natural investigation arc
      f.wanderAngle += Math.sin(_behaviorTick * 0.03 + phase) * 0.02;
      break;
    }

    case "resting": {
      f.vx *= FISH_REST_DAMPING;
      f.vy *= FISH_REST_DAMPING;
      // Drift toward lower tank
      if (f.y < TANK_FLOOR_Y - FISH_NIGHT_SINK_FLOOR_OFFSET) {
        f.vy += FISH_NIGHT_SINK_FORCE;
      }
      // Even resting fish breathe — tiny motion
      f.vy += Math.sin(_behaviorTick * 0.04 + phase) * 0.003;
      f.vx += Math.sin(_behaviorTick * 0.025 + phase * 2.1) * 0.002;
      // Wake up if it's no longer night
      if (!ctx.isNight) {
        f.state = "roaming";
        f.stateTimer = 0;
      }
      break;
    }
  }

  // Wall avoidance still applies during timed states
  applyWallAvoidance(f);
  applySeparation(f, ctx.allFish);

  // Minimum speed even during timed states
  applyMinimumDrift(f);

  // Update facing
  if (Math.abs(f.vx) > 0.01) {
    f.facingDirection = f.vx > 0 ? 1 : -1;
  }
}

// ---------------------------------------------------------------------------
// Idle drift — micro-motion that keeps fish alive-looking
// ---------------------------------------------------------------------------

function applyIdleDrift(f: FishEntity, phase: number): void {
  if (Math.random() < FISH_IDLE_DRIFT_CHANCE) {
    const angle = f.wanderAngle + (Math.random() - 0.5) * 1.5;
    f.vx += Math.cos(angle) * FISH_IDLE_DRIFT_STRENGTH;
    f.vy += Math.sin(angle) * FISH_IDLE_DRIFT_STRENGTH * 0.7;
  }
}

// ---------------------------------------------------------------------------
// Minimum speed enforcement — fish never fully stop
// ---------------------------------------------------------------------------

function applyMinimumDrift(f: FishEntity): void {
  const speed = Math.sqrt(f.vx * f.vx + f.vy * f.vy);
  if (speed < FISH_MIN_SPEED && speed > 0) {
    // Boost to minimum speed in current direction
    const scale = FISH_MIN_SPEED / speed;
    f.vx *= scale;
    f.vy *= scale;
  } else if (speed === 0) {
    // Kick in a gentle random direction
    const angle = f.wanderAngle;
    f.vx = Math.cos(angle) * FISH_MIN_SPEED;
    f.vy = Math.sin(angle) * FISH_MIN_SPEED * 0.5;
  }
}

// ---------------------------------------------------------------------------
// State decision
// ---------------------------------------------------------------------------

export function decideState(f: FishEntity, ctx: BehaviorContext): void {
  // Priority 1: food seeking (hunger-driven)
  const nearestFood = findNearestFood(f, ctx.foodPellets);
  if (nearestFood && f.hunger > FISH_FOOD_NOTICE_HUNGER) {
    // Interest scales with hunger and boldness
    const interest = (f.hunger / 100) * (0.4 + 0.6 * f.personality.boldness);
    if (interest > 0.2) {
      f.state = "seeking_food";
      return;
    }
  }

  // If currently seeking food but nothing available, go back to roaming
  if (f.state === "seeking_food") {
    f.state = "roaming";
  }

  // Priority 2: night transitions
  if (ctx.isNight) {
    if (Math.random() < FISH_NIGHT_REST_CHANCE) {
      enterState(f, "resting", FISH_IDLE_DURATION_TICKS * (0.8 + Math.random() * 0.4));
      return;
    }
    if (Math.random() < FISH_NIGHT_HOVER_CHANCE) {
      enterState(f, "hovering", FISH_HOVER_DURATION * (0.5 + Math.random()));
      return;
    }
  }

  // Priority 3: spontaneous state changes while roaming
  if (f.state === "roaming") {
    // Investigate (curiosity-driven)
    if (Math.random() < FISH_INVESTIGATE_CHANCE * f.personality.curiosity) {
      enterState(f, "investigating", FISH_INVESTIGATE_DURATION * (0.5 + Math.random()));
      f.wanderAngle = Math.random() * Math.PI * 2;
      return;
    }
    // Hover
    if (Math.random() < FISH_HOVER_CHANCE * (1 - f.personality.energy * 0.5)) {
      enterState(f, "hovering", FISH_HOVER_DURATION * (0.5 + Math.random()));
      return;
    }
    // Idle (rare — short micro-pause)
    if (Math.random() < FISH_IDLE_CHANCE * (1 - f.personality.energy * 0.5)) {
      enterState(f, "idle", FISH_IDLE_DURATION_TICKS * (0.5 + Math.random()));
      return;
    }
    // Cruise — pick a direction and swim straight for a while
    if (Math.random() < FISH_CRUISE_CHANCE * f.personality.energy) {
      f.wanderAngle = Math.atan2(f.vy, f.vx) + (Math.random() - 0.5) * 0.3;
      f.stateTimer = FISH_CRUISE_DURATION * (0.5 + Math.random());
      // Stay in "roaming" but the stateTimer > 0 suppresses retargeting
    }
  }
}

function enterState(f: FishEntity, state: FishState, duration: number): void {
  f.state = state;
  f.stateTimer = Math.round(duration);
}

// ---------------------------------------------------------------------------
// Steering forces (applied only to non-timed states: roaming, seeking_food)
// ---------------------------------------------------------------------------

function applySteeringForces(f: FishEntity, ctx: BehaviorContext): void {
  // Food attraction
  if (f.state === "seeking_food") {
    applyFoodAttraction(f, ctx.foodPellets);
  }

  // Wander
  if (f.state === "roaming") {
    applyWander(f, ctx.isNight);
  }

  // Ambient vertical drift (buoyancy oscillation) — always active
  const phase = (f.x * 7.3 + f.y * 13.1) % (Math.PI * 2);
  f.vy += Math.sin(_behaviorTick * FISH_VERTICAL_DRIFT_SPEED + phase) * FISH_VERTICAL_DRIFT_STRENGTH;

  // Night: gentle downward drift
  if (ctx.isNight && f.y < TANK_FLOOR_Y - FISH_NIGHT_SINK_FLOOR_OFFSET) {
    f.vy += FISH_NIGHT_SINK_FORCE * 0.5;
  }

  // Wall avoidance
  applyWallAvoidance(f);

  // Neighbor separation
  applySeparation(f, ctx.allFish);
}

// ---------------------------------------------------------------------------
// Wandering — smooth, direction-based
// ---------------------------------------------------------------------------

function applyWander(f: FishEntity, isNight: boolean): void {
  // Drift the wander angle gently
  f.wanderAngle += (Math.random() - 0.5) * FISH_WANDER_ANGLE_DRIFT;

  // Occasionally pick a completely new direction
  if (f.stateTimer <= 0 && Math.random() < FISH_WANDER_RETARGET_CHANCE) {
    // Bias toward center of tank for better space utilization
    const cx = TANK_WIDTH / 2;
    const cy = (WATER_SURFACE_Y + TANK_FLOOR_Y) / 2;
    const toCenterAngle = Math.atan2(cy - f.y, cx - f.x);
    // Blend between random and center-seeking (30% center bias)
    const randomAngle = Math.random() * Math.PI * 2;
    f.wanderAngle = randomAngle + shortAngleDist(randomAngle, toCenterAngle) * 0.3;
  }

  // Decrease cruise timer if active
  if (f.stateTimer > 0) {
    f.stateTimer -= 1;
  }

  const strength = FISH_WANDER_STRENGTH * f.personality.energy * (isNight ? 0.5 : 1);
  f.vx += Math.cos(f.wanderAngle) * strength;
  f.vy += Math.sin(f.wanderAngle) * strength * 0.7; // fish swim more horizontally, but not as suppressed
}

// ---------------------------------------------------------------------------
// Food attraction
// ---------------------------------------------------------------------------

function applyFoodAttraction(f: FishEntity, pellets: FoodPellet[]): void {
  const target = findNearestFood(f, pellets);
  if (!target) return;

  const dx = target.x - f.x;
  const dy = target.y - f.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist <= 0) return;

  // Attraction strength scales with boldness and hunger urgency
  const urgency = 0.5 + 0.5 * (f.hunger / 100);
  const attraction = FISH_FOOD_ATTRACTION_STRENGTH * f.personality.boldness * urgency;
  f.vx += (dx / dist) * attraction;
  f.vy += (dy / dist) * attraction;
}

// ---------------------------------------------------------------------------
// Wall avoidance — soft gradient + hard repulsion + anticipatory steering
// ---------------------------------------------------------------------------

export function applyWallAvoidance(f: FishEntity): void {
  const dist = FISH_WALL_AVOIDANCE_DISTANCE;
  const halfDist = dist * 0.5;

  const leftEdge = TANK_PADDING;
  const rightEdge = TANK_WIDTH - TANK_PADDING;
  const topEdge = WATER_SURFACE_Y;
  const bottomEdge = TANK_FLOOR_Y;

  const dLeft = f.x - leftEdge;
  const dRight = rightEdge - f.x;
  const dTop = f.y - topEdge;
  const dBottom = bottomEdge - f.y;

  // Anticipatory multiplier: stronger avoidance when swimming toward a wall
  const approachLeft = f.vx < 0 ? FISH_WALL_APPROACH_MULTIPLIER : 1;
  const approachRight = f.vx > 0 ? FISH_WALL_APPROACH_MULTIPLIER : 1;
  const approachTop = f.vy < 0 ? FISH_WALL_APPROACH_MULTIPLIER : 1;
  const approachBottom = f.vy > 0 ? FISH_WALL_APPROACH_MULTIPLIER : 1;

  // Soft avoidance with approach awareness
  if (dLeft < dist) {
    const t = 1 - dLeft / dist;
    f.vx += FISH_WALL_AVOIDANCE_STRENGTH * t * approachLeft;
    if (dLeft < halfDist) f.vx += FISH_WALL_HARD_REPULSION * (1 - dLeft / halfDist);
  }
  if (dRight < dist) {
    const t = 1 - dRight / dist;
    f.vx -= FISH_WALL_AVOIDANCE_STRENGTH * t * approachRight;
    if (dRight < halfDist) f.vx -= FISH_WALL_HARD_REPULSION * (1 - dRight / halfDist);
  }
  if (dTop < dist) {
    const t = 1 - dTop / dist;
    f.vy += FISH_WALL_AVOIDANCE_STRENGTH * t * approachTop;
    if (dTop < halfDist) f.vy += FISH_WALL_HARD_REPULSION * (1 - dTop / halfDist);
  }
  if (dBottom < dist) {
    const t = 1 - dBottom / dist;
    f.vy -= FISH_WALL_AVOIDANCE_STRENGTH * t * approachBottom;
    if (dBottom < halfDist) f.vy -= FISH_WALL_HARD_REPULSION * (1 - dBottom / halfDist);
  }
}

// ---------------------------------------------------------------------------
// Fish-to-fish separation — sociability reduces force
// ---------------------------------------------------------------------------

export function applySeparation(f: FishEntity, allFish: FishEntity[]): void {
  for (const other of allFish) {
    if (other.id === f.id) continue;
    const dx = f.x - other.x;
    const dy = f.y - other.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < FISH_SEPARATION_DISTANCE && dist > 0) {
      // Social fish tolerate closer proximity
      const socFactor = 1 - f.personality.sociability * FISH_SOCIABILITY_SEPARATION_FACTOR;
      const force = FISH_SEPARATION_STRENGTH * (1 - dist / FISH_SEPARATION_DISTANCE) * socFactor;
      f.vx += (dx / dist) * force;
      f.vy += (dy / dist) * force;
    }
  }
}

// ---------------------------------------------------------------------------
// Speed limiting
// ---------------------------------------------------------------------------

function applySpeedLimit(f: FishEntity, isNight: boolean): void {
  const nightMul = isNight ? FISH_NIGHT_SPEED_MULTIPLIER : 1;
  const maxSpeed = (FISH_BASE_SPEED + FISH_SPEED_VARIATION * f.personality.energy) * nightMul;
  const currentSpeed = Math.sqrt(f.vx * f.vx + f.vy * f.vy);
  if (currentSpeed > maxSpeed) {
    f.vx = (f.vx / currentSpeed) * maxSpeed;
    f.vy = (f.vy / currentSpeed) * maxSpeed;
  }
}

// ---------------------------------------------------------------------------
// Position application + clamping
// ---------------------------------------------------------------------------

function applyPosition(f: FishEntity): void {
  f.x += f.vx;
  f.y += f.vy;

  const minX = TANK_PADDING + 20;
  const maxX = TANK_WIDTH - TANK_PADDING - 20;
  const minY = WATER_SURFACE_Y + 20;
  const maxY = TANK_FLOOR_Y - 20;

  if (f.x < minX) { f.x = minX; f.vx = Math.abs(f.vx) * 0.3; }
  if (f.x > maxX) { f.x = maxX; f.vx = -Math.abs(f.vx) * 0.3; }
  if (f.y < minY) { f.y = minY; f.vy = Math.abs(f.vy) * 0.3; }
  if (f.y > maxY) { f.y = maxY; f.vy = -Math.abs(f.vy) * 0.3; }
}

// ---------------------------------------------------------------------------
// Food finding
// ---------------------------------------------------------------------------

export function findNearestFood(fish: FishEntity, pellets: FoodPellet[]): FoodPellet | null {
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

/** Enter the eating pause state after consuming food */
export function startEatingPause(fish: FishEntity): FishEntity {
  return {
    ...fish,
    state: "eating" as const,
    stateTimer: FISH_EATING_PAUSE_TICKS,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Shortest signed angle distance from a to b */
function shortAngleDist(a: number, b: number): number {
  const d = ((b - a + Math.PI) % (Math.PI * 2)) - Math.PI;
  return d < -Math.PI ? d + Math.PI * 2 : d;
}
