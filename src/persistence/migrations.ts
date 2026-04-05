import type { SaveFile } from "./saveSchema";
import { SAVE_VERSION } from "./saveSchema";

type Migration = (save: SaveFile) => SaveFile;

const migrations: Record<number, Migration> = {
  // Example: version 1 -> 2
  // 2: (save) => ({ ...save, version: 2, state: { ...save.state, newField: defaultValue } }),
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
