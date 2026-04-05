/** Calculate elapsed time since last save */
export function getElapsedSeconds(lastSaveTimestamp: number): number {
  const elapsed = (Date.now() - lastSaveTimestamp) / 1000;
  return Math.max(0, elapsed);
}

/** Cap elapsed time to prevent catastrophic catch-up (max 48 hours) */
export function capElapsedTime(seconds: number): number {
  const MAX_CATCHUP_SECONDS = 48 * 60 * 60;
  return Math.min(seconds, MAX_CATCHUP_SECONDS);
}

/** Determine if reconciliation is needed (more than 5 seconds elapsed) */
export function needsReconciliation(lastSaveTimestamp: number): boolean {
  return getElapsedSeconds(lastSaveTimestamp) > 5;
}
