import { AnimatePresence } from "motion/react";
import type { WebApiItem, WebApiLane } from "@/lib/trace/types";
import { QueueItemChip } from "./QueueItemChip";
import { PanelFrame, EmptyHint } from "./PanelFrame";

const LANES: { key: WebApiLane; label: string; className: string }[] = [
  {
    key: "timer-list",
    label: "Timers",
    className:
      "border-amber-700/40 bg-amber-950/40 text-amber-200",
  },
  {
    key: "libuv-threadpool",
    label: "libuv Thread Pool (4 workers)",
    className:
      "border-orange-700/40 bg-orange-950/40 text-orange-200",
  },
  {
    key: "os-async-io",
    label: "OS Async I/O (epoll / kqueue / IOCP)",
    className:
      "border-teal-700/40 bg-teal-950/40 text-teal-200",
  },
];

export function WebApisPanel({ items }: { items: WebApiItem[] }) {
  return (
    <PanelFrame
      title="Web APIs / Node APIs"
      hint="offloaded work"
      accentClassName="text-amber-300"
    >
      <div className="flex flex-col gap-2">
        {LANES.map((lane) => {
          const laneItems = items.filter((item) => item.lane === lane.key);
          return (
            <div key={lane.key}>
              <p className="mb-1 text-[10px] uppercase tracking-wide text-zinc-500">
                {lane.label}
              </p>
              <div className="flex min-h-[2rem] flex-wrap gap-1.5">
                <AnimatePresence initial={false}>
                  {laneItems.map((item) => (
                    <QueueItemChip
                      key={item.id}
                      id={item.id}
                      label={item.label}
                      className={`rounded-md border px-2.5 py-1 text-xs font-mono shadow-sm ${lane.className}`}
                    />
                  ))}
                </AnimatePresence>
                {laneItems.length === 0 && <EmptyHint text="—" />}
              </div>
            </div>
          );
        })}
      </div>
    </PanelFrame>
  );
}
