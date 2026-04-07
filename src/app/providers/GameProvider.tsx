import { useEffect, useRef } from "react";
import { useGameStore } from "@/store/useGameStore";
import { TickScheduler } from "@/domain/time/tickScheduler";
import { loadGame, saveGame, hasSavedGame } from "@/persistence/saveLoad";
import { needsReconciliation, getElapsedSeconds, capElapsedTime } from "@/domain/time/elapsedSimulation";
import { reconcileFishNeeds } from "@/domain/fish/fishNeeds";
import { reconcileTankState } from "@/domain/tank/tankRules";
import { TANK_WIDTH, WATER_SURFACE_Y, TANK_FLOOR_Y, TANK_PADDING } from "@/domain/constants/tuning";

const AUTOSAVE_INTERVAL_MS = 30_000;

export function GameProvider({ children }: { children: React.ReactNode }) {
	const schedulerRef = useRef<TickScheduler | null>(null);

	useEffect(() => {
		const store = useGameStore.getState();

		// Try loading saved game
		let loaded = false;
		if (hasSavedGame()) {
			const save = loadGame();
			if (save && save.state.fish && save.state.fish.length > 0) {
				store.loadState(save.state);
				loaded = true;

				// Reconcile elapsed time
				if (needsReconciliation(save.state.lastSaveTimestamp)) {
					const elapsed = capElapsedTime(getElapsedSeconds(save.state.lastSaveTimestamp));
					const currentState = useGameStore.getState();

					const reconciledFish = currentState.fish.map((f) =>
						reconcileFishNeeds(f, elapsed, currentState.tank.cleanliness),
					);
					const reconciledTank = reconcileTankState(currentState.tank, elapsed);

					useGameStore.setState({
						fish: reconciledFish,
						tank: reconciledTank,
					});
				}
			}
		}
		if (!loaded) {
			store.initializeGame();
		}

		// Start simulation ticker (1/sec — behavior decisions, needs, economy)
		const scheduler = new TickScheduler(() => {
			useGameStore.getState().tick();
		});
		schedulerRef.current = scheduler;
		scheduler.start();

		// Start RAF movement loop (~60fps — physics, steering, position)
		// Use a flag so cleanup can stop the loop completely; this protects against
		// any chance of two loops running simultaneously (e.g. StrictMode double-mount).
		let lastFrameTime = performance.now();
		let rafId = 0;
		let stopped = false;
		const moveLoop = (now: number) => {
			if (stopped) return;
			const dtMs = Math.min(now - lastFrameTime, 50);
			lastFrameTime = now;
			const dt = dtMs / 1000;
			if (dt > 0) {
				useGameStore.getState().moveFrame(dt);
			}
			rafId = requestAnimationFrame(moveLoop);
		};
		rafId = requestAnimationFrame(moveLoop);

		// Autosave
		const autosaveInterval = setInterval(() => {
			const state = useGameStore.getState();
			saveGame(state.getSaveableState());
		}, AUTOSAVE_INTERVAL_MS);

		// Save on tab close
		const handleBeforeUnload = () => {
			const state = useGameStore.getState();
			saveGame(state.getSaveableState());
		};
		window.addEventListener("beforeunload", handleBeforeUnload);

		// Reconcile when tab becomes visible again
		let lastVisibleTimestamp = Date.now();
		const handleVisibilityChange = () => {
			if (document.hidden) {
				lastVisibleTimestamp = Date.now();
				const state = useGameStore.getState();
				saveGame(state.getSaveableState());
			} else {
				const elapsed = (Date.now() - lastVisibleTimestamp) / 1000;
				if (elapsed > 2) {
					const currentState = useGameStore.getState();
					const reconciledFish = currentState.fish.map((f) => {
						let updated = reconcileFishNeeds(f, elapsed, currentState.tank.cleanliness);
						if (!isFinite(updated.x) || !isFinite(updated.y)) {
							updated.x = TANK_PADDING + 40 + Math.random() * (TANK_WIDTH - TANK_PADDING * 2 - 80);
							updated.y = WATER_SURFACE_Y + 40 + Math.random() * (TANK_FLOOR_Y - WATER_SURFACE_Y - 80);
							updated.vx = (Math.random() - 0.5) * 4;
							updated.vy = (Math.random() - 0.5) * 2;
						}
						return updated;
					});
					const reconciledTank = reconcileTankState(currentState.tank, elapsed);
					useGameStore.setState({
						fish: reconciledFish,
						tank: reconciledTank,
					});
				}
				// Reset frame timer so first frame after return isn't a huge jump
				lastFrameTime = performance.now();
			}
		};
		document.addEventListener("visibilitychange", handleVisibilityChange);

		return () => {
			stopped = true;
			scheduler.stop();
			cancelAnimationFrame(rafId);
			clearInterval(autosaveInterval);
			window.removeEventListener("beforeunload", handleBeforeUnload);
			document.removeEventListener("visibilitychange", handleVisibilityChange);
		};
	}, []);

	return <>{children}</>;
}
