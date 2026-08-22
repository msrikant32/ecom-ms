import { AnimatePresence } from "motion/react";
import type { QueueItem } from "@/lib/trace/types";
import { QueueItemChip } from "./QueueItemChip";
import { PanelFrame, EmptyHint } from "./PanelFrame";

export function MicrotaskQueuePanel({ items }: { items: QueueItem[] }) {
  return (
    <PanelFrame
      title="Microtask Queue"
      hint="drains fully before next macrotask"
      accentClassName="text-fuchsia-300"
    >
      <div className="flex min-h-[2.5rem] flex-wrap gap-1.5">
        <AnimatePresence initial={false}>
          {items.map((item) => (
            <QueueItemChip
              key={item.id}
              id={item.id}
              label={item.label}
              className="rounded-md border border-fuchsia-700/40 bg-fuchsia-950/40 px-2.5 py-1.5 text-xs font-mono text-fuchsia-200 shadow-sm"
            />
          ))}
        </AnimatePresence>
        {items.length === 0 && <EmptyHint text="empty" />}
      </div>
    </PanelFrame>
  );
}
