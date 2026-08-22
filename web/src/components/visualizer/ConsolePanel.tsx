import { AnimatePresence, motion } from "motion/react";
import type { ConsoleLine } from "@/lib/trace/types";
import { PanelFrame, EmptyHint } from "./PanelFrame";

export function ConsolePanel({ lines }: { lines: ConsoleLine[] }) {
  return (
    <PanelFrame title="Console Output">
      <div className="flex min-h-[3rem] flex-col gap-1 font-mono text-xs text-zinc-200">
        <AnimatePresence initial={false}>
          {lines.map((line) => (
            <motion.div
              key={line.id}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
            >
              <span className="text-zinc-600">{">"}</span> {line.text}
            </motion.div>
          ))}
        </AnimatePresence>
        {lines.length === 0 && <EmptyHint text="(no output yet)" />}
      </div>
    </PanelFrame>
  );
}
