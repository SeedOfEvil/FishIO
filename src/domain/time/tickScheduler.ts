import { TICK_INTERVAL_MS } from "../constants/balance";

type TickCallback = () => void;

export class TickScheduler {
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private callback: TickCallback;

  constructor(callback: TickCallback) {
    this.callback = callback;
  }

  start(): void {
    if (this.intervalId !== null) return;
    this.intervalId = setInterval(this.callback, TICK_INTERVAL_MS);
  }

  stop(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  isRunning(): boolean {
    return this.intervalId !== null;
  }
}
