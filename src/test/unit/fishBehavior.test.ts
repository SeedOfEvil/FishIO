import { describe, it, expect } from "vitest";
import {
  updateFishBehavior,
  applyWallAvoidance,
  applySeparation,
  findNearestFood,
  canEatFood,
  decideState,
  type BehaviorContext,
} from "@/domain/fish/fishBehavior";
import { createFish, createFoodPellet } from "@/domain/fish/fishFactory";
import type { FishEntity, FoodPellet } from "@/domain/fish/fishTypes";
import {
  TANK_PADDING,
  TANK_WIDTH,
  WATER_SURFACE_Y,
  TANK_FLOOR_Y,
  FISH_SEPARATION_DISTANCE,
  FISH_FOOD_ATTRACTION_RANGE,
} from "@/domain/constants/tuning";

function makeCtx(overrides?: Partial<BehaviorContext>): BehaviorContext {
  return {
    allFish: [],
    foodPellets: [],
    isNight: false,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// 1. Behavior state transitions
// ---------------------------------------------------------------------------

describe("behavior state transitions", () => {
  it("fish in idle state counts down stateTimer", () => {
    const fish = createFish({ state: "idle", stateTimer: 5 });
    const updated = updateFishBehavior(fish, makeCtx());
    expect(updated.stateTimer).toBeLessThan(5);
  });

  it("fish transitions from idle to roaming when timer expires", () => {
    const fish = createFish({ state: "idle", stateTimer: 1 });
    const updated = updateFishBehavior(fish, makeCtx());
    expect(updated.state).not.toBe("idle");
  });

  it("eating state pauses and then transitions out", () => {
    const fish = createFish({ state: "eating", stateTimer: 1, vx: 0.3, vy: 0.1 });
    const updated = updateFishBehavior(fish, makeCtx());
    // Timer expired → should leave eating
    expect(updated.state).not.toBe("eating");
  });

  it("hovering state applies damping", () => {
    const fish = createFish({ state: "hovering", stateTimer: 30, vx: 0.5, vy: 0.2 });
    const updated = updateFishBehavior(fish, makeCtx());
    const speed = Math.sqrt(updated.vx ** 2 + updated.vy ** 2);
    const origSpeed = Math.sqrt(0.5 ** 2 + 0.2 ** 2);
    expect(speed).toBeLessThan(origSpeed);
  });

  it("investigating state uses curiosity", () => {
    const curious = createFish({
      state: "investigating",
      stateTimer: 20,
      personality: { energy: 0.5, sociability: 0.5, boldness: 0.5, appetite: 0.8, curiosity: 0.9 },
      vx: 0,
      vy: 0,
      x: 400,
      y: 300,
    });
    const updated = updateFishBehavior(curious, makeCtx());
    // Should have some velocity from investigating drift
    expect(Math.abs(updated.vx) + Math.abs(updated.vy)).toBeGreaterThan(0);
  });

  it("resting state wakes up when night ends", () => {
    const fish = createFish({ state: "resting", stateTimer: 100 });
    const updated = updateFishBehavior(fish, makeCtx({ isNight: false }));
    expect(updated.state).toBe("roaming");
  });

  it("resting state stays resting during night", () => {
    const fish = createFish({ state: "resting", stateTimer: 100, x: 400, y: 200 });
    const updated = updateFishBehavior(fish, makeCtx({ isNight: true }));
    expect(updated.state).toBe("resting");
  });

  it("seeking_food state triggers when hungry with nearby food", () => {
    const fish = createFish({
      state: "roaming",
      stateTimer: 0,
      hunger: 60,
      x: 400,
      y: 300,
      personality: { energy: 0.5, sociability: 0.5, boldness: 0.8, appetite: 0.8, curiosity: 0.5 },
    });
    const pellet = createFoodPellet(420);
    pellet.y = 310;
    const updated = updateFishBehavior(fish, makeCtx({ foodPellets: [pellet] }));
    expect(updated.state).toBe("seeking_food");
  });
});

// ---------------------------------------------------------------------------
// 2. Wall avoidance
// ---------------------------------------------------------------------------

describe("wall avoidance", () => {
  it("pushes fish away from left wall", () => {
    const fish = createFish({ x: TANK_PADDING + 10, y: 250, vx: 0, vy: 0 });
    applyWallAvoidance(fish);
    expect(fish.vx).toBeGreaterThan(0);
  });

  it("pushes fish away from right wall", () => {
    const fish = createFish({ x: TANK_WIDTH - TANK_PADDING - 10, y: 250, vx: 0, vy: 0 });
    applyWallAvoidance(fish);
    expect(fish.vx).toBeLessThan(0);
  });

  it("pushes fish away from top (water surface)", () => {
    const fish = createFish({ x: 400, y: WATER_SURFACE_Y + 10, vx: 0, vy: 0 });
    applyWallAvoidance(fish);
    expect(fish.vy).toBeGreaterThan(0);
  });

  it("pushes fish away from bottom (tank floor)", () => {
    const fish = createFish({ x: 400, y: TANK_FLOOR_Y - 10, vx: 0, vy: 0 });
    applyWallAvoidance(fish);
    expect(fish.vy).toBeLessThan(0);
  });

  it("applies stronger force very close to wall (hard repulsion)", () => {
    const nearFish = createFish({ x: TANK_PADDING + 5, y: 250, vx: 0, vy: 0 });
    const farFish = createFish({ x: TANK_PADDING + 40, y: 250, vx: 0, vy: 0 });
    applyWallAvoidance(nearFish);
    applyWallAvoidance(farFish);
    expect(nearFish.vx).toBeGreaterThan(farFish.vx);
  });

  it("does not affect fish in center of tank", () => {
    const fish = createFish({ x: 400, y: 250, vx: 0, vy: 0 });
    applyWallAvoidance(fish);
    expect(fish.vx).toBe(0);
    expect(fish.vy).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// 3. Food attraction choice
// ---------------------------------------------------------------------------

describe("food attraction", () => {
  it("findNearestFood returns closest unclaimed pellet", () => {
    const fish = createFish({ x: 100, y: 200 });
    const far: FoodPellet = { id: "f1", x: 300, y: 200, lifetime: 10, claimed: false };
    const near: FoodPellet = { id: "f2", x: 120, y: 210, lifetime: 10, claimed: false };
    const result = findNearestFood(fish, [far, near]);
    expect(result?.id).toBe("f2");
  });

  it("findNearestFood skips claimed pellets", () => {
    const fish = createFish({ x: 100, y: 200 });
    const claimed: FoodPellet = { id: "f1", x: 105, y: 200, lifetime: 10, claimed: true };
    const unclaimed: FoodPellet = { id: "f2", x: 200, y: 200, lifetime: 10, claimed: false };
    const result = findNearestFood(fish, [claimed, unclaimed]);
    expect(result?.id).toBe("f2");
  });

  it("findNearestFood returns null when all food is out of range", () => {
    const fish = createFish({ x: 100, y: 200 });
    const far: FoodPellet = { id: "f1", x: 100 + FISH_FOOD_ATTRACTION_RANGE + 50, y: 200, lifetime: 10, claimed: false };
    expect(findNearestFood(fish, [far])).toBeNull();
  });

  it("bold hungry fish moves toward food", () => {
    const fish = createFish({
      x: 400, y: 300, vx: 0, vy: 0,
      hunger: 70,
      state: "roaming", stateTimer: 0,
      personality: { energy: 0.5, sociability: 0.5, boldness: 0.9, appetite: 0.8, curiosity: 0.5 },
    });
    const pellet: FoodPellet = { id: "f1", x: 450, y: 300, lifetime: 10, claimed: false };
    const updated = updateFishBehavior(fish, makeCtx({ foodPellets: [pellet] }));
    // Should be moving rightward toward food
    expect(updated.vx).toBeGreaterThan(fish.vx);
  });

  it("low-hunger fish ignores nearby food", () => {
    const fish = createFish({
      x: 400, y: 300, vx: 0, vy: 0,
      hunger: 10,
      state: "roaming", stateTimer: 0,
      personality: { energy: 0.5, sociability: 0.5, boldness: 0.9, appetite: 0.8, curiosity: 0.5 },
    });
    const pellet: FoodPellet = { id: "f1", x: 420, y: 300, lifetime: 10, claimed: false };
    const updated = updateFishBehavior(fish, makeCtx({ foodPellets: [pellet] }));
    expect(updated.state).not.toBe("seeking_food");
  });
});

// ---------------------------------------------------------------------------
// 4. Nighttime calm behavior
// ---------------------------------------------------------------------------

describe("nighttime behavior", () => {
  it("night speed limit is lower than day speed limit", () => {
    const fish = createFish({
      x: 400, y: 250, vx: 0.5, vy: 0,
      state: "roaming", stateTimer: 0,
      personality: { energy: 0.8, sociability: 0.5, boldness: 0.5, appetite: 0.8, curiosity: 0.5 },
    });

    const dayResult = updateFishBehavior(fish, makeCtx({ isNight: false }));
    const nightResult = updateFishBehavior(fish, makeCtx({ isNight: true }));

    const daySpeed = Math.sqrt(dayResult.vx ** 2 + dayResult.vy ** 2);
    const nightSpeed = Math.sqrt(nightResult.vx ** 2 + nightResult.vy ** 2);
    expect(nightSpeed).toBeLessThanOrEqual(daySpeed + 0.01); // small epsilon
  });

  it("resting fish drifts downward at night", () => {
    const fish = createFish({
      state: "resting", stateTimer: 50,
      x: 400, y: 200, vx: 0, vy: 0,
    });
    const updated = updateFishBehavior(fish, makeCtx({ isNight: true }));
    expect(updated.vy).toBeGreaterThan(0);
  });

  it("night reduces wander energy via speed multiplier", () => {
    // Run many ticks and compare average speed
    let dayTotal = 0;
    let nightTotal = 0;
    let fish = createFish({ x: 400, y: 250, vx: 0, vy: 0, state: "roaming", stateTimer: 0 });

    for (let i = 0; i < 100; i++) {
      const dayF = updateFishBehavior(fish, makeCtx({ isNight: false }));
      dayTotal += Math.sqrt(dayF.vx ** 2 + dayF.vy ** 2);
      const nightF = updateFishBehavior(fish, makeCtx({ isNight: true }));
      nightTotal += Math.sqrt(nightF.vx ** 2 + nightF.vy ** 2);
    }

    expect(nightTotal).toBeLessThan(dayTotal);
  });
});

// ---------------------------------------------------------------------------
// 5. Personality effect differences
// ---------------------------------------------------------------------------

describe("personality effects", () => {
  it("energetic fish has higher max speed", () => {
    const base = { x: 400, y: 250, vx: 1, vy: 0, state: "roaming" as const, stateTimer: 0 };
    const lowEnergy = createFish({
      ...base,
      personality: { energy: 0.1, sociability: 0.5, boldness: 0.5, appetite: 0.8, curiosity: 0.5 },
    });
    const highEnergy = createFish({
      ...base,
      personality: { energy: 0.9, sociability: 0.5, boldness: 0.5, appetite: 0.8, curiosity: 0.5 },
    });

    const lowResult = updateFishBehavior(lowEnergy, makeCtx());
    const highResult = updateFishBehavior(highEnergy, makeCtx());
    const lowSpeed = Math.sqrt(lowResult.vx ** 2 + lowResult.vy ** 2);
    const highSpeed = Math.sqrt(highResult.vx ** 2 + highResult.vy ** 2);
    expect(highSpeed).toBeGreaterThan(lowSpeed);
  });

  it("bold fish approaches food faster", () => {
    const baseProps = {
      x: 400, y: 300, vx: 0, vy: 0, hunger: 70,
      state: "roaming" as const, stateTimer: 0,
    };
    const timid = createFish({
      ...baseProps,
      personality: { energy: 0.5, sociability: 0.5, boldness: 0.2, appetite: 0.8, curiosity: 0.5 },
    });
    const bold = createFish({
      ...baseProps,
      personality: { energy: 0.5, sociability: 0.5, boldness: 0.9, appetite: 0.8, curiosity: 0.5 },
    });
    const pellet: FoodPellet = { id: "f1", x: 500, y: 300, lifetime: 10, claimed: false };
    const ctx = makeCtx({ foodPellets: [pellet] });

    const timidResult = updateFishBehavior(timid, ctx);
    const boldResult = updateFishBehavior(bold, ctx);

    // Bold fish should have more rightward velocity toward food
    expect(boldResult.vx).toBeGreaterThan(timidResult.vx);
  });

  it("social fish tolerates closer proximity (weaker separation)", () => {
    const neighborPos = { x: 420, y: 300 };
    const neighbor = createFish({ ...neighborPos, id: "other" });

    const loner = createFish({
      x: 400, y: 300, vx: 0, vy: 0, id: "loner",
      personality: { energy: 0.5, sociability: 0.1, boldness: 0.5, appetite: 0.8, curiosity: 0.5 },
    });
    const social = createFish({
      x: 400, y: 300, vx: 0, vy: 0, id: "social",
      personality: { energy: 0.5, sociability: 0.9, boldness: 0.5, appetite: 0.8, curiosity: 0.5 },
    });

    // Apply separation directly
    applySeparation(loner, [loner, neighbor]);
    applySeparation(social, [social, neighbor]);

    // Loner should be pushed away more (more negative vx since neighbor is to the right)
    expect(Math.abs(loner.vx)).toBeGreaterThan(Math.abs(social.vx));
  });

  it("curious fish enters investigating state more often (statistical)", () => {
    // This is probabilistic — run many trials
    let curiousInvestigations = 0;
    let boringInvestigations = 0;

    for (let i = 0; i < 2000; i++) {
      const curious = createFish({
        x: 400, y: 250, state: "roaming", stateTimer: 0,
        personality: { energy: 0.5, sociability: 0.5, boldness: 0.5, appetite: 0.8, curiosity: 0.95 },
      });
      const boring = createFish({
        x: 400, y: 250, state: "roaming", stateTimer: 0,
        personality: { energy: 0.5, sociability: 0.5, boldness: 0.5, appetite: 0.8, curiosity: 0.05 },
      });
      const ctx = makeCtx();

      decideState(curious, ctx);
      decideState(boring, ctx);

      if (curious.state === "investigating") curiousInvestigations++;
      if (boring.state === "investigating") boringInvestigations++;
    }

    expect(curiousInvestigations).toBeGreaterThan(boringInvestigations);
  });
});

// ---------------------------------------------------------------------------
// 6. Separation
// ---------------------------------------------------------------------------

describe("fish separation", () => {
  it("pushes apart fish that are too close", () => {
    const a = createFish({ x: 400, y: 300, vx: 0, vy: 0, id: "a" });
    const b = createFish({ x: 410, y: 300, vx: 0, vy: 0, id: "b" });
    applySeparation(a, [a, b]);
    // a is to the left of b, so should be pushed further left
    expect(a.vx).toBeLessThan(0);
  });

  it("does not push apart fish beyond separation distance", () => {
    const a = createFish({ x: 100, y: 300, vx: 0, vy: 0, id: "a" });
    const b = createFish({ x: 100 + FISH_SEPARATION_DISTANCE + 20, y: 300, vx: 0, vy: 0, id: "b" });
    applySeparation(a, [a, b]);
    expect(a.vx).toBe(0);
  });
});
