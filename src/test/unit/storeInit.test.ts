import { describe, it, expect, beforeEach } from "vitest";
import { useGameStore } from "@/store/useGameStore";
import { STARTING_GOLD, STARTING_FISH_COUNT } from "@/domain/constants/balance";

describe("storeInit", () => {
	beforeEach(() => {
		useGameStore.getState().initializeGame();
	});

	it("initializes with correct starting gold", () => {
		expect(useGameStore.getState().gold).toBe(STARTING_GOLD);
	});

	it("initializes with correct number of fish", () => {
		expect(useGameStore.getState().fish.length).toBe(STARTING_FISH_COUNT);
	});

	it("initializes with clean tank", () => {
		expect(useGameStore.getState().tank.cleanliness).toBe(100);
	});

	it("initializes with no food pellets", () => {
		expect(useGameStore.getState().foodPellets.length).toBe(0);
	});

	it("initializes with no eggs", () => {
		expect(useGameStore.getState().eggs.length).toBe(0);
	});

	it("fish have valid properties", () => {
		const fish = useGameStore.getState().fish[0];
		expect(fish.id).toBeTruthy();
		expect(fish.name).toBeTruthy();
		expect(fish.health).toBe(100);
		expect(fish.ageStage).toBe("adult");
		expect(["male", "female"]).toContain(fish.sex);
	});

	it("can drop food", () => {
		useGameStore.getState().dropFood(400);
		expect(useGameStore.getState().foodPellets.length).toBe(1);
	});
});
