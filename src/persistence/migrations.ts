import type { SaveFile } from "./saveSchema";
import { SAVE_VERSION } from "./saveSchema";

// Migrations work on raw saved data — shapes change between versions,
// so we use `any` to avoid fighting the current FishEntity type.
// biome-ignore lint/suspicious/noExplicitAny: migration data is untyped
type RawSave = { version: number; state: Record<string, any>; [k: string]: any };
type Migration = (save: RawSave) => RawSave;

const migrations: Record<number, Migration> = {
  // v1 -> v2: fish gained stateTimer, wanderAngle, curiosity; lost idleTimer
  2: (save) => ({
    ...save,
    version: 2,
    state: {
      ...save.state,
      fish: (save.state.fish ?? []).map((f: Record<string, unknown>) => ({
        ...f,
        stateTimer: (f as Record<string, unknown>).idleTimer ?? 0,
        wanderAngle: Math.random() * Math.PI * 2,
        personality: {
          ...(f.personality as Record<string, unknown>),
          curiosity: 0.2 + Math.random() * 0.6,
        },
      })),
    },
  }),

  // v2 -> v3: fish gained species field
  3: (save) => ({
    ...save,
    version: 3,
    state: {
      ...save.state,
      fish: (save.state.fish ?? []).map((f: Record<string, unknown>) => ({
        ...f,
        species: f.species ?? "goldfish",
        phaseSeed: f.phaseSeed ?? Math.random() * 1000,
        localTick: f.localTick ?? Math.floor(Math.random() * 500),
      })),
    },
  }),
};

export function migrateSave(save: SaveFile): SaveFile {
  let current = save as RawSave;
  while (current.version < SAVE_VERSION) {
    const nextVersion = current.version + 1;
    const migration = migrations[nextVersion];
    if (!migration) {
      console.warn(`No migration for version ${current.version} -> ${nextVersion}`);
      break;
    }
    current = migration(current);
  }
  return current as unknown as SaveFile;
}
