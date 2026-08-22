"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { CodeBlock } from "@/components/interview/CodeBlock";
import { COMPLEXITY_CLASSES, scaledBarWidth } from "@/lib/algorithms/bigO";

export function BigOPlayground() {
  const [n, setN] = useState(10);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const values = COMPLEXITY_CLASSES.map((c) => ({ id: c.id, value: c.operations(n) }));
  const maxValue = Math.max(...values.map((v) => v.value));

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between text-sm">
          <label htmlFor="n-slider" className="font-medium text-zinc-700 dark:text-zinc-300">
            Input size — n = {n}
          </label>
        </div>
        <input
          id="n-slider"
          type="range"
          min={1}
          max={20}
          value={n}
          onChange={(e) => setN(Number(e.target.value))}
          className="w-full accent-violet-500"
        />
      </div>

      <div className="flex flex-col gap-2">
        {COMPLEXITY_CLASSES.map((c) => {
          const value = c.operations(n);
          const width = scaledBarWidth(value, maxValue);
          const expanded = expandedId === c.id;
          return (
            <div key={c.id} className="flex flex-col gap-1.5">
              <button
                onClick={() => setExpandedId(expanded ? null : c.id)}
                className="flex w-full items-center gap-3 text-left"
              >
                <span className={`w-40 shrink-0 font-mono text-xs font-medium ${c.colorClass}`}>{c.label}</span>
                <div className="h-5 flex-1 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                  <motion.div
                    className={`h-full rounded-full ${c.barColorClass}`}
                    animate={{ width: `${width}%` }}
                    transition={{ type: "spring", stiffness: 200, damping: 25 }}
                  />
                </div>
                <span className="w-24 shrink-0 text-right font-mono text-xs text-zinc-500 dark:text-zinc-500">
                  {value.toLocaleString()} ops
                </span>
              </button>
              {expanded && (
                <div className="ml-1 flex flex-col gap-2 border-l-2 border-zinc-200 pl-4 dark:border-zinc-800">
                  <p className="text-xs text-zinc-500 dark:text-zinc-500">{c.example}</p>
                  <CodeBlock code={c.code} language="javascript" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-xs text-zinc-500 dark:text-zinc-500">
        Bars are log-scaled so every class stays visible at once — the raw operation counts on the
        right are the real numbers. Click a row to see the actual code and why it lands in that class.
      </p>
    </div>
  );
}
