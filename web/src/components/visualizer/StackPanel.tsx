import { AnimatePresence } from "motion/react";
import type { StackFrame } from "@/lib/trace/types";
import { QueueItemChip } from "./QueueItemChip";
import { PanelFrame, EmptyHint } from "./PanelFrame";

/**
 * `frames` is ordered oldest-first (index 0 = bottom of the stack); we
 * render it reversed so the most recently pushed frame — the one actually
 * executing — appears visually on top.
 */
export function StackPanel({ frames }: { frames: StackFrame[] }) {
  return (
    <PanelFrame title="Call Stack" hint="LIFO" accentClassName="text-sky-300">
      <div className="flex min-h-[7rem] flex-col-reverse gap-1.5">
        <AnimatePresence initial={false}>
          {frames.map((frame) => (
            <QueueItemChip
              key={frame.id}
              id={frame.id}
              label={frame.label}
              className="rounded-md border border-sky-700/40 bg-sky-950/40 px-3 py-1.5 text-xs font-mono text-sky-200 shadow-sm"
            />
          ))}
        </AnimatePresence>
        {frames.length === 0 && <EmptyHint text="empty" />}
      </div>
    </PanelFrame>
  );
}
