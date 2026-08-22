import type { RateLimitRequestEvent, RateLimitStep } from "./types";

export const FIXED_WINDOW_LIMIT = 5;
export const FIXED_WINDOW_MS = 2000;
export const FIXED_WINDOW_TIMELINE_MAX_MS = 4200;

// Requests clustered right around the 2000ms window boundary — deliberately
// chosen to demonstrate fixed window's real flaw: up to 2x the nominal rate
// can pass through in a short span straddling a reset, since each side of
// the boundary gets its own full budget.
const REQUEST_TIMES_MS = [1800, 1850, 1900, 1950, 2000, 2050, 2100, 2150, 2200, 3000, 4000, 4050];

/** Computed at module load from the algorithm's real rules, not hand-authored per step. */
export const fixedWindowSteps: RateLimitStep[] = (() => {
  const steps: RateLimitStep[] = [];
  const seen: RateLimitRequestEvent[] = [];
  let currentWindowStart = -1;
  let countInWindow = 0;
  let nextId = 1;

  for (const atMs of REQUEST_TIMES_MS) {
    const windowStart = Math.floor(atMs / FIXED_WINDOW_MS) * FIXED_WINDOW_MS;
    if (windowStart !== currentWindowStart) {
      currentWindowStart = windowStart;
      countInWindow = 0;
      steps.push({
        narration: `New window starts at t=${windowStart}ms — counter resets to 0/${FIXED_WINDOW_LIMIT}.`,
        nowMs: windowStart,
        requestsSoFar: [...seen],
        meter: 0,
        meterCapacity: FIXED_WINDOW_LIMIT,
        meterLabel: `0 / ${FIXED_WINDOW_LIMIT} used this window`,
        windowStartMs: windowStart,
      });
    }

    const allowed = countInWindow < FIXED_WINDOW_LIMIT;
    if (allowed) countInWindow += 1;
    seen.push({ id: nextId++, atMs, allowed });
    steps.push({
      narration: allowed
        ? `t=${atMs}ms — request allowed (${countInWindow}/${FIXED_WINDOW_LIMIT} used this window).`
        : `t=${atMs}ms — request BLOCKED (429) — this window's budget is already spent.`,
      nowMs: atMs,
      requestsSoFar: [...seen],
      meter: countInWindow,
      meterCapacity: FIXED_WINDOW_LIMIT,
      meterLabel: `${countInWindow} / ${FIXED_WINDOW_LIMIT} used this window`,
      windowStartMs: currentWindowStart,
    });
  }

  return steps;
})();
