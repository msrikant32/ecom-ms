"use client";

import { useEffect, useRef, useState } from "react";
import { pingRateLimitDemo, type RateLimitAttempt } from "@/lib/rateLimitDemo";

interface LogEntry extends RateLimitAttempt {
  id: number;
  receivedAt: number;
}

const MAX_LOG = 20;
const DEFAULT_LIMIT = 5; // matches the backend's demoMax unless overridden via env — used only before the first real response arrives

export function RateLimitDemo() {
  const [log, setLog] = useState<LogEntry[]>([]);
  const [sending, setSending] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const nextId = useRef(0);

  // Ticks the countdown display live — the actual reset time comes from the
  // server on each response; this just re-renders so the on-screen "resets
  // in Xs" counts down smoothly between requests instead of only updating
  // when a new request happens to land. Date.now() is read inside the
  // interval callback (an effect, not render), so it stays a pure render.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, []);

  async function sendOne(): Promise<LogEntry> {
    nextId.current += 1;
    try {
      const result = await pingRateLimitDemo();
      return { ...result, id: nextId.current, receivedAt: Date.now() };
    } catch {
      return {
        id: nextId.current,
        receivedAt: Date.now(),
        status: 0,
        ok: false,
        limit: null,
        remaining: null,
        resetSeconds: null,
      };
    }
  }

  async function handleSendOne() {
    setSending(true);
    const entry = await sendOne();
    setLog((prev) => [entry, ...prev].slice(0, MAX_LOG));
    setSending(false);
  }

  async function handleBurst(count: number) {
    setSending(true);
    const results = await Promise.all(Array.from({ length: count }, () => sendOne()));
    setLog((prev) => [...results.slice().reverse(), ...prev].slice(0, MAX_LOG));
    setSending(false);
  }

  const latest = log[0];
  const limit = latest?.limit ?? DEFAULT_LIMIT;
  const remaining = latest?.remaining ?? limit;
  const secondsLeft =
    latest?.resetSeconds != null
      ? Math.max(0, Math.ceil(latest.resetSeconds - (now - latest.receivedAt) / 1000))
      : null;

  const allowedCount = log.filter((e) => e.status === 200).length;
  const blockedCount = log.filter((e) => e.status === 429).length;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={handleSendOne}
          disabled={sending}
          className="rounded-full bg-sky-600 px-4 py-1.5 text-sm font-medium text-white transition-colors disabled:opacity-50"
        >
          Send 1 request
        </button>
        <button
          onClick={() => handleBurst(10)}
          disabled={sending}
          className="rounded-full bg-red-600 px-4 py-1.5 text-sm font-medium text-white transition-colors disabled:opacity-50"
        >
          Burst 10 requests
        </button>
        <div className="ml-auto flex gap-4 font-mono text-xs text-zinc-500 dark:text-zinc-500">
          <span>
            allowed <span className="text-emerald-600 dark:text-emerald-400">{allowedCount}</span>
          </span>
          <span>
            blocked <span className="text-red-600 dark:text-red-400">{blockedCount}</span>
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-2 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-500">
            Remaining budget this window
          </span>
          <span className="font-mono text-xs text-zinc-500 dark:text-zinc-500">
            {secondsLeft != null ? `resets in ${secondsLeft}s` : "no requests sent yet"}
          </span>
        </div>
        <div className="flex gap-1.5">
          {Array.from({ length: limit }, (_, i) => {
            const filled = i < remaining;
            return (
              <div
                key={i}
                className={`h-8 flex-1 rounded-sm transition-colors ${
                  filled
                    ? "bg-emerald-500"
                    : "bg-red-500/20 border border-dashed border-red-400 dark:border-red-700"
                }`}
              />
            );
          })}
        </div>
        <p className="font-mono text-xs text-zinc-400 dark:text-zinc-600">
          {remaining}/{limit} requests remaining
          {latest && !latest.ok && latest.status === 429 && " — limit hit, this is the demo working as intended"}
        </p>
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-500">
          Request log (newest first)
        </span>
        <div className="flex max-h-64 flex-col gap-1 overflow-y-auto font-mono text-xs">
          {log.length === 0 && <p className="text-zinc-400 dark:text-zinc-600">No requests sent yet.</p>}
          {log.map((entry) => (
            <div
              key={entry.id}
              className={`flex items-center justify-between rounded-md border px-3 py-1.5 ${
                entry.status === 200
                  ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400"
                  : entry.status === 429
                    ? "border-red-500/30 bg-red-500/5 text-red-700 dark:text-red-400"
                    : "border-zinc-300 text-zinc-500 dark:border-zinc-700 dark:text-zinc-500"
              }`}
            >
              <span>#{entry.id}</span>
              <span>{entry.status === 0 ? "network error" : `HTTP ${entry.status}`}</span>
              <span>
                {entry.remaining != null ? `remaining ${entry.remaining}/${entry.limit}` : "—"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
