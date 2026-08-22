import { AnimatePresence } from "motion/react";
import type { Actor, ChannelMessage } from "@/lib/trace/multiActorTypes";
import { QueueItemChip } from "./QueueItemChip";
import { PanelFrame, EmptyHint } from "./PanelFrame";

export function MessageChannelPanel({
  messages,
  actors,
}: {
  messages: ChannelMessage[];
  actors: Actor[];
}) {
  const labelFor = (id: string) => actors.find((a) => a.id === id)?.label ?? id;

  return (
    <PanelFrame
      title="Message Channel"
      hint="in transit"
      accentClassName="text-amber-300"
    >
      <div className="flex min-h-[2.5rem] flex-wrap gap-1.5">
        <AnimatePresence initial={false}>
          {messages.map((message) => (
            <QueueItemChip
              key={message.id}
              id={message.id}
              label={`${labelFor(message.from)} → ${labelFor(message.to)}: ${message.label}`}
              className="rounded-md border border-amber-700/40 bg-amber-950/40 px-2.5 py-1.5 text-xs font-mono text-amber-200 shadow-sm"
            />
          ))}
        </AnimatePresence>
        {messages.length === 0 && <EmptyHint text="empty" />}
      </div>
    </PanelFrame>
  );
}
