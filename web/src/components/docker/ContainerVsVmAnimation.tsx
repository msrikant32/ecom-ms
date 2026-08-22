"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";

const INSTANCE_COUNT = 3;
const CONTAINER_STAGGER_MS = 150; // near-instant — just starting a process
const VM_BOOT_MS = 2600; // slow — booting an entire separate OS
const VM_STAGGER_MS = 300;

type Status = "idle" | "running" | "done";

export function ContainerVsVmAnimation() {
  const [status, setStatus] = useState<Status>("idle");
  const [runId, setRunId] = useState(0);

  function launch() {
    setStatus("running");
    setRunId((n) => n + 1);
    const totalMs = VM_STAGGER_MS * (INSTANCE_COUNT - 1) + VM_BOOT_MS + 200;
    window.setTimeout(() => setStatus("done"), totalMs);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <button
          onClick={launch}
          disabled={status === "running"}
          className="rounded-full bg-purple-600 px-4 py-1.5 text-sm font-medium text-white transition-colors disabled:opacity-50"
        >
          {status === "running" ? "Launching…" : `Launch ${INSTANCE_COUNT} instances on both`}
        </button>
        <span className="text-xs text-zinc-500 dark:text-zinc-500">
          Same request, same instance count — watch the actual time gap.
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Containers */}
        <div className="flex flex-col gap-2 rounded-xl border border-zinc-800 bg-zinc-950 p-4">
          <h3 className="text-sm font-semibold text-zinc-200">Containers</h3>
          <div className="flex min-h-[4.5rem] items-end gap-2">
            <AnimatePresence mode="wait">
              {status !== "idle" &&
                Array.from({ length: INSTANCE_COUNT }, (_, i) => (
                  <motion.div
                    key={`${runId}-container-${i}`}
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: (i * CONTAINER_STAGGER_MS) / 1000, type: "spring", stiffness: 300, damping: 20 }}
                    className="flex h-14 flex-1 items-center justify-center rounded-md border border-emerald-500/40 bg-emerald-500/10 font-mono text-[10.5px] text-emerald-300"
                  >
                    app {i + 1}
                  </motion.div>
                ))}
            </AnimatePresence>
          </div>
          <div className="rounded-md border border-zinc-700 bg-zinc-900 py-2 text-center font-mono text-[10.5px] text-zinc-400">
            Host OS Kernel (shared by all)
          </div>
          {status === "done" && (
            <p className="font-mono text-[10.5px] text-emerald-400">
              ~{((CONTAINER_STAGGER_MS * (INSTANCE_COUNT - 1) + 100) / 1000).toFixed(2)}s total
            </p>
          )}
        </div>

        {/* VMs */}
        <div className="flex flex-col gap-2 rounded-xl border border-zinc-800 bg-zinc-950 p-4">
          <h3 className="text-sm font-semibold text-zinc-200">Virtual Machines</h3>
          <div className="flex min-h-[4.5rem] items-end gap-2">
            {status !== "idle" &&
              Array.from({ length: INSTANCE_COUNT }, (_, i) => (
                <div
                  key={`${runId}-vm-${i}`}
                  className="flex h-14 flex-1 flex-col justify-end gap-1 rounded-md border border-amber-500/40 bg-amber-500/5 p-1.5"
                >
                  <span className="font-mono text-[9px] text-amber-300">guest OS {i + 1}</span>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
                    <motion.div
                      className="h-full rounded-full bg-amber-500"
                      initial={{ width: "0%" }}
                      animate={{ width: "100%" }}
                      transition={{ delay: (i * VM_STAGGER_MS) / 1000, duration: VM_BOOT_MS / 1000, ease: "easeInOut" }}
                    />
                  </div>
                </div>
              ))}
          </div>
          <div className="rounded-md border border-zinc-700 bg-zinc-900 py-2 text-center font-mono text-[10.5px] text-zinc-400">
            Hypervisor + Host OS
          </div>
          {status === "done" && (
            <p className="font-mono text-[10.5px] text-amber-400">
              ~{((VM_STAGGER_MS * (INSTANCE_COUNT - 1) + VM_BOOT_MS) / 1000).toFixed(2)}s total — each VM boots its own kernel
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
