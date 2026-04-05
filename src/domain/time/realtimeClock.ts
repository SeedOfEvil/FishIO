/** Get current real-world hour (0-23) */
export function getCurrentHour(): number {
  return new Date().getHours();
}

/** Get current real-world minute */
export function getCurrentMinute(): number {
  return new Date().getMinutes();
}

/** Format time for display */
export function formatTime(hour: number, minute: number): string {
  const h = hour % 12 || 12;
  const ampm = hour < 12 ? "AM" : "PM";
  const m = minute.toString().padStart(2, "0");
  return `${h}:${m} ${ampm}`;
}

/** Get current timestamp */
export function now(): number {
  return Date.now();
}
