"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useStepController } from "@/components/visualizer/useStepController";
import { Controls } from "@/components/visualizer/Controls";
import { naiveShardingSteps, saltedShardingSteps, SHARD_COUNT } from "@/lib/scaling/shardingTrace";

type Phase = "naive" | "salted";

function loadColor(load: number, average: number): string {
  if (average === 0) return "bg-zinc-600";
  if (load >= average * 1.8) return "bg-red-500";
  if (load >= average * 1.3) return "bg-amber-500";
  return "bg-emerald-500";
}

function PhaseDemo({ phase }: { phase: Phase }) {
  const steps = phase === "naive" ? naiveShardingSteps : saltedShardingSteps;
  const controller = useStepController(steps);
  const step = controller.currentStep;
  const maxLoad = Math.max(1, ...step.shardLoads);
  const totalWrites = step.shardLoads.reduce((a, b) => a + b, 0);
  const average = totalWrites / SHARD_COUNT;

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-zinc-100">
      <div className="grid grid-cols-4 gap-3">
        {step.shardLoads.map((load, i) => (
          <div key={i} className="flex flex-col items-center gap-2">
            <span className="font-mono text-xs text-zinc-400">shard {i}</span>
            <div className="relative flex h-32 w-full items-end overflow-hidden rounded-md border border-zinc-800 bg-zinc-900">
              <motion.div
                className={`w-full rounded-t-md ${loadColor(load, average)}`}
                animate={{ height: `${(load / maxLoad) * 100}%` }}
                transition={{ type: "spring", stiffness: 200, damping: 25 }}
              />
            </div>
            <span className="font-mono text-sm font-semibold text-zinc-200">{load}</span>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-1.5">
        <AnimatePresence initial={false}>
          {step.writesSoFar.slice(-12).map((w) => (
            <motion.span
              key={w.id}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`rounded-full border px-2 py-0.5 font-mono text-[10.5px] ${
                w.isHotKey
                  ? "border-fuchsia-500/50 bg-fuchsia-500/10 text-fuchsia-300"
                  : "border-zinc-700 bg-zinc-900 text-zinc-400"
              }`}
              title={`${w.key} → shard ${w.shardIndex}`}
            >
              {w.key} → s{w.shardIndex}
            </motion.span>
          ))}
        </AnimatePresence>
      </div>

      <div className="flex gap-4 text-xs text-zinc-400">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-fuchsia-400" /> the hot key
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-zinc-500" /> normal keys
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-red-500" /> overloaded shard
        </span>
      </div>

      <Controls controller={controller} />
    </div>
  );
}

export function ShardingAnimation() {
  const [phase, setPhase] = useState<Phase>("naive");

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        <button
          onClick={() => setPhase("naive")}
          className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
            phase === "naive"
              ? "bg-lime-600 text-white"
              : "border border-zinc-300 text-zinc-600 dark:border-zinc-700 dark:text-zinc-400"
          }`}
        >
          Naive hashing — creates a hotspot
        </button>
        <button
          onClick={() => setPhase("salted")}
          className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
            phase === "salted"
              ? "bg-lime-600 text-white"
              : "border border-zinc-300 text-zinc-600 dark:border-zinc-700 dark:text-zinc-400"
          }`}
        >
          Salted key — spreads it back out
        </button>
      </div>
      {/* key remounts the demo (and its step controller) cleanly on phase switch */}
      <PhaseDemo key={phase} phase={phase} />
    </div>
  );
}
