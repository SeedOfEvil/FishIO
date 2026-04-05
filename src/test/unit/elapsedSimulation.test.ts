import { describe, it, expect } from "vitest";
import {
	getElapsedSeconds,
	capElapsedTime,
	needsReconciliation,
} from "@/domain/time/elapsedSimulation";

describe("elapsedSimulation", () => {
	it("calculates elapsed seconds correctly", () => {
		const tenSecondsAgo = Date.now() - 10_000;
		const elapsed = getElapsedSeconds(tenSecondsAgo);
		expect(elapsed).toBeGreaterThanOrEqual(9);
		expect(elapsed).toBeLessThanOrEqual(11);
	});

	it("returns 0 for future timestamps", () => {
		const future = Date.now() + 10_000;
		expect(getElapsedSeconds(future)).toBe(0);
	});

	it("caps elapsed time at 48 hours", () => {
		const oneWeek = 7 * 24 * 60 * 60;
		const capped = capElapsedTime(oneWeek);
		expect(capped).toBe(48 * 60 * 60);
	});

	it("does not cap short durations", () => {
		expect(capElapsedTime(3600)).toBe(3600);
	});

	it("needsReconciliation returns true after long absence", () => {
		const oneHourAgo = Date.now() - 3600 * 1000;
		expect(needsReconciliation(oneHourAgo)).toBe(true);
	});

	it("needsReconciliation returns false for recent save", () => {
		const justNow = Date.now() - 1000;
		expect(needsReconciliation(justNow)).toBe(false);
	});
});
