"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  BAD_ORDER,
  GOOD_ORDER,
  simulateBuild,
  type ChangeScenario,
} from "@/lib/docker/layerCacheSim";

function LayerStack({ orderId, scenario }: { orderId: "bad" | "good"; scenario: ChangeScenario }) {
  const order = orderId === "bad" ? BAD_ORDER : GOOD_ORDER;
  const { layers, totalSeconds } = simulateBuild(order, scenario);

  return (
    <div className="flex flex-1 flex-col gap-3 rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-zinc-100">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-200">{order.label}</h3>
        <span
          className={`rounded-full px-2.5 py-0.5 font-mono text-xs font-medium ${
            totalSeconds < 5 ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"
          }`}
        >
          rebuild: {totalSeconds.toFixed(1)}s
        </span>
      </div>

      <div className="flex flex-col gap-1.5">
        <AnimatePresence initial={false} mode="popLayout">
          {layers.map((layer) => (
            <motion.div
              key={`${orderId}-${scenario}-${layer.id}`}
              layout
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              className={`flex items-center justify-between rounded-md border px-3 py-2 font-mono text-xs ${
                layer.cached
                  ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-300"
                  : "border-red-500/30 bg-red-500/10 text-red-300"
              }`}
            >
              <span className="truncate">{layer.instruction}</span>
              <span className="ml-3 shrink-0 whitespace-nowrap text-[10.5px] uppercase tracking-wide">
                {layer.cached ? "cached ⚡" : `rebuild · ${layer.costSeconds}s`}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

export function DockerfileLayerSimulator() {
  const [scenario, setScenario] = useState<ChangeScenario>("source");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setScenario("source")}
          className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
            scenario === "source"
              ? "bg-purple-600 text-white"
              : "border border-zinc-300 text-zinc-600 dark:border-zinc-700 dark:text-zinc-400"
          }`}
        >
          I changed a source file (server.js)
        </button>
        <button
          onClick={() => setScenario("deps")}
          className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
            scenario === "deps"
              ? "bg-purple-600 text-white"
              : "border border-zinc-300 text-zinc-600 dark:border-zinc-700 dark:text-zinc-400"
          }`}
        >
          I added a dependency (package.json)
        </button>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <LayerStack orderId="bad" scenario={scenario} />
        <LayerStack orderId="good" scenario={scenario} />
      </div>

      <p className="text-xs text-zinc-500 dark:text-zinc-500">
        {scenario === "source"
          ? "A source-only change never touches package.json — good ordering means npm ci stays cached and the rebuild is ~22x faster."
          : "A real dependency change legitimately invalidates the install step in BOTH orders — good ordering avoids wasted rebuilds, it doesn't skip necessary ones."}
      </p>
    </div>
  );
}
