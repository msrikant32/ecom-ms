import { AnimatePresence } from "motion/react";
import type { Actor, ActorState } from "@/lib/trace/multiActorTypes";
import { QueueItemChip } from "./QueueItemChip";
import { PanelFrame, EmptyHint } from "./PanelFrame";

const KIND_BADGE: Record<Actor["kind"], string> = {
  process: "Process",
  thread: "Thread",
};

const STATUS_LABEL: Record<ActorState["status"], string> = {
  "not-started": "not started",
  running: "running",
  terminated: "terminated",
};

export function ActorLane({
  actor,
  state,
}: {
  actor: Actor;
  state: ActorState;
}) {
  const isNotStarted = state.status === "not-started";

  return (
    <PanelFrame
      title={`${actor.label} · ${KIND_BADGE[actor.kind]}`}
      hint={STATUS_LABEL[state.status]}
      accentClassName={
        actor.kind === "process" ? "text-sky-300" : "text-violet-300"
      }
    >
      <div
        className={`flex min-h-[5rem] flex-col-reverse gap-1.5 ${
          isNotStarted ? "opacity-40" : ""
        }`}
      >
        <AnimatePresence initial={false}>
          {state.callStack.map((frame) => (
            <QueueItemChip
              key={frame.id}
              id={frame.id}
              label={frame.label}
              className={`rounded-md border px-2.5 py-1.5 text-xs font-mono shadow-sm ${
                actor.kind === "process"
                  ? "border-sky-700/40 bg-sky-950/40 text-sky-200"
                  : "border-violet-700/40 bg-violet-950/40 text-violet-200"
              }`}
            />
          ))}
        </AnimatePresence>
        {state.callStack.length === 0 && (
          <EmptyHint text={isNotStarted ? "not spawned yet" : "idle"} />
        )}
      </div>
    </PanelFrame>
  );
}
