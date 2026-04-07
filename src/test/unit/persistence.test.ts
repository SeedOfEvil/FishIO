import { describe, it, expect, beforeEach, vi } from "vitest";
import { useGameStore } from "@/store/useGameStore";
import { saveGame, loadGame, hasSavedGame, deleteSave, exportSave, importSave } from "@/persistence/saveLoad";

// Mock localStorage
const localStorageMock = (() => {
	let store: Record<string, string> = {};
	return {
		getItem: (key: string) => store[key] ?? null,
		setItem: (key: string, value: string) => { store[key] = value; },
		removeItem: (key: string) => { delete store[key]; },
		clear: () => { store = {}; },
	};
})();

Object.defineProperty(globalThis, "localStorage", { value: localStorageMock });

describe("persistence", () => {
	beforeEach(() => {
		localStorageMock.clear();
		useGameStore.getState().initializeGame();
	});

	it("saves and loads game state", () => {
		const state = useGameStore.getState().getSaveableState();
		const saved = saveGame(state);
		expect(saved).toBe(true);

		const loaded = loadGame();
		expect(loaded).not.toBeNull();
		expect(loaded!.state.fish.length).toBe(state.fish.length);
		expect(loaded!.state.gold).toBe(state.gold);
	});

	it("hasSavedGame returns false when no save exists", () => {
		expect(hasSavedGame()).toBe(false);
	});

	it("hasSavedGame returns true after saving", () => {
		const state = useGameStore.getState().getSaveableState();
		saveGame(state);
		expect(hasSavedGame()).toBe(true);
	});

	it("deleteSave removes saved data", () => {
		const state = useGameStore.getState().getSaveableState();
		saveGame(state);
		deleteSave();
		expect(hasSavedGame()).toBe(false);
	});

	it("exportSave returns valid JSON", () => {
		const state = useGameStore.getState().getSaveableState();
		const json = exportSave(state);
		const parsed = JSON.parse(json);
		expect(parsed.version).toBe(3);
		expect(parsed.state.fish.length).toBeGreaterThan(0);
	});

	it("importSave parses valid JSON", () => {
		const state = useGameStore.getState().getSaveableState();
		const json = exportSave(state);
		const imported = importSave(json);
		expect(imported).not.toBeNull();
		expect(imported!.state.gold).toBe(state.gold);
	});

	it("importSave returns null for invalid JSON", () => {
		expect(importSave("not json")).toBeNull();
	});
});
