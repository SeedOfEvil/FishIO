import { describe, it, expect } from "vitest";
import { tickFishNeeds, feedFish, reconcileFishNeeds } from "@/domain/fish/fishNeeds";
import { createFish } from "@/domain/fish/fishFactory";

describe("fishNeeds", () => {
	it("hunger increases each tick", () => {
		const fish = createFish({ hunger: 20 });
		const updated = tickFishNeeds(fish, 100);
		expect(updated.hunger).toBeGreaterThan(20);
	});

	it("health declines when hunger is critical", () => {
		const fish = createFish({ hunger: 90, health: 80 });
		const updated = tickFishNeeds(fish, 100);
		expect(updated.health).toBeLessThan(80);
	});

	it("health recovers when hunger is low", () => {
		const fish = createFish({ hunger: 20, health: 80 });
		const updated = tickFishNeeds(fish, 100);
		expect(updated.health).toBeGreaterThanOrEqual(80);
	});

	it("happiness increases when conditions are good", () => {
		const fish = createFish({ hunger: 10, happiness: 50 });
		const updated = tickFishNeeds(fish, 80);
		expect(updated.happiness).toBeGreaterThan(50);
	});

	it("happiness decreases when conditions are bad", () => {
		const fish = createFish({ hunger: 60, happiness: 50 });
		const updated = tickFishNeeds(fish, 30);
		expect(updated.happiness).toBeLessThan(50);
	});

	it("feedFish reduces hunger", () => {
		const fish = createFish({ hunger: 50 });
		const fed = feedFish(fish);
		expect(fed.hunger).toBeLessThan(50);
		expect(fed.state).toBe("eating");
	});

	it("feedFish boosts happiness", () => {
		const fish = createFish({ happiness: 50 });
		const fed = feedFish(fish);
		expect(fed.happiness).toBeGreaterThan(50);
	});

	it("reconcileFishNeeds handles elapsed time", () => {
		const fish = createFish({ hunger: 20 });
		const reconciled = reconcileFishNeeds(fish, 3600, 100); // 1 hour
		expect(reconciled.hunger).toBeGreaterThan(20);
	});
});
