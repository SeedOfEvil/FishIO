/** Get a human-readable cleanliness label */
export function getCleanlinessLabel(cleanliness: number): string {
  if (cleanliness >= 80) return "Sparkling";
  if (cleanliness >= 60) return "Clean";
  if (cleanliness >= 40) return "Okay";
  if (cleanliness >= 20) return "Murky";
  return "Dirty";
}

/** Get cleanliness color for UI */
export function getCleanlinessColor(cleanliness: number): string {
  if (cleanliness >= 60) return "#4ade80";
  if (cleanliness >= 30) return "#fbbf24";
  return "#f87171";
}
