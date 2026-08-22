export interface RateLimitRequestEvent {
  id: number;
  atMs: number;
  allowed: boolean;
}

export interface RateLimitStep {
  narration: string;
  nowMs: number;
  /** Cumulative — every request revealed so far, in order. */
  requestsSoFar: RateLimitRequestEvent[];
  /** Fixed window: count used in the current window. Token bucket: tokens remaining. */
  meter: number;
  meterCapacity: number;
  meterLabel: string;
  /** Fixed window only — draws the current window's left edge. */
  windowStartMs?: number;
}
