"use client";

import { useEffect, useState } from "react";
import { ping } from "@/lib/upload/api";

export interface PingSample {
  id: number;
  latencyMs: number;
}

const POLL_INTERVAL_MS = 60;
const MAX_SAMPLES = 80;

/**
 * While `active`, continuously pings the server and records round-trip
 * latency. This is the instrument the sync-vs-async demo uses to make an
 * otherwise invisible property — "is the event loop free right now?" —
 * something you can actually see change in real time.
 */
export function usePingMonitor(active: boolean): PingSample[] {
  const [samples, setSamples] = useState<PingSample[]>([]);

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    let nextId = 0;
    // Built fresh for this run rather than derived from the previous
    // render's state, so the first setSamples() call (inside the async
    // loop below, not synchronously in the effect body) naturally starts
    // the strip over instead of appending to stale data from last time.
    let localSamples: PingSample[] = [];

    async function loop() {
      while (!cancelled) {
        try {
          const { latencyMs } = await ping();
          if (cancelled) break;
          nextId += 1;
          localSamples = [...localSamples, { id: nextId, latencyMs }];
          if (localSamples.length > MAX_SAMPLES) {
            localSamples = localSamples.slice(localSamples.length - MAX_SAMPLES);
          }
          setSamples(localSamples);
        } catch {
          // A transient ping failure shouldn't stop the monitor.
        }
        await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
      }
    }

    loop();
    return () => {
      cancelled = true;
    };
  }, [active]);

  return samples;
}
