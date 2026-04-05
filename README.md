# FishIO

A cozy, real-time goldfish tank sim for the web. Feed your fish, keep the tank clean, watch them swim, and eventually breed them. Time passes in real life -- your fish get hungrier while you're away and calmer at night.

## Tech Stack

- **Vite** + **React** + **TypeScript** (strict)
- **SVG** rendering for the aquarium scene
- **Motion** for animation
- **Zustand** for state management
- **Howler** for audio (placeholder)
- **Vitest** for unit tests, **Playwright** for e2e
- **Biome** for linting/formatting
- localStorage persistence (no backend)

## Project Structure

```
src/
  app/           App shell, providers, layout
  scene/         SVG tank rendering
    layers/      Background, fish, bubbles, lighting, decorations, overlay
    components/  FishSprite, FoodPellet, PlantSprite, DirtySpot
  domain/        Pure game logic (no React)
    fish/        Types, behavior, needs, breeding, factory
    tank/        Tank state, cleanliness, lighting
    time/        Real-time clock, elapsed simulation, tick scheduler
    economy/     Shop, prices
    constants/   Balance values, visual tuning
  store/         Zustand store, selectors, actions
  persistence/   Save/load, schema versioning, migrations
  ui/            HUD, fish inspector, panels, shop
  audio/         Sound/music stubs
  test/          Unit and e2e tests
```

**Key separation:** Domain logic is pure TypeScript with no React dependency. The store orchestrates domain functions. Scene components only render. UI components only display.

## Install & Run

```bash
npm install
npm run dev        # Start dev server at http://localhost:5173
npm run build      # Type-check + production build
npm run preview    # Preview production build
```

## Testing

```bash
npm test           # Run unit tests
npm run test:watch # Watch mode
npx playwright install chromium  # First time only
npm run test:e2e   # Run e2e tests
```

## Linting & Formatting

```bash
npm run lint       # Check with Biome
npm run lint:fix   # Auto-fix
npm run format     # Format all files
```

## How It Works

- **Simulation tick** runs every 1 second, updating fish hunger/health/happiness and tank cleanliness
- **Fish behavior** uses soft steering forces: wander, wall avoidance, food attraction, fish separation, and personality variation
- **Day/night** follows your real local clock. Fish are calmer at night; lighting shifts accordingly
- **Persistence** autosaves every 30s and on tab close. On reload, elapsed real time is reconciled (fish get hungrier, tank gets dirtier)
- **Click water** to drop food. **Click fish** to inspect. **Click dirty spots** to clean

## Architecture Decisions

- SVG-first rendering for crisp visuals and easy iteration
- Domain logic is framework-agnostic (testable without React)
- Zustand keeps state flat and subscribable
- Balance constants are centralized in `domain/constants/` for easy tuning
- Save schema is versioned with a migration framework ready

## Next-Step Roadmap

1. Fish eating animation and state transitions
2. Breeding gameplay (egg laying, hatching, fry growth)
3. Shop purchasing flow with gold economy
4. Sound effects (splash, bubble, ambient)
5. Night mode visual polish (stars, moon glow)
6. Fish personality affecting visible behavior more
7. More decorations and plant varieties
8. Tank upgrade system
9. Achievement/milestone system
10. Mobile-responsive layout
