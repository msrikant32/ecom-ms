"use client";

import { useState } from "react";
import type { Trace } from "@/lib/trace/types";
import { TraceVisualizer } from "./TraceVisualizer";

export function TraceTabs({ traces }: { traces: Trace[] }) {
  const [activeId, setActiveId] = useState(traces[0].id);
  const active = traces.find((t) => t.id === activeId) ?? traces[0];

  return (
    <div className="flex flex-col gap-3">
      {traces.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {traces.map((trace) => (
            <button
              key={trace.id}
              onClick={() => setActiveId(trace.id)}
              className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                trace.id === activeId
                  ? "border-sky-500 bg-sky-500/10 text-sky-700 dark:text-sky-300"
                  : "border-zinc-300 text-zinc-600 hover:border-zinc-400 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-600"
              }`}
            >
              {trace.title}
            </button>
          ))}
        </div>
      )}
      {/* key forces a full remount on trace switch, which resets all of
          useTraceController's internal state for free — no reset effect needed. */}
      <TraceVisualizer key={active.id} trace={active} />
    </div>
  );
}
