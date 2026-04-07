/** Core balance constants for FishIO v1 */

/** How many real-world milliseconds = 1 simulation tick */
export const TICK_INTERVAL_MS = 1000;

/** Hunger increases by this much per tick (0-100 scale, ~4h to starve from full) */
export const HUNGER_RATE_PER_TICK = 100 / (4 * 60 * 60);

/** Cleanliness degrades by this per tick (~8h from clean to dirty) */
export const CLEANLINESS_DECAY_PER_TICK = 100 / (8 * 60 * 60);

/** How much one food pellet reduces hunger */
export const FOOD_HUNGER_RESTORE = 25;

/** How long a food pellet lasts in water (seconds) before dissolving */
export const FOOD_PELLET_LIFETIME_S = 600;

/** How fast food pellets sink (pixels per tick) */
export const FOOD_SINK_SPEED = 6;

/** Starting gold for new game */
export const STARTING_GOLD = 100;

/** Starting fish count */
export const STARTING_FISH_COUNT = 2;

/** Max hunger before health starts declining */
export const HUNGER_DANGER_THRESHOLD = 80;

/** Health decline per tick when hunger is dangerous */
export const HEALTH_DECLINE_RATE = 100 / (6 * 60 * 60);

/** Happiness boost from feeding (instant) */
export const HAPPINESS_FEED_BOOST = 10;

/** Happiness passive decay per tick when conditions are poor */
export const HAPPINESS_DECAY_PER_TICK = 100 / (12 * 60 * 60);

/** Happiness passive recovery per tick when conditions are good */
export const HAPPINESS_RECOVERY_PER_TICK = 100 / (6 * 60 * 60);

/** Dirty spot spawn chance per tick */
export const DIRTY_SPOT_SPAWN_CHANCE = 1 / (5 * 60);

/** Max dirty spots before cleanliness tanks */
export const MAX_DIRTY_SPOTS = 8;

/** Cleaning one spot restores this much cleanliness */
export const CLEAN_SPOT_RESTORE = 12;

/** Night hours (24h clock) */
export const NIGHT_START_HOUR = 21;
export const NIGHT_END_HOUR = 7;

/** Breeding cooldown in real hours */
export const BREEDING_COOLDOWN_HOURS = 24;

/** Egg hatch time in real hours */
export const EGG_HATCH_HOURS = 12;

/** Fry to juvenile growth time in real hours */
export const FRY_GROWTH_HOURS = 24;
