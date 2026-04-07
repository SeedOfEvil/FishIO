# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Dev server at http://localhost:5173
npm run build        # Type-check (tsc -b) + Vite production build
npm test             # Run all unit tests (vitest run)
npm run test:watch   # Unit tests in watch mode
npm run test:e2e     # Playwright e2e tests (starts dev server automatically)
npm run lint         # Biome linter check
npm run lint:fix     # Biome auto-fix
npm run format       # Biome format
```

Run a single test file: `npx vitest run src/test/unit/fishBehavior.test.ts`

## Architecture

FishIO is a virtual aquarium game built with React 19 + Vite + TypeScript. Fish are rendered as SVG, state is managed with Zustand, and the simulation runs on a 1-second tick interval.

### Layer separation

- **`src/domain/`** — Pure TypeScript game logic with zero React imports. All simulation math, state machines, and constants live here. This is the core of the game and is independently testable.
- **`src/store/`** — Zustand store (`useGameStore`) that orchestrates domain functions. The `tick()` action is the main game loop entry point: it advances behavior, updates needs, processes food collisions, and triggers React re-renders.
- **`src/scene/`** — SVG rendering layer. `TankScene` is the root SVG; `layers/` controls z-ordering; `components/` has individual sprites. FishSprite uses requestAnimationFrame to interpolate positions smoothly between 1-second ticks.
- **`src/ui/`** — HUD and panel components (gold display, fish inspector, shop). Display-only, read from store.
- **`src/persistence/`** — localStorage save/load with versioned schema and migrations.

### Game loop flow

`GameProvider` mounts → `TickScheduler` fires every 1000ms → `useGameStore.tick()`:
1. `advanceBehaviorTick()` — global oscillation counter
2. `tickTankState()` — cleanliness decay, dirty spot spawning
3. Food pellets sink and age out
4. Per fish: `updateFishBehavior()` → `tickFishNeeds()` → food collision check
5. Store update triggers React re-render

### Fish behavior model

`fishBehavior.ts` implements a steering-force model with a state machine:
- **States:** roaming, seeking_food, eating, idle, hovering, investigating, resting, avoiding
- **Steering forces** (applied during roaming/seeking): wander, food attraction, wall avoidance, fish separation, vertical drift
- **Timed states** (eating/idle/hovering/investigating/resting): count down `stateTimer`, apply damping + micro-drift, then revert to roaming
- **Personality traits** (energy, sociability, boldness, appetite, curiosity) modulate all forces and state transition probabilities
- Night mode reduces speed, increases resting/hovering

### Two constant files

- **`domain/constants/tuning.ts`** — Movement physics, visual sizes, distances. These affect frame-to-frame feel.
- **`domain/constants/balance.ts`** — Economy, hunger rates, tick interval, time thresholds. These affect long-term progression.

### Path alias

`@/` maps to `src/` (configured in tsconfig, vite, and vitest configs).

### Rendering

All visuals are SVG inside a single `<svg viewBox="0 0 800 500">`. Fish positions update in the store once per second; `FishSprite` uses a `useSmoothPosition` RAF hook to interpolate at 60fps with smoothstep easing. Visual animations (bob, sway, tail wag) also run at 60fps via `Date.now()`.

### Offline reconciliation

On load, `GameProvider` checks elapsed time since last save. If significant time passed, `reconcileFishNeeds()` and `reconcileTankState()` fast-forward hunger, health, happiness, and cleanliness in bulk rather than simulating every tick.
