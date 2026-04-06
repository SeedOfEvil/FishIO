import type { SaveFile } from "./saveSchema";
import { SAVE_VERSION } from "./saveSchema";

type Migration = (save: SaveFile) => SaveFile;

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
};

export function migrateSave(save: SaveFile): SaveFile {
  let current = save;
  while (current.version < SAVE_VERSION) {
    const nextVersion = current.version + 1;
    const migration = migrations[nextVersion];
    if (!migration) {
      console.warn(`No migration for version ${current.version} -> ${nextVersion}`);
      break;
    }
    current = migration(current);
  }
  return current;
}
