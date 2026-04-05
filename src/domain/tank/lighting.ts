import { NIGHT_START_HOUR, NIGHT_END_HOUR } from "../constants/balance";

export function isNightTime(hour: number): boolean {
  return hour >= NIGHT_START_HOUR || hour < NIGHT_END_HOUR;
}

/** Get ambient light level 0-1 based on hour */
export function getAmbientLight(hour: number): number {
  if (hour >= NIGHT_START_HOUR) {
    // 21-24: fade from 0.7 to 0.3
    return 0.7 - ((hour - NIGHT_START_HOUR) / 3) * 0.4;
  }
  if (hour < NIGHT_END_HOUR) {
    // 0-7: stay at 0.3, then ramp up
    if (hour < 5) return 0.3;
    return 0.3 + ((hour - 5) / 2) * 0.7;
  }
  // Daytime
  if (hour < 12) return 0.8 + (hour - 7) * 0.04;
  if (hour < 17) return 1.0;
  return 1.0 - ((hour - 17) / 4) * 0.3;
}

/** Get water tint color based on time of day */
export function getWaterTint(hour: number): string {
  const light = getAmbientLight(hour);
  if (light > 0.7) return "rgba(64, 164, 223, 0.15)";
  if (light > 0.4) return "rgba(40, 100, 160, 0.25)";
  return "rgba(20, 50, 100, 0.4)";
}
