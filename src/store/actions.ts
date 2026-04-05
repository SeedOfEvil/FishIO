import { useGameStore } from "./useGameStore";

/** Quick access to store actions without subscribing to state */
export function getActions() {
  const store = useGameStore.getState();
  return {
    tick: store.tick,
    dropFood: store.dropFood,
    selectFish: store.selectFish,
    cleanDirtySpot: store.cleanDirtySpot,
    setActivePanel: store.setActivePanel,
    initializeGame: store.initializeGame,
    loadState: store.loadState,
    getSaveableState: store.getSaveableState,
  };
}
