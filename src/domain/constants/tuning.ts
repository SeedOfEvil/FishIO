/** Visual and movement tuning constants */

/** Tank dimensions (SVG viewBox units) */
export const TANK_WIDTH = 800;
export const TANK_HEIGHT = 500;
export const TANK_PADDING = 30;

/** Water surface Y position */
export const WATER_SURFACE_Y = 60;

/** Sand/gravel floor Y position */
export const TANK_FLOOR_Y = 460;

/** Fish movement */
export const FISH_BASE_SPEED = 0.4;
export const FISH_SPEED_VARIATION = 0.15;
export const FISH_TURN_SMOOTHING = 0.05;
export const FISH_WALL_AVOIDANCE_DISTANCE = 50;
export const FISH_WALL_AVOIDANCE_STRENGTH = 0.8;
export const FISH_SEPARATION_DISTANCE = 40;
export const FISH_SEPARATION_STRENGTH = 0.3;
export const FISH_FOOD_ATTRACTION_RANGE = 200;
export const FISH_FOOD_ATTRACTION_STRENGTH = 0.6;
export const FISH_NIGHT_SPEED_MULTIPLIER = 0.4;
export const FISH_IDLE_CHANCE = 0.002;
export const FISH_IDLE_DURATION_TICKS = 120;

/** Fish visual sizes by age stage */
export const FISH_SIZE = {
  fry: { width: 16, height: 10 },
  juvenile: { width: 28, height: 18 },
  adult: { width: 40, height: 26 },
} as const;

/** Bubble settings */
export const BUBBLE_SPAWN_INTERVAL_MS = 3000;
export const BUBBLE_RISE_SPEED = 0.5;
export const BUBBLE_WOBBLE_AMOUNT = 0.3;
export const MAX_BUBBLES = 12;

/** Plant sway */
export const PLANT_SWAY_SPEED = 0.001;
export const PLANT_SWAY_AMOUNT = 3;
