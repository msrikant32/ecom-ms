import type { RateLimitRequestEvent, RateLimitStep } from "./types";

export const TOKEN_BUCKET_CAPACITY = 5;
export const TOKEN_BUCKET_REFILL_MS_PER_TOKEN = 500;
export const TOKEN_BUCKET_TIMELINE_MAX_MS = 3700;

// A tight initial burst (50ms apart) exhausts the bucket and triggers real
// blocking, then a long gap shows it refilling back to full capacity
// (capped, not unbounded) before a final burst demonstrates the throttled
// steady-state rate.
const REQUEST_TIMES_MS = [0, 50, 100, 150, 200, 250, 300, 350, 500, 3500, 3550];

/** Computed at module load from the algorithm's real rules, not hand-authored per step. */
export const tokenBucketSteps: RateLimitStep[] = (() => {
  const steps: RateLimitStep[] = [];
  const seen: RateLimitRequestEvent[] = [];
  let tokens = TOKEN_BUCKET_CAPACITY;
  let lastMs = 0;
  let nextId = 1;

  for (const atMs of REQUEST_TIMES_MS) {
    const elapsed = atMs - lastMs;
    tokens = Math.min(TOKEN_BUCKET_CAPACITY, tokens + elapsed / TOKEN_BUCKET_REFILL_MS_PER_TOKEN);
    lastMs = atMs;

    const allowed = tokens >= 1;
    if (allowed) tokens -= 1;
    seen.push({ id: nextId++, atMs, allowed });

    const roundedTokens = Math.round(tokens * 10) / 10;
    steps.push({
      narration: allowed
        ? `t=${atMs}ms — request allowed (${roundedTokens.toFixed(1)} / ${TOKEN_BUCKET_CAPACITY} tokens left).`
        : `t=${atMs}ms — request BLOCKED (429) — bucket empty, refilling at 1 token / ${TOKEN_BUCKET_REFILL_MS_PER_TOKEN}ms.`,
      nowMs: atMs,
      requestsSoFar: [...seen],
      meter: roundedTokens,
      meterCapacity: TOKEN_BUCKET_CAPACITY,
      meterLabel: `${roundedTokens.toFixed(1)} / ${TOKEN_BUCKET_CAPACITY} tokens`,
    });
  }

  return steps;
})();
