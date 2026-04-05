import { describe, it, expect, beforeEach } from "vitest";
import { useGameStore } from "@/store/useGameStore";

describe("fishSelection", () => {
	beforeEach(() => {
		useGameStore.getState().initializeGame();
	});

	it("starts with no fish selected", () => {
		expect(useGameStore.getState().selectedFishId).toBeNull();
	});

	it("can select a fish", () => {
		const fishId = useGameStore.getState().fish[0].id;
		useGameStore.getState().selectFish(fishId);
		expect(useGameStore.getState().selectedFishId).toBe(fishId);
	});

	it("can deselect a fish", () => {
		const fishId = useGameStore.getState().fish[0].id;
		useGameStore.getState().selectFish(fishId);
		useGameStore.getState().selectFish(null);
		expect(useGameStore.getState().selectedFishId).toBeNull();
	});
});
