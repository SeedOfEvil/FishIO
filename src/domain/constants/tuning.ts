/** Visual and movement tuning constants */

/** Tank dimensions (SVG viewBox units) */
export const TANK_WIDTH = 800;
export const TANK_HEIGHT = 500;
export const TANK_PADDING = 30;

/** Water surface Y position */
export const WATER_SURFACE_Y = 60;

/** Sand/gravel floor Y position */
export const TANK_FLOOR_Y = 460;

// ---------------------------------------------------------------------------
// Fish movement — base physics
// ---------------------------------------------------------------------------

export const FISH_BASE_SPEED = 0.5;
export const FISH_SPEED_VARIATION = 0.15;
/** Per-tick velocity blend toward desired (0-1). Lower = smoother turns */
export const FISH_TURN_SMOOTHING = 0.14;
/** Minimum speed fish always maintain — prevents "dead still" look */
export const FISH_MIN_SPEED = 0.06;

// ---------------------------------------------------------------------------
// Wall avoidance
// ---------------------------------------------------------------------------

export const FISH_WALL_AVOIDANCE_DISTANCE = 70;
export const FISH_WALL_AVOIDANCE_STRENGTH = 0.15;
/** Extra repulsion very close to walls (within half the avoidance distance) */
export const FISH_WALL_HARD_REPULSION = 0.5;
/** Extra avoidance when swimming toward a wall (anticipatory steering) */
export const FISH_WALL_APPROACH_MULTIPLIER = 1.8;

// ---------------------------------------------------------------------------
// Fish-to-fish separation
// ---------------------------------------------------------------------------

export const FISH_SEPARATION_DISTANCE = 45;
export const FISH_SEPARATION_STRENGTH = 0.25;
/** Sociability reduces separation force — social fish tolerate closer proximity */
export const FISH_SOCIABILITY_SEPARATION_FACTOR = 0.5;

// ---------------------------------------------------------------------------
// Food attraction
// ---------------------------------------------------------------------------

export const FISH_FOOD_ATTRACTION_RANGE = 250;
export const FISH_FOOD_ATTRACTION_STRENGTH = 0.5;
/** Hunger threshold before a fish starts looking for food (0-100 hunger scale) */
export const FISH_FOOD_NOTICE_HUNGER = 25;
/** Ticks the fish pauses after eating a pellet */
export const FISH_EATING_PAUSE_TICKS = 15;

// ---------------------------------------------------------------------------
// Wandering
// ---------------------------------------------------------------------------

/** Strength of the wander steering force */
export const FISH_WANDER_STRENGTH = 0.09;
/** How quickly the wander angle drifts (radians per tick) */
export const FISH_WANDER_ANGLE_DRIFT = 0.12;
/** Chance per tick a roaming fish picks a brand-new wander target */
export const FISH_WANDER_RETARGET_CHANCE = 0.01;
/** Chance per tick to enter a short cruise (straight-line swim) */
export const FISH_CRUISE_CHANCE = 0.006;
/** Ticks a cruise lasts (base — varied ×0.5-1.5) */
export const FISH_CRUISE_DURATION = 80;

// ---------------------------------------------------------------------------
// Vertical drift — buoyant depth variation
// ---------------------------------------------------------------------------

/** Strength of ambient vertical oscillation */
export const FISH_VERTICAL_DRIFT_STRENGTH = 0.012;
/** Speed of vertical drift oscillation (radians per tick) */
export const FISH_VERTICAL_DRIFT_SPEED = 0.03;

// ---------------------------------------------------------------------------
// Hovering (gentle pause, distinct from idle)
// ---------------------------------------------------------------------------

/** Chance per tick a roaming fish starts hovering */
export const FISH_HOVER_CHANCE = 0.003;
/** Base ticks for a hover */
export const FISH_HOVER_DURATION = 35;
/** Velocity damping each tick while hovering */
export const FISH_HOVER_DAMPING = 0.94;

// ---------------------------------------------------------------------------
// Investigating (curious fish look at something specific)
// ---------------------------------------------------------------------------

/** Chance per tick (scaled by curiosity) to start investigating */
export const FISH_INVESTIGATE_CHANCE = 0.003;
/** Base ticks for an investigation */
export const FISH_INVESTIGATE_DURATION = 45;

// ---------------------------------------------------------------------------
// Idle
// ---------------------------------------------------------------------------

export const FISH_IDLE_CHANCE = 0.001;
export const FISH_IDLE_DURATION_TICKS = 40;

// ---------------------------------------------------------------------------
// Idle drift — keeps fish alive-looking during paused states
// ---------------------------------------------------------------------------

/** Strength of random micro-drift injected during idle/hover/rest */
export const FISH_IDLE_DRIFT_STRENGTH = 0.012;
/** How often (chance per tick) an idle fish gets a micro-nudge */
export const FISH_IDLE_DRIFT_CHANCE = 0.15;

// ---------------------------------------------------------------------------
// Night behavior
// ---------------------------------------------------------------------------

export const FISH_NIGHT_SPEED_MULTIPLIER = 0.45;
/** Extra downward drift per tick at night */
export const FISH_NIGHT_SINK_FORCE = 0.005;
/** Y threshold below which night fish stop sinking further */
export const FISH_NIGHT_SINK_FLOOR_OFFSET = 100;
/** Chance per tick a fish transitions to resting at night */
export const FISH_NIGHT_REST_CHANCE = 0.012;
/** Chance per tick a fish transitions to hovering at night */
export const FISH_NIGHT_HOVER_CHANCE = 0.01;
/** Velocity damping per tick while resting */
export const FISH_REST_DAMPING = 0.96;

// ---------------------------------------------------------------------------
// Fish visual sizes by age stage
// ---------------------------------------------------------------------------

export const FISH_SIZE = {
  fry: { width: 16, height: 10 },
  juvenile: { width: 28, height: 18 },
  adult: { width: 40, height: 26 },
} as const;

// ---------------------------------------------------------------------------
// Decorative: bubbles & plants
// ---------------------------------------------------------------------------

export const BUBBLE_SPAWN_INTERVAL_MS = 3000;
export const BUBBLE_RISE_SPEED = 0.5;
export const BUBBLE_WOBBLE_AMOUNT = 0.3;
export const MAX_BUBBLES = 12;

export const PLANT_SWAY_SPEED = 0.001;
export const PLANT_SWAY_AMOUNT = 3;
