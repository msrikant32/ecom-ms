import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { RateLimitDemo } from "@/components/rateLimit/RateLimitDemo";
import { RateLimitAlgorithmAnimation } from "@/components/rateLimit/RateLimitAlgorithmAnimation";

export const metadata: Metadata = {
  title: "Rate Limiting",
};

const ALGORITHMS = [
  {
    name: "Fixed window",
    tag: "what's running below",
    detail:
      "A counter tied to a time bucket (e.g. 'this 10-second window') increments per request and resets to zero when the bucket rolls over. Simple and cheap, but bursty at the boundary: a client can send its full budget right before a window ends, then its full budget again right after — up to 2x the intended rate in a short span around the edge.",
  },
  {
    name: "Sliding window (log or counter)",
    tag: "smooths the boundary problem",
    detail:
      "Instead of a hard reset, the window continuously slides with the clock — either by keeping a timestamped log of every request in the last N seconds, or by weighting the current and previous fixed windows proportionally. Fixes the boundary-burst problem at the cost of more memory (log variant) or a bit more computation per request.",
  },
  {
    name: "Token bucket",
    tag: "allows controlled bursts",
    detail:
      "A bucket holds up to N tokens, refilling at a steady rate; each request consumes one token, and a request with no tokens available is rejected (or queued). Unlike fixed/sliding windows, it explicitly allows a burst up to the bucket's full capacity, then throttles to the refill rate — a deliberate design choice, not a boundary artifact.",
  },
  {
    name: "Leaky bucket",
    tag: "smooths bursts into a steady rate",
    detail:
      "Requests queue into a bucket that 'leaks' (processes) at a fixed rate regardless of arrival pattern; a burst gets queued and drained steadily rather than passed through immediately. Good for protecting a downstream system that genuinely can't handle bursts at all, at the cost of added latency for queued requests.",
  },
];

export default function RateLimitingPage() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Rate Limiting" }]} />

      <header className="flex flex-col gap-3">
        <p className="text-sm font-medium uppercase tracking-wide text-red-600 dark:text-red-400">
          Practical Implementation
        </p>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Rate Limiting — hit a real limiter, watch it actually trip
        </h1>
        <p className="max-w-2xl text-zinc-600 dark:text-zinc-400">
          This isn&apos;t a staged countdown — the button below calls a real endpoint on the
          express-production-api backend, protected by an actual{" "}
          <code className="font-mono">express-rate-limit</code> middleware (a small, demo-tuned
          budget of 5 requests per 10 seconds). Send enough requests and you&apos;ll get a real{" "}
          <code className="font-mono">429</code>, with the real{" "}
          <code className="font-mono">RateLimit-*</code> response headers read directly off the
          network response.
        </p>
      </header>

      <RateLimitDemo />

      <section className="flex flex-col gap-2 rounded-xl border border-zinc-200 p-5 text-sm text-zinc-600 dark:border-zinc-800 dark:text-zinc-400">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          What&apos;s actually happening
        </h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            Every request goes to <code className="font-mono">GET /api/v1/rate-limit-demo</code>,
            a trivial endpoint that exists purely for this page — protected by its own limiter so
            it doesn&apos;t compete with the general API budget.
          </li>
          <li>
            The limiter is <code className="font-mono">express-rate-limit</code>&apos;s default
            in-memory store, which implements the{" "}
            <strong className="font-semibold text-zinc-700 dark:text-zinc-300">fixed window</strong>{" "}
            algorithm — see the comparison below for what that specifically means, and what the
            other three common approaches do differently.
          </li>
          <li>
            <code className="font-mono">RateLimit-Limit</code>,{" "}
            <code className="font-mono">RateLimit-Remaining</code>, and{" "}
            <code className="font-mono">RateLimit-Reset</code> are real response headers from the
            server on every request — the gauge above is reading them directly, not counting
            client-side.
          </li>
          <li>
            This exact same middleware (differently tuned) protects the real{" "}
            <code className="font-mono">/products</code>, <code className="font-mono">/orders</code>,
            and <code className="font-mono">/auth</code> endpoints elsewhere in this backend.
          </li>
        </ul>
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium uppercase tracking-wide text-red-600 dark:text-red-400">
            Beyond fixed window
          </p>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Four common rate-limiting algorithms
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            The demo above only shows one of these — fixed window is what{" "}
            <code className="font-mono">express-rate-limit</code>&apos;s default store actually
            implements. The other three are real, common alternatives worth knowing even though
            this backend doesn&apos;t run them.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {ALGORITHMS.map((algo) => (
            <div
              key={algo.name}
              className="flex flex-col gap-1.5 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
            >
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{algo.name}</h3>
                <span className="whitespace-nowrap text-[10.5px] font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-600">
                  {algo.tag}
                </span>
              </div>
              <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{algo.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium uppercase tracking-wide text-red-600 dark:text-red-400">
            See it, don&apos;t just read it
          </p>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Fixed window vs. token bucket, animated
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            The exact same 8-request burst, decided by each algorithm&apos;s real rules — computed
            step by step, not staged. Watch fixed window let ~9 requests through in a 400ms span
            around a window boundary (the bug from the card above), and token bucket allow a burst
            up to capacity before throttling to its refill rate. Step through or press play.
          </p>
        </div>
        <RateLimitAlgorithmAnimation />
      </section>

      <p className="text-sm text-zinc-500 dark:text-zinc-500">
        See how this middleware fits alongside authentication, validation, and authorization in
        the full request chain:{" "}
        <Link
          href="/interview/express-middleware-auth-validation-authorization"
          className="text-red-600 hover:underline dark:text-red-400"
        >
          the middleware chain breakdown →
        </Link>
      </p>
    </div>
  );
}
