import type { FishEntity, FishState, FoodPellet } from "./fishTypes";
import { SPECIES } from "./fishSpecies";
import {
  TANK_PADDING,
  TANK_WIDTH,
  WATER_SURFACE_Y,
  TANK_FLOOR_Y,
  FISH_BASE_SPEED,
  FISH_SPEED_VARIATION,
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
// Global tick counter (kept for API compat with tests)
// ---------------------------------------------------------------------------

let _behaviorTick = 0;

export function advanceBehaviorTick(): void {
  _behaviorTick++;
}

export function getBehaviorTick(): number {
  return _behaviorTick;
}

export function resetBehaviorTick(): void {
  _behaviorTick = 0;
}

// ---------------------------------------------------------------------------
// Per-fish species helpers
// ---------------------------------------------------------------------------

function speciesSpeedMul(f: FishEntity): number {
  const def = SPECIES[f.species];
  if (!def) return 1;
  return 1.3 - def.sizeMultiplier * 0.35;
}

function speciesTurnRate(f: FishEntity): number {
  const def = SPECIES[f.species];
  if (!def) return 1;
  switch (def.bodyShape) {
    case "slender": return 1.3;
    case "elongated": return 1.1;
    case "round": return 0.7;
    case "tall": return 0.8;
    case "flat": return 0.85;
    default: return 1.0;
  }
}

// ---------------------------------------------------------------------------
// SLOW TICK (1/sec): behavior decisions, state machine, wander angle, timers
// Called from store.tick()
// ---------------------------------------------------------------------------

export function updateFishBehavior(
  fish: FishEntity,
  ctx: BehaviorContext,
): FishEntity {
  const f = { ...fish };

  // Advance per-fish local tick
  f.localTick = (f.localTick ?? 0) + 1;

  // --- timed-state countdown ---
  if (isTimedState(f.state)) {
    f.stateTimer -= 1;
    if (f.stateTimer <= 0) {
      f.state = "roaming";
    } else if (f.state === "investigating") {
      // Slowly rotate wander angle for investigation arc
      const ps = f.phaseSeed ?? 0;
      const arcFreq = 0.02 + (ps % 40) * 0.0005;
      f.wanderAngle += Math.sin(f.localTick * arcFreq + ps) * 0.1;
    } else if (f.state === "resting" && !ctx.isNight) {
      f.state = "roaming";
      f.stateTimer = 0;
    }
  } else {
    // --- decide next state ---
    decideState(f, ctx);

    // --- update wander angle (roaming only) ---
    if (f.state === "roaming") {
      updateWanderAngle(f);
    }
  }

  return f;
}

// ---------------------------------------------------------------------------
// FAST MOVE (per-frame): steering forces, velocity, position
// Called from the RAF movement loop. `dt` is seconds since last frame.
// ---------------------------------------------------------------------------

export function moveFish(
  fish: FishEntity,
  allFish: FishEntity[],
  foodPellets: FoodPellet[],
  isNight: boolean,
  dt: number,
): FishEntity {
  const f = { ...fish };
  const ps = f.phaseSeed ?? 0;
  const lt = f.localTick ?? 0;

  // --- Light water drag (species-dependent) ---
  // Gives fish a "glide" feel: they coast after pushing.
  // Slender fish: less drag (0.998/frame ≈ 89% kept/sec) = long glide
  // Round fish:   more drag (0.994/frame ≈ 70% kept/sec) = shorter glide
  const shapeDrag: Record<string, number> = {
    slender: 0.998, elongated: 0.997, standard: 0.996, tall: 0.995, round: 0.994, flat: 0.995,
  };
  const baseDrag = shapeDrag[SPECIES[f.species]?.bodyShape ?? "standard"] ?? 0.996;
  const drag = Math.pow(baseDrag, dt * 60);
  f.vx *= drag;
  f.vy *= drag;

  // --- Continuous wander angle drift (smooth curves between ticks) ---
  if (f.state === "roaming" || f.state === "seeking_food") {
    const driftRate = 0.3 * (0.5 + f.personality.curiosity * 0.5);
    f.wanderAngle += Math.sin(lt * 0.07 + ps) * driftRate * dt;
  }

  // --- Steering forces (scaled by dt) ---
  if (f.state === "seeking_food") {
    applyFoodAttraction(f, foodPellets, dt);
  } else if (f.state === "roaming") {
    applyWander(f, isNight, dt);
  } else if (isTimedState(f.state)) {
    applyTimedStateBehavior(f, lt, ps, dt);
  }

  // Ambient vertical drift — per-fish unique frequency, very gentle
  const driftFreq = FISH_VERTICAL_DRIFT_SPEED * (0.7 + (ps % 100) * 0.006);
  const driftAmp = FISH_VERTICAL_DRIFT_STRENGTH * (0.3 + f.personality.energy * 0.3);
  f.vy += Math.sin(lt + Date.now() * driftFreq * 0.001 + ps) * driftAmp * dt;

  // Night sink
  if (isNight && f.y < TANK_FLOOR_Y - FISH_NIGHT_SINK_FLOOR_OFFSET) {
    f.vy += FISH_NIGHT_SINK_FORCE * 0.5 * dt;
  }

  // Wall avoidance
  applyWallAvoidance(f, dt);

  // Neighbor separation
  applySeparation(f, allFish, dt);

  // --- Speed limit ---
  applySpeedLimit(f, isNight);

  // --- Facing direction (hysteresis) ---
  if (Math.abs(f.vx) > 1.0) {
    f.facingDirection = f.vx > 0 ? 1 : -1;
  }

  // --- Position update ---
  f.x += f.vx * dt;
  f.y += f.vy * dt;

  // Clamp to tank bounds
  clampPosition(f);

  return f;
}

// ---------------------------------------------------------------------------
// Timed state behavior (applied per-frame for smooth motion)
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

function applyTimedStateBehavior(f: FishEntity, lt: number, ps: number, dtScale: number): void {
  const t = lt + Date.now() * 0.001; // combine local tick with real time for smooth oscillation

  switch (f.state) {
    case "idle": {
      f.vx *= Math.pow(0.96, dtScale * 60);
      f.vy *= Math.pow(0.96, dtScale * 60);
      applyIdleDrift(f, dtScale);
      const bobFreq = 0.8 + (ps % 100) * 0.008;
      f.vy += Math.sin(t * bobFreq + ps) * 0.06 * dtScale;
      break;
    }
    case "eating": {
      f.vx *= Math.pow(0.93, dtScale * 60);
      f.vy *= Math.pow(0.93, dtScale * 60);
      const nibFreq = 2.5 + (ps % 50) * 0.04;
      f.vy += Math.sin(t * nibFreq + ps * 1.3) * 0.12 * dtScale;
      applyIdleDrift(f, dtScale);
      break;
    }
    case "hovering": {
      f.vx *= Math.pow(FISH_HOVER_DAMPING, dtScale * 60);
      f.vy *= Math.pow(FISH_HOVER_DAMPING, dtScale * 60);
      const hoverBobFreq = 1.0 + (ps % 80) * 0.01;
      const hoverSwayFreq = 0.6 + (ps % 60) * 0.008;
      f.vy += Math.sin(t * hoverBobFreq + ps) * 0.25 * dtScale;
      f.vx += Math.sin(t * hoverSwayFreq + ps * 1.7) * 0.08 * dtScale;
      break;
    }
    case "investigating": {
      const strength = 0.5 * f.personality.curiosity * dtScale;
      f.vx += Math.cos(f.wanderAngle) * strength;
      f.vy += Math.sin(f.wanderAngle) * strength;
      f.vx *= Math.pow(0.95, dtScale * 60);
      f.vy *= Math.pow(0.95, dtScale * 60);
      break;
    }
    case "resting": {
      f.vx *= Math.pow(FISH_REST_DAMPING, dtScale * 60);
      f.vy *= Math.pow(FISH_REST_DAMPING, dtScale * 60);
      if (f.y < TANK_FLOOR_Y - FISH_NIGHT_SINK_FLOOR_OFFSET) {
        f.vy += FISH_NIGHT_SINK_FORCE * dtScale;
      }
      const breathFreq = 0.5 + (ps % 30) * 0.008;
      f.vy += Math.sin(t * breathFreq + ps) * 0.08 * dtScale;
      f.vx += Math.sin(t * breathFreq * 0.7 + ps * 2.1) * 0.06 * dtScale;
      break;
    }
  }
}

// ---------------------------------------------------------------------------
// Idle drift
// ---------------------------------------------------------------------------

function applyIdleDrift(f: FishEntity, dtScale: number): void {
  if (Math.random() < FISH_IDLE_DRIFT_CHANCE * dtScale) {
    const angle = f.wanderAngle + (Math.random() - 0.5) * 1.5;
    f.vx += Math.cos(angle) * FISH_IDLE_DRIFT_STRENGTH;
    f.vy += Math.sin(angle) * FISH_IDLE_DRIFT_STRENGTH * 0.7;
  }
}

// ---------------------------------------------------------------------------
// Minimum speed
// ---------------------------------------------------------------------------

function applyMinimumDrift(f: FishEntity): void {
  const speed = Math.sqrt(f.vx * f.vx + f.vy * f.vy);
  if (speed < FISH_MIN_SPEED && speed > 0) {
    const scale = FISH_MIN_SPEED / speed;
    f.vx *= scale;
    f.vy *= scale;
  } else if (speed === 0) {
    f.vx = Math.cos(f.wanderAngle) * FISH_MIN_SPEED;
    f.vy = Math.sin(f.wanderAngle) * FISH_MIN_SPEED * 0.5;
  }
}

// ---------------------------------------------------------------------------
// State decisions (slow tick only)
// ---------------------------------------------------------------------------

export function decideState(f: FishEntity, ctx: BehaviorContext): void {
  const nearestFood = findNearestFood(f, ctx.foodPellets);
  if (nearestFood && f.hunger > FISH_FOOD_NOTICE_HUNGER) {
    const interest = (f.hunger / 100) * (0.4 + 0.6 * f.personality.boldness);
    if (interest > 0.02) {
      f.state = "seeking_food";
      return;
    }
  }

  if (f.state === "seeking_food") {
    f.state = "roaming";
  }

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

  if (f.state === "roaming") {
    if (Math.random() < FISH_INVESTIGATE_CHANCE * f.personality.curiosity) {
      enterState(f, "investigating", FISH_INVESTIGATE_DURATION * (0.5 + Math.random()));
      f.wanderAngle = Math.random() * Math.PI * 2;
      return;
    }
    if (Math.random() < FISH_HOVER_CHANCE * (1 - f.personality.energy * 0.5)) {
      enterState(f, "hovering", FISH_HOVER_DURATION * (0.5 + Math.random()));
      return;
    }
    if (Math.random() < FISH_IDLE_CHANCE * (1 - f.personality.energy * 0.5)) {
      enterState(f, "idle", FISH_IDLE_DURATION_TICKS * (0.5 + Math.random()));
      return;
    }
    if (Math.random() < FISH_CRUISE_CHANCE * f.personality.energy) {
      f.wanderAngle = Math.atan2(f.vy, f.vx) + (Math.random() - 0.5) * 0.3;
      f.stateTimer = FISH_CRUISE_DURATION * (0.5 + Math.random());
    }
  }
}

function enterState(f: FishEntity, state: FishState, duration: number): void {
  f.state = state;
  f.stateTimer = Math.round(duration);
}

// ---------------------------------------------------------------------------
// Wander angle update (slow tick, not per-frame — keeps turns gradual)
// ---------------------------------------------------------------------------

function updateWanderAngle(f: FishEntity): void {
  const personalDrift = FISH_WANDER_ANGLE_DRIFT * (0.5 + f.personality.curiosity * 1.0);
  f.wanderAngle += (Math.random() - 0.5) * personalDrift;

  if (f.stateTimer <= 0 && Math.random() < FISH_WANDER_RETARGET_CHANCE) {
    const cx = TANK_WIDTH / 2;
    const cy = (WATER_SURFACE_Y + TANK_FLOOR_Y) / 2;
    const toCenterAngle = Math.atan2(cy - f.y, cx - f.x);
    const randomAngle = Math.random() * Math.PI * 2;
    f.wanderAngle = randomAngle + shortAngleDist(randomAngle, toCenterAngle) * 0.3;
  }

  if (f.stateTimer > 0) {
    f.stateTimer -= 1;
  }
}

// ---------------------------------------------------------------------------
// Steering forces (per-frame)
// ---------------------------------------------------------------------------

function applyWander(f: FishEntity, isNight: boolean, dtScale: number): void {
  const spdMul = speciesSpeedMul(f);
  // Stronger wander force to overcome water drag and reach cruising speed
  const strength = FISH_WANDER_STRENGTH * 2.5 * f.personality.energy * spdMul * (isNight ? 0.5 : 1) * dtScale;
  f.vx += Math.cos(f.wanderAngle) * strength;
  f.vy += Math.sin(f.wanderAngle) * strength * 0.7;
}

function applyFoodAttraction(f: FishEntity, pellets: FoodPellet[], dtScale: number): void {
  const target = findNearestFood(f, pellets);
  if (!target) return;

  const dx = target.x - f.x;
  const dy = target.y - f.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist <= 0) return;

  const urgency = 0.5 + 0.5 * (f.hunger / 100);
  const spdMul = speciesSpeedMul(f);
  const attraction = FISH_FOOD_ATTRACTION_STRENGTH * f.personality.boldness * urgency * spdMul * dtScale;
  f.vx += (dx / dist) * attraction;
  f.vy += (dy / dist) * attraction;
}

// ---------------------------------------------------------------------------
// Wall avoidance
// ---------------------------------------------------------------------------

export function applyWallAvoidance(f: FishEntity, dtScale = 1): void {
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

  const approachLeft = f.vx < 0 ? FISH_WALL_APPROACH_MULTIPLIER : 1;
  const approachRight = f.vx > 0 ? FISH_WALL_APPROACH_MULTIPLIER : 1;
  const approachTop = f.vy < 0 ? FISH_WALL_APPROACH_MULTIPLIER : 1;
  const approachBottom = f.vy > 0 ? FISH_WALL_APPROACH_MULTIPLIER : 1;

  if (dLeft < dist) {
    const t = 1 - dLeft / dist;
    f.vx += FISH_WALL_AVOIDANCE_STRENGTH * t * approachLeft * dtScale;
    if (dLeft < halfDist) f.vx += FISH_WALL_HARD_REPULSION * (1 - dLeft / halfDist) * dtScale;
  }
  if (dRight < dist) {
    const t = 1 - dRight / dist;
    f.vx -= FISH_WALL_AVOIDANCE_STRENGTH * t * approachRight * dtScale;
    if (dRight < halfDist) f.vx -= FISH_WALL_HARD_REPULSION * (1 - dRight / halfDist) * dtScale;
  }
  if (dTop < dist) {
    const t = 1 - dTop / dist;
    f.vy += FISH_WALL_AVOIDANCE_STRENGTH * t * approachTop * dtScale;
    if (dTop < halfDist) f.vy += FISH_WALL_HARD_REPULSION * (1 - dTop / halfDist) * dtScale;
  }
  if (dBottom < dist) {
    const t = 1 - dBottom / dist;
    f.vy -= FISH_WALL_AVOIDANCE_STRENGTH * t * approachBottom * dtScale;
    if (dBottom < halfDist) f.vy -= FISH_WALL_HARD_REPULSION * (1 - dBottom / halfDist) * dtScale;
  }
}

// ---------------------------------------------------------------------------
// Separation
// ---------------------------------------------------------------------------

export function applySeparation(f: FishEntity, allFish: FishEntity[], dtScale = 1): void {
  for (const other of allFish) {
    if (other.id === f.id) continue;
    const dx = f.x - other.x;
    const dy = f.y - other.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < FISH_SEPARATION_DISTANCE && dist > 0) {
      const socFactor = 1 - f.personality.sociability * FISH_SOCIABILITY_SEPARATION_FACTOR;
      const force = FISH_SEPARATION_STRENGTH * (1 - dist / FISH_SEPARATION_DISTANCE) * socFactor * dtScale;
      f.vx += (dx / dist) * force;
      f.vy += (dy / dist) * force;
    }
  }
}

// ---------------------------------------------------------------------------
// Speed limit
// ---------------------------------------------------------------------------

function applySpeedLimit(f: FishEntity, isNight: boolean): void {
  const nightMul = isNight ? FISH_NIGHT_SPEED_MULTIPLIER : 1;
  const spdMul = speciesSpeedMul(f);
  const maxSpeed = (FISH_BASE_SPEED + FISH_SPEED_VARIATION * f.personality.energy) * nightMul * spdMul;
  const currentSpeed = Math.sqrt(f.vx * f.vx + f.vy * f.vy);
  if (currentSpeed > maxSpeed) {
    f.vx = (f.vx / currentSpeed) * maxSpeed;
    f.vy = (f.vy / currentSpeed) * maxSpeed;
  }
}

// ---------------------------------------------------------------------------
// Position clamping
// ---------------------------------------------------------------------------

function clampPosition(f: FishEntity): void {
  if (!isFinite(f.x) || !isFinite(f.y) || !isFinite(f.vx) || !isFinite(f.vy)) {
    f.x = TANK_WIDTH / 2;
    f.y = (WATER_SURFACE_Y + TANK_FLOOR_Y) / 2;
    f.vx = (Math.random() - 0.5) * FISH_MIN_SPEED * 2;
    f.vy = (Math.random() - 0.5) * FISH_MIN_SPEED;
  }

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

export function canEatFood(fish: FishEntity, pellet: FoodPellet): boolean {
  const dx = fish.x - pellet.x;
  const dy = fish.y - pellet.y;
  return Math.sqrt(dx * dx + dy * dy) < 25;
}

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

function shortAngleDist(a: number, b: number): number {
  const d = ((b - a + Math.PI) % (Math.PI * 2)) - Math.PI;
  return d < -Math.PI ? d + Math.PI * 2 : d;
}
