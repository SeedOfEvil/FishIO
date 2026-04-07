import { describe, it, expect } from "vitest";
import { createFoodPellet } from "@/domain/fish/fishFactory";
import { canEatFood } from "@/domain/fish/fishBehavior";
import { createFish } from "@/domain/fish/fishFactory";
import { WATER_SURFACE_Y } from "@/domain/constants/tuning";

describe("foodDrop", () => {
	it("creates a food pellet at the water surface", () => {
		const pellet = createFoodPellet(400);
		expect(pellet.x).toBe(400);
		expect(pellet.y).toBeCloseTo(WATER_SURFACE_Y + 5, 0);
		expect(pellet.lifetime).toBe(600);
		expect(pellet.claimed).toBe(false);
	});

	it("pellet has a unique id", () => {
		const a = createFoodPellet(100);
		const b = createFoodPellet(200);
		expect(a.id).not.toBe(b.id);
	});

	it("fish can eat nearby food", () => {
		const fish = createFish({ x: 100, y: 200 });
		const pellet = createFoodPellet(100);
		// Move pellet to fish position
		pellet.y = 200;
		expect(canEatFood(fish, pellet)).toBe(true);
	});

	it("fish cannot eat distant food", () => {
		const fish = createFish({ x: 100, y: 200 });
		const pellet = createFoodPellet(500);
		pellet.y = 400;
		expect(canEatFood(fish, pellet)).toBe(false);
	});
});
