"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useStepController } from "@/components/visualizer/useStepController";
import { Controls } from "@/components/visualizer/Controls";
import { fixedWindowSteps, FIXED_WINDOW_MS, FIXED_WINDOW_TIMELINE_MAX_MS } from "@/lib/rateLimitTrace/fixedWindowTrace";
import { tokenBucketSteps, TOKEN_BUCKET_TIMELINE_MAX_MS } from "@/lib/rateLimitTrace/tokenBucketTrace";

type Algorithm = "fixed-window" | "token-bucket";

function meterBadness(meter: number, capacity: number, algorithm: Algorithm): number {
  // 0 = safe/healthy, 1 = exhausted/blocking. The two algorithms track
  // opposite quantities (fixed window counts UP to the limit; token bucket
  // counts DOWN from capacity), so this normalizes them to one scale.
  return algorithm === "fixed-window" ? meter / capacity : 1 - meter / capacity;
}

function meterColor(badness: number): string {
  if (badness >= 0.999) return "bg-red-500";
  if (badness >= 0.6) return "bg-amber-500";
  return "bg-emerald-500";
}

function AlgorithmDemo({ algorithm }: { algorithm: Algorithm }) {
  const steps = algorithm === "fixed-window" ? fixedWindowSteps : tokenBucketSteps;
  const timelineMax = algorithm === "fixed-window" ? FIXED_WINDOW_TIMELINE_MAX_MS : TOKEN_BUCKET_TIMELINE_MAX_MS;
  const controller = useStepController(steps);
  const step = controller.currentStep;
  const badness = meterBadness(step.meter, step.meterCapacity, algorithm);

  const windowBoundaries =
    algorithm === "fixed-window"
      ? Array.from({ length: Math.floor(timelineMax / FIXED_WINDOW_MS) + 1 }, (_, i) => i * FIXED_WINDOW_MS)
      : [];

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-zinc-100">
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between text-xs text-zinc-400">
          <span>{step.meterLabel}</span>
          <span className="font-mono">t = {step.nowMs}ms</span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-zinc-800">
          <motion.div
            className={`h-full rounded-full ${meterColor(badness)}`}
            animate={{ width: `${Math.min(100, (step.meter / step.meterCapacity) * 100)}%` }}
            transition={{ type: "spring", stiffness: 200, damping: 25 }}
          />
        </div>
      </div>

      <div className="relative h-16 rounded-lg border border-zinc-800 bg-zinc-900/60">
        {windowBoundaries.map((ms) => (
          <div
            key={ms}
            className="absolute top-0 h-full border-l border-dashed border-zinc-700"
            style={{ left: `${(ms / timelineMax) * 100}%` }}
          />
        ))}

        <motion.div
          className="absolute top-0 h-full w-px bg-sky-400"
          animate={{ left: `${(step.nowMs / timelineMax) * 100}%` }}
          transition={{ type: "spring", stiffness: 200, damping: 30 }}
        />

        <AnimatePresence>
          {step.requestsSoFar.map((req) => (
            <motion.div
              key={req.id}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full ${
                req.allowed ? "bg-emerald-500" : "bg-red-500"
              }`}
              style={{ left: `${(req.atMs / timelineMax) * 100}%` }}
              title={`t=${req.atMs}ms — ${req.allowed ? "allowed" : "blocked"}`}
            />
          ))}
        </AnimatePresence>
      </div>

      <div className="flex gap-4 text-xs text-zinc-400">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-500" /> allowed
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-red-500" /> blocked (429)
        </span>
        {algorithm === "fixed-window" && (
          <span className="flex items-center gap-1.5">
            <span className="h-2 border-l border-dashed border-zinc-500" /> window boundary
          </span>
        )}
      </div>

      <Controls controller={controller} />
    </div>
  );
}

export function RateLimitAlgorithmAnimation() {
  const [algorithm, setAlgorithm] = useState<Algorithm>("fixed-window");

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        <button
          onClick={() => setAlgorithm("fixed-window")}
          className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
            algorithm === "fixed-window"
              ? "bg-red-600 text-white"
              : "border border-zinc-300 text-zinc-600 dark:border-zinc-700 dark:text-zinc-400"
          }`}
        >
          Fixed window (what&apos;s actually running)
        </button>
        <button
          onClick={() => setAlgorithm("token-bucket")}
          className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
            algorithm === "token-bucket"
              ? "bg-red-600 text-white"
              : "border border-zinc-300 text-zinc-600 dark:border-zinc-700 dark:text-zinc-400"
          }`}
        >
          Token bucket
        </button>
      </div>
      {/* key remounts the demo (and its step controller) cleanly on algorithm switch, instead of reconciling mismatched step arrays */}
      <AlgorithmDemo key={algorithm} algorithm={algorithm} />
    </div>
  );
}
