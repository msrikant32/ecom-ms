const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000/api/v1";

export interface RateLimitAttempt {
  status: number;
  ok: boolean;
  limit: number | null;
  remaining: number | null;
  /** Seconds until the current window resets, as reported by the server at the moment of this response. */
  resetSeconds: number | null;
}

function readIntHeader(res: Response, name: string): number | null {
  const value = res.headers.get(name);
  return value ? Number(value) : null;
}

/** Hits the real, tightly-tuned demo rate limiter — a genuine 429 comes back once the budget is spent. */
export async function pingRateLimitDemo(): Promise<RateLimitAttempt> {
  const res = await fetch(`${API_BASE}/rate-limit-demo`);
  return {
    status: res.status,
    ok: res.ok,
    limit: readIntHeader(res, "RateLimit-Limit"),
    remaining: readIntHeader(res, "RateLimit-Remaining"),
    resetSeconds: readIntHeader(res, "RateLimit-Reset"),
  };
}
