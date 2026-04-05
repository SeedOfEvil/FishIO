export type Sex = "male" | "female";
export type AgeStage = "fry" | "juvenile" | "adult";
export type FishState = "roaming" | "eating" | "resting" | "idle" | "seeking_food";

export interface PersonalityTraits {
  /** 0-1: how active/fast the fish moves */
  energy: number;
  /** 0-1: how social (stays near others vs wanders alone) */
  sociability: number;
  /** 0-1: how bold (approaches food faster, less wall-shy) */
  boldness: number;
  /** 0-1: how hungry it gets (multiplier on hunger rate) */
  appetite: number;
}

export interface FishEntity {
  id: string;
  name: string;
  sex: Sex;
  ageStage: AgeStage;
  /** Real timestamp when this fish was born/created */
  bornAt: number;

  /** Needs (0-100, 0 = empty/worst, 100 = full/best) */
  hunger: number;
  health: number;
  happiness: number;
  energyLevel: number;

  personality: PersonalityTraits;

  /** Position in tank (SVG coords) */
  x: number;
  y: number;

  /** Current velocity */
  vx: number;
  vy: number;

  /** Which direction the fish faces: 1 = right, -1 = left */
  facingDirection: 1 | -1;

  /** Current behavioral state */
  state: FishState;

  /** Ticks remaining in idle state */
  idleTimer: number;

  /** Color hue for this fish (degrees, goldfish range) */
  colorHue: number;

  /** Breeding cooldown timestamp (0 = ready) */
  breedCooldownUntil: number;
}

export interface FoodPellet {
  id: string;
  x: number;
  y: number;
  /** Remaining lifetime in seconds */
  lifetime: number;
  /** Whether a fish has claimed this pellet */
  claimed: boolean;
}
