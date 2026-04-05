import { useEffect, useRef } from "react";
import { useGameStore } from "@/store/useGameStore";
import { TickScheduler } from "@/domain/time/tickScheduler";
import { loadGame, saveGame, hasSavedGame } from "@/persistence/saveLoad";
import { needsReconciliation, getElapsedSeconds, capElapsedTime } from "@/domain/time/elapsedSimulation";
import { reconcileFishNeeds } from "@/domain/fish/fishNeeds";
import { reconcileTankState } from "@/domain/tank/tankRules";

const AUTOSAVE_INTERVAL_MS = 30_000;

export function GameProvider({ children }: { children: React.ReactNode }) {
	const schedulerRef = useRef<TickScheduler | null>(null);

	useEffect(() => {
		const store = useGameStore.getState();

		// Try loading saved game
		if (hasSavedGame()) {
			const save = loadGame();
			if (save) {
				store.loadState(save.state);

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
		} else {
			store.initializeGame();
		}

		// Start simulation ticker
		const scheduler = new TickScheduler(() => {
			useGameStore.getState().tick();
		});
		schedulerRef.current = scheduler;
		scheduler.start();

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

		return () => {
			scheduler.stop();
			clearInterval(autosaveInterval);
			window.removeEventListener("beforeunload", handleBeforeUnload);
		};
	}, []);

	return <>{children}</>;
}
